const candleList = require('./candles.js');

module.exports = function dataLine(expiry) {
  const candles = candleList(1, expiry*2);

  function insertData(tstamp, curr) {
    candles.insert(tstamp, curr);
  }

  function getData(padding = 0) {
    const history = [];
    const full = expiry + padding;
    for(let i=0; i < full; i += 1) {
      history.push(candles.getLastCandle(full-1-i).close);
    }

    return history;
  }

  return {
    insertData, getData
  };
}
