/**
 * @module game/tutorialController
 * @description result dialog control
 */
define([
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/audioPlayer/AudioPlayerProxy',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/pixiResourceLoader/pixiResourceLoader',
    'skbJet/componentCRDC/gladRenderer/gladButton',
    'skbJet/component/SKBeInstant/SKBeInstant',
    '../game/gameUtils'
], function (msgBus, audio, gr, loader, gladButton, SKBeInstant, gameUtils) {
    var buttonInfo, buttonClose;
    var left, right;
    var index = 0, minIndex = 0, maxIndex = 3;
    var channelNum = 3;
    var ButtonBetDownChannel = 0, ButtonBetUpChannel = 0;
    var shouldShowTutorialWhenReinitial = false;
    var showTutorialAtBeginning = true;
    var resultIsShown = false;
    var warnShown = false;
    var warnReset = false;

    function showTutorial() {
        gr.lib._BG_dim.off('click');
        buttonInfo.show(false);
		gr.lib._BG_dim.show(true);
        gr.lib._tutorial.show(true);
        if (gr.lib._winPlaque.pixiContainer.visible || gr.lib._nonWinPlaque.pixiContainer.visible) {
            resultIsShown = true;
        }
        gr.animMap._tutorialAnim.play();
        msgBus.publish('tutorialIsShown');
    }

    function hideTutorial() {
        index = minIndex;
        gr.animMap._tutorialUP._onComplete = function(){
            gr.lib._tutorial.show(false);
            for (var i = minIndex; i <= maxIndex; i++) {
                if (i === minIndex) {
                    gr.lib['_tutorialPage_0' + i].show(true);
                    gr.lib['_tutorialPage_0'+i+'_Text_00'].show(true);
                    gr.lib['_tutorialPageIcon_0' + i].setImage('tutorialPageIconOn');
                } else {
                    gr.lib['_tutorialPage_0' + i].show(false);
                    gr.lib['_tutorialPage_0'+i+'_Text_00'].show(false);
                    gr.lib['_tutorialPageIcon_0' + i].setImage('tutorialPageIconOff');
                }
            }
            buttonInfo.show(true);
            if (!resultIsShown) {
                gr.lib._BG_dim.show(false);
            }else{
                resultIsShown = false;
            }
            msgBus.publish('tutorialIsHide');
        };
        gr.animMap._tutorialUP.play();        
    }

    function onGameParametersUpdated() {
        gr.lib._versionText.autoFontFitText = true;
        gr.lib._versionText.setText(window._cacheFlag.gameVersion);
		
        // Prevent click the symbols when tutorial is shown
        gr.lib._BG_dim.on('click', function(event){
            event.stopPropagation();
        });
        
        prepareAudio();
        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92};
        var options = {'avoidMultiTouch': true, 'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92}; 
        buttonInfo = new gladButton(gr.lib._buttonInfo, "buttonInfo", options);
        buttonClose = new gladButton(gr.lib._buttonCloseTutorial, "buttonClose", scaleType);
        left = new gladButton(gr.lib._buttonTutorialArrowLeft, "buttonTutorialArrow", options);
        right = new gladButton(gr.lib._buttonTutorialArrowRight, "buttonTutorialArrow", {'avoidMultiTouch': true,'scaleXWhenClick': -0.92, 'scaleYWhenClick': 0.92});
        
        if(SKBeInstant.config.customBehavior){
            if(SKBeInstant.config.customBehavior.showTutorialAtBeginning === false){
                showTutorialAtBeginning = false;
            }
        }else if(loader.i18n.gameConfig){
             if(loader.i18n.gameConfig.showTutorialAtBeginning === false){
                showTutorialAtBeginning = false;
            }
        }
        
        if (showTutorialAtBeginning === false) {
            buttonInfo.show(true);
            gr.lib._BG_dim.show(false);
            gr.lib._tutorial.show(false);
        }
        
        var style = {padding:2, stroke:"#143002", strokeThickness:4, dropShadow: true, dropShadowDistance: 3,dropShadowAlpha: 0.8};

        buttonInfo.click(function () {
            showTutorial();
            audio.play('ButtonGeneric');
        });

        buttonClose.click(function () {
            hideTutorial();
            audio.play('ButtonGeneric');
        });

        left.click(function () {
            index--;
            if (index < minIndex){
                index = maxIndex;
            }
            showTutorialPageByIndex(index);
            audio.play('ButtonBetDown', 'ButtonBetDown'+ ButtonBetDownChannel%channelNum);
            ButtonBetDownChannel++;          
        });
        right.click(function () {
            index++;
            if (index > maxIndex){
                index = minIndex;
            }

            showTutorialPageByIndex(index);
            audio.play('ButtonBetUp', 'ButtonBetUp'+ ButtonBetUpChannel%channelNum);
            ButtonBetUpChannel++;
        });

        for (var i = minIndex; i <= maxIndex; i++) {
            if(i !== 0){
                gr.lib['_tutorialPage_0' + i].show(false);
                gr.lib['_tutorialPage_0'+i+'_Text_00'].show(false);
            }else{
                gr.lib['_tutorialPageIcon_0'+ i].setImage("tutorialPageIconOn");
            }
            var obj = gr.lib['_tutorialPage_0'+i+'_Text_00'];
//            obj.autoFontFitText = true;
            if(SKBeInstant.isWLA()){
                obj.setText(loader.i18n.Game.WLA['tutorial_0' + i]);                
            }else{
                obj.setText(loader.i18n.Game.Commercial['tutorial_0' + i]);               
            }
            gameUtils.setTextStyle(obj,style);
        }

        gr.lib._tutorialTitleText.autoFontFitText = true;
        gr.lib._tutorialTitleText.setText(loader.i18n.Game.tutorial_title);
        gameUtils.setTextStyle(gr.lib._tutorialTitleText,style);
        gr.lib._closeTutorialText.autoFontFitText = true;
        gr.lib._closeTutorialText.setText(loader.i18n.Game.message_close);
		gameUtils.setTextStyle(gr.lib._closeTutorialText,style);

    }
    
        function showTutorialPageByIndex(index){
        hideAllTutorialPages();
        gr.lib['_tutorialPage_0' + index].show(true);
        gr.lib['_tutorialPage_0'+ index +'_Text_00'].show(true);
        gr.lib['_tutorialPageIcon_0'+index].setImage('tutorialPageIconOn');
    }

    function hideAllTutorialPages(){
        for (var i = 0; i <= maxIndex; i++){
            gr.lib['_tutorialPage_0' + i].show(false);
            gr.lib['_tutorialPage_0'+ i +'_Text_00'].show(false);
            gr.lib['_tutorialPageIcon_0'+i].setImage('tutorialPageIconOff');
        }
    }

    function onReInitialize() {
        if(shouldShowTutorialWhenReinitial){
            shouldShowTutorialWhenReinitial = false;
            if (showTutorialAtBeginning) {
                showTutorial();
            }else{
                msgBus.publish('tutorialIsHide');
            }
        }else{
            gr.lib._tutorial.show(false);
            buttonInfo.show(true);
        }
    }

    function onDisableUI() {
		gr.lib._buttonInfo.show(false);
	}
    
    function onEnableUI() {
        gr.lib._buttonInfo.show(true);
    }
    
    function showTutorialOnInitial(){
        for (var i = minIndex; i <= maxIndex; i++) {
            if (i === minIndex) {
                gr.lib['_tutorialPage_0' + i].show(true);
                gr.lib['_tutorialPage_0' + i + '_Text_00'].show(true);
                gr.lib['_tutorialPageIcon_0' + i].setImage('tutorialPageIconOn');
            } else {
                gr.lib['_tutorialPage_0' + i].show(false);
                gr.lib['_tutorialPage_0' + i + '_Text_00'].show(false);
                gr.lib['_tutorialPageIcon_0' + i].setImage('tutorialPageIconOff');
            }
        }
        buttonInfo.show(false);
		gr.lib._BG_dim.show(true);
        gr.lib._tutorial.show(true);
        msgBus.publish('tutorialIsShown');
    }
    
    function onInitialize(){
        if(showTutorialAtBeginning){
            showTutorialOnInitial();
        }else{
            msgBus.publish('tutorialIsHide');
        }
    }
    function onReStartUserInteraction(){
        buttonInfo.show(true);
    }
    function onStartUserInteraction(){
        ButtonBetDownChannel = 0;
        ButtonBetUpChannel = 0;
        if(SKBeInstant.config.gameType === 'ticketReady'){
            if (showTutorialAtBeginning) {
                showTutorialOnInitial();
            } else {
                msgBus.publish('tutorialIsHide');
            }
        }else{
            gr.lib._tutorial.show(false);
            buttonInfo.show(true);
        }
    }
    
    function onEnterResultScreenState() {
        gr.getTimer().setTimeout(function () {
            if (warnShown) {
                warnReset = true;
            } else {
                buttonInfo.show(true);
            }
        }, Number(SKBeInstant.config.compulsionDelayInSeconds) * 1000);		
	}
    
    function prepareAudio() {
        for (var i = 0; i < channelNum; i++) {
            audio.play('ButtonBetDown', 'ButtonBetDown' + i);
            audio.stopChannel('ButtonBetDown' + i);
            
            audio.play('ButtonBetUp', 'ButtonBetUp' + i);
            audio.stopChannel('ButtonBetUp' + i);
        }
    }
    
    function onPlayerWantsToMoveToMoneyGame(){
        shouldShowTutorialWhenReinitial = true;
    }
    
    msgBus.subscribe('jLotterySKB.reset', onEnableUI);
	msgBus.subscribe('enableUI', onEnableUI);
    msgBus.subscribe('disableUI', onDisableUI);
    msgBus.subscribe('allSymbolsRevealed', onDisableUI);
    msgBus.subscribe('jLottery.initialize', onInitialize);
    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame',onPlayerWantsToMoveToMoneyGame);

	msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
    
    msgBus.subscribe('warnIsShown', function () {
        warnShown = true;
    });
    msgBus.subscribe('warnIsHide', function () {
        warnShown = false;
        if (warnReset) {
            warnReset = false;
            buttonInfo.show(true);
        }
    });


    return {};
});