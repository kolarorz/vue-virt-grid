<template>
  <tr ref="itemRefEl" class="vtg-tr">
    <td class="vtg-td vtg-td--expand" :colspan="flattedColumns.length">
      <div class="vtg-cell">
        <component :is="getRenderRow(row)"></component>
      </div>
    </td>
  </tr>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { useGridStore } from '@/src/store';
import { useObserverItem } from 'vue-virt-list';
import { type ListItem } from '@/src/type';

const gridStore = useGridStore();
const { flattedColumns } = gridStore.columnModule;

const expandCol = computed(() => flattedColumns.find((c) => c.type === 'expand'));

const props = withDefaults(
  defineProps<{
    resizeObserver: ResizeObserver | null;
    rowIndex: number;
    row: ListItem;
  }>(),
  {
    resizeObserver: null,
  },
);

const { itemRefEl } = useObserverItem({ resizeObserver: props.resizeObserver as ResizeObserver });
const getRenderRow = (row: ListItem) => {
  return expandCol.value?.expandRender?.(expandCol.value, row);
};
</script>
