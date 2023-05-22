# computed 计算属性 watcher

- 第一次会创建渲染 watcher 并且把他放到栈中
- 渲染 watcher 执行过程中，会取计算属性{{fullname}}的值，会调 Watcher 的 get()方法，会把计算属性 watcher 压入栈中
- 计算属性取值的过程中会取值{{firstname}}和{{lastname}}，他们两个都是响应式数据，有两个 dep；他们收集的是计算属性 watcher
- 计算属性求值的过程中会重新计算计算属性的值
- 计算属性 watcher 通知的是 watcher 的 dirty 属性改为 true，并不会重新渲染页面
- 计算属性 watcher 弹栈后，计算属性 watcher 上依赖的属性 dep 把上层的渲染 watcher 也要记住，要不然不会重新渲染页面
- {{firstname}}发生变化后，会将计算属性 watcher dirty 改为 true；并且计算属性依赖的属性重新收集依赖为渲染 watcher
-
