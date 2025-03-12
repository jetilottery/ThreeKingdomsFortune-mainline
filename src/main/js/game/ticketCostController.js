/**
 * @module game/ticketCost
 * @description ticket cost meter control
 */
define([
    'skbJet/component/gladPixiRenderer/Sprite',
	'skbJet/component/gameMsgBus/GameMsgBus',
	'skbJet/component/audioPlayer/AudioPlayerProxy',
	'skbJet/component/gladPixiRenderer/gladPixiRenderer',
	'skbJet/component/pixiResourceLoader/pixiResourceLoader',
	'skbJet/component/SKBeInstant/SKBeInstant',
    'skbJet/componentCRDC/gladRenderer/gladButton',
    '../game/gameUtils'
], function (Sprite, msgBus, audio, gr, loader, SKBeInstant, gladButton, gameUtils) {
    
    var plusButton, minusButton;
    var _currentPrizePoint, prizePointList;
    var ticketIcon, ticketIconObj = null;
    var boughtTicket = false;
    var channelNum = 3;
    var ButtonBetUpChannel = 0;
    var ButtonBetDownChannel = 0;
    var MTMReinitial = false;
    
    function registerControl() {
        var formattedPrizeList = [];
        var strPrizeList = [];
        for (var i = 0; i < prizePointList.length; i++) {
            formattedPrizeList.push(SKBeInstant.formatCurrency(prizePointList[i]).formattedAmount);
            strPrizeList.push(prizePointList[i] + '');
        }
        var priceText, stakeText;
        if(SKBeInstant.isWLA()){
            priceText = loader.i18n.MenuCommand.WLA.price;
            stakeText = loader.i18n.MenuCommand.WLA.stake;
        }else{
            priceText = loader.i18n.MenuCommand.Commercial.price;
            stakeText = loader.i18n.MenuCommand.Commercial.stake;            
        }
        
        msgBus.publish("jLotteryGame.registerControl", [{
                name: 'price',
                text: priceText,
                type: 'list',
                enabled: 1,
                valueText: formattedPrizeList,
                values: strPrizeList,
                value: SKBeInstant.config.gameConfigurationDetails.pricePointGameDefault
            }]);
        msgBus.publish("jLotteryGame.registerControl", [{
            name: 'stake',
            text: stakeText,
            type: 'stake',
            enabled: 0,
            valueText: '0',
            value: 0
        }]);
    }
    
    function gameControlChanged(value) {
        msgBus.publish("jLotteryGame.onGameControlChanged",{
			name: 'stake',
			event: 'change',
			params: [SKBeInstant.formatCurrency(value).amount/100, SKBeInstant.formatCurrency(value).formattedAmount]
		});
        
        msgBus.publish("jLotteryGame.onGameControlChanged",{
			name: 'price',
			event: 'change',
			params: [value, SKBeInstant.formatCurrency(value).formattedAmount]
		});
	}
    
    function onConsoleControlChanged(data){
        if (data.option === 'price') {
            setTicketCostValue(Number(data.value));
            
            msgBus.publish("jLotteryGame.onGameControlChanged", {
                name: 'stake',
                event: 'change',
                params: [SKBeInstant.formatCurrency(data.value).amount/100, SKBeInstant.formatCurrency(data.value).formattedAmount]
            });
        }
    }

    function onGameParametersUpdated() {
        prepareAudio();
        gr.lib._ticketCostText.autoFontFitText = true;
        gr.lib._ticketCostText.setText(loader.i18n.Game.wager);
        gameUtils.setTextStyle(gr.lib._ticketCostText,{padding:8, stroke:"#350707", strokeThickness:2, fill:"#ffffff"});
        
        gameUtils.setTextStyle(gr.lib._ticketCostValue,{padding:2, stroke:"#350707", strokeThickness:2, fill:"#ffffff"});
        gr.lib._ticketCostValue.autoFontFitText = true;
		
        prizePointList = [];
        ticketIcon = {};

        var style = {
            "_id": "_dfgbka",
            "_name": "_ticketCostLevelIcon_",
            "_SPRITES": [],
            "_style": {
                "_width": "30",
                "_height": "6",
                "_left": "196",
                "_background": {
                    "_imagePlate": "_ticketCostLevelIconOff"
                },
                "_top": "86",
                "_transform": {
                    "_scale": {
                        "_x": "0.6",
                        "_y": "0.75"
                    }
                }
            }
        };

        var length = SKBeInstant.config.gameConfigurationDetails.revealConfigurations.length;
        var width = Number(style._style._width) * Number(style._style._transform._scale._x);
        var space = 4;
        var left = (gr.lib._ticketCost._currentStyle._width - (length * width + (length - 1) * space)) / 2;
        for (var i = 0; i < length; i++) {
            var spData = JSON.parse(JSON.stringify(style));
            spData._id = style._id + i;
            spData._name = spData._name + i;
            spData._style._left = left + (width + space) * i;
            var sprite = new Sprite(spData);
            gr.lib._ticketCost.pixiContainer.addChild(sprite.pixiContainer);

            var price = SKBeInstant.config.gameConfigurationDetails.revealConfigurations[i].price;
            prizePointList.push(price);
            ticketIcon[price] = "_ticketCostLevelIcon_" + i;
		}
        var scaleType = {'scaleXWhenClick': 0.92, 'scaleYWhenClick': 0.92};
        plusButton = new gladButton(gr.lib._ticketCostPlus, "ticketCostPlus", {'scaleXWhenClick': -0.92, 'scaleYWhenClick': 0.92});       
        minusButton = new gladButton(gr.lib._ticketCostMinus, "ticketCostMinus", scaleType);        
        registerControl();
        
        if(prizePointList.length <= 1){
            plusButton.show(false);
            minusButton.show(false);
        }else{
            plusButton.show(true);
			minusButton.show(true);

            plusButton.click(increaseTicketCost);
            minusButton.click(decreaseTicketCost);
        }

	}

	function setTicketCostValue(prizePoint) {
		var index = prizePointList.indexOf(prizePoint);
		if (index < 0) {
			msgBus.publish('error', 'Invalide prize point ' + prizePoint);
			return;
		}
        
        plusButton.enable(true);
        minusButton.enable(true);        
        
		if (index === 0) {
            minusButton.enable(false);
		} 
        
		if (index === (prizePointList.length - 1)) {
            plusButton.enable(false);
		} 
        
        var valueString = SKBeInstant.formatCurrency(prizePoint).formattedAmount;

        if(SKBeInstant.config.wagerType === 'BUY'){
            gr.lib._ticketCostValue.setText(valueString);
        }else{
            gr.lib._ticketCostValue.setText(loader.i18n.Game.demo +  valueString);
        }         
      
        gameUtils.setTextStyle(gr.lib._ticketCostValue,{padding:2, stroke:"#350707", strokeThickness:2, fill:"#ffffff"});
        
        if (ticketIconObj) {
            ticketIconObj.setImage('ticketCostLevelIconOff');
        }
        ticketIconObj = gr.lib[ticketIcon[prizePoint]];
        ticketIconObj.setImage('ticketCostLevelIconOn');
        
		_currentPrizePoint = prizePoint;
		msgBus.publish('ticketCostChanged', prizePoint);
	}
    
    function setTicketCostValueWithNotify(prizePoint){
        setTicketCostValue(prizePoint);
        gameControlChanged(prizePoint);
    }

	function increaseTicketCost() {
		var index = prizePointList.indexOf(_currentPrizePoint);
		index++;
        setTicketCostValueWithNotify(prizePointList[index]);
        if(index === prizePointList.length-1){
            audio.play('ButtonBetMax', 'ButtonBetMax');
        }else{
            audio.play('ButtonBetUp', 'ButtonBetUp'+ (ButtonBetUpChannel%channelNum));
            ButtonBetUpChannel++;
        }		
	}

	function decreaseTicketCost() {
		var index = prizePointList.indexOf(_currentPrizePoint);
		index--;
        setTicketCostValueWithNotify(prizePointList[index]);
        audio.play('ButtonBetDown', 'ButtonBetDown' + (ButtonBetDownChannel % channelNum));
        ButtonBetDownChannel++;
	}

	function setDefaultPricePoint() {
        setTicketCostValueWithNotify(SKBeInstant.config.gameConfigurationDetails.pricePointGameDefault);
	}

	function onInitialize() {
        setDefaultPricePoint();
        gr.lib._ticketCost.show(false);
	}

	function onReInitialize() {
        if(MTMReinitial){
            enableConsole();
            setDefaultPricePoint();
            boughtTicket = false;
            gr.lib._ticketCost.show(false);
            MTMReinitial = false;
        }else{
            onReset();
        }

	}
    
    function onReset(){
        enableConsole();
        if(_currentPrizePoint){
            setTicketCostValueWithNotify(_currentPrizePoint);
        }else{
            setDefaultPricePoint();
        }
        boughtTicket = false;
        gr.lib._ticketCost.show(true);
    }

	function onStartUserInteraction(data) {
        ButtonBetUpChannel = 0;
        ButtonBetDownChannel = 0;
        disableConsole();
        boughtTicket = true;
        gr.lib._ticketCost.show(false);
		if (data.price) {
			_currentPrizePoint = data.price;
            setTicketCostValueWithNotify(_currentPrizePoint);
		} 
		msgBus.publish('ticketCostChanged', _currentPrizePoint);
	}

	function onReStartUserInteraction(data) {
		onStartUserInteraction(data);
	}

	function enableConsole(){
        msgBus.publish('toPlatform',{
            channel:"Game",
            topic:"Game.Control",
            data:{"name":"price","event":"enable","params":[1]}
        });
    } 
	function disableConsole(){
        msgBus.publish('toPlatform',{
            channel:"Game",
            topic:"Game.Control",
            data:{"name":"price","event":"enable","params":[0]}
        });
    }

    function onPlayerWantsPlayAgain(){
        boughtTicket = false;
        enableConsole();
        setTicketCostValueWithNotify(_currentPrizePoint);        
        gr.lib._ticketCost.show(true);
    }
    
    function onTutorialIsShown(){
        if(!boughtTicket){
            gr.lib._ticketCost.show(false);
        }
    }
    function onTutorialIsHide(){
        if(!boughtTicket){
            gr.lib._ticketCost.show(true);
        }
    }
    function onDisableUI(){
        plusButton.enable(false);
        minusButton.enable(false);
    }
    
        function prepareAudio() {
        for (var i = 0; i < channelNum; i++) {
            audio.play('ButtonBetUp', 'ButtonBetUp' + i);
            audio.stopChannel('ButtonBetUp' + i);
            
            audio.play('ButtonBetDown', 'ButtonBetDown' + i);
            audio.stopChannel('ButtonBetDown' + i);
        }
    }
    
//    function onEnterResultScreenState(){
//        enableConsole();
//    }
    function onPlayerWantsToMoveToMoneyGame(){
        MTMReinitial = true;
    }

    msgBus.subscribe("playerWantsPlayAgain", onPlayerWantsPlayAgain);
	msgBus.subscribe('jLottery.reStartUserInteraction', onReStartUserInteraction);
	msgBus.subscribe('jLottery.initialize', onInitialize);
	msgBus.subscribe('jLottery.reInitialize', onReInitialize);
	msgBus.subscribe('jLottery.startUserInteraction', onStartUserInteraction);
	msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);
    msgBus.subscribe('jLotterySKB.onConsoleControlChanged', onConsoleControlChanged);
    msgBus.subscribe('jLotterySKB.reset', onReset);
    msgBus.subscribe('tutorialIsShown', onTutorialIsShown);
    msgBus.subscribe('tutorialIsHide', onTutorialIsHide);
    msgBus.subscribe('disableUI', onDisableUI);
//    msgBus.subscribe('jLottery.enterResultScreenState', onEnterResultScreenState);
    msgBus.subscribe('jLotteryGame.playerWantsToMoveToMoneyGame',onPlayerWantsToMoveToMoneyGame);
    

	return {};
});