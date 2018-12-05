const chart = require('./chart/chart.js');
const utils = require('./utils.js');
const optionList = require('./options.js');

const WINDOW = 30;
const MARGIN = 0.3;
const TMARGIN = 1.5;

// setCandleWindow(n), insertCandle(tstamp, val)
// makeGuess(tleft), checkGuess(diff)
module.exports = function strategyNorm(turbo) {
  const candles = chart.candles(1, WINDOW * 2);
  const norm = chart.mkIndicator(chart.indicators.norm(WINDOW), candles);

  function insertData(tstamp, val) {
    return candles.insert(tstamp, val);
  }

  let currTstamp = 0;
  const options = optionList();
  const stats = { right: 0, wrong: 0 };

  const buyValue = [];
  const cdfMovement = [];
  const actMovement = [];
  const chkMovement = [];
  let idx = 0;

  function checkGuess(tstamp, val) {
    if (cdfMovement[idx]) {
      const direction = utils.getDirection(0, val - buyValue[idx]);
      const match = direction * cdfMovement[idx];
      if (currTstamp !== tstamp && tstamp % turbo.expiry === 0) {
        actMovement[idx] = direction;
        chkMovement[idx] = match;

        if (process.env.DEBUG) {
          console.log(JSON.stringify(cdfMovement));
          console.log(JSON.stringify(actMovement));
          console.log(JSON.stringify(chkMovement));
          console.log('norm strategy\n');
        }

        idx = (idx + 1) % WINDOW;
        buyValue[idx] = undefined;
        cdfMovement[idx] = undefined;

        currTstamp = tstamp;
      }

      const data = options.checkGuess(tstamp, val);
      data.forEach((opt) => {
        if (opt.correct === 1) {
          stats.right += 1;
        } else {
          stats.wrong += 1;
        }
      });
    }
  }

  function makeGuess(tstamp, val) {
    const { expiry } = turbo;
    const tpos = tstamp % expiry;

    if (cdfMovement[idx]
      || tpos > expiry - turbo.deadtime
      || tpos > expiry - (turbo.deadtime * TMARGIN)) {
      return null;
    }

    const zcdf = norm.getMultiNormCdf(expiry - tpos, 0);

    let direction = 0;
    if (zcdf < MARGIN) { direction = -1; }
    if (zcdf > (1 - MARGIN)) { direction = 1; }

    // --- keep updating val even though not bought, for actMovement
    buyValue[idx] = val;
    cdfMovement[idx] = direction;

    return (direction === 0) ? null
      : options.makeGuess(val, tstamp, direction, expiry);
  }

  function getStats() {
    return stats;
  }

  return {
    makeGuess,
    checkGuess,
    insertData,
    getStats,
  };
};
