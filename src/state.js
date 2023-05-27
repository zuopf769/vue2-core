import { observe } from "./observe";
import Watcher from "./observe/watcher";
import Dep from "./observe/dep";

export function initState(vm) {
  const opts = vm.$options; // 获取所有的选项

  // data初始化
  if (opts.data) {
    initData(vm);
  }

  // 初始化计算属性
  if (opts.computed) {
    initComputed(vm);
  }

  // 初始化watch方法
  if (opts.watch) {
    initWatch(vm);
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

// 初始化computed
function initComputed(vm) {
  let computed = vm.$options.computed;
  // 按计算属性得key存放每个计算属性watcher
  // 将计算属性watchers保存到vm上
  const watchers = (vm._computedWatchers = {});

  for (const key in computed) {
    if (Object.hasOwnProperty.call(computed, key)) {
      const userDef = computed[key];

      // 创建计算属性Watcher
      // 我们需要监控计算属性中get的变化，重新计算computed的get方法求新值
      let fn = typeof userDef === "function" ? userDef : userDef.get;
      // 直接new Watcher的时候就会执行fn方法；渲染Watcher创建的时候就需要执行fn
      // lazy懒执行，计算属性watcher不能立即执行fn
      // 计算属性watcher的fn啥时候执行呢？使用fullname的时候才执行，就是渲染watcher的fn执行的时候获取了计算属性的值才会执行
      /**
       *  fullname() {
       *    console.log("run fullname");
       *    return this.firstname + this.lastname;
       *  },
       */
      // 将属性和watcher对应起来
      // 计算属性watcher不会导致页面更新
      watchers[key] = new Watcher(vm, fn, { lazy: true });

      // 给vm定义计算属性key
      defineComputed(vm, key, userDef);
    }
  }
}

function defineComputed(target, key, userDef) {
  const getter = typeof userDef === "function" ? userDef : userDef.get;
  const setter = userDef.get || (() => {});

  // console.log(getter);
  // console.log(setter);

  // 给vm定义属性
  Object.defineProperty(target, key, {
    get: createComputedGetter(key), // 包装一下get方法
    set: setter,
  });
}

// 每次计算属性取值都会走到get方法
// 计算属性不会依赖收集，只会让自己的依赖属性去收集依赖
function createComputedGetter(key) {
  // 我们需要检测是否执行这个getter
  return function () {
    // 获取对应属性的watcher
    const watcher = this._computedWatchers[key];
    // 如果是脏的就去执行 用户传人的函数
    if (watcher.dirty) {
      // 计算属性求值一次后dirty就为false了，下次就不重新求值了，直接返回上次的结果
      watcher.evaluate();
    }

    // 计算属性求值后，如果Dep.target还有值
    // 计算属性watcher出栈后，还要渲染watcher,我们应该让计算属性watcher里面的属性，也去收集上一层的渲染watcher
    if (Dep.target) {
      watcher.depend();
    }
    // 最后返回的是watcher上的value
    return watcher.value;
  };
}

function createWatcher(vm, key, handler) {
  // 字符串、函数；数组已经在上层处理过了；我们暂时不考虑对象
  if (typeof handler === "string") {
    handler = vm.$options.methods[handler];
  }

  // $vm.$watch()
  return vm.$watch(key, handler);
}

// 初始化watch
function initWatch(vm) {
  let watch = vm.$options.watch;
  // console.log("initWatch", watch);
  for (let key in watch) {
    // handler分字符串、函数、数组
    // vue中handler还可能是对象；我们的实现中先不考虑
    /***
     * watch: {
     *   firstname: {
     *      handler: function() {
     *      },
     *      immediate: true
     *   }
     * }
     *
     */
    const handler = watch[key];
    if (Array.isArray(handler)) {
      for (let i = 0; i < handler.length; i++) {
        createWatcher(vm, key, handler[i]);
      }
    } else {
      createWatcher(vm, key, handler);
    }
  }
}
