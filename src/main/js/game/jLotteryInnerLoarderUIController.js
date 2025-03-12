define([
        'skbJet/component/gameMsgBus/GameMsgBus',
        'skbJet/component/SKBeInstant/SKBeInstant',
        'skbJet/component/resourceLoader/resourceLib'/*,
        'skbJet/component/deviceCompatibility/windowSize'*/
    ], function(msgBus, SKBeInstant, resLib/*, windowSize*/){
	
	var loadDiv = document.createElement('div');
	var progressBarDiv = document.createElement('div');
	var progressDiv = document.createElement('div');
	var loadingBarButton = document.createElement('div');
    var gameLogoDiv = document.createElement('div');
	var orientation = 'landscape';
	var gce;
	var scaleRate = 1;

	var predefinedStyle = {
		landscape:{
			loadDiv:{
				width:960,
				height:600,
				position:'absolute',
				left: "50%",
				top: "50%"
			},
            gameLogoDiv:{
				width:550,
				height:344,
				top: 40,
				left: 205,
				position:'absolute',
                backgroundSize:'100% 100%'
			},
			progressBarDiv:{
				top: 480,
				left: 198,
				width:564,
				height:64,
				padding:0,
				position:'absolute'
			},
			loadingBarButton:{
				top: -20,
				left: "0%",
				width:46,
				height:50,
				padding:0,
				position:'absolute',
				backgroundRepeat:'no-repeat'
			},
			progressDiv:{
				top: 0,
				left: 0,
				height:64,
				width:"0%",
				position:'absolute',
				backgroundRepeat:'no-repeat'
			}
		},
		portrait:{
			loadDiv:{
				width:600,
				height:960,
				position:'absolute',
				left: "50%",
				top: "50%"
			},
            gameLogoDiv:{
				width:520,
				height:325,
				top: 44,
				left: 50,
				position:'absolute',
                backgroundSize:'100% 100%'
			},
			progressBarDiv:{
				top:780,
				left:18,
				width:564,
				height:64,
				padding:0,
				position:'absolute'
			},
			loadingBarButton:{
				top: -20,
				left: "0%",
				width:46,
				height:50,
				padding:0,
				position:'absolute',
				backgroundRepeat:'no-repeat'
			},
			progressDiv:{
				top: 0,
				left: 0,
				height:64,
				width:"0%",
				position:'absolute',
				backgroundRepeat:'no-repeat'
			}
		}
	};

	function applyStyle(elem, styleData){
		for(var s in styleData){
			if(typeof styleData[s] === 'number'){
				elem.style[s] = styleData[s]+'px';
			}else{
				elem.style[s] = styleData[s];
			}
		}
	}
    
    function setBgImageFromResLib(elem, imgName) {
        if (resLib && resLib.splash && resLib.splash[imgName]) {
            var bgImgUrl = resLib.splash[imgName].src;
            if (bgImgUrl) {
                elem.style.backgroundImage = 'url(' + bgImgUrl + ')';
            }
        }
    }
    
    function updateSize(winW, winH){
//        document.documentElement.style.width = winW + 'px';
//        document.documentElement.style.height = winH + 'px';
//        document.body.style.width = winW + 'px';
//        document.body.style.height = winH + 'px';
        gce.style.width = winW + 'px';
        gce.style.height = winH + 'px';
    }
	
	function onWindowResized(){
		var gameHeight = 0, gameWidth = 0;
	
		if(SKBeInstant.config.assetPack === 'desktop'){
			gameHeight = SKBeInstant.config.revealHeightToUse;
			gameWidth = SKBeInstant.config.revealWidthToUse;
		}else{
//			gameWidth = Math.floor(Number(window.innerWidth));
//			gameHeight = Math.floor(Number(window.innerHeight));
//			gameWidth = Math.floor(windowSize.getDeviceWidth());
//			gameHeight = Math.floor(windowSize.getDeviceHeight());
//            gameWidth = document.getElementById(SKBeInstant.config.targetDivId).clientWidth;
//            gameHeight = document.getElementById(SKBeInstant.config.targetDivId).clientHeight;  
            var targetDiv = document.getElementById(SKBeInstant.config.targetDivId);
            gameWidth = targetDiv.clientWidth;
            gameHeight = targetDiv.clientHeight;
            var parentElem = targetDiv.parentElement;
            if (parentElem !== document.body) {
                var parentWidth = parentElem.clientWidth;
                var parentHeight = parentElem.clientHeight;
                gameWidth = gameWidth > parentWidth ? parentWidth : gameWidth;
                gameHeight = gameHeight > parentHeight ? parentHeight : gameHeight;
            }
        }
		if(gameHeight>gameWidth){
			orientation = 'portrait';
		}else{
            orientation = 'landscape';
        }
		setBgImageFromResLib(gce, orientation+'Loading');
        updateSize(gameWidth, gameHeight);
        
		var pdd = predefinedStyle[orientation];
		if(gameWidth / pdd.loadDiv.width > gameHeight / pdd.loadDiv.height){
			scaleRate = gameHeight / pdd.loadDiv.height;
		}else{
			scaleRate = gameWidth / pdd.loadDiv.width;
		}
        
        applyStyle(loadDiv, pdd.loadDiv);
        applyStyle(progressBarDiv, pdd.progressBarDiv);
        applyStyle(gameLogoDiv, pdd.gameLogoDiv);
        
		loadDiv.style.transform = 'scale('+ scaleRate + ',' + scaleRate +')';
		loadDiv.style.webkitTransform = 'scale('+ scaleRate + ',' + scaleRate +')';
		loadDiv.style.marginTop = -pdd.loadDiv.height/2 + "px";
		loadDiv.style.marginLeft = -pdd.loadDiv.width/2 + "px";
		
	}
    
    function onSplashLoadDone() {
        setBgImageFromResLib(gce, orientation + 'Loading');
        setBgImageFromResLib(progressBarDiv, 'loadingBarBack');
        setBgImageFromResLib(progressDiv, 'loadingBarFront');
        setBgImageFromResLib(loadingBarButton, 'loadingBarCircle');
        setBgImageFromResLib(gameLogoDiv, 'logoLoader');
    }
	
    function clearDivFormatting() {
        document.getElementById(SKBeInstant.config.targetDivId).innerHTML = "";
        document.getElementById(SKBeInstant.config.targetDivId).style.background = '';
        document.getElementById(SKBeInstant.config.targetDivId).style.backgroundSize = '';
        document.getElementById(SKBeInstant.config.targetDivId).style.webkitUserSelect = '';
        document.getElementById(SKBeInstant.config.targetDivId).style.webkitTapHighlightColor = '';
    }

    
	function initUI(){
        var gameHeight = 0, gameWidth = 0;
		gce = SKBeInstant.getGameContainerElem();
        
        if (SKBeInstant.config.screenEnvironment === 'device') {
            gameWidth = document.getElementById(SKBeInstant.config.targetDivId).clientWidth;
            gameHeight = document.getElementById(SKBeInstant.config.targetDivId).clientHeight;            
        } else {
            gameHeight = SKBeInstant.config.revealHeightToUse;
            gameWidth = SKBeInstant.config.revealWidthToUse;
        }

		if(gameHeight>gameWidth){
			orientation = 'portrait';
		}
		loadDiv.appendChild(progressBarDiv);
        loadDiv.appendChild(gameLogoDiv);
		progressBarDiv.appendChild(progressDiv);
		progressBarDiv.appendChild(loadingBarButton);
		
		var pdd = predefinedStyle[orientation];
		applyStyle(loadDiv, pdd.loadDiv);
		applyStyle(progressBarDiv, pdd.progressBarDiv);
		applyStyle(progressDiv, pdd.progressDiv);
		applyStyle(loadingBarButton, pdd.loadingBarButton);
        applyStyle(gameLogoDiv, pdd.gameLogoDiv);
		
		if(SKBeInstant.config.assetPack !== 'desktop'){
			window.addEventListener('resize', onWindowResized);
		}
		onWindowResized();
		
		gce.style.position = "relative";
		gce.style.backgroundSize = 'cover';
		gce.appendChild(loadDiv);
	}

    function onStartAssetLoading(){
		if(SKBeInstant.isSKB()){
			return;
		}
        clearDivFormatting();
		initUI();
	}
	
	function updateLoadingProgress(data){
		if(SKBeInstant.isSKB()){
			return;
		}
		var _progressBarWidth = parseInt((progressBarDiv.style.width), 10);
		var posX =_progressBarWidth - parseInt((progressDiv.style.left), 10)* 4;
		progressDiv.style.width = (data.current / data.items) * 100 + "%";
		loadingBarButton.style.left = posX * (data.current / data.items) + "px";
	}
    
    function onAssetsLoadedAndGameReady(){
        if (SKBeInstant.config.assetPack !== 'desktop') {
            window.removeEventListener('resize', onWindowResized);
        }
    }
	
	msgBus.subscribe('jLottery.startAssetLoading', onStartAssetLoading);
	msgBus.subscribe('jLotteryGame.updateLoadingProgress', updateLoadingProgress);
    msgBus.subscribe('jLotteryGame.assetsLoadedAndGameReady', onAssetsLoadedAndGameReady);
    msgBus.subscribe('loadController.jLotteryEnvSplashLoadDone', onSplashLoadDone);
    
    return {};
});