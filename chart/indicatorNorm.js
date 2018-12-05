const indicatorSMA = require('./indicatorSMA.js');

function probz(xo) {
  const neg = (xo < 0);
  const x = neg ? -xo : xo;

  const z = Math.exp(-(x * x) / 2) / Math.sqrt(2 * Math.PI);

  const cst = new Array(6);
  cst[0] = 0.2316419;
  cst[1] = 0.319381530;
  cst[2] = -0.356563782;
  cst[3] = 1.781477937;
  cst[4] = -1.821255978;
  cst[5] = 1.330274429;

  const q = new Array(5);
  q[0] = 1 / ((cst[0] * x) + 1);
  q[1] = q[0] * q[0];
  q[2] = q[1] * q[0];
  q[3] = q[2] * q[0];
  q[4] = q[3] * q[0];

  // The final calculation
  let qx;
  qx = z * (
    q[0] * cst[1]
    + q[1] * cst[2]
    + q[2] * cst[3]
    + q[3] * cst[4]
    + q[4] * cst[5]);

  // Using our 'negative' flag to determine how the
  // value should be returned.
  qx = neg ? qx : 1 - qx;

  // 'qx' is the value to return from the function
  // We can use 'qx.toFixed(n)' to limit it to 'n' significant digits.
  return qx;
}

module.exports = function indicatorNorm(winSize, history = 50) {
  // returns an object where averages are calculated
  function indicator(candles) {
    const vals = (indicatorSMA(winSize))(candles);
    const means = [];
    const diffs = [];
    const varis = [];

    // history defines how many sma values to store
    let tstamp = 0;
    let idx = 0;

    function calcVal(shifted = 0) {
      diffs[idx] = vals.getLastVal(shifted) - vals.getLastVal(shifted+1);

      const idx2 = diff => (idx - diff + history) % history;
      means[idx] = (means[idx2(1)] * winSize || 0)
        - (diffs[idx2(winSize)] || 0)
        + (diffs[idx] || 0);
      means[idx] /= winSize;
      const mean = means[idx];

      let sdiffs = 0;
      for (let i = 0; i < winSize; i += 1) {
        sdiffs += (diffs[idx2(i)] - mean) ** 2;
      }
      varis[idx] = sdiffs / winSize;
    }

    function genValues() {
      // === initialize varis
      if (varis.length === 0) {
        for (let i = 0; i < history; i += 1) {
          varis[i] = 0;
        }
      }

      let diff = candles.getTstampId() - tstamp;
      tstamp = candles.getTstampId();

      // === handle when just starting out
      if (diff > history) {
        diff = 0;
      }

      // === calc is extensive, only do once per round
      for (let i = 0; i < diff; i += 1) {
        idx = (idx + 1) % history;
        calcVal(diff - i);
      }
    }

    // === return mean & variance
    function getLastVal(last = 0) {
      genValues();

      const idx2 = (idx - last + history) % history;
      return {
        mean: means[idx2],
        vari: varis[idx2],
      };
    }

    // === doesn't make sense to have direction
    function getLastDirection() {
      return 0;
    }

    // === multi norm calculation
    function getMultiNormCdf(n, x) {
      const { mean, vari } = getLastVal();
      return probz((x - mean * n) / Math.sqrt(vari * n)) || 0.5;
    }

    return {
      getLastVal,
      getLastDirection,
      getMultiNormCdf,
    };
  }

  return indicator;
};
