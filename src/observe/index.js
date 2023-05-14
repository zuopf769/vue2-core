import { arrayMethods } from "./array";
import Dep from "./dep";
class Observer {
  // 观测值
  constructor(value) {
    // 给所有响应式数据增加标识，并且可以在响应式上获取Observer实例上的方法
    // 如果数据上已经有了__ob__标识，证明已经被代理过了
    // 增加__ob__属性为this，目的是可以在value上取到this从而调用Observer类上的方法
    // 等同于value.__ob__ = this；但是没有控制可以枚举性，会导致下面defineReactive的时候死循环
    // 值是this，但是不可枚举，循环的时候无法获取，从而解决了死循环的问题
    Object.defineProperty(value, "__ob__", {
      enumerable: false,
      configurable: false,
      value: this,
    });

    if (Array.isArray(value)) {
      // 重新数组的7个变异方法，为啥是变异方法，因为会修改原数组

      // 需要保留数组原有的方法，并且可以重写部分方法
      value.__proto__ = arrayMethods; // 重写数组原型方法
      // 数组里面的对象引用类型也需要进行劫持
      this.observeArray(value); // 如果数组中方的是对象，可以监控到对象的改变
    } else {
      // 遍历
      this.walk(value);
    }
  }

  // 循环递归（性能差的原因）对象，对对象的所有属性进行劫持
  walk(data) {
    // 让对象上的所有属性依次进行观测
    let keys = Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      let value = data[key];
      // "重新定义"属性
      defineReactive(data, key, value);
    }
  }

  // 观测数组
  observeArray(data) {
    data.forEach((item) => observe(item));
  }
}

// 要暴露的方法，所以不能放到Observer类里面
// 闭包
export function defineReactive(data, key, value) {
  // 深度属性劫持
  // 如果value还是object类型，继续调用observe进行递归劫持
  observe(value);

  // 每一个属性都有一个dep
  let dep = new Dep();

  // 缺点：Object.defineProperty只能劫持已经存在的属性，对于新增的和删除的操作监听不到
  // 所以vue中单独写了一些api如$set, $delete来实现属性的新增的和删除后，仍然能做到数据劫持
  Object.defineProperty(data, key, {
    get() {
      // console.log(`get key ${key}`);
      // 什么时候Dep.target会有值？模版中使用了的变量，在调用_render()方法的时候就会在Dep.target加上值
      // 用到了的属性才会被收集，在data中定义了，但是视图组件中没有用到也不会被收集
      if (Dep.target) {
        // 让这个属性的收集器记住当前的watcher
        dep.depend();
      }

      // 取值的时候会执行get
      // 闭包，value不会销毁，能取得到
      return value;
    },
    set(newValue) {
      // 设值的时候会执行set
      if (newValue == value) return;

      console.log(`set key ${key} ${newValue}`);

      // 再次劫持
      // 深度属性劫持
      // 如果设置的属性的value仍然是对象，继续递归进行新增属性的响应式
      observe(newValue);

      value = newValue;

      // 属性一变化，就通知更新
      dep.notify();
    },
  });
}

export function observe(data) {
  // 对这个对象进行劫持

  if (typeof data !== "object" || data === null) {
    return; // 只对对象进行劫持
  }

  // data上有__ob__标识证明已经被观察过了，直接返回原本的Observer就可以了
  if (data.__ob__ instanceof Observer) {
    return data.__ob__;
  }

  // 如果一个对象被劫持过了，那就不需要再被劫持了（需要判断一个对象是否被劫持过，可以添加一个实例，用实例来判断是否被劫持过）
  return new Observer(data);
}
