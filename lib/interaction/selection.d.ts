import type { GridStore } from '@/src/store';
export declare class GridSelection {
    private store;
    container?: HTMLElement;
    boxArea: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
    id: string;
    startPos: {
        rowIndex: number;
        colIndex: number;
    };
    lastClickPos?: {
        rowIndex: number;
        colIndex: number;
    };
    lastShiftClickPos?: {
        rowIndex: number;
        colIndex: number;
    };
    callbackFunc: any;
    isMetaKey: boolean;
    isShiftKey: boolean;
    constructor(store: GridStore);
    init(el: HTMLElement): void;
    on(fn: any): void;
    reset(): void;
    preventContextMenu: (e: MouseEvent) => void;
    onMousedown: (e: MouseEvent) => void;
    onMouseOver: (e: MouseEvent) => void;
    onMouseup: () => void;
    emitChange(): void;
    destroy(): void;
}
