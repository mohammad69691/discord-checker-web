<template>
  <FontAwesomeIcon
    class="dark:text-gray-50 dark:hover:text-gray-200 hover:cursor-pointer"
    :icon="isDarkMode ? 'moon' : 'sun'"
    size="lg"
    @click="$colorMode.preference = isDarkMode ? 'light' : 'dark'"
  >
  </FontAwesomeIcon>
</template>

<script lang="ts">
export default defineComponent({
  name: 'ColorSwitcher',
  computed: {
    isDarkMode(): boolean {
      return this.$colorMode.preference === 'dark';
    },
  },
});
</script>
