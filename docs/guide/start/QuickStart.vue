<template>
  <Grid :list="list" :columns="columns"> </Grid>
</template>
<script setup>
import { Grid } from 'vue-virt-grid';
const list = [
  {
    id: '1',
    field1: '11',
    field2: '12',
    field3: '13',
    field4: '14',
    field5: '15',
  },
  {
    id: '2',
    field1: '21',
    field2: '22',
    field3: '23',
    field4: '24',
    field5: '25',
  },
  {
    id: '3',
    field1: '31',
    field2: '32',
    field3: '33',
    field4: '34',
    field5: '35',
  },
  {
    id: '4',
    field1: '41',
    field2: '42',
    field3: '43',
    field4: '44',
    field5: '45',
  },
];
const columns = [
  {
    field: 'field1',
    title: 'Field1',
  },
  {
    field: 'field2',
    title: 'Field2',
  },
  {
    field: 'field3',
    title: 'Field3',
  },
  {
    field: 'field4',
    title: 'Field4',
  },
  {
    field: 'field5',
    title: 'Field5',
  },
];
</script>
