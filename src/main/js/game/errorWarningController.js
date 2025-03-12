/**
 * @module errorWarningController
 * @memberof game
 * @description
 * @author Alex Wang
 */
define([
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/audioPlayer/AudioPlayerProxy',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/pixiResourceLoader/pixiResourceLoader',
    'skbJet/componentCRDC/gladRenderer/gladButton',
    'skbJet/component/SKBeInstant/SKBeInstant',
    '../game/gameUtils'
], function(msgBus, audio, gr, loader, gladButton, SKBeInstant, gameUtils){
    var style = {padding:6, stroke:"#143002", strokeThickness:4, dropShadow: true, dropShadowDistance: 3,dropShadowAlpha: 0.8};
    var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92};
    var showWarn = false;
    var warnMessage = null;
    var inGame = false;
    var showError = false;
    var tutorialVisible = false;
    var hasWin = false;
    var resultPlaque = null;

    function onGameParametersUpdated(){
        gr.lib._ErrorScene.show(false);
        gr.lib._winBoxError.show(false);
        //error
        var errorExitButton = new gladButton(gr.lib._errorExitButton, "buttonCommon", scaleType);
        errorExitButton.click(function(){
            msgBus.publish('jLotteryGame.playerWantsToExit');
            audio.play('ButtonGeneric',0);
        });
        gr.lib._errorExitText.autoFontFit = true;
        gr.lib._errorExitText.setText(loader.i18n.Game.error_button_exit);
        gameUtils.setTextStyle(gr.lib._errorExitText, style);
        
        gr.lib._errorTitle.setText(loader.i18n.Game.error_title);
        gameUtils.setTextStyle(gr.lib._errorTitle, style);
        
        //warn
        var continueButton = new gladButton(gr.lib._warningContinueButton, "buttonCommon", scaleType);
        var warningExitButton = new gladButton(gr.lib._warningExitButton, "buttonCommon", scaleType);
        continueButton.click(closeErrorWarn);
        warningExitButton.click(function () {
            msgBus.publish('jLotteryGame.playerWantsToExit');
            audio.play('ButtonGeneric', 0);
        });
        gr.lib._warningExitText.autoFontFitText = true;
        gr.lib._warningExitText.setText(loader.i18n.Game.warning_button_exitGame);
        gameUtils.setTextStyle(gr.lib._warningExitText, style);
        
        gr.lib._warningContinueText.autoFontFitText = true;
        gr.lib._warningContinueText.setText(loader.i18n.Game.warning_button_continue);
        gameUtils.setTextStyle(gr.lib._warningContinueText, style);
        
        gr.lib._winBoxErrorText.setText(loader.i18n.Error.error29000);
        gameUtils.setTextStyle(gr.lib._winBoxErrorText, style);
        gr.lib._winBoxErrorExitText.setText(loader.i18n.Game.error_button_exit);    
        gameUtils.setTextStyle(gr.lib._winBoxErrorExitText, style);

        var winBoxErrorButton = new gladButton(gr.lib._winBoxErrorExitButton, "buttonCommon", scaleType);
        winBoxErrorButton.click(function() {
            msgBus.publish('jLotteryGame.playerWantsToExit');
            audio.play('ButtonGeneric', 0);
    });
    }
    
    function onWarn(warning){
        gr.lib._buttonInfo.show(false);
        gr.lib._BG_dim.show(true); 
        
        if (gr.lib._tutorial.pixiContainer.visible) {
            gr.lib._tutorial.show(false);
            tutorialVisible = true;
        }
        
        resultPlaque = hasWin ? gr.lib._winPlaque : gr.lib._nonWinPlaque;
        if (resultPlaque.pixiContainer.visible) {
            resultPlaque.show(false);
        } else {
            resultPlaque = null;
        }
        msgBus.publish('tutorialIsShown');
        msgBus.publish('warnIsShown');
        
        gr.lib._warningExitButton.show(true);
        gr.lib._warningText.show(true);
        gr.lib._warningContinueButton.show(true);
        gr.lib._errorExitButton.show(false);
        gr.lib._errorTitle.show(false);
        gr.lib._ErrorScene.show(true);
        
        gr.lib._warningText.setText(warning.warningMessage);
        gameUtils.setTextStyle(gr.lib._warningText, style);  

    }

    function closeErrorWarn(){
        showError = false;
        gr.lib._ErrorScene.show(false);
        audio.play('ButtonGeneric');
        if (tutorialVisible || resultPlaque) {
            gr.lib._BG_dim.show(true);
            if (tutorialVisible) {
                gr.lib._tutorial.show(true);
                tutorialVisible = false;
            } else {
                gr.lib._buttonInfo.show(true);
                resultPlaque.show(true);
                resultPlaque = null;
                msgBus.publish('tutorialIsHide');
                msgBus.publish('warnIsHide');
            }
        } else {
            gr.lib._buttonInfo.show(true);
            gr.lib._BG_dim.show(false);
            msgBus.publish('tutorialIsHide');
            msgBus.publish('warnIsHide');
        }
        
    }
    function onError(error){
        showError = true;
        
        gr.lib._network.stopPlay();
        gr.lib._network.show(false); 
        
        gr.lib._BG_dim.show(true); 
        if (gr.lib._tutorial.pixiContainer.visible) {
            gr.lib._tutorial.show(false);
            tutorialVisible = true;
        }
        msgBus.publish('tutorialIsShown');
        if (error.errorCode === '29000') {
            gr.lib._winBoxError.show(true);
            // gr.lib._winBoxErrorText.setText(error.errorCode);
            // gameUtils.setTextStyle(gr.lib._winBoxErrorText, style);

            if (gr.lib._winBoxError) {
                gr.lib._winBoxError.show(true);
            }
            if(SKBeInstant.isWLA()){
                gr.lib._winBoxErrorExitButton.show(true);
            }else{
                gr.lib._winBoxErrorExitButton.show(false);
            }
        } else {
            gr.lib._warningText.show(false);
            gr.lib._warningExitButton.show(false);
            gr.lib._warningContinueButton.show(false);
            gr.lib._errorExitButton.show(true);
            gr.lib._errorTitle.show(true);
            gr.lib._errorText.setText(error.errorCode + ": " + error.errorDescriptionSpecific + "\n" + error.errorDescriptionGeneric);
            gameUtils.setTextStyle(gr.lib._errorText, style);
            gr.lib._ErrorScene.show(true);
        }
        
        //When error happend, Sound must be silenced.
        audio.stopAllChannel();
        
    //destroy if error code is 00000
    //this is a carry-over from jLottery1 where if the game is closed via the confirm prompt
    //rather than the exit button
    if (error.errorCode === '00000' || error.errorCode === '66605') {
        if (document.getElementById(SKBeInstant.config.targetDivId)) {
            document.getElementById(SKBeInstant.config.targetDivId).innerHTML = "";
            document.getElementById(SKBeInstant.config.targetDivId).style.background = '';
            document.getElementById(SKBeInstant.config.targetDivId).style.backgroundSize = '';
            document.getElementById(SKBeInstant.config.targetDivId).style.webkitUserSelect = '';
            document.getElementById(SKBeInstant.config.targetDivId).style.webkitTapHighlightColor = '';
        }
        //clear require cache
        if (window.loadedRequireArray) {
            for (var i = window.loadedRequireArray.length - 1; i >= 0; i--) {
                requirejs.undef(window.loadedRequireArray[i]);
            }
        }
        return;
    }
}
    
    function onEnterResultScreenState(){
        inGame = false;
        if (showWarn) {
            showWarn = false;
            gr.getTimer().setTimeout(function () {
                onWarn(warnMessage);
            }, (Number(SKBeInstant.config.compulsionDelayInSeconds)+0.3) * 1000);
        }
    }
    
    msgBus.subscribe('jLottery.reInitialize', function(){
        inGame = false;
    });
    
    msgBus.subscribe('clickBuyTicket', function(){
        inGame = true;
    });
    msgBus.subscribe('jLottery.startUserInteraction', function(){
        inGame = true;
    });
    
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
    msgBus.subscribe('jLottery.error', onError);
    msgBus.subscribe('winboxError', onError);
    msgBus.subscribe('jLottery.playingSessionTimeoutWarning', function(warning){
        if(SKBeInstant.config.jLotteryPhase === 1 || showError){
            return;
        }
        if(inGame){
            warnMessage = warning;
            showWarn = true;
        }else{
            onWarn(warning);                
        }
    });

return {};
});