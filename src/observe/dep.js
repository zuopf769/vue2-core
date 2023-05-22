let id = 0;

// 被观察者，属性就是被观察者；属性的值发生变化后会通知所有的观察者更新

// 属性的dep要收集watcher
class Dep {
  constructor() {
    // 唯一id
    this.id = id++;
    // 这里存放着当前属性对应的watcher有哪些
    this.subs = [];
  }

  // 保证dep和watcher都不重复，保证dep和watcher双向维护
  depend() {
    // 这里不希望放置不重复的watcher；而且不只是一个单向的关系，dep -> watcher
    // 也得让wather记录dep
    // this.subs.push(Dep.target);

    // 我们希望dep和watcher相互维护各自的引用，相互记忆
    // 把dep传给了watcher
    Dep.target.addDep(this); // 让watcher记住dep，在watcher中记住dep的时候去了重同时也让dep记录了watcher

    // dep和watcher是多对多的关系
    // 一个属性在多个组件中使用 一个dep对应多个watcher
    // 一个组件中有多个属性 一个watcher包含多个dep
  }

  addSubs(watcher) {
    this.subs.push(watcher);
  }

  notify() {
    // 告诉所有watcher更新
    this.subs.forEach((watcher) => watcher.update());
  }
}

// target为什么不挂载到原型上，反而是个静态变量呢？因为没必要通过实例来访问，只是一个作为一个全局变量
// 静态属性 - 相当于全局变量
// 记录
Dep.target = null;

// 用栈来维护watcher
let stack = [];

// 渲染watcher先入栈，然后计算属性watcher入栈
export function pushTarget(watcher) {
  // 压栈
  stack.push(watcher);
  Dep.target = watcher;
}

export function popTarget() {
  // 出栈
  stack.pop();
  // 如果最后一个弹栈后，取最后一个就Dep.target = undefined
  Dep.target = stack[stack.length - 1];
}

export default Dep;
