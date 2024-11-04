<template>
  <div class="vtg-popper-cell vtg-cell__select-cover">
    <div class="vtg-cell__select-cover-content">
      <div
        class="tag-item"
        v-for="item in cellValue"
        :key="item.key"
        :style="`background-color: ${item.bg};`"
      >
        <div>{{ item.value }}</div>
        <div class="tag-close" @click.stop="handleClose(item.key)">
          <svg
            t="1730451935431"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="4267"
            width="256"
            height="256"
          >
            <path
              d="M597.795527 511.488347 813.564755 295.718095c23.833825-23.833825 23.833825-62.47489 0.001023-86.307691-23.832801-23.832801-62.47489-23.833825-86.307691 0L511.487835 425.180656 295.717583 209.410404c-23.833825-23.833825-62.475913-23.833825-86.307691 0-23.832801 23.832801-23.833825 62.47489 0 86.308715l215.769228 215.769228L209.410915 727.258599c-23.833825 23.833825-23.833825 62.47489 0 86.307691 23.832801 23.833825 62.473867 23.833825 86.307691 0l215.768205-215.768205 215.769228 215.769228c23.834848 23.833825 62.475913 23.832801 86.308715 0 23.833825-23.833825 23.833825-62.47489 0-86.307691L597.795527 511.488347z"
              fill="#272636"
              p-id="4268"
            ></path>
          </svg>
        </div>
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
});

const cellDataValue = computed(() => {
  const cellData: string | { value: string } = props.row[props.column.field];
  const cellDataValue = isObject(cellData) ? cellData.value : cellData;
  return cellDataValue ? cellDataValue.split(',') : [];
});

const cellValue = computed(() => {
  return cellDataValue.value.map((key: string) => {
    return props.column.options?.find((option) => option.key === key);
  });
});

function handleClose(key: string) {
  console.log(key);
}
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
