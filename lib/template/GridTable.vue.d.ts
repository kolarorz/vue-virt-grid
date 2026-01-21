import { type VNode } from 'vue';
import { type Column, type MergeCell } from '@/src/type';
declare const _default: __VLS_WithTemplateSlots<import("vue").DefineComponent<__VLS_TypePropsToRuntimeProps<{
    list: any[];
    rowKey?: string | number | undefined;
    minRowHeight?: number | undefined;
    defaultExpandAll?: boolean | undefined;
    merges?: MergeCell[] | undefined;
    selection?: boolean | undefined;
    groupConfig?: {
        columnId: string;
        sort: "desc" | "asc";
    }[] | undefined;
    defaultSort?: {
        field: string;
        order: "ascend" | "descend";
        sorter?: ((a: any, b: any, extra: {
            field: string;
            direction: "ascend" | "descend";
        }) => number) | undefined;
    } | undefined;
    border: boolean;
    stripe: boolean;
    showTreeLine: boolean;
}>, {
    /**
     * 滚动到指定索引的行
     * @param index 行索引
     */
    scrollToIndex: (index: number) => void;
    /**
     * 滚动到指定行（使行可见）
     * @param index 行索引
     */
    scrollIntoView: (index: number) => void;
    /**
     * 滚动到顶部
     */
    scrollToTop: () => void;
    /**
     * 滚动到底部
     */
    scrollToBottom: () => void;
    /**
     * 滚动到指定偏移量
     * @param offset 偏移量（像素）
     */
    scrollToOffset: (offset: number) => void;
    /**
     * 获取 gridStore 实例
     */
    getGridStore: () => import("../store").GridStore | undefined;
}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {
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
    sortChange: (data: {
        column: Column | null;
        direction: "ascend" | "descend" | null;
    }) => void;
}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<__VLS_TypePropsToRuntimeProps<{
    list: any[];
    rowKey?: string | number | undefined;
    minRowHeight?: number | undefined;
    defaultExpandAll?: boolean | undefined;
    merges?: MergeCell[] | undefined;
    selection?: boolean | undefined;
    groupConfig?: {
        columnId: string;
        sort: "desc" | "asc";
    }[] | undefined;
    defaultSort?: {
        field: string;
        order: "ascend" | "descend";
        sorter?: ((a: any, b: any, extra: {
            field: string;
            direction: "ascend" | "descend";
        }) => number) | undefined;
    } | undefined;
    border: boolean;
    stripe: boolean;
    showTreeLine: boolean;
}>>> & {
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
    onExpandChange?: ((data: {
        rowKey: string;
        rowKeys: string[];
    }) => any) | undefined;
    onBoxSelection?: ((data: {
        areas: import("@/src/type").SelectedCells[][];
        cells: import("@/src/type").SelectedCells[];
    }) => any) | undefined;
    onSortChange?: ((data: {
        column: Column | null;
        direction: "ascend" | "descend" | null;
    }) => any) | undefined;
}, {}, {}>, Readonly<{
    empty?: (() => VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>) | undefined;
    default?: (() => VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>[]) | undefined;
}> & {
    empty?: (() => VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>) | undefined;
    default?: (() => VNode<import("vue").RendererNode, import("vue").RendererElement, {
        [key: string]: any;
    }>[]) | undefined;
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
type __VLS_WithTemplateSlots<T, S> = T & {
    new (): {
        $slots: S;
    };
};
