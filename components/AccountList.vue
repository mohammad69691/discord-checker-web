<template>
  <div class="grid grid-cols-1 grid-flow-row gap-2 md:grid-cols-2 lg:grid-cols-3 lg:gap-4 xl:grid-cols-4">
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

        <FontAwesomeIcon
          icon="circle-xmark"
          class="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-500 hover:cursor-pointer"
          @click="removeAccount(account.user.id)"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
export default defineComponent({
  name: 'AccountList',
  props: {
    accounts: {
      type: Array,
      required: true,
    },
  },
  methods: {
    removeAccount(id): void {
      this.$emit('delete', id);
    },
  },
});
</script>
