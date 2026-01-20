<template>
  {{ field }}
</template>
<script lang="ts" setup>
import type { VNode } from 'vue';
import type { Column, ListItem, TdData } from '@/src/type';

defineProps<Column>();

defineSlots<{
  header?: (data: { column: Column }) => VNode[];
  default?: (data: { row: ListItem; column: Column }) => VNode[];
  cover?: (data: TdData) => VNode[];
  dropdown?: (data: TdData) => VNode[];
  sortIcon?: (data: {
    direction: 'ascend' | 'descend';
    isActive: boolean;
    onClick: () => void;
  }) => VNode[];
}>();
</script>
<script lang="ts">
export default {
  name: 'GridTableColumn',
};
</script>
<style lang="scss" scoped></style>
