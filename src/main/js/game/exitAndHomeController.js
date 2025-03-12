/**
 * @module game/exitButton
 * @description exit button control
 */
define([
	'skbJet/component/gameMsgBus/GameMsgBus',
	'skbJet/component/audioPlayer/AudioPlayerProxy',
	'skbJet/component/gladPixiRenderer/gladPixiRenderer',
	'skbJet/component/pixiResourceLoader/pixiResourceLoader',
	'skbJet/component/SKBeInstant/SKBeInstant',
    'skbJet/componentCRDC/gladRenderer/gladButton',
    '../game/gameUtils'
], function (msgBus, audio, gr, loader, SKBeInstant, gladButton, gameUtils) {
    var exitButton, homeButton;
    var whilePlaying = false;
    var warnReset = false;
    var warnShown = false;

	function exit() {
		audio.play('ButtonGeneric');
        if (window.loadedRequireArray) {
            for (var i = window.loadedRequireArray.length - 1; i >= 0; i--) {
                requirejs.undef(window.loadedRequireArray[i]);
            }
            window.loadedRequireArray = [];
        }
		msgBus.publish('jLotteryGame.playerWantsToExit');
	}
	
	function onGameParametersUpdated(){
        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92};
        var style = {padding:2, stroke:"#143002", strokeThickness:4, dropShadow: true, dropShadowDistance: 3,dropShadowAlpha: 0.8};
        exitButton = new gladButton(gr.lib._buttonExit, 'buttonCommon', scaleType);
        
        gr.lib._exitText.autoFontFitText = true;
        gr.lib._exitText.setText(loader.i18n.Game.button_exit);
        gameUtils.setTextStyle(gr.lib._exitText,style);

		exitButton.click(exit);
        gr.lib._buttonExit.show(false);
        
        if (SKBeInstant.isWLA()) {
            homeButton = new gladButton(gr.lib._buttonHome, 'buttonHome', scaleType);
            homeButton.click(exit);
            if (SKBeInstant.config.jLotteryPhase === 1) {
                gr.lib._buttonHome.show(false);
            } else {
                gr.lib._buttonHome.show(true);
            }
        }else{
            gr.lib._buttonHome.show(false);
        }
	}

	function onEnterResultScreenState() {
		if (SKBeInstant.config.jLotteryPhase === 1) {
            gr.getTimer().setTimeout(function () {
                gr.lib._buttonExit.show(true);
            }, Number(SKBeInstant.config.compulsionDelayInSeconds) * 1000);
		}else{
            gr.getTimer().setTimeout(function(){
                whilePlaying = false;
                if (SKBeInstant.isWLA()) {
                    if (warnShown) {
                        warnReset = true;
                    } else {
                        gr.lib._buttonHome.show(true);
                    }
                }
            }, Number(SKBeInstant.config.compulsionDelayInSeconds) * 1000);
		}       
	}
    
    function onReInitialize(){
        whilePlaying = false;
        if (SKBeInstant.isWLA()) {
            gr.lib._buttonHome.show(true);
        }
    }
     
    function onDisableUI() {
		gr.lib._buttonHome.show(false);
	}

    function onTutorialIsShown(){
        if (SKBeInstant.isWLA()) {
            homeButton.show(false);
        }
    }
    
    function onTutorialIsHide(){
        if (SKBeInstant.config.jLotteryPhase === 2 && !whilePlaying && SKBeInstant.isWLA()) {
            gr.lib._buttonHome.show(true);
        }
    }
    
    function onReStartUserInteraction(){
        whilePlaying = true;
        if (SKBeInstant.isWLA()) {
            homeButton.show(false);
        }
    }
    function onStartUserInteraction(){
        whilePlaying = true;
        gr.lib._buttonHome.show(false);
    }
	msgBus.subscribe('disableUI', onDisableUI);
    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
	msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLotterySKB.reset', onTutorialIsHide);
    msgBus.subscribe('tutorialIsShown', onTutorialIsShown);
    msgBus.subscribe('tutorialIsHide', onTutorialIsHide);
    msgBus.subscribe('warnIsShown', function(){
        warnShown = true;
    });
    msgBus.subscribe('warnIsHide', function(){
        warnShown = false;
        if(warnReset){
            warnReset = false;
            gr.lib._buttonHome.show(true);
        }
    });
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
	msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);

	return {};
});

