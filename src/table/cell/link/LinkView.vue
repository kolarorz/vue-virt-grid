<template>
  <div class="vtg-cell vtg-cell__select">
    <div class="vtg-cell__select-content">SelectView - {{ value }}</div>
  </div>
</template>
<script setup lang="tsx">
import { computed, type PropType } from 'vue';
import { type Column, type ListItem } from '@/src/type';
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
});

const value = computed(() => {
  const cellData: string | { value: string } = props.row[props.column.field];
  return isObject(cellData) ? cellData.value : cellData;
});
</script>

<style lang="scss">
.vtg-cell__select {
  display: flex;
  align-items: center;

  .vtg-cell__select-content {
    flex: 1;
  }
}
</style>
