<template>
  <div class="vtg-th-cell vtg-th-cell__index">
    {{ column.title }}
  </div>
</template>
<script setup lang="ts">
import type { ColumnItem } from '@/src/type';
defineProps<{
  column: ColumnItem;
}>();
</script>
<style></style>
