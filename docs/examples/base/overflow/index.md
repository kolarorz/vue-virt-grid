# 溢出隐藏(TODO: tooltip 还没实现)

## body-cell

```ts
// ellipsis 当内容溢出时显示为省略号
// title [推荐！性能好!] 当内容溢出时显示为省略号并用原生 title 显示
// tooltip 当内容溢出时显示为省略号并用 tooltip 显示
interface Options {
  textOverflow: 'ellipsis' | 'title' | 'tooltip';
}
```

<!<< ./OverflowView.vue

## header-cell

```ts
// ellipsis 当内容溢出时显示为省略号
// title [推荐！性能好!] 当内容溢出时显示为省略号并用原生 title 显示
// tooltip 当内容溢出时显示为省略号并用 tooltip 显示
interface Options {
  textOverflowHeader: 'ellipsis' | 'title' | 'tooltip';
}
```

<!<< ./OverflowHeaderView.vue
