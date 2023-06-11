import { compileToFunctions } from "./compiler";
import { initGlobalAPI } from "./globalAPI";
import { initMixin } from "./init";
import { initLifeCycle } from "./lifecycle";
import { initSateMixin } from "./state";
import { createElm, patch } from "./vdom/patch";

// 将所有的方法都耦合在一起
function Vue(options) {
  // options就是用户的选项
  this._init(options);
}

initMixin(Vue); // 扩展了_init方法
initLifeCycle(Vue); // 扩展了生命周期方法 vm._update vm._render方法
initGlobalAPI(Vue); // 全局api的实现
initSateMixin(Vue); // 实现了$nextTick和$watch方法

// ------------为了方便观察前后的虚拟节点--测试的

// 1 新后面追加
// let render1 = compileToFunctions(
//   `<ul a="1" style="color: red;">
//     <li key="A">A</li>
//     <li key="B">B</li>
//     <li key="C">C</li>
//   </ul>`
// );

// 2 老的删除
// let render1 = compileToFunctions(
//   `<ul a="1" style="color: red;">
//     <li key="A">A</li>
//     <li key="B">B</li>
//     <li key="C">C</li>
//     <li key="D">D</li>
//     <li key="E">E</li>
//   </ul>`
// );

// 3 在前面追加
// let render1 = compileToFunctions(
//   `<ul a="1" style="color: red;">
//     <li key="A">A</li>
//     <li key="B">B</li>
//     <li key="C">C</li>
//   </ul>`
// );

// 4
let render1 = compileToFunctions(
  `<ul a="1" style="color: red;">
    <li key="D">D</li>
    <li key="A">A</li>
    <li key="B">B</li>
    <li key="C">C</li>
  </ul>`
);

let vm1 = new Vue({ data: { name: "zuopf1" } });
let preVnode = render1.call(vm1);

let el = createElm(preVnode);
document.body.appendChild(el);

// console.log("preVnode", preVnode);

// 1
// let render2 = compileToFunctions(
//   `<ul style="color: yellow;background:blue">
//     <li key="A">A</li>
//     <li key="B">B</li>
//     <li key="C">C</li>
//     <li key="D">D</li>
//     <li key="E">E</li>
//   </ul>`
// );

// 2
// let render2 = compileToFunctions(
//   `<ul style="color: yellow;background:blue">
//     <li key="A">A</li>
//     <li key="B">B</li>
//     <li key="C">C</li>
//   </ul>`
// );

// 3
// let render2 = compileToFunctions(
//   `<ul style="color: yellow;background:blue">
//     <li key="D">D</li>
//     <li key="A">A</li>
//     <li key="B">B</li>
//     <li key="C">C</li>
//   </ul>`
// );

let render2 = compileToFunctions(
  `<ul style="color: yellow;background:blue">
    <li key="A">A</li>
    <li key="B">B</li>
    <li key="C">C</li>
  </ul>`
);
let vm2 = new Vue({ data: { name: "zuopf2" } });
let nextVnode = render2.call(vm2);
// console.log("nextVnode", nextVnode);

// let newEl = createElm(nextVnode);
// el.parentNode.replaceChild(newEl.el);

// 直接更新: 直接用新的节点替换了老的节点
// 直接替换的性能问题: console.log(dir(dom)) dom节点上有很多属性；获取dom并不消耗性能，重要的是
// DOM Diff: 不是直接替换，而是比较两个人的区别之后再替换
// Diff算法的思想：diff算法是一个平级比较的过程，父亲和父亲比，儿子和儿子比对
setTimeout(() => {
  // let newel = createElm(nextVnode);
  // el.parentNode.replaceChild(newel, el);
  // DOM Diff
  patch(preVnode, nextVnode);
}, 1000);

export default Vue;
