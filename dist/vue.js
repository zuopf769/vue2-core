(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function _typeof(obj) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) {
      return typeof obj;
    } : function (obj) {
      return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    }, _typeof(obj);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }

  // 我们希望重新数组的部分方法
  // 思路： 改变原型链、AOP函数劫持：内部调用原本的方法前后新加逻辑

  // 获取数组的原型
  var oldArrayProtoMethods = Array.prototype;

  // 基于Array.prototype创建一个新的对象
  // 让数组类型的value的__proto__指向下面的对象，等于修改了原型链
  // arrayMethods.__proto__ = oldArrayProtoMethods;
  // value.__proto__ == arrayMethods
  var arrayMethods = Object.create(oldArrayProtoMethods);

  // 所有的变异方法7个：能修改原数组的方法： 对头（尾）
  // concat、slice不能修改原数组
  var methods = ["push", "pop", "shift", "unshift", "reverse", "sort", "splice"];
  methods.forEach(function (method) {
    // arrayMethods上面的加的方法只会影响arrayMethods上面的方法，不会覆盖Array.prototype上的原本的方法
    // 通过原型链找到了arrayMethods的push就不会继续去找Array.prototype上的push方法
    // 重新arrayMethods上的7个方法
    // arr.push(1,2,3)
    arrayMethods[method] = function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }
      // 这里重写了数组的方法
      // 旧方法: 在新的方法里面调用
      // this就是arr
      var result = oldArrayProtoMethods[method].apply(this, args); // 内部调用原来的方法，函数的劫持，面向切片变成

      console.log("array method: ", method);

      // 底下为AOP的增加自己的逻辑

      // this是arr，谁调用的push就是谁
      // this就是Observer中的那个value
      var ob = this.__ob__;
      // 新增的数组
      var inserted;
      // push和unshift会新增数据，新增的数据也需要劫持
      // splice也可能会新增数据
      switch (method) {
        case "push":
        case "unshift":
          inserted = args; // arr.unshift(1, 2, 3) // 新增的内容是一个数组
          break;
        case "splice":
          inserted = args.slice(2);
      }
      // 对数组类型的数据进行观察劫持
      if (inserted) ob.observeArray(inserted); // 对新增的数据（数组）再次进行观测劫持
      return result;
    };
  });

  var Observer = /*#__PURE__*/function () {
    // 观测值
    function Observer(value) {
      _classCallCheck(this, Observer);
      // 给所有响应式数据增加标识，并且可以在响应式上获取Observer实例上的方法
      // 如果数据上已经有了__ob__标识，证明已经被代理过了
      // 增加__ob__属性为this，目的是可以在value上取到this从而调用Observer类上的方法
      // 等同于value.__ob__ = this；但是没有控制可以枚举性，会导致下面defineReactive的时候死循环
      // 值是this，但是不可枚举，循环的时候无法获取，从而解决了死循环的问题
      Object.defineProperty(value, "__ob__", {
        enumerable: false,
        configurable: false,
        value: this
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
    _createClass(Observer, [{
      key: "walk",
      value: function walk(data) {
        // 让对象上的所有属性依次进行观测
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          var value = data[key];
          // "重新定义"属性
          defineReactive(data, key, value);
        }
      }

      // 观测数组
    }, {
      key: "observeArray",
      value: function observeArray(data) {
        data.forEach(function (item) {
          return observe(item);
        });
      }
    }]);
    return Observer;
  }(); // 要暴露的方法，所以不能放到Observer类里面
  // 闭包
  function defineReactive(data, key, value) {
    // 深度属性劫持
    // 如果value还是object类型，继续调用observe进行递归劫持
    observe(value);

    // 缺点：Object.defineProperty只能劫持已经存在的属性，对于新增的和删除的操作监听不到
    // 所以vue中单独写了一些api如$set, $delete来实现属性的新增的和删除后，仍然能做到数据劫持
    Object.defineProperty(data, key, {
      get: function get() {
        console.log("get key ".concat(key));

        // 取值的时候会执行get
        // 闭包，value不会销毁，能取得到
        return value;
      },
      set: function set(newValue) {
        // 设值的时候会执行set
        if (newValue == value) return;
        console.log("set key ".concat(key, " ").concat(newValue));

        // 再次劫持
        // 深度属性劫持
        // 如果设置的属性的value仍然是对象，继续递归进行新增属性的响应式
        observe(newValue);
        value = newValue;
      }
    });
  }
  function observe(data) {
    // 对这个对象进行劫持

    if (_typeof(data) !== "object" || data === null) {
      return; // 只对对象进行劫持
    }

    // data上有__ob__标识证明已经被观察过了，直接返回原本的Observer就可以了
    if (data.__ob__ instanceof Observer) {
      return data.__ob__;
    }

    // 如果一个对象被劫持过了，那就不需要再被劫持了（需要判断一个对象是否被劫持过，可以添加一个实例，用实例来判断是否被劫持过）
    return new Observer(data);
  }

  function initState(vm) {
    var opts = vm.$options; // 获取所有的选项

    if (opts.data) {
      initData(vm);
    }
  }

  // 数据代理
  function proxy(vm, target, key) {
    // vm.name
    Object.defineProperty(vm, key, {
      get: function get() {
        // => vm._data.name
        return vm[target][key];
      },
      set: function set(newValue) {
        vm[target][key] = newValue;
      }
    });
  }

  // 初始化data
  function initData(vm) {
    var data = vm.$options.data; // data可能是函数和对象
    // 根组件可以是function也可以对象，组件必须是函数
    data = typeof data === "function" ? data.call(vm) : data; // data是用户返回的对象
    // 将data挂载到vm的_data，和vm上直接可以取到属性的proxy不一样
    vm._data = data;
    // 数据劫持 vue2用的是Object.defineProperty
    observe(data);

    // vm.xxx =>(代理到)  vm._data.xxx
    for (var key in data) {
      proxy(vm, "_data", key);
    }
  }

  function initMixin(Vue) {
    // 通过原型prototype给Vue增加init方法
    Vue.prototype._init = function (options) {
      // 用于初始化操作
      // vue vm.$options就是获取用户的配置

      // 我们使用vue的时候，$nextTick, $data, $attr...以$开头的都表示Vue的内置属性
      var vm = this;
      vm.$options = options; // 将用户的选项挂载到实例上

      // 初始化状态
      initState(vm);
    };
  }

  // 将所有的方法都耦合在一起
  function Vue(options) {
    // options就是用户的选项
    this._init(options);
  }
  initMixin(Vue); // 扩展了_init方法

  return Vue;

}));
//# sourceMappingURL=vue.js.map
