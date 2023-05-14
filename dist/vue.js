(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Vue = factory());
})(this, (function () { 'use strict';

  function _iterableToArrayLimit(arr, i) {
    var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"];
    if (null != _i) {
      var _s,
        _e,
        _x,
        _r,
        _arr = [],
        _n = !0,
        _d = !1;
      try {
        if (_x = (_i = _i.call(arr)).next, 0 === i) {
          if (Object(_i) !== _i) return;
          _n = !1;
        } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0);
      } catch (err) {
        _d = !0, _e = err;
      } finally {
        try {
          if (!_n && null != _i.return && (_r = _i.return(), Object(_r) !== _r)) return;
        } finally {
          if (_d) throw _e;
        }
      }
      return _arr;
    }
  }
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
  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest();
  }
  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }
  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }
  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;
    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];
    return arr2;
  }
  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
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

      // console.log("array method: ", method);

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

  var id$1 = 0;

  // 被观察者，属性就是被观察者；属性的值发生变化后会通知所有的观察者更新

  // 属性的dep要收集watcher
  var Dep = /*#__PURE__*/function () {
    function Dep() {
      _classCallCheck(this, Dep);
      // 唯一id
      this.id = id$1++;
      // 这里存放着当前属性对应的watcher有哪些
      this.subs = [];
    }

    // 保证dep和watcher都不重复，保证dep和watcher双向维护
    _createClass(Dep, [{
      key: "depend",
      value: function depend() {
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
    }, {
      key: "addSubs",
      value: function addSubs(watcher) {
        this.subs.push(watcher);
      }
    }, {
      key: "notify",
      value: function notify() {
        // 告诉所有watcher更新
        this.subs.forEach(function (watcher) {
          return watcher.update();
        });
      }
    }]);
    return Dep;
  }(); // target为什么不挂载到原型上，反而是个静态变量呢？因为没必要通过实例来访问，只是一个作为一个全局变量
  // 静态属性 - 相当于全局变量
  // 记录
  Dep.target = null;

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

    // 每一个属性都有一个dep
    var dep = new Dep();

    // 缺点：Object.defineProperty只能劫持已经存在的属性，对于新增的和删除的操作监听不到
    // 所以vue中单独写了一些api如$set, $delete来实现属性的新增的和删除后，仍然能做到数据劫持
    Object.defineProperty(data, key, {
      get: function get() {
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
      set: function set(newValue) {
        // 设值的时候会执行set
        if (newValue == value) return;
        console.log("set key ".concat(key, " ").concat(newValue));

        // 再次劫持
        // 深度属性劫持
        // 如果设置的属性的value仍然是对象，继续递归进行新增属性的响应式
        observe(newValue);
        value = newValue;

        // 属性一变化，就通知更新
        dep.notify();
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

  // 标签名：第一个字符+后面的字符；第一个字符不能以数字开头
  // 字符串的两个\\是什么？表示转义，字符串中的转义，前一个\表示转义后面的\
  var ncname = "[a-zA-Z_][\\-\\.0-9_a-zA-Z]*";
  // (?:${ncname}\\:)?
  // 第一个?:表示匹配但是不记住匹配项；
  // 为啥不要记住匹配性，因为需要加()分组后表示前面一半是命名空间可有可无，但是又不想铺获$1的值
  // https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_expressions#special-non-capturing-parentheses
  // (?:${ncname}\\:)? 第二个？表示可有可无
  // 外面的分组
  var qnameCapture = "((?:".concat(ncname, "\\:)?").concat(ncname, ")");

  // 注意前面的开头^，必须是开始匹配
  // <1_xxx 不能以数字开头
  // <_xxx 自定义标签，都是以_开头 webcomponent
  // <xxx
  // <namespace:yyy 命名空间
  var startTagOpen = new RegExp("^<".concat(qnameCapture)); // 标签开头的正则 捕获的内容是标签名
  // console.log(startTagOpen);

  // 注意前面的开头^，必须是开始匹配
  // 匹配到的是</xxx>
  var endTag = new RegExp("^<\\/".concat(qnameCapture, "[^>]*>")); // 匹配标签结尾的 </div>
  // console.log(endTag);

  // 注意前面的开头^，必须是开始匹配
  // a=b 没有空格
  // a = b =前后有空格
  // <xx a = b a前面也有空格
  // ([^\s"'<>\/=]+)表示前面的属性名或者属性值，除了"'<>那些字符都可以的字符
  // <xxx disabled disabled属性只有前面的部分没有后面的部分（=xxx）
  // (?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))? 第一个()为了后面加？表示属性值可有可无
  // "([^"]*)"+ 以双引号包的非"的多个字符 <xx a = "b" 左边双引号右边双引号中间不是双引号就可以
  // '([^']*)'+ 以单引号包的非'的多个字符 <xx a = 'b' 左边单引号右边单引号中间不是单引号就可以
  // ([^\s"'=<>`]+) 除了\s"'=<>`的任意多个字符  <xx a = b 属性也可以不加单引号或者双引号
  var attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
  // 第一个分组就是属性的key value就是分组3/分组4/分组5
  // console.log(attribute);

  // 注意前面的开头^，必须是开始匹配
  // <div> <br/> 标签结束可能是> 也可能是/>
  var startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >

  // 对模版进行编译
  // vue3不是采用的正则匹配了，是一个一个字符匹配
  // 思路： 每解析一个标签就删除一个标签，每解析一个属性就删除一个属性；字符串被截取完了就结束了
  function parseHTML(html) {
    // 抽象语法树
    /*
    {
      tag:'div',
      type:1,
      children:[{tag:'span',type:1,attrs:[],parent:'div对象'}],
      attrs:[{name:'zf',age:10}],
      parent:null
    }
    */

    // 用于存放元素的栈，利用栈来创建一棵树
    var stack = [];
    // 节点类型-标签类型
    var ELEMENT_TYPE = 1;
    // 节点类型-文本类型
    var TEXT_TYPE = 3;
    // 根节点
    var root;
    // 指向栈中最后一个元素
    var currentParent;
    function createASTElement(tagName, attrs) {
      return {
        tag: tagName,
        type: ELEMENT_TYPE,
        children: [],
        attrs: attrs,
        parent: null
      };
    }

    // 开始标签 <div><span><a>text</a></span></div>
    function start(tagName, attrs) {
      // console.log(tagName, attrs);
      // 创建一个ast节点
      var element = createASTElement(tagName, attrs);
      // 看下是否是空树
      if (!root) {
        // 如果为空树，当前节点是树的根节点
        root = element;
      }
      // 进栈构建父子关系
      // 放在end时候执行该逻辑也行
      // if (currentParent) {
      //   element.parent = currentParent;
      //   currentParent.children.push(element);
      // }
      stack.push(element);
      // currentParent为栈中的最后一个元素
      currentParent = element;
    }

    // 结束标签
    function end(tagName) {
      // console.log(tagName);
      // 当前标签结束就弹栈；弹出栈中的最后一个元素
      var element = stack.pop();
      // currentParent为栈中的最后一个元素
      currentParent = stack[stack.length - 1];
      // 出栈构建父子关系
      // 放在start入栈的时候执行该逻辑也行
      if (currentParent) {
        // 当前标签结束的这个元素的parent就是栈中的最后一个元素
        element.parent = currentParent;
        // 栈中的最后一个元素的儿子就是当前弹栈弹出来的节点
        currentParent.children.push(element);
      }
    }

    // 文本；文本不需要放到栈中，文本直接放到currentParent节点的children中
    function chars(text) {
      // console.log(text);
      // 去掉空，可以优化为如果空格超过2个就删除2个以上的空格
      text = text.replace(/\s/g, "");
      // 不是节点直接的换行等空文本
      if (text) {
        // 文本节点直接放到当前栈的最后一个节点的children中，作为他的儿子
        currentParent.children.push({
          type: TEXT_TYPE,
          text: text,
          parent: currentParent
        });
      }
    }

    // html字符串前进n个字符：例如截掉已经捕获到的开头标签名、属性名和属性值、结束标签
    function advance(n) {
      html = html.substring(n);
    }

    // 解析开始标签，包括解析标签名和所有属性
    function parseStartTag() {
      // 匹配开始标签名
      var start = html.match(startTagOpen);
      if (start) {
        var match = {
          tagName: start[1],
          attrs: []
        };

        // html字符串截掉tagName
        // start[0] =>
        advance(start[0].length);

        // 捕获当前标签的所有属性
        var attr, _end;
        // 当前捕获到了属性标签并且不是当前标签的结束
        while (!(_end = html.match(startTagClose)) && (attr = html.match(attribute))) {
          match.attrs.push({
            name: attr[1],
            value: attr[3] || attr[4] || attr[5]
          });
          // attr[0] => id="app"
          advance(attr[0].length);
        }

        // html字符当前到了当前标签的结束位置 > 或者 />
        if (_end) {
          // 移除结束位置
          advance(_end[0].length);
          // 返回匹配到的当前节点
          return match;
        }
      }
    }

    // html字符串肯定是以<开头
    while (html) {
      var textEnd = html.indexOf("<");
      // <div>hello</div> indexOf等于0
      // 如果textEnd为0，表明当前html字符串处于开始标签处或者结束标签处
      // 如果textEnd大于0，表明当前html字符串处于文本节点或者空文本处，>处于文本节点的结束位置
      if (textEnd === 0) {
        // 如果indexOf的索引是0，则说明是一个开始标签或者结束标签
        // 解析开始标签：<div a=b c=d>
        var startTagMatch = parseStartTag();
        if (startTagMatch) {
          start(startTagMatch.tagName, startTagMatch.attrs);
          // 继续解析当前标签下的子开头标签
          // 例如<div a=b c=d><span>txt</span></div>中的下一个标签是<span>
          continue;
        }

        // 解析到最深的子节点的结束标签
        // 例如<div a=b c=d><span>txt</span></div>中的</span>
        var endTagMatch = html.match(endTag);
        if (endTagMatch) {
          advance(endTagMatch[0].length);
          end(endTagMatch[1]);
          continue;
        }
        // 先让他暂停
        // break;
      }

      // 当前html字符串处于文本标签处，因为结束标签>的index>0
      // 标签中的空格也是文本
      // <div a=b c=d>
      //    <span>txt</span>
      // </div>
      // hello</div> indexOf大于0 说明是文本
      var text = void 0;
      if (textEnd > 0) {
        text = html.substring(0, textEnd);
      }
      if (text) {
        advance(text.length);
        chars(text);
      }
    }

    // html为空
    // console.log("html", html);
    // root
    // console.log("root", root);

    return root;
  }

  var defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaaa}} 匹配到的时候表达式的变量

  /**
   *
   *  <div style="color:red">hello {{name}} <span></span></div>
   *  render(){
   *    return _c('div',{style:{color:'red'}},_v('hello'+_s(name) + 'age' + _s(age)),_c('span',undefined,''))
   *  }
   */

  // 如果是文本就创建文本节点；如果是标签元素就调用codegen
  function gen(node) {
    // 标签类型
    if (node.type == 1) {
      return codegen(node);
    } else {
      // 文本类型节点
      var text = node.text;
      // 纯文本类型
      if (!defaultTagRE.test(text)) {
        return "_v(".concat(JSON.stringify(text), ")");
      }
      // 包含{{}}的类型
      // 变量name需要转成字符串_s(name) 用+拼接
      // {{name}} hello {{name}} => _v(_s(name) + 'hello' + _s(name))
      console.log("文本节点：", text);
      var tokens = [];
      var match;
      // exec方法的特殊点：
      // 现象：当正则表达式里面有g的时候，连续执行两次结果不一样: let reg = /a/g; reg.exec('abc'); reg.exec('abc');
      // 原因：执行完一次后 reg.lastIndex变成1了，从第一个字符再往后找就找不到了
      // 解决方法：每次重新执行exec的时候需要把reg.lastIndex重置为0
      defaultTagRE.lastIndex = 0;
      // 记录上一个匹配内容后的位置，算上字符串本身的长度
      var lastIndex = 0;
      while (match = defaultTagRE.exec(text)) {
        // console.log("match", match);
        // 匹配的位置
        var index = match.index;

        // 中间有一个文本字符串
        // {{name}} hello {{age}} age
        // lastIndex就是{{name}}的结尾位置，index就是{{name}}的开头位置
        if (index > lastIndex) {
          // 把中间的hello内容放到tokens中
          tokens.push(JSON.stringify(text.slice(lastIndex, index)));
        }
        tokens.push("_s(".concat(match[1].trim(), ")"));
        lastIndex = index + match[0].length;
      }

      // 最后的文本字符串
      // {{name}} hello {{age}} age中的age
      // 从{{age}}的结束位置截取到最后
      if (text.length > lastIndex) {
        tokens.push(JSON.stringify(text.slice(lastIndex)));
      }

      // console.log(tokens);

      return "_v(".concat(tokens.join("+"), ")");
    }
  }

  // 生成儿子节点
  function getChildren(el) {
    var children = el.children;
    if (children) {
      return "".concat(children.map(function (c) {
        return gen(c);
      }).join(","));
    } else {
      return false;
    }
  }

  // 生成属性
  // attrs [{name: 'id', value: 'wapper'}, {name: 'style', value: 'color: red; font-size: 50px'}]
  function genProps(attrs) {
    var str = "";
    var _loop = function _loop() {
      var attr = attrs[i];
      // 如果attr名称是style
      // {name: 'style', value: 'color: red; font-size: 50px'}
      // 'color: red; font-size: 50px' => {color: red, font-size: 50px}
      if (attr.name === "style") {
        var obj = {};
        attr.value.split(";").forEach(function (item) {
          var _item$split = item.split(":"),
            _item$split2 = _slicedToArray(_item$split, 2),
            key = _item$split2[0],
            value = _item$split2[1];
          obj[key] = value;
        });
        attr.value = obj;
      }
      // JSON.stringify把vue转成字符串
      str += "".concat(attr.name, ":").concat(JSON.stringify(attr.value), ",");
    };
    for (var i = 0; i < attrs.length; i++) {
      _loop();
    }
    return "{".concat(str.slice(0, -1), "}");
  }

  // 生成code
  function codegen(el) {
    // console.log("el", el);

    // 生成改节点的孩子，如果有孩子就加个,没孩子就不加了
    var children = getChildren(el);
    var code = "_c('".concat(el.tag, "', ").concat(el.attrs.length > 0 ? genProps(el.attrs) : "undefined").concat(children ? ",".concat(children) : "", "\n  )");
    return code;
  }
  function compileToFunctions(template) {
    // console.log(template);

    // 1. 将template转换成AST语法树
    var ast = parseHTML(template);
    // console.log(ast);

    // 2. 生成render方法，render方法执行后返回的结果就是虚拟DOM
    var code = codegen(ast);
    // console.log("code", code);

    // 模版引擎的原理： with + new Function
    // _c('div',{style:{color:'red'}},_v('hello'+_s(name)),_c('span',undefined,''))
    // 用with？为了取值方便；解决_c _v _s从哪儿取的问题，不用都得vm._c vm._v vm._s了
    // 为啥是this而不是vm? render函数被谁调用就是谁； this是谁就从谁的上面取_c _v _s
    var render = "with(this){return ".concat(code, "}");
    var renderFn = new Function(render);
    // 生成render函数，需要调用；分成两块：生成函数、调用函数
    return renderFn;
  }

  // 最终的render函数
  /*
  function render() {
    with (this) {
      _c(
        "div",
        { style: { color: "red" } },
        _v("hello" + _s(name)),
        _c("span", undefined, "")
      );
    }
  }
  */

  // render函数调用绑定作用域
  // render.call(vm);

  // 观察者模式
  // Watcher观察者，观察某个属性，某个属性的值发生变化后 观察者就update
  // 每个属性有一个dep, 属性就是被观察者；属性的值发生变化后会通知所有的观察者更新

  // watcher的id
  var id = 0;

  // 1) 当我们创建渲染watcher的时候我们把当前的渲染watcher放到 Dep.target上
  // 2) this.getter()会调用_render()方法，就会走到属性的get方法上

  // 不同组件有不同的watcher，目前只有一个，渲染根实例的
  var Watcher = /*#__PURE__*/function () {
    function Watcher(vm, fn, options) {
      _classCallCheck(this, Watcher);
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
    _createClass(Watcher, [{
      key: "get",
      value: function get() {
        // 先把当前的watcher放到 Dep.target上
        // A组件渲染的时候会把A组件的watcher放上来，B组件渲染的时候会把B组件的watcher放上来，
        Dep.target = this;
        // 调用vm._update(vm._render()) 就会去vm上取name和age的值
        this.getter();
        // 渲染完毕后就清空
        Dep.target = null;
      }

      // 一个组件 对应着多个属性 重复的属性不应该重复记录 name可能会被引用几次
    }, {
      key: "addDep",
      value: function addDep(dep) {
        var depId = dep.id;
        if (!this.depsId.has(depId)) {
          this.deps.push(dep);
          this.depsId.add(depId);
          // watcher记住了dep而且去重了，此时dep也记住了watcher
          dep.addSubs(this);
        }
      }
    }, {
      key: "update",
      value: function update() {
        // console.log("update");

        // 执行多次，修改为下面的方面
        // 重新渲染
        // this.get();

        // 解决修改属性执行多次，把watcher放到队列中，然后一次执行
        queueWatcher(this);
      }

      // 真实的渲染
    }, {
      key: "run",
      value: function run() {
        console.log("run");
        this.get(); // vm.name = 最后一次的值
      }
    }]);
    return Watcher;
  }(); // 用于存放watcher的队列
  var queue = [];
  // 类似set防止重复存放watcher，因为一个组件依赖多个属性
  var has = {};
  // 防抖，只执行最后一次
  var pending = false;

  // 异步批处理
  function flushSchedulerQueue() {
    // 拷贝一份，不要影响原来的watcher的queue
    var flushQueue = queue.slice(0);

    // clear清理工作
    // 清理工作为什么放到前面？pending为false的话如果刷新中还有新的任务过来的话，就可以放到队列中
    queue = [];
    has = {};
    pending = false;
    // 在刷新的过程中如果还有新的watcher，会重新放到queue中
    flushQueue.forEach(function (q) {
      return q.run();
    });
  }
  function queueWatcher(watcher) {
    var id = watcher.id;
    if (!has[id]) {
      has[id] = true;
      queue.push(watcher);
      console.log("watcher queue", queue);
      // 不管我们的update执行多少次，但是最终只执行一轮刷新操作
      // 第一个属性过来就设置定时器，第二、三个属性过来的时候就不设置定时器了
      if (!pending) {
        // 开启一个定时器，异步执行刷新操作
        setTimeout(flushSchedulerQueue, 0);
        // pending为true以后就不能再次添加setTimeout了
        pending = true;
      }
    }
  }

  // 封装异步方案，供用户使用和框架内部使用
  // 外部用户使用的时候可以连续写多个vm.$nextTick(() => {})，所以也需要维护队列
  var callbacks = [];
  var waiting = false;

  // flushCallbacks是异步执行的
  function flushCallbacks() {
    var cbs = callbacks.slice(0);
    waiting = false;
    callbacks = [];
    cbs.forEach(function (cb) {
      return cb();
    });
  }

  // nextTick并不是创建异步任务，而是把异步任务维护到了队列中
  // nextTick只会开启一次异步任务
  // nextTick是异步么？既有同步，又有异步；同步就是把异步任务维护到了队列中，异步就是flushCallbacks是异步执行的

  // nextTick没有直接使用某一个api,而是做了优雅的降级
  // 内部优先采用promise(ie不兼容)、和promise.then同等的MutationObserver h5的api；可以考虑ie专享的setImmediate；最后才是setTimout定时器
  // 前面的几个api都是微任务，比setTimout执行的时机快，能更快的看到页面刷新完成
  // setTimout要开启一个新的线程，promise.then只是异步执行代码，性能开销要小

  var timerFunc = null;
  if (Promise) {
    timerFunc = function timerFunc() {
      Promise.resolve().then(flushCallbacks);
    };
  } else if (MutationObserver) {
    var observer = new MutationObserver(flushCallbacks);
    var textNode = document.createTextNode(1);
    // 观察textNode的文本内容发生变化，变化后就执行回调flushCallbacks
    observer.observe(textNode, {
      characterData: true
    });
    timerFunc = function timerFunc() {
      textNode.textContent = 2;
    };
  } else if (setImmediate) {
    timerFunc = function timerFunc() {
      setImmediate(flushCallbacks);
    };
  } else {
    timerFunc = function timerFunc() {
      setTimeout(flushCallbacks);
    };
  }
  function nextTick(cb) {
    // 把任务维护到队列中不是异步的
    callbacks.push(cb);
    if (!waiting) {
      timerFunc();
      waiting = true;
    }
  }

  // 一个组件对应一个watcher；
  // 不同的组件有不同的watcher
  // 一个页面中多个组件，对应多个watcher；某个属性变化了，只会通知依赖了该属性的watcher去更新页面

  // 组件化的目的是什么？
  // 可复用、方便维护、局部刷新
  // 一个组件一个watcher, 通过拆分组件来减少刷新的范围，某个属性变化了，只会通知依赖了该属性的watcher也就是组件去更新

  // 创建元素的虚拟节点
  //  _h() _c()方法
  function createElementVNode(vm, tag, data) {
    if (data == null) {
      data = {};
    }
    // react是叫props；vue里是data
    var key = data.key;
    if (key) {
      delete data.key;
    }
    for (var _len = arguments.length, children = new Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
      children[_key - 3] = arguments[_key];
    }
    return vnode(vm, tag, data, key, children);
  }

  // 创建文本的虚拟节点
  // _v()
  function createTextVNode(vm, text) {
    return vnode(vm, undefined, undefined, undefined, undefined, text);
  }

  // 虚拟节点vnode
  // key很重要dom diff
  function vnode(vm, tag, data, key, children, text) {
    // vnode上维护了vm属性
    return {
      vm: vm,
      tag: tag,
      data: data,
      key: key,
      children: children,
      text: text
    };
  }

  // AST和VDom一样么?
  // 区别一：描述的范围不一样
  // VDOM和AST很像，但是他描述的信息更多
  // AST可以描述 js css html；描述语言本身 https://astexplorer.net/
  // VDOM只能描述dom
  // 区别二：是否可以增加一些属性
  // AST是语法层面的转化，描述的是语法本身，不可以增加一些属性，原本有什么就转换什么
  // VDom是描述DOM的元素，可以增加一些自定义属性，例如事件、指令、插槽

  function createElm(vnode) {
    var tag = vnode.tag,
      children = vnode.children;
      vnode.key;
      vnode.data;
      var text = vnode.text;
    // 根据标签名tag来创建原生元素
    // 标签
    if (typeof tag === "string") {
      // 虚拟节点上挂真实DOM节点
      // 这里将虚拟DOM节点和真实DOM节点对应起来，后续如果修改属性了，可以找到真实DOM
      vnode.el = document.createElement(tag);
      updateProperties(vnode);
      // 处理儿子
      children.forEach(function (child) {
        // 儿子需要append到当前的el中
        return vnode.el.appendChild(createElm(child));
      });
    } else {
      vnode.el = document.createTextNode(text);
    }
    return vnode.el;
  }
  function updateProperties(vnode) {
    var newProps = vnode.data || {}; // 获取当前老节点中的属性
    var el = vnode.el; // 当前的真实节点
    for (var key in newProps) {
      if (key === "style") {
        for (var styleName in newProps.style) {
          el.style[styleName] = newProps.style[styleName];
        }
      } else if (key === "class") {
        el.className = newProps["class"];
      } else {
        // 给这个元素添加属性 值就是对应的值
        el.setAttribute(key, newProps[key]);
      }
    }
  }
  function patch(oldVnode, vnode) {
    // oldVnodes是el，原生DOM就是首次渲染
    var isRealElement = oldVnode.nodeType;
    if (isRealElement) {
      // 首次渲染
      // 获取真实DOM
      var oldElm = oldVnode;
      // 获取真实DOM的父容器
      var parentElm = oldElm.parentNode;
      var el = createElm(vnode);

      // 先把新的节点插入到老节点的下面
      parentElm.insertBefore(el, oldElm.nextSibling);
      // 再删除老节点
      parentElm.removeChild(oldVnode);
      return el;
    }
  }
  function initLifeCycle(Vue) {
    // 把_render函数生成的虚拟DOM，生成真实DOM
    Vue.prototype._update = function (vnode) {
      console.log("_update", vnode);
      var vm = this;
      var el = vm.$el;
      console.log("el", el);

      // patch既有初始化的功能，又有更新的功能
      vm.$el = patch(el, vnode);
    };

    // 生成虚拟DOM
    Vue.prototype._render = function () {
      console.log("_render");
      var vm = this;
      // 渲染的时候会从实例vm上取值，我们就将属性和视图绑定在了一起
      // 为什么要call?希望render函数里面的with的this指向vm
      // 为啥要指向vm?因为vm上有name，有age
      // console.log(vm.age, vm.name);
      // let render = `with(this){return ${code}}`;
      var vnode = vm.$options.render.call(vm); // 通过ast语法转以后生成的render函数
      return vnode;
    };

    // 创建文本
    //  _v(text),
    Vue.prototype._v = function (text) {
      return createTextVNode(this, text);
    };

    // 创建元素
    // _c('div', {}, ...children)
    Vue.prototype._c = function () {
      return createElementVNode.apply(void 0, [this].concat(Array.prototype.slice.call(arguments)));
    };

    // 把传入的值val转成字符串
    Vue.prototype._s = function (val) {
      return val == null ? "" : _typeof(val) === "object" ? JSON.stringify(val) : val;
    };
  }
  function mountComponent(vm, el) {
    vm.$el = el;
    // 1. 调用render方法，生成虚拟DOM
    // 2. 根据虚拟DOM，生成真实DOM

    // vm._update(vm._render()); // vm.$options.render();

    // 更新根组件
    var updateComponent = function updateComponent() {
      vm._update(vm._render());
    };

    // 首次渲染的时候会收集依赖
    // 更新的时候会再次收集
    var watcher = new Watcher(vm, updateComponent, true); // true标识一个渲染watcher
    console.log(watcher);

    // 2. 根据虚拟DOM，生成真实DOM

    // 3. 把真实DOM插入到el元素中
  }

  // vue的核心：
  // 1）创建响应式数据
  // 2）模板转换成ast语法树
  // 3）将ast语法树转换成render函数, 调用render方法，生成虚拟DOM
  // 4）后续每次数据更新，只需要执行render函数，无需再次执行ast转换的过程

  // render函数会产生虚拟DOM(使用响应式数据)
  // 根据虚拟DOM，生成真实DOM

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
      if (options.el) {
        vm.$mount(options.el); // 实现数据的挂载
      }
    };

    // 挂载应用
    Vue.prototype.$mount = function (el) {
      var vm = this;
      var options = vm.$options;
      el = document.querySelector(el);

      // 整体思想：不一定非得有render函数，没有render函数就用template编译成render函数
      // 先查找有没有render函数
      if (!options.render) {
        // 没有render函数的话，再看下是否写了template，写了template就用写了的template
        // 没有template采用el外部的html
        var template = options.template;
        // 没有写template但是写了el
        if (!template && el) {
          // 包括el在内的html就是template
          template = el.outerHTML;
        }

        // 将模版template编译成render函数
        var render = compileToFunctions(template); // render函数就是包含h(xxx)
        options.render = render;
      }

      // 最终在这里就可以拿到options.render的函数
      // runtime和runtimeWithComplier
      // script引用的vue.global.js这个编译过程是在浏览器中执行的
      // runtime运行时是不包含模板编译的，整个编译是在打包的过程中通过loader编译.vue文件的；
      // 用runtime的时候不能使用template

      console.log("render", options.render);

      // 挂载组件
      mountComponent(vm, el);
    };
  }

  // 将所有的方法都耦合在一起
  function Vue(options) {
    // options就是用户的选项
    this._init(options);
  }

  // 暂时先这么写，扩展$nextTick方法
  Vue.prototype.$nextTick = nextTick;
  initMixin(Vue); // 扩展了_init方法
  initLifeCycle(Vue); // 扩展了生命周期方法

  return Vue;

}));
//# sourceMappingURL=vue.js.map
