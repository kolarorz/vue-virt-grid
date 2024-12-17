import { createApp, nextTick, type App } from 'vue';
import { createPopper } from '@/src/popper/popper';
import { GridStore } from '@/src/store';
import { isFunction } from 'lodash-es';

class PopperStore {
  gridStore: GridStore;
  coverEl: HTMLElement | null = null;
  coverApp: App | null = null;
  dropdownEl: HTMLElement | null = null;
  dropdownApp: App | null = null;
  tdData: any;

  constructor(gridStore: GridStore) {
    this.gridStore = gridStore;

    this.coverEl = document.createElement('div');
    this.coverEl.classList.add('vtg-popper-container');
    // TODO 需要判断是否有激活单元格选项配置
    // this.coverEl.classList.add('vtg-popper-container--cover');
    this.coverEl.addEventListener('click', this.toggleDropdownRender.bind(this));

    this.dropdownEl = document.createElement('div');
    this.dropdownEl.classList.add('vtg-popper-container');
  }

  coverRender(tdData: any) {
    this.tdData = tdData;

    if (!this.coverEl || !this.gridStore.clientEl) return;
    if (!isFunction(tdData?.column?.cellCoverRender)) {
      // 这里判断一下，没有cover，如果只有dropdown，那就直接渲染dropdown
      this.dropdownRender(tdData);
      return;
    }
    this.coverApp = createApp({
      render: () =>
        tdData.column.cellCoverRender?.(tdData, () => {
          this.remove();
        }),
    });
    createPopper({
      reference: tdData.el,
      mountEl: this.gridStore.clientEl,
      popperContainer: this.coverEl,
      popper: this.coverApp,
      isCover: true,
    });
  }

  toggleDropdownRender() {
    console.log('111', this.tdData);
    if (!this.dropdownEl) return;
    console.log('toggleDropdownRender', this.dropdownEl, this.dropdownApp);

    if (this.dropdownApp && this.gridStore.clientEl?.contains(this.dropdownEl)) {
      this.gridStore.clientEl?.removeChild(this.dropdownEl);
    } else if (this.dropdownApp) {
      this.gridStore.clientEl?.appendChild(this.dropdownEl);
    } else {
      this.dropdownRender(this.tdData);
    }
  }

  dropdownRender(tdData: any) {
    if (!this.coverEl || !this.dropdownEl || !this.gridStore.clientEl) return;
    if (!isFunction(tdData?.column?.cellDropdownRender)) return;

    this.dropdownApp = createApp({
      render: () => tdData.column.cellDropdownRender?.(tdData),
    });

    createPopper({
      reference: this.coverEl,
      mountEl: this.gridStore.clientEl,
      popperContainer: this.dropdownEl,
      popper: this.dropdownApp,
      isCover: false,
    });
  }

  remove() {
    console.log('remove');
    if (this.coverEl && this.gridStore.clientEl?.contains(this.coverEl)) {
      this.gridStore.clientEl?.removeChild(this.coverEl);
      this.coverApp = null;
      this.coverEl.removeEventListener('click', this.toggleDropdownRender);
    }
    if (this.dropdownEl && this.gridStore.clientEl?.contains(this.dropdownEl)) {
      this.gridStore.clientEl?.removeChild(this.dropdownEl);
      this.dropdownApp = null;
    }
  }
}

export { PopperStore };
