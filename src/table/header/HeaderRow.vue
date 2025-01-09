<template>
  <tr ref="itemRefEl" :class="cls.row()" :style="getRowStyle()">
    <!-- 左侧固定列 -->
    <template
      v-for="column in leftFixedHeaderColumns[headerRowIndex]"
      :key="`${column.field}-${gridStore.watchData.renderKey}-${column._id}`"
    >
      <th
        :data-id="column._id"
        :class="cls.leftFixed(column)"
        :style="`left: ${headerCellInfo[column._id].fixOffset}px; ${getCellStyle(column)}`"
        :rowspan="headerCellInfo[column._id]?.rowspan"
        :colspan="headerCellInfo[column._id]?.colspan"
      >
        <component :is="getRenderCell(column)" :column="column"></component>
      </th>
    </template>
    <!-- 左侧虚拟占位 -->
    <th :class="cls.leftPadding()" :colspan="leftCount" v-if="leftCount > 0"></th>
    <!-- 主体 -->
    <template v-for="column in centerColumnsInfo[headerRowIndex]" :key="column.field">
      <th
        :class="cls.main(column)"
        :style="`${getCellStyle(column)}`"
        :data-id="column._id"
        :rowspan="headerCellInfo[column._id]?.rowspan"
        :colspan="headerCellInfo[column._id]?.colspan"
      >
        <component :is="getRenderCell(column)" :column="column"></component>
      </th>
    </template>
    <!--  右侧虚拟占位 -->
    <!-- TODO 有点问题 -->
    <th :class="cls.rightPadding" :colspan="rightCount" v-if="rightCount > 0"></th>
    <!-- 右侧固定列 -->
    <template v-for="column in rightFixedHeaderColumns[headerRowIndex]" :key="column.field">
      <th
        :data-id="column._id"
        :class="cls.rightFixed(column)"
        :style="`text-align: ${column.headerAlign || column.align}; right: ${
          headerCellInfo[column._id].fixOffset
        }px; ${getCellStyle(column)}`"
        :rowspan="headerCellInfo[column._id]?.rowspan"
        :colspan="headerCellInfo[column._id]?.colspan"
      >
        <component :is="getRenderCell(column)" :column="column"></component>
      </th>
    </template>
  </tr>
</template>

<script setup lang="ts">
import { computed, ref, onUpdated } from 'vue';
import { useGridStore } from '@/src/store';
import { CellType, type ColumnItem } from '@/src/type';
import { useResizeColumn } from '@/src/hooks/useResizeColumn';
import HeaderIndexCell from './cell/HeaderIndexCell.vue';
// import HeaderOrderCell from './cell/HeaderOrderCell.vue';
import HeaderCheckboxCell from './cell/HeaderCheckboxCell.vue';
import HeaderTextCell from './cell/HeaderTextCell.vue';

const gridStore = useGridStore();

const { columnsInfo } = gridStore.columnModule;

const headerCellInfo = computed(() => columnsInfo.headerCellInfo);
const leftFixedHeaderColumns = computed(() => columnsInfo.leftFixedHeaderColumns);
const rightFixedHeaderColumns = computed(() => columnsInfo.rightFixedHeaderColumns);
const centerNormalHeaderColumns = computed(() => columnsInfo.centerNormalHeaderColumns);

const cls = {
  leftFixed: (column: ColumnItem) => [
    'vtg-th',
    `vtg-th--${column?.headerAlign ?? gridStore.getState('headerAlign') ?? 'left'}`,
    `vtg-th--${column?.headerVerticalAlign ?? gridStore.getState('headerVerticalAlign') ?? 'middle'}`,
    gridStore.getState('textOverflowHeader') ? 'vtg-th--text-ellipsis' : '',

    'is-fixed',
    'is-fixed--left',
    getCellClass(column),
    column.className,
  ],
  leftPadding: () => ['vtg-th'],
  main: (column: ColumnItem) => [
    'vtg-th',
    `vtg-th--${column?.headerAlign ?? gridStore.getState('headerAlign') ?? 'left'}`,
    `vtg-th--${column?.headerVerticalAlign ?? gridStore.getState('headerVerticalAlign') ?? 'middle'}`,
    gridStore.getState('textOverflowHeader') ? 'vtg-th--text-ellipsis' : '',
    getCellClass(column),
    column.className,
  ],
  rightPadding: () => ['vtg-th'],
  rightFixed: (column: ColumnItem) => [
    'vtg-th',
    `vtg-th--${column?.headerAlign ?? gridStore.getState('headerAlign') ?? 'left'}`,
    `vtg-th--${column?.headerVerticalAlign ?? gridStore.getState('headerVerticalAlign') ?? 'middle'}`,
    gridStore.getState('textOverflowHeader') ? 'vtg-th--text-ellipsis' : '',

    'is-fixed',
    'is-fixed--right',
    getCellClass(column),
    column.className,
  ],
  row: () => ['vtg-tr', getRowClass()],
};

const props = withDefaults(
  defineProps<{
    headerRowIndex: number;
    currentColumn: any;
    centerColumnsInfo: any;
  }>(),
  {},
);

const leftCount = computed(() => {
  const currentHeaderColumns = props.centerColumnsInfo[props.headerRowIndex];
  const currentHeaderFirstColumn = currentHeaderColumns?.[0];

  // console.log('currentHeaderFirstColumn -------------', currentHeaderFirstColumn);
  return headerCellInfo.value[currentHeaderFirstColumn?._id]?.leftColspan ?? 0;
});

const rightCount = computed(() => {
  const currentHeaderColumns = props.centerColumnsInfo[props.headerRowIndex];
  const currentHeaderLastColumn = currentHeaderColumns?.[currentHeaderColumns?.length - 1];
  const currentHeaderLastColumnLeftColspan =
    headerCellInfo.value[currentHeaderLastColumn?._id]?.leftColspan ?? 0;

  const currentCenterNormalHeaderColumns = centerNormalHeaderColumns.value[props.headerRowIndex];
  const currentHeaderNormalHeaderLastColumn =
    currentCenterNormalHeaderColumns?.[currentCenterNormalHeaderColumns?.length - 1];
  const currentHeaderNormalHeaderLastColumnLeftColspan =
    headerCellInfo.value[currentHeaderNormalHeaderLastColumn?._id]?.leftColspan ?? 0;

  // console.log(
  //   'currentHeaderLastColumn -------------',
  //   currentHeaderLastColumn,
  //   currentHeaderNormalHeaderLastColumn,
  // );
  return currentHeaderNormalHeaderLastColumnLeftColspan - currentHeaderLastColumnLeftColspan;
});

const fullRow = leftFixedHeaderColumns.value[props.headerRowIndex].concat(
  centerNormalHeaderColumns.value[props.headerRowIndex],
  rightFixedHeaderColumns.value[props.headerRowIndex],
);

const getRowClass = () => {
  const fn = gridStore.getState('headerRowClassName');
  if (fn) {
    return fn({
      row: fullRow,
      rowIndex: props.headerRowIndex,
    });
  }
};

const getRowStyle = () => {
  const fn = gridStore.getState('headerRowStyle');
  if (fn) {
    return fn({
      row: fullRow,
      rowIndex: props.headerRowIndex,
    });
  }
};

const getCellClass = (column: ColumnItem) => {
  const fn = gridStore.getState('headerCellClassName');
  if (fn) {
    return fn({
      row: props.currentColumn,
      rowIndex: props.headerRowIndex,
      column,
      columnIndex: column.colIndex!,
    });
  }
};

const getCellStyle = (column: ColumnItem) => {
  const fn = gridStore.getState('headerCellStyle');
  if (fn) {
    return fn({
      row: props.currentColumn,
      rowIndex: props.headerRowIndex,
      column,
      columnIndex: column.colIndex!,
    });
  }
};

const itemRefEl = ref<HTMLElement>();
onUpdated(() => {
  itemRefEl.value?.querySelectorAll(':scope>th[data-id]').forEach((item) => {
    const colId = item.getAttribute('data-id');
    if (!colId || !headerCellInfo.value[colId]?.resizable || !headerCellInfo.value[colId]?.isLeaf)
      return;
    useResizeColumn(
      item as HTMLElement,
      headerCellInfo.value[colId]!,
      gridStore.tableEl!,
      (width) => {
        if (colId) gridStore.columnModule.setColumnWidth(colId, width);
      },
    );
  });
});

function getRenderCell(column: ColumnItem) {
  // 如果是被合并的就不要显示任何单元格内容
  // if (headerRowIndex !== undefined && props.columns[headerRowIndex]?.isPlaceholder) {
  //   return HeaderTextCell;
  // }
  switch (column.type) {
    case CellType.Index:
      return HeaderIndexCell;
    case CellType.Checkbox:
      return HeaderCheckboxCell;
    case CellType.Radio:
      return HeaderTextCell;
    // case CellType.orderCheckbox:
    //   return HeaderOrderCell;
    default:
      if (column?.headerRender) return column?.headerRender?.(column);
      return HeaderTextCell;
  }
}
</script>
