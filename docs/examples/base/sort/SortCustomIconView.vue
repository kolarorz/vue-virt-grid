<template>
  <div class="base-view">
    <div style="width: 100%; height: 600px; border: 2px solid var(--el-color-border)">
      <Grid :columns="columns" :list="list"></Grid>
    </div>
  </div>
</template>
<script setup lang="ts">
import { h } from 'vue';
import { Grid, type Column, type ListItem } from 'vue-virt-grid';

const generateList = (length = 50) =>
  Array.from({ length }).map((_, rowIndex) => {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];
    const departments = ['技术部', '产品部', '设计部', '运营部', '市场部'];
    
    const nameIndex = rowIndex % names.length;
    const nameSuffix = Math.floor(rowIndex / names.length) > 0 ? Math.floor(rowIndex / names.length) : '';
    
    return {
      id: `row-${rowIndex}`,
      parentId: null,
      name: names[nameIndex] + nameSuffix,
      age: 20 + (rowIndex % 30),
      department: departments[rowIndex % departments.length],
      salary: 5000 + (rowIndex % 20) * 1000,
    };
  });

const customSortIcon = (data: {
  direction: 'ascend' | 'descend';
  isActive: boolean;
  onClick: () => void;
}) => {
  return h(
    'span',
    {
      class: [
        'custom-sort-icon',
        {
          'is-active': data.isActive,
          'is-clickable': !!data.onClick,
        },
      ],
      onClick: data.onClick ? (e: Event) => {
        e.stopPropagation();
        data.onClick();
      } : undefined,
      style: {
        display: 'inline-block',
        width: '16px',
        height: '16px',
        lineHeight: '16px',
        textAlign: 'center',
        marginLeft: '4px',
        cursor: data.onClick ? 'pointer' : 'default',
        color: data.isActive ? '#1890ff' : '#bfbfbf',
        transition: 'color 0.2s',
        fontSize: '12px',
      },
    },
    data.direction === 'ascend' ? '▲' : '▼'
  );
};

const columns: Column[] = [
  {
    field: 'name',
    title: '姓名（自定义图标）',
    width: 150,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: true,
      sortMode: 'button',
      sortIcon: customSortIcon,
    },
  },
  {
    field: 'age',
    title: '年龄（默认图标）',
    width: 150,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: (_a: ListItem, _b: ListItem, _extra: { id: string; direction: 'ascend' | 'descend' }) => {
        return (_a.age as number) - (_b.age as number);
      },
      sortMode: 'button',
    },
  },
  {
    field: 'department',
    title: '部门（切换模式+自定义图标）',
    width: 200,
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: true,
      sortMode: 'toggle',
      sortIcon: customSortIcon,
    },
  },
  {
    field: 'salary',
    title: '薪资（自定义按钮样式）',
    width: 180,
    align: 'right',
    sort: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: false,
      sorter: (_a: ListItem, _b: ListItem, _extra: { id: string; direction: 'ascend' | 'descend' }) => {
        return (_a.salary as number) - (_b.salary as number);
      },
      sortMode: 'button',
      sortIcon: (data) => {
        return h(
          'button',
          {
            class: [
              'custom-sort-button',
              {
                'is-active': data.isActive,
              },
            ],
            onClick: data.onClick ? (e: Event) => {
              e.stopPropagation();
              data.onClick();
            } : undefined,
            style: {
              padding: '2px 6px',
              marginLeft: '4px',
              border: '1px solid #d9d9d9',
              borderRadius: '2px',
              background: data.isActive ? '#1890ff' : '#fff',
              color: data.isActive ? '#fff' : '#333',
              cursor: data.onClick ? 'pointer' : 'default',
              fontSize: '12px',
              transition: 'all 0.2s',
            },
          },
          data.direction === 'ascend' ? '↑' : '↓'
        );
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
