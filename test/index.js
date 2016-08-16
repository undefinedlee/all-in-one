var fs = require("fs");
var path = require("path");
var allinone = require("../index");

allinone({
	src: path.join(fs.realpathSync("."), "src"),
	dist: path.join(fs.realpathSync("."), "dist")
});