;define("{{bundleId}}", function(__global_require__, exports, module){
	function __require__(id){
		var factory = mods[id];
		var module;

		if(!factory.isInitialized){
			module = {exports: {}};
			factory(__require__, module.exports, module);
			factory.exports = module.exports;
			factory.isInitialized = true;
		}

		return factory.exports;
	}

	__require__.async = __global_require__.async;

	{{injectors}}
	
	var mods = [{{body}}];

	module.exports = __require__(0);
});