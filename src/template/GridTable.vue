<template>
  <Grid :columns="columns" v-bind="attrs">
    <template #empty>
      <slot name="empty"></slot>
    </template>
  </Grid>
</template>
<script lang="ts" setup>
import { computed, Fragment, render, type Component, type VNode, getCurrentInstance } from 'vue';
import Grid from '@/src/table/VeriTable.vue';
import {
  type CellEmits,
  type Column,
  type HeaderEmits,
  type ListItem,
  type MergeCell,
  type RowEmits,
  type TableEmits,
  type TdData,
} from '@/src/type';

const props = defineProps<{
  list: ListItem[];
  rowKey?: string | number;
  minRowHeight?: number;
  // 树形 or 分组
  defaultExpandAll?: boolean;
  merges?: MergeCell[];
  selection?: boolean;
  groupConfig?: { columnId: string; sort: 'desc' | 'asc' }[];

  border: boolean;
  stripe: boolean;
  showTreeLine: boolean;
}>();
const slots = defineSlots<{
  empty?: () => VNode;
  default?: () => VNode[];
}>();

defineEmits<CellEmits & RowEmits & HeaderEmits & TableEmits>();

const instance = getCurrentInstance();
const attrs = computed(() => {
  return {
    ...props,
    ...instance?.attrs,
  };
});

function setupNode(node: VNode) {
  let dom = document.createElement('div');
  render(node, dom);
}

function isGridTableColumnNode(node: VNode) {
  return (node.type as Component).name === 'GridTableColumn';
}

function initColumn(columnNode: VNode) {
  const field = columnNode.props!.field as string;
  const baseProps = columnNode.props as Column;
  (Object.keys(baseProps) as (keyof Column)[]).forEach((key) => {
    // TODO 这里为啥要赋值 boolean
    if (baseProps[key] === '') (baseProps[key] as unknown as boolean) = true;
  });

  setupNode(columnNode);
  if (!isGridTableColumnNode(columnNode)) {
    throw new Error('please use GridTableColumn');
  }

  const slots = columnNode.component?.slots ?? ({} as Record<string, Function | undefined>);
  const columnConfig: Column = {
    ...baseProps,
    field,
    headerRender: slots.header
      ? (column: Column) => {
          return slots.header?.({ column })?.[0];
        }
      : undefined,
  };
  const children =
    slots.default?.({
      row: {},
      column: {},
    }) ?? ([] as VNode[]);
  children.forEach((node: VNode) => {
    if (isGridTableColumnNode(node)) {
      if (!columnConfig.children) columnConfig.children = [];
      columnConfig.children!.push(initColumn(node));
    }
  });

  const hasBodyRender = !columnConfig.children && !!slots.default;
  if (hasBodyRender) {
    columnConfig.cellRender = (tdData: TdData) => {
      return slots.default?.(tdData)?.[0];
    };
  }

  return columnConfig;
}

const getColumns = (): Column[] => {
  let defaultNodes = (slots.default?.() as VNode[]) ?? [];
  const columnNodes: VNode[] = [];
  defaultNodes.forEach((node) => {
    if (isGridTableColumnNode(node)) columnNodes.push(node);
    if (node.type === Fragment)
      columnNodes.push(...(node.children as VNode[]).filter(isGridTableColumnNode));
  });
  return columnNodes
    .filter((node) => isGridTableColumnNode(node))
    .map((node) => {
      return initColumn(node);
    });
};
const columns = computed(getColumns);
</script>
<style lang="scss" scoped></style>
