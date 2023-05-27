import Dep, { popTarget, pushTarget } from "./dep";

// 观察者模式
// Watcher观察者，观察某个属性，某个属性的值发生变化后 观察者就update
// 每个属性有一个dep, 属性就是被观察者；属性的值发生变化后会通知所有的观察者更新

// watcher的id
let id = 0;

// 1) 当我们创建渲染watcher的时候我们把当前的渲染watcher放到 Dep.target上
// 2) this.getter()会调用_render()方法，就会走到属性的get方法上

// 不同组件有不同的watcher，目前只有一个，渲染根实例的
class Watcher {
  constructor(vm, exprOrFn, options, cb) {
    // 唯一标识符
    this.id = id++;
    // 组件实例
    this.vm = vm;
    // 渲染watcher
    this.renderWatcher = options;

    if (typeof exprOrFn === "string") {
      // 字符串转函数；不要用箭头函数，避免作用域问题
      this.getter = function () {
        return vm[exprOrFn]; // vm.firstname
      };
    } else {
      // callback
      this.getter = exprOrFn; // getter意味着调用这个函数可以发生取值操作
    }

    // 记录dep
    // watcher为什么要记录deps?
    // 1. 后续实现计算属性会用到
    // 2. 一些清理工作需要用到: 当组件卸载的时候会把该组件的所有依赖deps清除掉
    this.deps = [];
    this.depsId = new Set();
    // callback回调函数
    this.cb = cb;
    // 懒执行
    this.lazy = options.lazy;
    // 缓存值，脏值检测；lazy为true的话dirty就是true；
    this.dirty = this.lazy;
    // 用户自定watcher
    this.user = options.user;

    // 如果lazy为true, get不会立即执行了
    // oldValue
    this.value = this.lazy ? undefined : this.get();
  }

  evaluate() {
    // 获取到用户函数fn的返回值，并且标识为不脏
    this.value = this.get();
    this.dirty = false;
  }

  get() {
    // 先把当前的watcher放到 Dep.target上
    // A组件渲染的时候会把A组件的watcher放上来，B组件渲染的时候会把B组件的watcher放上来，
    // Dep.target = this;
    pushTarget(this);
    // 调用vm._update(vm._render()) 就会去vm上取name和age的值
    const value = this.getter.call(this.vm);
    // 渲染完毕后就清空
    // Dep.target = null;
    popTarget();
    // 计算属性的getter执行后的返回值，渲染watcher的fn没有返回值
    return value;
  }

  // 一个组件 对应着多个属性 重复的属性不应该重复记录 name可能会被引用几次
  addDep(dep) {
    let depId = dep.id;
    if (!this.depsId.has(depId)) {
      this.deps.push(dep);
      this.depsId.add(depId);
      // watcher记住了dep而且去重了，此时dep也记住了watcher
      dep.addSubs(this);
    }
  }

  depend() {
    let i = this.deps.length;
    while (i--) {
      // 让计算属性watcher也收集渲染watcher
      this.deps[i].depend();
    }
  }

  update() {
    // console.log("update");

    // 执行多次，修改为下面的方面
    // 重新渲染
    // this.get();
    // 如果是计算属性
    if (this.lazy) {
      // 依赖得值发生变化了，就标识计算属性是脏值了
      this.dirty = true;
    } else {
      // 解决修改属性执行多次，把watcher放到队列中，然后一次执行
      queueWatcher(this);
    }
  }

  // 真实的渲染
  run() {
    let oldValue = this.value;
    // console.log("run");
    // 渲染的时候使用最新的vm来渲染的
    let newValue = this.get(); // vm.name = 最后一次的值
    // 如果是用户watcher还需要调用回调并传入newValue和oldValue
    if (this.user) {
      this.cb.call(this.vm, newValue, oldValue);
    }
  }
}

// 用于存放watcher的队列
let queue = [];
// 类似set防止重复存放watcher，因为一个组件依赖多个属性
let has = {};
// 防抖，只执行最后一次
let pending = false;

// 异步批处理
function flushSchedulerQueue() {
  // 拷贝一份，不要影响原来的watcher的queue
  let flushQueue = queue.slice(0);

  // clear清理工作
  // 清理工作为什么放到前面？pending为false的话如果刷新中还有新的任务过来的话，就可以放到队列中
  queue = [];
  has = {};
  pending = false;
  // 在刷新的过程中如果还有新的watcher，会重新放到queue中
  flushQueue.forEach((q) => q.run());
}

function queueWatcher(watcher) {
  const id = watcher.id;
  if (!has[id]) {
    has[id] = true;
    queue.push(watcher);
    // console.log("watcher queue", queue);
    // 不管我们的update执行多少次，但是最终只执行一轮刷新操作
    // 第一个属性过来就设置定时器，第二、三个属性过来的时候就不设置定时器了
    if (!pending) {
      // 开启一个定时器，异步执行刷新操作
      setTimeout(flushSchedulerQueue, 0);
      // pending为true以后就不能再次添加setTimeout了
      pending = true;
    }
  }
}

// 封装异步方案，供用户使用和框架内部使用
// 外部用户使用的时候可以连续写多个vm.$nextTick(() => {})，所以也需要维护队列
let callbacks = [];
let waiting = false;

// flushCallbacks是异步执行的
function flushCallbacks() {
  let cbs = callbacks.slice(0);
  waiting = false;
  callbacks = [];
  cbs.forEach((cb) => cb());
}

// nextTick并不是创建异步任务，而是把异步任务维护到了队列中
// nextTick只会开启一次异步任务
// nextTick是异步么？既有同步，又有异步；同步就是把异步任务维护到了队列中，异步就是flushCallbacks是异步执行的

// nextTick没有直接使用某一个api,而是做了优雅的降级
// 内部优先采用promise(ie不兼容)、和promise.then同等的MutationObserver h5的api；可以考虑ie专享的setImmediate；最后才是setTimout定时器
// 前面的几个api都是微任务，比setTimout执行的时机快，能更快的看到页面刷新完成
// setTimout要开启一个新的线程，promise.then只是异步执行代码，性能开销要小

let timerFunc = null;

if (Promise) {
  timerFunc = () => {
    Promise.resolve().then(flushCallbacks);
  };
} else if (MutationObserver) {
  let observer = new MutationObserver(flushCallbacks);
  let textNode = document.createTextNode(1);
  // 观察textNode的文本内容发生变化，变化后就执行回调flushCallbacks
  observer.observe(textNode, {
    characterData: true,
  });
  timerFunc = () => {
    textNode.textContent = 2;
  };
} else if (setImmediate) {
  timerFunc = () => {
    setImmediate(flushCallbacks);
  };
} else {
  timerFunc = () => {
    setTimeout(flushCallbacks);
  };
}

export function nextTick(cb) {
  // 把任务维护到队列中不是异步的
  callbacks.push(cb);
  if (!waiting) {
    timerFunc();
    waiting = true;
  }
}

// 要给每个属性加一个dep, 目的就是收集watcher
// 一个视图(视图就是组件)中有多个属性，（n个属性对应一个视图） n个dep对应一个watcher
// 一个属性对应多个视图组件 1个dep对应多个watcher
// dep和watcher是多对多的关系

export default Watcher;

// 一个组件对应一个watcher；
// 不同的组件有不同的watcher
// 一个页面中多个组件，对应多个watcher；某个属性变化了，只会通知依赖了该属性的watcher去更新页面

// 组件化的目的是什么？
// 可复用、方便维护、局部刷新
// 一个组件一个watcher, 通过拆分组件来减少刷新的范围，某个属性变化了，只会通知依赖了该属性的watcher也就是组件去更新
