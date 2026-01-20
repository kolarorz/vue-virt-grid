import { type App } from 'vue';
import { GridStore } from '@/src/store';
declare class PopperStore {
    gridStore: GridStore;
    coverEl: HTMLElement | null;
    coverApp: App | null;
    dropdownEl: HTMLElement | null;
    dropdownApp: App | null;
    tdData: any;
    constructor(gridStore: GridStore);
    coverRender(tdData: any): void;
    toggleDropdownRender(): void;
    dropdownRender(tdData: any): void;
    remove(): void;
}
export { PopperStore };
