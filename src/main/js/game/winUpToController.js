/**
 * @module game/winUpToController
 * @description WinUpTo control
 */
define([
	'skbJet/component/gameMsgBus/GameMsgBus',
	'skbJet/component/gladPixiRenderer/gladPixiRenderer',
	'skbJet/component/pixiResourceLoader/pixiResourceLoader',
	'skbJet/component/SKBeInstant/SKBeInstant',
    '../game/gameUtils'
], function (msgBus, gr, loader, SKBeInstant,gameUtils) {
    
    function fix(){
        var len = gr.lib._winUpTo._currentStyle._width;
        gr.lib._winUpToText.updateCurrentStyle({'_left': (len - (Number(gr.lib._winUpToText.pixiContainer.$text.width) + Number(gr.lib._winUpToValue.pixiContainer.$text.width))) / 2});
        gr.lib._winUpToValue.updateCurrentStyle({'_left': (gr.lib._winUpToText._currentStyle._left + gr.lib._winUpToText.pixiContainer.$text.width)});           
    }

        var style = {padding:2, stroke:"#143002", strokeThickness:4, dropShadow: true, dropShadowDistance: 3,dropShadowAlpha: 0.8};
	function onGameParametersUpdated(){
        gr.lib._winUpToText.setText(loader.i18n.Game.win_up_to);
        gameUtils.setTextStyle(gr.lib._winUpToText, style);
        gameUtils.setTextStyle(gr.lib._winUpToValue, style);
        gr.lib._winUpToText.autoFontFitText = true;
        gr.lib._winUpToValue.autoFontFitText = true;
        fix();
    }
	
    function onTicketCostChanged(prizePoint){
        var rc = SKBeInstant.config.gameConfigurationDetails.revealConfigurations;
		for (var i = 0; i < rc.length; i++) {
			if (Number(prizePoint) === Number(rc[i].price)) {
				var ps = rc[i].prizeStructure;
				var maxPrize = 0;
				for (var j = 0; j < ps.length; j++) {
					var prize = Number(ps[j].prize);
					if (maxPrize < prize) {
						maxPrize = prize;
					}
				}
                gr.lib._winUpToValue.setText(SKBeInstant.formatCurrency(maxPrize).formattedAmount + loader.i18n.Game.win_up_to_mark);
                 gameUtils.setTextStyle(gr.lib._winUpToValue, style);
                fix();
 				return;
			}
		}        
    }
    
    msgBus.subscribe('ticketCostChanged',onTicketCostChanged);
	msgBus.subscribe('SKBeInstant.gameParametersUpdated', onGameParametersUpdated);

	return {};
});