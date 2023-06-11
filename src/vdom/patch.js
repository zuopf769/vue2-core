import { isSameVnode } from "./index";

// 把虚拟DOM转换成真实DOM
export function createElm(vnode) {
  let { tag, children, key, data, text } = vnode;
  // 根据标签名tag来创建原生元素
  // 标签
  if (typeof tag === "string") {
    // 虚拟节点上挂真实DOM节点
    // 这里将虚拟DOM节点和真实DOM节点对应起来，后续如果修改属性了，可以找到真实DOM
    vnode.el = document.createElement(tag);
    // 没有老的props
    patchProps(vnode.el, {}, data);
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

// 比较props
// el 当前的真实节点
// oldProps 老的属性
// newProps 新的属性
// 1. 老的有新的没有，就需要删掉老的
// 2. 老的没有新的有，就需要追加
// 3. 老的有新的也有，就替换成新的属性值
export function patchProps(el, oldProps, newProps = {}) {
  // 1. 老的有新的没有，就需要删掉老的
  // 属性 <div a=1
  for (let key in oldProps) {
    if (!newProps[key]) {
      el.removeAttribute(key);
    }
  }
  // 1. 老的有新的没有，就需要删掉老的
  // style属性 <div a=1 style="color: red;"
  let oldStyle = oldProps.style;
  let newStyle = newProps.style;
  for (let key in oldStyle) {
    if (!newStyle[key]) {
      el.style[key] = "";
    }
  }

  // 2. 无论如何都要用新的覆盖掉老的；但是需要老的有新的没有的需要删掉，就是上面的逻辑
  // 老的没有新的有，就需要追加
  // 老的有新的也有，就替换成新的属性值
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

// 首次渲染和DOM DIFF
export function patch(oldVnode, vnode) {
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
    // 1. 两个节点不是同一个节点就直接删除老的换上新的(没有对比了)
    // 2. 两个节点是同一个节点(判断节点tag和key) 比较两个节点的属性是否有差异（复用老的节点，将差异的属性更新）
    // 3. 节点比较完毕就要比较两人的儿子
    return patchVnode(oldVnode, vnode);
  }
}

function patchVnode(oldVnode, vnode) {
  // tag === tag && key === key
  if (!isSameVnode(oldVnode, vnode)) {
    let el = createElm(vnode);
    // 老节点的父亲替换自己的儿子为新的节点
    oldVnode.el.parentNode.replaceChild(el, oldVnode.el);
    return el;
  }

  // 文本节点的tag和key都是undefined；undefined === undefined
  // 文本节点：需要比较下文本的内容
  // 复用老的文本节点的元素
  let el = (vnode.el = oldVnode.el);
  if (!oldVnode.tag) {
    if (oldVnode.text !== vnode.text) {
      // 用新的文本替换掉老的文本
      oldVnode.el.textContent = vnode.text;
    }
  }

  // 是标签 同一个标签需要比对标签的属性
  patchProps(el, oldVnode.data, vnode.data);

  // 比较儿子节点 比较的时候
  // 1. 一方有儿子一方没有儿子 老的有新的没有就把老的儿子节点全都删掉；老的没有新的有就需要把新的儿子都追加到老的里面
  // 2. 两方都有儿子

  let oldChildren = oldVnode.children || [];
  let newChildren = vnode.children || [];

  if (oldChildren.length > 0 && newChildren.length > 0) {
    // 完整的diff算法，需要比较两人的儿子
    updateChildren(el, oldChildren, newChildren);
  } else if (oldChildren.length === 0 && newChildren.length > 0) {
    // 没有老的，有新的的；用新的append到el里面
    mountChildren(el, newChildren);
  } else if (oldChildren.length > 0 && newChildren.length === 0) {
    // 老的有，新的没有；就删掉老的
    // innerHTML清空孩子，也可以循环删除
    // 源码中还需要考虑组件的情况，需要销毁组件
    el.innerHTML = "";
  }

  return el;
}

function mountChildren(el, newChildren) {
  for (let i = 0; i < newChildren.length; i++) {
    el.appendChild(createElm(newChildren[i]));
  }
}

function updateChildren(el, oldChildren, newChildren) {
  // 比较新旧老儿子，为了增高性能，我们会有一些优化手段；不要从新的拿出来一个和老的挨个比
  // 我们操作列表经常是 push pop shift unshift reverse sort等这些方法
  // 我们需要针对这些场景做些优化： 不是在表头就是表尾操作，最差的是 reverse sort
  // vue2采用的是双指针的方式，比较两个节点
  // console.log(oldChildren, newChildren);

  let oldStartIndex = 0;
  let newStartIndex = 0;
  let oldEndIndex = oldChildren.length - 1;
  let newEndIndex = newChildren.length - 1;

  let oldStartVnode = oldChildren[0];
  let newStartVnode = newChildren[0];
  let oldEndVnode = oldChildren[oldEndIndex];
  let newEndVnode = newChildren[newEndIndex];
  // console.log(oldStartVnode, oldEndVnode);

  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    // 只要双方有一方头指针大于尾部指针则退出循环
    // 只要有一方不满足条件就退出
  }
}
