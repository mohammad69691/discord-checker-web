<script setup>
const fileUpload = ref(null);
const tokensInput = ref('');
const duplicate = ref(0);
const invalid = ref([]);
const accounts = ref([]);
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
  accounts.value = [];
  invalid.value = [];

  isChecking.value = true;

  const rawValue = tokensInput.value.trim();
  const matchedTokens = rawValue.match(/mfa\.[\w-]{84}|[A-Z][\w-]{23}\.[\w-]{6}\.[\w-]{27}/g);

  if (!matchedTokens) {
    return;
  }

  const noDuplicates = [...new Set(matchedTokens)];
  duplicate.value = matchedTokens.length - noDuplicates.length;

  for (const token of noDuplicates) {
    const user = await apiRequest('/users/@me', { token, delay: +delay.value });
    if (user) {
      if (accounts.value.find((account) => account.user.id === user.id)) {
        continue;
      }

      accounts.value.push({ token, user });
      continue;
    }

    // Parse user id from token
    const base64Id = token.split('.')[0];
    invalid.value.push({
      token,
      userId: base64Id === 'mfa' ? 'Unknown' : atob(base64Id),
    });
  }

  isChecking.value = false;
}

function removeAccount(id) {
  accounts.value = accounts.value.filter((account) => account.user.id !== id);
}

function downloadTokens() {
  const link = document.createElement('a');
  link.setAttribute(
    'href',
    `data:text/plain;charset=utf-8,${encodeURIComponent(accounts.value.map((account) => account.token).join('\n'))}`
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
      class="p-2 mt-4 w-full h-96 font-mono dark:text-gray-200 bg-gray-200 dark:bg-gray-800 rounded border-2 border-violet-400 focus:border-violet-500 outline-none disabled:opacity-50 resize-none"
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
      <div class="flex justify-between w-full text-sm text-gray-700 dark:text-gray-400 md:w-6/12">
        <span>0 ms</span>
        <span>{{ delay }}</span>
        <span>30000 ms</span>
      </div>
    </div>

    <div class="flex space-x-2">
      <input ref="fileUpload" class="hidden" type="file" accept=".txt" hidden multiple @change="loadFile" />
      <button
        :disabled="isChecking"
        class="flex items-center p-2 mt-2 font-semibold text-gray-800 bg-yellow-500 hover:bg-yellow-600 rounded disabled:opacity-50 transition"
        @click="() => fileUpload.click()"
      >
        <i class="mr-2 i-carbon-upload" />
        Load File(s)
      </button>

      <button
        :disabled="isChecking"
        class="flex items-center p-2 mt-2 font-semibold text-gray-50 bg-violet-500 hover:bg-violet-600 rounded disabled:opacity-50 transition"
        @click="checkTokens"
      >
        <i class="mr-2 i-carbon-restart" />
        Check Tokens
      </button>
    </div>

    <div v-if="accounts.length > 0" class="my-10 dark:text-white">
      <h2 class="text-2xl font-semibold tracking-wide text-center">Valid Accounts ({{ accounts.length }})</h2>
      <hr />

      <button
        :disabled="isChecking"
        class="flex items-center p-2 mt-2 mb-4 font-semibold text-gray-50 bg-green-500 hover:bg-green-600 rounded disabled:opacity-50 transition"
        @click="downloadTokens()"
      >
        <i class="mr-2 i-carbon-download" />
        Download Tokens
      </button>
      <div class="grid grid-cols-1 grid-flow-row gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div
          v-for="account of accounts"
          :key="account.user.id"
          class="p-5 bg-gray-200 dark:bg-gray-800 rounded-lg drop-shadow-lg dark:drop-shadow-none transition ease-in-out hover:-translate-y-1 hover:scale-102"
        >
          <div class="flex justify-between">
            <div class="flex items-center space-x-4">
              <AccountAvatar size="64" :user="account.user" class="drop-shadow-md" />

              <div>
                <div class="flex items-center font-semibold">
                  <span>{{ account.user.username }}</span>
                  <span class="text-xs text-gray-600 dark:text-gray-400">#{{ account.user.discriminator }}</span>
                  <BadgeList :user="account.user" badge-size="18" class="ml-2" />
                </div>
                <small class="text-gray-700 dark:text-gray-400">{{ account.user.id }}</small>
              </div>
            </div>

            <button
              class="flex text-red-400 hover:text-red-500 i-carbon-close-filled"
              @click="removeAccount(account.user.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="invalid.length > 0" class="my-10 dark:text-white">
      <h2 class="text-2xl font-semibold tracking-wide text-center">Invalid Tokens ({{ invalid.length }})</h2>
      <hr />

      <div class="grid grid-cols-1 grid-flow-row gap-4 xl:grid-cols-2">
        <div
          v-for="invalidEntry of invalid"
          :key="invalidEntry.token"
          class="flex flex-col p-5 bg-gray-200 dark:bg-gray-800 rounded-lg drop-shadow-lg dark:drop-shadow-none transition ease-in-out hover:-translate-y-1 hover:scale-102"
        >
          <span class="break-all">{{ invalidEntry.token }}</span>
          <small class="text-gray-700 dark:text-gray-400">User ID: {{ invalidEntry.userId }}</small>
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
