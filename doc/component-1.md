# 组件渲染流程

## Vue.component 作用

- 收集全局的组件定义 id 和 definition
- Vue.options.components[组件名] = 包装成构造函数（definition）

## Vue.extend 作用

- 返回一个子类，而且会在子类上记录自己的选项
- 为什么 Vue 中的 data 不能是一个对象？

```js

function extend(选项) {
    function Sub() {
        this._init() // 子组件的初始化
    }
    Sub.options = 选项
    return Sub;
}

let Sub = Vue.extend({data: 数据源})

// 多次new Sub的时候
// 如果data是一个对象，就是共享的
// 如果data是一个方法，执行Sub.options.data()方法返回的就不是同一个对象了
new Sub() mergeOptions(Sub.options)
new Sub() mergeOptions(Sub.options)

```

- 创建子类的构造函数的时候，会将全局的组件和自己身上定义的组件进行合并（组件的合并会先查找自己再查找全局）
- 组件的渲染 开始渲染组件会编译组件的模板变成 render 函数 => 调用 render 方法
- createElementVNode 会根据 tag 类型来区分是否是组件；如果是组件则调用 createComponentVNode 创建一个组件类型的虚拟节点（组件增加初始化的钩子， 增加了一个 componentOptions 选项），稍后创建真实的组件实例的时候只需要 new Ctor（） 然后挂载，就可以了
