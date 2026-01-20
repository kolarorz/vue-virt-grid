import type { Column, ColumnItem } from '@/src/type';
export interface FormatColumns {
    headerCellInfo: HeaderCellInfo;
    flattedColumns: ColumnItem[];
    leftFixedColumns: ColumnItem[];
    rightFixedColumns: ColumnItem[];
    centerNormalColumns: ColumnItem[];
    originColumns: ColumnItem[];
    leftFixedHeaderColumns: ColumnItem[][];
    rightFixedHeaderColumns: ColumnItem[][];
    centerNormalHeaderColumns: ColumnItem[][];
    fixedInfo: {
        leftWidth: number;
        rightWidth: number;
    };
}
export type HeaderCellInfo = Record<string | number, ColumnItem & {
    rowspan?: number;
    colspan?: number;
    level?: number;
    leftColspan?: number;
    fixed?: 'left' | 'right' | '';
    parentId?: string | number;
    parentColumn?: ColumnItem;
    rendered?: boolean;
    isLeaf?: boolean;
    left?: number;
    right?: number;
    fixOffset?: number;
}>;
export declare const calcFixedColumnsOffset: (leftFixedColumns: ColumnItem[], rightFixedColumns: ColumnItem[], headerCellInfo: HeaderCellInfo) => {
    leftFixed: number;
    rightFixed: number;
    fixedHeaderCols: {
        leftFixed: ColumnItem[][];
        rightFixed: ColumnItem[][];
    };
};
export declare const formatColumns: (originColumns: Column[]) => FormatColumns;
