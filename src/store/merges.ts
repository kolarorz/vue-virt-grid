import { reactive } from 'vue';
import { isEqual, unionWith } from 'lodash-es';
import type { GridStore } from '.';
import type { MergeCell } from '@/src/type';
import { calcRenderRect } from '@/src/utils/merge';

export type BodyMergeMap = Record<string, Record<string, MergeCell>>;

export class GridMerges {
  merges = [] as MergeCell[];
  // 生成渲染合并单元格
  tempMerges = [] as MergeCell[];
  bodyMergeMap = {} as BodyMergeMap;

  readonly mergeState = reactive({
    // 可视区域
    originRect: {
      ys: 0,
      ye: 0,
      xs: 0,
      xe: 0,
    },
    // 渲染区域
    renderRect: {
      ys: 0,
      ye: 0,
      xs: 0,
      xe: 0,
    },
  });

  constructor(private store: GridStore) {
    //
  }

  setMerges(merges?: MergeCell[]) {
    this.merges = merges ?? [];
  }

  calcRect(horizontal?: boolean) {
    // 如果没有合并单元格，就不需要计算了
    if (this.merges.length <= 0) {
      this.mergeState.renderRect.xs = this.mergeState.originRect.xs;
      this.mergeState.renderRect.xe = this.mergeState.originRect.xe;
      return { ys: this.mergeState.originRect.ys, ye: this.mergeState.originRect.ye };
    }

    const { renderRect, merges } = calcRenderRect(this.merges, this.mergeState.originRect);
    const { topMerges, leftMerges, rightMerges, bottomMerges } = merges;
    const { ys: rys, ye: rye, xs: rxs, xe: rxe } = renderRect;
    const { ys: oys, ye: oye, xs: oxs, xe: oxe } = this.mergeState.originRect;

    this.mergeState.renderRect = renderRect;

    // 顶部
    const placeCells2top: MergeCell[] = [];
    if (oys > rys) {
      const unionMerges = unionWith(topMerges, isEqual);
      // console.warn('unionTopMerges', unionMerges);
      // 顶部占位单元格
      placeCells2top.push({
        // 应该从渲染的ys开始
        rowIndex: rys,
        colIndex: rxs,
        rowspan: oys - rys,
        colspan: rxe - rxs + 1,
      });
      // console.log('top原始', placeCells2top[0]);
      // 遍历信息，拆分占位单元格
      unionMerges.forEach((merge) => {
        const { rowIndex, colIndex, colspan } = merge;
        // 拿最后一个单元格拆分
        const last = placeCells2top.pop()!;
        const {
          rowIndex: rowIndexLast,
          colIndex: colIndexLast,
          rowspan: rowspanLast,
          colspan: colspanLast,
        } = last;
        // 左边可能也不存在
        if (colIndex > colIndexLast) {
          placeCells2top.push({
            rowIndex: rowIndexLast,
            colIndex: colIndexLast,
            rowspan: rowspanLast,
            colspan: colIndex - colIndexLast,
          });
        }
        // 中间，中间可能有可能无
        if (rowIndex > rowIndexLast) {
          placeCells2top.push({
            rowIndex: rowIndexLast,
            colIndex: colIndex,
            rowspan: rowIndex - rowIndexLast,
            colspan: colspan,
          });
        }
        // 右边可能也不存在
        if (colIndex + colspan - 1 < colIndexLast + colspanLast - 1) {
          placeCells2top.push({
            rowIndex: rowIndexLast,
            colIndex: colIndex + colspan,
            rowspan: rowspanLast,
            colspan: colIndexLast + colspanLast - 1 - (colIndex + colspan - 1),
          });
        }
      });
      // console.warn('placeCells2top', placeCells2top);
    }

    // 左边
    const placeCells2Left: MergeCell[] = [];
    if (oxs > rxs) {
      const unionMerges = unionWith(leftMerges, isEqual);
      // console.warn('unionLeftMerges', unionMerges);

      placeCells2Left.push({
        rowIndex: oys,
        colIndex: rxs,
        rowspan: oye - oys + 1,
        colspan: oxs - rxs,
      });
      // console.log('left原始', placeCells2Left[0]);

      // 遍历信息，拆分占位单元格
      unionMerges.forEach((merge) => {
        const { rowIndex, colIndex, rowspan } = merge;
        // 拿最后一个单元格拆分
        const last = placeCells2Left.pop()!;
        const {
          rowIndex: rowIndexLast,
          colIndex: colIndexLast,
          colspan: colspanLast,
          rowspan: rowspanLast,
        } = last;

        // 上边可能不存在
        if (rowIndex > rowIndexLast) {
          placeCells2Left.push({
            rowIndex: rowIndexLast,
            colIndex: colIndexLast,
            rowspan: rowIndex - rowIndexLast,
            colspan: colspanLast,
          });
        }
        // 左边可能不存在
        if (colIndex > colIndexLast) {
          // isTop 就取交叉值
          const isTop = rowIndex < rowIndexLast;
          // isLast 就取交叉值
          const isLast = rowIndex + rowspan - 1 > rowIndexLast + rowspanLast - 1;
          // TODO 要把其他顶点的都处理一下
          // 顶点单元格独特处理
          placeCells2Left.push({
            rowIndex: isTop ? rowIndexLast : rowIndex,
            colIndex: colIndexLast,
            rowspan: isTop
              ? rowIndexLast - rowIndex
              : isLast
                ? rowIndexLast + rowspanLast - rowIndex
                : rowspan,
            colspan: colIndex - colIndexLast,
          });
        }
        // 下边可能也不存在
        if (rowIndex + rowspan - 1 < rowIndexLast + rowspanLast - 1) {
          placeCells2Left.push({
            rowIndex: rowIndex + rowspan,
            colIndex: colIndexLast,
            rowspan: rowIndexLast + rowspanLast - 1 - (rowIndex + rowspan - 1),
            colspan: colspanLast,
          });
        }
      });

      // console.warn('placeCells2Left', placeCells2Left);
    }

    // 右边 这里不能用最后一个数作为合并的范围，因为会造成大量的合并单元格信息。不如每行最后一个占位单元格数据量更小
    const placeCells2Right: MergeCell[] = [];
    if (oxe < rxe) {
      const unionMerges = unionWith(rightMerges, isEqual);
      // console.warn('unionRightMerges', unionMerges);
      placeCells2Right.push({
        rowIndex: oys,
        colIndex: oxe + 1,
        rowspan: oye - oys + 1,
        colspan: rxe - oxe,
      });
      // console.log('right原始', placeCells2Right[0]);

      // 遍历信息，拆分占位单元格
      unionMerges.forEach((merge) => {
        const { rowIndex, colIndex, rowspan, colspan } = merge;
        // 拿最后一个单元格拆分
        const last = placeCells2Right.pop()!;
        const {
          rowIndex: rowIndexLast,
          colIndex: colIndexLast,
          colspan: colspanLast,
          rowspan: rowspanLast,
        } = last;
        // 上边可能不存在
        if (rowIndex > rowIndexLast) {
          placeCells2Right.push({
            rowIndex: rowIndexLast,
            colIndex: colIndexLast,
            rowspan: rowIndex - rowIndexLast,
            colspan: colspanLast,
          });
        }
        // 中间，中间可能有可能无
        if (colIndex + colspan - 1 < colIndexLast + colspanLast - 1) {
          placeCells2Right.push({
            rowIndex: rowIndex,
            colIndex: colIndex + colspan,
            rowspan: rowspan,
            colspan: colIndexLast + colspanLast - 1 - (colIndex + colspan - 1),
          });
        }
        // 下边可能也不存在
        if (rowIndex + rowspan - 1 < rowIndexLast + rowspanLast - 1) {
          placeCells2Right.push({
            rowIndex: rowIndex + rowspan,
            colIndex: colIndexLast,
            rowspan: rowIndexLast + rowspanLast - 1 - (rowIndex + rowspan - 1),
            colspan: colspanLast,
          });
        }
      });

      // console.warn('placeCells2Right', placeCells2Right);
    }

    // 底边
    const placeCells2Bottom: MergeCell[] = [];
    if (oye < rye) {
      const unionMerges = unionWith(bottomMerges, isEqual);
      // console.warn('unionBottomMerges', unionMerges);
      placeCells2Bottom.push({
        rowIndex: oye + 1,
        colIndex: rxs,
        rowspan: rye - oye,
        colspan: rxe - rxs + 1,
      });
      // console.log('placeCells2Bottom', placeCells2Bottom[0]);

      // 遍历信息，拆分占位单元格
      unionMerges.forEach((merge) => {
        const { rowIndex, colIndex, rowspan, colspan } = merge;
        // 拿最后一个单元格拆分
        const last = placeCells2Bottom.pop()!;
        const {
          rowIndex: rowIndexLast,
          colIndex: colIndexLast,
          colspan: colspanLast,
          rowspan: rowspanLast,
        } = last;
        // 左边可能也不存在
        if (colIndex > colIndexLast) {
          placeCells2Bottom.push({
            rowIndex: rowIndexLast,
            colIndex: colIndexLast,
            rowspan: rowspanLast,
            colspan: colIndex - colIndexLast,
          });
        }
        // 中间，中间可能有可能无
        if (rowIndex + rowspan - 1 < rowIndexLast) {
          placeCells2Bottom.push({
            rowIndex: rowIndexLast,
            colIndex: colIndex,
            rowspan: rowIndexLast + colspanLast - rowIndex - colspan,
            colspan: colspan,
          });
        }
        // 右边可能也不存在
        if (colIndex + colspan - 1 < colIndexLast + colspanLast - 1) {
          placeCells2Bottom.push({
            rowIndex: rowIndexLast,
            colIndex: colIndex + colspan,
            rowspan: rowspanLast,
            colspan: colIndexLast + colspanLast - colIndex - colspan,
          });
        }
      });

      // console.warn('placeCells2Bottom', placeCells2Bottom);
    }

    this.tempMerges = [
      ...placeCells2top,
      ...placeCells2Left,
      ...placeCells2Right,
      ...placeCells2Bottom,
    ];

    // console.log('tempMerges', this.tempMerges);

    // console.warn(`oys: ${oys} oye: ${oye} oxs: ${oxs} oxe: ${oxe}`);
    // console.warn(`rys: ${rys} rye: ${rye} rxs: ${rxs} rxe: ${rxe}`);
    // 生成占位单元格信息，用于渲染优化

    console.timeEnd('calcRect');

    if (horizontal) {
      // 手动调用render
      this.store.virtualListRef?.manualRender(rys, rye);
    }
    this.store.forceUpdate();

    return {
      ys: rys,
      ye: rye,
    };
  }

  mergeFunction(rowIndex: number, colIndex: number) {
    if (colIndex === 0) {
      if (rowIndex % 2 === 0) {
        return {
          rowspan: 2,
          colspan: 1,
        };
      } else {
        return {
          rowspan: 0,
          colspan: 0,
        };
      }
    }
  }

  mergeMapConstructor(cellList: MergeCell[]) {
    console.log('mergeMapConstructor', cellList);
  }

  mergeMapConstructorWithFunction() {
    // 填入具体行列数量
    const colLen = 200;
    const rowLen = 10000;
    const res = [];
    console.log(colLen, rowLen);
    for (let i = 0; i < colLen; i++) {
      for (let j = 0; j < rowLen; j++) {
        const mergeCfg = this.mergeFunction(j, i);
        if (mergeCfg) {
          res.push({
            rowIndex: j,
            colIndex: i,
            rowspan: mergeCfg.rowspan,
            colspan: mergeCfg.colspan,
          });
        }
      }
    }
    return this.mergeMapConstructor(res);
  }
}
