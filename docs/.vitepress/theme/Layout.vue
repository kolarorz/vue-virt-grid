<template>
  <DefaultLayout v-if="!isPlayGround" :class="pageClass"></DefaultLayout>
  <ClientOnly v-if="isPlayGround">
    <Suspense>
      <Playground></Playground>
    </Suspense>
  </ClientOnly>
</template>
<script lang="ts" setup>
import { useRoute } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { computed } from 'vue';
import Playground from './Playground.vue';

const { Layout: DefaultLayout } = DefaultTheme;
const route = useRoute();
const isPlayGround = computed(() => route.data.filePath.startsWith('playground'));

const pageClass = computed(() => {
  console.log('route.data.filePath.startsWith()', route.data.filePath.startsWith('api'));
  // 为了解决 .v-doc 对 table 的样式覆盖问题
  if (route.data.filePath.startsWith('examples')) return 'page-examples';
  if (route.data.filePath.startsWith('api')) return 'page-api';
  return '';
});
</script>
<style lang="scss" scoped>
:deep(.VPDoc.has-aside .content-container) {
  max-width: unset;
}
@media (min-width: 1440px) {
  :deep(.VPNavBar.has-sidebar .content) {
    padding-right: 30px;
    :deep(.VPContent.has-sidebar) {
      padding-right: 30px;
    }
  }
}
</style>
