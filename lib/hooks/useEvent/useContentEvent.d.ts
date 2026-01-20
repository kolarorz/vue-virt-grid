import type { GridStore } from '@/src/store';
/**
 * @desc 表格内容区域相关事件，包含单元格、行、表头
 */
export declare const useContentEvent: (gridStore: GridStore) => {
    onClick: (e: MouseEvent) => void;
    onDblclick: (e: MouseEvent) => void;
    onContextmenu: (e: MouseEvent) => void;
    onMouseDown: (e: MouseEvent) => void;
};
