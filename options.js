const utils = require('./utils.js');

module.exports = function optionList() {
  const options = [];

  function makeGuess(data, tstamp, dir, expiry) {
    const exp = (parseInt(tstamp / expiry, 10) + 1) * expiry;
    const option = {
      dir,
      exp,
      data,
      tstamp,
      left: exp - tstamp,
    };

    options.push(option);
    return option;
  }

  function checkGuess(tstamp, data) {
    const done = [];

    Object.keys(options).forEach((key) => {
      const option = options[key];

      if (option.exp <= tstamp) {
        const diff = data - option.data;
        option.diff = diff;
        option.data2 = data;
        option.correct = utils.getDirection(0, diff * option.dir);

        done.push(option);
        delete (options[key]);
      }
    });

    return done;
  }

  return {
    makeGuess, checkGuess,
  };
};
