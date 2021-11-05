/* ============================================================
 * Abechennon Margin Trader Bot Binance
 * https://github.com/pablob206/abechennon
 * ============================================================
 * Copyright 2021-, Pablo Brocal - pablob206@hotmail.com
 * Released under the MIT License
 * ============================================================
 */

const util = require('util') // console.log(util.inspect(array, { maxArrayLength: null }));
const RSI = require('technicalindicators').RSI;


const classicRsiWithCrossover = (symbol, src, invertSignal = false, backTesting = false, length, oversold, overbought) => {
    let { open, close, high, low } = src,
    arrayPointRsi = RSI.calculate({ values: close, period: length }),
        flagBuy = false,
        flagSell = false,
        oversoldZone = false,
        overboughtZone = false,
        signal,
        msg,
        objectSignal = { // signal, trigger, price
            [symbol]: {}
        },
        objectPoint = {
            [symbol]: {}
        };

    src.close.map((curr, idx) => {
        let i = 499 - idx; // es el indice pero al reves, sirve para ubicarnos en tradingview
        let rsi = arrayPointRsi[idx - length]; // sincronizacion del indice de los cierres con el indice del rsi
        signal = undefined;


        if (flagBuy == false && oversoldZone == true && rsi > oversold) { // buy zone, oversold
            oversoldZone = false;
            flagBuy = true;
            flagSell = false;
            signal = 'buy';

            if (backTesting == false) {
                msg = `Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}`;
                objectSignal[symbol].signal = signal;
                objectSignal[symbol].trigger = msg;
                objectSignal[symbol].price = close[close.length - 1];
            } else if (backTesting == true) {
                objectPoint[symbol][`${signal}_${i}_Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}, smaVolumeFast: ${smaVolumeFast}`] = curr;
            };
        } else if (flagSell == false && overboughtZone == true && rsi < overbought) { // sell zone, overbought
            overboughtZone = false;
            flagBuy = false;
            flagSell = true;
            signal = 'sell';

            if (backTesting == false) {
                msg = `Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}`;
                signal;
                objectSignal[symbol].signal = signal;
                objectSignal[symbol].trigger = msg;
                objectSignal[symbol].price = close[close.length - 1];
            } else if (backTesting == true) {
                objectPoint[symbol][`${signal}_${i}_Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}, smaVolumeFast: ${smaVolumeFast}`] = curr;
            };
        } else {
            objectSignal[symbol].signal = signal;
            objectSignal[symbol].trigger = null;
            objectSignal[symbol].price = null;
        };

        if (flagBuy == false && rsi < oversold) { // buy zone
            oversoldZone = true;
        } else if (flagSell == false && rsi > overbought) { // sell zone
            overboughtZone = true;
        };

    });

    if (backTesting == true) {
        return objectPoint;
    } else {
        return objectSignal;
    };
};


module.exports = classicRsiWithCrossover;