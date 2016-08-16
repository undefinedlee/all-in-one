var fs = require("fs");
var path = require("path");
var deps = require("./deps");
var lazylist = require("./lazylist");
var template = fs.readFileSync(path.join(__dirname, "template.js"), "utf8");
var modTemplate = fs.readFileSync(path.join(__dirname, "mod-template.js"), "utf8");

// 替换开头的分隔符
var prefixSepReg = new RegExp("^\\" + path.sep);

// 获取count个TAB键
function getTab(count){
	return new Array(count + 1).join("	");
}

module.exports = function(config, callback){
	var projectPath = config.src || fs.realpathSync(".");

	packageJsonFile = path.join(projectPath, "package.json");
	// 如果不存在package.json文件，返回
	if(!fs.existsSync(packageJsonFile)){
		console.error("");
		return;
	}
	// 项目配置信息
	var packageJson = JSON.parse(fs.readFileSync(packageJsonFile, {
		encoding: "utf8"
	}).replace(/\/\/.*[\n\r\t]/g, ""));

	// 入口文件
	var projectName = packageJson.name;
	var main = path.join(projectPath, packageJson.main || "index.js");
	var version = packageJson.version;

	// 打包后的文件目录
	var dist = config.dist;
	// 读文件方法
	var readFile = config.readFile || fs.readFile;
	// 入口文件所在目录
	var rootDir = path.dirname(main);

	// 注入方法列表
	var injectors = [];
	// 模块列表
	var modList = [];
	// 模块序列号
	var modIndex = 0;
	// 模块名与序列名的映射
	var modIdHash = {};
	// 模块状态
	var modStatus = {};

	function read(filepath, complete){
		var status;

		if(status = modStatus[filepath]){
			if(status.completed){
				complete();
			}else{
				status.readyList.push(complete);
			}
			return;
		}

		// 生成模块序列ID
		var modId = modIndex ++;
		modIdHash[filepath] = modId;

		// 初始化模块状态
		status = modStatus[filepath] = {
			completed: false,
			readyList: [complete]
		};

		// 不带后缀的文件默认为js文件
		var ext = path.extname(filepath);
		readFile(filepath + (ext ? "" : ".js"), function(err, code, _injectors){
			if(err){
				throw err;
			}

			if(_injectors){
				_injectors.forEach(function(injector){
					if(injectors.indexOf(injector) === -1){
						injectors.push(injector);
					}
				});
			}

			code = code.toString("utf8");

			var dir = path.dirname(filepath);
			// 获取依赖
			var _deps = deps.get(code, dir);
			lazylist(_deps.map(function(dep){
				return function(callback){
					read(dep, callback);
				};
			}), function(){
				// 依赖模块全部完成之后将当前模块推入模块列表
				modList.push({
					id: modId,
					path: filepath,
					content: deps.replace(code, dir, modIdHash)
				});
				status.readyList.forEach(function(fn){
					fn();
				});
				status.completed = true;
			});
		});
	}

	read(main, function(){
		var data = {
				body: modList
						.sort(function(a, b){
							return a.id - b.id;
						})
						.map(function(code, index){
							return "\n" + getTab(2) + "// " + code.path.replace(rootDir, "").replace(prefixSepReg, "") + "\n" + modTemplate.replace(/\{\{(body)\}\}/g, function(all, key){
								return {
									body: code.content.split("\n").join("\n" + getTab(3))
								}[key];
							});
						}).join(",\n"),
				bundleId: projectName + "@" + version,
				injectors: injectors.map(function(injector){
					return injector.split("\n").join("\n" + getTab(1));
				}).join("\n")
			};

		var code = template.replace(/\{\{(body|bundleId|injectors)\}\}/g, function(all, key){
			return data[key];
		});

		if(dist){
			fs.writeFile(path.join(dist, data.bundleId), code, function(err){
				if(err){
					throw err;
				}
			});
		}
		callback && callback(code);
	});
};