import Watcher from "./observe/watcher";
import { createElementVNode, createTextVNode } from "./vdom";

function createElm(vnode) {
  let { tag, children, key, data, text } = vnode;
  // 根据标签名tag来创建原生元素
  // 标签
  if (typeof tag === "string") {
    // 虚拟节点上挂真实DOM节点
    // 这里将虚拟DOM节点和真实DOM节点对应起来，后续如果修改属性了，可以找到真实DOM
    vnode.el = document.createElement(tag);
    updateProperties(vnode);
    // 处理儿子
    children.forEach((child) => {
      // 儿子需要append到当前的el中
      return vnode.el.appendChild(createElm(child));
    });
  } else {
    vnode.el = document.createTextNode(text);
  }
  return vnode.el;
}

function updateProperties(vnode) {
  let newProps = vnode.data || {}; // 获取当前老节点中的属性
  let el = vnode.el; // 当前的真实节点
  for (let key in newProps) {
    if (key === "style") {
      for (let styleName in newProps.style) {
        el.style[styleName] = newProps.style[styleName];
      }
    } else if (key === "class") {
      el.className = newProps.class;
    } else {
      // 给这个元素添加属性 值就是对应的值
      el.setAttribute(key, newProps[key]);
    }
  }
}

function patch(oldVnode, vnode) {
  // oldVnodes是el，原生DOM就是首次渲染
  const isRealElement = oldVnode.nodeType;
  if (isRealElement) {
    // 首次渲染
    // 获取真实DOM
    const oldElm = oldVnode;
    // 获取真实DOM的父容器
    const parentElm = oldElm.parentNode;

    let el = createElm(vnode);

    // 先把新的节点插入到老节点的下面
    parentElm.insertBefore(el, oldElm.nextSibling);
    // 再删除老节点
    parentElm.removeChild(oldVnode);

    return el;
  } else {
    // DOM DIFF
  }
}

export function initLifeCycle(Vue) {
  // 把_render函数生成的虚拟DOM，生成真实DOM
  Vue.prototype._update = function (vnode) {
    // console.log("_update", vnode);
    const vm = this;
    const el = vm.$el;

    // console.log("el", el);

    // patch既有初始化的功能，又有更新的功能
    vm.$el = patch(el, vnode);
  };

  // 生成虚拟DOM
  Vue.prototype._render = function () {
    // console.log("_render");
    let vm = this;
    // 渲染的时候会从实例vm上取值，我们就将属性和视图绑定在了一起
    // 为什么要call?希望render函数里面的with的this指向vm
    // 为啥要指向vm?因为vm上有name，有age
    // console.log(vm.age, vm.name);
    // let render = `with(this){return ${code}}`;
    let vnode = vm.$options.render.call(vm); // 通过ast语法转以后生成的render函数
    return vnode;
  };

  // 创建文本
  //  _v(text),
  Vue.prototype._v = function (text) {
    return createTextVNode(this, text);
  };

  // 创建元素
  // _c('div', {}, ...children)
  Vue.prototype._c = function () {
    return createElementVNode(this, ...arguments);
  };

  // 把传入的值val转成字符串
  Vue.prototype._s = function (val) {
    return val == null
      ? ""
      : typeof val === "object"
      ? JSON.stringify(val)
      : val;
  };
}

export function mountComponent(vm, el) {
  vm.$el = el;
  // 1. 调用render方法，生成虚拟DOM
  // 2. 根据虚拟DOM，生成真实DOM

  // vm._update(vm._render()); // vm.$options.render();

  // 更新根组件
  const updateComponent = function () {
    vm._update(vm._render());
  };

  // 首次渲染的时候会收集依赖
  // 更新的时候会再次收集
  // updateComponent会立即执行
  let watcher = new Watcher(vm, updateComponent, true); // true标识一个渲染watcher
  // console.log(watcher);

  // 2. 根据虚拟DOM，生成真实DOM

  // 3. 把真实DOM插入到el元素中
}

// vue的核心：
// 1）创建响应式数据
// 2）模板转换成ast语法树
// 3）将ast语法树转换成render函数, 调用render方法，生成虚拟DOM
// 4）后续每次数据更新，只需要执行render函数，无需再次执行ast转换的过程

// render函数会产生虚拟DOM(使用响应式数据)
// 根据虚拟DOM，生成真实DOM

// 调用钩子函数
export function callHook(vm, hook) {
  const handlers = vm.$options[hook];
  if (handlers) {
    handlers.forEach((handler) => handler.call(vm));
  }
}
