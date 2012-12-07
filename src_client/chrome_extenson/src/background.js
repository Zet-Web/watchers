/*$('head').append('<link rel="stylesheet" href="http://delicious.com/static/css/main.p.css?v=1091" type="text/css" />');*/
/*Experiment inject*/

var backgroundjsObj = new function backgroundjs(){

    console.log("watchers Background 0.3.26 | " + new Date());

    var tabs2refresh = [];
    var LastfireDate = new Date();
    var counter = 0;
    var statusStr;
    var init = false;
    var lastTabSelected = null;
    var deleteCache = true;
    var listeners  = [];
    var removeCacheInProcess = false;
    var megaServer = null;
    var megaServerTrans;
    var connected = false;
    var connectedInit = false;
    var serverWatchers = [];
    var optionsMegaServer = {};
    var CreateServer_callBack = null;

    //Public updatetabs2refresh
    this.getTabPort  = function(tab){ return getTabPort(tab);};
    this.getListanerbyPort  = function(port){ return getListanerbyPort(port);};
    this.getTabsStatusAsoc = function(tab){ return Boolean (getTabPort(tab)>0);};
    this.checkTabisConnected = function(tab, tabport){ return checkTabisConnected(tab);};
    this.updatetabs2refresh = function(tab, tabport){ return _updatetabs2refresh(tab, tabport);};
    this.removetabs2refresh = function(tab, tabport){ return _removetabs2refresh(tab, tabport);};
    this.isValidTag  = function(tab){ return isValidTag(tab);};
    this.sendMessageToServer = function(port, message){ return sendMessageToServer(port, message);};
    this.serverWatchers  = function(){ return serverWatchers;};
    this.connected  = function(){ return connected;};
    this.createWebRefresServer  = function(options, $callBack){
        return (createWebRefresServer(options, $callBack));
    };
    this.startmegaServer  = function($callBack){
        startmegaServer({callBack:$callBack});
    };



    //ADDTABS__________________________________________
    function _updatetabs2refresh(tab, tabport){
        if (!isValidTag(tab)){
            return false
        };
        if (megaServer === null) return;
        if (tabport === null) {
            return false;
        }else{
            tabport = Number(tabport);
        }

        var miTab = getTabbyId(tab.id);

        if (!miTab.tab){
            var miObjTab = {tab:tab, port:tabport};
            tabs2refresh.push(miObjTab);
            SendHitoTabs(miObjTab.tab.id, tabport);
            console.log("\nAddTab: " + tab.id + " port: " + miObjTab.port);
            initRefreshCheck(tabport);
            checkIcon();
            return true;
        }
    }
    //REMOVE__________________________________________
    function _removetabs2refresh(tab, tabport){
        tabDesasociate(tab.id, null);
    }



    //STARTMEGASERVER
    //_____________________________________________________
    function startmegaServer (options) {

        if (megaServer !== null) return;
        var callBack = options.callBack;

        //TIME OUT
        setTimeout(function() {
            if (!connected){
                alert ('No server');
                if (callBack !== null) {
                    callBack(false);
                    callBack = null;
                }
                location.reload();
            }
        }, 5000);

        //var options = {};
        options.server = 'http://localhost';
        options.port = '35729';
        options.channel = 'root';
        console.log('   _______StartMegaserver_______');

        optionsMegaServer = options;

        megaServer = new Faye.Client(options.server+':'+'35729'+'/' , {});
        megaServerTrans = megaServer.subscribe('/'+options.channel, function(message) {
            if (message.init) {
                if (!connectedInit){
                    connected = true;
                    connectedInit = true;
                    console.log('\n[MegaServerConnected] ___________________');
                    megaServer.publish('/'+options.channel+"toServer",  {action:'getWatchers'});
                }
            }else{
                if (message.action == "getWatchers") {
                    connected = true;
                    // console.log('\nMegaServer serverWatchers:---------------');
                    serverWatchers = message.serverWatchers;
                    console.log('   GET serverWatchers OK');
                    // console.log('--------------------------------------\n');
                    if (callBack !== null) {
                        console.log('   SendCallback to popup');
                        callBack(true);
                        callBack = null;
                    }
                }
            }
        });
        megaServer.bind('transport:up', function() {
            connected = true;
            if (!true) console.log('\nMegaServerConnected 2-----------');
        });
        megaServer.subscribe('/'+optionsMegaServer.channel+"/serverCreatedError", function(message) {
            if (CreateServer_callBack !== null){
                CreateServer_callBack(true, message);
                CreateServer_callBack = null;
            }
        });
        megaServer.subscribe('/'+optionsMegaServer.channel+"/serverCreatedOk", function(message) {
            if (CreateServer_callBack !== null) {
                CreateServer_callBack(true, message);
                CreateServer_callBack = null;
            }
        });
        megaServer.bind('transport:down', function() {
            connected = false;
            location.reload();
        });
        megaServerTrans.errback(function(error) {
            connected = false;
            location.reload();
        });
    }
    /**/
    function createWebRefresServer($options, $callBack){
        callBack = $callBack;
        if (megaServer === null) {
            if (callBack !== null) {
                callBack(false);
                callBack = null;
                return;
            }
        }
        if (callBack !== null) {
            CreateServer_callBack = callBack;
        }
        megaServer.publish('/'+optionsMegaServer.channel+"toServer",  {action:'createWatchers', options:$options, callBack:$callBack });
    }


    //getListanerbyPort
    //_____________________________________________________
    function getListanerbyPort(port){
        listener = null;
        var i = 0;
        for (i = listeners.length - 1; i >= 0; i--) {
            if (Number (listeners[i].port) === Number (port)){
                listener = listeners[i];
                return {listener:listeners[i], index:i};
            }
        }
        return {listener:listener, index:i};
    }


    //getTabbyId
    //_____________________________________________________
    function getTabbyId(Id){
        tab = null;
        obj = null;
        var i = 0;
        for (i = tabs2refresh.length - 1; i >= 0; i--) {
            if (tabs2refresh[i].tab.id === Id){
                tab = tabs2refresh[i].tab;
                obj = tabs2refresh[i];
                break;
            }
        }
        return {tab:tab, index:i, obj:obj};
    }
    function getTabPort (tab){
        var MyStatus = -1;
        if (getTabbyId(tab.id).obj !== null) MyStatus = (getTabbyId(tab.id).obj.port);
        return MyStatus;
    }


    //ON Server emit refresh
    //_____________________________________________________
    function sendRefresh(tabId, FileChange, DataChange){
        //1
        removeCache(function(){sendRefreshScript(tabId, FileChange, DataChange);});
    }
    function sendRefreshScript(tabId, FileChange, DataChange){

        //2
        console.log("sendRefresh to: " + tabId);
        var miAction = "refreshFile"; /*"reload"*/ /*TODO: or other */
        chrome.tabs.sendMessage(tabId, {action: miAction, file: FileChange, dataChange: DataChange}, function(response) {
            //console.log("----response: " + response.dom);
        });
        setTimeout(function() { sendRefreshLog(tabId);}, 500);

    }
    function sendRefreshLog(tabId){
        //3
        chrome.tabs.executeScript(tabId, {code: 'console.log("'+statusStr+ " id: " + tabId+ '");'});
        checkIcon();
    }

    function ChangeFire(data){
        //0
        statusStr = "Refresh: ";
        statusStr += "ClientCounter: " + counter;
        statusStr += " - ServerCounter: " + data.ver;
        statusStr += " - FileName: " + String (data.name).split("\\").join('/');
        statusStr += " - D: " + new Date();
        statusStr += " - Port: " + data.port;
        console.log(statusStr + " - TabsListen: " + tabs2refresh.length);
        var FileChange = String (data.name).split("\\").join('/');
        var DataChange = data;

        var miListener =  getListanerbyPort(data.port).listener;
        if (miListener) miListener.conected = true;

        for (var i = 0; i < tabs2refresh.length; i++) {
            miTab = tabs2refresh[i].tab;
            miPort = tabs2refresh[i].port;
            if (isValidTag(miTab)) {
                if (data.port == miPort){
                    sendRefresh(miTab.id, FileChange, DataChange);
                }
            }
        }

        counter++;
    }
    function Conected(data){
        console.log('\n[Conected OK]: last change:' + data.ver + ' - ' + data.name + ' - ' + data.port);
        checkIcon();
        SendHitoTabs(null, data.port);
        if (true){
            console.log('data arg: __________________');
            console.log(data);
            console.log("______________________________________\n");
        }
        /**/
        var miListener =  getListanerbyPort(data.port).listener;
        if (miListener === null){
            console.log('NULL');
            return;
        }
        if (miListener) miListener.conected = true;
        if (true){
            console.log('\nmiListenerConected: / getState: ' + miListener.listener.getState() +' __________________');
            console.log(miListener);
            console.log("_____________________________________\n");
        }
        sendMessageToServer(data.port, {action:'Hi'});
    }
    function Disconnect(port){
        console.log('Disconected - port: ' + port);
        checkIcon();
        /**/
        var miListener =  getListanerbyPort(port).listener;
        if (miListener) miListener.conected = false;
        console.log('miListenerDisconnected: ');
        console.log(miListener);
    }
    function conectionError(port){
        alert ("No server - port: " + port);
        checkIcon();
        /**/
        var miListener =  getListanerbyPort(port).listener;
        if (miListener) miListener.conected = false;
        console.log('miListenerDisconnected: ');
        console.log(miListener);
        /**/
        setTimeout(function() {
            if (!true) location.reload();
        }, 10);

    }
    function initRefreshCheck(port){
        if (getListanerbyPort(port).listener !== null){
            return;
        }

        console.log("\r__________ Listener port: "+port+" Created! __________");

        var Milistener = {};
        Milistener.server = 'http://localhost';
        Milistener.port = port;
        Milistener.conected = false;
        Milistener.disconect = function (){disconect (Milistener.port);};

        Milistener.listener = new listenAndRefresh({
            server: Milistener.server,
            port : String (Milistener.port),
            onChangeFire: ChangeFire,
            onConected: Conected,
            onDisconnect: Disconnect,
            onError: conectionError
        });

        listeners.push(Milistener);
    }
    //------------------------------------------------------
    function disconect(port){
        var miListener =  getListanerbyPort(port).listener;
        if (miListener) {
            miListener.listener.disconect(function(){
                miListener.port = -1;
                miListener = null;
                console.log('[DISCONECT listener] - Port:' + port);
                console.log('____________________________________\n');
            });
        }
    }


    //sendMessageToServer
    //_____________________________________________________
    function sendMessageToServer(port, message){
        var miListener =  getListanerbyPort(port).listener;
        if (miListener) {
            miListener.listener.sendMsg(message);
        }
    }


    //Hi!
    //_____________________________________________________
    function SendHitoTabs(tabId, port) {
        if (tabId) {
            chrome.tabs.sendMessage(tabId, {action: "Hi"});
        }
        for (var i = 0; i < tabs2refresh.length; i++) {
            var miTab = tabs2refresh[i];
            if (miTab.port == port){
                chrome.tabs.sendMessage(miTab.tab.id, {action: "Hi"});
            }
        }
    }

    //isValidTag
    //_____________________________________________________
    function isValidTag(tab) {
        if (tab === null) return false;
        if (tab === undefined) return false;
        if (tab.url === null || tab.url === undefined) return false;
        if (tab.url.indexOf("chrome:") !== -1) return false;
        if (tab.id === null || tab.id === undefined) return false;
        if (tab.id>0 === false) return false;
        if (tab.url.length>0 === false)return false;
        return true;
    }



    // Change icon checker
    //_____________________________________________________
    function checkIcon() {
        setTimeout(checkIconDelayed, 100);
    }
    function checkIconDelayed() {
        if (!isValidTag(lastTabSelected)){
            chrome.browserAction.setIcon({path:'icon/icon-19.png'});
            return;
        }

        var miTab = getTabbyId(lastTabSelected.id);
        var isConected = checkTabisConnected(lastTabSelected);

        if (miTab.tab){
            if (isConected){
                /*OK*/
                chrome.browserAction.setIcon({path:'icon/icon-19_ok.png'});
                console.log("       [checkIcon] Mi tab id: " + lastTabSelected.id + " isConected: " + isConected);
            }else{
                /*Wait*/
                chrome.browserAction.setIcon({path:'icon/icon-19_wait.png'});
            }
        }else{
            /*NOP*/
            chrome.browserAction.setIcon({path:'icon/icon-19.png'});
        }
    }
    function checkTabisConnected(tab){
        var isConected = false;
        if (!isValidTag(lastTabSelected)) return isConected;
        var miTab = getTabbyId(tab.id);
        if (miTab.tab){
            var miTabPort = miTab.obj.port;
            var miListener = getListanerbyPort(miTabPort).listener;
            if (miListener) isConected = miListener.conected;
                //if (miListener) isConected = miListener.listener.getState()
            }
            return isConected;
        }


    // removeCache.
    //_____________________________________________________
    function removeCache($callBackParam){
        if (!deleteCache) {
            if ($callBackParam) $callBackParam();
            return;
        }
        if (removeCacheInProcess && $callBackParam){
            setTimeout($callBackParam, 100);
            return;
        }
        var callbackCache = function (data) {
            removeCacheInProcess = false;
            console.log("CacheDel!");
            if ($callBackParam) $callBackParam();
        };
        var millisecondsPerDay = 1000 * 60 * 60 * 24 * 7;
        var oneDayAgo = (new Date()).getTime() - millisecondsPerDay;
        removeCacheInProcess = true;
        if( chrome['browsingData']){
            chrome.browsingData.removeCache({
                "since": oneDayAgo
            }, callbackCache);
        }else{
            if ($callBackParam) $callBackParam();
        }
    }



    // Called when the url of a tab changes.
    //_____________________________________________________
    function tabDesasociate(tabId, removeInfo) {
        if (tabId>0){

            var miTab = getTabbyId(tabId);
            if (miTab.tab === null) return;

            tabs2refresh.splice (miTab.index, 1);
            if (removeInfo === null) removeInfo = '';
            console.log("\n[tabDesasociate]: " + tabId + " - removeInfo: " + removeInfo + " - TabsListen: " + tabs2refresh.length);

            if ( Number (miTab.obj.port) > 1){
                var cantPort = 0;
                var listenerPort = miTab.obj.port;
                for (var i = tabs2refresh.length - 1; i >= 0; i--) {
                    if (listenerPort === tabs2refresh[i].port){
                        cantPort++;
                    }
                }
                if (cantPort === 0) {
                    console.log("   >>No more tabs listen port: " + listenerPort + ", remove listener");
                    var miListener = getListanerbyPort(listenerPort).listener;
                    if (miListener !== null) miListener.disconect();
                }

                checkIcon();
            }
        }
    }

    //Cambio la solapa
    chrome.tabs.onSelectionChanged.addListener(function(tabId, selectInfo) {
        chrome.tabs.get(tabId, function(tab) {
            lastTabSelected = tab;
            console.log('       SChanged: ' + lastTabSelected.id + "/" + new Date());
            checkIcon();
        });
    });

    //Arranca
    chrome.windows.getCurrent(function(win) {
        chrome.tabs.getSelected(win.id, function (tab){
            lastTabSelected = tab;
            console.log('       SChanged: ' + lastTabSelected.id + "/" + new Date() + " getCurrent");
            checkIcon();
        });
    });

    //Tabs Changes
    chrome.tabs.onUpdated.addListener(checkIcon);
    chrome.tabs.onHighlighted.addListener(checkIcon);
    chrome.tabs.onRemoved.addListener(function(tabId){tabDesasociate(tabId, null);});

}