const utils = require('./utils.js');
const candles = require('./candles.js');
const dataLine = require('./dataLine.js');

const sma = require('./indicatorSMA.js');
const ema = require('./indicatorEMA.js');
const norm = require('./indicatorNorm.js');

module.exports = {
  utils,
  candles, dataLine,
  indicators: {
    sma, ema, norm
  },

  mkIndicator: function makeIndicators(func, candleList) {
    return func(candleList);
  },
};
