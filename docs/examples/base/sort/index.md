# 排序

点击表头可以对该列进行排序，支持升序、降序和取消排序。

## 配置说明

```ts
interface Column {
  sort?: {
    sortDirections: ('ascend' | 'descend')[];
    sortOrder: 'ascend' | 'descend' | boolean;
    sorter: boolean | ((a: ListItem, b: ListItem, extra: { id: string; direction: 'ascend' | 'descend' }) => number);
    sortMode?: 'button' | 'toggle';
    sortOnHeaderClick?: boolean;
    sortIcon?: (data: {
      direction: 'ascend' | 'descend';
      isActive: boolean;
      onClick: () => void;
    }) => VNode | JSX.Element;
  };
}
```

- `sortDirections`: 支持的排序方向数组
- `sortOrder`: 初始排序状态
- `sorter`: 
  - `true`: 使用默认排序（按字段值排序）
  - 函数: 自定义排序函数
- `sortMode`: 排序模式
  - 默认为 `button` 模式
  - `button`: 同时显示升序降序按钮，两个按钮能分开点击
  - `toggle`: 默认不显示升序降序按钮，点表头第一下是升序，展示升序按钮，点第二下是降序，展示降序按钮，点第三下取消排序，排序icon 消失
- `sortOnHeaderClick`: 控制点击按钮之外的表头其他位置是否触发排序
  - `true`: 点击表头可触发排序（默认：`toggle` 模式为 `true`，`button` 模式为 `false`）
  - `false`: 点击表头不触发排序
- `sortIcon`: 自定义排序图标/按钮渲染函数
  - 函数接收参数：`{ direction: 'ascend' | 'descend', isActive: boolean, onClick: () => void }`
  - 返回 `VNode` 或 `JSX.Element`
  - 如果不提供，则使用默认的箭头图标

## 默认排序配置

通过表格全局配置 `defaultSort` 可以指定表格初始化时的默认排序：

```ts
interface TableOptions {
  defaultSort?: {
    field: string;  // 排序的列字段
    order: 'ascend' | 'descend';  // 排序方向
    sorter?: (  // 自定义排序函数（可选）
      a: ListItem,
      b: ListItem,
      extra: { field: string; direction: 'ascend' | 'descend' }
    ) => number;
  };
}
```

- `field`: 指定要排序的列字段名
- `order`: 指定排序方向，`ascend` 升序，`descend` 降序
- `sorter`: 可选的自定义排序函数
  - 如果不提供，会优先使用列配置中的 `sorter`
  - 如果列配置也没有，则使用默认排序（按字段值比较）

使用示例：

```vue
<GridTable
  :list="list"
  :defaultSort="{
    field: 'salary',
    order: 'descend',
    sorter: (a, b) => a.salary - b.salary,
  }"
>
  <!-- columns -->
</GridTable>
```

## 按钮模式 (button)

<!<< ./SortButtonView.vue

## 切换模式 (toggle)

<!<< ./SortToggleView.vue

## 控制表头点击行为

<!<< ./SortHeaderClickView.vue

## 自定义排序图标/按钮

<!<< ./SortCustomIconView.vue

## 完整示例

包含索引、边框、斑马纹、自定义表头 icon、按钮控制排序、自定义列排序规则、带操作按钮列、左右冻结列、**默认排序（按薪资降序）** 于一体的完整示例：

<!<< ./SortCompleteView.vue
