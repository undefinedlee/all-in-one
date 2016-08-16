# all-in-one
指定入口文件，将遵循commonjs规范的所有依赖文件打包进一个文件中（常用于浏览器端框架文件的打包）

## 安装
```bash
npm install all-in-one
```
## 使用
```javascript
var allInOne = require("all-in-one");

allInOne({
    // 入口目录[可选，如果没有设置则是当前命令所在目录]，读取入口目录下的package.json文件，获取打包入口文件、名称、版本等信息
    "src": "src",
    // 打包后的目录[可选]
    "dist": "dist"
}, function(code){ // 打包完之后的回调函数[可选]
    // 打包后的源代码
    console.log(code);
});
```
