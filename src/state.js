export function initState(vm) {
    const opts = vm.$options;// 获取所有的选项

    if (opts.data) {
        initData(vm);
    }
}

function initData(vm) {
    let data = vm.$options.data; // data可能是函数和对象

    // 根组件可以是function也可以对象，组件必须是函数
    data = typeof data === 'function' ? data.call(vm): data;

    console.log(data)
}