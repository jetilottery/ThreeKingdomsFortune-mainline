/**
 * @module game/buyAndTryController
 * @description buy and try button control
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
    
	var currentTicketCost = null;
	var replay, tryButton, buyButton;
    var MTMReinitial = false;
    
    var style = {padding:2, stroke:"#143002", strokeThickness:4, dropShadow: true, dropShadowDistance: 3,dropShadowAlpha: 0.8};
	function onGameParametersUpdated(){
        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92};
        tryButton = new gladButton(gr.lib._buttonTry, "buttonCommon",scaleType);
        buyButton = new gladButton(gr.lib._buttonBuy, "buttonCommon",scaleType);
		gr.lib._buttonBuy.show(false);
		gr.lib._buttonTry.show(false);
        gr.lib._network.show(false);
        replay = false;
        
        gr.lib._buyText.autoFontFitText = true;
        if(SKBeInstant.config.wagerType === 'BUY'){
            gr.lib._buyText.setText(loader.i18n.Game.button_buy);
        }else{
            gr.lib._buyText.setText(loader.i18n.Game.button_try);
        }
        gameUtils.setTextStyle(gr.lib._buyText,style);

        gr.lib._tryText.autoFontFitText = true;
        gr.lib._tryText.setText(loader.i18n.Game.button_try);
        gameUtils.setTextStyle(gr.lib._tryText,style);

		tryButton.click(play);
		buyButton.click(play);
	}

	function play() {
        msgBus.publish('clickBuyTicket');
		if (replay) {
			msgBus.publish('jLotteryGame.playerWantsToRePlay', {price:currentTicketCost});
		} else {
			msgBus.publish('jLotteryGame.playerWantsToPlay', {price:currentTicketCost});
		}
		gr.lib._buttonBuy.show(false);
		gr.lib._buttonTry.show(false);
        gr.lib._network.show(true);
        gr.lib._network.gotoAndPlay('networkActivity', 0.3, true);
		audio.play('ButtonGeneric');
        msgBus.publish('disableUI');
	}

	function onStartUserInteraction(data) {
        gr.lib._network.stopPlay();
        gr.lib._network.show(false);        
        
		gr.lib._buttonBuy.show(false);
		gr.lib._buttonTry.show(false);
		currentTicketCost = data.price;
		replay = true;
	}

	function showBuyOrTryButton() {
		if (SKBeInstant.config.jLotteryPhase !== 2) {
			return;
		}
            gr.lib._buttonBuy.show(true);
            gr.lib._buttonTry.show(true);
	}

	function onInitialize() {
		showBuyOrTryButton();
	}

	function onTicketCostChanged(data) {
		currentTicketCost = data;
	}

    function onReInitialize() {
        gr.lib._network.stopPlay();
        gr.lib._network.show(false);  
		
        if (MTMReinitial) {
            replay = false;
            gr.lib._buyText.setText(loader.i18n.Game.button_buy);
            gameUtils.setTextStyle(gr.lib._buyText,style);
            MTMReinitial = false;
        }
		showBuyOrTryButton();
	}
    
    function onPlayerWantsPlayAgain(){
        showBuyOrTryButton();
    }
    
    function onReStartUserInteraction(){
        gr.lib._network.stopPlay();
        gr.lib._network.show(false);   
    }
    
    function onPlayerWantsToMoveToMoneyGame(){
        MTMReinitial = true;
    }
    function onReset(){
        gr.lib._network.stopPlay();
        gr.lib._network.show(false);  
        showBuyOrTryButton();
    }
    msgBus.subscribe('jLotterySKB.reset', onReset);
    msgBus.subscribe("playerWantsPlayAgain", onPlayerWantsPlayAgain);
	msgBus.subscribe('jLottery.reInitialize', onReInitialize);
	msgBus.subscribe('jLottery.initialize', onInitialize);
	msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
	msgBus.subscribe('ticketCostChanged', onTicketCostChanged);
	msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame',onPlayerWantsToMoveToMoneyGame);

	return {};
});