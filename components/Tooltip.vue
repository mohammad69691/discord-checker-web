<template>
  <div class="has-tooltip">
    <span
      class="tooltip rounded-lg shadow-lg p-1.5 bg-white text-black dark:bg-black dark:text-white -mt-9 font-semibold"
      >{{ title }}</span
    >
    <slot />
  </div>
</template>

<script>
export default {
  name: 'Tooltip',
  props: {
    title: {
      type: String,
      required: true,
    },
  },
};
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
