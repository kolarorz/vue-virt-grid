import { type Column, type TableOptions } from '@/src/type';
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<{
    columns: Column[];
    list: any[];
    options?: TableOptions | undefined;
}>, {
    columns: () => never[];
    list: () => never[];
    options: () => {};
}>, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
    cellClick: (data: {
        event: Event;
        column: Column;
        columnIndex: number;
        row: any;
        rowIndex: number;
        cell: string;
    }) => void;
    cellDblclick: (data: {
        column: Column;
        columnIndex: number;
        row: any;
        rowIndex: number;
        cell: string;
    }) => void;
    cellContextmenu: (data: {
        column: Column;
        columnIndex: number;
        row: any;
        rowIndex: number;
        cell: string;
    }) => void;
    rowClick: (data: {
        event: Event;
        column: Column;
        row: any;
        rowIndex: number;
    }) => void;
    rowDblclick: (data: {
        event: Event;
        column: Column;
        row: any;
        rowIndex: number;
    }) => void;
    rowContextmenu: (data: {
        event: Event;
        column: Column;
        row: any;
        rowIndex: number;
    }) => void;
    headerClick: (data: {
        event: Event;
        column: Column;
        columnIndex: number;
    }) => void;
    headerDblclick: (data: {
        event: Event;
        column: Column;
        columnIndex: number;
    }) => void;
    headerContextmenu: (data: {
        event: Event;
        column: Column;
        columnIndex: number;
    }) => void;
    expandChange: (data: {
        rowKey: string;
        rowKeys: string[];
    }) => void;
    boxSelection: (data: {
        areas: import("@/src/type").SelectedCells[][];
        cells: import("@/src/type").SelectedCells[];
    }) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<__VLS_WithDefaults<__VLS_TypePropsToRuntimeProps<{
    columns: Column[];
    list: any[];
    options?: TableOptions | undefined;
}>, {
    columns: () => never[];
    list: () => never[];
    options: () => {};
}>>> & {
    onCellClick?: ((data: {
        event: Event;
        column: Column;
        columnIndex: number;
        row: any;
        rowIndex: number;
        cell: string;
    }) => any) | undefined;
    onCellDblclick?: ((data: {
        column: Column;
        columnIndex: number;
        row: any;
        rowIndex: number;
        cell: string;
    }) => any) | undefined;
    onCellContextmenu?: ((data: {
        column: Column;
        columnIndex: number;
        row: any;
        rowIndex: number;
        cell: string;
    }) => any) | undefined;
    onRowClick?: ((data: {
        event: Event;
        column: Column;
        row: any;
        rowIndex: number;
    }) => any) | undefined;
    onRowDblclick?: ((data: {
        event: Event;
        column: Column;
        row: any;
        rowIndex: number;
    }) => any) | undefined;
    onRowContextmenu?: ((data: {
        event: Event;
        column: Column;
        row: any;
        rowIndex: number;
    }) => any) | undefined;
    onHeaderClick?: ((data: {
        event: Event;
        column: Column;
        columnIndex: number;
    }) => any) | undefined;
    onHeaderDblclick?: ((data: {
        event: Event;
        column: Column;
        columnIndex: number;
    }) => any) | undefined;
    onHeaderContextmenu?: ((data: {
        event: Event;
        column: Column;
        columnIndex: number;
    }) => any) | undefined;
    onExpandChange?: ((data: {
        rowKey: string;
        rowKeys: string[];
    }) => any) | undefined;
    onBoxSelection?: ((data: {
        areas: import("@/src/type").SelectedCells[][];
        cells: import("@/src/type").SelectedCells[];
    }) => any) | undefined;
}, {
    list: any[];
    columns: Column[];
    options: TableOptions;
}, {}>, {
    empty?(_: {}): any;
}>;
export default _default;
type __VLS_NonUndefinedable<T> = T extends undefined ? never : T;
type __VLS_TypePropsToRuntimeProps<T> = {
    [K in keyof T]-?: {} extends Pick<T, K> ? {
        type: import('vue').PropType<__VLS_NonUndefinedable<T[K]>>;
    } : {
        type: import('vue').PropType<T[K]>;
        required: true;
    };
};
type __VLS_WithDefaults<P, D> = {
    [K in keyof Pick<P, keyof P>]: K extends keyof D ? __VLS_Prettify<P[K] & {
        default: D[K];
    }> : P[K];
};
type __VLS_Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
