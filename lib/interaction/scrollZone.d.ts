import type { GridStore } from '@/src/store';
export declare class GridScrollZone {
    private store;
    container?: HTMLElement;
    scrollUpZone: HTMLElement;
    scrollDownZone: HTMLElement;
    scrollIntervalTimer: number;
    speed: number;
    lastDirection: number;
    constructor(store: GridStore);
    init(container: HTMLElement): void;
    scrollUp(offset: number, base?: number): void;
    scrollDown(offset: number, base?: number): void;
    onListScrollUp(): void;
    onListScrollDown(): void;
    handler: (e: MouseEvent) => void;
    append(): void;
    remove(): void;
}
