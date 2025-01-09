# 对齐方式

## 全局对齐方式

```ts
interface Options {
  align: 'left' | 'center' | 'right';
  headerAlign: 'left' | 'center' | 'right';

  verticalAlign: 'top' | 'middle' | 'bottom';
  headerVerticalAlign: 'top' | 'middle' | 'bottom';
}
```

<!<< ./AlignView.vue

## 指定列对齐方式

```ts
interface Column {
  align: 'left' | 'center' | 'right';
  headerAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'middle' | 'bottom';
  headerVerticalAlign: 'top' | 'middle' | 'bottom';
}
```

<!<< ./AlignColumnView.vue
