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
export function patchProps(el, oldProps = {}, newProps = {}) {
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

  function makeIndexByKey(children) {
    // 键值为key，值为索引
    let map = {};
    children.forEach((item, index) => {
      map[item.key] = index;
    });
    return map;
  }
  // 将oldChildren转换成map映射表
  // 对所有的孩子元素进行编号
  let map = makeIndexByKey(oldChildren);

  // 面试题：循环的时候为什么加key? 给动态列表添加key的时候劲量不要写index,因为索引前后都是以0开始，可能会发生错误复用
  // &&有任何一个不满足则停止 ||有一个尾true就继续
  while (oldStartIndex <= oldEndIndex && newStartIndex <= newEndIndex) {
    // 只要双方有一方头指针大于尾部指针则退出循环
    // 只要有一方不满足条件就退出

    // 在乱序比对中如果老的某个节点被标识为了undefined，则老的开始和结束节点在往后往前移动的过程中需要跳过
    // 遇到undefined就跳过，最后会删除
    if (!oldStartVnode) {
      oldStartVnode = oldChildren[++oldStartIndex];
    } else if (!oldEndVnode) {
      oldEndVnode = oldChildren[--oldEndIndex];
    }

    // 比较开头节点 头头比对
    if (isSameVnode(oldStartVnode, newStartVnode)) {
      // 如果是相同节点，则递归比较子节点
      // 递归比较子节点
      patchVnode(oldStartVnode, newStartVnode);
      // 然后新旧头部指针后移一位
      oldStartVnode = oldChildren[++oldStartIndex];
      newStartVnode = newChildren[++newStartIndex];
    } else if (isSameVnode(oldEndVnode, newEndVnode)) {
      // 开头节点不相等就比较结尾节点 尾尾比较
      // 比较结尾节点 尾尾比对
      // 如果是相同节点，则递归比较子节点
      patchVnode(oldEndVnode, newEndVnode);
      // 然后新旧尾部指针前移一位
      oldEndVnode = oldChildren[--oldEndIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else if (isSameVnode(oldEndVnode, newStartVnode)) {
      // 交叉比对： 头头不一样，尾尾不一样，就老头和新尾比，老尾和新头

      // 尾移头

      // abcd => dabc 尾部要移动到头部
      // diff-7.jpeg

      // 如果是相同节点，则递归比较子节点
      patchVnode(oldEndVnode, newStartVnode);
      // 复用老的节点： 把老的最后一个节点移动到老的开始节点的前面；把尾移动到了头部
      // insertBefore具有移动性，会将原来的元素移动走
      // 先移动元素在移动指针
      el.insertBefore(oldEndVnode.el, oldStartVnode.el);
      // 然后旧的尾部指针前移
      oldEndVnode = oldChildren[--oldEndIndex];
      // 然后新的头部指针后移
      newStartVnode = newChildren[++newStartIndex];
    } else if (isSameVnode(oldStartVnode, newEndVnode)) {
      // 交叉比对： 头头不一样，尾尾不一样，就老头和新尾比，老尾和新头

      // 头移尾

      // abcd => bcda  头部移动到头尾部
      // diff-8.jpeg

      // 如果是相同节点，则递归比较子节点
      patchVnode(oldStartVnode, newEndVnode);
      // 复用老的节点： 把老的第一个节点移动到老的结束节点的下一个节点（null）后面；把头移动到了尾部
      // oldEndVnode.el.nextSibling是null
      // insertBefore具有移动性，会将原来的元素移动走
      // insertBefore当第二个参数是null的时候相当于appendChild
      el.insertBefore(oldStartVnode.el, oldEndVnode.el.nextSibling);
      oldStartVnode = oldChildren[++oldStartIndex];
      newEndVnode = newChildren[--newEndIndex];
    } else {
      // 乱序比对（头头、尾尾、头尾、尾头都比对不上）：这就优化不了了，肯定需要映射
      // diff-11.jpeg
      // 算法思路：
      // 根据老的children做一个映射表；
      // 用新的去找，找到则移动，并打个标识标识要删除（undefined）（不能删除，否则会导致数组塌陷）
      // 找不到则创建新的添加并插入到头指针的前面（一直都是插入到头指针的前面）；
      // 最后多余的就删除

      // 用新的元素去老的中进行查找，如果找到则移动，找不到则直接插入
      // 老的映射里面有我要移动的索引
      let moveIndex = map[newStartVnode.key];
      // 有的话做移动操作
      if (moveIndex !== undefined) {
        // 找到对应的虚拟节点复用
        let moveVnode = oldChildren[moveIndex];
        // 移动都是移动到老节点的开始节点的前面
        el.insertBefore(moveVnode.el, oldStartVnode.el);
        // 标识为undefined，表示这个节点已经移动走了，不能删除，否则会导致数组塌陷，因为循环的过程中删除会影响原本的数组长度
        oldChildren[moveIndex] = undefined;
        // 比较属性和递归比较子节点
        patchVnode(moveVnode, newStartVnode);
      } else {
        // 老的中没有则创建一个新元素并插入到老节点的前面
        el.insertBefore(createElm(newStartVnode), oldStartVnode.el);
      }
      // 新节点的开始节点向后移动
      newStartVnode = newChildren[++newStartIndex];
    }
  }

  // 退出上面循环： 有一方已经越界，有一方已经比较完毕
  // diff-2.jpeg（新的后面多几个节点）和diff-4.jpeg（新的前面多几个节点） 都会走到这里
  // diff-2.jpeg 如果老的节点oldStartIndex已经越界了，新的后面还有几个节点就插进去后面；比完后新的后面有多余的就插入到后面
  // diff-4.jpeg 如果老的节点的oldEndIndex已经越界了，新的前面还有几个节点就插入到前面；比完后新的前面有多余的就插入到前面
  if (newStartIndex <= newEndIndex) {
    // newStartIndex和newEndIndex之间可能有一个节点，也可能多个节点
    for (let i = newStartIndex; i <= newEndIndex; i++) {
      // 这里可能是向后追加也可能是向前追加

      let childEl = createElm(newChildren[i]);

      /*
      if (newChildren[++newEndIndex]) {
        // diff-4.jpeg
        // 头部插入，尾指针挪到了前面
        el.insertBefore(childEl, newChildren[++newEndIndex].el);
      } else {
        // diff-2.jpeg
        // 尾部插入，因为尾指针后面已经没有元素了
        el.appendChild(createElm(newChildren[i]));
      }
      */

      // 上面的简单写法
      // 参照物
      let anchor = newChildren[newEndIndex + 1]
        ? newChildren[newEndIndex + 1].el
        : null;
      // anchor为null的时候则认为会是appendChild
      el.insertBefore(childEl, anchor);
    }
  }

  // diff-3.jpeg 如果新的已经越界，老的后面还剩几个就都删除
  // 老的多了，老的有剩余
  // 退出上面循环： 有一方已经比较完毕-新的比较完毕，老的有剩余
  // 乱序比对的删除也会走到这里
  // 如果有剩余则直接删除
  if (oldStartIndex <= oldEndIndex) {
    for (let i = oldStartIndex; i <= oldEndIndex; i++) {
      // 虚拟节点上维护着el
      let child = oldChildren[i];
      // 因为可能在乱序比对的过程中标识成了undefined
      if (child != undefined) {
        // 虚拟节点上维护着el
        parent.removeChild(child.el);
      }
    }
  }
}
