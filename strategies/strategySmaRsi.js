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
const SMA = require('technicalindicators').SMA;

// formato de, ej: inputHistoryCandlestick[ETHUSDT]
// {
//     open: [],
//     close: [],
//     high: [],
//     low: [],
//     volume: []
// }

const strategySmaRsi = (symbol, src, invertSignal = false, backTesting = false, lengthRsi, oversold, overbought, crossover = true, lengthSmaCloseFast, lengthSmaCloseSlow, lengthSmaVolume, thresholdVolumeMarkets) => {
    let { open, close, high, low, volume } = src;

    let inputRsi = { values: close, period: lengthRsi },
        inputSmaCloseFast = { values: close, period: lengthSmaCloseFast },
        inputSmaCloseSlow = { values: close, period: lengthSmaCloseSlow },
        inputSmaVolume = { values: volume, period: lengthSmaVolume };

    let arrayPointRsi = RSI.calculate(inputRsi),
        arrayPointSmaCloseFast = SMA.calculate(inputSmaCloseFast),
        arrayPointSmaCloseSlow = SMA.calculate(inputSmaCloseSlow),
        arrayPointSmaVolume = SMA.calculate(inputSmaVolume);

    let neutralZone = true, // flujo neutral
        sideZone = false, // mercado lateral
        trendZone = false, // mercado tendencia alcista
        rallyUp = false,
        rallyDown = false, // mercado tendencia bajista
        oversoldZone = false, // zono sobrevendido 30
        overboughtZone = false, // zona sobrecompra 70
        flagBuy = false,
        flagSell = false,
        signal,
        msg,
        objectSignal = { // signal, trigger, price
            [symbol]: {}
        },
        objectPoint = {
            [symbol]: {}
        };


    src.close.forEach((curr, idx, pSrc) => {
        let i = 499 - idx; // sirve para ubicarnos en tradingview
        signal = null;

        if (arrayPointSmaVolume[idx - (lengthSmaVolume - 1)] != undefined) {
            let rsi = arrayPointRsi[idx - lengthRsi],
                smaCloseFast = arrayPointSmaCloseFast[idx - (lengthSmaCloseFast - 1)], // periodo rapido
                smaCloseSlow = arrayPointSmaCloseSlow[idx - (lengthSmaCloseSlow - 1)], // periodo corto
                smaVolume = arrayPointSmaVolume[idx - (lengthSmaVolume - 1)],
                currentVolume = src.volume[idx]; // volumen actual

            // console.log(idx);
            // console.log(curr);
            // console.log(rsi); // requiere =period
            // console.log(smaCloseSlow); // actual, periodo lento. requiere =length
            // console.log(smaCloseFast); // actual, periodo rapido. requiere =length
            // console.log(arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)]); // actual -1
            // console.log(arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]); // actual -2
            // console.log(currentVolume);
            // console.log("---------------------------------");

            // flujo de control
            if (currentVolume <= (smaVolume * thresholdVolumeMarkets) && neutralZone == true) { // mercado lateral activo
                sideZone = true;
                trendZone = false;
                neutralZone = false;
            } else if (currentVolume > (smaVolume * thresholdVolumeMarkets) && neutralZone == true) { // mercado en tendencia 
                sideZone = false;
                trendZone = true;
                neutralZone = false;
            };


            // mercado lateral
            if (sideZone == true && neutralZone == false) {
                if (crossover == true) {
                    if (flagBuy == false && oversoldZone == true && rsi > oversold) { // buy zone, oversold
                        oversoldZone = false;
                        flagBuy = true;
                        flagSell = false;
                        signal = 'buy';

                        if (backTesting == false) {
                            msg = `Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}`;
                            signal;
                            objectSignal[symbol].signal = signal;
                            objectSignal[symbol].trigger = msg;
                            objectSignal[symbol].price = close[close.length - 1];
                        } else if (backTesting == true) {
                            objectPoint[symbol][`${signal}_${i}_Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
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
                            objectPoint[symbol][`${signal}_${i}_Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
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

                    // salida de sideZone
                    neutralZone = true;

                } else {
                    if (flagBuy == false && rsi < oversold) { // buy zone, oversold
                        flagBuy = true;
                        flagSell = false;
                        signal = 'buy';

                        if (backTesting == false) {
                            msg = `Symbol: ${symbol}. Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}`;
                            signal;
                            objectSignal[symbol].signal = signal;
                            objectSignal[symbol].trigger = msg;
                            objectSignal[symbol].price = close[close.length - 1];
                        } else if (backTesting == true) {
                            objectPoint[symbol][`${signal}_${i}_Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
                        };
                    } else if (flagSell == false && rsi > overbought) { // sell zone, overbought
                        flagBuy = false;
                        flagSell = true;
                        signal = 'sell';

                        if (backTesting == false) {
                            msg = `Symbol: ${symbol}. Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}`;
                            signal;
                            objectSignal[symbol].signal = signal;
                            objectSignal[symbol].trigger = msg;
                            objectSignal[symbol].price = close[close.length - 1];
                        } else if (backTesting == true) {
                            objectPoint[symbol][`${signal}_${i}_Trigger: RSI: ${rsi}, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
                        };
                    } else {
                        if (backTesting == false) {
                            objectSignal[symbol].signal = signal;
                            objectSignal[symbol].trigger = null;
                            objectSignal[symbol].price = null;
                        };
                    };

                    // salida de sideZone
                    neutralZone = true;

                };



                // mercado en tendencia
            } else if (trendZone == true && neutralZone == false) {
                // if (flagBuy == false && rallyDown == false && rallyUp == false && smaCloseFast > smaCloseSlow) { // mercado en tendencia alcista || smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]
                if (flagBuy == false && rallyDown == false && rallyUp == false && smaCloseFast > arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast > arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]) { // mercado en tendencia alcista || smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]
                    flagBuy = true;
                    flagSell = false;
                    rallyUp = true;
                    rallyDown = false;
                    if (invertSignal == true) {
                        signal = 'sell';
                    } else {
                        signal = 'buy';
                    };

                    if (backTesting == false) {
                        msg = `Symbol: ${symbol}. Trigger-ID.1: rallyUp, (RSI: ${rsi}), currentVolume: ${currentVolume}`;
                        signal;
                        objectSignal[symbol].signal = signal;
                        objectSignal[symbol].trigger = msg;
                        objectSignal[symbol].price = close[close.length - 1];
                    } else if (backTesting == true) {
                        objectPoint[symbol][`${signal}_${i}_Trigger-ID.1: rallyUp, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
                    };

                    // } else if (flagSell == false && rallyUp == false && rallyDown == false && smaCloseFast < smaCloseSlow) { // mercado en tendencia bajista 
                } else if (flagSell == false && rallyUp == false && rallyDown == false && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]) { // mercado en tendencia bajista 
                    rallyUp = false;
                    rallyDown = true;
                    flagBuy = false;
                    flagSell = true;
                    if (invertSignal == true) {
                        signal = 'buy';
                    } else {
                        signal = 'sell';
                    };

                    if (backTesting == false) {
                        msg = `Symbol: ${symbol}. Trigger-ID.2: rallyDown, (RSI: ${rsi}), currentVolume: ${currentVolume}`;
                        signal;
                        objectSignal[symbol].signal = signal;
                        objectSignal[symbol].trigger = msg;
                        objectSignal[symbol].price = close[close.length - 1];
                    } else if (backTesting == true) {
                        objectPoint[symbol][`${signal}_${i}_Trigger-ID.2: rallyDown, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
                    };

                    // } else if (flagBuy == true && rallyDown == false && rallyUp == false && smaCloseFast > smaCloseSlow) { // mercado en tendencia alcista || smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]
                } else if (flagBuy == true && rallyDown == false && rallyUp == false && smaCloseFast > arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast > arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]) { // mercado en tendencia alcista || smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]
                    // flagBuy = true;
                    flagSell = false;
                    rallyUp = true;
                    rallyDown = false;

                    if (backTesting == true) {
                        objectPoint[symbol][`change_control_${i}_Trigger-ID.3: rallyUp, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
                    };

                    // } else if (flagSell == true && rallyDown == false && rallyUp == false && smaCloseFast < smaCloseSlow) { // mercado en tendencia bajista || smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]
                } else if (flagSell == true && rallyDown == false && rallyUp == false && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]) { // mercado en tendencia bajista || smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]
                    flagBuy = false;
                    // flagSell = true;
                    rallyUp = false;
                    rallyDown = true;
                    if (backTesting == true) {
                        objectPoint[symbol][`change_control_${i}_Trigger-ID.4: rallyDown, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
                    };

                    // } else if (flagSell == true && rallyDown == false && rallyUp == false && smaCloseFast > smaCloseSlow) { // mercado en tendencia alcista || smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]
                } else if (flagSell == true && rallyDown == false && rallyUp == false && smaCloseFast > arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast > arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]) { // mercado en tendencia alcista || smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]
                    flagBuy = true;
                    flagSell = false;
                    rallyUp = true;
                    rallyDown = false;
                    if (invertSignal == true) {
                        signal = 'sell';
                    } else {
                        signal = 'buy';
                    };

                    if (backTesting == false) {
                        msg = `Symbol: ${symbol}. Trigger-ID.5: rallyUp, (RSI: ${rsi}), currentVolume: ${currentVolume}`;
                        signal;
                        objectSignal[symbol].signal = signal;
                        objectSignal[symbol].trigger = msg;
                        objectSignal[symbol].price = close[close.length - 1];
                    } else if (backTesting == true) {
                        objectPoint[symbol][`${signal}_${i}_Trigger-ID.5: rallyUp, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
                    };

                    // } else if (flagBuy == true && rallyDown == false && rallyUp == false && smaCloseFast < smaCloseSlow) { // mercado en tendencia bajista || smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]
                } else if (flagBuy == true && rallyDown == false && rallyUp == false && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]) { // mercado en tendencia bajista || smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]
                    flagBuy = false;
                    flagSell = true;
                    rallyUp = false;
                    rallyDown = true;
                    if (invertSignal == true) {
                        signal = 'buy';
                    } else {
                        signal = 'sell';
                    };

                    if (backTesting == false) {
                        msg = `Symbol: ${symbol}. Trigger-ID.6: rallyDown, (RSI: ${rsi}), currentVolume: ${currentVolume}`;
                        signal;
                        objectSignal[symbol].signal = signal;
                        objectSignal[symbol].trigger = msg;
                        objectSignal[symbol].price = close[close.length - 1];
                    } else if (backTesting == true) {
                        objectPoint[symbol][`${signal}_${i}_Trigger-ID.6: rallyDown, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
                    };

                } else {
                    if (backTesting == false) {
                        objectSignal[symbol].signal = signal;
                        objectSignal[symbol].trigger = null;
                        objectSignal[symbol].price = null;
                    };
                };


                // salida del trendZone
                // if (rallyUp == true && smaCloseFast < smaCloseSlow) {
                if (rallyUp == true && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast < arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]) {
                    rallyUp = false;
                    rallyDown = false;
                    flagBuy = false;
                    flagSell = false;
                    neutralZone = true;
                    oversoldZone = false;
                    overboughtZone = false;
                    signal = 'close';

                    if (backTesting == false) {
                        msg = `Symbol: ${symbol}. Salida del trendZone. Trigger: rallyUp, (RSI: ${rsi}), currentVolume: ${currentVolume}`;
                        signal;
                        objectSignal[symbol].signal = signal;
                        objectSignal[symbol].trigger = msg;
                        objectSignal[symbol].price = close[close.length - 1];
                    } else if (backTesting == true) {
                        objectPoint[symbol][`${signal}_${i}_Trigger: rallyUp, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
                    };

                    // } else if (rallyDown == true && smaCloseFast > smaCloseSlow) {
                } else if (rallyDown == true && smaCloseFast > arrayPointSmaCloseFast[idx - (lengthSmaCloseFast)] && smaCloseFast > arrayPointSmaCloseFast[idx - (lengthSmaCloseFast + 1)]) {
                    rallyUp = false;
                    rallyDown = false;
                    flagBuy = false;
                    flagSell = false;
                    neutralZone = true;
                    oversoldZone = false;
                    overboughtZone = false;
                    signal = 'close';

                    if (backTesting == false) {
                        msg = `Symbol: ${symbol}. Salida del trendZone. Trigger: rallyDown, (RSI: ${rsi}), currentVolume: ${currentVolume}`;
                        signal;
                        objectSignal[symbol].signal = signal;
                        objectSignal[symbol].trigger = msg;
                        objectSignal[symbol].price = close[close.length - 1];
                    } else if (backTesting == true) {
                        objectPoint[symbol][`${signal}_${i}_Trigger: rallyDown, currentVolume: ${currentVolume}, smaVolume: ${smaVolume}`] = curr;
                    };

                };

            };

        };
    });



    // console.log(objectSignal);
    if (backTesting == true) {
        return objectPoint;
    } else {
        return objectSignal;
    };


};

module.exports = strategySmaRsi;