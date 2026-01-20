import { computed, defineComponent, type PropType } from 'vue';
import { useGridStore } from '@/src/store';
import { CellType, type ColumnItem, type ListItem } from '@/src/type';
import { getMergeInfo } from '@/src/utils/merge';
import { useObserverItem } from 'vue-virt-list';
import TreeCell from '@/src/table/cell/TreeCell.vue';
import TextCell from '@/src/table/cell/TextCell.vue';
import IndexCell from '@/src/table/cell/IndexCell.vue';
import CheckboxCell from '@/src/table/cell/CheckboxCell.vue';
import RadioCell from '@/src/table/cell/RadioCell.vue';
import ExpandCell from '@/src/table/cell/ExpandCell.vue';

export default defineComponent({
  name: 'Row',
  props: {
    resizeObserver: {
      type: Object as PropType<ResizeObserver | null>,
      default: null,
    },
    rowIndex: {
      type: Number,
      default: 0,
    },
    row: {
      type: Object as PropType<ListItem>,
      default: () => ({}),
    },
  },
  setup(props) {
    const gridStore = useGridStore();
    // const { headerCellInfo } = gridStore;

    const { itemRefEl } = useObserverItem({
      resizeObserver: props.resizeObserver as ResizeObserver,
    });
    const maxHeight = computed(() => gridStore.watchData.rowHeightMap.get(String(props.row.id)));

    const getCellStyle = (column: ColumnItem) => {
      const fn = gridStore.getState('cellStyle');
      if (fn) {
        return fn({
          row: props.row,
          rowIndex: props.rowIndex,
          column,
          columnIndex: column.colIndex!,
        });
      }
    };

    const getRenderCell = ({
      row,
      rowIndex,
      column,
    }: {
      row: ListItem;
      rowIndex: number;
      column: ColumnItem;
    }) => {
      // 1. 判断cell是否存在自定义渲染 cellRender
      // 2. 判断columns是否存在自定义渲染 cellRender
      // 3. 判断全局自定义渲染函数 cellRender
      const type = row[column.field]?.type ?? column?.type;
      const cellRender =
        row[column.field]?.cellRender ?? column?.cellRender ?? gridStore.customRender?.cellRender;
      // 4. 走默认TextCell
      if (cellRender) {
        const renderCell = cellRender({
          column: column,
          row: props.row,
        });
        if (renderCell) return renderCell;
      } else if (type) {
        switch (type) {
          case CellType.Index:
            return <IndexCell rowIndex={rowIndex} row={row} column={column}></IndexCell>;
          case CellType.Tree:
            return <TreeCell rowIndex={rowIndex} row={row} column={column}></TreeCell>;
          case CellType.Expand:
            return <ExpandCell rowIndex={rowIndex} row={row} column={column}></ExpandCell>;
          case CellType.Checkbox:
            return <CheckboxCell rowIndex={rowIndex} row={row} column={column}></CheckboxCell>;
          case CellType.Radio:
            return <RadioCell rowIndex={rowIndex} row={row} column={column}></RadioCell>;
          default:
            return <TextCell rowIndex={rowIndex} row={row} column={column}></TextCell>;
        }
      } else {
        return <TextCell rowIndex={rowIndex} row={row} column={column}></TextCell>;
      }
    };

    const selectRowId = computed(() => gridStore.interactionModule.getSelectRow());
    const selectColId = computed(() => gridStore.interactionModule.getSelectCol());

    const getRowClass = () => {
      const fn = gridStore.getState('rowClassName');
      if (fn) {
        return fn({
          row: props.row,
          rowIndex: props.rowIndex,
        });
      }
    };

    const getCellClass = (column: ColumnItem) => {
      const fn = gridStore.getState('cellClassName');
      if (fn) {
        return fn({
          row: props.row,
          rowIndex: props.rowIndex,
          column,
          columnIndex: column.colIndex!,
        });
      }
    };

    const getRowStyle = () => {
      const fn = gridStore.getState('rowStyle');
      if (fn) {
        return fn({
          row: props.row,
          rowIndex: props.rowIndex,
        });
      }
    };

    const cls = {
      leftFixed: (column: ColumnItem) => [
        'vtg-td',
        `vtg-td--${column?.align ?? gridStore.getState('align') ?? 'left'}`,
        `vtg-td--${column?.verticalAlign ?? gridStore.getState('verticalAlign') ?? 'middle'}`,
        gridStore.getState('textOverflow') ? 'vtg-td--text-ellipsis' : '',

        'is-fixed',
        'is-fixed--left',
        column._id === selectColId.value && 'current-column',
        // gridStore.interactionModule.getSelectionClass(props.rowIndex, column),
        getCellClass(column),
        column.className,
      ],
      leftPadding: () => ['vtg-td'],
      main: (column: ColumnItem) => [
        'vtg-td',
        `vtg-td--${column?.align ?? gridStore.getState('align') ?? 'left'}`,
        `vtg-td--${column?.verticalAlign ?? gridStore.getState('verticalAlign') ?? 'middle'}`,
        gridStore.getState('textOverflow') ? 'vtg-td--text-ellipsis' : '',

        column._id === selectColId.value && 'current-column',
        // gridStore.interactionModule.getSelectionClass(props.rowIndex, column),
        getCellClass(column),
        column.className,
      ],
      rightPadding: () => ['vtg-td'],
      rightFixed: (column: ColumnItem) => [
        'vtg-td',
        `vtg-td--${column?.align ?? gridStore.getState('align') ?? 'left'}`,
        `vtg-td--${column?.verticalAlign ?? gridStore.getState('verticalAlign') ?? 'middle'}`,
        gridStore.getState('textOverflow') ? 'vtg-td--text-ellipsis' : '',

        'is-fixed',
        'is-fixed--right',
        column._id === selectColId.value && 'current-column',
        // gridStore.interactionModule.getSelectionClass(props.rowIndex, column),
        getCellClass(column),
        column.className,
      ],
      row: () => [
        'vtg-tr',
        gridStore.getState('stripe') && props.rowIndex % 2 && 'is-striped',
        props.row.id === selectRowId.value && 'current-row',
        getRowClass(),
      ],
    };

    return {
      gridStore,
      maxHeight,
      itemRefEl,
      getCellStyle,
      getRowStyle,
      getRenderCell,
      cls,
    };
  },
  render() {
    const {
      watchData,
      // tempMerges,
      // merges,
      mergeModule: { tempMerges, merges, mergeState },
      columnModule: { leftFixedColumns, rightFixedColumns, centerNormalColumns, columnsInfo },
    } = this.gridStore;
    const { headerCellInfo } = columnsInfo;
    const { row, rowIndex, maxHeight, getCellStyle, getRowStyle, getRenderCell, cls } = this;

    const tds = [];

    // 左侧固定列
    if (leftFixedColumns.length > 0) {
      for (let colIndex = 0; colIndex < leftFixedColumns.length; colIndex++) {
        const column = leftFixedColumns[colIndex];

        tds.push(
          <td
            key={`${watchData.renderKey}-${rowIndex}-${colIndex}`}
            class={cls.leftFixed(column)}
            style={`left: ${headerCellInfo[column._id].fixOffset}px; ${getCellStyle(column)}`}
            data-rowidx={rowIndex}
            data-colidx={colIndex}
          >
            {getRenderCell({
              row: row,
              rowIndex: rowIndex,
              column: column,
            })}
          </td>,
        );
      }
    }
    // 左侧占位
    if (mergeState.renderRect.xs > 0) {
      tds.push(
        <td
          key={`${watchData.renderKey}-${rowIndex}-lp`}
          class={'vtg-td'}
          style={`height: ${maxHeight}px`}
          data-rowidx={rowIndex}
          data-colidx="lp"
          rowspan={1}
          colspan={mergeState.renderRect.xs}
        ></td>,
      );
    }
    // 主体单元格
    for (
      let colIndex = mergeState.renderRect.xs;
      colIndex <= mergeState.renderRect.xe;
      colIndex++
    ) {
      const column = centerNormalColumns[colIndex];
      const actualColIndex = colIndex + leftFixedColumns.length;

      const mergeInfo =
        getMergeInfo(tempMerges, rowIndex, colIndex) ??
        getMergeInfo(merges, rowIndex, colIndex) ??
        undefined;

      if (mergeInfo === undefined) {
        // 无合并单元格
        tds.push(
          <td
            key={`${watchData.renderKey}-${rowIndex}-${actualColIndex}`}
            class={cls.main(column)}
            data-rowidx={rowIndex}
            data-colidx={actualColIndex}
            style={`height: ${watchData.config.minRowHeight}px`}
          >
            {/* <TextCell rowIndex={rowIndex} row={row} column={column}></TextCell> */}
            {getRenderCell({
              row: row,
              rowIndex: rowIndex,
              column: column,
            })}
          </td>,
        );
      } else if (mergeInfo.rowIndex === rowIndex && mergeInfo.colIndex === colIndex) {
        // 只渲染合并单元格主体
        const rowspan = mergeInfo?.rowspan ?? 1;
        const colspan = mergeInfo?.colspan ?? 1;

        tds.push(
          <td
            key={`${watchData.renderKey}-${rowIndex}-${actualColIndex}`}
            class={cls.main(column)}
            data-rowidx={rowIndex}
            data-colidx={actualColIndex}
            rowspan={rowspan}
            colspan={colspan}
          >
            {/* <TextCell rowIndex={rowIndex} row={row} column={column}></TextCell> */}
            {getRenderCell({
              row: row,
              rowIndex: rowIndex,
              column: column,
            })}
          </td>,
        );
        // 直接跳过
        // colIndex += colspan - 1;
      }
    }
    // 右侧占位
    if (mergeState.renderRect.xe < centerNormalColumns.length - 1) {
      // console.log('watchData.renderRect.xe', watchData.renderRect.xe, centerNormalColumns.length);
      tds.push(
        <td
          key={`${watchData.renderKey}-${rowIndex}-rp`}
          class={'vtg-td'}
          style={`height: ${maxHeight}px`}
          data-rowidx={rowIndex}
          data-colidx="rp"
          rowspan={1}
          // todo why 要减去右侧length呢
          colspan={
            centerNormalColumns.length - mergeState.renderRect.xe + 1 - rightFixedColumns.length
          }
        ></td>,
      );
    }
    // 右侧固定列
    if (rightFixedColumns.length > 0) {
      for (let colIndex = 0; colIndex < rightFixedColumns.length; colIndex++) {
        const column = rightFixedColumns[colIndex];
        const actualColIndex = colIndex + leftFixedColumns.length + centerNormalColumns.length;
        const colInfo = headerCellInfo[column._id];
        const fixOffset = colInfo?.fixOffset;
        const colWidth = column.width;
        
        if (rowIndex === 0) {
          if (!colWidth || colWidth === 0) {
            console.error('[BaseRow-rightFixed] column width is 0 or undefined:', column._id, column.field, 'width:', colWidth, 'colIndex:', colIndex, 'column:', column);
          }
          if (fixOffset === undefined || fixOffset === null) {
            console.error('[BaseRow-rightFixed] fixOffset is undefined:', column._id, column.field, 'fixOffset:', fixOffset, 'colInfo:', colInfo);
          } else {
            console.log('[BaseRow-rightFixed] column:', column._id, column.field, 'width:', colWidth, 'fixOffset:', fixOffset, 'colIndex:', colIndex, 'actualColIndex:', actualColIndex, 'rightFixedColumns.length:', rightFixedColumns.length);
          }
        }
        
        tds.push(
          <td
            key={`${watchData.renderKey}-${rowIndex}-${actualColIndex}`}
            class={cls.rightFixed(column)}
            style={`text-align: ${column.align}; right: ${
              fixOffset ?? 0
            }px; ${getCellStyle(column)}`}
            data-rowidx={rowIndex}
            data-colidx={actualColIndex}
          >
            {getRenderCell({
              row: row,
              rowIndex: rowIndex,
              column: column,
            })}
          </td>,
        );
      }
    }

    return (
      <tr class={cls.row()} style={getRowStyle()} ref="itemRefEl">
        {tds}
      </tr>
    );
  },
});
