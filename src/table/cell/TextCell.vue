<template>
  <div class="vtg-cell vtg-cell__text" :title="textOverflow === 'title' ? row[column.field] : ''">
    <span>{{ row?.[column?.field] || '' }}</span>
  </div>
</template>
<script setup lang="ts">
// 所有text文本均使用p包裹，因为vtg-cell为display: flex;的元素，无法设置文本溢出隐藏
import type { ListItem, ColumnItem } from '@/src/type';
import { useGridStore } from '@/src/store';

defineProps<{
  rowIndex: number;
  row: ListItem;
  column: ColumnItem;
}>();
const gridStore = useGridStore();
const textOverflow = gridStore.getState('textOverflow');
</script>
