var fs = require("fs");
var path = require("path");
var allinone = require("../index");

allinone({
	name: "xxx",
	main: path.join(fs.realpathSync("."), "src", "index.js"),
	dist: path.join(fs.realpathSync("."), "dist", "index.js")
});