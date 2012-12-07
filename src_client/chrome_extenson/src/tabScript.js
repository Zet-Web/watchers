(function () {

	var tiroHi = false;
	var noRefreshThisCss = ["googleapis", "edgefonts", "chrome-extension"];



	//reloadStylesheets
	//___________________________________________________
	function reloadStylesheets() {
		console.log('	reloadStylesheets');
		var queryString = '?reload=' + new Date().getTime();

		$('link[rel="stylesheet"]').each(function () {
			var sThis = this;
			var encontro = false;

			//Se fija que el css no esté en una WhiteList
			//TODO: en lugar de una blackList podría fijarse que coincida el path del css con el del html
			for (var i = noRefreshThisCss.length - 1; i >= 0; i--) {
				if (String (sThis.href).indexOf(String(noRefreshThisCss[i])) !== -1 ){
					encontro = true;
					break;
				}
			}

			if (!encontro){
				console.log('		Refresh: ' + String (sThis.href));
				sThis.href = sThis.href.replace(/\?.*|$/, queryString);
			}

		});
	}



	//onMessage
	//___________________________________________________
	chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {

		//Hi______________________________
		if (request.action =="Hi"){
			if (tiroHi) return;
			console.log("watchers tabScript 0.3.26, jquery version: " + $().jquery);
			console.log($('.test').text());
			tiroHi = true;
		}else{
			console.log("request.action:" + request.action);
		}


		//refreshFile______________________________
		if (request.action == "refreshFile"){
			var mifileChange = request.file.substring(request.file.lastIndexOf('/')+1);
			console.log("mifile:" + mifileChange + " | Path:" + request.file);

			//Si tiene inject inyecta
			if (request.dataChange.injectcss !== null){
				var miCss = request.dataChange.injectcss;
				$('.injectcss').remove();
				miCss = '<style class="injectcss" type="text/css" media="screen">'+miCss+'</style>';
				$('head').append(miCss);
				console.log("	injectedCss: "+ mifileChange);
				return;
			}

			//si un .css embebido refresca solo los .css
			var encontro = false;
			$('link[rel="stylesheet"]').each(function () {
				var hrefStfr = String (this.href);
				var CssFileElement = hrefStfr.substring(hrefStfr.lastIndexOf('/')+1);
				if (CssFileElement.indexOf(mifileChange) !== -1 && mifileChange.indexOf('.css') !== -1){
					console.log("	Match: "+CssFileElement + " - "+ mifileChange);
					reloadStylesheets();
					encontro = true;
					return;
				}
			});

			//No encontró, reload
			if (!encontro){
				console.log('reload1');
				location.reload();
			}
		}

		//reload______________________________
		if (request.action == "reload2"){
			console.log('reload');
			location.reload();
		}

	});

})();