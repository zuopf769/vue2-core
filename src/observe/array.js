// 我们希望重新数组的部分方法
// 思路： 改变原型链、AOP函数劫持：内部调用原本的方法前后新加逻辑

// 获取数组的原型
let oldArrayProtoMethods = Array.prototype;

// 基于Array.prototype创建一个新的对象
// 让数组类型的value的__proto__指向下面的对象，等于修改了原型链
// arrayMethods.__proto__ = oldArrayProtoMethods;
// value.__proto__ == arrayMethods
export let arrayMethods = Object.create(oldArrayProtoMethods);

// 所有的变异方法7个：能修改原数组的方法： 对头（尾）
// concat、slice不能修改原数组
let methods = ["push", "pop", "shift", "unshift", "reverse", "sort", "splice"];

methods.forEach((method) => {
  // arrayMethods上面的加的方法只会影响arrayMethods上面的方法，不会覆盖Array.prototype上的原本的方法
  // 通过原型链找到了arrayMethods的push就不会继续去找Array.prototype上的push方法
  // 重新arrayMethods上的7个方法
  // arr.push(1,2,3)
  arrayMethods[method] = function (...args) {
    // 这里重写了数组的方法
    // 旧方法: 在新的方法里面调用
    // this就是arr
    const result = oldArrayProtoMethods[method].apply(this, args); // 内部调用原来的方法，函数的劫持，面向切片变成

    // console.log("array method: ", method);

    // 底下为AOP的增加自己的逻辑

    // this是arr，谁调用的push就是谁
    // this就是Observer中的那个value
    const ob = this.__ob__;
    // 新增的数组
    let inserted;
    // push和unshift会新增数据，新增的数据也需要劫持
    // splice也可能会新增数据
    switch (method) {
      case "push":
      case "unshift":
        inserted = args; // arr.unshift(1, 2, 3) // 新增的内容是一个数组
        break;
      case "splice":
        inserted = args.slice(2); // arr.splice(0, 1, {a: 1}, {b: 2}) 第2个参数后面的参数是新增的内容是数组
      default:
        break;
    }
    // 对数组类型的数据进行观察劫持
    if (inserted) ob.observeArray(inserted); // 对新增的数据（数组）再次进行观测劫持
    return result;
  };
});
