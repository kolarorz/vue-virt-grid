<template>
  <div
    class="vtg-th-cell vtg-th-cell__text"
    :class="{ 'vtg-th-cell--sortable': column.sort }"
    :title="textOverflowHeader === 'title' ? column.title : ''"
    @click.stop="handleHeaderClick"
  >
    <span>{{ column.title }}</span>
    <span
      v-if="column.sort && shouldShowSortIcons"
      class="vtg-th-cell__sort"
      @click.stop
    >
      <template v-if="column.sort.sortIcon">
        <RenderSortIcon v-if="ascendSortIcon" :vnode="ascendSortIcon" />
        <RenderSortIcon v-if="descendSortIcon" :vnode="descendSortIcon" />
      </template>
      <template v-else>
        <span
          v-if="sortMode === 'button' || (sortMode === 'toggle' && isCurrentColumn && sortState.sortDirection === 'ascend')"
          class="vtg-th-cell__sort-icon"
          :class="{
            'is-active': sortState.sortColumnId === column._id && sortState.sortDirection === 'ascend',
            'vtg-th-cell__sort-icon--clickable': sortMode === 'button',
          }"
          @click.stop="sortMode === 'button' ? handleIconClick('ascend') : undefined"
        >
          ↑
        </span>
        <span
          v-if="sortMode === 'button' || (sortMode === 'toggle' && isCurrentColumn && sortState.sortDirection === 'descend')"
          class="vtg-th-cell__sort-icon"
          :class="{
            'is-active': sortState.sortColumnId === column._id && sortState.sortDirection === 'descend',
            'vtg-th-cell__sort-icon--clickable': sortMode === 'button',
          }"
          @click.stop="sortMode === 'button' ? handleIconClick('descend') : undefined"
        >
          ↓
        </span>
      </template>
    </span>
  </div>
</template>
<script setup lang="ts">
import { computed, nextTick, defineComponent, type VNode, type PropType } from 'vue';
import type { ListItem, ColumnItem } from '@/src/type';
import { TableEventEnum } from '@/src/type';
import { useGridStore } from '@/src/store';

const RenderSortIcon = defineComponent({
  props: {
    vnode: {
      type: Object as PropType<VNode>,
      required: true,
    },
  },
  setup(props) {
    return () => props.vnode;
  },
});

const props = defineProps<{
  rowIndex?: number;
  row?: ListItem;
  column: ColumnItem;
}>();
const gridStore = useGridStore();
const textOverflowHeader = gridStore.getState('textOverflowHeader');
const sortState = gridStore.sortState;

const sortMode = computed(() => {
  return props.column.sort?.sortMode || 'button';
});

const isCurrentColumn = computed(() => {
  return sortState.sortColumnId === props.column._id;
});

const shouldShowSortIcons = computed(() => {
  if (sortMode.value === 'button') {
    return true;
  }
  if (sortMode.value === 'toggle') {
    return isCurrentColumn.value;
  }
  return false;
});

// 触发排序变化事件
const emitSortChange = () => {
  nextTick(() => {
    const currentColumnId = gridStore.sortState.sortColumnId;
    const currentDirection = gridStore.sortState.sortDirection;
    
    const column = currentColumnId
      ? gridStore.columnModule.flattedColumns.find((col) => col._id === currentColumnId) || null
      : null;
    
    gridStore.eventEmitter.emit(TableEventEnum.SortChange, {
      column,
      direction: currentDirection,
    });
  });
};

const handleIconClick = (direction: 'ascend' | 'descend') => {
  if (!props.column.sort) return;
  
  const { sortDirections } = props.column.sort;
  if (!sortDirections.includes(direction)) return;

  if (sortMode.value === 'button') {
    if (isCurrentColumn.value && sortState.sortDirection === direction) {
      gridStore.sortState.sortColumnId = null;
      gridStore.sortState.sortDirection = null;
      gridStore.initDataList(gridStore.originList, true);
      emitSortChange();
    } else {
      gridStore.sortData(props.column._id, direction);
      emitSortChange();
    }
  }
};

const ascendSortIcon = computed(() => {
  if (!props.column.sort?.sortIcon) return null;
  if (sortMode.value !== 'button' && !(sortMode.value === 'toggle' && isCurrentColumn.value && sortState.sortDirection === 'ascend')) {
    return null;
  }
  return props.column.sort.sortIcon({
    direction: 'ascend',
    isActive: sortState.sortColumnId === props.column._id && sortState.sortDirection === 'ascend',
    onClick: () => sortMode.value === 'button' ? handleIconClick('ascend') : undefined,
  });
});

const descendSortIcon = computed(() => {
  if (!props.column.sort?.sortIcon) return null;
  if (sortMode.value !== 'button' && !(sortMode.value === 'toggle' && isCurrentColumn.value && sortState.sortDirection === 'descend')) {
    return null;
  }
  return props.column.sort.sortIcon({
    direction: 'descend',
    isActive: sortState.sortColumnId === props.column._id && sortState.sortDirection === 'descend',
    onClick: () => sortMode.value === 'button' ? handleIconClick('descend') : undefined,
  });
});

const shouldSortOnHeaderClick = computed(() => {
  if (props.column.sort?.sortOnHeaderClick !== undefined) {
    return props.column.sort.sortOnHeaderClick;
  }
  return sortMode.value === 'toggle';
});

const handleHeaderClick = () => {
  if (!props.column.sort) return;

  if (!shouldSortOnHeaderClick.value) {
    return;
  }

  if (sortMode.value === 'toggle') {
    const { sortDirections } = props.column.sort;
    const currentDirection = sortState.sortDirection;
    const currentColumnId = sortState.sortColumnId;

    if (currentColumnId === props.column._id) {
      if (currentDirection === 'ascend' && sortDirections.includes('descend')) {
        gridStore.sortData(props.column._id, 'descend');
        emitSortChange();
      } else if (currentDirection === 'descend') {
        gridStore.sortState.sortColumnId = null;
        gridStore.sortState.sortDirection = null;
        gridStore.initDataList(gridStore.originList, true);
        emitSortChange();
      }
    } else {
      const firstDirection = sortDirections[0] || 'ascend';
      gridStore.sortData(props.column._id, firstDirection);
      emitSortChange();
    }
  } else if (sortMode.value === 'button') {
    const { sortDirections } = props.column.sort;
    const currentDirection = sortState.sortDirection;
    const currentColumnId = sortState.sortColumnId;

    if (currentColumnId === props.column._id) {
      // 当前列已经在排序中，循环到下一个方向
      const currentIndex = currentDirection ? sortDirections.indexOf(currentDirection) : -1;
      const nextIndex = currentIndex + 1;

      if (nextIndex < sortDirections.length) {
        // 还有下一个方向
        gridStore.sortData(props.column._id, sortDirections[nextIndex]);
        emitSortChange();
      } else {
        // 已经是最后一个方向，取消排序
        gridStore.sortState.sortColumnId = null;
        gridStore.sortState.sortDirection = null;
        gridStore.initDataList(gridStore.originList, true);
        emitSortChange();
      }
    } else {
      // 不同的列，从第一个方向开始
      const firstDirection = sortDirections[0] || 'ascend';
      gridStore.sortData(props.column._id, firstDirection);
      emitSortChange();
    }
  }
};
</script>
<style scoped>
.vtg-th-cell--sortable {
  cursor: pointer;
  user-select: none;
}

.vtg-th-cell__sort {
  display: inline-flex;
  flex-direction: column;
  margin-left: 4px;
  font-size: 12px;
  line-height: 1;
}

.vtg-th-cell__sort-icon {
  color: #bfbfbf;
  transition: color 0.2s;
}

.vtg-th-cell__sort-icon--clickable {
  cursor: pointer;
}

.vtg-th-cell__sort-icon.is-active {
  color: #1890ff;
}
</style>