<template>
  <div @keydown.esc="toggleModal">
    <button
      :disabled="isDisabled"
      class="p-2 mt-2 mb-4 font-semibold text-gray-50 bg-green-500 hover:bg-green-600 rounded disabled:opacity-50 transition"
      @click="toggleModal"
    >
      <FontAwesomeIcon icon="download" class="mr-2" />
      Download Tokens
    </button>

    <div
      class="flex fixed top-0 left-0 z-50 justify-center items-center w-full h-full transition"
      :class="{ 'opacity-0 pointer-events-none': !shown }"
    >
      <div class="absolute w-full h-full bg-gray-800 opacity-90"></div>

      <div class="overflow-y-auto z-50 mx-auto w-11/12 bg-gray-100 dark:bg-gray-900 rounded shadow-lg md:max-w-md">
        <div class="py-4 px-6 text-left">
          <div class="flex justify-between items-center pb-3">
            <div class="flex items-center space-x-3">
              <FontAwesomeIcon icon="download" size="lg" />
              <h5 class="text-2xl font-bold text-black dark:text-white">Download Tokens</h5>
            </div>

            <div class="flex z-50 items-center cursor-pointer" @click="toggleModal">
              <FontAwesomeIcon
                icon="circle-xmark"
                class="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500 hover:cursor-pointer"
              />
            </div>
          </div>
          <span class="block mb-3 text-gray-700 dark:text-gray-400"
            >Export your tokens in one of the supported formats (.txt or .csv)</span
          >

          <label class="font-semibold text-black dark:text-white">File Type:</label>
          <select
            v-model="exportType"
            class="p-2 mt-1.5 w-full text-black dark:text-white bg-gray-200 dark:bg-gray-800 rounded border-2 outline-none border-blurple focus:border-blurple-dark"
          >
            <option v-for="type in ['txt', 'csv']" :key="type" :value="type">.{{ type }} File</option>
          </select>

          <div class="mt-3">
            <label class="font-semibold text-white">Values:</label>
            <div class="grid grid-cols-1 gap-2 mt-2 md:grid-cols-2">
              <label
                v-for="value in Object.keys(values)"
                :key="`v-${value}`"
                class="flex items-center space-x-3 hover:cursor-pointer"
              >
                <input
                  v-model="values[value]"
                  type="checkbox"
                  class="w-5 h-5 rounded border border-gray-300 checked:border-transparent focus:outline-none appearance-none checked:bg-blurple"
                  checked
                />
                <span class="font-semibold text-black dark:text-white">{{ value.toUpperCase() }}</span>
              </label>
            </div>
          </div>

          <div class="flex justify-end mt-10 border-t border-gray-400 dark:border-gray-600">
            <button
              class="p-2 mt-3 font-semibold text-gray-50 bg-green-500 hover:bg-green-600 rounded disabled:opacity-50 transition"
              @click="downloadTokens"
            >
              <FontAwesomeIcon icon="download" class="mr-2" />
              Download Tokens
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  name: 'ExportModal',
  props: {
    accounts: {
      type: Array,
      required: true,
    },
    isDisabled: {
      type: Boolean,
      default: false,
    },
  },
  data: () => ({
    shown: false,
    exportType: 'txt',
    values: { username: true, discriminator: true, id: true, avatar: true, email: true, phone: true },
  }),
  methods: {
    toggleModal(): void {
      this.shown = !this.shown;
    },
    downloadTokens(): void {
      const link = document.createElement('a');
      link.setAttribute(
        'href',
        `data:text/${
          this.exportType === 'txt' ? 'plain' : this.exportType
        };charset=utf-8,${this.generateFileContents()}`
      );
      link.setAttribute(
        'download',
        `tokens-${new Date().toLocaleDateString('en-US').replaceAll('/', '_')}.${this.exportType}`
      );

      link.style.display = 'none';
      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);
    },
    generateFileContents(): string {
      let fileContent = '';
      const enabledValues = Object.keys(this.values).filter((value) => this.values[value] === true);
      if (this.exportType === 'txt') {
        for (const account of this.accounts) {
          if (enabledValues.length > 0) {
            fileContent += enabledValues.map((val) => `${val.toUpperCase()}: ${account.user[val] ?? '-'}`).join(' | ');
            fileContent += '\n';
          }

          fileContent += account.tokens.map((token) => `${token}\n`);
        }
      }

      if (this.exportType === 'csv') {
        if (enabledValues.length > 0) {
          fileContent += ''.concat(...enabledValues.map((value) => value.toUpperCase() + ','));
        }

        fileContent += 'TOKENS\n';

        for (const account of this.accounts) {
          if (enabledValues.length > 0) {
            fileContent += enabledValues.map((val) => account.user[val] ?? '-').join(',');
            fileContent += ',';
          }

          fileContent += `"${account.tokens.join(',')}"\n`;
        }
      }

      return encodeURIComponent(fileContent);
    },
  },
});
</script>
