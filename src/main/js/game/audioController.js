/**
 * @module audioController
 * @memberof game
 * @description
 * @author Alex Wang
 */
define([
    'skbJet/component/gameMsgBus/GameMsgBus',
    'skbJet/component/audioPlayer/AudioPlayerProxy',
    'skbJet/component/gladPixiRenderer/gladPixiRenderer',
    'skbJet/component/SKBeInstant/SKBeInstant',
    'skbJet/componentCRDC/gladRenderer/gladButton',
     'skbJet/component/pixiResourceLoader/pixiResourceLoader'
], function (msgBus, audio, gr, SKBeInstant, gladButton, loader) {
    var audioDisabled = true;
    var audioOn, audioOff;
    var playResult;
    var MTMReinitial = false;
    var popUpDialog = false;
    
    var hidden = false;
    var playResultAudio = false;

    function audioSwitch() {
        if (audioDisabled) {
            gr.lib._buttonAudioOn.show(true);
            gr.lib._buttonAudioOff.show(false);
            audioDisabled = false;
        } else {
            gr.lib._buttonAudioOn.show(false);
            gr.lib._buttonAudioOff.show(true);
            audioDisabled = true;
        }
        audio.muteAll(audioDisabled);
        audio.gameAudioControlChanged(audioDisabled);
    }

    function onConsoleControlChanged(data) {
        if (data.option === 'sound') {
            var isMuted = audio.consoleAudioControlChanged(data);
            if (isMuted) {
                gr.lib._buttonAudioOn.show(false);
                gr.lib._buttonAudioOff.show(true);
                audioDisabled = true;
            } else {
                gr.lib._buttonAudioOn.show(true);
                gr.lib._buttonAudioOff.show(false);
                audioDisabled = false;
            }
            audio.muteAll(audioDisabled);
        }
    }

    function onGameParametersUpdated() {
        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92,'avoidMultiTouch':true};        
        audioDisabled = SKBeInstant.config.soundStartDisabled;
		if(SKBeInstant.config.assetPack !== 'desktop' && popUpDialog){
			audioDisabled = true;
		}
        audioOn = new gladButton(gr.lib._buttonAudioOn, "buttonAudioOn", scaleType);
        audioOff = new gladButton(gr.lib._buttonAudioOff, "buttonAudioOff", scaleType);
		
        if (audioDisabled) {
            gr.lib._buttonAudioOn.show(false);
            gr.lib._buttonAudioOff.show(true);
        } else {
            gr.lib._buttonAudioOn.show(true);
            gr.lib._buttonAudioOff.show(false);
        }
        audio.muteAll(audioDisabled);
		
        audioOn.click(audioSwitch);
        audioOff.click(audioSwitch);
    }

    function onStartUserInteraction(data) {
        playResult = data.playResult;
		if(SKBeInstant.config.gameType === 'ticketReady'){
			return;
		}else{
			audio.play('BaseMusicLoop', 'base', true);
		}
    }

    function onEnterResultScreenState() {
        //audio.play('BaseMusicLoopTerm', 'result');
        if (hidden) {
            playResultAudio = true;
        } else {
            playResultAudio = false;
            if (playResult === 'WIN') {
                audio.play('BaseMusicLoopTermWin', 'base');
            } else {
                audio.play('BaseMusicLoopTerm', 'base');
            }
        }
    }

    function onReStartUserInteraction() {
        audio.play('BaseMusicLoop', 'base', true);
    }

    function reset() {
        audio.stopAllChannel();
    }
    
    function onReInitialize(){
        audio.stopAllChannel();
        if(MTMReinitial){
            audio.play('GameInit', 'base');
            MTMReinitial = false;
        }
    }
    
//    function onInitialize(){
//        if(SKBeInstant.config.assetPack === 'desktop'){
//			audio.play('GameInit', 'base');
//        }else{
//			return;
//		}
//    }
    
    function onPlayerSelectedAudioWhenGameLaunch(data){
//        if (SKBeInstant.config.assetPack === 'desktop') { //SKB desktop
//            audio.muteAll(audioDisabled); //Audio component enable audio default value is true when desktop, with IW, game should use parameter instead of the default value.
//            audio.gameAudioControlChanged(audioDisabled);
//            return;
//        }else{//mobile or tablet, no matter SKB or not.
		if (popUpDialog){
            audioDisabled = data;
			audioSwitch();
        }else{
			audio.muteAll(audioDisabled);
		}

        if (SKBeInstant.config.gameType === 'ticketReady') {
            gr.getTimer().setTimeout(function () {
                audio.play('BaseMusicLoop', 'base', true);
            }, 0);
        }else{
            gr.getTimer().setTimeout(function () {
                audio.play('GameInit', 'base');
            }, 0);
        }
    }
    
    function onPlayerWantsToMoveToMoneyGame(){
        MTMReinitial = true;
    }
    
    msgBus.subscribe('resourceLoaded', function () {
        if (SKBeInstant.config.customBehavior){
			 if(SKBeInstant.config.customBehavior.enableAudioDialog === true || SKBeInstant.config.customBehavior.enableAudioDialog === "true" || SKBeInstant.config.customBehavior.enableAudioDialog === 1){
				popUpDialog = true;
			}
		}else if(loader.i18n.gameConfig){
			if(loader.i18n.gameConfig.enableAudioDialog === true || loader.i18n.gameConfig.enableAudioDialog === "true" || loader.i18n.gameConfig.enableAudioDialog === 1){
				popUpDialog = true;
			}
		}
        if (popUpDialog){
            audio.enableAudioDialog(true);  //set enable the dialog
        }
    });

    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLotterySKB.onConsoleControlChanged', onConsoleControlChanged);
    msgBus.subscribe('jLotterySKB.reset', reset);
//    msgBus.subscribe('jLottery.initialize', onInitialize);
    msgBus.subscribe('audioPlayer.playerSelectedWhenGameLaunch',onPlayerSelectedAudioWhenGameLaunch);
    msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame',onPlayerWantsToMoveToMoneyGame);
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') {
            hidden = true;
        } else {
            hidden = false;
            if(playResultAudio){
                onEnterResultScreenState();
            }
        }
    });
    
    return {};
});