<template>
  <div class="base-view">
    <div style="width: 100%; height: 600px; border: 2px solid var(--color-border)">
      <Grid
        :columns="columns"
        :list="list"
        :options="{
          selection: true,
          border: true,
        }"
      ></Grid>
    </div>
  </div>
</template>
<script setup lang="tsx">
import { Grid, type Column, type ListItem } from 'vue-virt-grid';
import CustomCell from './CustomCell.vue';

const generateColumns = (length = 10, prefix = 'field-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    field: `${prefix}${columnIndex}`,
    title: `Title ${columnIndex}`,
    width: 200,
    align: 'center',
    headerAlign: 'right',
    className: `className-${columnIndex}`,
  }));

const generateList = (columns: ReturnType<typeof generateColumns>, length = 200, prefix = 'row-') =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.field] = `Row ${rowIndex} - Field ${columnIndex}`;
        return rowData;
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
        custom: `自定义-${rowIndex}`,
      },
    );
  });

const generatedColumns = generateColumns(20);

const columns: Column[] = [
  {
    field: 'custom',
    className: 'className',
    width: 150,
    headerRender: (column: Column) => {
      return <div>{column.field}</div>;
    },
    // 方式1
    // cellRender: (column: Column, row: ListItem) => {
    //   console.log('cellRender', column, row);
    //   return <div>{row[column.field]}</div>;
    // },
    // 方式2
    cellRender: (column: Column, row: ListItem) => {
      // console.log('cellRender', column, row);
      return <CustomCell column={column} row={row}></CustomCell>;
    },
  },
  ...generatedColumns,
];
const list: ListItem[] = generateList(generatedColumns, 5000);
</script>
<style lang="scss">
.base-view {
  width: 100%;
  height: 100%;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
