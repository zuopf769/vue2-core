class Observer {
  // 观测值
  constructor(value) {
    this.walk(value);
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
}

// 闭包
export function defineReactive(data, key, value) {
  // 深度属性劫持
  // 如果value还是object类型，继续调用observe进行递归劫持
  observe(value);

  // 缺点：Object.defineProperty只能劫持已经存在的属性，对于新增的和删除的操作监听不到
  // 所以vue中单独写了一些api如$set, $delete来实现属性的新增的和删除后，仍然能做到数据劫持
  Object.defineProperty(data, key, {
    get() {
      // 取值的时候会执行get
      // 闭包，value不会销毁，能取得到
      return value;
    },
    set(newValue) {
      // 设值的时候会执行set
      if (newValue == value) return;

      // 深度属性劫持
      // 如果设置的属性的value仍然是对象，继续递归进行新增属性的响应式
      observe(newValue);

      value = newValue;
    },
  });
}

export function observe(data) {
  // 对这个对象进行劫持

  if (typeof data !== "object" || data === null) {
    return; // 只对对象进行劫持
  }

  // 如果一个对象被劫持过了，那就不需要再被劫持了（需要判断一个对象是否被劫持过，可以添加一个实例，用实例来判断是否被劫持过）
  return new Observer(data);
}
