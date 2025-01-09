<template>
  <div class="base-view">
    <!-- <div>Column.length - {{ columns.length }}; List.length - {{ list.length }}</div> -->
    <!-- <div>Render- {{ $refs.grid.gridStore.watchData }}</div> -->
    <div style="width: 100%; height: 600px; border: 2px solid var(--color-border)">
      <Grid
        ref="grid"
        :columns="columns"
        :list="list"
        :options="{
          border: true,

          align: 'right',
          verticalAlign: 'middle',
          headerAlign: 'right',
          headerVerticalAlign: 'bottom',
        }"
      ></Grid>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Grid, type Column, type ListItem } from 'vue-virt-grid';

const generateColumns = (length = 10, prefix = 'field-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    field: `${prefix}${columnIndex}`,
    title: `Title ${columnIndex}`,
    width: 200,
  }));

const generateList = (columns: ReturnType<typeof generateColumns>, length = 200, prefix = 'row-') =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.field] = `Row ${rowIndex} - Field ${columnIndex}`;
        return rowData;
      },
      {
        parentId: null,
      },
    );
  });

const columns: Column[] = [
  { type: 'index', width: 50, title: '#', fixed: 'left' },
  ...generateColumns(20),
];
const list: ListItem[] = generateList(columns, 5000);

columns[1].title = '我是一个超超超超超超超超超长的标题内容';
list[0]['field-0'] =
  'vue-virt-grid是一个基于vue-virt-list的vue3的表格组件，支持合并单元格，虚拟滚动，固定列，固定行，树形表格等';
list[0]['field-1'] = 'vue-virt-grid是一个基于vue-virt-list的vue3的表格组件';
</script>
<style lang="scss">
.base-view {
  width: 100%;
  height: 100%;
  overflow: hidden;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
