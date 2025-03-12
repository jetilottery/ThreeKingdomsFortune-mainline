/**
 * @module game/playAnimationController
 * @description 
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
    var symbolsNum = 12, winNum = 3, arrowNum = 3;
    var SymbolsTag = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
    var winNumArray, prizeNumArray;
    var recordMatchTag = {}, tagIndex = 0;
    var prizeDetailArray = []; //To record all symbol to show detail
    var prizeTable = {}; //To record ticket prize table
    var rercodMultipSymbol = [];
    var revealedNum = 0;
    var shootNum = 0, finishedShoot = 0;
    var shootInterval = 900;
    var starInterval = 2000, starIndex;
    var winMoney = {};
    var lightGladSymbol;
    var tutorialIsShown = false;
    var playResult;
    var winChannel=0;
    var symbolChannel = 0;
    var autoSymbolChannel = 0;
    var revealWinChannel = 0;
    var arrowChannel = 0;
    var multipleChannel = 0;
    var revealAll = false;
    var playAnimationName= {};
    var showStarArray = [], showStarIndex = 0;
    var channelNum = 3;
    var clickedNum = 0;
    var winValue = 0;
    

    function resetAll() {
        tagIndex = 0;
        revealedNum = 0;
        recordMatchTag = {};
        prizeDetailArray = [];
        prizeTable = {};
        rercodMultipSymbol = [];
        shootNum = 0;
        finishedShoot = 0;
        arrowNum = 3;
        winMoney = {};
        lightGladSymbol = null;
        tutorialIsShown = false;
        winChannel=0;
        symbolChannel = 0;
        autoSymbolChannel = 0;
        arrowChannel = 0;
        multipleChannel = 0;
        revealWinChannel = 0;
        revealAll = false;
        playAnimationName = {};
        showStarIndex = 0;
        clickedNum = 0;



        for (var i = 0; i < symbolsNum; i++) {
            gr.lib['_Symbol_' + i].reveal = false;

            gr.lib['_Symbol' + i].setImage('symbolAnimI_0001');
            gr.lib['_Symbol' + i].updateCurrentStyle({'_opacity': 1});
            gr.lib['_Symbol' + i].show(true);

            gr.lib['_fireArrow' + i].show(false);
            gr.lib['_moneyBG' + i].show(false);
            gr.lib['_symbolStar'+i].show(false);
            gr.lib['_moneyBG' + i].setImage('moneyBG');
            gr.lib['_symbol_dim'+i].show(false);
            gr.lib['_symbolLight' + i].show(false);
            gr.lib['_Multiple' + i].show(false);
            gr.lib['_Jade' + i].show(false);
            gr.lib['_ArrowBreak' + i].show(false);
            gameUtils.setTextStyle(gr.lib['_moneyText'+ i], {fill:"#e98f0e"});
            gr.animMap['_symbolLightAnim' + i].shouldPlay = false; 
        }

        for (i = 0; i < winNum; i++) {
            gr.lib['_winText' + i].setImage('winText00');
            gr.lib['_winText' + i].show(true);
            gr.lib['_star' + i].show(false);

            gr.lib['_winSymbolLight' + i].show(false);
            gr.lib['_symbolWin' + i].setImage('winSymbolAnimI_0001');
            gr.lib['_winSymbol' + i].reveal = false;
            gr.lib['_winSymbol' + i].revealAnimPlayed = false;
            gr.lib['_winSymbolAnimDim' +i].show(false);
            gr.animMap['_winSymbolLightAnim' + i].shouldPlay = false;
        }
    }

    function cloneGladAnim() {
        for (var i = 1; i < symbolsNum; i++) {
            gr.animMap._symbolLightAnim0.clone(['_symbolLight' + i], '_symbolLightAnim' + i);
            gr.animMap._symbolAnim0.clone(['_Symbol' + i], '_symbolAnim' + i);
            gr.animMap._multipleAnim0.clone(['_Multiple' + i], '_multipleAnim' + i);
        }

        for (i = 1; i < winNum; i++) {
            gr.animMap._winSymbolLightAnim0.clone(['_winSymbolLight' + i], '_winSymbolLightAnim' + i);
        }
    }
    
    function showStar(){
        var playSymbol, index = showStarIndex;
        
        for(; showStarIndex < showStarArray.length;){
            if(showStarArray[showStarIndex].reveal){
                showStarIndex++;
                continue;
            }
            else{
                if(showStarArray[showStarIndex].data._name.indexOf('_winSymbol') >= 0){
                    playSymbol = gr.lib['_star'+ showStarArray[showStarIndex].gameIndex];
                }else{
                    playSymbol = gr.lib['_symbolStar'+ showStarArray[showStarIndex].gameIndex];
                }
                playSymbol.show(true);
                playSymbol.gotoAndPlay('star', 0.6);
                playAnimationName[playSymbol.data._name] = playSymbol;
                showStarIndex++;
                starIndex = gr.getTimer().setTimeout(showStar, starInterval+ Math.floor(Math.random()*1000));
                return;
            }            
        }
        if(index !== 0)
        {
            gameUtils.randomSort(showStarArray);
            showStarIndex = 0;
            showStar();
        }
    }

    function setMoney(symbol, win) {
        gameUtils.setTextStyle(symbol, {stroke: "#ffffff", strokeThickness: 2, fill: "#560000"});
        winMoney[symbol.data._name] = win;
        var key, money = 0;
        for(key in winMoney){
            money += winMoney[key];
        }
        if(money > winValue){
            msgBus.publish('winboxError', {errorCode: '29000'});
			return;
        }
        gr.lib._winsValue.setText(SKBeInstant.formatCurrency(money).formattedAmount);
        gameUtils.fixMeter(gr);
    }

    function setComplete() {
        function setArrowBreakComplete(symbol) {
            symbol.onComplete = function () {
//                console.log(symbol.data._name + " completed");
                symbol.show(false);                
                finishedShoot++;
                checkAllRevealed();
            };
        }

        function setLightGladComplete() {
//            console.log("light completed");
            for (var i = 0; i < winNum; i++) {
                if(gr.animMap['_winSymbolLightAnim' + i].shouldPlay){
                    gr.animMap['_winSymbolLightAnim' + i].play();
                }                    
            }
            for (i = 0; i < symbolsNum; i++) {
                if(gr.animMap['_symbolLightAnim' + i].shouldPlay){
                    gr.animMap['_symbolLightAnim' + i].play();
                }                
            }           
        }
        
        function setStarComplete(symbol){
            symbol.onComplete = function () {
//                console.log(symbol.data._name + " completed");
                symbol.show(false);                
            };
        }
        function setFireArrowComplete(symbol) {
            symbol.onComplete = function () {
                var index = symbol.gameIndex;
                symbol.show(false);
                gr.lib['_Multiple' + index].show(true);
                gr.animMap['_multipleAnim' + index].play();
            };
        }
        function setSymbolAnimComplete(symbol) {
            symbol.onComplete = function () {
                symbol.setImage('symbolAnim' + prizeDetailArray[symbol.gameIndex].symbolTag + '_0015');
                var index = symbol.gameIndex;
                var prizeDetail = prizeDetailArray[index];
                
                gr.lib['_moneyText' + index].setText(prizeDetail.prizeStr);
                gr.lib['_moneyText' + index].show(true);
                if (prizeDetail.match) {
                    if (gr.lib['_winSymbol' + prizeDetail.matchWinSymbolIndex].reveal) {
                        audio.play('RevealWin', 'revealwin'+ revealWinChannel%channelNum);
                        revealWinChannel++;
                        gr.lib['_moneyBG' + index].setImage('moneyWinBG');
                        setMoney(gr.lib['_moneyText'+ index], prizeDetail.win);
                        
                        gr.lib['_symbolLight' + index].show(true);
                        setLightGladSymbol(gr.animMap['_symbolLightAnim' + index]);
                        if (!gr.lib['_winSymbol' + prizeDetail.matchWinSymbolIndex].revealAnimPlayed) {
                            gr.lib['_winText' + prizeDetail.matchWinSymbolIndex].setImage('winText01');
                            gr.lib['_winSymbolLight' + prizeDetail.matchWinSymbolIndex].show(true);
                            setLightGladSymbol(gr.animMap['_winSymbolLightAnim' + prizeDetail.matchWinSymbolIndex]);
                            gr.lib['_winSymbol' + prizeDetail.matchWinSymbolIndex].revealAnimPlayed = true;
                        }
                    }
                }
                gr.lib['_moneyBG' + index].show(true);
                revealedNum++;
                checkAllRevealed();
            };
        }

        function setSymbolGladAnimComplete(gladAnim) {
            gladAnim._onComplete = function () {
                gr.lib['_Jade' + gladAnim.index].show(true);
                gr.lib['_Jade' + gladAnim.index].gotoAndPlay('Jade', 0.3);
                playAnimationName['_Jade' + gladAnim.index] = gr.lib['_Jade' + gladAnim.index];
            };
        }

        function setMultipleGladAnim(gladAnim) {
            gladAnim._onComplete = function () {
                gr.lib['_Multiple'+ gladAnim.index].show(false);
                gr.lib['_moneyText' + gladAnim.index].setText(prizeDetailArray[gladAnim.index].prizeMultiStr);
                gr.lib['_moneyBG' + gladAnim.index].setImage('moneyWinBG');
                setMoney(gr.lib['_moneyText'+ gladAnim.index], prizeDetailArray[gladAnim.index].win);
                finishedShoot++;
                checkAllRevealed();
            };
        }
       
        function setLightGladSymbol(gladAnimSymbol){
            if (!lightGladSymbol) {
                lightGladSymbol = gladAnimSymbol;
                lightGladSymbol._onComplete = setLightGladComplete;
                lightGladSymbol.play();
                gladAnimSymbol.shouldPlay = true;
            } else {
                gladAnimSymbol.shouldPlay = true;
            }
        }
        
        function setWinSymbolShowComplete(symbol){
            symbol.onComplete = function () {
            var index = symbol.gameIndex;
            var obj = recordMatchTag[winNumArray[index]];
            if (obj.matchSymbolIndex.length) {
                for (var i = 0; i < obj.matchSymbolIndex.length; i++) {
                    if (gr.lib['_Symbol_' + obj.matchSymbolIndex[i]].reveal) {
                        if (!gr.lib['_winSymbol'+index].revealAnimPlayed) {
                            gr.lib['_winSymbol'+index].revealAnimPlayed = true;
                            gr.lib['_winText' + index].setImage('winText01');
                            gr.lib['_winSymbolLight' + index].show(true);
                            setLightGladSymbol(gr.animMap['_winSymbolLightAnim' + index]);
                            audio.play('RevealWin', 'revealwin'+ revealWinChannel%channelNum);
                            revealWinChannel++;
                        }
                        gr.lib['_moneyBG' + obj.matchSymbolIndex[i]].setImage('moneyWinBG');
                        setMoney(gr.lib['_moneyText'+ obj.matchSymbolIndex[i]], prizeDetailArray[obj.matchSymbolIndex[i]].win);
                        gr.lib['_symbolLight' + obj.matchSymbolIndex[i]].show(true);
                        setLightGladSymbol(gr.animMap['_symbolLightAnim' + obj.matchSymbolIndex[i]]);
                    }
                }
            }
            revealedNum++;
            checkAllRevealed();
            };
        }

        for (var i = 0; i < symbolsNum; i++) {
            gr.animMap['_symbolAnim' + i].index = i;
            setSymbolGladAnimComplete(gr.animMap['_symbolAnim' + i]);

            gr.animMap['_multipleAnim' + i].index = i;

            setMultipleGladAnim(gr.animMap['_multipleAnim' + i]);
            setArrowBreakComplete(gr.lib['_ArrowBreak' + i]);
            setSymbolAnimComplete(gr.lib['_Symbol' + i]);

            gr.lib['_fireArrow' + i].gameIndex = i;
            setFireArrowComplete(gr.lib['_fireArrow' + i]);
            
            setStarComplete(gr.lib['_symbolStar'+i]);
            
        }

        for (i = 0; i < winNum; i++) {
            gr.lib['_symbolWin'+i].gameIndex = i;
            setWinSymbolShowComplete(gr.lib['_symbolWin'+i]);
            setStarComplete(gr.lib['_star'+i]);
        }

    }

    function shoot() {
        if (shootNum < arrowNum) {
            if (prizeDetailArray[rercodMultipSymbol[shootNum]].multi) {
                gr.lib['_fireArrow' + rercodMultipSymbol[shootNum]].show(true);
                gr.lib['_fireArrow' + rercodMultipSymbol[shootNum]].gotoAndPlay('fireArrow', 0.4);
                gr.animMap['_symbolAnim' + rercodMultipSymbol[shootNum]].play();
                audio.play('WildWinMultiplier', 'multiple' + multipleChannel%channelNum);
                multipleChannel++;
            } else {
                gr.lib['_ArrowBreak' + rercodMultipSymbol[shootNum]].show(true);
                gr.lib['_ArrowBreak' + rercodMultipSymbol[shootNum]].gotoAndPlay('ArrowBreak', 0.2);
                audio.play('Wild', 'wild' + arrowChannel % channelNum);
                arrowChannel++;
            }
            
            shootNum++;
            gr.getTimer().setTimeout(shoot, shootInterval);
        }
    }

    function checkAllRevealed() {
        if (revealedNum < (symbolsNum + winNum)) {
            return;
        } else {
            if(finishedShoot === 0){
                gr.getTimer().clearTimeout(starIndex);
                //msgBus.publish('disableButton');
            }
            if(arrowNum !== 0 && finishedShoot < arrowNum){
                if (finishedShoot === 0) {
                    gr.getTimer().setTimeout(shoot, 1500);
                   // msgBus.publish('disableButton');
                }
                if (finishedShoot < arrowNum) {
                    return;
                }
            }else{
                for (var i = 0; i < symbolsNum; i++) {
                        if (!prizeDetailArray[i].match && !prizeDetailArray[i].multi) {
                            gr.lib['_symbol_dim' + i].setImage('symbolAnim' + prizeDetailArray[i].symbolTag + '_dim');
                            gr.lib['_symbol_dim' + i].show(true);
                        }
                    }
                for (i = 0; i < winNum; i++) {
                    if (recordMatchTag[winNumArray[i]].matchSymbolIndex.length === 0) {
                        gr.lib['_winSymbolAnimDim' + i].setImage('symbolAnim' + recordMatchTag[winNumArray[i]].symbolTag + '_dim');
                        gr.lib['_winSymbolAnimDim' + i].show(true);
                    }
                }
                var money = 0;
                for (var key in winMoney) {
                    money += winMoney[key];
                }
                if (money < winValue) {
                    msgBus.publish('winboxError', {errorCode: '29000'});
                }else if(money > winValue){
					return;
				}else{
                    msgBus.publish('allRevealed');
                }
                    
            }
        }
    }

    function onStartUserInteraction(data) {
        var splitArray;
        if (data.scenario) {
            splitArray = data.scenario.split('|');

            winNumArray = splitArray[0].split(',');
            prizeNumArray = splitArray[1].split(',');
            playResult = data.playResult;
            winValue = data.prizeValue;
        } else {
            return;
        }

        gameUtils.randomSort(showStarArray);
        starIndex = gr.getTimer().setTimeout(showStar, starInterval);
        gameUtils.randomSort(SymbolsTag);
       
        gr.lib._LogoAnim.gotoAndPlay('logoFire',0.5,true);
        playAnimationName[gr.lib._LogoAnim.data._name] = gr.lib._LogoAnim;

        for (var i = 0; i < winNumArray.length; i++) {
            recordMatchTag[winNumArray[i]] = {};
            recordMatchTag[winNumArray[i]].symbolIndex = i;
            recordMatchTag[winNumArray[i]].symbolTag = SymbolsTag[tagIndex++];
            recordMatchTag[winNumArray[i]].matchSymbolIndex = [];
        }

        for (i = 0; i < data.prizeTable.length; i++) {
            prizeTable[data.prizeTable[i].description] = Number(data.prizeTable[i].prize);
        }

        var prizeObj;
        var matchNum = 0;
        var num, prizeAmount, prizeMulti;
        for (i = 0; i < prizeNumArray.length; i++) {
            prizeObj = {};
            splitArray = prizeNumArray[i].split(':');
            num = splitArray[0];
            prizeAmount = splitArray[1].charAt(0);
            prizeMulti = Number(splitArray[1].substr(1));

            if (recordMatchTag[num]) {
                if (prizeMulti === 1) {
                    prizeObj.symbolTag = recordMatchTag[num].symbolTag;
                    prizeObj.prizeStr = SKBeInstant.formatCurrency(prizeTable[prizeAmount]).formattedAmount;
                    prizeObj.matchWinSymbolIndex = recordMatchTag[num].symbolIndex;
                    prizeObj.win = prizeTable[prizeAmount];
                    recordMatchTag[num].matchSymbolIndex.push(i);

                    prizeObj.match = true;
                    matchNum++;
                } else {
                    if (tagIndex < 11) {
                        prizeObj.symbolTag = SymbolsTag[tagIndex++];
                    } else {
                        prizeObj.symbolTag = SymbolsTag[Math.floor(Math.random() * 8) + 3];
                    }
                    prizeObj.prizeStr = SKBeInstant.formatCurrency(prizeTable[prizeAmount]).formattedAmount;
                    prizeObj.prizeMultiStr = SKBeInstant.formatCurrency(prizeTable[prizeAmount] * prizeMulti).formattedAmount;
                    prizeObj.multi = prizeMulti;
                    prizeObj.win = prizeTable[prizeAmount] * prizeMulti;
                    prizeObj.match = false;
                    rercodMultipSymbol.push(i);
                    gr.lib['_Multiple' + i].setImage('Multiple' + prizeMulti);
                }
            } else {
                if (tagIndex < SymbolsTag.length) {
                    prizeObj.symbolTag = SymbolsTag[tagIndex++];
                } else {
                    prizeObj.symbolTag = SymbolsTag[Math.floor(Math.random() * (SymbolsTag.length - winNum)) + winNum];
                }
                prizeObj.prizeStr = SKBeInstant.formatCurrency(prizeTable[prizeAmount]).formattedAmount;
                prizeObj.match = false;
            }
            prizeDetailArray.push(prizeObj);
        }
        
        function alreadyExist(value, Array){
            for(var m=0; m < Array.length; m++){
                if(value === Array[m]){
                    return true;
                }
            }
            return false;
        }
        
        var len = rercodMultipSymbol.length;
        if(len === 0 ){
            arrowNum = 0; 
        }else{
            if (len >= arrowNum) {
                arrowNum = len;
            } else {
                if(matchNum + arrowNum >= symbolsNum){
                    arrowNum = symbolsNum - matchNum;
                }
                for (i = 0; i < arrowNum - len; i++) {
                    var ran = Math.floor(Math.random() * 12);
                    while (prizeDetailArray[ran].multi || prizeDetailArray[ran].match || alreadyExist(ran, rercodMultipSymbol)) {
                        ran = Math.floor(Math.random() * 12);
                    }
                    rercodMultipSymbol.push(ran);
                }
            }
        }

        gameUtils.randomSort(rercodMultipSymbol);

        for (i = 0; i < winNum; i++) {
            gr.lib['_winSymbol' + i].on('click', gr.lib['_winSymbol' + i].revealFun);
        }

        for (i = 0; i < symbolsNum; i++) {
            gr.lib['_Symbol_' + i].on('click', gr.lib['_Symbol_' + i].revealFun);
        }

    }

function stopSpriteAnimation(){
    for(var key in playAnimationName){
        playAnimationName[key].onComplete = null;
        playAnimationName[key].stopPlay();        
    }
}
    function onReStartUserInteraction(data) {
        onStartUserInteraction(data);
    }

    function onReInitialize() {
        stopAllGladAnimAndClearComplete();
        stopSpriteAnimation();
        setComplete();        
        if(starIndex){
            gr.getTimer().clearTimeout(starIndex);           
        }
        resetAll();
    }

    function setWinSymbolRevealFun(symbol) {
        symbol.revealFun = function () {
            if(tutorialIsShown){
                return;
            }
            clickedNum++;
            console.log('clickedNum:'+clickedNum);
            if(clickedNum === (symbolsNum + winNum)){
                msgBus.publish('allSymbolsRevealed');
            }
            audio.play('Reveal1','win' + (winChannel%channelNum));
            winChannel++;
            var index = symbol.gameIndex;
            symbol.off('click');

            var obj = recordMatchTag[winNumArray[index]];
            gr.lib['_symbolWin' + index].gameIndex = index;
            gr.lib['_symbolWin' + index].gotoAndPlay('winSymbolAnim' + obj.symbolTag, 0.4);
            playAnimationName['_symbolWin' + index] = gr.lib['_symbolWin' + index];
            symbol.reveal = true;
            //revealedNum++;
        };
    }

    function setSymbolRevealFun(symbol) {
        symbol.revealFun = function () {
            if(tutorialIsShown){
                return;
            }
            clickedNum++;
             console.log('clickedNum:'+clickedNum);
            if(clickedNum === (symbolsNum + winNum)){
                msgBus.publish('allSymbolsRevealed');
            }
            
            if(revealAll){
                audio.play('Reveal0AutoPlay', 'revealAll' + autoSymbolChannel%channelNum);
                autoSymbolChannel++;
            }else{
                audio.play('Reveal0', 'symbol' + symbolChannel%channelNum);
                symbolChannel++;
            }
            symbol.off('click');
            var index = symbol.gameIndex;
            var prizeDetail = prizeDetailArray[index];

            gr.lib['_Symbol' + index ].gotoAndPlay('symbolAnim' + prizeDetail.symbolTag, 0.4);
            playAnimationName['_Symbol' + index] = gr.lib['_Symbol' + index ];
            symbol.reveal = true;
        };
    }

    function onGameParametersUpdated() {
        prepareAudio();
        cloneGladAnim();
        setComplete();

        for (var i = 0; i < winNum; i++) {
            gr.lib['_winSymbol' + i].gameIndex = i;
            setWinSymbolRevealFun(gr.lib['_winSymbol' + i]);
            showStarArray.push(gr.lib['_winSymbol' + i]);
        }

        for (i = 0; i < symbolsNum; i++) {
            gr.lib['_Symbol_' + i].gameIndex = i;
            gr.lib['_Symbol' + i].gameIndex = i;
            setSymbolRevealFun(gr.lib['_Symbol_' + i]);
            gr.lib['_moneyText'+i].autoFontFitText = true;
            showStarArray.push(gr.lib['_Symbol_' + i]);
        }        
        
        var textStyle = {padding:2, stroke:"#350707", strokeThickness:3, dropShadow: true, dropShadowDistance: 3,dropShadowAlpha: 0.8};
        gr.lib._winLogoText.autoFontFitText = true;
        gr.lib._winLogoText.setText(loader.i18n.Game.luck_number);
        gameUtils.setTextStyle(gr.lib._winLogoText,textStyle);
        
        gr.lib._symbolLogoText.autoFontFitText = true;
        gr.lib._symbolLogoText.setText(loader.i18n.Game.your_number);
        gameUtils.setTextStyle(gr.lib._symbolLogoText,textStyle);
        resetAll();
    }

    function stopAllGladAnim() {
        for (var p in gr.animMap) {
            gr.animMap[p].stop();
        }
    }
    function stopAllGladAnimAndClearComplete() {
        for (var p in gr.animMap) {
            gr.animMap[p]._onComplete = null;
            gr.animMap[p].stop();
        }
    }
    

    function onPlayerWantsPlayAgain() {
        stopAllGladAnim();
        resetAll();
        gr.lib._LogoAnim.stopPlay();
    }
    
    function onStartReveallAll(){
        if(starIndex){
            gr.getTimer().clearTimeout(starIndex);           
        }
        revealAll = true;
    }
    
    function onTutorialIsShown(){
        tutorialIsShown = true;
    }
    
    function onTutorialIsHide(){
        tutorialIsShown = false;
    }
    
    function prepareAudio() {
        for (var i = 0; i < channelNum; i++) {
            audio.play('RevealWin', 'revealwin' + i);
            audio.stopChannel('revealwin' + i);
            
            audio.play('WildWinMultiplier', 'multiple' + i);
            audio.stopChannel('multiple' + i);
            
            audio.play('Wild', 'wild' + i);
            audio.stopChannel('wild' + i);
            
            audio.play('Reveal1', 'win' + i);
            audio.stopChannel('win' + i);
            
            audio.play('Reveal0AutoPlay', 'revealAll' + i);
            audio.stopChannel('revealAll' + i);
            
            audio.play('Reveal0', 'symbol' + i);
            audio.stopChannel('symbol' + i);
        }
    }
    msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLottery.reInitialize', onReInitialize);
    msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
    msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
    msgBus.subscribe('playerWantsPlayAgain', onPlayerWantsPlayAgain);
    msgBus.subscribe('startReveallAll', onStartReveallAll);
    msgBus.subscribe('tutorialIsShown', onTutorialIsShown);
    msgBus.subscribe('tutorialIsHide', onTutorialIsHide);

    return {};
});