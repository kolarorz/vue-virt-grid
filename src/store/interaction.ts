import { ref, shallowReactive } from 'vue';
import type { GridStore } from '.';
import { CellType, type Column, type SelectedCells } from '../type';
import { useTableEvent } from '../hooks/useEvent';
import { nanoid } from 'nanoid';
import { GridSelection } from '../interaction/selection';
import { GridScrollZone } from '../interaction/scrollZone';

export type ISelectionBorderPos =
  | 'left-top'
  | 'top'
  | 'right-top'
  | 'right'
  | 'right-bottom'
  | 'bottom'
  | 'left-bottom'
  | 'left'
  | 'center';

interface IInteractionProps {
  selectBoxes: Record<string, { left: number; top: number; right: number; bottom: number }>;
  selectCellBorderMap: Record<string, ISelectionBorderPos[]>;
  selectCellClassMap: Record<string, string>;
}

export class GridInteraction {
  gridSelection: GridSelection;
  gridScrollZone: GridScrollZone;

  constructor(private store: GridStore) {
    this.gridSelection = new GridSelection(store);
    this.gridScrollZone = new GridScrollZone(store);
  }

  // 区域框选要重新做
  interactionState = shallowReactive<IInteractionProps>({
    selectBoxes: {},
    selectCellBorderMap: {},
    selectCellClassMap: {},
  });

  selectRowId = ref('');
  selectColId = ref('');

  initSelectionElement(el: HTMLElement) {
    this.gridSelection.init(el);
    this.gridScrollZone.init(el);
  }

  getSelectRow() {
    return this.selectRowId.value;
  }

  setSelectRow(rowIndex: number) {
    this.selectRowId.value = this.store.virtualListProps.list[rowIndex].id;
  }

  getSelectCol() {
    return this.selectColId.value;
  }

  setSelectCol(colIndex: number) {
    this.selectColId.value = this.store.columnModule.flattedColumns[colIndex]._id;
  }

  clearSelect() {
    this.selectRowId.value = '';
    this.selectColId.value = '';
  }

  getSelectionClass(rowIndex: number, column: Column) {
    if (!this.store.getState('selection')) {
      return '';
    }

    const colIndex = column.colIndex;
    const type = column.type;

    if (type === CellType.Expand || type === CellType.Index || type === CellType.Checkbox) {
      return 'vtg-cell--unselectable';
    }

    const id = `${rowIndex}-${colIndex}`;
    return this.interactionState.selectCellClassMap[id] || '';
  }

  selectCellClassConstructor(
    selectRenderMap: Record<string, ISelectionBorderPos[]>,
    rowIndex: number,
    colIndex: number,
    rowspan = 1,
    colspan = 1,
  ) {
    const id = `${rowIndex}-${colIndex}`;
    let pos = selectRenderMap[id];
    if (pos) {
      if (rowspan > 1 || colspan > 1) {
        const posArr = new Set<ISelectionBorderPos>();
        for (let i = rowIndex; i < rowIndex + rowspan; i++) {
          for (let j = colIndex; j < colIndex + colspan; j++) {
            const subPos = selectRenderMap[`${i}-${j}`];
            if (subPos) {
              subPos.forEach((p) => {
                posArr.add(p);
              });
            }
          }
        }
        if (posArr.has('left-top')) {
          posArr.delete('left');
          posArr.delete('top');
          posArr.delete('center');
        }
        if (posArr.has('right-top')) {
          posArr.delete('right');
          posArr.delete('top');
          posArr.delete('center');
        }
        if (posArr.has('left-bottom')) {
          posArr.delete('left');
          posArr.delete('bottom');
          posArr.delete('center');
        }
        if (posArr.has('right-bottom')) {
          posArr.delete('right');
          posArr.delete('bottom');
          posArr.delete('center');
        }
        if (
          posArr.has('left') ||
          posArr.has('right') ||
          posArr.has('top') ||
          posArr.has('bottom')
        ) {
          posArr.delete('center');
        }

        if (
          (posArr.has('left-top') && posArr.has('right-bottom')) ||
          (posArr.has('left-bottom') && posArr.has('right-top'))
        ) {
          pos = ['left-top', 'right-bottom'];
        } else {
          pos = [...posArr];
        }
      }
      return ['box-selection', ...pos.map((p) => `box-selection__${p}`)].join(' ');
    }
    return '';
  }

  expandMergedSelectArea(area: { left: number; top: number; right: number; bottom: number }) {
    const { left, top, right, bottom } = area;
    const mergedArea = { ...area };

    const visited = new Set<string>();
    const que = [];
    for (let i = top; i <= bottom; i++) {
      for (let j = left; j <= right; j++) {
        que.push([i, j]);
      }
    }

    while (que.length) {
      const [i, j] = que.shift()!;
      const mergeInfo = this.store.mergeModule.bodyMergeMap[i]?.[j];
      const k = `${i}-${j}`;
      if (visited.has(k)) {
        continue;
      }
      visited.add(k);
      if (mergeInfo) {
        const mergeBy = mergeInfo.mergeBy;
        if (mergeBy) {
          const mergeOrigin = this.store.mergeModule.bodyMergeMap[mergeBy[0]][mergeBy[1]];
          if (mergeOrigin) {
            mergedArea.left = Math.min(mergedArea.left, mergeBy[1]);
            mergedArea.right = Math.max(mergedArea.right, mergeBy[1] + mergeOrigin.colspan! - 1);
            mergedArea.top = Math.min(mergedArea.top, mergeBy[0]);
            mergedArea.bottom = Math.max(mergedArea.bottom, mergeBy[0] + mergeOrigin.rowspan! - 1);
          }
        } else {
          const { rowspan, colspan } = mergeInfo;
          mergedArea.left = Math.min(mergedArea.left, j);
          mergedArea.right = Math.max(mergedArea.right, j + colspan! - 1);
          mergedArea.top = Math.min(mergedArea.top, i);
          mergedArea.bottom = Math.max(mergedArea.bottom, i + rowspan! - 1);
        }

        const { left, top, right, bottom } = mergedArea;
        for (let i = top; i <= bottom; i++) {
          for (let j = left; j <= right; j++) {
            que.push([i, j]);
          }
        }
      }
    }

    return mergedArea;
  }

  handleSelectionChange = (
    id: string,
    area: { left: number; top: number; right: number; bottom: number },
    isMultiple: boolean,
  ) => {
    const mergedArea = this.expandMergedSelectArea(area);

    let selectBoxes = {
      [id]: mergedArea,
    };

    if (isMultiple) {
      selectBoxes = {
        ...this.interactionState.selectBoxes,
        ...selectBoxes,
      };
    }

    const posMap: Record<string, Set<ISelectionBorderPos>> = {};
    const cellBorderMap: Record<string, ISelectionBorderPos[]> = {};

    Object.keys(selectBoxes).forEach((boxId) => {
      const { left, top, right, bottom } = selectBoxes[boxId];
      for (let i = top; i <= bottom; i++) {
        for (let j = left; j <= right; j++) {
          const posId = `${i}-${j}`;
          if (!posMap[posId]) {
            posMap[posId] = new Set();
          }
          if (i === top || i === bottom || j === left || j === right) {
            if (i === top && j === left) {
              posMap[posId].add('left-top');
            }
            if (i === top && j === right) {
              posMap[posId].add('right-top');
            }
            if (i === bottom && j === left) {
              posMap[posId].add('left-bottom');
            }
            if (i === bottom && j === right) {
              posMap[posId].add('right-bottom');
            }
            if (j > left && j < right) {
              if (i === top) {
                posMap[posId].add('top');
              }
              if (i === bottom) {
                posMap[posId].add('bottom');
              }
            }
            if (i > top && i < bottom) {
              if (j === left) {
                posMap[posId].add('left');
              }
              if (j === right) {
                posMap[posId].add('right');
              }
            }
          } else {
            posMap[posId].add('center');
          }
        }
      }
    });

    Object.keys(posMap).forEach((posId) => {
      const poses = posMap[posId];
      if (
        (poses.has('left-top') && poses.has('right-bottom')) ||
        (poses.has('left-bottom') && poses.has('right-top'))
      ) {
        cellBorderMap[posId] = ['left-top', 'right-bottom'];
      } else {
        cellBorderMap[posId] = [...posMap[posId]];
      }
    });

    const cellClass: Record<string, string> = {};
    const selectedCells: SelectedCells[] = [];
    const selectedArea: SelectedCells[][] = [];
    const visitedCellId = new Set<string>();

    Object.keys(selectBoxes).forEach((boxId) => {
      const { left: nLeft, top: nTop, right: nRight, bottom: nBottom } = selectBoxes[boxId];
      const cells = [];
      for (let i = nTop; i <= nBottom; i++) {
        for (let j = nLeft; j <= nRight; j++) {
          const posId = `${i}-${j}`;
          const mergeInfo = this.store.mergeModule.bodyMergeMap[i]?.[j];
          const colspan = mergeInfo?.colspan;
          const rowspan = mergeInfo?.rowspan;
          cellClass[posId] = this.selectCellClassConstructor(cellBorderMap, i, j, rowspan, colspan);

          if (!mergeInfo || colspan || rowspan) {
            const cellData = {
              row: this.store.virtualListProps.list[i],
              rowIndex: i,
              column: this.store.columnModule.flattedColumns[j],
              columnIndex: j,
            };
            cells.push(cellData);
            if (!visitedCellId.has(posId)) {
              selectedCells.push(cellData);
            }
            visitedCellId.add(posId);
          }
        }
      }
      selectedArea.push(cells);
    });

    const tableEvents = useTableEvent(this.store);
    tableEvents.onCellSelection({
      areas: selectedArea,
      cells: selectedCells,
    });
    this.interactionState.selectBoxes = selectBoxes;
    this.interactionState.selectCellBorderMap = cellBorderMap;
    this.interactionState.selectCellClassMap = cellClass;
    this.store.forceUpdate();
  };

  setRowSelection(
    areaId = nanoid(4),
    startRowIndex: number,
    endRowIndex: number,
    isMulti: boolean,
  ) {
    this.handleSelectionChange(
      areaId,
      {
        left: 0,
        right: this.store.columnModule.flattedColumns.length,
        top: startRowIndex,
        bottom: endRowIndex,
      },
      isMulti,
    );
  }

  setColumnSelection(
    areaId = nanoid(4),
    startColumnIndex: number,
    endColumnIndex: number,
    isMulti: boolean,
  ) {
    this.handleSelectionChange(
      areaId,
      {
        left: startColumnIndex,
        right: endColumnIndex,
        top: 0,
        bottom: this.store.virtualListProps.list.length,
      },
      isMulti,
    );
  }
}
