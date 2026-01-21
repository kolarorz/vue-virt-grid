var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { createApp, reactive, shallowReactive as shallowReactive$1, ref as ref$1, provide, inject, shallowRef as shallowRef$1, nextTick, onUpdated, watch as watch$1, defineComponent, openBlock, createElementBlock, toDisplayString, computed, createElementVNode, createCommentVNode, normalizeClass, unref, withModifiers, Fragment, createBlock, normalizeStyle, renderList, resolveDynamicComponent, createVNode, onMounted as onMounted$1, onBeforeUnmount as onBeforeUnmount$1, renderSlot, useSlots, getCurrentInstance, withCtx, render, createStaticVNode } from "vue";
import { ref, onMounted, onBeforeUnmount, shallowReactive, onBeforeMount, shallowRef, watch, isVue2 } from "vue-demi";
const index$1 = "";
const useObserverItem = (props) => {
  const itemRefEl = ref(null);
  onMounted(() => {
    if (props.resizeObserver && itemRefEl.value) {
      props.resizeObserver.observe(itemRefEl.value);
    }
  });
  onBeforeUnmount(() => {
    if (props.resizeObserver && itemRefEl.value) {
      props.resizeObserver.unobserve(itemRefEl.value);
    }
  });
  return {
    itemRefEl
  };
};
const defaultProps = {
  itemGap: 0,
  fixed: false,
  buffer: 0,
  bufferTop: 0,
  bufferBottom: 0,
  scrollDistance: 0,
  horizontal: false,
  fixSelection: false,
  start: 0,
  offset: 0,
  listStyle: "",
  listClass: "",
  itemStyle: "",
  itemClass: "",
  headerClass: "",
  headerStyle: "",
  footerClass: "",
  footerStyle: "",
  stickyHeaderClass: "",
  stickyHeaderStyle: "",
  stickyFooterClass: "",
  stickyFooterStyle: ""
};
function useVirtList(userProps, emitFunction) {
  const props = new Proxy(userProps, {
    get(target, key) {
      var _a;
      return (_a = Reflect.get(target, key)) != null ? _a : Reflect.get(defaultProps, key);
    }
  });
  const clientRefEl = ref(null);
  const listRefEl = ref(null);
  const headerRefEl = ref(null);
  const footerRefEl = ref(null);
  const stickyHeaderRefEl = ref(null);
  const stickyFooterRefEl = ref(null);
  const sizesMap = /* @__PURE__ */ new Map();
  const renderKey = ref(0);
  let direction = "backward";
  let fixOffset = false;
  let forceFixOffset = false;
  let abortFixOffset = false;
  let fixTaskFn = null;
  const slotSize = shallowReactive({
    clientSize: 0,
    headerSize: 0,
    footerSize: 0,
    stickyHeaderSize: 0,
    stickyFooterSize: 0
  });
  const reactiveData = shallowReactive({
    // 可视区域的个数，不算buffer，只和clientSize和minSize有关
    views: 0,
    // 滚动距离
    offset: 0,
    // 不包含插槽的高度
    listTotalSize: 0,
    // 虚拟占位尺寸，是从0到renderBegin的尺寸
    virtualSize: 0,
    // 可视区的起始下标
    inViewBegin: 0,
    // 可视区的结束下标
    inViewEnd: 0,
    // buffer的起始下标
    renderBegin: 0,
    // buffer的结束下标
    renderEnd: 0,
    bufferTop: 0,
    bufferBottom: 0
  });
  function getOffset() {
    const directionKey = props.horizontal ? "scrollLeft" : "scrollTop";
    return clientRefEl.value ? clientRefEl.value[directionKey] : 0;
  }
  function getSlotSize() {
    return slotSize.headerSize + slotSize.footerSize + slotSize.stickyHeaderSize + slotSize.stickyFooterSize;
  }
  function getTotalSize() {
    return reactiveData.listTotalSize + slotSize.headerSize + slotSize.footerSize + slotSize.stickyHeaderSize + slotSize.stickyFooterSize;
  }
  function getItemSize(itemKey) {
    var _a;
    if (props.fixed)
      return props.minSize + props.itemGap;
    return (_a = sizesMap.get(String(itemKey))) != null ? _a : props.minSize + props.itemGap;
  }
  function setItemSize(itemKey, size) {
    sizesMap.set(String(itemKey), size);
  }
  function deleteItemSize(itemKey) {
    sizesMap.delete(String(itemKey));
  }
  function getItemPosByIndex(index2) {
    var _a, _b;
    if (props.fixed) {
      return {
        top: (props.minSize + props.itemGap) * index2,
        current: props.minSize + props.itemGap,
        bottom: (props.minSize + props.itemGap) * (index2 + 1)
      };
    }
    const {
      itemKey
    } = props;
    let topReduce = slotSize.headerSize;
    for (let i = 0; i <= index2 - 1; i += 1) {
      const currentSize = getItemSize((_a = props.list[i]) == null ? void 0 : _a[itemKey]);
      topReduce += currentSize;
    }
    const current = getItemSize((_b = props.list[index2]) == null ? void 0 : _b[itemKey]);
    return {
      top: topReduce,
      current,
      bottom: topReduce + current
    };
  }
  function scrollToOffset(offset) {
    abortFixOffset = true;
    const directionKey = props.horizontal ? "scrollLeft" : "scrollTop";
    if (clientRefEl.value)
      clientRefEl.value[directionKey] = offset;
  }
  async function scrollToIndex(index2) {
    if (index2 < 0) {
      return;
    }
    if (index2 >= props.list.length - 1) {
      scrollToBottom();
      return;
    }
    let {
      top: lastOffset
    } = getItemPosByIndex(index2);
    scrollToOffset(lastOffset);
    const fixToIndex = () => {
      const {
        top: offset
      } = getItemPosByIndex(index2);
      scrollToOffset(offset);
      if (lastOffset !== offset) {
        lastOffset = offset;
        fixTaskFn = fixToIndex;
        return;
      }
      fixTaskFn = null;
    };
    fixTaskFn = fixToIndex;
  }
  async function scrollIntoView(index2) {
    var _a;
    const {
      top: targetMin,
      bottom: targetMax
    } = getItemPosByIndex(index2);
    const offsetMin = getOffset();
    const offsetMax = getOffset() + slotSize.clientSize;
    const currentSize = getItemSize((_a = props.list[index2]) == null ? void 0 : _a[props.itemKey]);
    if (targetMin < offsetMin && offsetMin < targetMax && currentSize < slotSize.clientSize) {
      scrollToOffset(targetMin);
      return;
    }
    if (targetMin + slotSize.stickyHeaderSize < offsetMax && offsetMax < targetMax + slotSize.stickyHeaderSize && currentSize < slotSize.clientSize) {
      scrollToOffset(targetMax - slotSize.clientSize + slotSize.stickyHeaderSize);
      return;
    }
    if (targetMin + slotSize.stickyHeaderSize >= offsetMax) {
      scrollToIndex(index2);
      return;
    }
    if (targetMax <= offsetMin) {
      scrollToIndex(index2);
      return;
    }
  }
  async function scrollToTop() {
    let count = 0;
    function loopScrollToTop() {
      count += 1;
      scrollToOffset(0);
      setTimeout(() => {
        var _a;
        if (count > 10) {
          return;
        }
        const directionKey = props.horizontal ? "scrollLeft" : "scrollTop";
        if (((_a = clientRefEl == null ? void 0 : clientRefEl.value) == null ? void 0 : _a[directionKey]) !== 0) {
          loopScrollToTop();
        }
      }, 3);
    }
    loopScrollToTop();
  }
  async function scrollToBottom() {
    let count = 0;
    function loopScrollToBottom() {
      count += 1;
      scrollToOffset(getTotalSize());
      setTimeout(() => {
        if (count > 10) {
          return;
        }
        if (Math.abs(Math.round(reactiveData.offset + slotSize.clientSize) - Math.round(getTotalSize())) > 2) {
          loopScrollToBottom();
        }
      }, 3);
    }
    loopScrollToBottom();
  }
  function fixSelection() {
    const selection = window.getSelection();
    if (selection) {
      const {
        anchorNode,
        anchorOffset,
        focusNode,
        focusOffset
      } = selection;
      if (anchorNode && anchorOffset !== null && focusNode !== null && focusOffset) {
        requestAnimationFrame(() => {
          if (anchorOffset < focusOffset) {
            selection.setBaseAndExtent(anchorNode, anchorOffset, focusNode, focusOffset);
          } else {
            selection.setBaseAndExtent(focusNode, focusOffset, anchorNode, anchorOffset);
          }
        });
      }
    }
  }
  function updateRange(start) {
    var _a;
    if (isVue2 && props.fixSelection && direction === "backward") {
      fixSelection();
    }
    if (start < reactiveData.inViewBegin) {
      fixOffset = true;
    }
    reactiveData.inViewBegin = start;
    reactiveData.inViewEnd = Math.min(start + reactiveData.views, props.list.length - 1);
    (_a = emitFunction == null ? void 0 : emitFunction.rangeUpdate) == null ? void 0 : _a.call(emitFunction, reactiveData.inViewBegin, reactiveData.inViewEnd);
  }
  function calcRange() {
    var _a, _b;
    const {
      views,
      offset,
      inViewBegin
    } = reactiveData;
    const {
      itemKey
    } = props;
    const offsetWithNoHeader = offset - slotSize.headerSize;
    let start = inViewBegin;
    let offsetReduce = getVirtualSize2beginInView();
    if (offsetWithNoHeader < 0) {
      updateRange(0);
      return;
    }
    if (direction === "forward") {
      if (offsetWithNoHeader >= offsetReduce) {
        return;
      }
      for (let i = start - 1; i >= 0; i -= 1) {
        const currentSize = getItemSize((_a = props.list[i]) == null ? void 0 : _a[itemKey]);
        offsetReduce -= currentSize;
        if (offsetReduce <= offsetWithNoHeader && offsetWithNoHeader < offsetReduce + currentSize) {
          start = i;
          break;
        }
      }
    }
    if (direction === "backward") {
      if (offsetWithNoHeader <= offsetReduce) {
        return;
      }
      for (let i = start; i <= props.list.length - 1; i += 1) {
        const currentSize = getItemSize((_b = props.list[i]) == null ? void 0 : _b[itemKey]);
        if (offsetReduce <= offsetWithNoHeader && offsetWithNoHeader < offsetReduce + currentSize) {
          start = i;
          break;
        }
        offsetReduce += currentSize;
      }
      fixOffset = false;
    }
    if (start !== reactiveData.inViewBegin) {
      updateRange(start);
    }
  }
  function onScroll(evt) {
    var _a, _b, _c;
    (_a = emitFunction == null ? void 0 : emitFunction.scroll) == null ? void 0 : _a.call(emitFunction, evt);
    const offset = getOffset();
    if (offset === reactiveData.offset)
      return;
    direction = offset < reactiveData.offset ? "forward" : "backward";
    reactiveData.offset = offset;
    calcRange();
    if (direction === "forward" && reactiveData.offset - props.scrollDistance <= 0) {
      (_b = emitFunction == null ? void 0 : emitFunction.toTop) == null ? void 0 : _b.call(emitFunction, props.list[0]);
    }
    if (direction === "backward" && Math.round(reactiveData.offset + props.scrollDistance) >= Math.round(reactiveData.listTotalSize + getSlotSize() - slotSize.clientSize)) {
      (_c = emitFunction == null ? void 0 : emitFunction.toBottom) == null ? void 0 : _c.call(emitFunction, props.list[props.list.length - 1]);
    }
  }
  function calcViews() {
    const newViews = Math.ceil(slotSize.clientSize / (props.minSize + props.itemGap)) + 1;
    reactiveData.views = newViews;
  }
  function onClientResize() {
    calcViews();
    updateRange(reactiveData.inViewBegin);
  }
  function calcListTotalSize() {
    var _a;
    if (props.fixed) {
      reactiveData.listTotalSize = (props.minSize + props.itemGap) * props.list.length;
      return;
    }
    const {
      itemKey
    } = props;
    let re = 0;
    for (let i = 0; i <= props.list.length - 1; i += 1) {
      re += getItemSize((_a = props.list[i]) == null ? void 0 : _a[itemKey]);
    }
    reactiveData.listTotalSize = re;
  }
  function reset() {
    reactiveData.offset = 0;
    reactiveData.listTotalSize = 0;
    reactiveData.virtualSize = 0;
    reactiveData.inViewBegin = 0;
    reactiveData.inViewEnd = 0;
    reactiveData.renderBegin = 0;
    reactiveData.renderEnd = 0;
    sizesMap.clear();
    forceUpdate();
  }
  function deletedList2Top(deletedList) {
    calcListTotalSize();
    let deletedListSize = 0;
    deletedList.forEach((item) => {
      deletedListSize += getItemSize(item[props.itemKey]);
    });
    updateTotalVirtualSize();
    scrollToOffset(reactiveData.offset - deletedListSize);
    calcRange();
  }
  function addedList2Top(addedList) {
    calcListTotalSize();
    let addedListSize = 0;
    addedList.forEach((item) => {
      addedListSize += getItemSize(item[props.itemKey]);
    });
    updateTotalVirtualSize();
    scrollToOffset(reactiveData.offset + addedListSize);
    forceFixOffset = true;
    abortFixOffset = false;
    calcRange();
  }
  function forceUpdate() {
    renderKey.value += 1;
  }
  let resizeObserver = void 0;
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver((entries) => {
      var _a;
      let diff = 0;
      for (const entry of entries) {
        const id = entry.target.dataset.id;
        if (id) {
          const oldSize = getItemSize(id);
          let newSize = 0;
          if (entry.borderBoxSize) {
            const borderBoxSize = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize;
            newSize = props.horizontal ? borderBoxSize.inlineSize : borderBoxSize.blockSize;
          } else {
            newSize = props.horizontal ? entry.contentRect.width : entry.contentRect.height;
          }
          if (id === "client") {
            slotSize.clientSize = newSize;
            onClientResize();
          } else if (id === "header") {
            slotSize.headerSize = newSize;
          } else if (id === "footer") {
            slotSize.footerSize = newSize;
          } else if (id === "stickyHeader") {
            slotSize.stickyHeaderSize = newSize;
          } else if (id === "stickyFooter") {
            slotSize.stickyFooterSize = newSize;
          } else if (oldSize !== newSize) {
            setItemSize(id, newSize);
            diff += newSize - oldSize;
            (_a = emitFunction == null ? void 0 : emitFunction.itemResize) == null ? void 0 : _a.call(emitFunction, id, newSize);
          }
        }
      }
      reactiveData.listTotalSize += diff;
      if (fixTaskFn) {
        fixTaskFn();
      }
      if ((fixOffset || forceFixOffset) && diff !== 0 && !abortFixOffset) {
        fixOffset = false;
        forceFixOffset = false;
        scrollToOffset(reactiveData.offset + diff);
      }
      abortFixOffset = false;
    });
  }
  const updateTotalVirtualSize = () => {
    var _a;
    let offset = 0;
    const currentFirst = reactiveData.renderBegin;
    for (let i = 0; i < currentFirst; i++) {
      offset += getItemSize((_a = props.list[i]) == null ? void 0 : _a[props.itemKey]);
    }
    reactiveData.virtualSize = offset;
  };
  onBeforeMount(() => {
    if (props.bufferTop) {
      reactiveData.bufferTop = props.bufferTop;
    } else {
      reactiveData.bufferTop = props.buffer;
    }
    if (props.bufferBottom) {
      reactiveData.bufferBottom = props.bufferBottom;
    } else {
      reactiveData.bufferBottom = props.buffer;
    }
  });
  onMounted(() => {
    if (clientRefEl.value) {
      clientRefEl.value.addEventListener("scroll", onScroll);
      resizeObserver == null ? void 0 : resizeObserver.observe(clientRefEl.value);
    }
    if (stickyHeaderRefEl.value) {
      resizeObserver == null ? void 0 : resizeObserver.observe(stickyHeaderRefEl.value);
    }
    if (stickyFooterRefEl.value) {
      resizeObserver == null ? void 0 : resizeObserver.observe(stickyFooterRefEl.value);
    }
    if (headerRefEl.value) {
      resizeObserver == null ? void 0 : resizeObserver.observe(headerRefEl.value);
    }
    if (footerRefEl.value) {
      resizeObserver == null ? void 0 : resizeObserver.observe(footerRefEl.value);
    }
    if (props.start) {
      scrollToIndex(props.start);
    } else if (props.offset) {
      scrollToOffset(props.offset);
    }
  });
  onBeforeUnmount(() => {
    if (clientRefEl.value) {
      clientRefEl.value.removeEventListener("scroll", onScroll);
      resizeObserver == null ? void 0 : resizeObserver.unobserve(clientRefEl.value);
      slotSize.clientSize = 0;
    }
    if (stickyHeaderRefEl.value) {
      resizeObserver == null ? void 0 : resizeObserver.unobserve(stickyHeaderRefEl.value);
      slotSize.stickyHeaderSize = 0;
    }
    if (stickyFooterRefEl.value) {
      resizeObserver == null ? void 0 : resizeObserver.unobserve(stickyFooterRefEl.value);
      slotSize.stickyFooterSize = 0;
    }
    if (headerRefEl.value) {
      resizeObserver == null ? void 0 : resizeObserver.unobserve(headerRefEl.value);
      slotSize.headerSize = 0;
    }
    if (footerRefEl.value) {
      resizeObserver == null ? void 0 : resizeObserver.unobserve(footerRefEl.value);
      slotSize.footerSize = 0;
    }
  });
  function getVirtualSize2beginInView() {
    return reactiveData.virtualSize + getRangeSize(reactiveData.renderBegin, reactiveData.inViewBegin);
  }
  function getRangeSize(range1, range2) {
    var _a;
    const start = Math.min(range1, range2);
    const end = Math.max(range1, range2);
    let re = 0;
    for (let i = start; i < end; i += 1) {
      re += getItemSize((_a = props.list[i]) == null ? void 0 : _a[props.itemKey]);
    }
    return re;
  }
  function getReactiveData() {
    return reactiveData;
  }
  const renderList2 = shallowRef([]);
  function manualRender(_newRenderBegin, _newRenderEnd) {
    const _oldRenderBegin = reactiveData.renderBegin;
    reactiveData.renderBegin = _newRenderBegin;
    reactiveData.renderEnd = _newRenderEnd;
    if (_newRenderBegin > _oldRenderBegin) {
      reactiveData.virtualSize += getRangeSize(_newRenderBegin, _oldRenderBegin);
    } else {
      reactiveData.virtualSize -= getRangeSize(_newRenderBegin, _oldRenderBegin);
    }
    renderList2.value = props.list.slice(reactiveData.renderBegin, reactiveData.renderEnd + 1);
    updateTotalVirtualSize();
  }
  watch(
    // 这里为什么用 renderKey 代替监听 props.list
    // 因为props.list会导致v-for时deepArray导致大量的性能浪费
    () => [reactiveData.inViewBegin, reactiveData.inViewEnd, renderKey.value],
    (newVal, oldVal) => {
      if (newVal && oldVal) {
        const [_newInViewBegin] = newVal;
        const _oldRenderBegin = reactiveData.renderBegin;
        let _newRenderBegin = _newInViewBegin;
        let _newRenderEnd = reactiveData.inViewEnd;
        _newRenderBegin = Math.max(0, _newRenderBegin - reactiveData.bufferTop);
        _newRenderEnd = Math.min(_newRenderEnd + reactiveData.bufferBottom, props.list.length - 1 > 0 ? props.list.length - 1 : 0);
        if (props == null ? void 0 : props.renderControl) {
          const {
            begin,
            end
          } = props.renderControl(_newInViewBegin, reactiveData.inViewEnd);
          _newRenderBegin = begin;
          _newRenderEnd = end;
        }
        reactiveData.renderBegin = _newRenderBegin;
        reactiveData.renderEnd = _newRenderEnd;
        if (_newRenderBegin > _oldRenderBegin) {
          reactiveData.virtualSize += getRangeSize(_newRenderBegin, _oldRenderBegin);
        } else {
          reactiveData.virtualSize -= getRangeSize(_newRenderBegin, _oldRenderBegin);
        }
        renderList2.value = props.list.slice(reactiveData.renderBegin, reactiveData.renderEnd + 1);
      }
    },
    {
      immediate: true
    }
  );
  watch(() => props.list.length, () => {
    if (props.list.length <= 0) {
      reset();
      return;
    }
    calcListTotalSize();
    updateRange(reactiveData.inViewBegin);
    updateTotalVirtualSize();
    forceUpdate();
  }, {
    immediate: true
  });
  return {
    props,
    renderList: renderList2,
    clientRefEl,
    listRefEl,
    headerRefEl,
    footerRefEl,
    stickyHeaderRefEl,
    stickyFooterRefEl,
    reactiveData,
    slotSize,
    sizesMap,
    resizeObserver,
    getReactiveData,
    getOffset,
    getSlotSize,
    reset,
    scrollToIndex,
    manualRender,
    scrollIntoView,
    scrollToTop,
    scrollToBottom,
    scrollToOffset,
    getItemSize,
    deleteItemSize,
    // expose only
    deletedList2Top,
    addedList2Top,
    getItemPosByIndex,
    forceUpdate
  };
}
var CellType = /* @__PURE__ */ ((CellType2) => {
  CellType2["Index"] = "index";
  CellType2["Expand"] = "expand";
  CellType2["Tree"] = "tree";
  CellType2["Radio"] = "radio";
  CellType2["Checkbox"] = "checkbox";
  CellType2["Text"] = "text";
  CellType2["Link"] = "link";
  CellType2["Select"] = "select";
  CellType2["MultiSelect"] = "multiSelect";
  CellType2["Image"] = "image";
  CellType2["Person"] = "person";
  return CellType2;
})(CellType || {});
var CellEventEnum = /* @__PURE__ */ ((CellEventEnum2) => {
  CellEventEnum2["CellClick"] = "cellClick";
  CellEventEnum2["CellDblclick"] = "cellDblclick";
  CellEventEnum2["CellContextmenu"] = "cellContextmenu";
  return CellEventEnum2;
})(CellEventEnum || {});
var RowEventEnum = /* @__PURE__ */ ((RowEventEnum2) => {
  RowEventEnum2["RowClick"] = "rowClick";
  RowEventEnum2["RowDblclick"] = "rowDblclick";
  RowEventEnum2["RowContextmenu"] = "rowContextmenu";
  return RowEventEnum2;
})(RowEventEnum || {});
var HeaderEventEnum = /* @__PURE__ */ ((HeaderEventEnum2) => {
  HeaderEventEnum2["HeaderClick"] = "headerClick";
  HeaderEventEnum2["HeaderDblclick"] = "headerDblclick";
  HeaderEventEnum2["HeaderContextmenu"] = "headerContextmenu";
  return HeaderEventEnum2;
})(HeaderEventEnum || {});
var TableEventEnum = /* @__PURE__ */ ((TableEventEnum2) => {
  TableEventEnum2["ExpandChange"] = "expandChange";
  TableEventEnum2["BoxSelection"] = "boxSelection";
  TableEventEnum2["SortChange"] = "sortChange";
  return TableEventEnum2;
})(TableEventEnum || {});
const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
let nanoid = (size = 21) => {
  let id = "";
  let bytes = crypto.getRandomValues(new Uint8Array(size));
  while (size--) {
    id += urlAlphabet[bytes[size] & 63];
  }
  return id;
};
const genColumnsWidth = (columns, headerCellInfo, fixArr, isRight = false, preOffset = 0, preWidth = 0) => {
  let currOffset = preOffset;
  let levelWidth = preWidth;
  let currCols = columns;
  if (isRight)
    currCols = [...columns].reverse();
  const res = currCols.map((column) => {
    const colInfo = headerCellInfo[column._id];
    if (!colInfo) {
      console.warn("[genColumnsWidth] colInfo not found for column:", column._id, column);
      return column;
    }
    if (colInfo.children && colInfo.children.length > 0) {
      const { offset: width, maxWidth } = genColumnsWidth(
        column.children,
        headerCellInfo,
        fixArr,
        isRight,
        currOffset,
        levelWidth
      );
      headerCellInfo[column._id].fixOffset = currOffset;
      levelWidth = maxWidth;
      const col = {
        ...column,
        fixOffset: currOffset
      };
      currOffset = width;
      if (isRight) {
        console.log("[genColumnsWidth-right] parent column:", column._id, "width:", column.width, "fixOffset:", currOffset);
      }
      return col;
    } else {
      const columnWidth = column.width;
      if (isRight && (!columnWidth || columnWidth === 0)) {
        console.error("[genColumnsWidth-right] column width is 0 or undefined:", column._id, column.field, "width:", columnWidth);
      }
      headerCellInfo[column._id].fixOffset = currOffset;
      levelWidth += columnWidth;
      currOffset += columnWidth;
      const result = {
        ...column,
        fixOffset: currOffset - columnWidth
      };
      if (isRight) {
        console.log("[genColumnsWidth-right] leaf column:", column._id, column.field, "width:", columnWidth, "fixOffset:", result.fixOffset, "currOffset:", currOffset);
      }
      return result;
    }
  });
  fixArr.unshift(isRight ? res.reverse() : res);
  return { offset: currOffset, maxWidth: levelWidth };
};
const calcFixedColumnsOffset = (leftFixedColumns, rightFixedColumns, headerCellInfo) => {
  const leftFixedHeaderColumns = [];
  const rightFixedHeaderColumns = [];
  const { maxWidth: left } = genColumnsWidth(
    leftFixedColumns,
    headerCellInfo,
    leftFixedHeaderColumns
  );
  const { maxWidth: right } = genColumnsWidth(
    rightFixedColumns,
    headerCellInfo,
    rightFixedHeaderColumns,
    true
  );
  return {
    leftFixed: left,
    rightFixed: right,
    fixedHeaderCols: {
      leftFixed: leftFixedHeaderColumns,
      rightFixed: rightFixedHeaderColumns
    }
  };
};
const formatColumns = (originColumns) => {
  const leftFixedColumns = [];
  const rightFixedColumns = [];
  const centerNormalColumns = [];
  const headerCellInfo = {};
  let maxLevel = 0;
  function dfs({
    columns,
    level = 0,
    parentId,
    parentColumn,
    fixed
  }) {
    maxLevel = Math.max(maxLevel, level);
    let childCountReduce = 0;
    columns.forEach((_col) => {
      var _a, _b;
      const column = _col;
      column._id = column._id || `${column.field || ""}-${nanoid(4)}`;
      column.width = (_a = column.width) != null ? _a : 200;
      headerCellInfo[column._id] = {
        ...column
      };
      headerCellInfo[column._id].level = level;
      if (column.fixed === void 0 && fixed) {
        column.fixed = fixed;
        headerCellInfo[column._id].fixed = fixed;
      }
      if (parentColumn && (parentColumn == null ? void 0 : parentColumn.fixed) === void 0) {
        column.fixed = "";
      }
      if (column.children && ((_b = column.children) == null ? void 0 : _b.length) > 0) {
        const childCount = dfs({
          columns: column.children,
          level: level + 1,
          parentId: column._id,
          parentColumn: column,
          fixed: column.fixed
        });
        headerCellInfo[column._id].colspan = childCount;
        childCountReduce += childCount;
      } else {
        headerCellInfo[column._id].colspan = 1;
        childCountReduce += 1;
        headerCellInfo[column._id].isLeaf = true;
        if (column.fixed === "left") {
          leftFixedColumns.push(column);
        } else if (column.fixed === "right") {
          rightFixedColumns.push(column);
        } else {
          centerNormalColumns.push(column);
        }
      }
      if (parentId !== void 0) {
        headerCellInfo[column._id].parentId = parentId;
      }
      if (parentColumn !== void 0) {
        headerCellInfo[column._id].parentColumn = parentColumn;
      }
    });
    return childCountReduce;
  }
  dfs({ columns: originColumns });
  function bfs(columns) {
    var _a;
    const leftFixedHeaderColumns2 = [];
    const rightFixedHeaderColumns2 = [];
    const centerNormalHeaderColumns2 = [];
    const queue = [...columns];
    while (queue.length > 0) {
      const levelFixedLeft = [];
      const levelFixedRight = [];
      const levelMain = [];
      const length = queue.length;
      for (let i = 0; i < length; i++) {
        const column = queue.shift();
        headerCellInfo[column._id].rowspan = maxLevel - ((_a = headerCellInfo[column._id].level) != null ? _a : 0) + 1;
        if (column.fixed === "left") {
          levelFixedLeft.push(column);
        } else if (column.fixed === "right") {
          levelFixedRight.push(column);
        } else {
          levelMain.push(column);
        }
        if (column.children) {
          headerCellInfo[column._id].rowspan = 1;
          queue.push(...column.children);
        }
      }
      leftFixedHeaderColumns2.push(levelFixedLeft);
      rightFixedHeaderColumns2.push(levelFixedRight);
      centerNormalHeaderColumns2.push(levelMain);
    }
    return {
      leftFixedHeaderColumns: leftFixedHeaderColumns2,
      rightFixedHeaderColumns: rightFixedHeaderColumns2,
      centerNormalHeaderColumns: centerNormalHeaderColumns2
    };
  }
  const { leftFixedHeaderColumns, rightFixedHeaderColumns, centerNormalHeaderColumns } = bfs(
    originColumns
  );
  let rightReduce = 0;
  console.log("[formatColumns] rightFixedColumns length:", rightFixedColumns.length);
  for (let i = rightFixedColumns.length - 1; i >= 0; i--) {
    const col = rightFixedColumns[i];
    const colWidth = col.width;
    if (!colWidth || colWidth === 0) {
      console.error("[formatColumns] rightFixedColumns width is 0 or undefined:", col._id, col.field, "width:", colWidth, "index:", i);
    }
    headerCellInfo[col._id].right = rightReduce;
    rightReduce += colWidth;
    console.log("[formatColumns] rightFixedColumns:", col._id, col.field, "width:", colWidth, "right:", rightReduce - colWidth, "totalRight:", rightReduce);
  }
  const { leftFixed, rightFixed, fixedHeaderCols } = calcFixedColumnsOffset(
    leftFixedHeaderColumns[0],
    rightFixedHeaderColumns[0],
    headerCellInfo
  );
  if (maxLevel > fixedHeaderCols.leftFixed.length) {
    const gapLength = leftFixedHeaderColumns.length - fixedHeaderCols.leftFixed.length;
    for (let i = 0; i < gapLength; i++) {
      fixedHeaderCols.leftFixed.push([]);
    }
  }
  if (maxLevel > fixedHeaderCols.rightFixed.length) {
    const gapLength = rightFixedHeaderColumns.length - fixedHeaderCols.rightFixed.length;
    for (let i = 0; i < gapLength; i++) {
      fixedHeaderCols.rightFixed.push([]);
    }
  }
  const flattedColumns = [
    ...leftFixedColumns,
    ...centerNormalColumns,
    ...rightFixedColumns
  ];
  flattedColumns.forEach((col, index2) => {
    col.colIndex = index2;
  });
  return {
    headerCellInfo,
    flattedColumns,
    leftFixedColumns,
    rightFixedColumns,
    centerNormalColumns,
    originColumns,
    leftFixedHeaderColumns: fixedHeaderCols.leftFixed,
    rightFixedHeaderColumns: fixedHeaderCols.rightFixed,
    centerNormalHeaderColumns,
    fixedInfo: {
      leftWidth: leftFixed,
      rightWidth: rightFixed
    }
  };
};
const useTableEvent = (gridStore) => {
  return {
    onExpandChange(data) {
      gridStore.eventEmitter.emit(TableEventEnum.ExpandChange, data);
    },
    onCellSelection(data) {
      gridStore.eventEmitter.emit(TableEventEnum.BoxSelection, data);
    }
  };
};
const checkAndGetThInfo = (e, gridStore) => {
  const composedPath = e.composedPath();
  const thEl = composedPath.find((el) => {
    var _a;
    return (_a = el.classList) == null ? void 0 : _a.contains("vtg-th");
  });
  if (thEl) {
    const colId = thEl.dataset.id;
    if (colId === void 0)
      return;
    const targetColumnData = gridStore.columnModule.columnsInfo.headerCellInfo[colId];
    return {
      event: e,
      column: targetColumnData
    };
  }
  return null;
};
const checkAndGetTdInfo = (event, gridStore) => {
  const composedPath = event.composedPath();
  const tdEl = composedPath.find(
    (el) => {
      var _a;
      return (_a = el.classList) == null ? void 0 : _a.contains("vtg-td");
    }
  );
  if (tdEl) {
    const rowIdx = tdEl.dataset.rowidx;
    const colIdx = tdEl.dataset.colidx;
    if (rowIdx === void 0 || colIdx === void 0)
      return;
    const rowIdxNum = +rowIdx;
    const colIdxNum = +colIdx;
    const targetColumn = gridStore.columnModule.flattedColumns[colIdxNum];
    const targetRow = gridStore.originList[rowIdxNum];
    if (targetColumn && targetRow) {
      return {
        event,
        column: targetColumn,
        columnIndex: colIdxNum,
        row: gridStore.originList[rowIdxNum],
        rowIndex: rowIdxNum,
        cell: targetColumn.field ? targetRow[targetColumn.field] : null,
        rect: tdEl.getBoundingClientRect(),
        el: tdEl
      };
    }
    return null;
  }
};
const useContentEvent = (gridStore) => {
  const onClick = (e) => {
    const thData = checkAndGetThInfo(e, gridStore);
    if (thData) {
      gridStore.eventEmitter.emit(HeaderEventEnum.HeaderClick, thData);
      return;
    }
    const tdData = checkAndGetTdInfo(e, gridStore);
    if (tdData) {
      gridStore.eventEmitter.emit(CellEventEnum.CellClick, tdData);
      gridStore.eventEmitter.emit(RowEventEnum.RowClick, tdData);
    }
  };
  const onDblclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const thData = checkAndGetThInfo(e, gridStore);
    if (thData) {
      gridStore.eventEmitter.emit(HeaderEventEnum.HeaderDblclick, thData);
      return;
    }
    const tdData = checkAndGetTdInfo(e, gridStore);
    if (tdData) {
      gridStore.eventEmitter.emit(CellEventEnum.CellDblclick, tdData);
      gridStore.eventEmitter.emit(RowEventEnum.RowDblclick, tdData);
    }
  };
  const onContextmenu = (e) => {
    const thData = checkAndGetThInfo(e, gridStore);
    if (thData) {
      gridStore.eventEmitter.emit(HeaderEventEnum.HeaderContextmenu, thData);
      return;
    }
    const tdData = checkAndGetTdInfo(e, gridStore);
    if (tdData) {
      gridStore.eventEmitter.emit(CellEventEnum.CellContextmenu, tdData);
      gridStore.eventEmitter.emit(RowEventEnum.RowContextmenu, tdData);
    }
  };
  const onMouseDown = (e) => {
    const path = e.composedPath();
    const targetTd = path.find((el) => el.tagName === "TD");
    if ((targetTd == null ? void 0 : targetTd.dataset.rowidx) !== void 0) {
      gridStore.interactionModule.setSelectRow(Number(targetTd == null ? void 0 : targetTd.dataset.rowidx));
    }
    if ((targetTd == null ? void 0 : targetTd.dataset.colidx) !== void 0) {
      gridStore.interactionModule.setSelectCol(Number(targetTd == null ? void 0 : targetTd.dataset.colidx));
    }
    gridStore.popperModule.remove();
    const tdData = checkAndGetTdInfo(e, gridStore);
    gridStore.popperModule.coverRender(tdData);
  };
  document.addEventListener("mousedown", (evt) => {
    const popper2 = evt.composedPath().find(
      (el) => {
        var _a, _b, _c;
        return ((_a = el == null ? void 0 : el.classList) == null ? void 0 : _a.contains("vtg-popper-container")) || ((_b = el == null ? void 0 : el.classList) == null ? void 0 : _b.contains("vtg-td")) || // TODO 未来用插件化支持
        ((_c = el == null ? void 0 : el.classList) == null ? void 0 : _c.contains("el-popper"));
      }
    );
    if (!popper2) {
      gridStore.interactionModule.clearSelect();
      gridStore.popperModule.remove();
      document.querySelectorAll(".el-popper").forEach((el) => el.remove());
    }
  });
  return {
    onClick,
    onDblclick,
    onContextmenu,
    onMouseDown
  };
};
class EventEmitter {
  constructor() {
    __publicField(this, "events", {});
  }
  // 订阅事件
  on(event, listener) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }
  // 取消订阅事件
  off(event, listener) {
    if (!this.events[event])
      return;
    this.events[event] = this.events[event].filter((l) => l !== listener);
  }
  // 发布事件
  emit(event, ...args) {
    if (!this.events[event])
      return;
    this.events[event].forEach((listener) => listener(...args));
  }
  // 订阅一次性事件
  once(event, listener) {
    const onceWrapper = (...args) => {
      listener(...args);
      this.off(event, onceWrapper);
    };
    this.on(event, onceWrapper);
  }
  offAll() {
    this.events = {};
  }
}
var freeGlobal = typeof global == "object" && global && global.Object === Object && global;
const freeGlobal$1 = freeGlobal;
var freeSelf = typeof self == "object" && self && self.Object === Object && self;
var root = freeGlobal$1 || freeSelf || Function("return this")();
const root$1 = root;
var Symbol$1 = root$1.Symbol;
const Symbol$2 = Symbol$1;
var objectProto$f = Object.prototype;
var hasOwnProperty$c = objectProto$f.hasOwnProperty;
var nativeObjectToString$1 = objectProto$f.toString;
var symToStringTag$1 = Symbol$2 ? Symbol$2.toStringTag : void 0;
function getRawTag(value) {
  var isOwn = hasOwnProperty$c.call(value, symToStringTag$1), tag = value[symToStringTag$1];
  try {
    value[symToStringTag$1] = void 0;
    var unmasked = true;
  } catch (e) {
  }
  var result = nativeObjectToString$1.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}
var objectProto$e = Object.prototype;
var nativeObjectToString = objectProto$e.toString;
function objectToString(value) {
  return nativeObjectToString.call(value);
}
var nullTag = "[object Null]", undefinedTag = "[object Undefined]";
var symToStringTag = Symbol$2 ? Symbol$2.toStringTag : void 0;
function baseGetTag(value) {
  if (value == null) {
    return value === void 0 ? undefinedTag : nullTag;
  }
  return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}
function isObjectLike(value) {
  return value != null && typeof value == "object";
}
var symbolTag$3 = "[object Symbol]";
function isSymbol(value) {
  return typeof value == "symbol" || isObjectLike(value) && baseGetTag(value) == symbolTag$3;
}
function arrayMap(array, iteratee) {
  var index2 = -1, length = array == null ? 0 : array.length, result = Array(length);
  while (++index2 < length) {
    result[index2] = iteratee(array[index2], index2, array);
  }
  return result;
}
var isArray = Array.isArray;
const isArray$1 = isArray;
var INFINITY$2 = 1 / 0;
var symbolProto$2 = Symbol$2 ? Symbol$2.prototype : void 0, symbolToString = symbolProto$2 ? symbolProto$2.toString : void 0;
function baseToString(value) {
  if (typeof value == "string") {
    return value;
  }
  if (isArray$1(value)) {
    return arrayMap(value, baseToString) + "";
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : "";
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY$2 ? "-0" : result;
}
var reWhitespace = /\s/;
function trimmedEndIndex(string) {
  var index2 = string.length;
  while (index2-- && reWhitespace.test(string.charAt(index2))) {
  }
  return index2;
}
var reTrimStart = /^\s+/;
function baseTrim(string) {
  return string ? string.slice(0, trimmedEndIndex(string) + 1).replace(reTrimStart, "") : string;
}
function isObject(value) {
  var type = typeof value;
  return value != null && (type == "object" || type == "function");
}
var NAN = 0 / 0;
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;
var reIsBinary = /^0b[01]+$/i;
var reIsOctal = /^0o[0-7]+$/i;
var freeParseInt = parseInt;
function toNumber(value) {
  if (typeof value == "number") {
    return value;
  }
  if (isSymbol(value)) {
    return NAN;
  }
  if (isObject(value)) {
    var other = typeof value.valueOf == "function" ? value.valueOf() : value;
    value = isObject(other) ? other + "" : other;
  }
  if (typeof value != "string") {
    return value === 0 ? value : +value;
  }
  value = baseTrim(value);
  var isBinary = reIsBinary.test(value);
  return isBinary || reIsOctal.test(value) ? freeParseInt(value.slice(2), isBinary ? 2 : 8) : reIsBadHex.test(value) ? NAN : +value;
}
function identity(value) {
  return value;
}
var asyncTag = "[object AsyncFunction]", funcTag$2 = "[object Function]", genTag$1 = "[object GeneratorFunction]", proxyTag = "[object Proxy]";
function isFunction(value) {
  if (!isObject(value)) {
    return false;
  }
  var tag = baseGetTag(value);
  return tag == funcTag$2 || tag == genTag$1 || tag == asyncTag || tag == proxyTag;
}
var coreJsData = root$1["__core-js_shared__"];
const coreJsData$1 = coreJsData;
var maskSrcKey = function() {
  var uid = /[^.]+$/.exec(coreJsData$1 && coreJsData$1.keys && coreJsData$1.keys.IE_PROTO || "");
  return uid ? "Symbol(src)_1." + uid : "";
}();
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}
var funcProto$1 = Function.prototype;
var funcToString$1 = funcProto$1.toString;
function toSource(func) {
  if (func != null) {
    try {
      return funcToString$1.call(func);
    } catch (e) {
    }
    try {
      return func + "";
    } catch (e) {
    }
  }
  return "";
}
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
var reIsHostCtor = /^\[object .+?Constructor\]$/;
var funcProto = Function.prototype, objectProto$d = Object.prototype;
var funcToString = funcProto.toString;
var hasOwnProperty$b = objectProto$d.hasOwnProperty;
var reIsNative = RegExp(
  "^" + funcToString.call(hasOwnProperty$b).replace(reRegExpChar, "\\$&").replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, "$1.*?") + "$"
);
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}
function getValue(object, key) {
  return object == null ? void 0 : object[key];
}
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : void 0;
}
var WeakMap = getNative(root$1, "WeakMap");
const WeakMap$1 = WeakMap;
var objectCreate = Object.create;
var baseCreate = function() {
  function object() {
  }
  return function(proto) {
    if (!isObject(proto)) {
      return {};
    }
    if (objectCreate) {
      return objectCreate(proto);
    }
    object.prototype = proto;
    var result = new object();
    object.prototype = void 0;
    return result;
  };
}();
const baseCreate$1 = baseCreate;
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0:
      return func.call(thisArg);
    case 1:
      return func.call(thisArg, args[0]);
    case 2:
      return func.call(thisArg, args[0], args[1]);
    case 3:
      return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}
function noop() {
}
function copyArray(source, array) {
  var index2 = -1, length = source.length;
  array || (array = Array(length));
  while (++index2 < length) {
    array[index2] = source[index2];
  }
  return array;
}
var HOT_COUNT = 800, HOT_SPAN = 16;
var nativeNow = Date.now;
function shortOut(func) {
  var count = 0, lastCalled = 0;
  return function() {
    var stamp = nativeNow(), remaining = HOT_SPAN - (stamp - lastCalled);
    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(void 0, arguments);
  };
}
function constant(value) {
  return function() {
    return value;
  };
}
var defineProperty = function() {
  try {
    var func = getNative(Object, "defineProperty");
    func({}, "", {});
    return func;
  } catch (e) {
  }
}();
const defineProperty$1 = defineProperty;
var baseSetToString = !defineProperty$1 ? identity : function(func, string) {
  return defineProperty$1(func, "toString", {
    "configurable": true,
    "enumerable": false,
    "value": constant(string),
    "writable": true
  });
};
const baseSetToString$1 = baseSetToString;
var setToString = shortOut(baseSetToString$1);
const setToString$1 = setToString;
function arrayEach(array, iteratee) {
  var index2 = -1, length = array == null ? 0 : array.length;
  while (++index2 < length) {
    if (iteratee(array[index2], index2, array) === false) {
      break;
    }
  }
  return array;
}
function baseFindIndex(array, predicate, fromIndex, fromRight) {
  var length = array.length, index2 = fromIndex + (fromRight ? 1 : -1);
  while (fromRight ? index2-- : ++index2 < length) {
    if (predicate(array[index2], index2, array)) {
      return index2;
    }
  }
  return -1;
}
function baseIsNaN(value) {
  return value !== value;
}
function strictIndexOf(array, value, fromIndex) {
  var index2 = fromIndex - 1, length = array.length;
  while (++index2 < length) {
    if (array[index2] === value) {
      return index2;
    }
  }
  return -1;
}
function baseIndexOf(array, value, fromIndex) {
  return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
}
function arrayIncludes(array, value) {
  var length = array == null ? 0 : array.length;
  return !!length && baseIndexOf(array, value, 0) > -1;
}
var MAX_SAFE_INTEGER$1 = 9007199254740991;
var reIsUint = /^(?:0|[1-9]\d*)$/;
function isIndex(value, length) {
  var type = typeof value;
  length = length == null ? MAX_SAFE_INTEGER$1 : length;
  return !!length && (type == "number" || type != "symbol" && reIsUint.test(value)) && (value > -1 && value % 1 == 0 && value < length);
}
function baseAssignValue(object, key, value) {
  if (key == "__proto__" && defineProperty$1) {
    defineProperty$1(object, key, {
      "configurable": true,
      "enumerable": true,
      "value": value,
      "writable": true
    });
  } else {
    object[key] = value;
  }
}
function eq(value, other) {
  return value === other || value !== value && other !== other;
}
var objectProto$c = Object.prototype;
var hasOwnProperty$a = objectProto$c.hasOwnProperty;
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$a.call(object, key) && eq(objValue, value)) || value === void 0 && !(key in object)) {
    baseAssignValue(object, key, value);
  }
}
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});
  var index2 = -1, length = props.length;
  while (++index2 < length) {
    var key = props[index2];
    var newValue = customizer ? customizer(object[key], source[key], key, object, source) : void 0;
    if (newValue === void 0) {
      newValue = source[key];
    }
    if (isNew) {
      baseAssignValue(object, key, newValue);
    } else {
      assignValue(object, key, newValue);
    }
  }
  return object;
}
var nativeMax = Math.max;
function overRest(func, start, transform) {
  start = nativeMax(start === void 0 ? func.length - 1 : start, 0);
  return function() {
    var args = arguments, index2 = -1, length = nativeMax(args.length - start, 0), array = Array(length);
    while (++index2 < length) {
      array[index2] = args[start + index2];
    }
    index2 = -1;
    var otherArgs = Array(start + 1);
    while (++index2 < start) {
      otherArgs[index2] = args[index2];
    }
    otherArgs[start] = transform(array);
    return apply(func, this, otherArgs);
  };
}
function baseRest(func, start) {
  return setToString$1(overRest(func, start, identity), func + "");
}
var MAX_SAFE_INTEGER = 9007199254740991;
function isLength(value) {
  return typeof value == "number" && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}
function isArrayLike(value) {
  return value != null && isLength(value.length) && !isFunction(value);
}
function isIterateeCall(value, index2, object) {
  if (!isObject(object)) {
    return false;
  }
  var type = typeof index2;
  if (type == "number" ? isArrayLike(object) && isIndex(index2, object.length) : type == "string" && index2 in object) {
    return eq(object[index2], value);
  }
  return false;
}
function createAssigner(assigner) {
  return baseRest(function(object, sources) {
    var index2 = -1, length = sources.length, customizer = length > 1 ? sources[length - 1] : void 0, guard = length > 2 ? sources[2] : void 0;
    customizer = assigner.length > 3 && typeof customizer == "function" ? (length--, customizer) : void 0;
    if (guard && isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? void 0 : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index2 < length) {
      var source = sources[index2];
      if (source) {
        assigner(object, source, index2, customizer);
      }
    }
    return object;
  });
}
var objectProto$b = Object.prototype;
function isPrototype(value) {
  var Ctor = value && value.constructor, proto = typeof Ctor == "function" && Ctor.prototype || objectProto$b;
  return value === proto;
}
function baseTimes(n, iteratee) {
  var index2 = -1, result = Array(n);
  while (++index2 < n) {
    result[index2] = iteratee(index2);
  }
  return result;
}
var argsTag$3 = "[object Arguments]";
function baseIsArguments(value) {
  return isObjectLike(value) && baseGetTag(value) == argsTag$3;
}
var objectProto$a = Object.prototype;
var hasOwnProperty$9 = objectProto$a.hasOwnProperty;
var propertyIsEnumerable$1 = objectProto$a.propertyIsEnumerable;
var isArguments = baseIsArguments(function() {
  return arguments;
}()) ? baseIsArguments : function(value) {
  return isObjectLike(value) && hasOwnProperty$9.call(value, "callee") && !propertyIsEnumerable$1.call(value, "callee");
};
const isArguments$1 = isArguments;
function stubFalse() {
  return false;
}
var freeExports$2 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule$2 = freeExports$2 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports$2 = freeModule$2 && freeModule$2.exports === freeExports$2;
var Buffer$1 = moduleExports$2 ? root$1.Buffer : void 0;
var nativeIsBuffer = Buffer$1 ? Buffer$1.isBuffer : void 0;
var isBuffer = nativeIsBuffer || stubFalse;
const isBuffer$1 = isBuffer;
var argsTag$2 = "[object Arguments]", arrayTag$2 = "[object Array]", boolTag$3 = "[object Boolean]", dateTag$3 = "[object Date]", errorTag$2 = "[object Error]", funcTag$1 = "[object Function]", mapTag$5 = "[object Map]", numberTag$3 = "[object Number]", objectTag$3 = "[object Object]", regexpTag$3 = "[object RegExp]", setTag$5 = "[object Set]", stringTag$3 = "[object String]", weakMapTag$2 = "[object WeakMap]";
var arrayBufferTag$3 = "[object ArrayBuffer]", dataViewTag$4 = "[object DataView]", float32Tag$2 = "[object Float32Array]", float64Tag$2 = "[object Float64Array]", int8Tag$2 = "[object Int8Array]", int16Tag$2 = "[object Int16Array]", int32Tag$2 = "[object Int32Array]", uint8Tag$2 = "[object Uint8Array]", uint8ClampedTag$2 = "[object Uint8ClampedArray]", uint16Tag$2 = "[object Uint16Array]", uint32Tag$2 = "[object Uint32Array]";
var typedArrayTags = {};
typedArrayTags[float32Tag$2] = typedArrayTags[float64Tag$2] = typedArrayTags[int8Tag$2] = typedArrayTags[int16Tag$2] = typedArrayTags[int32Tag$2] = typedArrayTags[uint8Tag$2] = typedArrayTags[uint8ClampedTag$2] = typedArrayTags[uint16Tag$2] = typedArrayTags[uint32Tag$2] = true;
typedArrayTags[argsTag$2] = typedArrayTags[arrayTag$2] = typedArrayTags[arrayBufferTag$3] = typedArrayTags[boolTag$3] = typedArrayTags[dataViewTag$4] = typedArrayTags[dateTag$3] = typedArrayTags[errorTag$2] = typedArrayTags[funcTag$1] = typedArrayTags[mapTag$5] = typedArrayTags[numberTag$3] = typedArrayTags[objectTag$3] = typedArrayTags[regexpTag$3] = typedArrayTags[setTag$5] = typedArrayTags[stringTag$3] = typedArrayTags[weakMapTag$2] = false;
function baseIsTypedArray(value) {
  return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[baseGetTag(value)];
}
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}
var freeExports$1 = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule$1 = freeExports$1 && typeof module == "object" && module && !module.nodeType && module;
var moduleExports$1 = freeModule$1 && freeModule$1.exports === freeExports$1;
var freeProcess = moduleExports$1 && freeGlobal$1.process;
var nodeUtil = function() {
  try {
    var types = freeModule$1 && freeModule$1.require && freeModule$1.require("util").types;
    if (types) {
      return types;
    }
    return freeProcess && freeProcess.binding && freeProcess.binding("util");
  } catch (e) {
  }
}();
const nodeUtil$1 = nodeUtil;
var nodeIsTypedArray = nodeUtil$1 && nodeUtil$1.isTypedArray;
var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;
const isTypedArray$1 = isTypedArray;
var objectProto$9 = Object.prototype;
var hasOwnProperty$8 = objectProto$9.hasOwnProperty;
function arrayLikeKeys(value, inherited) {
  var isArr = isArray$1(value), isArg = !isArr && isArguments$1(value), isBuff = !isArr && !isArg && isBuffer$1(value), isType = !isArr && !isArg && !isBuff && isTypedArray$1(value), skipIndexes = isArr || isArg || isBuff || isType, result = skipIndexes ? baseTimes(value.length, String) : [], length = result.length;
  for (var key in value) {
    if ((inherited || hasOwnProperty$8.call(value, key)) && !(skipIndexes && // Safari 9 has enumerable `arguments.length` in strict mode.
    (key == "length" || // Node.js 0.10 has enumerable non-index properties on buffers.
    isBuff && (key == "offset" || key == "parent") || // PhantomJS 2 has enumerable non-index properties on typed arrays.
    isType && (key == "buffer" || key == "byteLength" || key == "byteOffset") || // Skip index properties.
    isIndex(key, length)))) {
      result.push(key);
    }
  }
  return result;
}
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}
var nativeKeys = overArg(Object.keys, Object);
const nativeKeys$1 = nativeKeys;
var objectProto$8 = Object.prototype;
var hasOwnProperty$7 = objectProto$8.hasOwnProperty;
function baseKeys(object) {
  if (!isPrototype(object)) {
    return nativeKeys$1(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$7.call(object, key) && key != "constructor") {
      result.push(key);
    }
  }
  return result;
}
function keys(object) {
  return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
}
var objectProto$7 = Object.prototype;
var hasOwnProperty$6 = objectProto$7.hasOwnProperty;
var assign = createAssigner(function(object, source) {
  if (isPrototype(source) || isArrayLike(source)) {
    copyObject(source, keys(source), object);
    return;
  }
  for (var key in source) {
    if (hasOwnProperty$6.call(source, key)) {
      assignValue(object, key, source[key]);
    }
  }
});
const assign$1 = assign;
function nativeKeysIn(object) {
  var result = [];
  if (object != null) {
    for (var key in Object(object)) {
      result.push(key);
    }
  }
  return result;
}
var objectProto$6 = Object.prototype;
var hasOwnProperty$5 = objectProto$6.hasOwnProperty;
function baseKeysIn(object) {
  if (!isObject(object)) {
    return nativeKeysIn(object);
  }
  var isProto = isPrototype(object), result = [];
  for (var key in object) {
    if (!(key == "constructor" && (isProto || !hasOwnProperty$5.call(object, key)))) {
      result.push(key);
    }
  }
  return result;
}
function keysIn(object) {
  return isArrayLike(object) ? arrayLikeKeys(object, true) : baseKeysIn(object);
}
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/, reIsPlainProp = /^\w*$/;
function isKey(value, object) {
  if (isArray$1(value)) {
    return false;
  }
  var type = typeof value;
  if (type == "number" || type == "symbol" || type == "boolean" || value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
}
var nativeCreate = getNative(Object, "create");
const nativeCreate$1 = nativeCreate;
function hashClear() {
  this.__data__ = nativeCreate$1 ? nativeCreate$1(null) : {};
  this.size = 0;
}
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}
var HASH_UNDEFINED$2 = "__lodash_hash_undefined__";
var objectProto$5 = Object.prototype;
var hasOwnProperty$4 = objectProto$5.hasOwnProperty;
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate$1) {
    var result = data[key];
    return result === HASH_UNDEFINED$2 ? void 0 : result;
  }
  return hasOwnProperty$4.call(data, key) ? data[key] : void 0;
}
var objectProto$4 = Object.prototype;
var hasOwnProperty$3 = objectProto$4.hasOwnProperty;
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate$1 ? data[key] !== void 0 : hasOwnProperty$3.call(data, key);
}
var HASH_UNDEFINED$1 = "__lodash_hash_undefined__";
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate$1 && value === void 0 ? HASH_UNDEFINED$1 : value;
  return this;
}
function Hash(entries) {
  var index2 = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
Hash.prototype.clear = hashClear;
Hash.prototype["delete"] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}
var arrayProto = Array.prototype;
var splice = arrayProto.splice;
function listCacheDelete(key) {
  var data = this.__data__, index2 = assocIndexOf(data, key);
  if (index2 < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index2 == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index2, 1);
  }
  --this.size;
  return true;
}
function listCacheGet(key) {
  var data = this.__data__, index2 = assocIndexOf(data, key);
  return index2 < 0 ? void 0 : data[index2][1];
}
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}
function listCacheSet(key, value) {
  var data = this.__data__, index2 = assocIndexOf(data, key);
  if (index2 < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index2][1] = value;
  }
  return this;
}
function ListCache(entries) {
  var index2 = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
ListCache.prototype.clear = listCacheClear;
ListCache.prototype["delete"] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;
var Map$1 = getNative(root$1, "Map");
const Map$2 = Map$1;
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    "hash": new Hash(),
    "map": new (Map$2 || ListCache)(),
    "string": new Hash()
  };
}
function isKeyable(value) {
  var type = typeof value;
  return type == "string" || type == "number" || type == "symbol" || type == "boolean" ? value !== "__proto__" : value === null;
}
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key) ? data[typeof key == "string" ? "string" : "hash"] : data.map;
}
function mapCacheDelete(key) {
  var result = getMapData(this, key)["delete"](key);
  this.size -= result ? 1 : 0;
  return result;
}
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}
function mapCacheSet(key, value) {
  var data = getMapData(this, key), size = data.size;
  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}
function MapCache(entries) {
  var index2 = -1, length = entries == null ? 0 : entries.length;
  this.clear();
  while (++index2 < length) {
    var entry = entries[index2];
    this.set(entry[0], entry[1]);
  }
}
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype["delete"] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;
var FUNC_ERROR_TEXT = "Expected a function";
function memoize(func, resolver) {
  if (typeof func != "function" || resolver != null && typeof resolver != "function") {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function() {
    var args = arguments, key = resolver ? resolver.apply(this, args) : args[0], cache = memoized.cache;
    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache)();
  return memoized;
}
memoize.Cache = MapCache;
var MAX_MEMOIZE_SIZE = 500;
function memoizeCapped(func) {
  var result = memoize(func, function(key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });
  var cache = result.cache;
  return result;
}
var rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
var reEscapeChar = /\\(\\)?/g;
var stringToPath = memoizeCapped(function(string) {
  var result = [];
  if (string.charCodeAt(0) === 46) {
    result.push("");
  }
  string.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, "$1") : number || match);
  });
  return result;
});
const stringToPath$1 = stringToPath;
function toString(value) {
  return value == null ? "" : baseToString(value);
}
function castPath(value, object) {
  if (isArray$1(value)) {
    return value;
  }
  return isKey(value, object) ? [value] : stringToPath$1(toString(value));
}
var INFINITY$1 = 1 / 0;
function toKey(value) {
  if (typeof value == "string" || isSymbol(value)) {
    return value;
  }
  var result = value + "";
  return result == "0" && 1 / value == -INFINITY$1 ? "-0" : result;
}
function baseGet(object, path) {
  path = castPath(path, object);
  var index2 = 0, length = path.length;
  while (object != null && index2 < length) {
    object = object[toKey(path[index2++])];
  }
  return index2 && index2 == length ? object : void 0;
}
function arrayPush(array, values) {
  var index2 = -1, length = values.length, offset = array.length;
  while (++index2 < length) {
    array[offset + index2] = values[index2];
  }
  return array;
}
var spreadableSymbol = Symbol$2 ? Symbol$2.isConcatSpreadable : void 0;
function isFlattenable(value) {
  return isArray$1(value) || isArguments$1(value) || !!(spreadableSymbol && value && value[spreadableSymbol]);
}
function baseFlatten(array, depth, predicate, isStrict, result) {
  var index2 = -1, length = array.length;
  predicate || (predicate = isFlattenable);
  result || (result = []);
  while (++index2 < length) {
    var value = array[index2];
    if (depth > 0 && predicate(value)) {
      if (depth > 1) {
        baseFlatten(value, depth - 1, predicate, isStrict, result);
      } else {
        arrayPush(result, value);
      }
    } else if (!isStrict) {
      result[result.length] = value;
    }
  }
  return result;
}
function flatten(array) {
  var length = array == null ? 0 : array.length;
  return length ? baseFlatten(array, 1) : [];
}
function flatRest(func) {
  return setToString$1(overRest(func, void 0, flatten), func + "");
}
var getPrototype = overArg(Object.getPrototypeOf, Object);
const getPrototype$1 = getPrototype;
function baseClamp(number, lower, upper) {
  if (number === number) {
    if (upper !== void 0) {
      number = number <= upper ? number : upper;
    }
    if (lower !== void 0) {
      number = number >= lower ? number : lower;
    }
  }
  return number;
}
function clamp(number, lower, upper) {
  if (upper === void 0) {
    upper = lower;
    lower = void 0;
  }
  if (upper !== void 0) {
    upper = toNumber(upper);
    upper = upper === upper ? upper : 0;
  }
  if (lower !== void 0) {
    lower = toNumber(lower);
    lower = lower === lower ? lower : 0;
  }
  return baseClamp(toNumber(number), lower, upper);
}
function stackClear() {
  this.__data__ = new ListCache();
  this.size = 0;
}
function stackDelete(key) {
  var data = this.__data__, result = data["delete"](key);
  this.size = data.size;
  return result;
}
function stackGet(key) {
  return this.__data__.get(key);
}
function stackHas(key) {
  return this.__data__.has(key);
}
var LARGE_ARRAY_SIZE$1 = 200;
function stackSet(key, value) {
  var data = this.__data__;
  if (data instanceof ListCache) {
    var pairs = data.__data__;
    if (!Map$2 || pairs.length < LARGE_ARRAY_SIZE$1 - 1) {
      pairs.push([key, value]);
      this.size = ++data.size;
      return this;
    }
    data = this.__data__ = new MapCache(pairs);
  }
  data.set(key, value);
  this.size = data.size;
  return this;
}
function Stack(entries) {
  var data = this.__data__ = new ListCache(entries);
  this.size = data.size;
}
Stack.prototype.clear = stackClear;
Stack.prototype["delete"] = stackDelete;
Stack.prototype.get = stackGet;
Stack.prototype.has = stackHas;
Stack.prototype.set = stackSet;
function baseAssign(object, source) {
  return object && copyObject(source, keys(source), object);
}
function baseAssignIn(object, source) {
  return object && copyObject(source, keysIn(source), object);
}
var freeExports = typeof exports == "object" && exports && !exports.nodeType && exports;
var freeModule = freeExports && typeof module == "object" && module && !module.nodeType && module;
var moduleExports = freeModule && freeModule.exports === freeExports;
var Buffer2 = moduleExports ? root$1.Buffer : void 0, allocUnsafe = Buffer2 ? Buffer2.allocUnsafe : void 0;
function cloneBuffer(buffer, isDeep) {
  if (isDeep) {
    return buffer.slice();
  }
  var length = buffer.length, result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);
  buffer.copy(result);
  return result;
}
function arrayFilter(array, predicate) {
  var index2 = -1, length = array == null ? 0 : array.length, resIndex = 0, result = [];
  while (++index2 < length) {
    var value = array[index2];
    if (predicate(value, index2, array)) {
      result[resIndex++] = value;
    }
  }
  return result;
}
function stubArray() {
  return [];
}
var objectProto$3 = Object.prototype;
var propertyIsEnumerable = objectProto$3.propertyIsEnumerable;
var nativeGetSymbols$1 = Object.getOwnPropertySymbols;
var getSymbols = !nativeGetSymbols$1 ? stubArray : function(object) {
  if (object == null) {
    return [];
  }
  object = Object(object);
  return arrayFilter(nativeGetSymbols$1(object), function(symbol) {
    return propertyIsEnumerable.call(object, symbol);
  });
};
const getSymbols$1 = getSymbols;
function copySymbols(source, object) {
  return copyObject(source, getSymbols$1(source), object);
}
var nativeGetSymbols = Object.getOwnPropertySymbols;
var getSymbolsIn = !nativeGetSymbols ? stubArray : function(object) {
  var result = [];
  while (object) {
    arrayPush(result, getSymbols$1(object));
    object = getPrototype$1(object);
  }
  return result;
};
const getSymbolsIn$1 = getSymbolsIn;
function copySymbolsIn(source, object) {
  return copyObject(source, getSymbolsIn$1(source), object);
}
function baseGetAllKeys(object, keysFunc, symbolsFunc) {
  var result = keysFunc(object);
  return isArray$1(object) ? result : arrayPush(result, symbolsFunc(object));
}
function getAllKeys(object) {
  return baseGetAllKeys(object, keys, getSymbols$1);
}
function getAllKeysIn(object) {
  return baseGetAllKeys(object, keysIn, getSymbolsIn$1);
}
var DataView = getNative(root$1, "DataView");
const DataView$1 = DataView;
var Promise$1 = getNative(root$1, "Promise");
const Promise$2 = Promise$1;
var Set$1 = getNative(root$1, "Set");
const Set$2 = Set$1;
var mapTag$4 = "[object Map]", objectTag$2 = "[object Object]", promiseTag = "[object Promise]", setTag$4 = "[object Set]", weakMapTag$1 = "[object WeakMap]";
var dataViewTag$3 = "[object DataView]";
var dataViewCtorString = toSource(DataView$1), mapCtorString = toSource(Map$2), promiseCtorString = toSource(Promise$2), setCtorString = toSource(Set$2), weakMapCtorString = toSource(WeakMap$1);
var getTag = baseGetTag;
if (DataView$1 && getTag(new DataView$1(new ArrayBuffer(1))) != dataViewTag$3 || Map$2 && getTag(new Map$2()) != mapTag$4 || Promise$2 && getTag(Promise$2.resolve()) != promiseTag || Set$2 && getTag(new Set$2()) != setTag$4 || WeakMap$1 && getTag(new WeakMap$1()) != weakMapTag$1) {
  getTag = function(value) {
    var result = baseGetTag(value), Ctor = result == objectTag$2 ? value.constructor : void 0, ctorString = Ctor ? toSource(Ctor) : "";
    if (ctorString) {
      switch (ctorString) {
        case dataViewCtorString:
          return dataViewTag$3;
        case mapCtorString:
          return mapTag$4;
        case promiseCtorString:
          return promiseTag;
        case setCtorString:
          return setTag$4;
        case weakMapCtorString:
          return weakMapTag$1;
      }
    }
    return result;
  };
}
const getTag$1 = getTag;
var objectProto$2 = Object.prototype;
var hasOwnProperty$2 = objectProto$2.hasOwnProperty;
function initCloneArray(array) {
  var length = array.length, result = new array.constructor(length);
  if (length && typeof array[0] == "string" && hasOwnProperty$2.call(array, "index")) {
    result.index = array.index;
    result.input = array.input;
  }
  return result;
}
var Uint8Array$1 = root$1.Uint8Array;
const Uint8Array$2 = Uint8Array$1;
function cloneArrayBuffer(arrayBuffer) {
  var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
  new Uint8Array$2(result).set(new Uint8Array$2(arrayBuffer));
  return result;
}
function cloneDataView(dataView, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
  return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
}
var reFlags = /\w*$/;
function cloneRegExp(regexp) {
  var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
  result.lastIndex = regexp.lastIndex;
  return result;
}
var symbolProto$1 = Symbol$2 ? Symbol$2.prototype : void 0, symbolValueOf$1 = symbolProto$1 ? symbolProto$1.valueOf : void 0;
function cloneSymbol(symbol) {
  return symbolValueOf$1 ? Object(symbolValueOf$1.call(symbol)) : {};
}
function cloneTypedArray(typedArray, isDeep) {
  var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
  return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
}
var boolTag$2 = "[object Boolean]", dateTag$2 = "[object Date]", mapTag$3 = "[object Map]", numberTag$2 = "[object Number]", regexpTag$2 = "[object RegExp]", setTag$3 = "[object Set]", stringTag$2 = "[object String]", symbolTag$2 = "[object Symbol]";
var arrayBufferTag$2 = "[object ArrayBuffer]", dataViewTag$2 = "[object DataView]", float32Tag$1 = "[object Float32Array]", float64Tag$1 = "[object Float64Array]", int8Tag$1 = "[object Int8Array]", int16Tag$1 = "[object Int16Array]", int32Tag$1 = "[object Int32Array]", uint8Tag$1 = "[object Uint8Array]", uint8ClampedTag$1 = "[object Uint8ClampedArray]", uint16Tag$1 = "[object Uint16Array]", uint32Tag$1 = "[object Uint32Array]";
function initCloneByTag(object, tag, isDeep) {
  var Ctor = object.constructor;
  switch (tag) {
    case arrayBufferTag$2:
      return cloneArrayBuffer(object);
    case boolTag$2:
    case dateTag$2:
      return new Ctor(+object);
    case dataViewTag$2:
      return cloneDataView(object, isDeep);
    case float32Tag$1:
    case float64Tag$1:
    case int8Tag$1:
    case int16Tag$1:
    case int32Tag$1:
    case uint8Tag$1:
    case uint8ClampedTag$1:
    case uint16Tag$1:
    case uint32Tag$1:
      return cloneTypedArray(object, isDeep);
    case mapTag$3:
      return new Ctor();
    case numberTag$2:
    case stringTag$2:
      return new Ctor(object);
    case regexpTag$2:
      return cloneRegExp(object);
    case setTag$3:
      return new Ctor();
    case symbolTag$2:
      return cloneSymbol(object);
  }
}
function initCloneObject(object) {
  return typeof object.constructor == "function" && !isPrototype(object) ? baseCreate$1(getPrototype$1(object)) : {};
}
var mapTag$2 = "[object Map]";
function baseIsMap(value) {
  return isObjectLike(value) && getTag$1(value) == mapTag$2;
}
var nodeIsMap = nodeUtil$1 && nodeUtil$1.isMap;
var isMap = nodeIsMap ? baseUnary(nodeIsMap) : baseIsMap;
const isMap$1 = isMap;
var setTag$2 = "[object Set]";
function baseIsSet(value) {
  return isObjectLike(value) && getTag$1(value) == setTag$2;
}
var nodeIsSet = nodeUtil$1 && nodeUtil$1.isSet;
var isSet = nodeIsSet ? baseUnary(nodeIsSet) : baseIsSet;
const isSet$1 = isSet;
var CLONE_DEEP_FLAG$1 = 1, CLONE_FLAT_FLAG = 2, CLONE_SYMBOLS_FLAG$1 = 4;
var argsTag$1 = "[object Arguments]", arrayTag$1 = "[object Array]", boolTag$1 = "[object Boolean]", dateTag$1 = "[object Date]", errorTag$1 = "[object Error]", funcTag = "[object Function]", genTag = "[object GeneratorFunction]", mapTag$1 = "[object Map]", numberTag$1 = "[object Number]", objectTag$1 = "[object Object]", regexpTag$1 = "[object RegExp]", setTag$1 = "[object Set]", stringTag$1 = "[object String]", symbolTag$1 = "[object Symbol]", weakMapTag = "[object WeakMap]";
var arrayBufferTag$1 = "[object ArrayBuffer]", dataViewTag$1 = "[object DataView]", float32Tag = "[object Float32Array]", float64Tag = "[object Float64Array]", int8Tag = "[object Int8Array]", int16Tag = "[object Int16Array]", int32Tag = "[object Int32Array]", uint8Tag = "[object Uint8Array]", uint8ClampedTag = "[object Uint8ClampedArray]", uint16Tag = "[object Uint16Array]", uint32Tag = "[object Uint32Array]";
var cloneableTags = {};
cloneableTags[argsTag$1] = cloneableTags[arrayTag$1] = cloneableTags[arrayBufferTag$1] = cloneableTags[dataViewTag$1] = cloneableTags[boolTag$1] = cloneableTags[dateTag$1] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag$1] = cloneableTags[numberTag$1] = cloneableTags[objectTag$1] = cloneableTags[regexpTag$1] = cloneableTags[setTag$1] = cloneableTags[stringTag$1] = cloneableTags[symbolTag$1] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag$1] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;
function baseClone(value, bitmask, customizer, key, object, stack) {
  var result, isDeep = bitmask & CLONE_DEEP_FLAG$1, isFlat = bitmask & CLONE_FLAT_FLAG, isFull = bitmask & CLONE_SYMBOLS_FLAG$1;
  if (customizer) {
    result = object ? customizer(value, key, object, stack) : customizer(value);
  }
  if (result !== void 0) {
    return result;
  }
  if (!isObject(value)) {
    return value;
  }
  var isArr = isArray$1(value);
  if (isArr) {
    result = initCloneArray(value);
    if (!isDeep) {
      return copyArray(value, result);
    }
  } else {
    var tag = getTag$1(value), isFunc = tag == funcTag || tag == genTag;
    if (isBuffer$1(value)) {
      return cloneBuffer(value, isDeep);
    }
    if (tag == objectTag$1 || tag == argsTag$1 || isFunc && !object) {
      result = isFlat || isFunc ? {} : initCloneObject(value);
      if (!isDeep) {
        return isFlat ? copySymbolsIn(value, baseAssignIn(result, value)) : copySymbols(value, baseAssign(result, value));
      }
    } else {
      if (!cloneableTags[tag]) {
        return object ? value : {};
      }
      result = initCloneByTag(value, tag, isDeep);
    }
  }
  stack || (stack = new Stack());
  var stacked = stack.get(value);
  if (stacked) {
    return stacked;
  }
  stack.set(value, result);
  if (isSet$1(value)) {
    value.forEach(function(subValue) {
      result.add(baseClone(subValue, bitmask, customizer, subValue, value, stack));
    });
  } else if (isMap$1(value)) {
    value.forEach(function(subValue, key2) {
      result.set(key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
    });
  }
  var keysFunc = isFull ? isFlat ? getAllKeysIn : getAllKeys : isFlat ? keysIn : keys;
  var props = isArr ? void 0 : keysFunc(value);
  arrayEach(props || value, function(subValue, key2) {
    if (props) {
      key2 = subValue;
      subValue = value[key2];
    }
    assignValue(result, key2, baseClone(subValue, bitmask, customizer, key2, value, stack));
  });
  return result;
}
var CLONE_DEEP_FLAG = 1, CLONE_SYMBOLS_FLAG = 4;
function cloneDeep(value) {
  return baseClone(value, CLONE_DEEP_FLAG | CLONE_SYMBOLS_FLAG);
}
var HASH_UNDEFINED = "__lodash_hash_undefined__";
function setCacheAdd(value) {
  this.__data__.set(value, HASH_UNDEFINED);
  return this;
}
function setCacheHas(value) {
  return this.__data__.has(value);
}
function SetCache(values) {
  var index2 = -1, length = values == null ? 0 : values.length;
  this.__data__ = new MapCache();
  while (++index2 < length) {
    this.add(values[index2]);
  }
}
SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
SetCache.prototype.has = setCacheHas;
function arraySome(array, predicate) {
  var index2 = -1, length = array == null ? 0 : array.length;
  while (++index2 < length) {
    if (predicate(array[index2], index2, array)) {
      return true;
    }
  }
  return false;
}
function cacheHas(cache, key) {
  return cache.has(key);
}
var COMPARE_PARTIAL_FLAG$3 = 1, COMPARE_UNORDERED_FLAG$1 = 2;
function equalArrays(array, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$3, arrLength = array.length, othLength = other.length;
  if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
    return false;
  }
  var arrStacked = stack.get(array);
  var othStacked = stack.get(other);
  if (arrStacked && othStacked) {
    return arrStacked == other && othStacked == array;
  }
  var index2 = -1, result = true, seen = bitmask & COMPARE_UNORDERED_FLAG$1 ? new SetCache() : void 0;
  stack.set(array, other);
  stack.set(other, array);
  while (++index2 < arrLength) {
    var arrValue = array[index2], othValue = other[index2];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, arrValue, index2, other, array, stack) : customizer(arrValue, othValue, index2, array, other, stack);
    }
    if (compared !== void 0) {
      if (compared) {
        continue;
      }
      result = false;
      break;
    }
    if (seen) {
      if (!arraySome(other, function(othValue2, othIndex) {
        if (!cacheHas(seen, othIndex) && (arrValue === othValue2 || equalFunc(arrValue, othValue2, bitmask, customizer, stack))) {
          return seen.push(othIndex);
        }
      })) {
        result = false;
        break;
      }
    } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, bitmask, customizer, stack))) {
      result = false;
      break;
    }
  }
  stack["delete"](array);
  stack["delete"](other);
  return result;
}
function mapToArray(map) {
  var index2 = -1, result = Array(map.size);
  map.forEach(function(value, key) {
    result[++index2] = [key, value];
  });
  return result;
}
function setToArray(set) {
  var index2 = -1, result = Array(set.size);
  set.forEach(function(value) {
    result[++index2] = value;
  });
  return result;
}
var COMPARE_PARTIAL_FLAG$2 = 1, COMPARE_UNORDERED_FLAG = 2;
var boolTag = "[object Boolean]", dateTag = "[object Date]", errorTag = "[object Error]", mapTag = "[object Map]", numberTag = "[object Number]", regexpTag = "[object RegExp]", setTag = "[object Set]", stringTag = "[object String]", symbolTag = "[object Symbol]";
var arrayBufferTag = "[object ArrayBuffer]", dataViewTag = "[object DataView]";
var symbolProto = Symbol$2 ? Symbol$2.prototype : void 0, symbolValueOf = symbolProto ? symbolProto.valueOf : void 0;
function equalByTag(object, other, tag, bitmask, customizer, equalFunc, stack) {
  switch (tag) {
    case dataViewTag:
      if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
        return false;
      }
      object = object.buffer;
      other = other.buffer;
    case arrayBufferTag:
      if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array$2(object), new Uint8Array$2(other))) {
        return false;
      }
      return true;
    case boolTag:
    case dateTag:
    case numberTag:
      return eq(+object, +other);
    case errorTag:
      return object.name == other.name && object.message == other.message;
    case regexpTag:
    case stringTag:
      return object == other + "";
    case mapTag:
      var convert = mapToArray;
    case setTag:
      var isPartial = bitmask & COMPARE_PARTIAL_FLAG$2;
      convert || (convert = setToArray);
      if (object.size != other.size && !isPartial) {
        return false;
      }
      var stacked = stack.get(object);
      if (stacked) {
        return stacked == other;
      }
      bitmask |= COMPARE_UNORDERED_FLAG;
      stack.set(object, other);
      var result = equalArrays(convert(object), convert(other), bitmask, customizer, equalFunc, stack);
      stack["delete"](object);
      return result;
    case symbolTag:
      if (symbolValueOf) {
        return symbolValueOf.call(object) == symbolValueOf.call(other);
      }
  }
  return false;
}
var COMPARE_PARTIAL_FLAG$1 = 1;
var objectProto$1 = Object.prototype;
var hasOwnProperty$1 = objectProto$1.hasOwnProperty;
function equalObjects(object, other, bitmask, customizer, equalFunc, stack) {
  var isPartial = bitmask & COMPARE_PARTIAL_FLAG$1, objProps = getAllKeys(object), objLength = objProps.length, othProps = getAllKeys(other), othLength = othProps.length;
  if (objLength != othLength && !isPartial) {
    return false;
  }
  var index2 = objLength;
  while (index2--) {
    var key = objProps[index2];
    if (!(isPartial ? key in other : hasOwnProperty$1.call(other, key))) {
      return false;
    }
  }
  var objStacked = stack.get(object);
  var othStacked = stack.get(other);
  if (objStacked && othStacked) {
    return objStacked == other && othStacked == object;
  }
  var result = true;
  stack.set(object, other);
  stack.set(other, object);
  var skipCtor = isPartial;
  while (++index2 < objLength) {
    key = objProps[index2];
    var objValue = object[key], othValue = other[key];
    if (customizer) {
      var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
    }
    if (!(compared === void 0 ? objValue === othValue || equalFunc(objValue, othValue, bitmask, customizer, stack) : compared)) {
      result = false;
      break;
    }
    skipCtor || (skipCtor = key == "constructor");
  }
  if (result && !skipCtor) {
    var objCtor = object.constructor, othCtor = other.constructor;
    if (objCtor != othCtor && ("constructor" in object && "constructor" in other) && !(typeof objCtor == "function" && objCtor instanceof objCtor && typeof othCtor == "function" && othCtor instanceof othCtor)) {
      result = false;
    }
  }
  stack["delete"](object);
  stack["delete"](other);
  return result;
}
var COMPARE_PARTIAL_FLAG = 1;
var argsTag = "[object Arguments]", arrayTag = "[object Array]", objectTag = "[object Object]";
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
function baseIsEqualDeep(object, other, bitmask, customizer, equalFunc, stack) {
  var objIsArr = isArray$1(object), othIsArr = isArray$1(other), objTag = objIsArr ? arrayTag : getTag$1(object), othTag = othIsArr ? arrayTag : getTag$1(other);
  objTag = objTag == argsTag ? objectTag : objTag;
  othTag = othTag == argsTag ? objectTag : othTag;
  var objIsObj = objTag == objectTag, othIsObj = othTag == objectTag, isSameTag = objTag == othTag;
  if (isSameTag && isBuffer$1(object)) {
    if (!isBuffer$1(other)) {
      return false;
    }
    objIsArr = true;
    objIsObj = false;
  }
  if (isSameTag && !objIsObj) {
    stack || (stack = new Stack());
    return objIsArr || isTypedArray$1(object) ? equalArrays(object, other, bitmask, customizer, equalFunc, stack) : equalByTag(object, other, objTag, bitmask, customizer, equalFunc, stack);
  }
  if (!(bitmask & COMPARE_PARTIAL_FLAG)) {
    var objIsWrapped = objIsObj && hasOwnProperty.call(object, "__wrapped__"), othIsWrapped = othIsObj && hasOwnProperty.call(other, "__wrapped__");
    if (objIsWrapped || othIsWrapped) {
      var objUnwrapped = objIsWrapped ? object.value() : object, othUnwrapped = othIsWrapped ? other.value() : other;
      stack || (stack = new Stack());
      return equalFunc(objUnwrapped, othUnwrapped, bitmask, customizer, stack);
    }
  }
  if (!isSameTag) {
    return false;
  }
  stack || (stack = new Stack());
  return equalObjects(object, other, bitmask, customizer, equalFunc, stack);
}
function baseIsEqual(value, other, bitmask, customizer, stack) {
  if (value === other) {
    return true;
  }
  if (value == null || other == null || !isObjectLike(value) && !isObjectLike(other)) {
    return value !== value && other !== other;
  }
  return baseIsEqualDeep(value, other, bitmask, customizer, baseIsEqual, stack);
}
function baseHasIn(object, key) {
  return object != null && key in Object(object);
}
function hasPath(object, path, hasFunc) {
  path = castPath(path, object);
  var index2 = -1, length = path.length, result = false;
  while (++index2 < length) {
    var key = toKey(path[index2]);
    if (!(result = object != null && hasFunc(object, key))) {
      break;
    }
    object = object[key];
  }
  if (result || ++index2 != length) {
    return result;
  }
  length = object == null ? 0 : object.length;
  return !!length && isLength(length) && isIndex(key, length) && (isArray$1(object) || isArguments$1(object));
}
function hasIn(object, path) {
  return object != null && hasPath(object, path, baseHasIn);
}
function isArrayLikeObject(value) {
  return isObjectLike(value) && isArrayLike(value);
}
function arrayIncludesWith(array, value, comparator) {
  var index2 = -1, length = array == null ? 0 : array.length;
  while (++index2 < length) {
    if (comparator(value, array[index2])) {
      return true;
    }
  }
  return false;
}
function last(array) {
  var length = array == null ? 0 : array.length;
  return length ? array[length - 1] : void 0;
}
function isEqual(value, other) {
  return baseIsEqual(value, other);
}
function baseSet(object, path, value, customizer) {
  if (!isObject(object)) {
    return object;
  }
  path = castPath(path, object);
  var index2 = -1, length = path.length, lastIndex = length - 1, nested = object;
  while (nested != null && ++index2 < length) {
    var key = toKey(path[index2]), newValue = value;
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return object;
    }
    if (index2 != lastIndex) {
      var objValue = nested[key];
      newValue = customizer ? customizer(objValue, key, nested) : void 0;
      if (newValue === void 0) {
        newValue = isObject(objValue) ? objValue : isIndex(path[index2 + 1]) ? [] : {};
      }
    }
    assignValue(nested, key, newValue);
    nested = nested[key];
  }
  return object;
}
function basePickBy(object, paths, predicate) {
  var index2 = -1, length = paths.length, result = {};
  while (++index2 < length) {
    var path = paths[index2], value = baseGet(object, path);
    if (predicate(value, path)) {
      baseSet(result, castPath(path, object), value);
    }
  }
  return result;
}
function basePick(object, paths) {
  return basePickBy(object, paths, function(value, path) {
    return hasIn(object, path);
  });
}
var pick = flatRest(function(object, paths) {
  return object == null ? {} : basePick(object, paths);
});
const pick$1 = pick;
var INFINITY = 1 / 0;
var createSet = !(Set$2 && 1 / setToArray(new Set$2([, -0]))[1] == INFINITY) ? noop : function(values) {
  return new Set$2(values);
};
const createSet$1 = createSet;
var LARGE_ARRAY_SIZE = 200;
function baseUniq(array, iteratee, comparator) {
  var index2 = -1, includes = arrayIncludes, length = array.length, isCommon = true, result = [], seen = result;
  if (comparator) {
    isCommon = false;
    includes = arrayIncludesWith;
  } else if (length >= LARGE_ARRAY_SIZE) {
    var set = iteratee ? null : createSet$1(array);
    if (set) {
      return setToArray(set);
    }
    isCommon = false;
    includes = cacheHas;
    seen = new SetCache();
  } else {
    seen = iteratee ? [] : result;
  }
  outer:
    while (++index2 < length) {
      var value = array[index2], computed2 = iteratee ? iteratee(value) : value;
      value = comparator || value !== 0 ? value : 0;
      if (isCommon && computed2 === computed2) {
        var seenIndex = seen.length;
        while (seenIndex--) {
          if (seen[seenIndex] === computed2) {
            continue outer;
          }
        }
        if (iteratee) {
          seen.push(computed2);
        }
        result.push(value);
      } else if (!includes(seen, computed2, comparator)) {
        if (seen !== result) {
          seen.push(computed2);
        }
        result.push(value);
      }
    }
  return result;
}
var unionWith = baseRest(function(arrays) {
  var comparator = last(arrays);
  comparator = typeof comparator == "function" ? comparator : void 0;
  return baseUniq(baseFlatten(arrays, 1, isArrayLikeObject, true), void 0, comparator);
});
const unionWith$1 = unionWith;
const popper = "";
const createPopper = ({
  reference,
  mountEl,
  popperContainer,
  popper: popper2,
  isCover = true
}) => {
  if (!reference || !popper2) {
    return;
  }
  console.log("createPopper", reference, popper2);
  let popperEl = null;
  if (popper2 instanceof HTMLElement) {
    popperEl = popper2;
  } else {
    popperEl = document.createElement("div");
    popper2.mount(popperEl);
  }
  console.log("popperEl", popperEl);
  const {
    left: referenceLeft,
    top: referenceTop,
    width: referenceWidth,
    height: referenceHeight
  } = reference.getBoundingClientRect();
  const scrollLeft = mountEl.scrollLeft;
  const scrollTop = mountEl.scrollTop;
  const {
    left: mountElLeft,
    top: mountElTop,
    right: mountElRight,
    bottom: mountElBottom,
    width: mountElWidth,
    height: mountElHeight
  } = mountEl.getBoundingClientRect();
  popperContainer.innerHTML = "";
  if (isCover) {
    const left = referenceLeft - mountElLeft + scrollLeft - 1;
    const top = referenceTop - mountElTop + scrollTop - 1;
    popperContainer.style.left = `${left}px`;
    popperContainer.style.top = `${top}px`;
    popperContainer.style.width = `${referenceWidth + 1}px`;
    popperContainer.style.minHeight = `${referenceHeight + 1}px`;
    popperContainer.style.border = `border: 2px solid var(--#{$prefix}-select-border-color);`;
  } else {
    popperContainer.style.left = `${referenceLeft - mountElLeft + scrollLeft - 2}px`;
    popperContainer.style.top = `${referenceTop - mountElTop + referenceHeight + scrollTop + 2}px`;
  }
  popperContainer.appendChild(popperEl);
  mountEl.appendChild(popperContainer);
  if (isCover) {
    const diff = popperContainer.getBoundingClientRect().bottom - mountEl.getBoundingClientRect().bottom;
    if (diff > 0) {
      const scrollbarHeight = mountEl.offsetHeight - mountEl.clientHeight;
      popperContainer.style.top = `${referenceTop - mountElTop + scrollTop - 1 - diff - scrollbarHeight}px`;
    }
  } else {
    const diffBottom = popperContainer.getBoundingClientRect().bottom - mountEl.getBoundingClientRect().bottom;
    if (diffBottom > 0) {
      popperContainer.style.top = `${referenceTop - mountElTop + referenceHeight + scrollTop + 2 - popperContainer.getBoundingClientRect().height - reference.getBoundingClientRect().height - 4}px`;
    }
    const diffRight = popperContainer.getBoundingClientRect().right - mountEl.getBoundingClientRect().right;
    if (diffRight > 0) {
      const scrollbarWidth = mountEl.offsetWidth - mountEl.clientWidth;
      popperContainer.style.left = `${referenceLeft - mountElLeft + scrollLeft - 2 - diffRight - scrollbarWidth}px`;
    }
  }
  function toggleRender() {
    if (mountEl.contains(popperContainer)) {
      mountEl.removeChild(popperContainer);
    } else {
      mountEl.appendChild(popperContainer);
    }
  }
  return {
    toggleRender
  };
};
class PopperStore {
  constructor(gridStore) {
    __publicField(this, "gridStore");
    __publicField(this, "coverEl", null);
    __publicField(this, "coverApp", null);
    __publicField(this, "dropdownEl", null);
    __publicField(this, "dropdownApp", null);
    __publicField(this, "tdData");
    this.gridStore = gridStore;
    this.coverEl = document.createElement("div");
    this.coverEl.classList.add("vtg-popper-container");
    this.coverEl.addEventListener("click", this.toggleDropdownRender.bind(this));
    this.dropdownEl = document.createElement("div");
    this.dropdownEl.classList.add("vtg-popper-container");
  }
  coverRender(tdData) {
    var _a;
    this.tdData = tdData;
    if (!this.coverEl || !this.gridStore.clientEl)
      return;
    if (!isFunction((_a = tdData == null ? void 0 : tdData.column) == null ? void 0 : _a.cellCoverRender)) {
      this.dropdownRender(tdData);
      return;
    }
    this.coverApp = createApp({
      render: () => {
        var _a2, _b;
        return (_b = (_a2 = tdData.column).cellCoverRender) == null ? void 0 : _b.call(_a2, tdData, () => {
          this.remove();
        });
      }
    });
    createPopper({
      reference: tdData.el,
      mountEl: this.gridStore.clientEl,
      popperContainer: this.coverEl,
      popper: this.coverApp,
      isCover: true
    });
  }
  toggleDropdownRender() {
    var _a, _b, _c;
    console.log("111", this.tdData);
    if (!this.dropdownEl)
      return;
    console.log("toggleDropdownRender", this.dropdownEl, this.dropdownApp);
    if (this.dropdownApp && ((_a = this.gridStore.clientEl) == null ? void 0 : _a.contains(this.dropdownEl))) {
      (_b = this.gridStore.clientEl) == null ? void 0 : _b.removeChild(this.dropdownEl);
    } else if (this.dropdownApp) {
      (_c = this.gridStore.clientEl) == null ? void 0 : _c.appendChild(this.dropdownEl);
    } else {
      this.dropdownRender(this.tdData);
    }
  }
  dropdownRender(tdData) {
    var _a;
    if (!this.coverEl || !this.dropdownEl || !this.gridStore.clientEl)
      return;
    if (!isFunction((_a = tdData == null ? void 0 : tdData.column) == null ? void 0 : _a.cellDropdownRender))
      return;
    this.dropdownApp = createApp({
      render: () => {
        var _a2, _b;
        return (_b = (_a2 = tdData.column).cellDropdownRender) == null ? void 0 : _b.call(_a2, tdData);
      }
    });
    createPopper({
      reference: this.coverEl,
      mountEl: this.gridStore.clientEl,
      popperContainer: this.dropdownEl,
      popper: this.dropdownApp,
      isCover: false
    });
  }
  remove() {
    var _a, _b, _c, _d;
    console.log("remove");
    if (this.coverEl && ((_a = this.gridStore.clientEl) == null ? void 0 : _a.contains(this.coverEl))) {
      (_b = this.gridStore.clientEl) == null ? void 0 : _b.removeChild(this.coverEl);
      this.coverApp = null;
      this.coverEl.removeEventListener("click", this.toggleDropdownRender);
    }
    if (this.dropdownEl && ((_c = this.gridStore.clientEl) == null ? void 0 : _c.contains(this.dropdownEl))) {
      (_d = this.gridStore.clientEl) == null ? void 0 : _d.removeChild(this.dropdownEl);
      this.dropdownApp = null;
    }
  }
}
function isInMergeCell(mergeInfo, rowIndex, colIndex) {
  return mergeInfo.rowIndex <= rowIndex && mergeInfo.rowIndex + mergeInfo.rowspan - 1 >= rowIndex && mergeInfo.colIndex <= colIndex && mergeInfo.colIndex + mergeInfo.colspan - 1 >= colIndex;
}
function getMergeInfo(merges, rowIndex, colIndex) {
  for (let i = 0; i < merges.length; i += 1) {
    if (isInMergeCell(merges[i], rowIndex, colIndex)) {
      return merges[i];
    }
  }
  return null;
}
function calcRenderRect(merges, originRect) {
  const topMerges = [];
  const leftMerges = [];
  const rightMerges = [];
  const bottomMerges = [];
  const { ys: oys, ye: oye, xs: oxs, xe: oxe } = originRect;
  let rys = originRect.ys;
  let rye = originRect.ye;
  let rxs = originRect.xs;
  let rxe = originRect.xe;
  for (let y = oys; y <= oye; y++) {
    for (let x = oxs; x <= oxe; x++) {
      if (y === oys) {
        const mergeInfo = getMergeInfo(merges, y, x);
        if (mergeInfo) {
          const { rowIndex, colIndex, colspan } = mergeInfo;
          rys = Math.min(rys, rowIndex);
          rxs = Math.min(rxs, colIndex);
          rxe = Math.max(rxe, colIndex + colspan - 1);
          if (y > rowIndex) {
            topMerges.push(mergeInfo);
          }
        }
      }
      if (x === oxs) {
        const mergeInfo = getMergeInfo(merges, y, x);
        if (mergeInfo) {
          const { colIndex } = mergeInfo;
          rxs = Math.min(rxs, colIndex);
          if (x > colIndex) {
            leftMerges.push(mergeInfo);
          }
        }
      }
      if (x === oxe) {
        const mergeInfo = getMergeInfo(merges, y, x);
        if (mergeInfo) {
          const { colIndex, colspan } = mergeInfo;
          rxe = Math.max(rxe, colIndex + colspan - 1);
          rightMerges.push(mergeInfo);
        }
      }
      if (y === oye) {
        const mergeInfo = getMergeInfo(merges, y, x);
        if (mergeInfo) {
          const { rowIndex, rowspan } = mergeInfo;
          rye = Math.max(rye, rowIndex + rowspan - 1);
          bottomMerges.push(mergeInfo);
        }
      }
    }
  }
  return {
    renderRect: { ys: rys, ye: rye, xs: rxs, xe: rxe },
    merges: {
      topMerges,
      leftMerges,
      rightMerges,
      bottomMerges
    }
  };
}
class GridMerges {
  constructor(store) {
    __publicField(this, "merges", []);
    // 生成渲染合并单元格
    __publicField(this, "tempMerges", []);
    __publicField(this, "bodyMergeMap", {});
    __publicField(this, "mergeState", reactive({
      // 可视区域
      originRect: {
        ys: 0,
        ye: 0,
        xs: 0,
        xe: 0
      },
      // 渲染区域
      renderRect: {
        ys: 0,
        ye: 0,
        xs: 0,
        xe: 0
      }
    }));
    this.store = store;
  }
  setMerges(merges) {
    this.merges = merges != null ? merges : [];
  }
  calcRect(horizontal) {
    var _a;
    if (this.merges.length <= 0) {
      this.mergeState.renderRect.xs = this.mergeState.originRect.xs;
      this.mergeState.renderRect.xe = this.mergeState.originRect.xe;
      return { ys: this.mergeState.originRect.ys, ye: this.mergeState.originRect.ye };
    }
    const { renderRect, merges } = calcRenderRect(this.merges, this.mergeState.originRect);
    const { topMerges, leftMerges, rightMerges, bottomMerges } = merges;
    const { ys: rys, ye: rye, xs: rxs, xe: rxe } = renderRect;
    const { ys: oys, ye: oye, xs: oxs, xe: oxe } = this.mergeState.originRect;
    this.mergeState.renderRect = renderRect;
    const placeCells2top = [];
    if (oys > rys) {
      const unionMerges = unionWith$1(topMerges, isEqual);
      placeCells2top.push({
        // 应该从渲染的ys开始
        rowIndex: rys,
        colIndex: rxs,
        rowspan: oys - rys,
        colspan: rxe - rxs + 1
      });
      unionMerges.forEach((merge) => {
        const { rowIndex, colIndex, colspan } = merge;
        const last2 = placeCells2top.pop();
        const {
          rowIndex: rowIndexLast,
          colIndex: colIndexLast,
          rowspan: rowspanLast,
          colspan: colspanLast
        } = last2;
        if (colIndex > colIndexLast) {
          placeCells2top.push({
            rowIndex: rowIndexLast,
            colIndex: colIndexLast,
            rowspan: rowspanLast,
            colspan: colIndex - colIndexLast
          });
        }
        if (rowIndex > rowIndexLast) {
          placeCells2top.push({
            rowIndex: rowIndexLast,
            colIndex,
            rowspan: rowIndex - rowIndexLast,
            colspan
          });
        }
        if (colIndex + colspan - 1 < colIndexLast + colspanLast - 1) {
          placeCells2top.push({
            rowIndex: rowIndexLast,
            colIndex: colIndex + colspan,
            rowspan: rowspanLast,
            colspan: colIndexLast + colspanLast - 1 - (colIndex + colspan - 1)
          });
        }
      });
    }
    const placeCells2Left = [];
    if (oxs > rxs) {
      const unionMerges = unionWith$1(leftMerges, isEqual);
      placeCells2Left.push({
        rowIndex: oys,
        colIndex: rxs,
        rowspan: oye - oys + 1,
        colspan: oxs - rxs
      });
      unionMerges.forEach((merge) => {
        const { rowIndex, colIndex, rowspan } = merge;
        const last2 = placeCells2Left.pop();
        const {
          rowIndex: rowIndexLast,
          colIndex: colIndexLast,
          colspan: colspanLast,
          rowspan: rowspanLast
        } = last2;
        if (rowIndex > rowIndexLast) {
          placeCells2Left.push({
            rowIndex: rowIndexLast,
            colIndex: colIndexLast,
            rowspan: rowIndex - rowIndexLast,
            colspan: colspanLast
          });
        }
        if (colIndex > colIndexLast) {
          const isTop = rowIndex < rowIndexLast;
          const isLast = rowIndex + rowspan - 1 > rowIndexLast + rowspanLast - 1;
          placeCells2Left.push({
            rowIndex: isTop ? rowIndexLast : rowIndex,
            colIndex: colIndexLast,
            rowspan: isTop ? rowIndexLast - rowIndex : isLast ? rowIndexLast + rowspanLast - rowIndex : rowspan,
            colspan: colIndex - colIndexLast
          });
        }
        if (rowIndex + rowspan - 1 < rowIndexLast + rowspanLast - 1) {
          placeCells2Left.push({
            rowIndex: rowIndex + rowspan,
            colIndex: colIndexLast,
            rowspan: rowIndexLast + rowspanLast - 1 - (rowIndex + rowspan - 1),
            colspan: colspanLast
          });
        }
      });
    }
    const placeCells2Right = [];
    if (oxe < rxe) {
      const unionMerges = unionWith$1(rightMerges, isEqual);
      placeCells2Right.push({
        rowIndex: oys,
        colIndex: oxe + 1,
        rowspan: oye - oys + 1,
        colspan: rxe - oxe
      });
      unionMerges.forEach((merge) => {
        const { rowIndex, colIndex, rowspan, colspan } = merge;
        const last2 = placeCells2Right.pop();
        const {
          rowIndex: rowIndexLast,
          colIndex: colIndexLast,
          colspan: colspanLast,
          rowspan: rowspanLast
        } = last2;
        if (rowIndex > rowIndexLast) {
          placeCells2Right.push({
            rowIndex: rowIndexLast,
            colIndex: colIndexLast,
            rowspan: rowIndex - rowIndexLast,
            colspan: colspanLast
          });
        }
        if (colIndex + colspan - 1 < colIndexLast + colspanLast - 1) {
          placeCells2Right.push({
            rowIndex,
            colIndex: colIndex + colspan,
            rowspan,
            colspan: colIndexLast + colspanLast - 1 - (colIndex + colspan - 1)
          });
        }
        if (rowIndex + rowspan - 1 < rowIndexLast + rowspanLast - 1) {
          placeCells2Right.push({
            rowIndex: rowIndex + rowspan,
            colIndex: colIndexLast,
            rowspan: rowIndexLast + rowspanLast - 1 - (rowIndex + rowspan - 1),
            colspan: colspanLast
          });
        }
      });
    }
    const placeCells2Bottom = [];
    if (oye < rye) {
      const unionMerges = unionWith$1(bottomMerges, isEqual);
      placeCells2Bottom.push({
        rowIndex: oye + 1,
        colIndex: rxs,
        rowspan: rye - oye,
        colspan: rxe - rxs + 1
      });
      unionMerges.forEach((merge) => {
        const { rowIndex, colIndex, rowspan, colspan } = merge;
        const last2 = placeCells2Bottom.pop();
        const {
          rowIndex: rowIndexLast,
          colIndex: colIndexLast,
          colspan: colspanLast,
          rowspan: rowspanLast
        } = last2;
        if (colIndex > colIndexLast) {
          placeCells2Bottom.push({
            rowIndex: rowIndexLast,
            colIndex: colIndexLast,
            rowspan: rowspanLast,
            colspan: colIndex - colIndexLast
          });
        }
        if (rowIndex + rowspan - 1 < rowIndexLast) {
          placeCells2Bottom.push({
            rowIndex: rowIndexLast,
            colIndex,
            rowspan: rowIndexLast + colspanLast - rowIndex - colspan,
            colspan
          });
        }
        if (colIndex + colspan - 1 < colIndexLast + colspanLast - 1) {
          placeCells2Bottom.push({
            rowIndex: rowIndexLast,
            colIndex: colIndex + colspan,
            rowspan: rowspanLast,
            colspan: colIndexLast + colspanLast - colIndex - colspan
          });
        }
      });
    }
    this.tempMerges = [
      ...placeCells2top,
      ...placeCells2Left,
      ...placeCells2Right,
      ...placeCells2Bottom
    ];
    console.timeEnd("calcRect");
    if (horizontal) {
      (_a = this.store.virtualListRef) == null ? void 0 : _a.manualRender(rys, rye);
    }
    this.store.forceUpdate();
    return {
      ys: rys,
      ye: rye
    };
  }
  mergeFunction(rowIndex, colIndex) {
    if (colIndex === 0) {
      if (rowIndex % 2 === 0) {
        return {
          rowspan: 2,
          colspan: 1
        };
      } else {
        return {
          rowspan: 0,
          colspan: 0
        };
      }
    }
  }
  mergeMapConstructor(cellList) {
    console.log("mergeMapConstructor", cellList);
  }
  mergeMapConstructorWithFunction() {
    const colLen = 200;
    const rowLen = 1e4;
    const res = [];
    console.log(colLen, rowLen);
    for (let i = 0; i < colLen; i++) {
      for (let j = 0; j < rowLen; j++) {
        const mergeCfg = this.mergeFunction(j, i);
        if (mergeCfg) {
          res.push({
            rowIndex: j,
            colIndex: i,
            rowspan: mergeCfg.rowspan,
            colspan: mergeCfg.colspan
          });
        }
      }
    }
    return this.mergeMapConstructor(res);
  }
}
const getCellFromEvent = (e) => {
  const cellRoot = e.composedPath().find(
    (v) => {
      var _a, _b, _c;
      return !((_a = v.classList) == null ? void 0 : _a.contains("vtg-cell--unselectable")) && ((_b = v.dataset) == null ? void 0 : _b.colidx) && ((_c = v.dataset) == null ? void 0 : _c.rowidx);
    }
  );
  if (cellRoot && cellRoot.dataset) {
    const { colidx, rowidx, colspan, rowspan } = cellRoot.dataset;
    return {
      rowIndex: +(rowidx || 0),
      colIndex: +(colidx || 0),
      rowspan: +(rowspan || 1),
      colspan: +(colspan || 1)
    };
  }
  return void 0;
};
class GridSelection {
  constructor(store) {
    __publicField(this, "container");
    __publicField(this, "boxArea", {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    });
    __publicField(this, "id", "");
    __publicField(this, "startPos", {
      rowIndex: -1,
      colIndex: -1
    });
    __publicField(this, "lastClickPos");
    __publicField(this, "lastShiftClickPos");
    __publicField(this, "callbackFunc", () => {
    });
    __publicField(this, "isMetaKey", false);
    __publicField(this, "isShiftKey", false);
    __publicField(this, "preventContextMenu", (e) => {
      e.preventDefault();
      this.onMouseup();
    });
    __publicField(this, "onMousedown", (e) => {
      if (!this.store.getState("selection"))
        return;
      if (e.buttons !== 1 || e.button)
        return;
      const cellInfo = getCellFromEvent(e);
      this.isMetaKey = e.metaKey || e.ctrlKey;
      this.isShiftKey = e.shiftKey;
      if (cellInfo) {
        const { colIndex, rowIndex } = cellInfo;
        this.id = nanoid(4);
        this.startPos = {
          rowIndex,
          colIndex
        };
        if (this.isShiftKey) {
          if (!this.lastShiftClickPos) {
            this.lastShiftClickPos = cloneDeep(this.lastClickPos || this.startPos);
          }
        } else {
          this.lastShiftClickPos = void 0;
        }
        if (this.isShiftKey && this.lastShiftClickPos) {
          const { rowIndex: ri, colIndex: ci } = this.lastShiftClickPos;
          this.boxArea = {
            top: Math.min(rowIndex, ri),
            bottom: Math.max(rowIndex, ri),
            left: Math.min(colIndex, ci),
            right: Math.max(colIndex, ci)
          };
        } else {
          this.boxArea = {
            top: rowIndex,
            bottom: rowIndex,
            left: colIndex,
            right: colIndex
          };
        }
        this.lastClickPos = cloneDeep(this.startPos);
        this.container.style.userSelect = "none";
        document.body.addEventListener("mouseup", this.onMouseup);
        document.body.addEventListener("mouseover", this.onMouseOver);
        document.body.addEventListener("contextmenu", this.preventContextMenu);
        this.store.interactionModule.gridScrollZone.append();
        this.emitChange();
      }
    });
    __publicField(this, "onMouseOver", (e) => {
      if (!this.store.getState("selection"))
        return;
      const cellInfo = getCellFromEvent(e);
      if (cellInfo) {
        const { colIndex, rowIndex } = cellInfo;
        const newArea = {
          top: Math.min(this.startPos.rowIndex, rowIndex),
          bottom: Math.max(this.startPos.rowIndex, rowIndex),
          left: Math.min(this.startPos.colIndex, colIndex),
          right: Math.max(this.startPos.colIndex, colIndex)
        };
        if (!isEqual(newArea, this.boxArea)) {
          this.boxArea = newArea;
          this.emitChange();
        }
      }
    });
    __publicField(this, "onMouseup", () => {
      if (!this.store.getState("selection"))
        return;
      this.id = "";
      this.boxArea = {
        left: 0,
        top: 0,
        right: 0,
        bottom: 0
      };
      this.container.style.userSelect = "auto";
      document.body.removeEventListener("mouseover", this.onMouseOver);
      document.body.removeEventListener("mouseup", this.onMouseup);
      document.body.removeEventListener("contextmenu", this.preventContextMenu);
      this.store.interactionModule.gridScrollZone.remove();
    });
    this.store = store;
  }
  init(el) {
    this.container = el;
    this.container.addEventListener("mousedown", this.onMousedown);
  }
  on(fn) {
    this.callbackFunc = fn;
  }
  reset() {
  }
  emitChange() {
    this.callbackFunc(this.id, this.boxArea, this.isMetaKey);
  }
  destroy() {
    var _a;
    (_a = this.container) == null ? void 0 : _a.removeEventListener("mousedown", this.onMousedown);
    document.body.removeEventListener("contextmenu", this.preventContextMenu);
    document.body.removeEventListener("mouseup", this.onMouseup);
    document.body.removeEventListener("mouseover", this.onMouseOver);
    this.store.interactionModule.gridScrollZone.remove();
  }
}
class GridScrollZone {
  constructor(store) {
    __publicField(this, "container");
    __publicField(this, "scrollUpZone");
    __publicField(this, "scrollDownZone");
    __publicField(this, "scrollIntervalTimer", 0);
    __publicField(this, "speed", 4);
    __publicField(this, "lastDirection", 0);
    __publicField(this, "handler", (e) => {
      const els = document.elementsFromPoint(e.pageX, e.pageY);
      if (els.includes(this.scrollUpZone)) {
        this.onListScrollUp();
        this.lastDirection = -1;
      } else if (els.includes(this.scrollDownZone)) {
        this.onListScrollDown();
        this.lastDirection = 1;
      } else {
        cancelAnimationFrame(this.scrollIntervalTimer);
        this.lastDirection = 0;
      }
    });
    this.store = store;
    this.scrollUpZone = document.createElement("div");
    this.scrollUpZone.style.width = "3000px";
    this.scrollUpZone.style.height = "64px";
    this.scrollUpZone.style.position = "absolute";
    this.scrollUpZone.style.left = "0";
    this.scrollUpZone.style.top = "0";
    this.scrollUpZone.style.background = "transparent";
    this.scrollUpZone.style.zIndex = "-100";
    this.scrollUpZone.id = "vtg-scroll-zone__top";
    this.scrollDownZone = document.createElement("div");
    this.scrollDownZone.style.width = "3000px";
    this.scrollDownZone.style.height = "40px";
    this.scrollDownZone.style.position = "absolute";
    this.scrollDownZone.style.left = "0";
    this.scrollDownZone.style.bottom = "0";
    this.scrollDownZone.style.background = "transparent";
    this.scrollDownZone.style.zIndex = "-100";
    this.scrollUpZone.id = "vtg-scroll-zone__bottom";
  }
  init(container) {
    this.container = container;
  }
  scrollUp(offset, base = 1) {
    this.scrollIntervalTimer = requestAnimationFrame(() => {
      var _a;
      (_a = this.store.virtualListRef) == null ? void 0 : _a.scrollToOffset(offset - this.speed * base);
      this.scrollUp(offset, base + 1);
    });
  }
  scrollDown(offset, base = 1) {
    this.scrollIntervalTimer = requestAnimationFrame(() => {
      var _a;
      (_a = this.store.virtualListRef) == null ? void 0 : _a.scrollToOffset(offset + this.speed * base);
      this.scrollDown(offset, base + 1);
    });
  }
  onListScrollUp() {
    cancelAnimationFrame(this.scrollIntervalTimer);
    const { offset } = this.store.virtualListRef.reactiveData;
    const base = this.lastDirection === -1 ? 2 : 1;
    this.scrollUp(offset, base);
  }
  onListScrollDown() {
    cancelAnimationFrame(this.scrollIntervalTimer);
    const { offset } = this.store.virtualListRef.reactiveData;
    const base = this.lastDirection === 1 ? 2 : 1;
    this.scrollDown(offset, base);
  }
  append() {
    var _a, _b, _c;
    this.remove();
    (_a = this.container) == null ? void 0 : _a.appendChild(this.scrollUpZone);
    (_b = this.container) == null ? void 0 : _b.appendChild(this.scrollDownZone);
    (_c = this.container) == null ? void 0 : _c.addEventListener("mousemove", this.handler);
    document.body.addEventListener("mouseup", this.handler);
    this.lastDirection = 0;
  }
  remove() {
    var _a, _b, _c;
    cancelAnimationFrame(this.scrollIntervalTimer);
    (_a = this.scrollUpZone) == null ? void 0 : _a.remove();
    (_b = this.scrollDownZone) == null ? void 0 : _b.remove();
    (_c = this.container) == null ? void 0 : _c.removeEventListener("mousemove", this.handler);
    document.body.removeEventListener("mouseup", this.handler);
    this.lastDirection = 0;
  }
}
class GridInteraction {
  constructor(store) {
    __publicField(this, "gridSelection");
    __publicField(this, "gridScrollZone");
    // 区域框选要重新做
    __publicField(this, "interactionState", shallowReactive$1({
      selectBoxes: {},
      selectCellBorderMap: {},
      selectCellClassMap: {}
    }));
    __publicField(this, "selectRowId", ref$1(""));
    __publicField(this, "selectColId", ref$1(""));
    __publicField(this, "handleSelectionChange", (id, area, isMultiple) => {
      const mergedArea = this.expandMergedSelectArea(area);
      let selectBoxes = {
        [id]: mergedArea
      };
      if (isMultiple) {
        selectBoxes = {
          ...this.interactionState.selectBoxes,
          ...selectBoxes
        };
      }
      const posMap = {};
      const cellBorderMap = {};
      Object.keys(selectBoxes).forEach((boxId) => {
        const { left, top, right, bottom } = selectBoxes[boxId];
        for (let i = top; i <= bottom; i++) {
          for (let j = left; j <= right; j++) {
            const posId = `${i}-${j}`;
            if (!posMap[posId]) {
              posMap[posId] = /* @__PURE__ */ new Set();
            }
            if (i === top || i === bottom || j === left || j === right) {
              if (i === top && j === left) {
                posMap[posId].add("left-top");
              }
              if (i === top && j === right) {
                posMap[posId].add("right-top");
              }
              if (i === bottom && j === left) {
                posMap[posId].add("left-bottom");
              }
              if (i === bottom && j === right) {
                posMap[posId].add("right-bottom");
              }
              if (j > left && j < right) {
                if (i === top) {
                  posMap[posId].add("top");
                }
                if (i === bottom) {
                  posMap[posId].add("bottom");
                }
              }
              if (i > top && i < bottom) {
                if (j === left) {
                  posMap[posId].add("left");
                }
                if (j === right) {
                  posMap[posId].add("right");
                }
              }
            } else {
              posMap[posId].add("center");
            }
          }
        }
      });
      Object.keys(posMap).forEach((posId) => {
        const poses = posMap[posId];
        if (poses.has("left-top") && poses.has("right-bottom") || poses.has("left-bottom") && poses.has("right-top")) {
          cellBorderMap[posId] = ["left-top", "right-bottom"];
        } else {
          cellBorderMap[posId] = [...posMap[posId]];
        }
      });
      const cellClass = {};
      const selectedCells = [];
      const selectedArea = [];
      const visitedCellId = /* @__PURE__ */ new Set();
      Object.keys(selectBoxes).forEach((boxId) => {
        var _a;
        const { left: nLeft, top: nTop, right: nRight, bottom: nBottom } = selectBoxes[boxId];
        const cells = [];
        for (let i = nTop; i <= nBottom; i++) {
          for (let j = nLeft; j <= nRight; j++) {
            const posId = `${i}-${j}`;
            const mergeInfo = (_a = this.store.mergeModule.bodyMergeMap[i]) == null ? void 0 : _a[j];
            const colspan = mergeInfo == null ? void 0 : mergeInfo.colspan;
            const rowspan = mergeInfo == null ? void 0 : mergeInfo.rowspan;
            cellClass[posId] = this.selectCellClassConstructor(cellBorderMap, i, j, rowspan, colspan);
            if (!mergeInfo || colspan || rowspan) {
              const cellData = {
                row: this.store.virtualListProps.list[i],
                rowIndex: i,
                column: this.store.columnModule.flattedColumns[j],
                columnIndex: j
              };
              cells.push(cellData);
              if (!visitedCellId.has(posId)) {
                selectedCells.push(cellData);
              }
              visitedCellId.add(posId);
            }
          }
        }
        selectedArea.push(cells);
      });
      const tableEvents = useTableEvent(this.store);
      tableEvents.onCellSelection({
        areas: selectedArea,
        cells: selectedCells
      });
      this.interactionState.selectBoxes = selectBoxes;
      this.interactionState.selectCellBorderMap = cellBorderMap;
      this.interactionState.selectCellClassMap = cellClass;
      this.store.forceUpdate();
    });
    this.store = store;
    this.gridSelection = new GridSelection(store);
    this.gridScrollZone = new GridScrollZone(store);
  }
  initSelectionElement(el) {
    this.gridSelection.init(el);
    this.gridScrollZone.init(el);
  }
  getSelectRow() {
    return this.selectRowId.value;
  }
  setSelectRow(rowIndex) {
    this.selectRowId.value = this.store.virtualListProps.list[rowIndex].id;
  }
  getSelectCol() {
    return this.selectColId.value;
  }
  setSelectCol(colIndex) {
    this.selectColId.value = this.store.columnModule.flattedColumns[colIndex]._id;
  }
  clearSelect() {
    this.selectRowId.value = "";
    this.selectColId.value = "";
  }
  getSelectionClass(rowIndex, column) {
    if (!this.store.getState("selection")) {
      return "";
    }
    const colIndex = column.colIndex;
    const type = column.type;
    if (type === CellType.Expand || type === CellType.Index || type === CellType.Checkbox) {
      return "vtg-cell--unselectable";
    }
    const id = `${rowIndex}-${colIndex}`;
    return this.interactionState.selectCellClassMap[id] || "";
  }
  selectCellClassConstructor(selectRenderMap, rowIndex, colIndex, rowspan = 1, colspan = 1) {
    const id = `${rowIndex}-${colIndex}`;
    let pos = selectRenderMap[id];
    if (pos) {
      if (rowspan > 1 || colspan > 1) {
        const posArr = /* @__PURE__ */ new Set();
        for (let i = rowIndex; i < rowIndex + rowspan; i++) {
          for (let j = colIndex; j < colIndex + colspan; j++) {
            const subPos = selectRenderMap[`${i}-${j}`];
            if (subPos) {
              subPos.forEach((p) => {
                posArr.add(p);
              });
            }
          }
        }
        if (posArr.has("left-top")) {
          posArr.delete("left");
          posArr.delete("top");
          posArr.delete("center");
        }
        if (posArr.has("right-top")) {
          posArr.delete("right");
          posArr.delete("top");
          posArr.delete("center");
        }
        if (posArr.has("left-bottom")) {
          posArr.delete("left");
          posArr.delete("bottom");
          posArr.delete("center");
        }
        if (posArr.has("right-bottom")) {
          posArr.delete("right");
          posArr.delete("bottom");
          posArr.delete("center");
        }
        if (posArr.has("left") || posArr.has("right") || posArr.has("top") || posArr.has("bottom")) {
          posArr.delete("center");
        }
        if (posArr.has("left-top") && posArr.has("right-bottom") || posArr.has("left-bottom") && posArr.has("right-top")) {
          pos = ["left-top", "right-bottom"];
        } else {
          pos = [...posArr];
        }
      }
      return ["box-selection", ...pos.map((p) => `box-selection__${p}`)].join(" ");
    }
    return "";
  }
  expandMergedSelectArea(area) {
    var _a;
    const { left, top, right, bottom } = area;
    const mergedArea = { ...area };
    const visited = /* @__PURE__ */ new Set();
    const que = [];
    for (let i = top; i <= bottom; i++) {
      for (let j = left; j <= right; j++) {
        que.push([i, j]);
      }
    }
    while (que.length) {
      const [i, j] = que.shift();
      const mergeInfo = (_a = this.store.mergeModule.bodyMergeMap[i]) == null ? void 0 : _a[j];
      const k = `${i}-${j}`;
      if (visited.has(k)) {
        continue;
      }
      visited.add(k);
      if (mergeInfo) {
        const mergeBy = mergeInfo.mergeBy;
        if (mergeBy) {
          const mergeOrigin = this.store.mergeModule.bodyMergeMap[mergeBy[0]][mergeBy[1]];
          if (mergeOrigin) {
            mergedArea.left = Math.min(mergedArea.left, mergeBy[1]);
            mergedArea.right = Math.max(mergedArea.right, mergeBy[1] + mergeOrigin.colspan - 1);
            mergedArea.top = Math.min(mergedArea.top, mergeBy[0]);
            mergedArea.bottom = Math.max(mergedArea.bottom, mergeBy[0] + mergeOrigin.rowspan - 1);
          }
        } else {
          const { rowspan, colspan } = mergeInfo;
          mergedArea.left = Math.min(mergedArea.left, j);
          mergedArea.right = Math.max(mergedArea.right, j + colspan - 1);
          mergedArea.top = Math.min(mergedArea.top, i);
          mergedArea.bottom = Math.max(mergedArea.bottom, i + rowspan - 1);
        }
        const { left: left2, top: top2, right: right2, bottom: bottom2 } = mergedArea;
        for (let i2 = top2; i2 <= bottom2; i2++) {
          for (let j2 = left2; j2 <= right2; j2++) {
            que.push([i2, j2]);
          }
        }
      }
    }
    return mergedArea;
  }
  setRowSelection(areaId = nanoid(4), startRowIndex, endRowIndex, isMulti) {
    this.handleSelectionChange(
      areaId,
      {
        left: 0,
        right: this.store.columnModule.flattedColumns.length,
        top: startRowIndex,
        bottom: endRowIndex
      },
      isMulti
    );
  }
  setColumnSelection(areaId = nanoid(4), startColumnIndex, endColumnIndex, isMulti) {
    this.handleSelectionChange(
      areaId,
      {
        left: startColumnIndex,
        right: endColumnIndex,
        top: 0,
        bottom: this.store.virtualListProps.list.length
      },
      isMulti
    );
  }
}
class GridGroup {
  constructor(store) {
    __publicField(this, "groupState", reactive({
      // 父子显示的映射
      foldMap: {},
      // 展开行显示的映射
      expandMap: {}
    }));
    this.store = store;
  }
  groupFoldConstructor(list, conditions) {
    console.log("groupFoldConstructor", list.length, conditions);
    return this.constructGroup(list, 0, conditions);
  }
  constructGroup(list, conditionIndex, conditions) {
    var _a;
    if (conditionIndex >= conditions.length) {
      return list;
    }
    const { columnId, sort } = conditions[conditionIndex];
    const sortedList = list.sort((a, b) => {
      if (sort === "desc") {
        return b[columnId].localeCompare(a[columnId]);
      }
      return a[columnId].localeCompare(b[columnId]);
    });
    const res = [];
    let subGroup = [];
    for (let i = 0; i < sortedList.length; i++) {
      const item = sortedList[i];
      if (item[columnId] === ((_a = subGroup[subGroup.length - 1]) == null ? void 0 : _a[columnId])) {
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
    const groupList = [];
    res.forEach((item) => {
      const v = item[0][columnId];
      groupList.push({
        id: `group-${columnId}-${nanoid(4)}`,
        type: "group",
        columnId,
        name: v,
        children: this.constructGroup(item, conditionIndex + 1, conditions)
      });
    });
    return groupList;
  }
  generateFlatList(originList) {
    const flattenList = [];
    const { foldMap, expandMap } = this.groupState;
    const hasExpandCol = !!this.store.columnModule.flattedColumns.find(
      (col) => col.type === CellType.Expand
    );
    const defaultExpandAll = this.store.getState("defaultExpandAll");
    this.store.gridRowMap = {};
    let level = 0;
    let groupLevel = 0;
    const flat = (list, isGroup = false) => {
      list.forEach((item, index2) => {
        var _a;
        if (isGroup) {
          groupLevel += 1;
        }
        const row = Object.assign(item, {
          level,
          groupLevel,
          isLastChild: index2 === list.length - 1
        });
        flattenList.push(row);
        this.store.gridRowMap[row.id] = row;
        if ((item == null ? void 0 : item.children) && ((_a = item == null ? void 0 : item.children) == null ? void 0 : _a.length) > 0) {
          level += 1;
          foldMap[item.id] = !defaultExpandAll;
          if (defaultExpandAll) {
            flat(item.children, item.type === "group");
          }
          level -= 1;
        }
        if (hasExpandCol) {
          expandMap[item.id] = !!defaultExpandAll;
          if (defaultExpandAll) {
            this.store.gridRowMap[`${item.id}-expand`] = {
              id: `${item.id}-expand`,
              type: "expand"
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
  resetFlatList(originList) {
    const flattenList = [];
    const { foldMap, expandMap } = this.groupState;
    let level = 0;
    let groupLevel = 0;
    const flat = (list, isGroup = false) => {
      list.forEach((item, index2) => {
        var _a;
        if (isGroup) {
          groupLevel += 1;
        }
        const row = Object.assign(item, {
          level,
          groupLevel,
          isLastChild: index2 === list.length - 1
        });
        flattenList.push(row);
        this.store.gridRowMap[row.id] = row;
        if (foldMap[item.id] === false && (item == null ? void 0 : item.children) && ((_a = item == null ? void 0 : item.children) == null ? void 0 : _a.length) > 0) {
          level += 1;
          flat(item.children, item.type === "group");
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
  toggleFold(id) {
    const { foldMap } = this.groupState;
    foldMap[id] = !foldMap[id];
    this.resetFlatList(this.store.originList);
  }
  toggleExpand(id) {
    const tableEvents = useTableEvent(this.store);
    const { expandMap } = this.groupState;
    expandMap[id] = !expandMap[id];
    if (expandMap[id] && !this.store.gridRowMap[`${id}-expand`]) {
      this.store.gridRowMap[`${id}-expand`] = { id: `${id}-expand`, type: "expand" };
    }
    const expandedRowKeys = Object.keys(expandMap).filter((key) => !!expandMap[key]).map((id2) => this.store.gridRowMap[id2]);
    tableEvents.onExpandChange({ row: this.store.gridRowMap[id], expandedRows: expandedRowKeys });
    this.resetFlatList(this.store.originList);
  }
}
class GridColumn {
  constructor(store) {
    // 原始列数据（带 _id），一般不直接用
    __publicField(this, "originColumns", []);
    // 平铺列(子树列)
    __publicField(this, "flattedColumns", []);
    // 左侧固定列(子树列)
    __publicField(this, "leftFixedColumns", []);
    // 右侧固定列(子树列)
    __publicField(this, "rightFixedColumns", []);
    // 中间主要列(子树列)
    __publicField(this, "centerNormalColumns", []);
    // 这3个是给表头用的
    __publicField(this, "leftFixedHeaderColumns", []);
    __publicField(this, "rightFixedHeaderColumns", []);
    __publicField(this, "centerNormalHeaderColumns", []);
    __publicField(this, "columnState", reactive({
      fullWidth: 0,
      fixedInfo: {
        leftWidth: 0,
        rightWidth: 0
      }
    }));
    __publicField(this, "columnsInfo", shallowReactive$1({
      leftFixedColumns: [],
      rightFixedColumns: [],
      leftFixedHeaderColumns: [],
      rightFixedHeaderColumns: [],
      centerNormalHeaderColumns: [],
      headerCellInfo: {}
    }));
    this.store = store;
  }
  setColumns(columns) {
    const {
      leftFixedColumns,
      rightFixedColumns,
      centerNormalColumns,
      flattedColumns,
      headerCellInfo,
      originColumns,
      leftFixedHeaderColumns,
      rightFixedHeaderColumns,
      centerNormalHeaderColumns,
      fixedInfo
    } = formatColumns(columns);
    this.leftFixedColumns = leftFixedColumns;
    this.rightFixedColumns = rightFixedColumns;
    this.centerNormalColumns = centerNormalColumns;
    this.flattedColumns = flattedColumns;
    this.originColumns = originColumns;
    console.log("[GridColumn.setColumns] rightFixedColumns:", rightFixedColumns.map((col) => ({
      _id: col._id,
      field: col.field,
      width: col.width,
      fixed: col.fixed
    })));
    this.columnState.fixedInfo = fixedInfo;
    this.columnsInfo.headerCellInfo = headerCellInfo;
    this.columnsInfo.leftFixedColumns = leftFixedColumns;
    this.columnsInfo.rightFixedColumns = rightFixedColumns;
    this.columnsInfo.leftFixedHeaderColumns = leftFixedHeaderColumns;
    this.columnsInfo.rightFixedHeaderColumns = rightFixedHeaderColumns;
    this.columnsInfo.centerNormalHeaderColumns = centerNormalHeaderColumns;
    this.columnState.fullWidth = this.flattedColumns.reduce((a, b) => a + b.width, 0);
    this.store.forceUpdate();
  }
  setColumnWidth(id, width) {
    const column = this.flattedColumns.find((col) => col._id === id);
    if (column) {
      column.width = width;
      this.setColumns(this.originColumns);
    }
  }
  calcVisibleColumns(scrollLeft, clientWidth) {
    let colRenderBegin = 0;
    let colRenderEnd = 0;
    let currentLeft = 0;
    let beginFlag = false;
    for (let i = 0; i < this.centerNormalColumns.length; i++) {
      const currentWidth = this.centerNormalColumns[i].width;
      if (currentLeft >= scrollLeft && !beginFlag) {
        colRenderBegin = i;
        beginFlag = true;
      } else if (currentLeft >= scrollLeft + clientWidth) {
        colRenderEnd = i;
        break;
      }
      colRenderEnd = i;
      currentLeft += currentWidth;
    }
    colRenderBegin = Math.max(0, colRenderBegin - 1);
    colRenderEnd = Math.min(this.centerNormalColumns.length - 1, colRenderEnd + 1);
    if (colRenderBegin !== this.store.mergeModule.mergeState.originRect.xs || colRenderEnd !== this.store.mergeModule.mergeState.originRect.xe) {
      this.store.mergeModule.mergeState.originRect.xs = colRenderBegin;
      this.store.mergeModule.mergeState.originRect.xe = colRenderEnd;
      this.store.mergeModule.calcRect(true);
    }
  }
}
const defaultGridOptions = {
  rowKey: "id",
  minRowHeight: 36,
  merges: [],
  groupConfig: [],
  align: "left",
  headerAlign: "left",
  verticalAlign: "middle",
  headerVerticalAlign: "middle",
  border: false,
  // TODO 看看要不要默认true好一点
  stripe: false,
  showTreeLine: false,
  selection: false,
  showHeader: true,
  textOverflow: "ellipsis",
  textOverflowHeader: "ellipsis",
  highlightHoverRow: false,
  highlightHoverCol: false,
  highlightSelectRow: false,
  highlightSelectCol: false,
  highlightSelectCell: false,
  defaultExpandAll: false,
  headerRowClassName: () => "",
  headerRowStyle: () => "",
  headerCellClassName: () => "",
  headerCellStyle: () => "",
  rowClassName: () => "",
  rowStyle: () => "",
  cellClassName: () => "",
  cellStyle: () => ""
};
class GridStore {
  constructor(props) {
    // 根元素
    __publicField(this, "rootEl", null);
    // client
    __publicField(this, "clientEl", null);
    // 表格
    __publicField(this, "tableEl");
    __publicField(this, "virtualListRef");
    // 记一下原始的list
    __publicField(this, "originList", []);
    __publicField(this, "gridScrollingStatus", ref$1("is-scrolling-none"));
    __publicField(this, "gridRowMap", {});
    // TODO: 目前看是不需要响应式的，配置项传入
    __publicField(this, "customRender", {});
    // 响应式数据
    __publicField(this, "watchData", reactive({
      // 强制渲染
      renderKey: 0,
      // TODO 可能考虑拿出去做非响应式
      rowHeightMap: /* @__PURE__ */ new Map(),
      // 多数
      checkboxRows: /* @__PURE__ */ new Set(),
      // 唯一
      radioRow: null,
      // 配置
      config: {
        minRowHeight: defaultGridOptions.minRowHeight,
        colWidth: 100
        // headerHeight: 30,
        // headerWidth: 100,
      }
    }));
    __publicField(this, "rowKey", "id");
    // 非响应式
    __publicField(this, "virtualListProps", shallowReactive$1({
      list: [],
      minSize: 32,
      itemKey: this.rowKey,
      // fixed: true,
      // buffer: 4,
      renderControl: (begin, end) => {
        this.mergeModule.mergeState.originRect.ys = begin;
        this.mergeModule.mergeState.originRect.ye = end;
        const { ys, ye } = this.mergeModule.calcRect();
        return {
          begin: ys != null ? ys : begin,
          end: ye != null ? ye : end
        };
      }
    }));
    __publicField(this, "state", shallowRef$1(defaultGridOptions));
    __publicField(this, "sortState", reactive({
      sortColumnId: null,
      sortDirection: null
    }));
    // 内部共享模块
    __publicField(this, "popperModule", new PopperStore(this));
    __publicField(this, "mergeModule", new GridMerges(this));
    __publicField(this, "interactionModule", new GridInteraction(this));
    __publicField(this, "groupModule", new GridGroup(this));
    __publicField(this, "columnModule", new GridColumn(this));
    // 用于内部事件的触发
    __publicField(this, "eventEmitter", new EventEmitter());
    // 全局默认排序配置
    __publicField(this, "defaultSortConfig");
    this.initOptions(props.options);
    this.columnModule.setColumns(props.columns);
  }
  forceUpdate() {
    this.watchData.renderKey += 1;
    console.log("forceUpdate");
  }
  setRowKey(key) {
    this.rowKey = key;
    this.virtualListProps.itemKey = key;
  }
  setRowMinHeight(minRowHeight) {
    this.virtualListProps.minSize = minRowHeight;
    console.log("setRowMinHeight", this.virtualListProps.minSize);
  }
  setRootEl(rootEl) {
    this.rootEl = rootEl;
  }
  setClientEl(clientEl) {
    this.clientEl = clientEl;
  }
  setList(list) {
    this.virtualListProps.list = list;
  }
  setCustomRender(customRender) {
    this.customRender = customRender;
  }
  setOriginList(list) {
    this.originList = list;
  }
  setTableEl(el) {
    this.tableEl = el;
  }
  getCheckboxRows() {
    return this.watchData.checkboxRows;
  }
  addCheckboxRows(row) {
    this.watchData.checkboxRows.add(row);
  }
  deleteCheckboxRows(row) {
    this.watchData.checkboxRows.delete(row);
  }
  addAllCheckboxRows() {
    this.watchData.checkboxRows = new Set(this.virtualListProps.list);
    this.forceUpdate();
  }
  clearCheckboxRows() {
    this.watchData.checkboxRows.clear();
  }
  addRadioRow(row) {
    this.watchData.radioRow = row;
  }
  setState(data) {
    this.state.value = data;
  }
  setStateValue(key, value) {
    this.state.value[key] = value;
  }
  getState(key) {
    return this.state.value[key];
  }
  initVirtualListRef(elRef) {
    this.virtualListRef = elRef;
  }
  calcGridScrollingStatus(scrollLeft, scrollWidth, clientWidth) {
    if (scrollWidth <= clientWidth) {
      this.gridScrollingStatus.value = "is-scrolling-none";
    } else {
      if (scrollLeft === 0) {
        this.gridScrollingStatus.value = "is-scrolling-left";
      } else if (scrollLeft + clientWidth === scrollWidth) {
        this.gridScrollingStatus.value = "is-scrolling-right";
      } else {
        this.gridScrollingStatus.value = "is-scrolling-middle";
      }
    }
  }
  calcFixedShadow(scrollLeft, scrollWidth, clientWidth) {
    this.calcGridScrollingStatus(scrollLeft, scrollWidth, clientWidth);
  }
  initOptions(options) {
    var _a, _b, _c;
    const state = assign$1(
      {},
      defaultGridOptions,
      pick$1(options, Object.keys(defaultGridOptions))
    );
    this.setState(state);
    this.setRowKey((_a = options == null ? void 0 : options.rowKey) != null ? _a : defaultGridOptions.rowKey);
    this.mergeModule.setMerges(options.merges);
    console.log((_b = options.minRowHeight) != null ? _b : defaultGridOptions.minRowHeight);
    this.setRowMinHeight((_c = options.minRowHeight) != null ? _c : defaultGridOptions.minRowHeight);
    this.setCustomRender({
      cellCoverRender: options.cellCoverRender,
      cellRender: options.cellRender,
      cellDropdownRender: options.cellDropdownRender
    });
    if (options.defaultSort) {
      this.setDefaultSort(options.defaultSort);
    }
  }
  initDataList(list, preserveScroll) {
    let scrollTop = 0;
    if (preserveScroll && this.clientEl) {
      scrollTop = this.clientEl.scrollTop;
    }
    this.setList([]);
    setTimeout(async () => {
      this.setOriginList(list);
      this.applyDefaultSort();
      const flattenList = this.groupModule.generateFlatList(this.originList);
      this.setList(flattenList || []);
      if (preserveScroll && this.clientEl && scrollTop > 0) {
        await nextTick();
        this.clientEl.scrollTop = scrollTop;
      }
    });
  }
  /**
   * 设置默认排序配置
   */
  setDefaultSort(config) {
    this.defaultSortConfig = config;
  }
  /**
   * 应用默认排序
   * 优先使用全局 defaultSort 配置，其次检查列的 sortOrder 配置
   */
  applyDefaultSort() {
    var _a;
    if (this.sortState.sortColumnId) {
      return;
    }
    if (this.defaultSortConfig) {
      const { field, order, sorter: globalSorter } = this.defaultSortConfig;
      const column = this.columnModule.flattedColumns.find((col) => col.field === field);
      if (column) {
        this.sortState.sortColumnId = column._id;
        this.sortState.sortDirection = order;
        let sortFn = null;
        if (globalSorter) {
          sortFn = (a, b) => globalSorter(a, b, { field, direction: order });
        } else if ((_a = column.sort) == null ? void 0 : _a.sorter) {
          const columnSorter = column.sort.sorter;
          if (typeof columnSorter === "function") {
            sortFn = (a, b) => columnSorter(a, b, { id: column._id, direction: order });
          } else if (columnSorter === true) {
            sortFn = (a, b) => {
              const aVal = a[field];
              const bVal = b[field];
              if (aVal === bVal)
                return 0;
              return aVal > bVal ? 1 : -1;
            };
          }
        } else {
          sortFn = (a, b) => {
            const aVal = a[field];
            const bVal = b[field];
            if (aVal === bVal)
              return 0;
            return aVal > bVal ? 1 : -1;
          };
        }
        if (sortFn) {
          const sortedList = [...this.originList].sort((a, b) => {
            const result = sortFn(a, b);
            return order === "ascend" ? result : -result;
          });
          this.setOriginList(sortedList);
        }
        return;
      }
    }
    const columnWithDefaultSort = this.columnModule.flattedColumns.find((col) => {
      if (!col.sort)
        return false;
      const sortOrder = col.sort.sortOrder;
      return sortOrder === "ascend" || sortOrder === "descend";
    });
    if (columnWithDefaultSort && columnWithDefaultSort.sort) {
      const sortOrder = columnWithDefaultSort.sort.sortOrder;
      if (sortOrder === "ascend" || sortOrder === "descend") {
        this.sortState.sortColumnId = columnWithDefaultSort._id;
        this.sortState.sortDirection = sortOrder;
        const sorter = columnWithDefaultSort.sort.sorter;
        if (typeof sorter === "boolean" && sorter) {
          const sortedList = [...this.originList].sort((a, b) => {
            const aVal = a[columnWithDefaultSort.field];
            const bVal = b[columnWithDefaultSort.field];
            if (aVal === bVal)
              return 0;
            const result = aVal > bVal ? 1 : -1;
            return sortOrder === "ascend" ? result : -result;
          });
          this.setOriginList(sortedList);
        } else if (typeof sorter === "function") {
          const sortedList = [...this.originList].sort((a, b) => {
            const result = sorter(a, b, { id: columnWithDefaultSort._id, direction: sortOrder });
            return sortOrder === "ascend" ? result : -result;
          });
          this.setOriginList(sortedList);
        }
      }
    }
  }
  sortData(columnId, direction) {
    const column = this.columnModule.flattedColumns.find((col) => col._id === columnId);
    if (!column || !column.sort)
      return;
    if (this.sortState.sortColumnId === columnId && this.sortState.sortDirection === direction) {
      this.sortState.sortColumnId = null;
      this.sortState.sortDirection = null;
      this.initDataList(this.originList, true);
      return;
    }
    this.sortState.sortColumnId = columnId;
    this.sortState.sortDirection = direction;
    const sorter = column.sort.sorter;
    if (typeof sorter === "boolean" && sorter) {
      const sortedList = [...this.originList].sort((a, b) => {
        const aVal = a[column.field];
        const bVal = b[column.field];
        if (aVal === bVal)
          return 0;
        const result = aVal > bVal ? 1 : -1;
        return direction === "ascend" ? result : -result;
      });
      this.initDataList(sortedList, true);
    } else if (typeof sorter === "function") {
      const sortedList = [...this.originList].sort((a, b) => {
        const result = sorter(a, b, { id: columnId, direction });
        return direction === "ascend" ? result : -result;
      });
      this.initDataList(sortedList, true);
    }
  }
}
const useGridStore = (props) => {
  if (props) {
    const gridStore = new GridStore(props);
    provide("gridStore", gridStore);
    return gridStore;
  }
  return inject("gridStore");
};
const index = "";
const ColumnResizeLineClass = "gird-column-resize-line";
const ColumnResizeTriggerClass = "gird-column-resize-trigger";
function setRelative(el) {
  const style = getComputedStyle(el);
  const position = style.getPropertyValue("position");
  if (!position || position === "static") {
    el.style.position = "relative";
  }
}
function isInitialized(el) {
  return !!el.__resizeTrigger;
}
let resizeLine;
const clearResizeLine = () => {
  if (!resizeLine)
    return;
  resizeLine.remove();
  resizeLine = void 0;
};
function useResizeColumn(columnEl, headerInfo, tableEl, cb) {
  if (isInitialized(columnEl))
    return;
  const resizeTriggerDom = document.createElement("div");
  resizeTriggerDom.className = ColumnResizeTriggerClass;
  const data = {
    resizing: false,
    startX: 0,
    endX: 0,
    columnLeft: 0,
    columnCurrentWidth: 0
  };
  function getWillWidth() {
    var _a, _b;
    return clamp(
      data.endX - data.startX + data.columnCurrentWidth,
      (_a = headerInfo.minWidth) != null ? _a : 0,
      (_b = headerInfo.maxWidth) != null ? _b : Infinity
    );
  }
  function setupTrigger() {
    var _a;
    if (!(headerInfo == null ? void 0 : headerInfo.resizable)) {
      (_a = resizeTriggerDom.parentElement) == null ? void 0 : _a.removeChild(resizeTriggerDom);
      return;
    }
    if (columnEl && !columnEl.contains(resizeTriggerDom)) {
      columnEl.appendChild(resizeTriggerDom);
      setRelative(columnEl);
      const style = getComputedStyle(columnEl);
      if (style.getPropertyValue("border-right-width") === "0px") {
        resizeTriggerDom.classList.add("is-opacity");
      }
    }
    columnEl.__resizeTrigger = true;
  }
  onUpdated(() => setupTrigger);
  watch$1(() => [columnEl, headerInfo], setupTrigger, { immediate: true });
  function setupResizeLine(e) {
    if (!tableEl)
      return;
    data.startX = e.clientX;
    data.columnLeft = tableEl.scrollLeft + columnEl.getBoundingClientRect().left - tableEl.getBoundingClientRect().x - 2;
    data.endX = e.clientX;
    data.columnCurrentWidth = columnEl.getBoundingClientRect().width;
    resizeLine = document.createElement("div");
    resizeLine.className = ColumnResizeLineClass;
    tableEl.appendChild(resizeLine);
    setRelative(tableEl);
    resizeLine.style.transform = `translateX(${getWillWidth() + data.columnLeft}px)`;
    resizeLine.style.top = `${tableEl.scrollTop}px`;
  }
  function resize(e) {
    if (!data.resizing)
      return;
    e.preventDefault();
    data.endX = e.clientX;
    if (resizeLine)
      resizeLine.style.transform = `translateX(${getWillWidth() + data.columnLeft}px)`;
  }
  resizeTriggerDom.addEventListener("mouseenter", (e) => {
    if (!resizeLine)
      setupResizeLine(e);
  });
  resizeTriggerDom.addEventListener("mouseleave", (e) => {
    if (!data.resizing && resizeLine) {
      resizeLine.remove();
      resizeLine = void 0;
    }
  });
  resizeTriggerDom.addEventListener("mousedown", (e) => {
    e.preventDefault();
    if (data.resizing)
      return;
    data.resizing = true;
    document.addEventListener("mousemove", resize);
    document.addEventListener(
      "mouseup",
      () => {
        data.resizing = false;
        document.removeEventListener("mousemove", resize);
        resizeLine == null ? void 0 : resizeLine.remove();
        resizeLine = void 0;
        console.log(getWillWidth());
        cb(getWillWidth());
      },
      {
        once: true
      }
    );
  });
}
const _hoisted_1$k = { class: "vtg-th-cell vtg-th-cell__index" };
const _sfc_main$o = /* @__PURE__ */ defineComponent({
  __name: "HeaderIndexCell",
  props: {
    column: {}
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$k, toDisplayString(_ctx.column.title), 1);
    };
  }
});
const _hoisted_1$j = { class: "vtg-th-cell vtg-th-cell__checkbox" };
const _hoisted_2$e = ["indeterminate", "checked"];
const _hoisted_3$9 = {
  key: 0,
  class: "vtg-th-cell__checkbox-title"
};
const _sfc_main$n = /* @__PURE__ */ defineComponent({
  __name: "HeaderCheckboxCell",
  props: {
    column: {}
  },
  setup(__props) {
    const gridStore = useGridStore();
    const { watchData, virtualListProps } = gridStore;
    const fullChecked = computed(
      () => watchData.checkboxRows.size === virtualListProps.list.length && virtualListProps.list.length !== 0
    );
    const isIndeterminate = computed(() => watchData.checkboxRows.size > 0 && !fullChecked.value);
    const changeValue = (e) => {
      var _a;
      if ((_a = e == null ? void 0 : e.target) == null ? void 0 : _a.checked) {
        gridStore.addAllCheckboxRows();
      } else {
        gridStore.clearCheckboxRows();
      }
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$j, [
        createElementVNode("input", {
          type: "checkbox",
          indeterminate: isIndeterminate.value,
          checked: fullChecked.value,
          onChange: _cache[0] || (_cache[0] = (e) => changeValue(e))
        }, null, 40, _hoisted_2$e),
        _ctx.column.title ? (openBlock(), createElementBlock("span", _hoisted_3$9, toDisplayString(_ctx.column.title), 1)) : createCommentVNode("", true)
      ]);
    };
  }
});
const _hoisted_1$i = ["title"];
const _sfc_main$m = /* @__PURE__ */ defineComponent({
  __name: "HeaderTextCell",
  props: {
    rowIndex: {},
    row: {},
    column: {}
  },
  setup(__props) {
    const RenderSortIcon = defineComponent({
      props: {
        vnode: {
          type: Object,
          required: true
        }
      },
      setup(props2) {
        return () => props2.vnode;
      }
    });
    const props = __props;
    const gridStore = useGridStore();
    const textOverflowHeader = gridStore.getState("textOverflowHeader");
    const sortState = gridStore.sortState;
    const sortMode = computed(() => {
      var _a;
      return ((_a = props.column.sort) == null ? void 0 : _a.sortMode) || "button";
    });
    const isCurrentColumn = computed(() => {
      return sortState.sortColumnId === props.column._id;
    });
    const shouldShowSortIcons = computed(() => {
      if (sortMode.value === "button") {
        return true;
      }
      if (sortMode.value === "toggle") {
        return isCurrentColumn.value;
      }
      return false;
    });
    const emitSortChange = () => {
      nextTick(() => {
        const currentColumnId = gridStore.sortState.sortColumnId;
        const currentDirection = gridStore.sortState.sortDirection;
        const column = currentColumnId ? gridStore.columnModule.flattedColumns.find((col) => col._id === currentColumnId) || null : null;
        gridStore.eventEmitter.emit(TableEventEnum.SortChange, {
          column,
          direction: currentDirection
        });
      });
    };
    const handleIconClick = (direction) => {
      if (!props.column.sort)
        return;
      const { sortDirections } = props.column.sort;
      if (!sortDirections.includes(direction))
        return;
      if (sortMode.value === "button") {
        if (isCurrentColumn.value && sortState.sortDirection === direction) {
          gridStore.sortState.sortColumnId = null;
          gridStore.sortState.sortDirection = null;
          gridStore.initDataList(gridStore.originList, true);
          emitSortChange();
        } else {
          gridStore.sortData(props.column._id, direction);
          emitSortChange();
        }
      }
    };
    const ascendSortIcon = computed(() => {
      var _a;
      if (!((_a = props.column.sort) == null ? void 0 : _a.sortIcon))
        return null;
      if (sortMode.value !== "button" && !(sortMode.value === "toggle" && isCurrentColumn.value && sortState.sortDirection === "ascend")) {
        return null;
      }
      return props.column.sort.sortIcon({
        direction: "ascend",
        isActive: sortState.sortColumnId === props.column._id && sortState.sortDirection === "ascend",
        onClick: () => sortMode.value === "button" ? handleIconClick("ascend") : void 0
      });
    });
    const descendSortIcon = computed(() => {
      var _a;
      if (!((_a = props.column.sort) == null ? void 0 : _a.sortIcon))
        return null;
      if (sortMode.value !== "button" && !(sortMode.value === "toggle" && isCurrentColumn.value && sortState.sortDirection === "descend")) {
        return null;
      }
      return props.column.sort.sortIcon({
        direction: "descend",
        isActive: sortState.sortColumnId === props.column._id && sortState.sortDirection === "descend",
        onClick: () => sortMode.value === "button" ? handleIconClick("descend") : void 0
      });
    });
    const shouldSortOnHeaderClick = computed(() => {
      var _a;
      if (((_a = props.column.sort) == null ? void 0 : _a.sortOnHeaderClick) !== void 0) {
        return props.column.sort.sortOnHeaderClick;
      }
      return sortMode.value === "toggle";
    });
    const handleHeaderClick = () => {
      if (!props.column.sort)
        return;
      if (!shouldSortOnHeaderClick.value) {
        return;
      }
      if (sortMode.value === "toggle") {
        const { sortDirections } = props.column.sort;
        const currentDirection = sortState.sortDirection;
        const currentColumnId = sortState.sortColumnId;
        if (currentColumnId === props.column._id) {
          if (currentDirection === "ascend" && sortDirections.includes("descend")) {
            gridStore.sortData(props.column._id, "descend");
            emitSortChange();
          } else if (currentDirection === "descend") {
            gridStore.sortState.sortColumnId = null;
            gridStore.sortState.sortDirection = null;
            gridStore.initDataList(gridStore.originList, true);
            emitSortChange();
          }
        } else {
          const firstDirection = sortDirections[0] || "ascend";
          gridStore.sortData(props.column._id, firstDirection);
          emitSortChange();
        }
      } else if (sortMode.value === "button") {
        const { sortDirections } = props.column.sort;
        const currentDirection = sortState.sortDirection;
        const currentColumnId = sortState.sortColumnId;
        if (currentColumnId === props.column._id) {
          const currentIndex = currentDirection ? sortDirections.indexOf(currentDirection) : -1;
          const nextIndex = currentIndex + 1;
          if (nextIndex < sortDirections.length) {
            gridStore.sortData(props.column._id, sortDirections[nextIndex]);
            emitSortChange();
          } else {
            gridStore.sortState.sortColumnId = null;
            gridStore.sortState.sortDirection = null;
            gridStore.initDataList(gridStore.originList, true);
            emitSortChange();
          }
        } else {
          const firstDirection = sortDirections[0] || "ascend";
          gridStore.sortData(props.column._id, firstDirection);
          emitSortChange();
        }
      }
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: normalizeClass(["vtg-th-cell vtg-th-cell__text", { "vtg-th-cell--sortable": _ctx.column.sort }]),
        title: unref(textOverflowHeader) === "title" ? _ctx.column.title : "",
        onClick: withModifiers(handleHeaderClick, ["stop"])
      }, [
        createElementVNode("span", null, toDisplayString(_ctx.column.title), 1),
        _ctx.column.sort && shouldShowSortIcons.value ? (openBlock(), createElementBlock("span", {
          key: 0,
          class: "vtg-th-cell__sort",
          onClick: _cache[2] || (_cache[2] = withModifiers(() => {
          }, ["stop"]))
        }, [
          _ctx.column.sort.sortIcon ? (openBlock(), createElementBlock(Fragment, { key: 0 }, [
            ascendSortIcon.value ? (openBlock(), createBlock(unref(RenderSortIcon), {
              key: 0,
              vnode: ascendSortIcon.value
            }, null, 8, ["vnode"])) : createCommentVNode("", true),
            descendSortIcon.value ? (openBlock(), createBlock(unref(RenderSortIcon), {
              key: 1,
              vnode: descendSortIcon.value
            }, null, 8, ["vnode"])) : createCommentVNode("", true)
          ], 64)) : (openBlock(), createElementBlock(Fragment, { key: 1 }, [
            sortMode.value === "button" || sortMode.value === "toggle" && isCurrentColumn.value && unref(sortState).sortDirection === "ascend" ? (openBlock(), createElementBlock("span", {
              key: 0,
              class: normalizeClass(["vtg-th-cell__sort-icon", {
                "is-active": unref(sortState).sortColumnId === _ctx.column._id && unref(sortState).sortDirection === "ascend",
                "vtg-th-cell__sort-icon--clickable": sortMode.value === "button"
              }]),
              onClick: _cache[0] || (_cache[0] = withModifiers(($event) => sortMode.value === "button" ? handleIconClick("ascend") : void 0, ["stop"]))
            }, " ↑ ", 2)) : createCommentVNode("", true),
            sortMode.value === "button" || sortMode.value === "toggle" && isCurrentColumn.value && unref(sortState).sortDirection === "descend" ? (openBlock(), createElementBlock("span", {
              key: 1,
              class: normalizeClass(["vtg-th-cell__sort-icon", {
                "is-active": unref(sortState).sortColumnId === _ctx.column._id && unref(sortState).sortDirection === "descend",
                "vtg-th-cell__sort-icon--clickable": sortMode.value === "button"
              }]),
              onClick: _cache[1] || (_cache[1] = withModifiers(($event) => sortMode.value === "button" ? handleIconClick("descend") : void 0, ["stop"]))
            }, " ↓ ", 2)) : createCommentVNode("", true)
          ], 64))
        ])) : createCommentVNode("", true)
      ], 10, _hoisted_1$i);
    };
  }
});
const HeaderTextCell_vue_vue_type_style_index_0_scoped_319ebdba_lang = "";
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const HeaderTextCell = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["__scopeId", "data-v-319ebdba"]]);
const _hoisted_1$h = ["data-id", "rowspan", "colspan"];
const _hoisted_2$d = ["colspan"];
const _hoisted_3$8 = ["data-id", "rowspan", "colspan"];
const _hoisted_4$4 = ["colspan"];
const _hoisted_5$2 = ["data-id", "rowspan", "colspan"];
const _sfc_main$l = /* @__PURE__ */ defineComponent({
  __name: "HeaderRow",
  props: {
    headerRowIndex: {},
    currentColumn: {},
    centerColumnsInfo: {}
  },
  setup(__props) {
    const gridStore = useGridStore();
    const { columnsInfo } = gridStore.columnModule;
    const headerCellInfo = computed(() => columnsInfo.headerCellInfo);
    const leftFixedHeaderColumns = computed(() => columnsInfo.leftFixedHeaderColumns);
    const rightFixedHeaderColumns = computed(() => columnsInfo.rightFixedHeaderColumns);
    const centerNormalHeaderColumns = computed(() => columnsInfo.centerNormalHeaderColumns);
    const cls = {
      leftFixed: (column) => {
        var _a, _b, _c, _d;
        return [
          "vtg-th",
          `vtg-th--${(_b = (_a = column == null ? void 0 : column.headerAlign) != null ? _a : gridStore.getState("headerAlign")) != null ? _b : "left"}`,
          `vtg-th--${(_d = (_c = column == null ? void 0 : column.headerVerticalAlign) != null ? _c : gridStore.getState("headerVerticalAlign")) != null ? _d : "middle"}`,
          gridStore.getState("textOverflowHeader") ? "vtg-th--text-ellipsis" : "",
          "is-fixed",
          "is-fixed--left",
          getCellClass(column),
          column.className
        ];
      },
      leftPadding: () => ["vtg-th"],
      main: (column) => {
        var _a, _b, _c, _d;
        return [
          "vtg-th",
          `vtg-th--${(_b = (_a = column == null ? void 0 : column.headerAlign) != null ? _a : gridStore.getState("headerAlign")) != null ? _b : "left"}`,
          `vtg-th--${(_d = (_c = column == null ? void 0 : column.headerVerticalAlign) != null ? _c : gridStore.getState("headerVerticalAlign")) != null ? _d : "middle"}`,
          gridStore.getState("textOverflowHeader") ? "vtg-th--text-ellipsis" : "",
          getCellClass(column),
          column.className
        ];
      },
      rightPadding: () => ["vtg-th"],
      rightFixed: (column) => {
        var _a, _b, _c, _d;
        return [
          "vtg-th",
          `vtg-th--${(_b = (_a = column == null ? void 0 : column.headerAlign) != null ? _a : gridStore.getState("headerAlign")) != null ? _b : "left"}`,
          `vtg-th--${(_d = (_c = column == null ? void 0 : column.headerVerticalAlign) != null ? _c : gridStore.getState("headerVerticalAlign")) != null ? _d : "middle"}`,
          gridStore.getState("textOverflowHeader") ? "vtg-th--text-ellipsis" : "",
          "is-fixed",
          "is-fixed--right",
          getCellClass(column),
          column.className
        ];
      },
      row: () => ["vtg-tr", getRowClass()]
    };
    const props = __props;
    const leftCount = computed(() => {
      var _a, _b;
      const currentHeaderColumns = props.centerColumnsInfo[props.headerRowIndex];
      const currentHeaderFirstColumn = currentHeaderColumns == null ? void 0 : currentHeaderColumns[0];
      return (_b = (_a = headerCellInfo.value[currentHeaderFirstColumn == null ? void 0 : currentHeaderFirstColumn._id]) == null ? void 0 : _a.leftColspan) != null ? _b : 0;
    });
    const rightCount = computed(() => {
      var _a, _b, _c, _d;
      const currentHeaderColumns = props.centerColumnsInfo[props.headerRowIndex];
      const currentHeaderLastColumn = currentHeaderColumns == null ? void 0 : currentHeaderColumns[(currentHeaderColumns == null ? void 0 : currentHeaderColumns.length) - 1];
      const currentHeaderLastColumnLeftColspan = (_b = (_a = headerCellInfo.value[currentHeaderLastColumn == null ? void 0 : currentHeaderLastColumn._id]) == null ? void 0 : _a.leftColspan) != null ? _b : 0;
      const currentCenterNormalHeaderColumns = centerNormalHeaderColumns.value[props.headerRowIndex];
      const currentHeaderNormalHeaderLastColumn = currentCenterNormalHeaderColumns == null ? void 0 : currentCenterNormalHeaderColumns[(currentCenterNormalHeaderColumns == null ? void 0 : currentCenterNormalHeaderColumns.length) - 1];
      const currentHeaderNormalHeaderLastColumnLeftColspan = (_d = (_c = headerCellInfo.value[currentHeaderNormalHeaderLastColumn == null ? void 0 : currentHeaderNormalHeaderLastColumn._id]) == null ? void 0 : _c.leftColspan) != null ? _d : 0;
      return currentHeaderNormalHeaderLastColumnLeftColspan - currentHeaderLastColumnLeftColspan;
    });
    const fullRow = leftFixedHeaderColumns.value[props.headerRowIndex].concat(
      centerNormalHeaderColumns.value[props.headerRowIndex],
      rightFixedHeaderColumns.value[props.headerRowIndex]
    );
    const getRowClass = () => {
      const fn = gridStore.getState("headerRowClassName");
      if (fn) {
        return fn({
          row: fullRow,
          rowIndex: props.headerRowIndex
        });
      }
    };
    const getRowStyle = () => {
      const fn = gridStore.getState("headerRowStyle");
      if (fn) {
        return fn({
          row: fullRow,
          rowIndex: props.headerRowIndex
        });
      }
    };
    const getCellClass = (column) => {
      const fn = gridStore.getState("headerCellClassName");
      if (fn) {
        return fn({
          row: props.currentColumn,
          rowIndex: props.headerRowIndex,
          column,
          columnIndex: column.colIndex
        });
      }
    };
    const getCellStyle = (column) => {
      const fn = gridStore.getState("headerCellStyle");
      if (fn) {
        return fn({
          row: props.currentColumn,
          rowIndex: props.headerRowIndex,
          column,
          columnIndex: column.colIndex
        });
      }
    };
    const itemRefEl = ref$1();
    onUpdated(() => {
      var _a;
      (_a = itemRefEl.value) == null ? void 0 : _a.querySelectorAll(":scope>th[data-id]").forEach((item) => {
        var _a2, _b;
        const colId = item.getAttribute("data-id");
        if (!colId || !((_a2 = headerCellInfo.value[colId]) == null ? void 0 : _a2.resizable) || !((_b = headerCellInfo.value[colId]) == null ? void 0 : _b.isLeaf))
          return;
        useResizeColumn(
          item,
          headerCellInfo.value[colId],
          gridStore.tableEl,
          (width) => {
            if (colId)
              gridStore.columnModule.setColumnWidth(colId, width);
          }
        );
      });
    });
    function getRenderCell(column) {
      var _a;
      switch (column.type) {
        case CellType.Index:
          return _sfc_main$o;
        case CellType.Checkbox:
          return _sfc_main$n;
        case CellType.Radio:
          return HeaderTextCell;
        default:
          if (column == null ? void 0 : column.headerRender)
            return (_a = column == null ? void 0 : column.headerRender) == null ? void 0 : _a.call(column, column);
          return HeaderTextCell;
      }
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("tr", {
        ref_key: "itemRefEl",
        ref: itemRefEl,
        class: normalizeClass(cls.row()),
        style: normalizeStyle(getRowStyle())
      }, [
        (openBlock(true), createElementBlock(Fragment, null, renderList(leftFixedHeaderColumns.value[_ctx.headerRowIndex], (column) => {
          var _a, _b;
          return openBlock(), createElementBlock("th", {
            key: `${column.field}-${unref(gridStore).watchData.renderKey}-${column._id}`,
            "data-id": column._id,
            class: normalizeClass(cls.leftFixed(column)),
            style: normalizeStyle(`left: ${headerCellInfo.value[column._id].fixOffset}px; ${getCellStyle(column)}`),
            rowspan: (_a = headerCellInfo.value[column._id]) == null ? void 0 : _a.rowspan,
            colspan: (_b = headerCellInfo.value[column._id]) == null ? void 0 : _b.colspan
          }, [
            (openBlock(), createBlock(resolveDynamicComponent(getRenderCell(column)), { column }, null, 8, ["column"]))
          ], 14, _hoisted_1$h);
        }), 128)),
        leftCount.value > 0 ? (openBlock(), createElementBlock("th", {
          key: 0,
          class: normalizeClass(cls.leftPadding()),
          colspan: leftCount.value
        }, null, 10, _hoisted_2$d)) : createCommentVNode("", true),
        (openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.centerColumnsInfo[_ctx.headerRowIndex], (column) => {
          var _a, _b;
          return openBlock(), createElementBlock("th", {
            key: column.field,
            class: normalizeClass(cls.main(column)),
            style: normalizeStyle(`${getCellStyle(column)}`),
            "data-id": column._id,
            rowspan: (_a = headerCellInfo.value[column._id]) == null ? void 0 : _a.rowspan,
            colspan: (_b = headerCellInfo.value[column._id]) == null ? void 0 : _b.colspan
          }, [
            (openBlock(), createBlock(resolveDynamicComponent(getRenderCell(column)), { column }, null, 8, ["column"]))
          ], 14, _hoisted_3$8);
        }), 128)),
        rightCount.value > 0 ? (openBlock(), createElementBlock("th", {
          key: 1,
          class: normalizeClass(cls.rightPadding),
          colspan: rightCount.value
        }, null, 10, _hoisted_4$4)) : createCommentVNode("", true),
        (openBlock(true), createElementBlock(Fragment, null, renderList(rightFixedHeaderColumns.value[_ctx.headerRowIndex], (column) => {
          var _a, _b;
          return openBlock(), createElementBlock("th", {
            key: column.field,
            "data-id": column._id,
            class: normalizeClass(cls.rightFixed(column)),
            style: normalizeStyle(`text-align: ${column.headerAlign || column.align}; right: ${headerCellInfo.value[column._id].fixOffset}px; ${getCellStyle(column)}`),
            rowspan: (_a = headerCellInfo.value[column._id]) == null ? void 0 : _a.rowspan,
            colspan: (_b = headerCellInfo.value[column._id]) == null ? void 0 : _b.colspan
          }, [
            (openBlock(), createBlock(resolveDynamicComponent(getRenderCell(column)), { column }, null, 8, ["column"]))
          ], 14, _hoisted_5$2);
        }), 128))
      ], 6);
    };
  }
});
const _sfc_main$k = /* @__PURE__ */ defineComponent({
  __name: "Header",
  setup(__props) {
    const gridStore = useGridStore();
    const { columnsInfo } = gridStore.columnModule;
    const centerColumnsInfo = computed(() => {
      const { centerNormalColumns, columnsInfo: columnsInfo2 } = gridStore.columnModule;
      const { headerCellInfo, centerNormalHeaderColumns } = columnsInfo2;
      const centerColumnsInfo2 = [];
      const resetRender = (col) => {
        headerCellInfo[col._id].rendered = false;
        const { parentColumn } = headerCellInfo[col._id];
        if (parentColumn) {
          resetRender(parentColumn);
        }
      };
      centerNormalColumns.forEach((col) => {
        resetRender(col);
      });
      const renderHeader = (column) => {
        const { level = 0, parentColumn } = headerCellInfo[column._id];
        if (centerColumnsInfo2[level] === void 0) {
          centerColumnsInfo2[level] = [];
        }
        if (centerColumnsInfo2[level].indexOf(column) < 0) {
          centerColumnsInfo2[level].push(column);
          headerCellInfo[column._id].rendered = true;
        }
        if (parentColumn) {
          renderHeader(parentColumn);
        }
      };
      for (let i = gridStore.mergeModule.mergeState.renderRect.xs; i <= gridStore.mergeModule.mergeState.renderRect.xe; i++) {
        const column = centerNormalColumns[i];
        renderHeader(column);
      }
      const baseLeftPadding = [];
      const maxLevel = centerNormalHeaderColumns.length;
      for (let i = 0; i < maxLevel; i++) {
        baseLeftPadding.push(0);
      }
      for (let i = 0; i < maxLevel; i++) {
        const row = centerNormalHeaderColumns[i];
        for (let j = 0; j < row.length; j++) {
          const info = headerCellInfo[row[j]._id];
          const parentInfo = info.parentId ? headerCellInfo[info.parentId] : void 0;
          if (!info.rendered && (!parentInfo || parentInfo.rendered)) {
            for (let k = i; k < maxLevel; k++) {
              baseLeftPadding[k] += info.colspan || 1;
            }
          } else {
            break;
          }
        }
      }
      for (let i = 0; i < maxLevel; i++) {
        const row = centerNormalHeaderColumns[i];
        let isLeftPadding = true;
        for (let j = 0; j < row.length; j++) {
          const info = headerCellInfo[row[j]._id];
          if (info.rendered || !isLeftPadding) {
            info.leftColspan = baseLeftPadding[i];
            baseLeftPadding[i] += info.colspan || 1;
            isLeftPadding = false;
          }
        }
      }
      return centerColumnsInfo2;
    });
    return (_ctx, _cache) => {
      return openBlock(true), createElementBlock(Fragment, null, renderList(unref(columnsInfo).leftFixedHeaderColumns, (currentColumn, index2) => {
        return openBlock(), createBlock(_sfc_main$l, {
          key: index2,
          currentColumn,
          headerRowIndex: index2,
          centerColumnsInfo: centerColumnsInfo.value
        }, null, 8, ["currentColumn", "headerRowIndex", "centerColumnsInfo"]);
      }), 128);
    };
  }
});
const _sfc_main$j = /* @__PURE__ */ defineComponent({
  __name: "Placement",
  props: {
    showLine: { type: Boolean, default: false },
    isLastPlacement: { type: Boolean, default: false },
    isLastChild: { type: Boolean, default: false }
  },
  setup(__props) {
    const props = __props;
    const cls = computed(() => [
      "placement",
      props.showLine && "placement--tree-line",
      props.showLine && props.isLastPlacement && "placement--last-padding",
      props.showLine && props.isLastPlacement && props.isLastChild && "placement--last-tree-node"
    ]);
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: normalizeClass(cls.value)
      }, null, 2);
    };
  }
});
const _hoisted_1$g = /* @__PURE__ */ createElementVNode("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none"
}, [
  /* @__PURE__ */ createElementVNode("path", {
    d: "M8.58816 5.15502L16.888 11.1913C17.4371 11.5906 17.4371 12.4094 16.888 12.8087L8.58816 18.845C7.92719 19.3257 6.99999 18.8535 6.99999 18.0362L6.99999 5.96376C6.99999 5.14647 7.92719 4.67432 8.58816 5.15502Z",
    fill: "#6B7075"
  })
], -1);
const _hoisted_2$c = [
  _hoisted_1$g
];
const _hoisted_3$7 = { class: "content" };
const _sfc_main$i = /* @__PURE__ */ defineComponent({
  __name: "TreeCell",
  props: {
    rowIndex: {},
    row: {},
    column: {}
  },
  setup(__props) {
    const gridStore = useGridStore();
    const { groupModule } = gridStore;
    const props = __props;
    const showTreeLine = computed(() => gridStore.getState("showTreeLine"));
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: "vtg-cell vtg-cell__title",
        style: normalizeStyle(`width: ${_ctx.column.width}px;`)
      }, [
        (openBlock(true), createElementBlock(Fragment, null, renderList(_ctx.row.level, (item) => {
          return openBlock(), createBlock(_sfc_main$j, {
            key: item,
            "show-line": showTreeLine.value && item > _ctx.row.groupLevel,
            "is-last-child": _ctx.row.isLastChild,
            "is-last-placement": item === _ctx.row.level
          }, null, 8, ["show-line", "is-last-child", "is-last-placement"]);
        }), 128)),
        createElementVNode("div", {
          class: normalizeClass([
            "tree-leading",
            showTreeLine.value ? "tree-leading--tree-line" : "tree-leading--tree-line-hide",
            (!_ctx.row.level || _ctx.row.level === _ctx.row.groupLevel) && "tree-leading--first-node"
          ])
        }, [
          unref(groupModule).groupState.foldMap[_ctx.row.id] !== void 0 ? (openBlock(), createElementBlock("div", {
            key: 0,
            class: normalizeClass([
              "tree-leading-icon",
              !unref(groupModule).groupState.foldMap[props.row.id] && "tree-leading-icon--expand"
            ]),
            onClick: _cache[0] || (_cache[0] = withModifiers(($event) => unref(gridStore).groupModule.toggleFold(_ctx.row.id), ["stop"]))
          }, _hoisted_2$c, 2)) : createCommentVNode("", true)
        ], 2),
        createElementVNode("div", _hoisted_3$7, toDisplayString(_ctx.column.field ? _ctx.row[_ctx.column.field] : ""), 1)
      ], 4);
    };
  }
});
const TreeCell_vue_vue_type_style_index_0_lang = "";
const _hoisted_1$f = ["title"];
const _sfc_main$h = /* @__PURE__ */ defineComponent({
  __name: "TextCell",
  props: {
    rowIndex: {},
    row: {},
    column: {}
  },
  setup(__props) {
    const gridStore = useGridStore();
    const textOverflow = gridStore.getState("textOverflow");
    return (_ctx, _cache) => {
      var _a, _b;
      return openBlock(), createElementBlock("div", {
        class: "vtg-cell vtg-cell__text",
        title: unref(textOverflow) === "title" ? _ctx.row[_ctx.column.field] : ""
      }, [
        createElementVNode("span", null, toDisplayString(((_b = _ctx.row) == null ? void 0 : _b[(_a = _ctx.column) == null ? void 0 : _a.field]) || ""), 1)
      ], 8, _hoisted_1$f);
    };
  }
});
const _hoisted_1$e = { class: "vtg-cell vtg-cell__index" };
const _sfc_main$g = /* @__PURE__ */ defineComponent({
  __name: "IndexCell",
  props: {
    rowIndex: {},
    row: {},
    column: {}
  },
  setup(__props) {
    var _a, _b, _c;
    const props = __props;
    const indexValue = (_c = (_b = (_a = props.column) == null ? void 0 : _a.index) == null ? void 0 : _b.call(_a, props.rowIndex)) != null ? _c : props.rowIndex + 1;
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$e, toDisplayString(unref(indexValue)), 1);
    };
  }
});
const _hoisted_1$d = { class: "vtg-cell vtg-cell__checkbox" };
const _hoisted_2$b = ["checked"];
const _hoisted_3$6 = {
  key: 0,
  class: "vtg-cell__checkbox-field"
};
const _sfc_main$f = /* @__PURE__ */ defineComponent({
  __name: "CheckboxCell",
  props: {
    rowIndex: {},
    row: {},
    column: {}
  },
  setup(__props) {
    const gridStore = useGridStore();
    const { watchData } = gridStore;
    const props = __props;
    const changeValue = (e) => {
      var _a;
      if ((_a = e == null ? void 0 : e.target) == null ? void 0 : _a.checked) {
        gridStore.addCheckboxRows(props.row);
      } else {
        gridStore.deleteCheckboxRows(props.row);
      }
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$d, [
        createElementVNode("input", {
          type: "checkbox",
          checked: unref(watchData).checkboxRows.has(_ctx.row),
          onChange: _cache[0] || (_cache[0] = (e) => changeValue(e))
        }, null, 40, _hoisted_2$b),
        _ctx.column.field ? (openBlock(), createElementBlock("span", _hoisted_3$6, toDisplayString(_ctx.column.field ? _ctx.row[_ctx.column.field] : ""), 1)) : createCommentVNode("", true)
      ]);
    };
  }
});
const _hoisted_1$c = { class: "vtg-cell vtg-cell__checkbox" };
const _hoisted_2$a = ["checked"];
const _hoisted_3$5 = {
  key: 0,
  class: "vtg-cell__checkbox-field"
};
const _sfc_main$e = /* @__PURE__ */ defineComponent({
  __name: "RadioCell",
  props: {
    rowIndex: {},
    row: {},
    column: {}
  },
  setup(__props) {
    const gridStore = useGridStore();
    const { watchData } = gridStore;
    const props = __props;
    const changeValue = () => {
      gridStore.addRadioRow(props.row);
    };
    return (_ctx, _cache) => {
      var _a;
      return openBlock(), createElementBlock("div", _hoisted_1$c, [
        createElementVNode("input", {
          type: "radio",
          checked: ((_a = unref(watchData).radioRow) == null ? void 0 : _a.id) === _ctx.row.id,
          onChange: changeValue
        }, null, 40, _hoisted_2$a),
        _ctx.column.field ? (openBlock(), createElementBlock("span", _hoisted_3$5, toDisplayString(_ctx.column.field ? _ctx.row[_ctx.column.field] : ""), 1)) : createCommentVNode("", true)
      ]);
    };
  }
});
const _hoisted_1$b = /* @__PURE__ */ createElementVNode("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  width: "12",
  height: "12",
  viewBox: "0 0 24 24",
  fill: "none"
}, [
  /* @__PURE__ */ createElementVNode("path", {
    d: "M6.79289 22.2071C6.40237 21.8166 6.40237 21.1834 6.79289 20.7929L15.0858 12.5L6.79289 4.20711C6.40237 3.81658 6.40237 3.18342 6.79289 2.79289C7.18342 2.40237 7.81658 2.40237 8.20711 2.79289L17.2071 11.7929C17.5976 12.1834 17.5976 12.8166 17.2071 13.2071L8.20711 22.2071C7.81658 22.5976 7.18342 22.5976 6.79289 22.2071Z",
    fill: "#6B7075"
  })
], -1);
const _hoisted_2$9 = [
  _hoisted_1$b
];
const _sfc_main$d = /* @__PURE__ */ defineComponent({
  __name: "ExpandCell",
  props: {
    rowIndex: {},
    row: {},
    column: {}
  },
  setup(__props) {
    const gridStore = useGridStore();
    const { groupState } = gridStore.groupModule;
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        class: "vtg-cell vtg-cell__expand",
        onClick: _cache[0] || (_cache[0] = ($event) => unref(gridStore).groupModule.toggleExpand(_ctx.row.id))
      }, [
        createElementVNode("div", {
          class: normalizeClass(["row-expand-icon", unref(groupState).expandMap[_ctx.row.id] && "row-expand-icon--expand"])
        }, _hoisted_2$9, 2)
      ]);
    };
  }
});
const BaseRow = /* @__PURE__ */ defineComponent({
  name: "Row",
  props: {
    resizeObserver: {
      type: Object,
      default: null
    },
    rowIndex: {
      type: Number,
      default: 0
    },
    row: {
      type: Object,
      default: () => ({})
    }
  },
  setup(props) {
    const gridStore = useGridStore();
    const {
      itemRefEl
    } = useObserverItem({
      resizeObserver: props.resizeObserver
    });
    const maxHeight = computed(() => gridStore.watchData.rowHeightMap.get(String(props.row.id)));
    const getCellStyle = (column) => {
      const fn = gridStore.getState("cellStyle");
      if (fn) {
        return fn({
          row: props.row,
          rowIndex: props.rowIndex,
          column,
          columnIndex: column.colIndex
        });
      }
    };
    const getRenderCell = ({
      row,
      rowIndex,
      column
    }) => {
      var _a, _b, _c, _d, _e, _f;
      const type = (_b = (_a = row[column.field]) == null ? void 0 : _a.type) != null ? _b : column == null ? void 0 : column.type;
      const cellRender = (_f = (_d = (_c = row[column.field]) == null ? void 0 : _c.cellRender) != null ? _d : column == null ? void 0 : column.cellRender) != null ? _f : (_e = gridStore.customRender) == null ? void 0 : _e.cellRender;
      if (cellRender) {
        const renderCell = cellRender({
          column,
          row: props.row
        });
        if (renderCell)
          return renderCell;
      } else if (type) {
        switch (type) {
          case CellType.Index:
            return createVNode(_sfc_main$g, {
              "rowIndex": rowIndex,
              "row": row,
              "column": column
            }, null);
          case CellType.Tree:
            return createVNode(_sfc_main$i, {
              "rowIndex": rowIndex,
              "row": row,
              "column": column
            }, null);
          case CellType.Expand:
            return createVNode(_sfc_main$d, {
              "rowIndex": rowIndex,
              "row": row,
              "column": column
            }, null);
          case CellType.Checkbox:
            return createVNode(_sfc_main$f, {
              "rowIndex": rowIndex,
              "row": row,
              "column": column
            }, null);
          case CellType.Radio:
            return createVNode(_sfc_main$e, {
              "rowIndex": rowIndex,
              "row": row,
              "column": column
            }, null);
          default:
            return createVNode(_sfc_main$h, {
              "rowIndex": rowIndex,
              "row": row,
              "column": column
            }, null);
        }
      } else {
        return createVNode(_sfc_main$h, {
          "rowIndex": rowIndex,
          "row": row,
          "column": column
        }, null);
      }
    };
    const selectRowId = computed(() => gridStore.interactionModule.getSelectRow());
    const selectColId = computed(() => gridStore.interactionModule.getSelectCol());
    const getRowClass = () => {
      const fn = gridStore.getState("rowClassName");
      if (fn) {
        return fn({
          row: props.row,
          rowIndex: props.rowIndex
        });
      }
    };
    const getCellClass = (column) => {
      const fn = gridStore.getState("cellClassName");
      if (fn) {
        return fn({
          row: props.row,
          rowIndex: props.rowIndex,
          column,
          columnIndex: column.colIndex
        });
      }
    };
    const getRowStyle = () => {
      const fn = gridStore.getState("rowStyle");
      if (fn) {
        return fn({
          row: props.row,
          rowIndex: props.rowIndex
        });
      }
    };
    const cls = {
      leftFixed: (column) => {
        var _a, _b, _c, _d;
        return [
          "vtg-td",
          `vtg-td--${(_b = (_a = column == null ? void 0 : column.align) != null ? _a : gridStore.getState("align")) != null ? _b : "left"}`,
          `vtg-td--${(_d = (_c = column == null ? void 0 : column.verticalAlign) != null ? _c : gridStore.getState("verticalAlign")) != null ? _d : "middle"}`,
          gridStore.getState("textOverflow") ? "vtg-td--text-ellipsis" : "",
          "is-fixed",
          "is-fixed--left",
          column._id === selectColId.value && "current-column",
          // gridStore.interactionModule.getSelectionClass(props.rowIndex, column),
          getCellClass(column),
          column.className
        ];
      },
      leftPadding: () => ["vtg-td"],
      main: (column) => {
        var _a, _b, _c, _d;
        return [
          "vtg-td",
          `vtg-td--${(_b = (_a = column == null ? void 0 : column.align) != null ? _a : gridStore.getState("align")) != null ? _b : "left"}`,
          `vtg-td--${(_d = (_c = column == null ? void 0 : column.verticalAlign) != null ? _c : gridStore.getState("verticalAlign")) != null ? _d : "middle"}`,
          gridStore.getState("textOverflow") ? "vtg-td--text-ellipsis" : "",
          column._id === selectColId.value && "current-column",
          // gridStore.interactionModule.getSelectionClass(props.rowIndex, column),
          getCellClass(column),
          column.className
        ];
      },
      rightPadding: () => ["vtg-td"],
      rightFixed: (column) => {
        var _a, _b, _c, _d;
        return [
          "vtg-td",
          `vtg-td--${(_b = (_a = column == null ? void 0 : column.align) != null ? _a : gridStore.getState("align")) != null ? _b : "left"}`,
          `vtg-td--${(_d = (_c = column == null ? void 0 : column.verticalAlign) != null ? _c : gridStore.getState("verticalAlign")) != null ? _d : "middle"}`,
          gridStore.getState("textOverflow") ? "vtg-td--text-ellipsis" : "",
          "is-fixed",
          "is-fixed--right",
          column._id === selectColId.value && "current-column",
          // gridStore.interactionModule.getSelectionClass(props.rowIndex, column),
          getCellClass(column),
          column.className
        ];
      },
      row: () => ["vtg-tr", gridStore.getState("stripe") && props.rowIndex % 2 && "is-striped", props.row.id === selectRowId.value && "current-row", getRowClass()]
    };
    return {
      gridStore,
      maxHeight,
      itemRefEl,
      getCellStyle,
      getRowStyle,
      getRenderCell,
      cls
    };
  },
  render() {
    var _a, _b, _c, _d;
    const {
      watchData,
      // tempMerges,
      // merges,
      mergeModule: {
        tempMerges,
        merges,
        mergeState
      },
      columnModule: {
        leftFixedColumns,
        rightFixedColumns,
        centerNormalColumns,
        columnsInfo
      }
    } = this.gridStore;
    const {
      headerCellInfo
    } = columnsInfo;
    const {
      row,
      rowIndex,
      maxHeight,
      getCellStyle,
      getRowStyle,
      getRenderCell,
      cls
    } = this;
    const tds = [];
    if (leftFixedColumns.length > 0) {
      for (let colIndex = 0; colIndex < leftFixedColumns.length; colIndex++) {
        const column = leftFixedColumns[colIndex];
        tds.push(createVNode("td", {
          "key": `${watchData.renderKey}-${rowIndex}-${colIndex}`,
          "class": cls.leftFixed(column),
          "style": `left: ${headerCellInfo[column._id].fixOffset}px; ${getCellStyle(column)}`,
          "data-rowidx": rowIndex,
          "data-colidx": colIndex
        }, [getRenderCell({
          row,
          rowIndex,
          column
        })]));
      }
    }
    if (mergeState.renderRect.xs > 0) {
      tds.push(createVNode("td", {
        "key": `${watchData.renderKey}-${rowIndex}-lp`,
        "class": "vtg-td",
        "style": `height: ${maxHeight}px`,
        "data-rowidx": rowIndex,
        "data-colidx": "lp",
        "rowspan": 1,
        "colspan": mergeState.renderRect.xs
      }, null));
    }
    for (let colIndex = mergeState.renderRect.xs; colIndex <= mergeState.renderRect.xe; colIndex++) {
      const column = centerNormalColumns[colIndex];
      const actualColIndex = colIndex + leftFixedColumns.length;
      const mergeInfo = (_b = (_a = getMergeInfo(tempMerges, rowIndex, colIndex)) != null ? _a : getMergeInfo(merges, rowIndex, colIndex)) != null ? _b : void 0;
      if (mergeInfo === void 0) {
        tds.push(createVNode("td", {
          "key": `${watchData.renderKey}-${rowIndex}-${actualColIndex}`,
          "class": cls.main(column),
          "data-rowidx": rowIndex,
          "data-colidx": actualColIndex,
          "style": `height: ${watchData.config.minRowHeight}px`
        }, [getRenderCell({
          row,
          rowIndex,
          column
        })]));
      } else if (mergeInfo.rowIndex === rowIndex && mergeInfo.colIndex === colIndex) {
        const rowspan = (_c = mergeInfo == null ? void 0 : mergeInfo.rowspan) != null ? _c : 1;
        const colspan = (_d = mergeInfo == null ? void 0 : mergeInfo.colspan) != null ? _d : 1;
        tds.push(createVNode("td", {
          "key": `${watchData.renderKey}-${rowIndex}-${actualColIndex}`,
          "class": cls.main(column),
          "data-rowidx": rowIndex,
          "data-colidx": actualColIndex,
          "rowspan": rowspan,
          "colspan": colspan
        }, [getRenderCell({
          row,
          rowIndex,
          column
        })]));
      }
    }
    if (mergeState.renderRect.xe < centerNormalColumns.length - 1) {
      tds.push(createVNode("td", {
        "key": `${watchData.renderKey}-${rowIndex}-rp`,
        "class": "vtg-td",
        "style": `height: ${maxHeight}px`,
        "data-rowidx": rowIndex,
        "data-colidx": "rp",
        "rowspan": 1,
        "colspan": centerNormalColumns.length - mergeState.renderRect.xe + 1 - rightFixedColumns.length
      }, null));
    }
    if (rightFixedColumns.length > 0) {
      for (let colIndex = 0; colIndex < rightFixedColumns.length; colIndex++) {
        const column = rightFixedColumns[colIndex];
        const actualColIndex = colIndex + leftFixedColumns.length + centerNormalColumns.length;
        const colInfo = headerCellInfo[column._id];
        const fixOffset = colInfo == null ? void 0 : colInfo.fixOffset;
        const colWidth = column.width;
        if (rowIndex === 0) {
          if (!colWidth || colWidth === 0) {
            console.error("[BaseRow-rightFixed] column width is 0 or undefined:", column._id, column.field, "width:", colWidth, "colIndex:", colIndex, "column:", column);
          }
          if (fixOffset === void 0 || fixOffset === null) {
            console.error("[BaseRow-rightFixed] fixOffset is undefined:", column._id, column.field, "fixOffset:", fixOffset, "colInfo:", colInfo);
          } else {
            console.log("[BaseRow-rightFixed] column:", column._id, column.field, "width:", colWidth, "fixOffset:", fixOffset, "colIndex:", colIndex, "actualColIndex:", actualColIndex, "rightFixedColumns.length:", rightFixedColumns.length);
          }
        }
        tds.push(createVNode("td", {
          "key": `${watchData.renderKey}-${rowIndex}-${actualColIndex}`,
          "class": cls.rightFixed(column),
          "style": `text-align: ${column.align}; right: ${fixOffset != null ? fixOffset : 0}px; ${getCellStyle(column)}`,
          "data-rowidx": rowIndex,
          "data-colidx": actualColIndex
        }, [getRenderCell({
          row,
          rowIndex,
          column
        })]));
      }
    }
    return createVNode("tr", {
      "class": cls.row(),
      "style": getRowStyle(),
      "ref": "itemRefEl"
    }, [tds]);
  }
});
const _hoisted_1$a = ["colspan"];
const _hoisted_2$8 = /* @__PURE__ */ createElementVNode("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  width: "16",
  height: "16",
  viewBox: "0 0 24 24",
  fill: "none"
}, [
  /* @__PURE__ */ createElementVNode("path", {
    d: "M8.58816 5.15502L16.888 11.1913C17.4371 11.5906 17.4371 12.4094 16.888 12.8087L8.58816 18.845C7.92719 19.3257 6.99999 18.8535 6.99999 18.0362L6.99999 5.96376C6.99999 5.14647 7.92719 4.67432 8.58816 5.15502Z",
    fill: "#6B7075"
  })
], -1);
const _hoisted_3$4 = [
  _hoisted_2$8
];
const _sfc_main$c = /* @__PURE__ */ defineComponent({
  __name: "GroupRow",
  props: {
    row: {},
    resizeObserver: { default: null },
    rowIndex: { default: 0 }
  },
  setup(__props) {
    const gridStore = useGridStore();
    const { foldMap } = gridStore.groupModule.groupState;
    const { config } = gridStore.watchData;
    const { columnModule } = gridStore;
    const props = __props;
    console.log(111, foldMap[props.row.id]);
    const { itemRefEl } = useObserverItem({ resizeObserver: props.resizeObserver });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("tr", {
        ref_key: "itemRefEl",
        ref: itemRefEl,
        class: "vtg-tr vtg-tr--group"
      }, [
        createElementVNode("td", {
          class: "vtg-td vtg-td--group",
          colspan: unref(columnModule).flattedColumns.length
        }, [
          createElementVNode("div", {
            class: "vtg-cell",
            style: normalizeStyle(`height: ${unref(config).minRowHeight}px;`)
          }, [
            (openBlock(true), createElementBlock(Fragment, null, renderList(props.row.level, (item) => {
              return openBlock(), createBlock(_sfc_main$j, {
                key: item,
                class: normalizeClass(item === props.row.level ? "last" : "")
              }, null, 8, ["class"]);
            }), 128)),
            createElementVNode("div", {
              class: normalizeClass(["group-icon", !unref(foldMap)[props.row.id] && "group-icon--expand"]),
              onClick: _cache[0] || (_cache[0] = withModifiers(($event) => unref(gridStore).groupModule.toggleFold(_ctx.row.id), ["stop"]))
            }, _hoisted_3$4, 2),
            createElementVNode("div", null, "分组-" + toDisplayString(props.row.name), 1)
          ], 4)
        ], 8, _hoisted_1$a)
      ], 512);
    };
  }
});
const _hoisted_1$9 = ["colspan"];
const _hoisted_2$7 = { class: "vtg-cell" };
const _sfc_main$b = /* @__PURE__ */ defineComponent({
  __name: "ExpandRow",
  props: {
    resizeObserver: { default: null },
    rowIndex: {},
    row: {}
  },
  setup(__props) {
    const gridStore = useGridStore();
    const { flattedColumns } = gridStore.columnModule;
    const expandCol = computed(() => flattedColumns.find((c) => c.type === "expand"));
    const props = __props;
    const { itemRefEl } = useObserverItem({ resizeObserver: props.resizeObserver });
    const getRenderRow = (row) => {
      var _a, _b;
      return (_b = (_a = expandCol.value) == null ? void 0 : _a.expandRender) == null ? void 0 : _b.call(_a, expandCol.value, row);
    };
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("tr", {
        ref_key: "itemRefEl",
        ref: itemRefEl,
        class: "vtg-tr"
      }, [
        createElementVNode("td", {
          class: "vtg-td vtg-td--expand",
          colspan: unref(flattedColumns).length
        }, [
          createElementVNode("div", _hoisted_2$7, [
            (openBlock(), createBlock(resolveDynamicComponent(getRenderRow(_ctx.row))))
          ])
        ], 8, _hoisted_1$9)
      ], 512);
    };
  }
});
const _hoisted_1$8 = ["width"];
const _hoisted_2$6 = ["width"];
const _hoisted_3$3 = ["width"];
const _hoisted_4$3 = {
  class: "vtg-body"
};
const _hoisted_5$1 = {
  key: 0,
  class: "vtg-mask"
};
const _hoisted_6 = /* @__PURE__ */ createElementVNode("p", null, "No Data", -1);
const _sfc_main$a = /* @__PURE__ */ defineComponent({
  __name: "VeriTable",
  props: {
    columns: {
      default: () => []
    },
    list: {
      default: () => []
    },
    options: {
      default: () => ({})
    }
  },
  setup(__props, {
    expose: __expose,
    emit: __emit
  }) {
    const emits = __emit;
    const props = __props;
    const gridStore = useGridStore(props);
    const isEmpty = computed(() => {
      var _a;
      return ((_a = gridStore.getState("groupConfig")) == null ? void 0 : _a.length) ? gridStore.groupModule.groupFoldConstructor(props.list, gridStore.getState("groupConfig")).length === 0 : props.list.length === 0;
    });
    watch$1(() => props.options.groupConfig, (nv) => {
      console.log("groupConfig", nv);
      if (!nv)
        return;
      const list = gridStore.groupModule.groupFoldConstructor(props.list, nv);
      gridStore.setStateValue("groupConfig", nv);
      console.log("groupConfig", list);
      gridStore.initDataList(list);
    }, {
      immediate: true,
      deep: true
    });
    watch$1(() => props.list, (nv) => {
      gridStore.initDataList(nv);
    }, {
      immediate: true
    });
    const {
      columnModule: {
        centerNormalColumns,
        leftFixedColumns,
        rightFixedColumns
      }
    } = gridStore;
    const emitFunction = {
      scroll: (evt) => {
        const {
          scrollLeft,
          scrollWidth,
          clientWidth
        } = evt.target;
        gridStore.columnModule.calcVisibleColumns(scrollLeft, clientWidth);
        gridStore.calcFixedShadow(scrollLeft, scrollWidth, clientWidth);
        clearResizeLine();
      },
      itemResize: (id, height) => {
        var _a;
        const lastHeight = (_a = gridStore.watchData.rowHeightMap.get(String(id))) != null ? _a : gridStore.virtualListProps.minSize;
        gridStore.watchData.rowHeightMap.set(String(id), Math.max(lastHeight, height));
      },
      toTop: () => {
      },
      toBottom: () => {
      }
    };
    const virtualListRef = useVirtList(gridStore.virtualListProps, emitFunction);
    gridStore.initVirtualListRef(virtualListRef);
    const {
      resizeObserver,
      reactiveData: vlReactiveData,
      slotSize,
      renderList: renderList$1,
      clientRefEl,
      stickyHeaderRefEl
    } = virtualListRef;
    const tableRefEl = ref$1();
    const rootRefEl = ref$1();
    const {
      onClick,
      onDblclick,
      onContextmenu,
      onMouseDown
    } = useContentEvent(gridStore);
    function getComponent(row) {
      switch (row.type) {
        case "group":
          return _sfc_main$c;
        case "expand":
          return _sfc_main$b;
        default:
          return BaseRow;
      }
    }
    const cls = computed(() => ({
      root: [gridStore.getState("border") ? "vtg-root--border" : ""],
      main: [gridStore.getState("highlightHoverRow") ? "vtg-client--highlight-hover-row" : "", gridStore.getState("highlightSelectRow") ? "vtg-client--highlight-select-row" : "", gridStore.getState("highlightSelectCol") ? "vtg-client--highlight-select-col" : "", gridStore.getState("highlightSelectCell") ? "vtg-client--highlight-select-cell" : ""],
      table: [gridStore.gridScrollingStatus.value],
      leftFixedShadow: ["vtg-fixed-shadow", gridStore.gridScrollingStatus.value !== "is-scrolling-left" && leftFixedColumns.length > 0 ? "vtg-fixed-shadow--left" : ""],
      rightFixedShadow: ["vtg-fixed-shadow", gridStore.gridScrollingStatus.value !== "is-scrolling-right" && rightFixedColumns.length > 0 ? "vtg-fixed-shadow--right" : ""]
    }));
    const fullWidth = computed(() => {
      return gridStore.columnModule.columnState.fullWidth;
    });
    const headerHeight = computed(() => slotSize.stickyHeaderSize);
    onMounted$1(() => {
      if (clientRefEl.value) {
        const {
          scrollLeft,
          scrollWidth,
          clientWidth
        } = clientRefEl.value;
        gridStore.columnModule.calcVisibleColumns(scrollLeft, clientWidth);
        gridStore.calcFixedShadow(scrollLeft, scrollWidth, clientWidth);
        gridStore.setClientEl(clientRefEl.value);
      }
      if (rootRefEl.value) {
        gridStore.interactionModule.initSelectionElement(rootRefEl.value);
        gridStore.setRootEl(rootRefEl.value);
      }
      if (tableRefEl.value) {
        gridStore.setTableEl(tableRefEl.value);
      }
      for (const key of Object.values({
        ...CellEventEnum,
        ...RowEventEnum,
        ...HeaderEventEnum,
        ...TableEventEnum
      })) {
        gridStore.eventEmitter.on(key, (data) => {
          emits(key, data);
        });
      }
    });
    onBeforeUnmount$1(() => {
      gridStore.eventEmitter.offAll();
    });
    __expose({
      /**
       * 滚动到指定索引的行
       * @param index 行索引
       */
      scrollToIndex: (index2) => {
        virtualListRef.scrollToIndex(index2);
      },
      /**
       * 滚动到指定行（使行可见）
       * @param index 行索引
       */
      scrollIntoView: (index2) => {
        virtualListRef.scrollIntoView(index2);
      },
      /**
       * 滚动到顶部
       */
      scrollToTop: () => {
        virtualListRef.scrollToTop();
      },
      /**
       * 滚动到底部
       */
      scrollToBottom: () => {
        virtualListRef.scrollToBottom();
      },
      /**
       * 滚动到指定偏移量
       * @param offset 偏移量（像素）
       */
      scrollToOffset: (offset) => {
        virtualListRef.scrollToOffset(offset);
      },
      /**
       * 获取 gridStore 实例
       */
      getGridStore: () => gridStore
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", {
        id: "vtg-root",
        class: normalizeClass(cls.value.root),
        ref_key: "rootRefEl",
        ref: rootRefEl
      }, [createElementVNode("div", {
        class: normalizeClass(["vtg-client", cls.value.main]),
        ref_key: "clientRefEl",
        ref: clientRefEl,
        "data-id": "client"
      }, [createElementVNode("div", {
        style: normalizeStyle(`float:left; height: ${unref(vlReactiveData).listTotalSize}px`)
      }, null, 4), createElementVNode("table", {
        id: "vtg-table",
        class: normalizeClass(cls.value.table),
        cellspacing: "0",
        cellpadding: "0",
        style: normalizeStyle(`width: ${fullWidth.value}px;`),
        ref_key: "tableRefEl",
        ref: tableRefEl,
        onClick: _cache[0] || (_cache[0] = //@ts-ignore
        (...args) => unref(onClick) && unref(onClick)(...args)),
        onDblclick: _cache[1] || (_cache[1] = //@ts-ignore
        (...args) => unref(onDblclick) && unref(onDblclick)(...args)),
        onContextmenu: _cache[2] || (_cache[2] = //@ts-ignore
        (...args) => unref(onContextmenu) && unref(onContextmenu)(...args)),
        onMousedown: _cache[3] || (_cache[3] = //@ts-ignore
        (...args) => unref(onMouseDown) && unref(onMouseDown)(...args))
      }, [(openBlock(), createElementBlock("colgroup", {
        key: unref(gridStore).watchData.renderKey
      }, [(openBlock(true), createElementBlock(Fragment, null, renderList(unref(leftFixedColumns), (column) => {
        return openBlock(), createElementBlock("col", {
          key: column._id,
          width: column.width
        }, null, 8, _hoisted_1$8);
      }), 128)), (openBlock(true), createElementBlock(Fragment, null, renderList(unref(centerNormalColumns), (column) => {
        return openBlock(), createElementBlock("col", {
          key: column._id,
          width: column.width
        }, null, 8, _hoisted_2$6);
      }), 128)), (openBlock(true), createElementBlock(Fragment, null, renderList(unref(rightFixedColumns), (column, index2) => {
        return openBlock(), createElementBlock("col", {
          key: column._id,
          width: column.width
        }, null, 8, _hoisted_3$3);
      }), 128))])), unref(gridStore).getState("showHeader") ? (openBlock(), createElementBlock("thead", {
        key: 0,
        ref_key: "stickyHeaderRefEl",
        ref: stickyHeaderRefEl,
        "data-id": "stickyHeader",
        class: "vtg-header",
        style: normalizeStyle(`height: ${headerHeight.value}px;`)
      }, [createVNode(_sfc_main$k)], 4)) : createCommentVNode("", true), createElementVNode("tbody", _hoisted_4$3, [createElementVNode("tr", {
        style: normalizeStyle(`height: ${unref(vlReactiveData).virtualSize}px;`)
      }, null, 4), (openBlock(true), createElementBlock(Fragment, null, renderList(unref(renderList$1), (row, index2) => {
        return openBlock(), createBlock(resolveDynamicComponent(getComponent(row)), {
          key: row.id,
          resizeObserver: unref(resizeObserver),
          row,
          rowIndex: index2 + unref(vlReactiveData).renderBegin,
          "data-id": row.id,
          "data-level": row.level
        }, null, 8, ["resizeObserver", "row", "rowIndex", "data-id", "data-level"]);
      }), 128))])], 38)], 2), createElementVNode("div", {
        class: normalizeClass(cls.value.leftFixedShadow),
        style: normalizeStyle({
          left: `${unref(gridStore).columnModule.columnState.fixedInfo.leftWidth || 0}px`
        })
      }, null, 6), createElementVNode("div", {
        class: normalizeClass(cls.value.rightFixedShadow),
        style: normalizeStyle({
          right: `${unref(gridStore).columnModule.columnState.fixedInfo.rightWidth + 16 || 0}px`
        })
      }, null, 6), isEmpty.value ? (openBlock(), createElementBlock("div", _hoisted_5$1, [renderSlot(_ctx.$slots, "empty", {}, () => [_hoisted_6])])) : createCommentVNode("", true)], 2);
    };
  }
});
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "GridTable",
  props: {
    list: {},
    rowKey: {},
    minRowHeight: {},
    defaultExpandAll: { type: Boolean },
    merges: {},
    selection: { type: Boolean },
    groupConfig: {},
    defaultSort: {},
    border: { type: Boolean },
    stripe: { type: Boolean },
    showTreeLine: { type: Boolean }
  },
  setup(__props, { expose: __expose }) {
    const props = __props;
    const slots = useSlots();
    const instance = getCurrentInstance();
    const options = computed(() => {
      const instanceAttrs = (instance == null ? void 0 : instance.attrs) || {};
      return {
        ...instanceAttrs,
        rowKey: props.rowKey,
        minRowHeight: props.minRowHeight,
        defaultExpandAll: props.defaultExpandAll,
        merges: props.merges,
        selection: props.selection,
        groupConfig: props.groupConfig,
        defaultSort: props.defaultSort,
        border: props.border,
        stripe: props.stripe,
        showTreeLine: props.showTreeLine
      };
    });
    function setupNode(node) {
      let dom = document.createElement("div");
      render(node, dom);
    }
    function isGridTableColumnNode(node) {
      return node.type.name === "GridTableColumn";
    }
    function initColumn(columnNode) {
      var _a, _b, _c;
      const field = columnNode.props.field;
      const baseProps = columnNode.props;
      Object.keys(baseProps).forEach((key) => {
        if (baseProps[key] === "")
          baseProps[key] = true;
      });
      setupNode(columnNode);
      if (!isGridTableColumnNode(columnNode)) {
        throw new Error("please use GridTableColumn");
      }
      const slots2 = (_b = (_a = columnNode.component) == null ? void 0 : _a.slots) != null ? _b : {};
      const columnConfig = {
        ...baseProps,
        field,
        headerRender: slots2.header ? (column) => {
          var _a2, _b2;
          return (_b2 = (_a2 = slots2.header) == null ? void 0 : _a2.call(slots2, { column })) == null ? void 0 : _b2[0];
        } : void 0
      };
      let children = [];
      if (slots2.default) {
        try {
          const createSafeMockRow = () => {
            const baseMock = {
              id: "",
              name: "",
              [field]: ""
            };
            const createProxy = (obj) => {
              return new Proxy(obj, {
                get(target, prop) {
                  if (prop in target) {
                    const value = target[prop];
                    if (value && typeof value === "object" && !Array.isArray(value)) {
                      return createProxy(value);
                    }
                    return value;
                  }
                  return "";
                }
              });
            };
            return createProxy(baseMock);
          };
          const mockRow = createSafeMockRow();
          const mockColumn = columnConfig;
          children = (_c = slots2.default({
            row: mockRow,
            column: mockColumn
          })) != null ? _c : [];
        } catch (error) {
          console.warn("Error while initializing column slot:", error);
          children = [];
        }
      }
      children.forEach((node) => {
        if (isGridTableColumnNode(node)) {
          if (!columnConfig.children)
            columnConfig.children = [];
          columnConfig.children.push(initColumn(node));
        }
      });
      const hasBodyRender = !columnConfig.children && !!slots2.default;
      if (hasBodyRender) {
        columnConfig.cellRender = (tdData) => {
          var _a2, _b2;
          return (_b2 = (_a2 = slots2.default) == null ? void 0 : _a2.call(slots2, tdData)) == null ? void 0 : _b2[0];
        };
      }
      if (slots2.cover) {
        columnConfig.cellCoverRender = (tdData) => {
          var _a2, _b2;
          return (_b2 = (_a2 = slots2.cover) == null ? void 0 : _a2.call(slots2, tdData)) == null ? void 0 : _b2[0];
        };
      }
      if (slots2.dropdown) {
        columnConfig.cellDropdownRender = (tdData) => {
          var _a2, _b2;
          return (_b2 = (_a2 = slots2.dropdown) == null ? void 0 : _a2.call(slots2, tdData)) == null ? void 0 : _b2[0];
        };
      }
      if (slots2.sortIcon && columnConfig.sort) {
        if (!columnConfig.sort.sortIcon) {
          columnConfig.sort.sortIcon = (data) => {
            var _a2, _b2;
            return (_b2 = (_a2 = slots2.sortIcon) == null ? void 0 : _a2.call(slots2, data)) == null ? void 0 : _b2[0];
          };
        }
      }
      return columnConfig;
    }
    const getColumns = () => {
      var _a, _b;
      let defaultNodes = (_b = (_a = slots.default) == null ? void 0 : _a.call(slots)) != null ? _b : [];
      const columnNodes = [];
      defaultNodes.forEach((node) => {
        if (isGridTableColumnNode(node))
          columnNodes.push(node);
        if (node.type === Fragment)
          columnNodes.push(...node.children.filter(isGridTableColumnNode));
      });
      return columnNodes.filter((node) => isGridTableColumnNode(node)).map((node) => {
        return initColumn(node);
      });
    };
    const columns = computed(getColumns);
    const gridRef = ref$1(null);
    __expose({
      /**
       * 滚动到指定索引的行
       * @param index 行索引
       */
      scrollToIndex: (index2) => {
        var _a;
        (_a = gridRef.value) == null ? void 0 : _a.scrollToIndex(index2);
      },
      /**
       * 滚动到指定行（使行可见）
       * @param index 行索引
       */
      scrollIntoView: (index2) => {
        var _a;
        (_a = gridRef.value) == null ? void 0 : _a.scrollIntoView(index2);
      },
      /**
       * 滚动到顶部
       */
      scrollToTop: () => {
        var _a;
        (_a = gridRef.value) == null ? void 0 : _a.scrollToTop();
      },
      /**
       * 滚动到底部
       */
      scrollToBottom: () => {
        var _a;
        (_a = gridRef.value) == null ? void 0 : _a.scrollToBottom();
      },
      /**
       * 滚动到指定偏移量
       * @param offset 偏移量（像素）
       */
      scrollToOffset: (offset) => {
        var _a;
        (_a = gridRef.value) == null ? void 0 : _a.scrollToOffset(offset);
      },
      /**
       * 获取 gridStore 实例
       */
      getGridStore: () => {
        var _a;
        return (_a = gridRef.value) == null ? void 0 : _a.getGridStore();
      }
    });
    return (_ctx, _cache) => {
      return openBlock(), createBlock(_sfc_main$a, {
        ref_key: "gridRef",
        ref: gridRef,
        columns: columns.value,
        list: _ctx.list,
        options: options.value
      }, {
        empty: withCtx(() => [
          renderSlot(_ctx.$slots, "empty")
        ]),
        _: 3
      }, 8, ["columns", "list", "options"]);
    };
  }
});
const __default__ = {
  name: "GridTableColumn"
};
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  ...__default__,
  props: {
    field: {},
    title: {},
    type: {},
    width: {},
    minWidth: {},
    maxWidth: {},
    resizable: { type: Boolean },
    fixed: {},
    align: {},
    headerAlign: {},
    verticalAlign: {},
    headerVerticalAlign: {},
    children: {},
    className: {},
    index: { type: Function },
    colIndex: {},
    ellipsis: { type: Boolean },
    sort: {},
    options: {},
    cellRender: { type: Function },
    cellCoverRender: { type: Function },
    cellDropdownRender: { type: Function },
    headerRender: { type: Function },
    expandRender: { type: Function }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return toDisplayString(_ctx.field);
    };
  }
});
const _hoisted_1$7 = {
  class: "vtg-cell vtg-cell__select-view"
};
const _hoisted_2$5 = {
  class: "vtg-cell__select-view-content"
};
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "SelectView",
  props: {
    column: {
      type: Object,
      default: () => ({})
    },
    row: {
      type: Object,
      default: () => ({})
    },
    tdData: {
      type: Object,
      default: () => ({})
    },
    height: {
      type: Number
    }
  },
  setup(__props) {
    const props = __props;
    const cellValue = computed(() => {
      const cellData = props.row[props.column.field];
      const cellDataValue = isObject(cellData) ? cellData.value : cellData;
      return cellDataValue == null ? void 0 : cellDataValue.split(",").map((key) => {
        var _a;
        return (_a = props.column.options) == null ? void 0 : _a.find((option) => option.key === key);
      }).filter((item) => item !== void 0);
    });
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$7, [createElementVNode("div", _hoisted_2$5, [(openBlock(true), createElementBlock(Fragment, null, renderList(cellValue.value, (item) => {
        return openBlock(), createElementBlock("div", {
          class: "tag-item",
          key: item.key,
          style: normalizeStyle(`background-color: ${item.bg};`)
        }, [createElementVNode("div", null, toDisplayString(item.value), 1)], 4);
      }), 128))])]);
    };
  }
});
const SelectView_vue_vue_type_style_index_0_lang = "";
const _hoisted_1$6 = {
  class: "vtg-cell vtg-cell__select-cover"
};
const _hoisted_2$4 = {
  class: "vtg-cell__select-cover-content"
};
const _hoisted_3$2 = ["onClick"];
const _hoisted_4$2 = /* @__PURE__ */ createElementVNode("svg", {
  t: "1730451935431",
  class: "icon",
  viewBox: "0 0 1024 1024",
  version: "1.1",
  xmlns: "http://www.w3.org/2000/svg",
  "p-id": "4267",
  width: "256",
  height: "256"
}, [/* @__PURE__ */ createElementVNode("path", {
  d: "M597.795527 511.488347 813.564755 295.718095c23.833825-23.833825 23.833825-62.47489 0.001023-86.307691-23.832801-23.832801-62.47489-23.833825-86.307691 0L511.487835 425.180656 295.717583 209.410404c-23.833825-23.833825-62.475913-23.833825-86.307691 0-23.832801 23.832801-23.833825 62.47489 0 86.308715l215.769228 215.769228L209.410915 727.258599c-23.833825 23.833825-23.833825 62.47489 0 86.307691 23.832801 23.833825 62.473867 23.833825 86.307691 0l215.768205-215.768205 215.769228 215.769228c23.834848 23.833825 62.475913 23.832801 86.308715 0 23.833825-23.833825 23.833825-62.47489 0-86.307691L597.795527 511.488347z",
  fill: "#272636",
  "p-id": "4268"
})], -1);
const _hoisted_5 = [_hoisted_4$2];
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "SelectCover",
  props: {
    column: {
      type: Object,
      default: () => ({})
    },
    row: {
      type: Object,
      default: () => ({})
    },
    tdData: {
      type: Object,
      default: () => ({})
    }
  },
  setup(__props) {
    const props = __props;
    const cellDataValue = computed(() => {
      const cellData = props.row[props.column.field];
      const cellDataValue2 = isObject(cellData) ? cellData.value : cellData;
      return cellDataValue2 ? cellDataValue2.split(",") : [];
    });
    const cellValue = computed(() => {
      return cellDataValue.value.map((key) => {
        var _a;
        return (_a = props.column.options) == null ? void 0 : _a.find((option) => option.key === key);
      }).filter((item) => item !== void 0);
    });
    function handleClose(key) {
      console.log(key);
    }
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$6, [createElementVNode("div", _hoisted_2$4, [(openBlock(true), createElementBlock(Fragment, null, renderList(cellValue.value, (item) => {
        return openBlock(), createElementBlock("div", {
          class: "tag-item",
          key: item.key,
          style: normalizeStyle(`background-color: ${item.bg};`)
        }, [createElementVNode("div", null, toDisplayString(item.value), 1), createElementVNode("div", {
          class: "tag-close",
          onClick: withModifiers(($event) => handleClose(item.key), ["stop"])
        }, _hoisted_5, 8, _hoisted_3$2)], 4);
      }), 128))])]);
    };
  }
});
const SelectCover_vue_vue_type_style_index_0_lang = "";
const _hoisted_1$5 = {
  class: "vtg-cell__select-dropdown"
};
const _hoisted_2$3 = /* @__PURE__ */ createStaticVNode('<div class="divider"></div><div class="options"><div class="options-item">哈哈哈</div><div class="options-item">嘻嘻嘻</div><div class="options-item">恩恩嗯</div></div>', 2);
const _hoisted_4$1 = [_hoisted_2$3];
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "SelectDropdown",
  props: {
    column: {
      type: Object,
      default: () => ({})
    },
    row: {
      type: Object,
      default: () => ({})
    },
    tdData: {
      type: Object,
      default: () => ({})
    }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$5, _hoisted_4$1);
    };
  }
});
const SelectDropdown_vue_vue_type_style_index_0_lang = "";
const DateView_vue_vue_type_style_index_0_lang = "";
const _sfc_main$4 = {};
const _hoisted_1$4 = { class: "vtg-cell vtg-cell__date" };
function _sfc_render$2(_ctx, _cache) {
  return openBlock(), createElementBlock("div", _hoisted_1$4, "2024/09/25");
}
const DateView = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$2]]);
const _hoisted_1$3 = {
  class: "vtg-popper-cell vtg-cell__date-cover"
};
const _hoisted_2$2 = /* @__PURE__ */ createElementVNode("div", {
  class: "vtg-cell__date-cover-content"
}, [/* @__PURE__ */ createElementVNode("input", {
  type: "text",
  value: "2024/09/25"
})], -1);
const _hoisted_3$1 = [_hoisted_2$2];
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "DateCover",
  props: {
    column: {
      type: Object,
      default: () => ({})
    },
    row: {
      type: Object,
      default: () => ({})
    },
    tdData: {
      type: Object,
      default: () => ({})
    }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$3, _hoisted_3$1);
    };
  }
});
const DateCover_vue_vue_type_style_index_0_lang = "";
const _hoisted_1$2 = {
  class: "vtg-cell__date-dropdown"
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "DateDropdown",
  props: {
    column: {
      type: Object,
      default: () => ({})
    },
    row: {
      type: Object,
      default: () => ({})
    },
    tdData: {
      type: Object,
      default: () => ({})
    }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$2, "时间选择器");
    };
  }
});
const DateDropdown_vue_vue_type_style_index_0_lang = "";
const LinkView_vue_vue_type_style_index_0_lang = "";
const _sfc_main$1 = {};
const _hoisted_1$1 = { class: "vtg-cell vtg-cell__link" };
const _hoisted_2$1 = /* @__PURE__ */ createElementVNode("a", {
  href: "https://github.com/kolarorz/vtg",
  target: "_blank"
}, "虚拟表格", -1);
const _hoisted_3 = [
  _hoisted_2$1
];
function _sfc_render$1(_ctx, _cache) {
  return openBlock(), createElementBlock("div", _hoisted_1$1, _hoisted_3);
}
const LinkView = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["render", _sfc_render$1]]);
const PersonView_vue_vue_type_style_index_0_lang = "";
const _sfc_main = {};
const _hoisted_1 = { class: "vtg-cell vtg-cell__person" };
const _hoisted_2 = /* @__PURE__ */ createStaticVNode('<div class="vtg-cell__person-item"><div class="vtg-cell__person-avatar"></div><div class="vtg-cell__person-name">Keno</div></div><div class="vtg-cell__person-item"><div class="vtg-cell__person-avatar"></div><div class="vtg-cell__person-name">Keno</div></div>', 2);
const _hoisted_4 = [
  _hoisted_2
];
function _sfc_render(_ctx, _cache) {
  return openBlock(), createElementBlock("div", _hoisted_1, _hoisted_4);
}
const PersonView = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export {
  CellEventEnum,
  CellType,
  _sfc_main$3 as DateCover,
  _sfc_main$2 as DateDropdown,
  DateView,
  _sfc_main$a as Grid,
  _sfc_main$9 as GridTable,
  _sfc_main$8 as GridTableColumn,
  HeaderEventEnum,
  LinkView,
  PersonView,
  RowEventEnum,
  _sfc_main$6 as SelectCover,
  _sfc_main$5 as SelectDropdown,
  _sfc_main$7 as SelectView,
  TableEventEnum
};
//# sourceMappingURL=index.js.map
