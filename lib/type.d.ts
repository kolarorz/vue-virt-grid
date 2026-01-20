import type { VNode } from 'vue';
import type { JSX } from 'vue/jsx-runtime';
export declare enum CellType {
    Index = "index",
    Expand = "expand",
    Tree = "tree",
    Radio = "radio",
    Checkbox = "checkbox",
    Text = "text",
    Link = "link",
    Select = "select",
    MultiSelect = "multiSelect",
    Image = "image",
    Person = "person"
}
/**
 * 用户配置时的列配置
 */
export type Column = {
    field: string;
    title?: string;
    type?: CellType | string;
    width?: number;
    minWidth?: number;
    maxWidth?: number;
    resizable?: boolean;
    fixed?: 'left' | 'right' | '';
    align?: 'left' | 'center' | 'right';
    headerAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    headerVerticalAlign?: 'top' | 'middle' | 'bottom';
    children?: Column[];
    className?: string;
    index?: (index: number) => number;
    colIndex?: number;
    /**
     * 是否超宽显示...+tooltip 还没用上
     */
    ellipsis?: boolean;
    /**
     * 列排序
     */
    sort?: {
        sortDirections: ('ascend' | 'descend')[];
        sortOrder: 'ascend' | 'descend' | boolean;
        sorter: ((a: ListItem, b: ListItem, extra: {
            id: string;
            direction: 'ascend' | 'descend';
        }) => number) | boolean;
    };
    options?: {
        key: string;
        value: string;
        bg?: string;
        color?: string;
    }[];
    cellRender?: (tdData: TdData) => VNode | JSX.Element;
    cellCoverRender?: (tdData: TdData) => VNode | JSX.Element;
    cellDropdownRender?: (tdData: TdData) => VNode | JSX.Element;
    headerRender?: (column: Column) => VNode | JSX.Element;
    expandRender?: (column: Column, row: ListItem) => VNode | JSX.Element;
};
/**
 * 经过格式化后，内部使用的列配置
 */
export type ColumnItem = Column & {
    _id: string;
    children: ColumnItem[];
};
export interface MergeCell {
    rowIndex: number;
    colIndex: number;
    rowspan: number;
    colspan: number;
    mergeBy?: [number, number];
}
type CellExtra = {
    type: CellType | string;
    value: string;
};
export type ListItem<T = any> = {
    id: string;
    type?: 'group' | 'expand' | 'item';
    children?: ListItem<T>[];
    level?: number;
    groupLevel?: number;
    isLastChild?: boolean;
} & T;
export type TdData = {
    column: Column;
    columnIndex: number;
    row: ListItem;
    rowIndex: number;
    cell: string | number | CellExtra;
    el: HTMLElement;
    event: Event;
    rect: DOMRect;
};
export declare enum CellEventEnum {
    CellClick = "cellClick",
    CellDblclick = "cellDblclick",
    CellContextmenu = "cellContextmenu"
}
export declare enum RowEventEnum {
    RowClick = "rowClick",
    RowDblclick = "rowDblclick",
    RowContextmenu = "rowContextmenu"
}
export declare enum HeaderEventEnum {
    HeaderClick = "headerClick",
    HeaderDblclick = "headerDblclick",
    HeaderContextmenu = "headerContextmenu"
}
export declare enum TableEventEnum {
    ExpandChange = "expandChange",
    BoxSelection = "boxSelection"
}
export type HeaderEmits = {
    (eventName: HeaderEventEnum.HeaderClick, data: {
        event: Event;
        column: Column;
        columnIndex: number;
    }): void;
    (eventName: HeaderEventEnum.HeaderDblclick, data: {
        event: Event;
        column: Column;
        columnIndex: number;
    }): void;
    (eventName: HeaderEventEnum.HeaderContextmenu, data: {
        event: Event;
        column: Column;
        columnIndex: number;
    }): void;
};
export type RowEmits = {
    (eventName: RowEventEnum.RowClick, data: {
        event: Event;
        column: Column;
        row: ListItem;
        rowIndex: number;
    }): void;
    (eventName: RowEventEnum.RowDblclick, data: {
        event: Event;
        column: Column;
        row: ListItem;
        rowIndex: number;
    }): void;
    (eventName: RowEventEnum.RowContextmenu, data: {
        event: Event;
        column: Column;
        row: ListItem;
        rowIndex: number;
    }): void;
};
export type CellEmits = {
    (eventName: CellEventEnum.CellClick, data: {
        event: Event;
        column: Column;
        columnIndex: number;
        row: ListItem;
        rowIndex: number;
        cell: string;
    }): void;
    (eventName: CellEventEnum.CellDblclick, data: {
        column: Column;
        columnIndex: number;
        row: ListItem;
        rowIndex: number;
        cell: string;
    }): void;
    (eventName: CellEventEnum.CellContextmenu, data: {
        column: Column;
        columnIndex: number;
        row: ListItem;
        rowIndex: number;
        cell: string;
    }): void;
};
export type TableEmits = {
    (eventName: TableEventEnum.ExpandChange, data: {
        rowKey: string;
        rowKeys: string[];
    }): void;
    (eventName: TableEventEnum.BoxSelection, data: {
        areas: SelectedCells[][];
        cells: SelectedCells[];
    }): void;
};
export interface SelectedCells {
    row: ListItem;
    rowIndex: number;
    column: Column;
    columnIndex: number;
}
export interface TableOptions {
    rowKey?: string | number;
    minRowHeight?: number;
    textOverflow?: 'ellipsis' | 'title' | 'tooltip';
    textOverflowHeader?: 'ellipsis' | 'title' | 'tooltip';
    showHeader?: boolean;
    defaultExpandAll?: boolean;
    border?: boolean;
    align?: 'left' | 'center' | 'right';
    headerAlign?: 'left' | 'center' | 'right';
    verticalAlign?: 'top' | 'middle' | 'bottom';
    headerVerticalAlign?: 'top' | 'middle' | 'bottom';
    stripe?: boolean;
    showTreeLine?: boolean;
    highlightHoverRow?: boolean;
    highlightHoverCol?: boolean;
    highlightSelectRow?: boolean;
    highlightSelectCol?: boolean;
    highlightSelectCell?: boolean;
    selection?: boolean;
    merges?: MergeCell[];
    groupConfig?: {
        columnId: string;
        sort: 'desc' | 'asc';
    }[];
    headerRowClassName?: (data: {
        row: Column[];
        rowIndex: number;
    }) => string;
    headerRowStyle?: (data: {
        row: Column[];
        rowIndex: number;
    }) => string;
    headerCellClassName?: (data: {
        row: Column[];
        column: Column;
        rowIndex: number;
        columnIndex: number;
    }) => string;
    headerCellStyle?: (data: {
        row: Column[];
        column: Column;
        rowIndex: number;
        columnIndex: number;
    }) => string;
    rowClassName?: (data: {
        row: ListItem;
        rowIndex: number;
    }) => string;
    rowStyle?: (data: {
        row: ListItem;
        rowIndex: number;
    }) => string;
    cellClassName?: (data: {
        row: ListItem;
        column: Column;
        rowIndex: number;
        columnIndex: number;
    }) => string;
    cellStyle?: (data: {
        row: ListItem;
        column: Column;
        rowIndex: number;
        columnIndex: number;
    }) => string;
    cellRender?: (tdData: TdData) => VNode | JSX.Element;
    cellCoverRender?: (tdData: TdData) => VNode | JSX.Element;
    cellDropdownRender?: (tdData: TdData) => VNode | JSX.Element;
}
export type CustomRender = Pick<TableOptions, 'cellRender' | 'cellCoverRender' | 'cellDropdownRender'>;
export interface GridProps {
    columns: Column[];
    list: ListItem[];
    options: TableOptions;
}
export {};
