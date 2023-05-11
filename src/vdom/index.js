// 创建元素的虚拟节点
//  _h() _c()方法
export function createElementVNode(vm, tag, data, ...children) {
  if (data == null) {
    data = {};
  }
  // react是叫props；vue里是data
  let key = data.key;
  if (key) {
    delete data.key;
  }
  return vnode(vm, tag, data, key, children);
}

// 创建文本的虚拟节点
// _v()
export function createTextVNode(vm, text) {
  return vnode(vm, undefined, undefined, undefined, undefined, text);
}

// 虚拟节点vnode
// key很重要dom diff
function vnode(vm, tag, data, key, children, text) {
  // vnode上维护了vm属性
  return {
    vm,
    tag,
    data,
    key,
    children,
    text,
  };
}

// AST和VDom一样么?
// 区别一：描述的范围不一样
// VDOM和AST很像，但是他描述的信息更多
// AST可以描述 js css html；描述语言本身 https://astexplorer.net/
// VDOM只能描述dom
// 区别二：是否可以增加一些属性
// AST是语法层面的转化，描述的是语法本身，不可以增加一些属性，原本有什么就转换什么
// VDom是描述DOM的元素，可以增加一些自定义属性，例如事件、指令、插槽
