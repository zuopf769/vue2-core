import { mergeOptions } from "./utils";

export function initGlobalAPI(Vue) {
  // Vue的静态属性
  Vue.options = {};

  // Vue的静态方法，把选项合并到了Vue.options上
  Vue.mixin = function (mixin) {
    // this是谁？
    // 我们期望将用户的选项mixin和全局的Vue.options按照一定的策略合并
    // 第一次 全局空对象{} 和 用户传的{created: function(){}}合并 => {created: [fn]}
    // 第二次 第一次合并的结果{created: [fn]} 和 用户传的{created: function(){}}合并  => {created: [fn, fn]}
    this.options = mergeOptions(this.options, mixin);
    // 为了链式调用
    return this;
  };
}
