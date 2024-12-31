<template>
  <div class="base-view">
    <div style="width: 100%; height: 600px; border: 2px solid var(--el-color-border)">
      <Grid
        :columns="columns"
        :list="list"
        :options="{
          border: true,
          showOverflow: 'ellipsis',
          minRowHeight: minRowHeight,
        }"
      ></Grid>
    </div>
  </div>
</template>
<script setup lang="tsx">
import { Grid, type Column, type ListItem } from 'vue-virt-grid';
import {
  SelectCover,
  SelectDropdown,
  SelectView,
  DateView,
  DateCover,
  DateDropdown,
  LinkView,
  PersonView,
  CellType,
  type TdData,
  // closeDropdown,
} from 'vue-virt-grid';
import {
  ElInput,
  ElButton,
  ElSelect,
  ElOption,
  ElDatePicker,
  ElTimePicker,
  ElCascader,
} from 'element-plus';
import { ref } from 'vue';
// const generateColumns = (length = 10, prefix = 'field-', props?: any) =>
//   Array.from({ length }).map((_, columnIndex) => ({
//     ...props,
//     field: `${prefix}${columnIndex}`,
//     title: `Title ${columnIndex}`,
//     width: 200,
//   }));
const minRowHeight = 32;

const generateList = (columns: Column[], length = 10000, prefix = 'row-') =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        if (column.field === 'select') {
          rowData[column.field] = 'key1';
        } else if (column.field === 'cascader') {
          rowData[column.field] = 'feedback';
        } else if (column.field === 'date') {
          rowData[column.field] = '2020-01-01';
        } else if (column.field === 'time') {
          rowData[column.field] = '18:20:52';
        } else {
          rowData[column.field] = `Row ${rowIndex} - Field ${columnIndex}`;
        }
        return rowData;
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      },
    );
  });

const selectOptions = [
  { value: 'key1', label: '选项1', bg: '#ffe8e6' },
  { value: 'key2', label: '选项2', bg: '#e6f7ff' },
  { value: 'key3', label: '选项3', bg: 'rgb(2, 179, 161)' },
  { value: 'key4', label: '选项4', bg: 'rgb(2, 179, 161)' },
  { value: 'key5', label: '选项5', bg: 'rgb(2, 179, 161)' },
  { value: 'key6', label: '选项6', bg: 'rgb(2, 179, 161)' },
  { value: 'key7', label: '选项7', bg: 'rgb(2, 179, 161)' },
  { value: 'key8', label: '选项8', bg: 'rgb(2, 179, 161)' },
  { value: 'key9', label: '选项9', bg: 'rgb(2, 179, 161)' },
  { value: 'key10', label: '选项10', bg: 'rgb(2, 179, 161)' },
  { value: 'key11', label: '选项11', bg: 'rgb(2, 179, 161)' },
  { value: 'key12', label: '选项12', bg: 'rgb(2, 179, 161)' },
  { value: 'key13', label: '选项13', bg: 'rgb(2, 179, 161)' },
];

const cascaderOptions = [
  {
    value: 'guide',
    label: 'Guide',
    children: [
      {
        value: 'disciplines',
        label: 'Disciplines',
        children: [
          {
            value: 'consistency',
            label: 'Consistency',
          },
          {
            value: 'feedback',
            label: 'Feedback',
          },
          {
            value: 'efficiency',
            label: 'Efficiency',
          },
          {
            value: 'controllability',
            label: 'Controllability',
          },
        ],
      },
      {
        value: 'navigation',
        label: 'Navigation',
        children: [
          {
            value: 'side nav',
            label: 'Side Navigation',
          },
          {
            value: 'top nav',
            label: 'Top Navigation',
          },
        ],
      },
    ],
  },
];

function findLabelByValue(value: string, options: any[]): string | null {
  for (const option of options) {
    if (option.value === value) {
      return option.label;
    }
    if (option.children) {
      const label = findLabelByValue(value, option.children);
      if (label) return label;
    }
  }
  return null;
}

const columns: Column[] = [
  {
    field: 'input',
    title: 'ElInput',
    width: 200,
    cellCoverRender: ({ column, row }: TdData) => (
      <ElInput
        v-model={row[column.field]}
        style="width: 100%; height: 36px;"
        placeholder="Please input"
      />
    ),
  },
  {
    field: 'select',
    title: 'ElSelect',
    width: 200,
    cellRender: ({ column, row }: TdData) => (
      <div class="vtg-cell">
        {selectOptions.find((item) => item.value === row[column.field])?.label ?? '请选择'}
      </div>
    ),
    cellCoverRender: ({ column, row }: TdData) => (
      <ElSelect v-model={row[column.field]} style="width: 100%; height: 36px;" placeholder="Select">
        {selectOptions.map((item) => (
          <ElOption label={item.label} value={item.value} />
        ))}
      </ElSelect>
    ),
  },
  {
    field: 'cascader',
    title: 'ElCascader',
    width: 200,
    cellRender: ({ column, row }: TdData) => (
      <div class="vtg-cell">{findLabelByValue(row[column.field], cascaderOptions)}</div>
    ),
    cellCoverRender: ({ column, row }: TdData) => (
      <ElCascader
        v-model={row[column.field]}
        style="width: 100%; height: 36px;"
        showAllLevels={false}
        options={cascaderOptions}
      />
    ),
  },
  {
    field: 'date',
    title: 'ElDatePicker',
    width: 200,
    cellRender: ({ column, row }: TdData) => (
      <div class="vtg-cell">
        <div style="width: 14px; height: 14px; margin-right: 8px">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
            <path
              fill="currentColor"
              d="M128 384v512h768V192H768v32a32 32 0 1 1-64 0v-32H320v32a32 32 0 0 1-64 0v-32H128v128h768v64zm192-256h384V96a32 32 0 1 1 64 0v32h160a32 32 0 0 1 32 32v768a32 32 0 0 1-32 32H96a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h160V96a32 32 0 0 1 64 0zm-32 384h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 0 1 0 64h-64a32 32 0 0 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m192-192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64m0 192h64a32 32 0 1 1 0 64h-64a32 32 0 1 1 0-64"
            ></path>
          </svg>
        </div>
        <div>{row[column.field]}</div>
      </div>
    ),
    cellCoverRender: ({ column, row }: TdData) => (
      <ElDatePicker
        v-model={row[column.field]}
        value-format="YYYY-MM-DD"
        style="width: 100%; height: 36px;"
        placeholder="Pick a day"
        type="date"
      ></ElDatePicker>
    ),
  },
  {
    field: 'time',
    title: 'ElTimePicker',
    width: 200,
    cellRender: ({ column, row }: TdData) => (
      <div class="vtg-cell">
        <div style="width: 14px; height: 14px; margin-right: 8px">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
            <path
              fill="currentColor"
              d="M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768m0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896"
            ></path>
            <path
              fill="currentColor"
              d="M480 256a32 32 0 0 1 32 32v256a32 32 0 0 1-64 0V288a32 32 0 0 1 32-32"
            ></path>
            <path
              fill="currentColor"
              d="M480 512h256q32 0 32 32t-32 32H480q-32 0-32-32t32-32"
            ></path>
          </svg>
        </div>
        <div>{row[column.field]}</div>
      </div>
    ),
    cellCoverRender: ({ column, row }: TdData) => {
      return (
        <ElTimePicker
          v-model={row[column.field]}
          value-format="HH:mm:ss"
          style="width: 100%; height: 36px;"
          placeholder="Arbitrary time"
          type="date"
        ></ElTimePicker>
      );
    },
  },
  {
    field: 'button',
    title: 'ElButton',
    width: 200,
    cellRender: () => <ElButton type="primary">Primary</ElButton>,
  },
];
const list: any = ref(generateList(columns, 200));
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
