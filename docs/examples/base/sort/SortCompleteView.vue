<template>
  <div class="base-view">
    <div style="width: 100%; height: 600px; border: 2px solid var(--el-color-border)">
      <div style="padding: 16px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px; color: #333;">指定列：</span>
          <ElSelect
            :model-value="selectedColumnId || undefined"
            placeholder="请选择列"
            style="width: 200px;"
            clearable
            @change="handleColumnChange"
          >
            <ElOption
              v-for="col in sortableColumns"
              :key="col.field"
              :label="col.title"
              :value="col.field"
            />
          </ElSelect>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 14px; color: #333;">排序：</span>
          <ElButtonGroup>
            <ElButton
              :type="sortDirection === 'ascend' ? 'primary' : 'default'"
              :disabled="!selectedColumnId"
              @click="handleSort('ascend')"
            >
              升序
            </ElButton>
            <ElButton
              :type="sortDirection === 'descend' ? 'primary' : 'default'"
              :disabled="!selectedColumnId"
              @click="handleSort('descend')"
            >
              降序
            </ElButton>
            <ElButton
              :disabled="!selectedColumnId || !sortDirection"
              @click="handleSort(null)"
            >
              取消排序
            </ElButton>
          </ElButtonGroup>
        </div>
        <ElButton type="success" @click="handlePrintData">
          打印数据
        </ElButton>
      </div>
      <hr>
      <GridTable
        ref="gridTableRef"
        :list="sortedList"
        border
        stripe
        :showTreeLine="false"
        :minRowHeight="50"
        :defaultSort="defaultSortConfig"
      >
        <GridTableColumn
          type="index"
          field="index"
          title="#"
          :width="60"
          fixed="left"
          align="center"
        />

        <GridTableColumn
          field="name"
          title="姓名"
          :width="150"
          fixed="left"
          :resizable="true"
          :minWidth="100"
          :maxWidth="220"
          :sort="{
            sortDirections: ['ascend', 'descend'],
            sortOrder: false,
            sorter: true,
            sortMode: 'button',
          }"
        >
          <template #sortIcon="{ direction, isActive, onClick }">
            <span
              :class="[
                'custom-sort-icon',
                {
                  'is-active': isActive,
                  'is-clickable': onClick !== undefined,
                },
              ]"
              :style="{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                lineHeight: '14px',
                textAlign: 'center',
                marginLeft: '4px',
                cursor: onClick !== undefined ? 'pointer' : 'default',
                color: isActive ? '#1890ff' : '#bfbfbf',
                transition: 'color 0.2s',
                fontSize: '11px',
                fontWeight: 'bold',
              }"
              @click.stop="onClick?.()"
            >
              {{ direction === 'ascend' ? '▲' : '▼' }}
            </span>
          </template>
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px; padding: 4px 0;">
              <div
                style="
                  width: 32px;
                  height: 32px;
                  border-radius: 50%;
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: #fff;
                  font-size: 14px;
                  font-weight: bold;
                  flex-shrink: 0;
                "
              >
                {{ row.name.charAt(0) }}
              </div>
              <div>
                <div style="font-size: 14px; font-weight: 500; color: #333;">
                  {{ row.name }}
                </div>
                <div style="font-size: 12px; color: #999;">
                  ID: {{ row.id }}
                </div>
              </div>
            </div>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="age"
          title="年龄"
          :width="100"
          align="center"
          :resizable="true"
          :minWidth="60"
          :maxWidth="150"
          :sort="{
            sortDirections: ['ascend', 'descend'],
            sortOrder: false,
            sorter: ageSorter,
            sortMode: 'button',
          }"
        >
          <template #sortIcon="{ direction, isActive, onClick }">
            <span
              :class="[
                'custom-sort-icon',
                {
                  'is-active': isActive,
                  'is-clickable': onClick !== undefined,
                },
              ]"
              :style="{
                display: 'inline-block',
                width: '14px',
                height: '14px',
                lineHeight: '14px',
                textAlign: 'center',
                marginLeft: '4px',
                cursor: onClick !== undefined ? 'pointer' : 'default',
                color: isActive ? '#1890ff' : '#bfbfbf',
                transition: 'color 0.2s',
                fontSize: '11px',
                fontWeight: 'bold',
              }"
              @click.stop="onClick?.()"
            >
              {{ direction === 'ascend' ? '▲' : '▼' }}
            </span>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="department"
          title="部门"
          :width="150"
          :resizable="true"
          :minWidth="100"
          :maxWidth="250"
          :sort="{
            sortDirections: ['ascend', 'descend'],
            sortOrder: false,
            sorter: true,
            sortMode: 'button',
            sortOnHeaderClick: true,
          }"
        >
          <template #default="{ row }">
            <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px 0;">
              <div style="font-weight: 500; font-size: 14px;">
                {{ row.department }}
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
                <span
                  v-for="tag in row.tags"
                  :key="tag"
                  style="
                    display: inline-block;
                    padding: 2px 8px;
                    background: #f0f0f0;
                    border-radius: 4px;
                    font-size: 11px;
                    color: #666;
                  "
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="city"
          title="城市"
          :width="100"
          :resizable="true"
          :minWidth="60"
          :maxWidth="150"
          :sort="{
            sortDirections: ['ascend', 'descend'],
            sortOrder: false,
            sorter: true,
            sortMode: 'button',
          }"
        />

        <GridTableColumn
          field="inputValue"
          title="输入框"
          :width="180"
          :resizable="true"
          :minWidth="120"
          :maxWidth="250"
        >
          <template #cover="{ row }">
            <ElInput
              v-model="row.inputValue"
              style="width: 100%;"
              placeholder="请输入"
              size="small"
            />
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="selectValue"
          title="下拉选择"
          :width="180"
          :resizable="true"
          :minWidth="120"
          :maxWidth="250"
        >
          <template #cover="{ row }">
            <ElSelect
              v-model="row.selectValue"
              style="width: 100%;"
              size="small"
              placeholder="请选择"
            >
              <ElOption label="选项一" value="option1" />
              <ElOption label="选项二" value="option2" />
              <ElOption label="选项三" value="option3" />
            </ElSelect>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="checkboxValue"
          title="复选框"
          :width="100"
          align="center"
          :resizable="true"
          :minWidth="80"
          :maxWidth="150"
        >
          <template #default="{ row }">
            <ElCheckbox v-model="row.checkboxValue" />
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="radioValue"
          title="单选框"
          :width="150"
          align="center"
          :resizable="true"
          :minWidth="100"
          :maxWidth="200"
        >
          <template #default="{ row }">
            <ElRadioGroup v-model="row.radioValue" size="small">
              <ElRadio value="radio1">选项1</ElRadio>
              <ElRadio value="radio2">选项2</ElRadio>
              <ElRadio value="radio3">选项3</ElRadio>
            </ElRadioGroup>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="switchValue"
          title="开关"
          :width="100"
          align="center"
          :resizable="true"
          :minWidth="80"
          :maxWidth="150"
        >
          <template #default="{ row }">
            <ElSwitch v-model="row.switchValue" />
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="dateValue"
          title="日期选择"
          :width="180"
          :resizable="true"
          :minWidth="140"
          :maxWidth="250"
        >
          <template #default="{ row }">
            <div style="padding: 4px 0; color: #333; font-size: 13px;">
              {{ row.dateValue }}
            </div>
          </template>
          <template #cover="{ row }">
            <ElDatePicker
              v-model="row.dateValue"
              value-format="YYYY-MM-DD"
              style="width: 100%;"
              size="small"
              placeholder="选择日期"
              type="date"
            />
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="complex"
          title="复合组件"
          :width="280"
          :resizable="true"
          :minWidth="200"
          :maxWidth="400"
        >
          <template #cover="{ row }">
            <div style="display: flex; flex-direction: column; gap: 8px; padding: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <ElInput
                  v-model="row.inputValue"
                  placeholder="输入框"
                  size="small"
                  style="flex: 1;"
                />
                <ElSelect
                  v-model="row.selectValue"
                  size="small"
                  style="width: 120px;"
                  placeholder="选择"
                >
                  <ElOption label="选项一" value="option1" />
                  <ElOption label="选项二" value="option2" />
                  <ElOption label="选项三" value="option3" />
                </ElSelect>
              </div>
              <div style="display: flex; align-items: center; gap: 12px;">
                <ElCheckbox v-model="row.checkboxValue">复选框</ElCheckbox>
                <ElSwitch v-model="row.switchValue" />
                <ElDatePicker
                  v-model="row.dateValue"
                  value-format="YYYY-MM-DD"
                  size="small"
                  style="flex: 1;"
                  type="date"
                />
              </div>
              <div style="display: flex; gap: 8px;">
                <ElButton size="small" type="primary">
                  保存
                </ElButton>
                <ElButton size="small">取消</ElButton>
              </div>
            </div>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="salary"
          title="薪资"
          :width="120"
          align="right"
          :resizable="true"
          :minWidth="80"
          :maxWidth="200"
          :sort="{
            sortDirections: ['ascend', 'descend'],
            sortOrder: false,
            sorter: salarySorter,
            sortMode: 'button',
          }"
        />

        <GridTableColumn
          field="status"
          title="状态"
          :width="120"
          align="center"
          :resizable="true"
          :minWidth="80"
          :maxWidth="180"
          :sort="{
            sortDirections: ['ascend', 'descend'],
            sortOrder: false,
            sorter: statusSorter,
            sortMode: 'button',
          }"
        >
          <template #default="{ row }">
            <div
              :style="{
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500',
                color: getStatusConfig(row.status).color,
                background: getStatusConfig(row.status).bg,
                border: `1px solid ${getStatusConfig(row.status).color}33`,
              }"
            >
              {{ row.status }}
            </div>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="description"
          title="工作描述"
          :width="250"
          :resizable="true"
          :minWidth="150"
          :maxWidth="400"
        >
          <template #default="{ row }">
            <div style="padding: 8px 0; line-height: 1.6; font-size: 13px; color: #333;">
              {{ row.description || '' }}
            </div>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="skills"
          title="技能"
          :width="200"
          :resizable="true"
          :minWidth="120"
          :maxWidth="300"
        >
          <template #default="{ row }">
            <div style="display: flex; flex-wrap: wrap; gap: 6px; padding: 6px 0;">
              <span
                v-for="skill in row.skills"
                :key="skill"
                style="
                  display: inline-block;
                  padding: 4px 10px;
                  background: #e6f7ff;
                  border: 1px solid #91d5ff;
                  border-radius: 12px;
                  font-size: 12px;
                  color: #1890ff;
                "
              >
                {{ skill }}
              </span>
            </div>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="email"
          title="联系方式"
          :width="220"
          :resizable="true"
          :minWidth="150"
          :maxWidth="350"
        >
          <template #default="{ row }">
            <div style="display: flex; flex-direction: column; gap: 6px; padding: 6px 0;">
              <div style="font-size: 13px; color: #1890ff;">
                📧 {{ row.email }}
              </div>
              <div style="font-size: 13px; color: #666;">
                📱 {{ row.phone }}
              </div>
            </div>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="projects"
          title="参与项目"
          :width="180"
          :resizable="true"
          :minWidth="120"
          :maxWidth="280"
        >
          <template #default="{ row }">
            <div v-if="!row.projects || row.projects.length === 0" style="padding: 6px 0; color: #999; font-size: 12px; font-style: italic;">
              暂无项目
            </div>
            <div v-else style="display: flex; flex-direction: column; gap: 4px; padding: 6px 0;">
              <div
                v-for="project in row.projects"
                :key="project"
                style="display: flex; align-items: center; gap: 6px; font-size: 13px;"
              >
                <span
                  style="
                    display: inline-block;
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #52c41a;
                  "
                />
                <span>{{ project }}</span>
              </div>
            </div>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="joinDate"
          title="入职日期"
          :width="120"
          :resizable="true"
          :minWidth="100"
          :maxWidth="180"
          :sort="{
            sortDirections: ['ascend', 'descend'],
            sortOrder: false,
            sorter: joinDateSorter,
            sortMode: 'button',
          }"
        />

        <GridTableColumn
          field="departmentSelect"
          title="部门选择器"
          :width="180"
          :resizable="true"
          :minWidth="140"
          :maxWidth="250"
          :sort="{
            sortDirections: ['ascend', 'descend'],
            sortOrder: false,
            sorter: true,
            sortMode: 'button',
          }"
        >
          <template #cover="{ row }">
            <ElSelect
              v-model="row.departmentSelect"
              size="small"
              style="width: 100%;"
              placeholder="请选择部门"
              filterable
              clearable
            >
              <ElOption
                v-for="dept in departments"
                :key="dept"
                :label="dept"
                :value="dept"
              />
            </ElSelect>
          </template>
        </GridTableColumn>

        <GridTableColumn
          field="actions"
          title="操作"
          :width="180"
          fixed="right"
          align="center"
        >
          <template #default="{ row }">
            <div style="display: flex; gap: 8px; justify-content: center;">
              <ElButton size="small" type="primary" @click="() => handleEdit(row)">
                编辑
              </ElButton>
              <ElButton size="small" type="danger" @click="() => handleDelete(row)">
                删除
              </ElButton>
            </div>
          </template>
        </GridTableColumn>
      </GridTable>
    </div>
  </div>
</template>

<script setup lang="tsx">
import { ref, computed } from 'vue';
import { GridTable, GridTableColumn, type ListItem } from 'vue-virt-grid';

import {
  ElInput,
  ElSelect,
  ElOption,
  ElCheckbox,
  ElRadio,
  ElRadioGroup,
  ElDatePicker,
  ElSwitch,
  ElButton,
  ElButtonGroup,
} from 'element-plus';
import 'element-plus/dist/index.css';

// 部门选项
const departments = ['技术部', '产品部', '设计部', '运营部', '市场部', '人事部', '财务部'];

const generateList = (length = 100) =>
  Array.from({ length }).map((_, rowIndex) => {
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'];
    const statuses = ['在职', '离职', '试用期'];
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都'];
    const tags = ['前端', '后端', '全栈', '架构师', '高级', '资深', '专家'];
    const descriptions = [
      '负责核心业务系统开发，参与技术方案设计',
      '负责前端架构优化，提升用户体验和性能',
      '负责后端服务开发，处理高并发场景',
      '负责全栈开发，包括前端和后端系统',
      '负责系统架构设计，技术选型和团队管理',
      '负责产品功能开发，与产品经理协作',
      '负责代码审查，技术培训和团队建设',
    ];

    const nameIndex = rowIndex % names.length;
    const nameSuffix = Math.floor(rowIndex / names.length) > 0 ? Math.floor(rowIndex / names.length) : '';
    const tagCount = (rowIndex % 4) + 1;
    const descriptionIndex = rowIndex % descriptions.length;
    const hasLongDescription = rowIndex % 3 === 0;

    return {
      id: `row-${rowIndex}`,
      parentId: null,
      name: names[nameIndex] + nameSuffix,
      age: 20 + (rowIndex % 30),
      department: departments[rowIndex % departments.length],
      salary: 5000 + (rowIndex % 20) * 1000,
      status: statuses[rowIndex % statuses.length],
      city: cities[rowIndex % cities.length],
      email: `user${rowIndex}@example.com`,
      phone: `138${String(rowIndex).padStart(8, '0')}`,
      joinDate: `202${rowIndex % 4}-${String((rowIndex % 12) + 1).padStart(2, '0')}-${String((rowIndex % 28) + 1).padStart(2, '0')}`,
      tags: tags.slice(0, tagCount),
      description: hasLongDescription
        ? `${descriptions[descriptionIndex]}。这是一个比较长的描述内容，用来展示单元格可以包含多行文本，并且不同行的内容长度不同，从而产生不同的行高。`
        : descriptions[descriptionIndex],
      skills: ['Vue', 'React', 'TypeScript', 'Node.js', 'Python', 'Java'].slice(0, (rowIndex % 3) + 2),
      projects: rowIndex % 5 === 0 ? ['项目A', '项目B', '项目C'] : rowIndex % 3 === 0 ? ['项目A'] : [],
      inputValue: `输入值${rowIndex}`,
      selectValue: rowIndex % 3 === 0 ? 'option1' : rowIndex % 3 === 1 ? 'option2' : 'option3',
      checkboxValue: rowIndex % 2 === 0,
      radioValue: rowIndex % 3 === 0 ? 'radio1' : rowIndex % 3 === 1 ? 'radio2' : 'radio3',
      switchValue: rowIndex % 2 === 0,
      dateValue: `202${rowIndex % 4}-${String((rowIndex % 12) + 1).padStart(2, '0')}-${String((rowIndex % 28) + 1).padStart(2, '0')}`,
      departmentSelect: departments[rowIndex % departments.length], // 用于部门选择器
    };
  });

const ageSorter = (_a: ListItem, _b: ListItem) => {
  return (_a.age as number) - (_b.age as number);
};

const salarySorter = (_a: ListItem, _b: ListItem) => {
  const salaryA = _a.salary as number;
  const salaryB = _b.salary as number;
  if (salaryA === salaryB) return 0;
  return salaryA > salaryB ? 1 : -1;
};

const statusSorter = (_a: ListItem, _b: ListItem) => {
  const statusOrder = { '在职': 1, '试用期': 2, '离职': 3 };
  const orderA = statusOrder[_a.status as keyof typeof statusOrder] || 0;
  const orderB = statusOrder[_b.status as keyof typeof statusOrder] || 0;
  return orderA - orderB;
};

const joinDateSorter = (_a: ListItem, _b: ListItem) => {
  const dateA = new Date(_a.joinDate as string).getTime();
  const dateB = new Date(_b.joinDate as string).getTime();
  return dateA - dateB;
};

/**
 * 默认排序配置
 * 表格初始化时会自动应用此排序配置
 * 
 * - field: 指定要排序的列字段
 * - order: 排序方向，'ascend' 升序 | 'descend' 降序
 * - sorter: 可选，自定义排序函数。如果不提供，会使用列配置中的 sorter 或默认排序
 */
const defaultSortConfig = {
  field: 'salary',        // 按薪资列排序
  order: 'descend' as const,  // 降序排列（薪资从高到低）
  sorter: salarySorter,   // 使用自定义排序函数
};

const getStatusConfig = (status: string) => {
  const statusConfig: Record<string, { color: string; bg: string }> = {
    '在职': { color: '#52c41a', bg: '#f6ffed' },
    '试用期': { color: '#faad14', bg: '#fffbe6' },
    '离职': { color: '#ff4d4f', bg: '#fff1f0' },
  };
  return statusConfig[status] || { color: '#666', bg: '#f5f5f5' };
};

const handleEdit = (row: any) => {
  alert(`编辑: ${row.name}`);
};

const handleDelete = (row: any) => {
  alert(`删除: ${row.name}`);
};

const list: ListItem[] = generateList(100);
const gridTableRef = ref<InstanceType<typeof GridTable> | null>(null);

// 排序控制
const selectedColumnId = ref<string | null>(null);
const sortDirection = ref<'ascend' | 'descend' | null>(null);
const sortedList = ref<ListItem[]>(list);

// 可排序的列配置（使用 field 作为标识）
const sortableColumnsConfig = [
  { field: 'name', title: '姓名', sorter: undefined },
  { field: 'age', title: '年龄', sorter: ageSorter },
  { field: 'department', title: '部门', sorter: undefined },
  { field: 'city', title: '城市', sorter: undefined },
  { field: 'salary', title: '薪资', sorter: salarySorter },
  { field: 'status', title: '状态', sorter: statusSorter },
  { field: 'joinDate', title: '入职日期', sorter: joinDateSorter },
];

// 获取所有可排序的列
const sortableColumns = computed(() => {
  return sortableColumnsConfig;
});

// 列选择变化
const handleColumnChange = (value: string | null) => {
  selectedColumnId.value = value;
  if (!selectedColumnId.value) {
    sortDirection.value = null;
    sortedList.value = [...list];
  } else {
    // 如果之前有排序，保持排序方向
    if (!sortDirection.value) {
      sortDirection.value = null;
    }
  }
};

// 执行排序
const handleSort = (direction: 'ascend' | 'descend' | null) => {
  if (!selectedColumnId.value) return;

  if (direction === null) {
    // 取消排序
    sortedList.value = [...list];
    sortDirection.value = null;
  } else {
    // 执行排序
    const column = sortableColumnsConfig.find((col) => col.field === selectedColumnId.value);
    if (!column) return;

    const sorted = [...list].sort((a, b) => {
      let result = 0;
      if (column.sorter) {
        result = column.sorter(a, b);
      } else {
        // 默认排序
        const aVal = a[column.field as keyof ListItem];
        const bVal = b[column.field as keyof ListItem];
        if (aVal === bVal) return 0;
        result = aVal > bVal ? 1 : -1;
      }
      return direction === 'ascend' ? result : -result;
    });
    sortedList.value = sorted;
    sortDirection.value = direction;
  }
};

// 打印当前数据
const handlePrintData = () => {
  try {
    const currentData = sortedList.value;
    console.log('当前表格数据：', currentData);
    console.log('数据条数：', currentData.length);
    console.table(currentData.slice(0, 10)); // 打印前10条数据
    alert(`已打印数据到控制台，共 ${currentData.length} 条数据`);
  } catch (error) {
    console.error('打印数据失败：', error);
    alert('打印数据失败，请查看控制台');
  }
};
</script>

<style lang="scss">
.base-view {
  width: 100%;
  height: 100%;
  overflow: hidden;

  display: flex;
  align-items: center;
  justify-content: center;
}
</style>