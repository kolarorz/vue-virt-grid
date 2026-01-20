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
}, {}, unknown, {}, {}, import("vue").ComponentOptionsMixin, import("vue").ComponentOptionsMixin, {}, string, import("vue").PublicProps, Readonly<import("vue").ExtractPropTypes<{
    column: {
        type: PropType<Column>;
        default: () => {};
    };
    row: {
        type: PropType<any>;
        default: () => {};
    };
}>>, {
    column: Column;
    row: any;
}, {}>;
export default _default;
