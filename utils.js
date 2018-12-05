const { exec } = require('child_process');

const beep = (x, y = 100) => exec(`sudo beep -l ${y} -r ${x}`);

const fmt = x => `${x < 0 ? '' : ' '}${x}`;
const dec = x => fmt(x.toFixed(5));

const getAverage = (prev, curr) => (prev + curr) / 2;
const getDirection = (prev, curr) => (prev === curr ? 0 : -1 + (prev < curr) * 2);

const getDate = tstamp => (new Date(tstamp * 1000)).toISOString();
const toDate = tstamp => getDate(tstamp).split('T')[0];
const toTime = tstamp => getDate(tstamp).split('T')[1].split('.')[0];

module.exports = {
  fmt,
  dec,
  beep,
  toDate,
  toTime,
  getDirection,
  getAverage,
};
