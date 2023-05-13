import Dep from "./dep";

// 观察者模式
// Watcher观察者，观察某个属性，某个属性的值发生变化后 观察者就update
// 每个属性有一个dep, 属性就是被观察者；属性的值发生变化后会通知所有的观察者更新

// watcher的id
let id = 0;

// 1) 当我们创建渲染watcher的时候我们把当前的渲染watcher放到 Dep.target上
// 2) this.getter()会调用_render()方法，就会走到属性的get方法上

// 不同组件有不同的watcher，目前只有一个，渲染根实例的
class Watcher {
  constructor(vm, fn, options) {
    // 唯一标识符
    this.id = id++;
    // 组件实例
    this.vm = vm;
    // 渲染watcher
    this.renderWatcher = options;
    // callback
    this.getter = fn; // getter意味着调用这个函数可以发生取值操作
    // 记录dep
    // watcher为什么要记录deps?
    // 1. 后续实现计算属性会用到
    // 2. 一些清理工作需要用到: 当组件卸载的时候会把该组件的所有依赖deps清除掉
    this.deps = [];
    this.depsId = new Set();

    this.get();
  }

  get() {
    // 先把当前的watcher放到 Dep.target上
    // A组件渲染的时候会把A组件的watcher放上来，B组件渲染的时候会把B组件的watcher放上来，
    Dep.target = this;
    // 调用vm._update(vm._render()) 就会去vm上取name和age的值
    this.getter();
    // 渲染完毕后就清空
    Dep.target = null;
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

  update() {
    console.log("update");
    // 重新渲染
    this.get();
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
