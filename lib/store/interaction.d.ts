import type { GridStore } from '.';
import { type Column } from '@/src/type';
import { GridSelection } from '@/src/interaction/selection';
import { GridScrollZone } from '@/src/interaction/scrollZone';
export type ISelectionBorderPos = 'left-top' | 'top' | 'right-top' | 'right' | 'right-bottom' | 'bottom' | 'left-bottom' | 'left' | 'center';
interface IInteractionProps {
    selectBoxes: Record<string, {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }>;
    selectCellBorderMap: Record<string, ISelectionBorderPos[]>;
    selectCellClassMap: Record<string, string>;
}
export declare class GridInteraction {
    private store;
    gridSelection: GridSelection;
    gridScrollZone: GridScrollZone;
    constructor(store: GridStore);
    interactionState: import("vue").ShallowReactive<IInteractionProps>;
    selectRowId: import("vue").Ref<string>;
    selectColId: import("vue").Ref<string>;
    initSelectionElement(el: HTMLElement): void;
    getSelectRow(): string;
    setSelectRow(rowIndex: number): void;
    getSelectCol(): string;
    setSelectCol(colIndex: number): void;
    clearSelect(): void;
    getSelectionClass(rowIndex: number, column: Column): string;
    selectCellClassConstructor(selectRenderMap: Record<string, ISelectionBorderPos[]>, rowIndex: number, colIndex: number, rowspan?: number, colspan?: number): string;
    expandMergedSelectArea(area: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }): {
        left: number;
        top: number;
        right: number;
        bottom: number;
    };
    handleSelectionChange: (id: string, area: {
        left: number;
        top: number;
        right: number;
        bottom: number;
    }, isMultiple: boolean) => void;
    setRowSelection(areaId: string | undefined, startRowIndex: number, endRowIndex: number, isMulti: boolean): void;
    setColumnSelection(areaId: string | undefined, startColumnIndex: number, endColumnIndex: number, isMulti: boolean): void;
}
export {};
