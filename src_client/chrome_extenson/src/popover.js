var miTab, miTabObj,  bg, backgroundjs = null;
var asociated, connected = false;
var asociatedPort = -1;
var serverWatchers = [];
var serverWatchersStored = [];
var miNodeData = null


//OnOpen (click)___________________________________________
chrome.tabs.getSelected(null, function(tab) {
	if (tab !== null){
		bg = chrome.extension.getBackgroundPage();
		if (bg !== null){
			miTab = tab;
			backgroundjs = bg.backgroundjsObj;
			console.log('backgroundjs.connected: ' +backgroundjs.connected());
			if (!backgroundjs.isValidTag(tab)) {
				alert ('This is not a valid tab');
				self.close();
				return;
			};
			if (!backgroundjs.connected()){
				backgroundjs.startmegaServer(function (status) {
					if (status === null){
						console.log('fail');
						location.reload();
					}
					console.log(status);
					if (status){
						console.log('conecto-1');
						conecto(miTab);
					}else{
						console.log('fail');
						location.reload();
					}
				});
			}else{
				console.log('conecto-2');
				conecto(miTab);
			}
		}
	}
});



//conecto___________________________________________
function conecto(tab){
	asociated = backgroundjs.getTabsStatusAsoc(tab);
	asociatedPort = backgroundjs.getTabPort(tab);
	miTabObj = backgroundjs.getTabbyId(tab.id);
	serverWatchers = backgroundjs.serverWatchers();
	console.log(serverWatchers);
	serverWatchersStored = backgroundjs.serverWatchersStored();
	connected = backgroundjs.checkTabisConnected(tab);
	onPopUpOpen();
}


//openBox___________________________________________
function openBox(indx, timeClose){
	if (!timeClose) timeClose = 300;
	$('.boxIn').slideUp({duration:timeClose, easing:"easeOutExpo"});
	$('.boxIn').eq(indx).stop().slideDown({duration:300, easing:"easeOutExpo"});
	$('.box').removeClass('active');
	$('.box').eq(indx).addClass('active');
}


//openPopUp___________________________________________
function onPopUpOpen(){
	$('.loader').hide();
	$('.infoBlock').hide();


	$('ttl').click(function () {
		var index = $('ttl').index(this);
		console.log(index);
		openBox(index,0);
	});


	$('body').css('height', 'inherit');


	if (!asociated){
		$('#asociated').slideDown({duration:200, easing:"easeOutExpo"});



		// LISTA SERVERS ACTIVOS___________________________________
		if (serverWatchers.length >0){
			console.log(serverWatchers);
			for (var i = serverWatchers.length - 1; i >= 0; i--) {
				$('.ActiveServers ul').append('<li><a class="activeServer" href="#" data-miname="'+serverWatchers[i].name+'" data-miport="'+serverWatchers[i].port+'">' + serverWatchers[i].name + '</a></li>' );
			}
			//CLICK EN ACTIVO
			$('.activeServer').click(function () {
				if (!backgroundjs.connected()){
					location.reload();
				}
				miMport = $(this).attr('data-miport');
				miName = $(this).attr('data-miname');
				asociated = backgroundjs.updatetabs2refresh(miTab, miMport);
				self.close();
			});
		}else{
			$('.ActiveServers').hide();
		}



		// LISTA SERVERS STOREADOS___________________________________
		if (serverWatchersStored.length >0){
			for (var i = serverWatchersStored.length - 1; i >= 0; i--) {
				var miOldWadtcher = serverWatchersStored[i]
				console.log(miOldWadtcher);
				$('.WatchersStored ul').append('<li><a class="WatcherStored" href="#" data-indexObj='+i+' data-miname="'+serverWatchersStored[i].name+'" >' + serverWatchersStored[i].name + '</a></li>' );
			}
			//CLICK EN ACTIVO
			$('.WatcherStored').click(function () {
				if (!backgroundjs.connected()){
					location.reload();
				}
				miindexObj = $(this).attr('data-indexObj')
				miObj = serverWatchersStored[miindexObj]
				console.log(miObj);
				backgroundjs.createWebRefresServer(miObj, function(status, message){
					if (status){
						if (message.error){
							//RECIBE UN ERROR
							alert ("Error: " + message.errorTxt);
							self.close();
							return false;
						}
						if (message.created){
							//RECIBE UN OK
							console.log(status + ' / ' + message.name+ ' / ' + message.port);
							asociated = backgroundjs.updatetabs2refresh(miTab, message.port);
							self.close();
						}
					}else{
						alert ("Status False");
						self.close();
					}
				});
			});
		}else{
			$('.WatchersStored').hide();
		}


		//NEED SCROLL?
		if ($('.ScrollBox li').size() > 4) {
			$('.ScrollBox').addClass('custom_scrollbar');
		}
		if ($('.ScrollBox li').size() > 0) {
			openBox(0);
		}else{
			$('.watchers_ready').hide();
			openBox(1);
		}






		// NUEVO SERVER___________________________________
		$('.createWatcherForm').click(function () {
			//TODO: Validar todos los datos
			var name = $('.inputName').val();
			var path = $('.inputPath').val();
			var igno = $('.inputIgnore').val();
			var only = $('.inputOnly').val();


			if (path ===null || path ===undefined || path.length <2){
				alert ('Please enter a path');
				return;
			}
			if (name ===null || name ===undefined || name.length <1){
				alert ('Please enter a name');
				return;
			}
			if (igno !== null && igno !== undefined){
				if (igno.length>0){
					igno = igno.split(', ').join(',');
					igno = igno.split(' ,').join(',');
					igno = igno.split(',');
				}
			}
			if (only !== null && only !== undefined){
				if (only.length>0){
					only = only.split(', ').join(',');
					only = only.split(' ,').join(',');
					only = only.split(',');
				}
			}

			if (only === "" && igno=== "" ){
				only = ".php, .html, .htm, .js, .css"
			};

			var Poptions = {path2watch:path, name:name, ignore:igno, only:only};
			console.log(Poptions);
			backgroundjs.createWebRefresServer(Poptions, function(status, message){
				if (status){
					if (message.error){
						//RECIBE UN ERROR
						alert ("Error: " + message.errorTxt);
						self.close();
						return false;
					}
					if (message.created){
						//RECIBE UN OK
						console.log(status + ' / ' + message.name+ ' / ' + message.port);
						asociated = backgroundjs.updatetabs2refresh(miTab, message.port);
						self.close();
					}
				}else{
					alert ("Status False");
					self.close();
				}
			});
		});

}else{
		//DESCONECTAR___________________________________
		if (connected){
			//$('.AsociationInfo').append(' //C');
		}
		$('#no_asociated').show();

		/*INFO NAME*/
		var miName = null;
		console.log(serverWatchers.length);
		for (var j = serverWatchers.length - 1; j >= 0; j--) {
			serverWatchers[j].name
			if (serverWatchers[j].port == asociatedPort){
				miName = serverWatchers[j].name;
			}
		}
		if (miName === null) miName = 'Port:' + asociatedPort;
		$('.AsociationInfo .miName').html(miName);


		//SETEA EL SLIDER
		var inj = miTabObj.obj.inject
		console.log('inj: ' + inj);
		$('#slideThree').attr('checked', inj)


		$('#no_send').click(function(){
			asociated = backgroundjs.removetabs2refresh(miTab,$('#port').val());
			self.close();
		});
	}
}
