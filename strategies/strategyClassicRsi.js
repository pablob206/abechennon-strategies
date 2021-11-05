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


const classicRsi = (symbol, src, invertSignal = false, backTesting = false, length, oversold, overbought) => {
    let { open, close, high, low } = src,
    arrayPointRsi = RSI.calculate({ values: close, period: length }),
        flagBuy = false,
        flagSell = false,
        signal = undefined,
        msg,
        objectSignal = { // signal, trigger, price
            [symbol]: {}
        },
        objectPoint = {
            [symbol]: {}
        };

    src.close.map((curr, idx, p) => {
        let i = 499 - idx; // es el indice pero al reves, sirve para ubicarnos en tradingview
        let rsi = arrayPointRsi[idx - length]; // sincronizacion del indice de los cierres con el indice del rsi
        signal = undefined;

        if (flagBuy == false && rsi < oversold) {
            flagBuy = true;
            flagSell = false;
            signal = 'buy';

            if (backTesting == false) {
                msg = `Symbol: ${symbol}. Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}`;
                objectSignal[symbol].signal = signal;
                objectSignal[symbol].trigger = msg;
                objectSignal[symbol].price = close[close.length - 1];
            } else if (backTesting == true) {
                objectPoint[symbol][`${signal}_${i}_Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}, smaVolumeFast: ${smaVolumeFast}`] = curr;
            };

        } else if (flagSell == false && rsi > overbought) {
            flagBuy = false;
            flagSell = true;
            signal = 'sell';

            if (backTesting == false) {
                msg = `Symbol: ${symbol}. Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}`;
                objectSignal[symbol].signal = signal;
                objectSignal[symbol].trigger = msg;
                objectSignal[symbol].price = close[close.length - 1];
            } else if (backTesting == true) {
                objectPoint[symbol][`${signal}_${i}_Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}, smaVolumeFast: ${smaVolumeFast}`] = curr;
            };

        } else {
            if (backTesting == false) {
                objectSignal[symbol].signal = signal;
                objectSignal[symbol].trigger = null;
                objectSignal[symbol].price = null;
            };
        };


    });

    if (backTesting == true) {
        return objectPoint;
    } else {
        return objectSignal;
    };
};


module.exports = classicRsi;