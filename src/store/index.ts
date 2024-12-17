import { reactive, shallowReactive, ref, inject, provide, shallowRef } from 'vue';
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
  // TODO 看看要不要默认true好一点
  border: false,
  stripe: false,
  showTreeLine: false,
  selection: false,
  showHeader: true,
  showOverflow: '',
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

  // 记一下原始的list
  originList: ListItem[] = [];

  gridScrollingStatus = ref('is-scrolling-none');

  virtualListRef: VirtListReturn<ListItem<Record<string, string>>> | undefined;

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
      minRowHeight: 36,
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

    this.setRowMinHeight(options.minRowHeight ?? defaultGridOptions.minRowHeight);

    this.setCustomRender({
      cellCoverRender: options.cellCoverRender,
      cellRender: options.cellRender,
      cellDropdownRender: options.cellDropdownRender,
    });
  }

  initDataList(list: ListItem[]) {
    this.setList([]);
    setTimeout(() => {
      this.setOriginList(list);
      const flattenList = this.groupModule.generateFlatList(this.originList);
      this.setList(flattenList || []);
    });
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
