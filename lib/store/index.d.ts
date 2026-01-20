import { type Column, type ListItem, type MergeCell, type ColumnItem, type TableOptions, type CustomRender, type GridProps } from '@/src/type';
import { type HeaderCellInfo } from '@/src/utils/column';
import { EventEmitter } from '@/src/hooks/useEvent';
import type { VirtListReturn } from 'vue-virt-list';
import { PopperStore } from './popperStore';
import { GridMerges } from './merges';
import { GridInteraction } from './interaction';
import { GridGroup } from './group';
import { GridColumn } from './column';
export type MergeInfoMap = Record<number, {
    $begin: number;
    $end: number;
    [field: number]: {
        $begin: number;
        $end: number;
        rowspan?: number;
        colspan?: number;
        mergeBy?: [number, number];
    };
}>;
export interface IColumnsRenderInfo {
    leftFixedColumns: ColumnItem[];
    rightFixedColumns: ColumnItem[];
    centerNormalHeaderColumns: ColumnItem[][];
    leftFixedHeaderColumns: ColumnItem[][];
    rightFixedHeaderColumns: ColumnItem[][];
    headerCellInfo: HeaderCellInfo;
}
declare const defaultGridOptions: {
    rowKey: string;
    minRowHeight: number;
    merges: MergeCell[];
    groupConfig: {
        columnId: string;
        sort: 'desc' | 'asc';
    }[];
    align: string;
    headerAlign: string;
    verticalAlign: string;
    headerVerticalAlign: string;
    border: boolean;
    stripe: boolean;
    showTreeLine: boolean;
    selection: boolean;
    showHeader: boolean;
    textOverflow: string;
    textOverflowHeader: string;
    highlightHoverRow: boolean;
    highlightHoverCol: boolean;
    highlightSelectRow: boolean;
    highlightSelectCol: boolean;
    highlightSelectCell: boolean;
    defaultExpandAll: boolean;
    headerRowClassName: () => string;
    headerRowStyle: () => string;
    headerCellClassName: () => string;
    headerCellStyle: () => string;
    rowClassName: () => string;
    rowStyle: () => string;
    cellClassName: () => string;
    cellStyle: () => string;
};
type GridState = Required<Pick<TableOptions, keyof typeof defaultGridOptions>>;
export declare class GridStore {
    rootEl: HTMLElement | null;
    clientEl: HTMLElement | null;
    tableEl: HTMLElement | undefined;
    virtualListRef: VirtListReturn<ListItem<Record<string, string>>> | undefined;
    originList: ListItem[];
    gridScrollingStatus: import("vue").Ref<string>;
    gridRowMap: Record<string, ListItem>;
    customRender: CustomRender;
    watchData: {
        renderKey: number;
        rowHeightMap: Map<any, any> & Omit<Map<any, any>, keyof Map<any, any>>;
        checkboxRows: Set<any> & Omit<Set<any>, keyof Set<any>>;
        radioRow: any;
        config: {
            minRowHeight: number;
            colWidth: number;
        };
    };
    rowKey: string | number;
    virtualListProps: import("vue").ShallowReactive<{
        list: any[];
        minSize: number;
        itemKey: string | number;
        renderControl: (begin: number, end: number) => {
            begin: number;
            end: number;
        };
    }>;
    state: import("vue").ShallowRef<Required<Pick<TableOptions, "align" | "textOverflowHeader" | "rowKey" | "minRowHeight" | "merges" | "groupConfig" | "headerAlign" | "verticalAlign" | "headerVerticalAlign" | "border" | "stripe" | "showTreeLine" | "selection" | "showHeader" | "textOverflow" | "highlightHoverRow" | "highlightHoverCol" | "highlightSelectRow" | "highlightSelectCol" | "highlightSelectCell" | "defaultExpandAll" | "headerRowClassName" | "headerRowStyle" | "headerCellClassName" | "headerCellStyle" | "rowClassName" | "rowStyle" | "cellClassName" | "cellStyle">>>;
    sortState: {
        sortColumnId: string | null;
        sortDirection: "ascend" | "descend" | null;
    };
    popperModule: PopperStore;
    mergeModule: GridMerges;
    interactionModule: GridInteraction;
    groupModule: GridGroup;
    columnModule: GridColumn;
    eventEmitter: EventEmitter;
    constructor(props: {
        columns: Column[];
        list: ListItem[];
        options: TableOptions;
    });
    forceUpdate(): void;
    setRowKey(key: string | number): void;
    setRowMinHeight(minRowHeight: number): void;
    setRootEl(rootEl: HTMLElement | null): void;
    setClientEl(clientEl: HTMLElement | null): void;
    setList(list: ListItem[]): void;
    setCustomRender(customRender: CustomRender): void;
    setOriginList(list: ListItem[]): void;
    setTableEl(el: HTMLElement): void;
    getCheckboxRows(): Set<any> & Omit<Set<any>, keyof Set<any>>;
    addCheckboxRows(row: ListItem): void;
    deleteCheckboxRows(row: ListItem): void;
    addAllCheckboxRows(): void;
    clearCheckboxRows(): void;
    addRadioRow(row: ListItem): void;
    setState(data: GridState): void;
    setStateValue<T extends keyof GridState>(key: T, value: GridState[T]): void;
    getState<T extends keyof GridState>(key: T): Required<Pick<TableOptions, "align" | "textOverflowHeader" | "rowKey" | "minRowHeight" | "merges" | "groupConfig" | "headerAlign" | "verticalAlign" | "headerVerticalAlign" | "border" | "stripe" | "showTreeLine" | "selection" | "showHeader" | "textOverflow" | "highlightHoverRow" | "highlightHoverCol" | "highlightSelectRow" | "highlightSelectCol" | "highlightSelectCell" | "defaultExpandAll" | "headerRowClassName" | "headerRowStyle" | "headerCellClassName" | "headerCellStyle" | "rowClassName" | "rowStyle" | "cellClassName" | "cellStyle">>[T];
    initVirtualListRef(elRef: GridStore['virtualListRef']): void;
    calcGridScrollingStatus(scrollLeft: number, scrollWidth: number, clientWidth: number): void;
    calcFixedShadow(scrollLeft: number, scrollWidth: number, clientWidth: number): void;
    initOptions(options: TableOptions): void;
    initDataList(list: ListItem[], preserveScroll?: boolean): void;
    defaultSortConfig: TableOptions['defaultSort'];
    /**
     * 设置默认排序配置
     */
    setDefaultSort(config: TableOptions['defaultSort']): void;
    /**
     * 应用默认排序
     * 优先使用全局 defaultSort 配置，其次检查列的 sortOrder 配置
     */
    applyDefaultSort(): void;
    sortData(columnId: string, direction: 'ascend' | 'descend'): void;
}
export declare const useGridStore: (props?: GridProps) => GridStore;
export {};
