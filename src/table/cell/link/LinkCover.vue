<template>
  <div class="vtg-popper-cell vtg-cell__select-cover">
    <div class="vtg-cell__select-cover-content">
      <div class="tag-item">
        <span>哈哈哈</span>
        <span>x</span>
      </div>
      <div class="tag-item">
        <span>嘻嘻嘻</span>
        <span>x</span>
      </div>
      <div class="tag-item">
        <span>恩恩恩</span>
        <span>x</span>
      </div>
    </div>
    <!-- <div class="vtg-cell__select-cover-icon">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M14.5632 7.72544L10.539 13.2587C10.2728 13.6247 9.72696 13.6247 9.46073 13.2587L5.43658 7.72544C5.11611 7.28479 5.43088 6.66666 5.97573 6.66666L14.024 6.66666C14.5689 6.66666 14.8837 7.28479 14.5632 7.72544Z"
          fill="var(--virt-tree-color-icon)"
        ></path>
      </svg>
    </div> -->
  </div>
</template>
<script setup lang="tsx">
import { type PropType } from 'vue';
import { type Column, type ListItem, type TdData } from '@/src/type';

const props = defineProps({
  column: {
    type: Object as PropType<Column>,
    default: () => ({}),
  },
  row: {
    type: Object as PropType<ListItem>,
    default: () => ({}),
  },
  tdData: {
    type: Object as PropType<any>,
    default: () => ({}),
  },
});
</script>

<style lang="scss">
.vtg-cell__select-cover {
  width: 100%;
  height: 100%;
  background-color: #fff;
  position: relative;
  z-index: 99;
  user-select: none;
  display: flex;

  .vtg-cell__select-cover-content {
    height: 100%;
    flex: 1;
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 4px;

    .tag-item {
      padding: 0 4px;
      background-color: red;
      white-space: nowrap;
      margin-bottom: 4px;
      border-radius: 4px;
    }
  }

  .vtg-cell__select-icon {
    width: 16px;
    height: 16px;
    svg {
      width: 100%;
      height: 100%;
      fill: red;
    }
  }
}
</style>
