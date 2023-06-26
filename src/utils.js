// 策略模式
const strats = {};
const LIFECYCLES = ["beforeCreate", "created"];
LIFECYCLES.forEach((hook) => {
  strats[hook] = function (p, c) {
    //子存在
    if (c) {
      // 子存在，父也存在（父存在那么父就是数组），就把子和父拼在一起
      if (p) {
        return p.concat(c);
      } else {
        // 子存在但是父不存在，则把儿子包装成数组
        return [c];
      }
    } else {
      // 子不存在只有父，直接返回父
      return p;
    }
  };
});

// data的props merge策略
// strats.data = function (p, c) {};

// 计算属性的props merge策略
// strats.computed = function (p, c) {};

// 自身组件components和全局组件Vue.options.components的merge策略：优先找自己的，自己没有再找父亲身上的
strats.components = function (p, c) {
  // 以父亲p为原型创建一个对象res.__proto = {xxx: {}}
  // 父亲p的原型上维护着某个ID对应的全局组件
  let res = Object.create(p);
  // 如果子存在
  if (c) {
    // 把儿子的key添加到新创建出来的对象res上，达到儿子上有就先用儿子上的key，没有就从父亲的原型上取
    for (let key in c) {
      res[key] = c[key];
    }
  }

  return res;
};

// ...剩下的策略

export function mergeOptions(parent, child) {
  let options = {};

  // 不能这么做，这么做合并不出来数组；以为直接覆盖了 {created: [fn, fn]}
  // let options = { ...parent, ...child };

  // 先遍历父的所有key
  for (const key in parent) {
    if (parent.hasOwnProperty(key)) {
      mergeField(key);
    }
  }

  // 再遍历父亲上没有的儿子上的key
  for (const key in child) {
    // 父亲上不存在的key
    if (!parent.hasOwnProperty(key)) {
      mergeField(key);
    }
  }

  function mergeField(key) {
    // 策略上有就走策略模式，没有就走默认
    if (strats[key]) {
      options[key] = strats[key](parent[key], child[key]);
    } else {
      // 策略没有提供，就走默认策略；以儿子为主
      // 优先考虑儿子上的属性，再采用父亲的属性
      options[key] = child[key] || parent[key];
    }
  }

  return options;
}
