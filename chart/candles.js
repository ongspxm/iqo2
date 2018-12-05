const utils = require('./utils.js');

function makeCandle(initial) {
  const candle = {
    open: initial,
    close: 0,
    low: initial,
    high: 0,
  };

  candle.update = function updateCandle(data = 0) {
    if (data > candle.high) {
      candle.high = data;
    }

    if (data < candle.low) {
      candle.low = data;
    }

    candle.close = data;
  };

  // get average of open and close
  candle.getAvg = function getAverage() {
    return utils.getAverage(candle.low, candle.high);
  };

  // 1 for increase, -1 for decrease, 0 for no change
  candle.getDirection = function getDirection() {
    return utils.getDirection(candle.open, candle.close);
  };

  return candle;
}

// tframe sets the timeframe of the candles (default 15s)
module.exports = function candleList(tframe = 15, windowSize = 100) {
  let idx = 0;
  let tstampId = 0;
  const candles = [];

  function insert(tstamp, data) {
    const timeId = parseInt(tstamp / tframe, 10);

    if (timeId !== tstampId) {
      tstampId = timeId;
      idx = (idx + 1) % windowSize;

      candles[idx] = makeCandle(data);
    }

    candles[idx].update(data);
  }

  // get last x-th candle
  function getLastCandle(last = 0) {
    return candles[(idx - last + windowSize) % windowSize] || makeCandle();
  }

  // to calculate which candle is it now
  function getTstampId() {
    return tstampId;
  }

  return {
    insert, getLastCandle, getTstampId,
  };
};
