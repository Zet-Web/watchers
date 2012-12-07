//main.js
(function() {

	//ARGS ___________________________________
	var argv = require('optimist').usage('\nUsage: watchers <path>')
	.alias('i', 'ignore')	.describe('i', 'Ignore string matchs in file-names, ej: <.sass> or <robots.txt> | Multiple -i accepted')
	.alias('o', 'only')		.describe('o', 'only accept files-names match whit this string, ej: <.css> or <main.css>  | Multiple -o accepted')
	// .alias('p', 'port')		.describe('p', 'port').default('p', 35729)
	.alias('n', 'name')	.describe('n', 'Name of watcher').default('n', 'miWatcher')
	.alias('t', 'time')		.describe('t', 'Time (ms.) interval to re-check three changes').default('t', 500)
	.alias('j', 'inject')	.describe('j', 'Inject .css files').default('j', false)
	.alias('h', 'help')		.describe('h', 'this help')
	.argv;


	//PRINT HELP______________________________
	if(argv.h) {
		require('optimist').showHelp();
		return;
	}

	//IGNORE ARRAY______________________________
	var ignoreArray = [];
	if(argv.i) {
		var isArray = Object.prototype.toString.call( argv.i ) === '[object Array]';
		if (isArray){
			ignoreArray = argv.i;
		}
		else{
			ignoreArray.push(argv.i);
		}
	}


	//ONLY ARRAY______________________________
	var onlyArray = [];
	if(argv.o) {
		var isArray2 = Object.prototype.toString.call( argv.o ) === '[object Array]';
		if (isArray2){
			onlyArray = argv.o;
		}
		else{
			onlyArray.push(argv.o);
		}
	}


	//CheckPath______________________________
	var pathChecker = require('fs');
	if (process.argv[2] === undefined) process.argv[2] = null;
	if (process.argv[2] !== null){
		if (!pathChecker.existsSync(process.argv[2])) {
			console.log(process.argv[2] + " is not a valid path");
			require('optimist').showHelp();
			return;
		}
	}


	//Call webRefresh______________________________
	var webRef = require ('./watchers');
	webRef.watchers(
		process.argv[2],
		ignoreArray,
		onlyArray,
		argv.t,
		argv.j,
		argv.n
		);


}).call(this);