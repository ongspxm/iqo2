const { getDirection, getAverage } = require('../utils.js');

// 1 if (indicator1 > indicator2), -1 if (indicator1 < indicator2)
function getLastPosition(indicator1, indicator2, last = 0) {
  return getDirection(indicator1.getLastVal(last), indicator2.getLastVal(last));
}

// return if both indicators have crossed in the (last-1)th candle
function hasLastCross(indicator1, indicator2, last = 0) {
  return (getLastPosition(indicator1, indicator2, last)
    !== getLastPosition(indicator1, indicator2, last + 1));
}

module.exports = {
  getDirection,
  getAverage,
  hasLastCross,
  getLastPosition,
};
