import type { GridStore } from '.';
import { type ListItem } from '@/src/type';
export declare class GridGroup {
    private store;
    constructor(store: GridStore);
    groupState: {
        foldMap: Record<string, boolean>;
        expandMap: Record<string, boolean>;
    };
    groupFoldConstructor(list: ListItem[], conditions: {
        columnId: string;
        sort: 'desc' | 'asc';
    }[]): any[];
    constructGroup(list: ListItem[], conditionIndex: number, conditions: {
        columnId: string;
        sort: 'desc' | 'asc';
    }[]): any[];
    generateFlatList(originList: ListItem[]): any[];
    resetFlatList(originList: ListItem[]): void;
    toggleFold(id: string): void;
    toggleExpand(id: string): void;
}
