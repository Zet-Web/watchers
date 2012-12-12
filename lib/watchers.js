//Ver: https://github.com/bevry/watchr
var serverWatchers = [];
var serverWatchersMin = [];
var megaServer = null;
var megaServerTrans = null;
var megaServerIns = null;
var connectedIns  = false;
var Faye   = require('faye');
var portscanner = require('portscanner');
var fs = require('fs');
var watch = require('./watch-k');
var serverDefaultChannel = "root";
var serverPort = 35729;
var lastPort = serverPort+1;



//START_____________________________________________
exports.watchers = function(path2watch, ignore, only, watch_interval, inject, name){
	console.log("\nwatchers v0.3.30");

	var watcherOptions =
	{
		path2watch:path2watch,
		ignore:ignore,
		only:only,
		port:lastPort,
		watch_interval:watch_interval,
		inject:inject,
		name:name
	};


	//VARS OPT
	portscanner.findAPortNotInUse(serverPort, serverPort, 'localhost', function(error, portAvaiable) {
		if (portAvaiable == serverPort){
			addMegaServer({port:serverPort});
			lastPort = serverPort + 1;
			if (path2watch!==null){
				setTimeout(function() {
					addServerWatcher (watcherOptions);
				}, 50);
			}
		}else{
			/*MegaServer ya creado*/
			if (path2watch!==null){
				megaServerIns = new Faye.Client("http://localhost" + ':'+'35729'+'/' , {});
				megaServerIns.subscribe('/'+ serverDefaultChannel, function(message) {
					if (message.init) {
						if (!connectedIns){
							connectedIns = true;
							console.log('\n[MegaServerConnected] ___________________');
							megaServerIns.publish('/'+serverDefaultChannel+"toServer",  {action:'createWatchers', options:watcherOptions});
						}
					}
				});
				megaServerIns.subscribe('/'+ serverDefaultChannel +"/serverCreatedOk", function(message) {
					console.log('\n[Watcher ' + watcherOptions.name  + ' , created sucessfully in other instance, bye!]');
					process.exit(code=0);
				});
			}
		}
	});
};




//ADDSERVER___________________________________________________
function addMegaServer(options){

	if (megaServer !== null) return;

	//VARS OPT
	var port = options.port;
	serverPort = port;

	megaServer = new Faye.NodeAdapter({mount: '/'});
	megaServerTrans = new Faye.Client("http://localhost" +':'+ port +'/');
	megaServerTrans.publish('/'+serverDefaultChannel,  {port:port});

	megaServer.bind('subscribe', function(clientId) {
		console.log('\n[MEGASERVER SUBSCRIBE]' + clientId );
		megaServerTrans.publish('/'+serverDefaultChannel,  {port:port, init:true, server_version:"v0.3.30"});
	});

	megaServerTrans.subscribe('/'+serverDefaultChannel+"toServer", function(message) {
		if (message === null) return;
		if (!true){
			console.log('\nMEGASERVER Get msg:');
			console.log(message);
		}
		if (message.action == 'Hi'){
			console.log('Hi');
		}
		if (message.action == 'getWatchers'){
			sendWatchers();
		}
		if (message.action == 'createWatchers'){
			createWatcher(message.options);
		}
	});

	megaServer.listen(port);
}

function sendWatchers(){
	if (megaServerTrans !== null){
		megaServerTrans.publish('/'+serverDefaultChannel,  {port:serverPort, init:false, action:'getWatchers', serverWatchers:serverWatchersMin});
	}
}
function createWatcher(options){
	if (true){
		console.log('\n______________ create Watcher [external]:');
		console.log(options);
		console.log('\n');
	}
	options.port = lastPort;
	addServerWatcher(options);
}


//ADDSERVER-WATCHER____________________________________________
function addServerWatcher(options){
	/*VALIDACIONES DE PATH*/
	if (options.path2watch === null || options.path2watch === undefined || options.path2watch === "") {
		if (megaServerTrans !=- null ){
			megaServerTrans.publish('/'+serverDefaultChannel+"/serverCreatedError",  {error:'path', errorTxt:'Please enter a path', init:false, created:false});
		}
		return;
	}
	if (!fs.existsSync(options.path2watch)){
		if (megaServerTrans !=- null ){
			megaServerTrans.publish('/'+serverDefaultChannel+"/serverCreatedError",  {error:'path', errorTxt:'Please write a correct path', init:false, created:false});
		}
		return;
	}
	lastPort ++;
	if (options.name === null || options.name === undefined || options.name === '') options.name = String ('watcher-port' + options.port);
	serverWatchers.push(new serverWatcher(options));
	serverWatchersMin.push(options);
	sendWatchers();
}



//SERVER WATCHER______________________________________________
function serverWatcher(options){

	//VARS OPT
	var name = options.name;
	var port = options.port;
	var path2watch = options.path2watch;

	var ignore = options.ignore;
	var only = options.only;
	var watch_interval = options.watch_interval;
	var defaultChannel = options.defaultChannel;
	var inject = options.inject;
	//VARS INT
	var versionChange = 0;
	var lastName = '';
	var server;
	var FayeSenderListener;


	if (name === null || name === undefined) return;
	if (name=='') {name = 'watcher-port' + String(port);};
	//TODO: Validar que el nombre no exista
	if (port === null || port === undefined) return;
	if (path2watch === null || path2watch === undefined) return;
	/**/
	if (ignore === null || ignore === undefined) ignore = [];
	if (only === null || only === undefined) only = [];
	if (watch_interval === null || watch_interval === undefined) watch_interval = 500;
	if (defaultChannel === null || defaultChannel === undefined) defaultChannel = 'change';
	if (inject === null || inject === undefined) inject = false;


	//GETTERS
	this.name = function(){ return name;};
	this.path2watch = function(){ return path2watch;};
	this.ignore = function(){ return ignore;};
	this.only = function(){ return only;};
	this.port = function(){ return port;};
	this.watch_interval = function(){ return watch_interval;};
	this.defaultChannel = function(){ return defaultChannel;};
	this.inject = function(){ return inject;};



	if (true){
		console.log("\n\n_______________________________________________________________");
		console.log("\n  [NEW WATCHER] name: "+ name +" / in port: " + port);
		console.log("_______________________________________________________________\r");
		console.log("Path:    " + path2watch);
		console.log("Name:    " + name);
		console.log("Ignore:  " + ignore);
		console.log("Only:    " + only);
		console.log("TimeInt: " + watch_interval +"ms");
		console.log("Channel: " + defaultChannel);
		console.log("Inject:  " + inject);
		console.log("________________________________________________________________\n\n");
	}

	var options4save = {
		name:name,
		path2watch:path2watch,
		ignore:ignore,
		only:only,
		watch_interval:watch_interval,
		inject:inject
	}


	server = new Faye.NodeAdapter({mount: '/'});
	FayeSenderListener = new Faye.Client("http://localhost" +':'+ port +'/');
	FayeSenderListener.publish('/'+defaultChannel,  {ver:versionChange, port:port, options4save:options4save, injectcss:null, refresh:false, init:true,  name:lastName});
	FayeSenderListener.subscribe('/'+defaultChannel+"toServer", function(message) {
		if (message === null) return;
		console.log("\n\n_________________________________");
		console.log("\nWatcher msg recive: Watcher name: "+ name +" / in port: " + port + ' / Msg:');
		console.log(message);
		console.log("_________________________________\n\n");
		if (message.action == 'inject'){
			inject = true;
		}
	});
	server.bind('subscribe', function(clientId) {
		console.log('\n		[WServer SUBSCRIBE]' + clientId +  " | watcher name: "+ name +" / in port: " + port);
		FayeSenderListener.publish('/'+defaultChannel,  {ver:versionChange, port:port, options4save:options4save, injectcss:null, refresh:false,  init:true, name:lastName});
	});

	server.listen(port);


	/*IGNORES & ONLYS ________________________________*/
	var mifilter;
	mifilter = function ($path, $stats, $name){

		var encontroIgn = false;
		if (ignore !== null){
			for (var i = 0; i < ignore.length; i++) {
				if ($path.indexOf(ignore[i]) !== -1){
					encontroIgn = true;
					break;
				}
			}
		}

		var useOnly = false;
		var encontroOnly = false;
		if (only !== null){
			if (only.length >0){
				useOnly = true;
				for (var j = 0; j < only.length; j++) {
					if ($path.indexOf(only[j]) != -1){
						encontroOnly = true;
						break;
					}
				}
			}
		}

		if (useOnly){
			if (encontroIgn===true) return true;
			return !encontroOnly;
		}
		if (encontroIgn===false) return false;
		return true;
	};


	/*WATCH________________________________*/
	function StartWatch(){

		console.log('		Starting Server >> Watching path: ' + path2watch);
		setTimeout(function() {
			if (megaServerTrans !== null ){
				megaServerTrans.publish('/'+serverDefaultChannel+"/serverCreatedOk",  {name:name, port:port, path2watch:path2watch, init:false, created:true});
			}
		}, 10);


		//TODO: Si path2watch es un file destriparlo y usar el only
		watch.watchTree(path2watch, {filter:mifilter, interval:watch_interval}, function(f, curr, prev) {
			if(typeof f == "object" && prev === null && curr === null) {
				/* Finished walking the tree */
			} else if(prev === null) {
				//sendChanges(f);
			} else if(curr.nlink === 0) {
				//sendChanges(f);
			} else {
				sendChanges(f);
			}
		});
	}


	/*SENDCHANGES________________________________*/
	function sendChanges($name){

		if ($name === null) return;
		console.log("\n");
		console.log("	New change in watcher name: "+ name +" / in port: " + port);
		console.log('	File Change:' + $name);
		console.log('	'+new Date());

		lastName = $name;
		console.log('	Emit Refresh - Change Number: ' + versionChange);


		/*New*/
		if (lastName.indexOf('.css') && inject){
			fs.readFile(lastName, 'utf8', function (err,data) {
				if (err) {
					return console.log(err);
				}
				if (FayeSenderListener)	FayeSenderListener.publish('/'+defaultChannel, {ver:versionChange, init:false, refresh:true, port:port, injectcss:data, name:lastName});
			});
		}else{
			if (FayeSenderListener)	FayeSenderListener.publish('/'+defaultChannel, {ver:versionChange, init:false, refresh:true, port:port, injectcss:null,  name:lastName});
		}


		versionChange++;
		console.log("\n");
	}


	/*START________________________________*/
	StartWatch();
}



//________________________________________________________
// helper function to "extend" the 'b' object from 'a'
// by copying its properties
//________________________________________________________
function JSextend(a, b) {
	for ( var prop in b ) {
		a[prop] = b[prop];
	}
	return a;
}
//________________________________________________________

