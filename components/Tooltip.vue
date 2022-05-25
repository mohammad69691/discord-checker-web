<template>
  <div class="hover:cursor-pointer has-tooltip">
    <span
      class="p-1.5 -mt-9 font-semibold text-black dark:text-white bg-white dark:bg-black rounded-lg shadow-lg tooltip"
      >{{ title }}</span
    >
    <slot />
  </div>
</template>

<script lang="ts">
export default defineComponent({
  name: 'Tooltip',
  props: {
    title: {
      type: String,
      required: true,
    },
  },
});
</script>

<style>
.tooltip {
  @apply invisible absolute;
  transition: 150ms;
}

.has-tooltip:hover .tooltip {
  @apply visible z-50;
}
</style>
