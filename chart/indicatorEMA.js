const utils = require('./utils.js');

module.exports = function indicatorEMA(n, history = 50) {
  // returns an object where averages are calculated
  function indicator(candles) {
    // history defines how many sma values to store
    const vals = [];
    let tstamp = 0;
    let idx = 0;

    function getLastData(last = 0) {
      return candles.getLastCandle(last).close || 0;
    }

    function calcVal(i = 0) {
      // i represent relative shift compared to the original idx
      const prev = vals[(idx - 1 + history) % history];
      const close = getLastData(i) || prev;
      const multi = 2 / (n + 1);

      vals[idx] = ((close - prev) * multi) + prev;
    }

    function genValues() {
      // === initialize vals
      if (vals.length === 0) {
        const data = getLastData();
        for (let i = 0; i < history; i += 1) {
          vals[i] = data;
        }
      }

      let diff = candles.getTstampId() - tstamp;
      tstamp = candles.getTstampId();

      // === handle when just starting out
      if (diff > history) {
        diff = 0;
      }

      // === backtrack previous results
      for (let i = 0; i < diff; i += 1) {
        idx = (idx + 1) % history;
        calcVal(diff - i);
      }
      calcVal();
    }

    function getLastVal(last = 0) {
      if (last > history || last < 0) {
        return 0;
      }

      genValues();
      return vals[(idx - last + history) % history];
    }

    // 1 increase, -1 decrease, 0 constant
    function getLastDirection(last = 0) {
      if (last + 1 > history || last < 0) {
        return 0;
      }

      return utils.getDirection(
        getLastVal(last + 1), getLastVal(last),
      );
    }

    return {
      getLastVal, getLastDirection,
    };
  }

  return indicator;
};
