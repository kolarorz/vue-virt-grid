import { type MergeCell } from '@/src/type';

export function isInMergeCell(mergeInfo: MergeCell, rowIndex: number, colIndex: number) {
  return (
    mergeInfo.rowIndex <= rowIndex &&
    mergeInfo.rowIndex + mergeInfo.rowspan - 1 >= rowIndex &&
    mergeInfo.colIndex <= colIndex &&
    mergeInfo.colIndex + mergeInfo.colspan - 1 >= colIndex
  );
}

export const mergeMethods = (
  rowIndex: number,
  colIndex: number,
): {
  rowIndex: number;
  colIndex: number;
  rowspan: number;
  colspan: number;
} | null => {
  if (colIndex === 0) {
    if (rowIndex % 2 === 0) {
      return {
        rowIndex: rowIndex,
        colIndex: colIndex,
        rowspan: 2,
        colspan: 1,
      };
    } else {
      return {
        rowIndex: rowIndex - 1,
        colIndex: colIndex,
        // rowspan: 2,
        // colspan: 1,
        rowspan: 0,
        colspan: 0,
      };
    }
  }
  if (colIndex === 1) {
    if (rowIndex % 2 === 1) {
      return {
        rowIndex: rowIndex,
        colIndex: colIndex,
        rowspan: 2,
        colspan: 1,
      };
    } else if (rowIndex > 0) {
      return {
        rowIndex: rowIndex - 1,
        colIndex: colIndex,
        rowspan: 2,
        colspan: 1,
      };
    }
  }
  return null;
};

export function getMergeInfo(
  merges: MergeCell[],
  rowIndex: number,
  colIndex: number,
): MergeCell | null {
  // 测试methods
  // return mergeMethods(rowIndex, colIndex);
  for (let i = 0; i < merges.length; i += 1) {
    if (isInMergeCell(merges[i], rowIndex, colIndex)) {
      return merges[i];
    }
  }
  return null;
}

/**
 * @description
 *  calcRenderRect计算实际渲染的区域和边界并收集合并单元格信息
 *  该函数会在render之前被调用，以便计算实际渲染的区域和边界合并单元格
 *  该函数返回的是一个对象，包含了渲染的区域和边界合并单元格
 * @param merges {MergeCell[]}  - 合并单元格的信息
 * @param originRect {Object}  - 可视区域的信息
 * @return {
 *    renderRect: { ys: number; ye: number; xs: number; xe: number },
 *    merges: { topMerges: MergeCell[], leftMerges: MergeCell[], rightMerges: MergeCell[], bottomMerges: MergeCell[] }
 * }  - 一个对象，包含了渲染的区域和边界合并单元格
 */
export function calcRenderRect(
  merges: MergeCell[],
  originRect: { ys: number; ye: number; xs: number; xe: number },
) {
  const topMerges: MergeCell[] = [];
  const leftMerges: MergeCell[] = [];
  const rightMerges: MergeCell[] = [];
  const bottomMerges: MergeCell[] = [];
  const { ys: oys, ye: oye, xs: oxs, xe: oxe } = originRect;
  let rys = originRect.ys;
  let rye = originRect.ye;
  let rxs = originRect.xs;
  let rxe = originRect.xe;

  for (let y = oys; y <= oye; y++) {
    for (let x = oxs; x <= oxe; x++) {
      // 如果是第一行，那么可以算出rys
      if (y === oys) {
        const mergeInfo = getMergeInfo(merges, y, x);
        // console.warn('第一行', y, x, mergeInfo);
        if (mergeInfo) {
          const { rowIndex, colIndex, colspan } = mergeInfo;
          rys = Math.min(rys, rowIndex);
          rxs = Math.min(rxs, colIndex);
          rxe = Math.max(rxe, colIndex + colspan - 1);
          // 只有被上面的行合并的单元格才需要加进来
          if (y > rowIndex) {
            topMerges.push(mergeInfo);
          }
        }
      }

      // 左边列，不包含第一行和最后一行
      if (x === oxs) {
        const mergeInfo = getMergeInfo(merges, y, x);
        // console.warn('左边列', y, x, mergeInfo);
        if (mergeInfo) {
          const { colIndex } = mergeInfo;
          rxs = Math.min(rxs, colIndex);
          // 只有被左边的列合并的单元格才需要加进来
          if (x > colIndex) {
            leftMerges.push(mergeInfo);
          }
        }
      }

      // 右边列，不包含第一行和最后一行
      if (x === oxe) {
        const mergeInfo = getMergeInfo(merges, y, x);
        // console.warn('右边列', y, x, mergeInfo);
        if (mergeInfo) {
          const { colIndex, colspan } = mergeInfo;
          rxe = Math.max(rxe, colIndex + colspan - 1);
          // 只要是有合并信息的都加进去
          rightMerges.push(mergeInfo);
        }
      }

      // 如果是最后一行，那么可以算出rye
      if (y === oye) {
        const mergeInfo = getMergeInfo(merges, y, x);
        if (mergeInfo) {
          // 只要是有合并信息的都加进去
          const { rowIndex, rowspan } = mergeInfo;
          rye = Math.max(rye, rowIndex + rowspan - 1);
          bottomMerges.push(mergeInfo);
        }
      }
    }
  }

  return {
    renderRect: { ys: rys, ye: rye, xs: rxs, xe: rxe },
    merges: {
      topMerges,
      leftMerges,
      rightMerges,
      bottomMerges,
    },
  };
}
