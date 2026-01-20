import { reactive, shallowReactive } from 'vue';
import type { GridStore } from '.';
import type { Column, ColumnItem } from '@/src/type';
import { formatColumns, type HeaderCellInfo } from '@/src/utils/column';

export interface IColumnsRenderInfo {
  leftFixedColumns: ColumnItem[];
  rightFixedColumns: ColumnItem[];
  centerNormalHeaderColumns: ColumnItem[][];
  leftFixedHeaderColumns: ColumnItem[][];
  rightFixedHeaderColumns: ColumnItem[][];
  headerCellInfo: HeaderCellInfo;
}

export class GridColumn {
  constructor(private store: GridStore) {
    //
  }

  // 原始列数据（带 _id），一般不直接用
  private originColumns = [] as ColumnItem[];
  // 平铺列(子树列)
  flattedColumns = [] as ColumnItem[];
  // 左侧固定列(子树列)
  leftFixedColumns = [] as ColumnItem[];
  // 右侧固定列(子树列)
  rightFixedColumns = [] as ColumnItem[];
  // 中间主要列(子树列)
  centerNormalColumns = [] as ColumnItem[];

  // 这3个是给表头用的
  leftFixedHeaderColumns = [] as ColumnItem[][];
  rightFixedHeaderColumns = [] as ColumnItem[][];
  centerNormalHeaderColumns = [] as ColumnItem[][];

  columnState = reactive({
    fullWidth: 0,
    fixedInfo: {
      leftWidth: 0,
      rightWidth: 0,
    },
  });

  columnsInfo = shallowReactive<IColumnsRenderInfo>({
    leftFixedColumns: [],
    rightFixedColumns: [],
    leftFixedHeaderColumns: [],
    rightFixedHeaderColumns: [],
    centerNormalHeaderColumns: [],
    headerCellInfo: {},
  });

  setColumns(columns: Column[]) {
    // 存储最原始的列
    // 格式化列信息
    const {
      leftFixedColumns,
      rightFixedColumns,
      centerNormalColumns,
      flattedColumns,
      headerCellInfo,
      originColumns,

      leftFixedHeaderColumns,
      rightFixedHeaderColumns,
      centerNormalHeaderColumns,

      fixedInfo,
    } = formatColumns(columns);

    this.leftFixedColumns = leftFixedColumns;
    this.rightFixedColumns = rightFixedColumns;
    this.centerNormalColumns = centerNormalColumns;
    this.flattedColumns = flattedColumns;
    this.originColumns = originColumns;

    console.log('[GridColumn.setColumns] rightFixedColumns:', rightFixedColumns.map(col => ({
      _id: col._id,
      field: col.field,
      width: col.width,
      fixed: col.fixed,
    })));

    this.columnState.fixedInfo = fixedInfo;
    this.columnsInfo.headerCellInfo = headerCellInfo;
    this.columnsInfo.leftFixedColumns = leftFixedColumns;
    this.columnsInfo.rightFixedColumns = rightFixedColumns;
    this.columnsInfo.leftFixedHeaderColumns = leftFixedHeaderColumns;
    this.columnsInfo.rightFixedHeaderColumns = rightFixedHeaderColumns;
    this.columnsInfo.centerNormalHeaderColumns = centerNormalHeaderColumns;
    // this.flattedColumns = flattedColumns;
    // // 拿平铺的列进行遍历
    // let leftReduce = 0;
    // this.flattedColumns.forEach((col) => {
    //   if (col.fixed === 'left') {
    //     this.leftFixedColumns.push(Object.assign(col, { left: leftReduce }));
    //     leftReduce += col.width;
    //   } else if (col.fixed === 'right') {
    //     // TODO right的值是要计算出来的
    //     this.rightFixedColumns.push(col);
    //   } else {
    //     this.centerNormalColumns.push(col);
    //   }
    // });
    this.columnState.fullWidth = this.flattedColumns.reduce((a, b) => a + b.width!, 0);
    this.store.forceUpdate();
  }

  setColumnWidth(id: string, width: number) {
    const column = this.flattedColumns.find((col) => col._id === id);
    if (column) {
      column.width = width;
      this.setColumns(this.originColumns);
    }
  }

  calcVisibleColumns(scrollLeft: number, clientWidth: number) {
    // console.log('calcVisibleColumns', scrollLeft, clientWidth);
    let colRenderBegin = 0;
    let colRenderEnd = 0;
    let currentLeft = 0;
    let beginFlag = false;
    for (let i = 0; i < this.centerNormalColumns.length; i++) {
      const currentWidth = this.centerNormalColumns[i].width!;
      // console.log('currentWidth', currentLeft, scrollLeft, scrollLeft + clientWidth);
      if (currentLeft >= scrollLeft && !beginFlag) {
        colRenderBegin = i;
        beginFlag = true;
      } else if (currentLeft >= scrollLeft + clientWidth) {
        colRenderEnd = i;
        // console.log('计算结束', colRenderBegin, colRenderEnd);
        break;
      }
      colRenderEnd = i;
      currentLeft += currentWidth;
    }
    // 给首尾各加一个buffer
    // TODO 这里可以减少点
    colRenderBegin = Math.max(0, colRenderBegin - 1);
    colRenderEnd = Math.min(this.centerNormalColumns.length - 1, colRenderEnd + 1);

    if (
      colRenderBegin !== this.store.mergeModule.mergeState.originRect.xs ||
      colRenderEnd !== this.store.mergeModule.mergeState.originRect.xe
    ) {
      // console.warn('横向计算结束', colRenderBegin, colRenderEnd);

      this.store.mergeModule.mergeState.originRect.xs = colRenderBegin;
      this.store.mergeModule.mergeState.originRect.xe = colRenderEnd;

      this.store.mergeModule.calcRect(true);
    }
  }
}
