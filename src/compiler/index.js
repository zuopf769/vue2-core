// 标签名：第一个字符+后面的字符；第一个字符不能以数字开头
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
// (?:${ncname}\\:)?
// 第一个?:表示匹配但是不记住匹配项；
// 为啥不要记住匹配性，因为需要加()分组后表示前面一半是命名空间可有可无，但是又不想铺获$1的值
// https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Guide/Regular_expressions#special-non-capturing-parentheses
// (?:${ncname}\\:)? 第二个？表示可有可无
// 外面的分组
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;

// 注意前面的开头^，必须是开始匹配
// <_xxx 自定义标签
// <xxx
// <namespace:yyy 命名空间
const startTagOpen = new RegExp(`^<${qnameCapture}`); // 标签开头的正则 捕获的内容是标签名
// console.log(startTagOpen);

// 注意前面的开头^，必须是开始匹配
// 匹配到的是</xxx>
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`); // 匹配标签结尾的 </div>
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
const attribute =
  /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/; // 匹配属性的
// 第一个分组就是属性的key value就是分组3/分组4/分组5
console.log(attribute);

// 注意前面的开头^，必须是开始匹配
// <div> <br/> 标签结束可能是> 也可能是/>
const startTagClose = /^\s*(\/?)>/; // 匹配标签结束的 >

const defaultTagRE = /\{\{((?:.|\r?\n)+?)\}\}/g; // {{aaaaaa}} 匹配到的时候表达式的变量

function start(tagName, attrs) {
  console.log(tagName, attrs);
}

function end(tagName) {
  console.log(tagName);
}

function chars(text) {
  console.log(text);
}

// 对模版进行编译
// vue3不是采用的正则匹配了，是一个一个字符匹配
function parseHTML(html) {
  // html字符串前进n个字符：例如截掉已经捕获到的开头标签名、属性名和属性值、结束标签
  function advance(n) {
    html = html.substring(n);
  }

  // 解析开始标签，包括解析标签名和所有属性
  function parseStartTag() {
    // 匹配开始标签名
    const start = html.match(startTagOpen);
    if (start) {
      const match = {
        tagName: start[1],
        attrs: [],
      };

      // html字符串截掉tagName
      // start[0] =>
      advance(start[0].length);

      // 捕获当前标签的所有属性
      let attr, end;
      // 当前捕获到了属性标签并且不是当前标签的结束
      while (
        !(end = html.match(startTagClose)) &&
        (attr = html.match(attribute))
      ) {
        match.attrs.push({
          name: attr[1],
          value: attr[3] || attr[4] || attr[5],
        });
        // attr[0] => id="app"
        advance(attr[0].length);
      }

      // html字符当前到了当前标签的结束位置 > 或者 />
      if (end) {
        // 移除结束位置
        advance(end[0].length);
        // 返回匹配到的当前节点
        return match;
      }
    }
  }

  while (html) {
    let textEnd = html.indexOf("<");
    // 当前html字符串处于开头标签处
    if (textEnd === 0) {
      // 解析开始标签：<div a=b c=d>
      const startTagMatch = parseStartTag();
      if (startTagMatch) {
        start(startTagMatch.tagName, startTagMatch.attrs);
        // 继续解析当前标签下的子开头标签
        // 例如<div a=b c=d><span>txt</span></div>中的下一个标签是<span>
        continue;
      }

      // 解析到最深的子节点的结束标签
      // 例如<div a=b c=d><span>txt</span></div>中的</span>
      const endTagMatch = html.match(endTag);
      if (endTagMatch) {
        advance(endTagMatch[0].length);
        end(endTagMatch[1]);
        continue;
      }
      // 先让他暂停
      // break;
    }

    // 当前html字符串处于文本标签处，因为结束标签>的index>0
    let text;
    if (textEnd > 0) {
      text = html.substring(0, textEnd);
    }
    if (text) {
      advance(text.length);
      chars(text);
    }
  }
}

export function compileToFunctions(template) {
  console.log(template);

  // 1. 将template转换成AST语法树
  // 2. 生成render方法，render方法执行后返回的结果就是虚拟DOM

  parseHTML(template);

  return function () {};
}
