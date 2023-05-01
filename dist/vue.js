(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

    function initState(vm) {
      var opts = vm.$options; // 获取所有的选项

      if (opts.data) {
        initData(vm);
      }
    }
    function initData(vm) {
      var data = vm.$options.data; // data可能是函数和对象

      // 根组件可以是function也可以对象，组件必须是函数
      data = typeof data === 'function' ? data.call(vm) : data;
      console.log(data);
    }

    function initMixin(Vue) {
      // 通过原型prototype给Vue增加init方法
      Vue.prototype._init = function (options) {
        // 用于初始化操作
        // vue vm.$options就是获取用户的配置

        // 我们使用vue的时候，$nextTick, $data, $attr...以$开头的都表示Vue的内置属性
        var vm = this;
        vm.$options = options; // 将用户的选项挂载到实例上

        // 初始化状态
        initState(vm);
      };
    }

    // 将所有的方法都耦合在一起
    function Vue(options) {
      // options就是用户的选项
      this._init(options);
    }
    initMixin(Vue); // 扩展了_init方法

    return Vue;

}));
//# sourceMappingURL=vue.js.map
