import { initMixin } from "./init";

// 将所有的方法都耦合在一起
function Vue(options) {
  // options就是用户的选项
  this._init(options);
}

initMixin(Vue); // 扩展了_init方法

export default Vue;
