var fs = require("fs");
var path = require("path");
var hex = require("./hex");
var deps = require("./deps");
var template = fs.readFileSync(path.join(__dirname, "template.js"), "utf8");
var modTemplate = fs.readFileSync(path.join(__dirname, "mod-template.js"), "utf8");

var prefixSepReg = new RegExp("^\\" + path.sep);

function getTab(count){
	return new Array(count + 1).join("	");
}

/**
	config 配置
	{
		// 打包完释放到全局的变量名
		name: "AllInOne",
		// 入口文件
		main: "/home/admin/xxx/index.js",
		// 要写入的文件
		dist: ""
	}
 */
module.exports = function(config, callback){
	var mainfile = config.main || path.join(fs.realpathSync("."), "index.js");
	var distfile = config.dist;
	var modName = config.name || "AllInOne";
	var rootDir = path.dirname(mainfile);
	var index = 0;
	var waitCount = 0;
	var codeList = [];
	var codeHash = {};

	function read(filepath){
		if(codeHash[filepath]){
			return;
		}

		waitCount ++;

		var index = codeList.push(null) - 1;
		var modId = codeHash[filepath] = hex(index);

		fs.readFile(filepath, function(err, code){
			if(err){
				throw err;
			}

			code = code.toString("utf8");

			var dir = path.dirname(filepath);
			var _deps = deps.get(code, dir);
			_deps.forEach(read);

			codeList[index] = {
				id: modId,
				path: filepath,
				content: deps.replace(code, dir, codeHash)
			};

			if(-- waitCount === 0){
				(function(code){
					if(distfile){
						fs.writeFile(distfile, code, function(err){
							if(err){
								throw err;
							}
						});
					}
					callback && callback(code);
				})(template.replace(/\{\{(body|globalName)\}\}/g, function(all, key){
					return {
						body: codeList.map(function(code, index){
							return "\n" + getTab(1) + "// " + code.path.replace(rootDir, "").replace(prefixSepReg, "") + "\n" + modTemplate.replace(/\{\{(body|modId)\}\}/g, function(all, key){
								return {
									modId: code.id,
									body: code.content.split("\n").join("\n" + getTab(2))
								}[key];
							});
						}).join("\n"),
						globalName: modName
					}[key];
				}));
			}
		});
	}

	read(mainfile);
};