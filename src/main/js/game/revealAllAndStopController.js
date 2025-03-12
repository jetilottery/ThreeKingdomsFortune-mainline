/**
 * @module game/revealAllButton
 * @description reveal all button control
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

    var autoPlay, stopButton;
	var symbolsNum = 12, winNum = 3;
    var interval;
	
    function revealAll() {
        audio.play('ButtonGeneric');
        msgBus.publish('startReveallAll');
		var symbol;
		var delayTime = 0;
        var showStop = false;
		for(var i = 0; i < winNum; i++){
			symbol = gr.lib['_winSymbol' + i];
			if(!symbol.reveal){
                showStop = true;
                symbol.off('click');
				symbol.timer = gr.getTimer().setTimeout(symbol.revealFun, delayTime);
				delayTime += interval;
			}
		}
		for(i = 0; i < symbolsNum; i++){
			symbol = gr.lib['_Symbol_' + i];
			if(!symbol.reveal){
                showStop = true;
                symbol.off('click');
				symbol.timer = gr.getTimer().setTimeout(symbol.revealFun, delayTime);
				delayTime += interval;
			}
		}
        if(showStop){
            gr.lib._buttonStop.show(true);
        }
        msgBus.publish('disableUI');
    }
    
    function stopRevealAll(){
        audio.play('ButtonGeneric');
        gr.lib._buttonStop.show(false);
        var showRevealAll = false;
		var symbol;
		for(var i = 0; i < winNum; i++){
			symbol = gr.lib['_winSymbol' + i];
			if(!symbol.reveal){
                showRevealAll = true;
                symbol.on('click', symbol.revealFun);
                gr.getTimer().clearTimeout(symbol.timer);
			}
		}
		for(i = 0; i < symbolsNum; i++){
			symbol = gr.lib['_Symbol_' + i];
			if(!symbol.reveal){
                showRevealAll = true;
                symbol.on('click',symbol.revealFun);
                gr.getTimer().clearTimeout(symbol.timer);
			}
		}
        if(showRevealAll){
            gr.lib._buttonAutoPlay.show(true);
            msgBus.publish('enableUI');
        }
    }

    function onGameParametersUpdated() {
        if(SKBeInstant.config.customBehavior){
           interval = Number(SKBeInstant.config.customBehavior.symbolRevealInterval) || 500;
        }else if(loader.i18n.gameConfig){
           interval = Number(loader.i18n.gameConfig.symbolRevealInterval) || 500;
        }else{
            interval = 500;
        }
        var style = {padding:2, stroke:"#143002", strokeThickness:4, dropShadow: true, dropShadowDistance: 3,dropShadowAlpha: 0.8};
        var options = {'avoidMultiTouch': true, 'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92}; 
        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92};
        autoPlay = new gladButton(gr.lib._buttonAutoPlay, 'buttonCommon', options);
        autoPlay.click(function () {
            gr.lib._buttonAutoPlay.show(false);
            revealAll();
        });
        gr.lib._autoPlayText.autoFontFitText = true;
        gr.lib._autoPlayText.setText(loader.i18n.Game.button_autoPlay);
        gameUtils.setTextStyle(gr.lib._autoPlayText, style);

        gr.lib._buttonAutoPlay.show(false);
        
        stopButton = new gladButton(gr.lib._buttonStop, 'buttonCommon', scaleType);
        stopButton.click(function () {
            stopRevealAll();
        });
        gr.lib._stopText.autoFontFitText = true;
        gr.lib._stopText.setText(loader.i18n.Game.button_stop);
        gameUtils.setTextStyle(gr.lib._stopText, style);

        gr.lib._buttonStop.show(false);
        
	}

    function onStartUserInteraction(data) {
        var enable = SKBeInstant.config.autoRevealEnabled === false? false: true;
        if(enable){
            if(data.scenario){
                gr.lib._buttonAutoPlay.show(true);
            }
        }else{
            gr.lib._buttonAutoPlay.show(false);
        }
    }

    function onReStartUserInteraction(data) {
        onStartUserInteraction(data);
    }

    function onReInitialize() {
        gr.lib._buttonAutoPlay.show(false);
        gr.lib._buttonStop.show(false);
    }

    function onReset() {
        onReInitialize();
    }
    
    function onAllRevealed(){
		gr.lib._buttonAutoPlay.show(false);
        gr.lib._buttonStop.show(false);
    }
    
    function stopRevealAllWhenError() {
        var symbol;
        for (var i = 0; i < winNum; i++) {
            symbol = gr.lib['_winSymbol' + i];
            if (!symbol.reveal) {
				symbol.off('click');
                if (symbol.timer) {
                    gr.getTimer().clearTimeout(symbol.timer);
                    symbol.timer = null;
                }
            }
        }
        for (i = 0; i < symbolsNum; i++) {
            symbol = gr.lib['_Symbol_' + i];
			if (!symbol.reveal) {
				symbol.off('click');
                if (symbol.timer) {
                    gr.getTimer().clearTimeout(symbol.timer);
                    symbol.timer = null;
                }
			}
        }
    }

    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('reset', onReset);
    msgBus.subscribe('allSymbolsRevealed', onAllRevealed);
    msgBus.subscribe('allRevealed', onAllRevealed);
    msgBus.subscribe('winboxError', stopRevealAllWhenError);

    return {};
});