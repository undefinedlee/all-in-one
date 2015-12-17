var fs = require("fs");
var path = require("path");
var hex = require("./hex");
var deps = require("./deps");
var template = fs.readFileSync(path.join(__dirname, "template.js"), "utf8");
var modTemplate = fs.readFileSync(path.join(__dirname, "mod-template.js"), "utf8");

/**
	config 配置
	{
		// 打包完释放到全局的变量名
		name: "AllInOne",
		// 入口文件
		main: "index.js"
	}
 */
module.exports = function(config, callback){
	var rootDir = fs.realpathSync(".");
	var mainfile = path.join(rootDir, config.main);
	var index = 0;
	var waitCount = 0;
	var codeList = [];
	var codeHash = {};

	function read(filepath){
		if(codeHash[filepath]){
			return;
		}

		waitCount ++;

		var index = codeList.length;
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
				content: deps.replace(code, dir, codeHash)
			};

			if(-- waitCount === 0){
				callback(template.replace(/\{\{(body|globalName)\}\}/g, function(all, key){
					return {
						body: codeList.map(function(code, index){
							return "\n// " + filepath.replace(rootDir, "") + "\n" + modTemplate.replace(/\{\{(body|modId)\}\}/g, function(all, key){
								return {
									modId: code.id,
									body: code.content
								}[key];
							});
						}).join("\n"),
						globalName: config.name
					}[key];
				}));
			}
		});
	}

	read(mainfile);
};