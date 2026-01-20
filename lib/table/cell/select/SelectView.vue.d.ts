import { type PropType } from 'vue';
import { type Column } from '@/src/type';
declare const _default: import("vue").DefineComponent<{
    column: {
        type: PropType<Column>;
        default: () => {};
    };
    row: {
        type: PropType<any>;
        default: () => {};
    };
    tdData: {
        type: PropType<any>;
        default: () => {};
    };
    height: {
        type: NumberConstructor;
    };
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    column: {
        type: PropType<Column>;
        default: () => {};
    };
    row: {
        type: PropType<any>;
        default: () => {};
    };
    tdData: {
        type: PropType<any>;
        default: () => {};
    };
    height: {
        type: NumberConstructor;
    };
}>>, {
    column: Column;
    row: any;
    tdData: any;
}, {}>;
export default _default;
