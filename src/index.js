import { initGlobalAPI } from "./globalAPI";
import { initMixin } from "./init";
import { initLifeCycle } from "./lifecycle";
import Watcher, { nextTick } from "./observe/watcher";

// 将所有的方法都耦合在一起
function Vue(options) {
  // options就是用户的选项
  this._init(options);
}

// 暂时先这么写，扩展$nextTick方法
Vue.prototype.$nextTick = nextTick;

initMixin(Vue); // 扩展了_init方法
initLifeCycle(Vue); // 扩展了生命周期方法

// 前面都是扩展实例方法
// 底下是扩展静态方法，等会抽取出去单独文件
initGlobalAPI(Vue);

// watch最终调用的$watch方法
// options参数可以是 dep: true深度监听;immediate立即执行
Vue.prototype.$watch = function (exprOrFn, cb, options = {}) {
  // console.log("$watch", exprOrFn, cb);

  // 'firstname' 字符串需要转换成() => vm.firstname；在什么地方转？在Watcher里面转
  // 当firstname变化的时候，就执行cb
  // { user: true }用户自定义的watcher
  new Watcher(this, exprOrFn, { user: true }, cb);
};

export default Vue;
