<template>
  <i
    class="dark:bg-gray-50 dark:hover:bg-gray-200 hover:cursor-pointer"
    :class="isDarkMode ? 'i-carbon-moon' : 'i-carbon-sun'"
    @click="$colorMode.preference = isDarkMode ? 'light' : 'dark'"
  />
</template>

<script lang="ts">
export default defineComponent({
  name: 'ColorSwitcher',
  computed: {
    isDarkMode() {
      return this.$colorMode.preference === 'dark';
    },
  },
});
</script>
