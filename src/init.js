import { initState } from "./state";
import { compileToFunctions } from "./compiler";
import { callHook, mountComponent } from "./lifecycle";
import { mergeOptions } from "./utils";

export function initMixin(Vue) {
  // 通过原型prototype给Vue增加init方法
  Vue.prototype._init = function (options) {
    // 用于初始化操作
    // vue vm.$options就是获取用户的配置

    // 我们使用vue的时候，$nextTick, $data, $attr...以$开头的都表示Vue的内置属性
    const vm = this;

    // 用全局options(Vue.options)和用户的options来合并merge
    // 我们定义的全局指令和过滤器等等都会挂载到实例上
    vm.$options = mergeOptions(this.constructor.options, options); // 将用户的选项挂载到实例上

    // 在initState之前调用beforeCreate
    callHook(vm, "beforeCreate");

    // 初始化状态；初始化计算属性；初始化watch
    initState(vm);

    // 在initState之后调用created
    callHook(vm, "created");

    if (options.el) {
      vm.$mount(options.el); // 实现数据的挂载
    }
  };

  // 挂载应用
  Vue.prototype.$mount = function (el) {
    const vm = this;
    const options = vm.$options;
    el = document.querySelector(el);

    // 整体思想：不一定非得有render函数，没有render函数就用template编译成render函数
    // 先查找有没有render函数
    if (!options.render) {
      // 没有render函数的话，再看下是否写了template，写了template就用写了的template
      // 没有template采用el外部的html
      let template = options.template;
      // 没有写template但是写了el
      if (!template && el) {
        // 包括el在内的html就是template
        template = el.outerHTML;
      }

      // 将模版template编译成render函数
      const render = compileToFunctions(template); // render函数就是包含h(xxx)
      options.render = render;
    }

    // 最终在这里就可以拿到options.render的函数
    // runtime和runtimeWithComplier
    // script引用的vue.global.js这个编译过程是在浏览器中执行的
    // runtime运行时是不包含模板编译的，整个编译是在打包的过程中通过loader编译.vue文件的；
    // 用runtime的时候不能使用template

    // console.log("render", options.render);

    // 挂载组件
    mountComponent(vm, el);
  };
}
