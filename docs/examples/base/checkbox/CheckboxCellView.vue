<template>
  <div class="base-view">
    <div style="width: 100%; height: 600px; border: 2px solid var(--color-border)">
      <Grid
        :columns="columns"
        :list="list"
        :options="{
          border: true,
        }"
      ></Grid>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Grid, type ListItem, type Column } from 'vue-virt-grid';

const generateColumns = (length = 10, prefix = 'field-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    field: `${prefix}${columnIndex}`,
    title: `Title ${columnIndex}`,
    width: 200,
  }));

const generateList = (columns: ReturnType<typeof generateColumns>, length = 20, prefix = 'row-') =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.field] = `Row ${rowIndex} - Field ${columnIndex}`;
        return rowData;
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      },
    );
  });

const columns: Column[] = [
  { type: 'checkbox', width: 200, fixed: 'left', field: 'checkbox', title: '复选框' },
  ...generateColumns(20),
];
const list: ListItem[] = generateList(columns, 5000);
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
