<template>
  <Grid :columns="columns" :list="list" :options="options">
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
  type TableOptions,
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
  // 默认排序配置
  defaultSort?: {
    field: string;
    order: 'ascend' | 'descend';
    sorter?: (
      a: ListItem,
      b: ListItem,
      extra: { field: string; direction: 'ascend' | 'descend' },
    ) => number;
  };

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
const options = computed<TableOptions>(() => {
  const instanceAttrs = instance?.attrs || {};
  return {
    ...instanceAttrs,
    rowKey: props.rowKey,
    minRowHeight: props.minRowHeight,
    defaultExpandAll: props.defaultExpandAll,
    merges: props.merges,
    selection: props.selection,
    groupConfig: props.groupConfig,
    defaultSort: props.defaultSort,
    border: props.border,
    stripe: props.stripe,
    showTreeLine: props.showTreeLine,
  } as TableOptions;
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
  
  let children: VNode[] = [];
  if (slots.default) {
    try {
      const createSafeMockRow = (): ListItem => {
        const baseMock: any = {
          id: '',
          name: '',
          [field]: '',
        };
        
        const createProxy = (obj: any): any => {
          return new Proxy(obj, {
            get(target, prop) {
              if (prop in target) {
                const value = target[prop];
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                  return createProxy(value);
                }
                return value;
              }
              return '';
            },
          });
        };
        
        return createProxy(baseMock) as ListItem;
      };
      
      const mockRow = createSafeMockRow();
      const mockColumn = columnConfig as Column;
      children = slots.default({
        row: mockRow,
        column: mockColumn,
      }) ?? [];
    } catch (error) {
      console.warn('Error while initializing column slot:', error);
      children = [];
    }
  }
  
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

  // 支持 cover slot 用于 cellCoverRender
  if (slots.cover) {
    columnConfig.cellCoverRender = (tdData: TdData) => {
      return slots.cover?.(tdData)?.[0];
    };
  }

  // 支持 dropdown slot 用于 cellDropdownRender
  if (slots.dropdown) {
    columnConfig.cellDropdownRender = (tdData: TdData) => {
      return slots.dropdown?.(tdData)?.[0];
    };
  }

  // 支持 sortIcon slot 用于自定义排序图标
  if (slots.sortIcon && columnConfig.sort) {
    if (!columnConfig.sort.sortIcon) {
      columnConfig.sort.sortIcon = (data: {
        direction: 'ascend' | 'descend';
        isActive: boolean;
        onClick: () => void;
      }) => {
        return slots.sortIcon?.(data)?.[0];
      };
    }
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