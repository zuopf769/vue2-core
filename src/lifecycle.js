export function initLifeCycle(Vue) {
  // 生成真实DOM
  Vue.prototype._update = function () {
    console.log("_update");
  };
  // 生成虚拟DOM
  Vue.prototype._render = function () {
    console.log("_render");
  };
}

export function mountComponent(vm, el) {
  // 1. 调用render方法，生成虚拟DOM
  // 2. 根据虚拟DOM，生成真实DOM
  vm._update(vm._render()); // vm.$options.render();

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
