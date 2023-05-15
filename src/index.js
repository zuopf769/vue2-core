import { initGlobalAPI } from "./globalAPI";
import { initMixin } from "./init";
import { initLifeCycle } from "./lifecycle";
import { nextTick } from "./observe/watcher";

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

export default Vue;
