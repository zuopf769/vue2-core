import { parseHTML } from "./parse";

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaaa}} 匹配到的时候表达式的变量

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
    let text = node.text;
    // 纯文本类型
    if (!defaultTagRE.test(text)) {
      return `_v(${JSON.stringify(text)})`;
    }
    // 包含{{}}的类型
    // 变量name需要转成字符串_s(name) 用+拼接
    // {{name}} hello {{name}} => _v(_s(name) + 'hello' + _s(name))
    // console.log("文本节点：", text);

    let tokens = [];
    let match;
    // exec方法的特殊点：
    // 现象：当正则表达式里面有g的时候，连续执行两次结果不一样: let reg = /a/g; reg.exec('abc'); reg.exec('abc');
    // 原因：执行完一次后 reg.lastIndex变成1了，从第一个字符再往后找就找不到了
    // 解决方法：每次重新执行exec的时候需要把reg.lastIndex重置为0
    defaultTagRE.lastIndex = 0;
    // 记录上一个匹配内容后的位置，算上字符串本身的长度
    let lastIndex = 0;
    while ((match = defaultTagRE.exec(text))) {
      // console.log("match", match);
      // 匹配的位置
      let index = match.index;

      // 中间有一个文本字符串
      // {{name}} hello {{age}} age
      // lastIndex就是{{name}}的结尾位置，index就是{{name}}的开头位置
      if (index > lastIndex) {
        // 把中间的hello内容放到tokens中
        tokens.push(JSON.stringify(text.slice(lastIndex, index)));
      }

      tokens.push(`_s(${match[1].trim()})`);
      lastIndex = index + match[0].length;
    }

    // 最后的文本字符串
    // {{name}} hello {{age}} age中的age
    // 从{{age}}的结束位置截取到最后
    if (text.length > lastIndex) {
      tokens.push(JSON.stringify(text.slice(lastIndex)));
    }

    // console.log(tokens);

    return `_v(${tokens.join("+")})`;
  }
}

// 生成儿子节点
function getChildren(el) {
  const children = el.children;
  if (children) {
    return `${children.map((c) => gen(c)).join(",")}`;
  } else {
    return false;
  }
}

// 生成属性
// attrs [{name: 'id', value: 'wapper'}, {name: 'style', value: 'color: red; font-size: 50px'}]
function genProps(attrs) {
  let str = "";
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    // 如果attr名称是style
    // {name: 'style', value: 'color: red; font-size: 50px'}
    // 'color: red; font-size: 50px' => {color: red, font-size: 50px}
    if (attr.name === "style") {
      let obj = {};
      attr.value.split(";").forEach((item) => {
        let [key, value] = item.split(":");
        obj[key] = value;
      });
      attr.value = obj;
    }
    // JSON.stringify把vue转成字符串
    str += `${attr.name}:${JSON.stringify(attr.value)},`;
  }
  return `{${str.slice(0, -1)}}`;
}

// 生成code
function codegen(el) {
  // console.log("el", el);

  // 生成改节点的孩子，如果有孩子就加个,没孩子就不加了
  let children = getChildren(el);

  let code = `_c('${el.tag}', ${
    el.attrs.length > 0 ? genProps(el.attrs) : "undefined"
  }${children ? `,${children}` : ""}
  )`;

  return code;
}

export function compileToFunctions(template) {
  // console.log(template);

  // 1. 将template转换成AST语法树
  let ast = parseHTML(template);
  // console.log(ast);

  // 2. 生成render方法，render方法执行后返回的结果就是虚拟DOM
  let code = codegen(ast);
  // console.log("code", code);

  // 模版引擎的原理： with + new Function
  // _c('div',{style:{color:'red'}},_v('hello'+_s(name)),_c('span',undefined,''))
  // 用with？为了取值方便；解决_c _v _s从哪儿取的问题，不用都得vm._c vm._v vm._s了
  // 为啥是this而不是vm? render函数被谁调用就是谁； this是谁就从谁的上面取_c _v _s
  let render = `with(this){return ${code}}`;
  let renderFn = new Function(render);
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
