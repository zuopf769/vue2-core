import { observe } from "./observe";

export function initState(vm) {
  const opts = vm.$options; // 获取所有的选项

  if (opts.data) {
    initData(vm);
  }
}

// 数据代理
function proxy(vm, target, key) {
  // vm.name
  Object.defineProperty(vm, key, {
    get() {
      // => vm._data.name
      return vm[target][key];
    },
    set(newValue) {
      vm[target][key] = newValue;
    },
  });
}

// 初始化data
function initData(vm) {
  let data = vm.$options.data; // data可能是函数和对象
  // 根组件可以是function也可以对象，组件必须是函数
  data = typeof data === "function" ? data.call(vm) : data; // data是用户返回的对象
  // 将data挂载到vm的_data，和vm上直接可以取到属性的proxy不一样
  vm._data = data;
  // 数据劫持 vue2用的是Object.defineProperty
  observe(data);

  // vm.xxx =>(代理到)  vm._data.xxx
  for (let key in data) {
    proxy(vm, "_data", key);
  }
}
