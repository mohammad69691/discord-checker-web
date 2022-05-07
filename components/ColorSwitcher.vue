<template>
  <i
    class="hover:cursor-pointer dark:bg-gray-50 dark:hover:bg-gray-200"
    :class="isDarkMode ? 'i-carbon-moon' : 'i-carbon-sun'"
    @click="$colorMode.preference = isDarkMode ? 'light' : 'dark'"
  />
</template>

<script>
export default {
  name: 'ColorSwitcher',
  computed: {
    isDarkMode() {
      return this.$colorMode.preference === 'dark';
    },
  },
};
</script>
