<template>
  <div class="base-view">
    <div style="width: 100%; height: 600px; border: 2px solid var(--el-color-border)">
      <Grid :columns="columns" :list="list"></Grid>
    </div>
  </div>
</template>
<script setup lang="ts">
import { Grid, type Column, type ListItem } from 'vue-virt-grid';

const generateList = (length = 50) =>
  Array.from({ length }).map((_, rowIndex) => {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    const departments = ['技术部', '产品部', '设计部', '运营部', '市场部'];
    const statuses = ['在职', '离职', '试用期'];
    
    const nameIndex = rowIndex % names.length;
    const nameSuffix = Math.floor(rowIndex / names.length) > 0 ? Math.floor(rowIndex / names.length) : '';
    
    return {
      id: `row-${rowIndex}`,
      parentId: null,
      name: names[nameIndex] + nameSuffix,
      age: 20 + (rowIndex % 30),
      department: departments[rowIndex % departments.length],
      salary: 5000 + (rowIndex % 20) * 1000,
      status: statuses[rowIndex % statuses.length],
      joinDate: `202${rowIndex % 4}-${String((rowIndex % 12) + 1).padStart(2, '0')}-${String((rowIndex % 28) + 1).padStart(2, '0')}`,
    };
  });

const columns: Column[] = [
  {
    field: 'name',
    title: '姓名（按钮模式，点击表头可排序）',
    width: 180,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: true,
      sortMode: 'button',
      sortOnHeaderClick: true,
    },
  },
  {
    field: 'age',
    title: '年龄（按钮模式，点击表头不排序）',
    width: 200,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: (_a: ListItem, _b: ListItem, _extra: { id: string; direction: 'ascend' | 'descend' }) => {
        return (_a.age as number) - (_b.age as number);
      },
      sortMode: 'button',
      sortOnHeaderClick: false,
    },
  },
  {
    field: 'department',
    title: '部门（切换模式，点击表头不排序）',
    width: 200,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: true,
      sortMode: 'toggle',
      sortOnHeaderClick: false,
    },
  },
  {
    field: 'salary',
    title: '薪资（切换模式，点击表头可排序）',
    width: 200,
    align: 'right',
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: (_a: ListItem, _b: ListItem, _extra: { id: string; direction: 'ascend' | 'descend' }) => {
        return (_a.salary as number) - (_b.salary as number);
      },
      sortMode: 'toggle',
      sortOnHeaderClick: true,
    },
  },
];

const list: ListItem[] = generateList(50);
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
