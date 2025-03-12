/**
 * @module game/resultDialog
 * @description result dialog control
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
    var winClose, nonWinClose;

	var resultData = null;
    var resultPlaque = null;
	//var style = {fill:["#ff6e02","#fff119","#ffff00","#ff6d00"]};
    var moneyStyle = {padding:2, stroke:"#462403", strokeThickness:4, dropShadow: true, dropShadowDistance: 6,dropShadowAlpha: 0.8, fill:["#ff6e02","#fff119","#ffff00","#ff6d00"]};
//    var shouldCallPlayAagineState = false;
    function onGameParametersUpdated() {
        var buttonStyle = {padding:2, stroke:"#143002", strokeThickness:4, dropShadow: true, dropShadowDistance: 3,dropShadowAlpha: 0.8};
        var textStyle = {padding:4, stroke:"#462403", strokeThickness:4, dropShadow: true, dropShadowDistance: 6,dropShadowAlpha: 0.8, fill:["#ff6e02","#fff119","#ffff00","#ff6d00"]};
        //var moneyStyle = {padding:2, stroke:"#462403", strokeThickness:4, dropShadow: true, dropShadowDistance: 6,dropShadowAlpha: 0.8};
        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92};
        winClose = new gladButton(gr.lib._buttonWinClose, "buttonClose", scaleType);
        nonWinClose = new gladButton(gr.lib._buttonNonWinClose, "buttonClose", scaleType);
        
        function closeResultPlaque(){
            hideDialog();
            audio.play('ButtonGeneric');
        }
        
        winClose.click(closeResultPlaque);
        nonWinClose.click(closeResultPlaque);

        if (SKBeInstant.config.wagerType === 'TRY')
        {
            if (Number(SKBeInstant.config.demosB4Move2MoneyButton) === -1) {
                gr.lib._win_Try_Text.setText(loader.i18n.Game.message_anonymousTryWin);
            } else {
                gr.lib._win_Try_Text.setText(loader.i18n.Game.message_tryWin);
            }

        } 
        
        gr.lib._win_Text.autoFontFitText = true;
        gr.lib._win_Try_Text.autoFontFitText = true;
        gr.lib._win_Value.autoFontFitText = true;
        gr.lib._win_Text.setText(loader.i18n.Game.message_buyWin);
        gameUtils.setTextStyle(gr.lib._win_Text,textStyle);      
        gameUtils.setTextStyle(gr.lib._win_Try_Text,textStyle);        
        gameUtils.setTextStyle(gr.lib._win_Value,moneyStyle);
        
        gr.lib._closeWinText.autoFontFitText = true;
        gr.lib._closeWinText.setText(loader.i18n.Game.message_close);
        gameUtils.setTextStyle(gr.lib._closeWinText,buttonStyle);
        
        gr.lib._nonWin_Text.autoFontFitText = true;
        gr.lib._nonWin_Text.setText(loader.i18n.Game.message_nonWin);
        gameUtils.setTextStyle(gr.lib._nonWin_Text,textStyle);        
        
        gr.lib._closeNonWinText.autoFontFitText = true;
        gr.lib._closeNonWinText.setText(loader.i18n.Game.message_close);
        gameUtils.setTextStyle(gr.lib._closeNonWinText,buttonStyle);
        
		hideDialog();
	}

	function hideDialog() {
		gr.lib._BG_dim.show(false);
        gr.lib._winPlaque.show(false);
        gr.lib._nonWinPlaque.show(false);
        gr.lib._fire.stopPlay();
	}

	function showDialog() {
		gr.lib._BG_dim.show(true);
		if (resultData.playResult === 'WIN') {
			if (SKBeInstant.config.wagerType === 'BUY') {
                gr.lib._win_Try_Text.show(false);
                gr.lib._win_Text.show(true);
			}else{
                gr.lib._win_Try_Text.show(true);
                gr.lib._win_Text.show(false);                
            }
			gr.lib._win_Value.setText(SKBeInstant.formatCurrency(resultData.prizeValue).formattedAmount);
            gameUtils.setTextStyle(gr.lib._win_Value,moneyStyle);
			gr.lib._winPlaque.show(true);
            gr.lib._fire.gotoAndPlay('fire', 0.5, true);
            gr.lib._nonWinPlaque.show(false);
		} else {
            gr.lib._winPlaque.show(false);
			gr.lib._nonWinPlaque.show(true);
		}
	}

	function onStartUserInteraction(data) {
//        shouldCallPlayAagineState = true;
		resultData = data;
		hideDialog();
	}

	function onAllRevealed() {
        msgBus.publish('jLotteryGame.ticketResultHasBeenSeen', {
            tierPrizeShown: resultData.prizeDivision,
            formattedAmountWonShown: resultData.prizeValue
        });
        msgBus.publish('disableUI');
    }

    function onEnterResultScreenState() {
        if(gr.lib._tutorial.pixiContainer.visible){
            gr.lib._tutorial.show(false);
        }
        showDialog();
    }

	function onReStartUserInteraction(data) {
		onStartUserInteraction(data);
	}

    function onReInitialize() {
        hideDialog();
    }

	
	function onPlayerWantsPlayAgain(){
		hideDialog();
	}
    
    function onTutorialIsShown(){
        if(gr.lib._winPlaque.pixiContainer.visible || gr.lib._nonWinPlaque.pixiContainer.visible){            
            resultPlaque = gr.lib._winPlaque.pixiContainer.visible? gr.lib._winPlaque: gr.lib._nonWinPlaque;
            hideDialog();
            gr.lib._BG_dim.show(true);
        }
    }
    
    function onTutorialIsHide(){
        if(resultPlaque){
            resultPlaque.show(true);
            if (resultData.playResult === 'WIN'){
                gr.lib._fire.gotoAndPlay('fire', 0.5, true);
            }
            //gr.lib._BG_dim.show(false);
            resultPlaque = null;
        }        
    }
    
	msgBus.subscribe('jLottery.reInitialize', onReInitialize);
	msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);

	msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
	msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
	msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
	msgBus.subscribe('allRevealed', onAllRevealed);
	msgBus.subscribe('playerWantsPlayAgain', onPlayerWantsPlayAgain);
    msgBus.subscribe('tutorialIsShown', onTutorialIsShown);
    msgBus.subscribe('tutorialIsHide', onTutorialIsHide);
        
	return {};
});