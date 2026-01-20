import { type MergeCell } from '@/src/type';
export declare function isInMergeCell(mergeInfo: MergeCell, rowIndex: number, colIndex: number): boolean;
export declare const mergeMethods: (rowIndex: number, colIndex: number) => {
    rowIndex: number;
    colIndex: number;
    rowspan: number;
    colspan: number;
} | null;
export declare function getMergeInfo(merges: MergeCell[], rowIndex: number, colIndex: number): MergeCell | null;
/**
 * @description
 *  calcRenderRect计算实际渲染的区域和边界并收集合并单元格信息
 *  该函数会在render之前被调用，以便计算实际渲染的区域和边界合并单元格
 *  该函数返回的是一个对象，包含了渲染的区域和边界合并单元格
 * @param merges {MergeCell[]}  - 合并单元格的信息
 * @param originRect {Object}  - 可视区域的信息
 * @return {
 *    renderRect: { ys: number; ye: number; xs: number; xe: number },
 *    merges: { topMerges: MergeCell[], leftMerges: MergeCell[], rightMerges: MergeCell[], bottomMerges: MergeCell[] }
 * }  - 一个对象，包含了渲染的区域和边界合并单元格
 */
export declare function calcRenderRect(merges: MergeCell[], originRect: {
    ys: number;
    ye: number;
    xs: number;
    xe: number;
}): {
    renderRect: {
        ys: number;
        ye: number;
        xs: number;
        xe: number;
    };
    merges: {
        topMerges: MergeCell[];
        leftMerges: MergeCell[];
        rightMerges: MergeCell[];
        bottomMerges: MergeCell[];
    };
};
