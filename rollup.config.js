import babel from 'rollup-plugin-babel';

export default {
    input: './src/index.js',// 入口
    output: {
        file: './dist/vue.js', // 出口
        name: 'Vue', // global.Vue
        format: 'umd', // esm es6模块 commonjs模块 iife自执行函数 umd(commonjs、amd)
        sourcemap: true, // 希望可以调试源代码
    },
    plugins: [
        babel({
            exclude: 'node_modules/**' // 排除node_modules下的任意文件夹和文件
        })
    ]
}