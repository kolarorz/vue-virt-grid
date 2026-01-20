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
    title: '姓名',
    width: 120,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: true,
    },
  },
  {
    field: 'age',
    title: '年龄',
    width: 100,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: (a: ListItem, b: ListItem, _extra: { id: string; direction: 'ascend' | 'descend' }) => {
        return (a.age as number) - (b.age as number);
      },
    },
  },
  {
    field: 'department',
    title: '部门',
    width: 120,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: true,
    },
  },
  {
    field: 'salary',
    title: '薪资',
    width: 120,
    align: 'right',
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: (a: ListItem, b: ListItem, _extra: { id: string; direction: 'ascend' | 'descend' }) => {
        return (a.salary as number) - (b.salary as number);
      },
    },
  },
  {
    field: 'status',
    title: '状态',
    width: 100,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: true,
    },
  },
  {
    field: 'joinDate',
    title: '入职日期',
    width: 150,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: (a: ListItem, b: ListItem, _extra: { id: string; direction: 'ascend' | 'descend' }) => {
        const dateA = new Date(a.joinDate as string).getTime();
        const dateB = new Date(b.joinDate as string).getTime();
        return dateA - dateB;
      },
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
