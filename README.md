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
    "name": "XXX",
    "main": "index.js"
}, function(code){
    console.log(code);
});
```
