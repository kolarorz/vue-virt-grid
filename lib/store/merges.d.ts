import type { GridStore } from '.';
import type { MergeCell } from '@/src/type';
export type BodyMergeMap = Record<string, Record<string, MergeCell>>;
export declare class GridMerges {
    private store;
    merges: MergeCell[];
    tempMerges: MergeCell[];
    bodyMergeMap: BodyMergeMap;
    readonly mergeState: {
        originRect: {
            ys: number;
            ye: number;
            xs: number;
            xe: number;
        };
        renderRect: {
            ys: number;
            ye: number;
            xs: number;
            xe: number;
        };
    };
    constructor(store: GridStore);
    setMerges(merges?: MergeCell[]): void;
    calcRect(horizontal?: boolean): {
        ys: number;
        ye: number;
    };
    mergeFunction(rowIndex: number, colIndex: number): {
        rowspan: number;
        colspan: number;
    } | undefined;
    mergeMapConstructor(cellList: MergeCell[]): void;
    mergeMapConstructorWithFunction(): void;
}
