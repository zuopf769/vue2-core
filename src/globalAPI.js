import { mergeOptions } from "./utils";

export function initGlobalAPI(Vue) {
  // Vue的静态属性
  Vue.options = {
    _base: Vue, // 存储Vue构造函数，方便在其他地方去
  };

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

  // Vue的静态方法，生成一个组件并且对组件进行初始化
  // 可以手动创建组件并挂载
  Vue.extend = function (options) {
    // 根据用户的参数最终返回一个构造函数，当做一个组件来使用，可以new一个实例
    function Sub(options = {}) {
      // this是Sub的实例，Sub的实例上没有_init方法，但是沿着原型链找能找到
      // 调用Vue上的初始化方法，默认对子类进行初始化操作
      this._init(options);
    }

    // 通过Sub的prototype能找到Vue的prototype
    // Sub.prototype.__proto__ == Vue.prototype；但是需要注意下面的constructor的指向问题
    Sub.prototype = Object.create(Vue.prototype);
    // 把 Sub.prototype.constructor从Vue指回到Sub
    Sub.prototype.constructor = Sub;
    // 保存用户传递的options
    // 希望将用户传递的参数和全局的Vue.options合并
    Sub.options = mergeOptions(Vue.options, options);

    return Sub;
  };

  // 全局组件；类比全局指令Vue.options.directives = {};
  Vue.options.components = {};
  Vue.component = function (id, definition) {
    // 如果definition是函数，说明已经用Vue.extend包装过了，某则需要包装下
    definition =
      typeof definition === "function" ? definition : Vue.extend(definition);
    // 在全局上标识组件
    Vue.options.components[id] = definition;

    console.log(Vue.options.components);
  };
}
