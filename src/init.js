import { initState } from "./state";

export function initMixin(Vue) {
  // 通过原型prototype给Vue增加init方法
  Vue.prototype._init = function (options) {
    // 用于初始化操作
    // vue vm.$options就是获取用户的配置

    // 我们使用vue的时候，$nextTick, $data, $attr...以$开头的都表示Vue的内置属性
    const vm = this;
    vm.$options = options; // 将用户的选项挂载到实例上

    // 初始化状态
    initState(vm);
  };
}
