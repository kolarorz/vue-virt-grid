import { reactive, shallowReactive, ref, inject, provide, shallowRef, nextTick } from 'vue';
import {
  type Column,
  type ListItem,
  type MergeCell,
  type ColumnItem,
  type TableOptions,
  type CustomRender,
  type GridProps,
} from '@/src/type';
import { type HeaderCellInfo } from '@/src/utils/column';
import { EventEmitter } from '@/src/hooks/useEvent';
import type { VirtListReturn } from 'vue-virt-list';
import { assign, pick } from 'lodash-es';
import { PopperStore } from './popperStore';
import { GridMerges } from './merges';
import { GridInteraction } from './interaction';
import { GridGroup } from './group';
import { GridColumn } from './column';

export type MergeInfoMap = Record<
  number,
  {
    $begin: number;
    $end: number;
    [field: number]: {
      $begin: number;
      $end: number;
      rowspan?: number;
      colspan?: number;
      mergeBy?: [number, number];
    };
  }
>;

export interface IColumnsRenderInfo {
  leftFixedColumns: ColumnItem[];
  rightFixedColumns: ColumnItem[];
  centerNormalHeaderColumns: ColumnItem[][];
  leftFixedHeaderColumns: ColumnItem[][];
  rightFixedHeaderColumns: ColumnItem[][];
  headerCellInfo: HeaderCellInfo;
}

const defaultGridOptions = {
  rowKey: 'id',
  minRowHeight: 36,
  merges: [] as MergeCell[],
  groupConfig: [] as { columnId: string; sort: 'desc' | 'asc' }[],
  align: 'left',
  headerAlign: 'left',
  verticalAlign: 'middle',
  headerVerticalAlign: 'middle',
  border: false, // TODO 看看要不要默认true好一点
  stripe: false,
  showTreeLine: false,
  selection: false,
  showHeader: true,
  textOverflow: 'ellipsis',
  textOverflowHeader: 'ellipsis',
  highlightHoverRow: false,
  highlightHoverCol: false,
  highlightSelectRow: false,
  highlightSelectCol: false,
  highlightSelectCell: false,
  defaultExpandAll: false,
  headerRowClassName: () => '',
  headerRowStyle: () => '',
  headerCellClassName: () => '',
  headerCellStyle: () => '',
  rowClassName: () => '',
  rowStyle: () => '',
  cellClassName: () => '',
  cellStyle: () => '',
};

type GridState = Required<Pick<TableOptions, keyof typeof defaultGridOptions>>;

export class GridStore {
  // 根元素
  rootEl: HTMLElement | null = null;
  // client
  clientEl: HTMLElement | null = null;
  // 表格
  tableEl: HTMLElement | undefined;

  virtualListRef: VirtListReturn<ListItem<Record<string, string>>> | undefined;

  // 记一下原始的list
  originList: ListItem[] = [];

  gridScrollingStatus = ref('is-scrolling-none');

  gridRowMap: Record<string, ListItem> = {};

  // TODO: 目前看是不需要响应式的，配置项传入
  customRender: CustomRender = {};

  // 响应式数据
  watchData = reactive({
    // 强制渲染
    renderKey: 0,
    // TODO 可能考虑拿出去做非响应式
    rowHeightMap: new Map(),

    // 多数
    checkboxRows: new Set() as Set<ListItem>,
    // 唯一
    radioRow: null as null | ListItem,

    // 配置
    config: {
      minRowHeight: defaultGridOptions.minRowHeight,
      colWidth: 100,
      // headerHeight: 30,
      // headerWidth: 100,
    },
  });

  rowKey: string | number = 'id';

  // 非响应式
  virtualListProps = shallowReactive({
    list: [] as ListItem[],
    minSize: 32,
    itemKey: this.rowKey,
    // fixed: true,
    // buffer: 4,
    renderControl: (begin: number, end: number) => {
      // this.watchData.originRect.ys = begin;
      // this.watchData.originRect.ye = end;
      this.mergeModule.mergeState.originRect.ys = begin;
      this.mergeModule.mergeState.originRect.ye = end;

      const { ys, ye } = this.mergeModule.calcRect();

      return {
        begin: ys ?? begin,
        end: ye ?? end,
      };
    },
  });

  state = shallowRef<GridState>(defaultGridOptions as GridState);

  sortState = reactive({
    sortColumnId: null as string | null,
    sortDirection: null as 'ascend' | 'descend' | null,
  });

  // 内部共享模块
  popperModule = new PopperStore(this);
  mergeModule = new GridMerges(this);
  interactionModule = new GridInteraction(this);
  groupModule = new GridGroup(this);
  columnModule = new GridColumn(this);
  // 用于内部事件的触发
  eventEmitter = new EventEmitter();

  constructor(props: { columns: Column[]; list: ListItem[]; options: TableOptions }) {
    // this.popperStore = new PopperStore(this);
    this.initOptions(props.options);
    this.columnModule.setColumns(props.columns);

    // TODO boxselection要重新做一下
    // this.interactionModule.gridSelection.on(this.interactionModule.handleSelectionChange);
  }

  forceUpdate() {
    this.watchData.renderKey += 1;
    console.log('forceUpdate');
  }

  setRowKey(key: string | number) {
    this.rowKey = key;
    this.virtualListProps.itemKey = key;
  }

  setRowMinHeight(minRowHeight: number) {
    this.virtualListProps.minSize = minRowHeight;
    console.log('setRowMinHeight', this.virtualListProps.minSize);
  }

  setRootEl(rootEl: HTMLElement | null) {
    this.rootEl = rootEl;
  }

  setClientEl(clientEl: HTMLElement | null) {
    this.clientEl = clientEl;
  }

  setList(list: ListItem[]) {
    this.virtualListProps.list = list;
  }

  setCustomRender(customRender: CustomRender) {
    this.customRender = customRender;
  }

  setOriginList(list: ListItem[]) {
    this.originList = list;
  }

  setTableEl(el: HTMLElement) {
    this.tableEl = el;
  }

  getCheckboxRows() {
    return this.watchData.checkboxRows;
  }

  addCheckboxRows(row: ListItem) {
    this.watchData.checkboxRows.add(row);
  }

  deleteCheckboxRows(row: ListItem) {
    this.watchData.checkboxRows.delete(row);
  }

  addAllCheckboxRows() {
    this.watchData.checkboxRows = new Set(this.virtualListProps.list);
    this.forceUpdate();
  }

  clearCheckboxRows() {
    this.watchData.checkboxRows.clear();
  }

  addRadioRow(row: ListItem) {
    this.watchData.radioRow = row;
  }

  setState(data: GridState) {
    this.state.value = data;
  }

  setStateValue<T extends keyof GridState>(key: T, value: GridState[T]) {
    this.state.value[key] = value;
  }

  getState<T extends keyof GridState>(key: T) {
    return this.state.value[key]!;
  }

  initVirtualListRef(elRef: GridStore['virtualListRef']) {
    this.virtualListRef = elRef;
  }

  calcGridScrollingStatus(scrollLeft: number, scrollWidth: number, clientWidth: number) {
    if (scrollWidth <= clientWidth) {
      this.gridScrollingStatus.value = 'is-scrolling-none';
    } else {
      if (scrollLeft === 0) {
        this.gridScrollingStatus.value = 'is-scrolling-left';
      } else if (scrollLeft + clientWidth === scrollWidth) {
        this.gridScrollingStatus.value = 'is-scrolling-right';
      } else {
        this.gridScrollingStatus.value = 'is-scrolling-middle';
      }
    }
  }

  calcFixedShadow(scrollLeft: number, scrollWidth: number, clientWidth: number) {
    this.calcGridScrollingStatus(scrollLeft, scrollWidth, clientWidth);
  }

  initOptions(options: TableOptions) {
    const state = assign(
      {},
      defaultGridOptions,
      pick(options, Object.keys(defaultGridOptions)),
    ) as GridState;

    this.setState(state);

    this.setRowKey(options?.rowKey ?? defaultGridOptions.rowKey);

    this.mergeModule.setMerges(options.merges);

    console.log(options.minRowHeight ?? defaultGridOptions.minRowHeight);
    this.setRowMinHeight(options.minRowHeight ?? defaultGridOptions.minRowHeight);

    this.setCustomRender({
      cellCoverRender: options.cellCoverRender,
      cellRender: options.cellRender,
      cellDropdownRender: options.cellDropdownRender,
    });

    // 设置默认排序配置
    if (options.defaultSort) {
      this.setDefaultSort(options.defaultSort);
    }
  }

  initDataList(list: ListItem[], preserveScroll?: boolean) {
    let scrollTop = 0;
    if (preserveScroll && this.clientEl) {
      scrollTop = this.clientEl.scrollTop;
    }
    
    this.setList([]);
    setTimeout(async () => {
      this.setOriginList(list);
      
      // 应用默认排序（如果配置了且当前没有排序状态）
      this.applyDefaultSort();
      
      const flattenList = this.groupModule.generateFlatList(this.originList);
      this.setList(flattenList || []);
      
      if (preserveScroll && this.clientEl && scrollTop > 0) {
        await nextTick();
        this.clientEl.scrollTop = scrollTop;
      }
    });
  }

  // 全局默认排序配置
  defaultSortConfig: TableOptions['defaultSort'] = undefined;

  /**
   * 设置默认排序配置
   */
  setDefaultSort(config: TableOptions['defaultSort']) {
    this.defaultSortConfig = config;
  }

  /**
   * 应用默认排序
   * 优先使用全局 defaultSort 配置，其次检查列的 sortOrder 配置
   */
  applyDefaultSort() {
    // 如果已经有排序状态，不应用默认排序
    if (this.sortState.sortColumnId) {
      return;
    }

    // 优先使用全局 defaultSort 配置
    if (this.defaultSortConfig) {
      const { field, order, sorter: globalSorter } = this.defaultSortConfig;
      
      // 查找对应的列
      const column = this.columnModule.flattedColumns.find((col) => col.field === field);
      if (column) {
        // 设置排序状态
        this.sortState.sortColumnId = column._id;
        this.sortState.sortDirection = order;
        
        // 确定使用的排序函数：全局配置 > 列配置 > 默认排序
        let sortFn: ((a: ListItem, b: ListItem) => number) | null = null;
        
        if (globalSorter) {
          // 使用全局配置的排序函数
          sortFn = (a, b) => globalSorter(a, b, { field, direction: order });
        } else if (column.sort?.sorter) {
          // 使用列配置的排序函数
          const columnSorter = column.sort.sorter;
          if (typeof columnSorter === 'function') {
            sortFn = (a, b) => columnSorter(a, b, { id: column._id, direction: order });
          } else if (columnSorter === true) {
            // 使用默认排序
            sortFn = (a, b) => {
              const aVal = a[field];
              const bVal = b[field];
              if (aVal === bVal) return 0;
              return aVal > bVal ? 1 : -1;
            };
          }
        } else {
          // 默认排序
          sortFn = (a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            if (aVal === bVal) return 0;
            return aVal > bVal ? 1 : -1;
          };
        }
        
        if (sortFn) {
          const sortedList = [...this.originList].sort((a, b) => {
            const result = sortFn!(a, b);
            return order === 'ascend' ? result : -result;
          });
          this.setOriginList(sortedList);
        }
        return;
      }
    }

    // 如果没有全局配置，查找第一个有 sortOrder 配置的列
    const columnWithDefaultSort = this.columnModule.flattedColumns.find((col) => {
      if (!col.sort) return false;
      const sortOrder = col.sort.sortOrder;
      return sortOrder === 'ascend' || sortOrder === 'descend';
    });

    if (columnWithDefaultSort && columnWithDefaultSort.sort) {
      const sortOrder = columnWithDefaultSort.sort.sortOrder;
      if (sortOrder === 'ascend' || sortOrder === 'descend') {
        // 设置排序状态
        this.sortState.sortColumnId = columnWithDefaultSort._id;
        this.sortState.sortDirection = sortOrder;
        
        // 执行排序
        const sorter = columnWithDefaultSort.sort.sorter;
        if (typeof sorter === 'boolean' && sorter) {
          const sortedList = [...this.originList].sort((a, b) => {
            const aVal = a[columnWithDefaultSort.field];
            const bVal = b[columnWithDefaultSort.field];
            if (aVal === bVal) return 0;
            const result = aVal > bVal ? 1 : -1;
            return sortOrder === 'ascend' ? result : -result;
          });
          this.setOriginList(sortedList);
        } else if (typeof sorter === 'function') {
          const sortedList = [...this.originList].sort((a, b) => {
            const result = sorter(a, b, { id: columnWithDefaultSort._id, direction: sortOrder });
            return sortOrder === 'ascend' ? result : -result;
          });
          this.setOriginList(sortedList);
        }
      }
    }
  }

  sortData(columnId: string, direction: 'ascend' | 'descend') {
    const column = this.columnModule.flattedColumns.find((col) => col._id === columnId);
    if (!column || !column.sort) return;

    if (this.sortState.sortColumnId === columnId && this.sortState.sortDirection === direction) {
      this.sortState.sortColumnId = null;
      this.sortState.sortDirection = null;
      this.initDataList(this.originList, true);
      return;
    }

    this.sortState.sortColumnId = columnId;
    this.sortState.sortDirection = direction;

    const sorter = column.sort.sorter;
    if (typeof sorter === 'boolean' && sorter) {
      const sortedList = [...this.originList].sort((a, b) => {
        const aVal = a[column.field];
        const bVal = b[column.field];
        if (aVal === bVal) return 0;
        const result = aVal > bVal ? 1 : -1;
        return direction === 'ascend' ? result : -result;
      });
      this.initDataList(sortedList, true);
    } else if (typeof sorter === 'function') {
      const sortedList = [...this.originList].sort((a, b) => {
        const result = sorter(a, b, { id: columnId, direction });
        return direction === 'ascend' ? result : -result;
      });
      this.initDataList(sortedList, true);
    }
  }
}

export const useGridStore = (props?: GridProps) => {
  if (props) {
    // 初始化时会传入 props
    const gridStore = new GridStore(props);
    provide('gridStore', gridStore);
    return gridStore;
  }
  return inject<GridStore>('gridStore')!;
};
