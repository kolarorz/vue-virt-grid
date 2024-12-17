<template>
  <div
    class="vtg-cell vtg-cell__select-view"
    :style="height ? `height: ${36}px;` : `height: auto;`"
  >
    <div class="vtg-cell__select-view-content">
      <div
        class="tag-item"
        v-for="item in cellValue"
        :key="item.key"
        :style="`background-color: ${item.bg};`"
      >
        <div>{{ item.value }}</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="tsx">
import { computed, type PropType } from 'vue';
import { type Column, type ListItem, type TdData } from '@/src/type';
import { isObject } from 'lodash-es';

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
  height: {
    type: Number,
  },
});

const cellValue = computed(() => {
  const cellData: string | { value: string } = props.row[props.column.field];
  const cellDataValue = isObject(cellData) ? cellData.value : cellData;
  return cellDataValue?.split(',').map((key: string) => {
    return props.column.options?.find((option) => option.key === key);
  });
});
</script>

<style lang="scss">
.vtg-cell__select-view {
  padding: 0 8px;
  width: 100%;
  background-color: #fff;
  position: relative;
  z-index: 99;
  user-select: none;
  display: flex;
  align-items: center;

  .vtg-cell__select-view-content {
    height: 100%;
    flex: 1;
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 4px;

    .tag-item {
      padding: 0 4px;
      white-space: nowrap;
      margin-bottom: 4px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      gap: 4px;

      .tag-close {
        width: 14px;
        height: 14px;
        cursor: pointer;

        svg {
          width: 100%;
          height: 100%;
        }
      }
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
