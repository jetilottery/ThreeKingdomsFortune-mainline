/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


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

    var playAgain, playAgainMTM;
	function playAgainButton() {
		//msgBus.publish('jLotteryGame.playAgain');
		audio.play('ButtonGeneric');
        gr.lib._buttonPlayAgain.show(false);
        gr.lib._buttonPlayAgainMTM.show(false);
		msgBus.publish('playerWantsPlayAgain');
	}
	
        var style = {padding:2, stroke:"#143002", strokeThickness:4, dropShadow: true, dropShadowDistance: 3,dropShadowAlpha: 0.8};
	function onGameParametersUpdated(){
        gr.lib._playAgainText.autoFontFitText = true;
        if(SKBeInstant.config.wagerType === 'BUY'){
            gr.lib._playAgainText.setText(loader.i18n.Game.button_playAgain);
        }else{
            gr.lib._playAgainText.setText(loader.i18n.Game.button_MTMPlayAgain);
        }
        gameUtils.setTextStyle(gr.lib._playAgainText,style);

        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92};
        playAgain = new gladButton(gr.lib._buttonPlayAgain, "buttonCommon", scaleType);
		playAgain.click(playAgainButton);
		gr.lib._buttonPlayAgain.show(false);
        
        gr.lib._playAgainMTMText.autoFontFitText = true;
        gr.lib._playAgainMTMText.setText(loader.i18n.Game.button_MTMPlayAgain);
        gameUtils.setTextStyle(gr.lib._playAgainMTMText,style);
        playAgainMTM = new gladButton(gr.lib._buttonPlayAgainMTM, "buttonCommon", scaleType);
		playAgainMTM.click(playAgainButton);
		gr.lib._buttonPlayAgainMTM.show(false);
	}
    
    function onReInitialize(){
        gr.lib._playAgainText.setText(loader.i18n.Game.button_playAgain);
        gameUtils.setTextStyle(gr.lib._playAgainText,style);
        gr.lib._buttonPlayAgain.show(false);
        gr.lib._buttonPlayAgainMTM.show(false);
    }

	function onEnterResultScreenState() {
		if (SKBeInstant.config.jLotteryPhase === 2) {
            gr.getTimer().setTimeout(function(){
                gr.lib._buttonPlayAgain.show(true);
                gr.lib._buttonPlayAgainMTM.show(true);
            }, Number(SKBeInstant.config.compulsionDelayInSeconds) * 1000);
		}
	}

	msgBus.subscribe('jLottery.reInitialize', onReInitialize);
	msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
	msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);

	return {};
});