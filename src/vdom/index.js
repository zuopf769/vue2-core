// 创建元素的虚拟节点
//  _h() _c()方法

// 判断是否是原生的html 元素标签
// 模板编译过程中都是标签，my-button也是一个字符串，如何才能区分是h5内置的标签还是用户自定义组件标签名？
const isReservedTag = (tag) => {
  return ["a", "div", "p", "button", "ul", "li", "span"].includes(tag);
};

export function createElementVNode(vm, tag, data, ...children) {
  if (data == null) {
    data = {};
  }
  // react是叫props；vue里是data
  let key = data.key;
  if (key) {
    delete data.key;
  }
  if (isReservedTag(tag)) {
    // 创建一个原生的H5标签的虚拟DOM
    return vnode(vm, tag, data, key, children);
  } else {
    // 创建一个自定义组件的虚拟DOM

    // Ctor就是组件的定义：可能是一个Sub类，还有可能是组件的obj类型{template: '<div>xxxx</div>'}
    let Ctor = vm.$options.components[tag];

    return createComponentVNode(vm, tag, data, key, children, Ctor);
  }
}

// 创建组件的虚拟节点
export function createComponentVNode(vm, tag, data, key, children, Ctor) {
  // 对象类型{template: '<div>xxxx</div>'需要调用Vue.extend()方法
  // 那么问题来了？咋么样才能拿到Vue呢？
  if (typeof Ctor === "object") {
    // console.log(vm.$options._base);
    // vm.$options._base上维护着Vue
    Ctor = vm.$options._base.extend(Ctor);
  }

  data.hook = {
    init() {
      // 稍后创建真实节点的时候，如果是组件则调用此init方法
    },
  };

  return vnode(vm, tag, data, key, children, null, { Ctor });
}

// 创建文本的虚拟节点
// _v()
export function createTextVNode(vm, text) {
  return vnode(vm, undefined, undefined, undefined, undefined, text);
}

// 虚拟节点vnode
// key很重要dom diff
function vnode(vm, tag, data, key, children, text, componentOptions) {
  // vnode上维护了vm属性
  return {
    vm,
    tag,
    data,
    key,
    children,
    text,
    componentOptions, // 组件的构造函数
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

export function isSameVnode(vnode1, vnode2) {
  return vnode1.tag === vnode2.tag && vnode1.key === vnode2.key;
}
