import type { GridStore } from '.';
import type { Column, ColumnItem } from '@/src/type';
import { type HeaderCellInfo } from '@/src/utils/column';
export interface IColumnsRenderInfo {
    leftFixedColumns: ColumnItem[];
    rightFixedColumns: ColumnItem[];
    centerNormalHeaderColumns: ColumnItem[][];
    leftFixedHeaderColumns: ColumnItem[][];
    rightFixedHeaderColumns: ColumnItem[][];
    headerCellInfo: HeaderCellInfo;
}
export declare class GridColumn {
    private store;
    constructor(store: GridStore);
    private originColumns;
    flattedColumns: ColumnItem[];
    leftFixedColumns: ColumnItem[];
    rightFixedColumns: ColumnItem[];
    centerNormalColumns: ColumnItem[];
    leftFixedHeaderColumns: ColumnItem[][];
    rightFixedHeaderColumns: ColumnItem[][];
    centerNormalHeaderColumns: ColumnItem[][];
    columnState: {
        fullWidth: number;
        fixedInfo: {
            leftWidth: number;
            rightWidth: number;
        };
    };
    columnsInfo: import("vue").ShallowReactive<IColumnsRenderInfo>;
    setColumns(columns: Column[]): void;
    setColumnWidth(id: string, width: number): void;
    calcVisibleColumns(scrollLeft: number, clientWidth: number): void;
}
