const fs = require('fs');

const utils = require('./utils.js');
const iqoSocket = require('./iqoSocket.js');
const strategy = require('./strategyNorm.js');

// === wrapped websocket
const ws = iqoSocket();

// === actual candle generating
function subCandleGenerated(id) {
  ws.sendSub('candle-generated', {
    routingFilters: {
      active_id: id,
      size: 1,
    },
  });
}

function unsubCandleGenerated(id, rid) {
  ws.sendUnsub('candle-generated', {
    routingFilters: {
      active_id: id,
      size: 1,
    },
  }, rid);
}

// === actual buying
function buyOption(turbo, option) {
  const enabled = false;

  const log = ['>'];
  log.push(`${turbo.name}(${turbo.id})\t`);
  log.push(`${option.left} ${option.dir}`);
  console.log(log.join(' '));

  if (enabled) {
    ws.send('buyV2', {
      exp: option.exp,
      value: option.data,
      time: option.tstamp,
      act: parseInt(turbo.id, 10),
      profit_percent: turbo.profit,

      price: 1,
      refund_value: 0,
      direction: (option.dir === 1)
        ? 'call' : 'put',

      user_balance_id: ws.user.balance_id,
      skey: ws.user.skey,

      platform: '9',
      plotId: 1,
      type: 'turbo',
    });
  }
}

// === storing active turbos
const TURBOS = {};
const defaultTurbo = (id, item = {}) => {
  const turbo = {
    id,
    name: item.name || `front.${id}`,
    enabled: item.enabled || false,
    profit: item.option ? 100 - item.option.profit.commission : 100,

    expiry: item.option ? item.option.exp_time : 60,
    deadtime: item.deadtime || 30,

    tstamp: 0,
  };

  turbo.strat = strategy(turbo);
  return turbo;
};

function getActiveTurbo() {
  const turboTimeout = 1000 * 60;

  ws.send('api_option_init_all', '', (obj) => {
    const data = obj.msg.result.turbo.actives;

    Object.keys(data).forEach((id) => {
      if (!TURBOS[id]) {
        TURBOS[id] = defaultTurbo(id, data[id]);
      }

      if (data[id].enabled) {
        TURBOS[id].enabled = true;
        TURBOS[id].rid = subCandleGenerated(id);
      } else if (TURBOS[id].rid) {
        TURBOS[id].enabled = false;
        TURBOS[id].rid = false;
        unsubCandleGenerated(id, TURBOS[id].rid);
      }
    });

    setTimeout(getActiveTurbo, turboTimeout);
  });
}

// === commission change
ws.setCmd('f_activeCommissionChange', (obj) => {
  const data = obj.msg;
  if (!TURBOS[data.active_id]) {
    TURBOS[data.active_id] = defaultTurbo(data.active_id);
  }

  TURBOS[data.active_id].profit = 100 - data.commission;
});

// === updating candle (main func)
ws.setCmd('f_candle-generated', (obj) => {
  const data = obj.msg;
  const id = data.active_id;

  if (!TURBOS[id]) {
    TURBOS[id] = defaultTurbo(id);
  }
  const turbo = TURBOS[id];

  const curr = data.close;
  const tstamp = data.to;

  if (!turbo.strat.insertData) { return; }
  turbo.strat.insertData(tstamp, curr);
  turbo.strat.checkGuess(tstamp, curr);

  const option = turbo.strat.makeGuess(tstamp, curr);
  if (option) {
    buyOption(turbo, option);
  }

  if (tstamp % turbo.expiry === 0 && tstamp !== turbo.tstamp) {
    const stats = turbo.strat.getStats();
    const rate = (stats.wrong / (stats.right || 1)).toFixed(2);
    const right = (stats.right / (stats.right + stats.wrong || 1)).toFixed(2);

    const log = [`${utils.toTime(tstamp)} ${turbo.name}(${turbo.id})\t`];
    log.push(`${right} ${stats.wrong}/${stats.right} \t ${rate}`);
    log.push((turbo.profit / 100).toFixed(2));
    if (stats.wrong + stats.right === 0) {
      log.push('');
    } else {
      log.push((rate < turbo.profit / 100) ? '+' : '.');
    }

    console.log(log.join(' '));
  }

  turbo.tstamp = tstamp;
});

ws.setHeartbeat(() => {
  fs.writeFile('data.json', JSON.stringify(TURBOS, null, 2), () => {});
});

ws.setOpen(() => {
  getActiveTurbo();
});
