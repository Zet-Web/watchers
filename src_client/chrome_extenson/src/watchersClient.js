/*
<script src="js/faye-browser.js"></script>
<script src="js/watchersClient.js"></script>
<script type="text/javascript">listenAndRefresh()</script>
*/

function listenAndRefresh(options){

	var listener;
	var subscription;
	var fayeClientObj_ = {test:true};
	var connected = false;

	this.defaultOptions = {};
	options = JSextend({
		server: 'http://localhost',
		port : '35730',
		channel : 'change',
		onConected: function (data){console.log('Conected: last change:' + data.ver + ' - ' + data.name);},
		onChangeFire: function (data){location.reload();},
		onDisconnect: function (){console.log('disConected');},
		onError: function (){console.log('Error');}
	}, options || {});

	this.fayeClientObj = function(){ return fayeClientObj_;};
	this.getState = function(){ return connected;};

	this.sendMsg = function(message){
		if (!connected) return;
		listener.publish('/'+options.channel+"toServer", message);
	};

	this.disconect = function(callbackDis){
		if (!listener) return;
		listener.disconnect();
		listener = null;
		subscription = null;
		fayeClientObj_ = null;
		connected = false;
		if (callbackDis) callbackDis();
	};

	function connect_(){
		if (connected) return;
		console.log('listenAndRefresh Ver 0.3.30');
		listener = new Faye.Client(options.server+':'+options.port+'/' , {});
		subscription = listener.subscribe('/'+options.channel, function(message) {
			connected = true;
			if (message.init) {options.onConected(message);}
			if (message.refresh) options.onChangeFire(message);
		});
		listener.bind('transport:down', function() {
			connected = false;
			options.onDisconnect(options.port);
		});
		subscription.errback(function(error) {
			connected = false;
			options.onError(options.port);
		});
		listener.bind('transport:up', function() {
			if (!true) console.log('Conected2');
		});
		subscription.callback(function() {
			if (!true) console.log('Conected');
		});
		fayeClientObj_ = listener;
	}

	connect_();
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