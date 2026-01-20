import { type PropType } from 'vue';
import { type ColumnItem, type ListItem } from '@/src/type';
declare const _default: import("vue").DefineComponent<{
    resizeObserver: {
        type: PropType<ResizeObserver | null>;
        default: null;
    };
    rowIndex: {
        type: NumberConstructor;
        default: number;
    };
    row: {
        type: PropType<any>;
        default: () => {};
    };
}, {
    gridStore: import("@/src/store").GridStore;
    maxHeight: import("vue").ComputedRef<any>;
    itemRefEl: import("vue").Ref<null>;
    getCellStyle: (column: ColumnItem) => string | undefined;
    getRowStyle: () => string | undefined;
    getRenderCell: ({ row, rowIndex, column, }: {
        row: ListItem;
        rowIndex: number;
        column: ColumnItem;
    }) => any;
    cls: {
        leftFixed: (column: ColumnItem) => (string | false | undefined)[];
        leftPadding: () => string[];
        main: (column: ColumnItem) => (string | false | undefined)[];
        rightPadding: () => string[];
        rightFixed: (column: ColumnItem) => (string | false | undefined)[];
        row: () => (string | false | 0 | undefined)[];
    };
}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    resizeObserver: {
        type: PropType<ResizeObserver | null>;
        default: null;
    };
    rowIndex: {
        type: NumberConstructor;
        default: number;
    };
    row: {
        type: PropType<any>;
        default: () => {};
    };
}>>, {
    rowIndex: number;
    row: any;
    resizeObserver: ResizeObserver | null;
}, {}>;
export default _default;
