import { reactive } from 'vue';
import type { GridStore } from '.';
import { CellType, type ListItem } from '@/src/type';
import { nanoid } from 'nanoid';
import { useTableEvent } from '@/src/hooks/useEvent/useTableEvent';

export class GridGroup {
  constructor(private store: GridStore) {
    //
  }
  groupState = reactive({
    // 父子显示的映射
    foldMap: {} as Record<string, boolean>,
    // 展开行显示的映射
    expandMap: {} as Record<string, boolean>,
  });

  groupFoldConstructor(list: ListItem[], conditions: { columnId: string; sort: 'desc' | 'asc' }[]) {
    console.log('groupFoldConstructor', list.length, conditions);
    return this.constructGroup(list, 0, conditions);
  }

  constructGroup(
    list: ListItem[],
    conditionIndex: number,
    conditions: { columnId: string; sort: 'desc' | 'asc' }[],
  ) {
    if (conditionIndex >= conditions.length) {
      return list;
    }

    const { columnId, sort } = conditions[conditionIndex];

    const sortedList = list.sort((a, b) => {
      if (sort === 'desc') {
        return (b[columnId] as string).localeCompare(a[columnId] as string);
      }
      return (a[columnId] as string).localeCompare(b[columnId] as string);
    });

    const res: ListItem[][] = [];
    let subGroup: ListItem[] = [];

    for (let i = 0; i < sortedList.length; i++) {
      const item = sortedList[i];
      if (item[columnId] === subGroup[subGroup.length - 1]?.[columnId]) {
        subGroup.push(item);
      } else {
        if (subGroup.length) {
          res.push(subGroup);
        }
        subGroup = [item];
      }
    }

    if (subGroup.length) {
      res.push(subGroup);
    }

    const groupList: ListItem[] = [];
    res.forEach((item) => {
      const v = item[0][columnId];
      groupList.push({
        id: `group-${columnId}-${nanoid(4)}`,
        type: 'group',
        columnId,
        name: v,
        children: this.constructGroup(item, conditionIndex + 1, conditions),
      });
    });

    return groupList;
  }

  generateFlatList(originList: ListItem[]) {
    const flattenList: ListItem[] = [];

    const { foldMap, expandMap } = this.groupState;

    const hasExpandCol = !!this.store.columnModule.flattedColumns.find(
      (col) => col.type === CellType.Expand,
    );

    const defaultExpandAll = this.store.getState('defaultExpandAll');

    this.store.gridRowMap = {};

    let level = 0;
    let groupLevel = 0;
    const flat = (list: ListItem[], isGroup = false) => {
      list.forEach((item, index) => {
        if (isGroup) {
          groupLevel += 1;
        }

        // const row = { ...item, level, groupLevel, isLastChild: index === list.length - 1 };
        // 需要用原始对象，否则不能响应式
        const row = Object.assign(item, {
          level,
          groupLevel,
          isLastChild: index === list.length - 1,
        });
        flattenList.push(row);
        this.store.gridRowMap[row.id] = row;

        if (item?.children && item?.children?.length > 0) {
          level += 1;
          foldMap[item.id] = !defaultExpandAll;
          if (defaultExpandAll) {
            flat(item.children, item.type === 'group');
          }
          level -= 1;
        }

        if (hasExpandCol) {
          expandMap[item.id] = !!defaultExpandAll;
          if (defaultExpandAll) {
            this.store.gridRowMap[`${item.id}-expand`] = {
              id: `${item.id}-expand`,
              type: 'expand',
            };
          }
        }

        if (expandMap[item.id]) {
          flattenList.push(this.store.gridRowMap[`${item.id}-expand`]);
        }
        if (isGroup) {
          groupLevel -= 1;
        }
      });
    };
    flat(originList);

    return flattenList;
  }

  resetFlatList(originList: ListItem[]) {
    const flattenList: ListItem[] = [];
    const { foldMap, expandMap } = this.groupState;

    let level = 0;
    let groupLevel = 0;
    const flat = (list: ListItem[], isGroup = false) => {
      list.forEach((item, index) => {
        if (isGroup) {
          groupLevel += 1;
        }

        // const row = { ...item, level, groupLevel, isLastChild: index === list.length - 1 };
        // 需要用原始对象，否则不能响应式
        const row = Object.assign(item, {
          level,
          groupLevel,
          isLastChild: index === list.length - 1,
        });
        flattenList.push(row);
        this.store.gridRowMap[row.id] = row;

        if (foldMap[item.id] === false && item?.children && item?.children?.length > 0) {
          level += 1;
          flat(item.children, item.type === 'group');
          level -= 1;
        }
        if (expandMap[item.id]) {
          flattenList.push(this.store.gridRowMap[`${item.id}-expand`]);
        }
        if (isGroup) {
          groupLevel -= 1;
        }
      });
    };
    flat(originList);

    this.store.setList(flattenList || []);
  }

  toggleFold(id: string) {
    const { foldMap } = this.groupState;
    foldMap[id] = !foldMap[id];
    this.resetFlatList(this.store.originList);
  }

  toggleExpand(id: string) {
    const tableEvents = useTableEvent(this.store);
    const { expandMap } = this.groupState;
    expandMap[id] = !expandMap[id];
    if (expandMap[id] && !this.store.gridRowMap[`${id}-expand`]) {
      this.store.gridRowMap[`${id}-expand`] = { id: `${id}-expand`, type: 'expand' };
    }

    // TODO yihuang 优化下性能用一次遍历解决
    const expandedRowKeys = Object.keys(expandMap)
      .filter((key) => !!expandMap[key])
      .map((id) => this.store.gridRowMap[id]);

    tableEvents.onExpandChange({ row: this.store.gridRowMap[id], expandedRows: expandedRowKeys });
    this.resetFlatList(this.store.originList);
  }
}
