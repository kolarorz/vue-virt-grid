import type { GridStore } from '@/src/store';
import { type SelectedCells } from '@/src/type';
export declare const useTableEvent: (gridStore: GridStore) => {
    onExpandChange(data: {
        row: any;
        expandedRows: any[];
    }): void;
    onCellSelection(data: {
        areas: SelectedCells[][];
        cells: SelectedCells[];
    }): void;
};
