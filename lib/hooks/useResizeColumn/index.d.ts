import './index.scss';
import type { ColumnItem } from '@/src/type';
export declare const clearResizeLine: () => void;
export declare function useResizeColumn(columnEl: HTMLElement, headerInfo: ColumnItem, tableEl: HTMLElement, cb: (width: number) => void): void;
