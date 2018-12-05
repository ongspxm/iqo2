const WebSocket = require('ws');

const { SSID } = process.env;

module.exports = function iqoSocket() {
  if (!SSID) {
    console.log('err: Invalid iqo ssid');
    return null;
  }

  const ws = new WebSocket('wss://iqoption.com/echo/websocket', {
    origin: 'https://iqoption.com/traderoom/',
  });

  // === handling timing issue
  let TSTAMP = false; // tstamp delta
  function getTime() {
    return (new Date()).getTime() - TSTAMP;
  }

  // === sending commands
  function send(name, msg, callback = () => {}, id = null) {
    const rid = (id == null)
      ? `${getTime()}_${Math.random().toString().slice(2, 11)}`
      : id;

    const msg2 = Object.assign({}, msg);
    msg2.request_id = rid;

    ws.send(JSON.stringify({
      name,
      msg2,
      request_id: rid,
    }));

    // callback handles data (parsed JSON obj)
    ws[`f_${rid}`] = callback;
    return rid;
  }

  let IDX = 0;
  function sendMsg(name, body, callback = () => {}, version = '1.0') {
    IDX += 1;
    return send('sendMessage', {
      name, body, version,
    }, callback, IDX);
  }

  let SIDX = 0;
  function sendSub(name, params, callback = () => {}, version = '1.0') {
    SIDX += 1;
    return send('subscribeMessage', {
      name, params, version,
    }, callback, `s_${SIDX}`);
  }

  function sendUnsub(name, params, rid, callback = () => {}, version = '1.0') {
    return send('unsubscribeMessage', {
      name, params, version,
    }, callback, `${rid}`);
  }

  // === handling responses
  const funcs = {};
  function setCmd(name, func) {
    ws[name] = func;
  }

  ws.f_timeSync = (obj) => {
    const weightage = 7;
    const diff = (new Date()).getTime() - obj.msg;

    TSTAMP = !TSTAMP
      ? diff
      : parseInt((TSTAMP * weightage + diff) / (weightage + 1), 10);
  };

  // ===  user stuff
  const user = {
    ssid: SSID,
  };
  setCmd('f_profile', (obj) => {
    const data = obj.msg;

    if (data) {
      user.id = data.id;
      user.balance_id = data.balance_id;
      user.balance = data.balance;

      user.email = data.email;
      user.skey = data.skey;
      user.balances = {};

      if (data.balances) {
        data.balances.forEach((acct) => {
          user.balances[`${acct.currency}-${acct.type}`] = {
            id: acct.id,
            amt: acct.amount,
          };
        });
      }
    }
  });

  // === setHeartbeat
  funcs.heartbeat = () => {};
  function setHeartbeat(func) {
    funcs.heartbeat = func;
  }

  ws.f_heartbeat = (obj) => {
    send('heartbeat', {
      userTime: getTime(),
      heartbeatTime: obj.msg,
    }, () => {}, 0);

    if (funcs.heartbeat) {
      funcs.heartbeat();
    }
  };

  // === setting starting behavior
  funcs.open = () => {};
  function setOpen(func) {
    funcs.open = func;
  }

  ws.on('open', () => {
    send('setOptions', { sendResults: true }, () => {}, -1);
    send('ssid', user.ssid, funcs.open);
  });


  // === getting the default behavior
  ws.on('message', (msg) => {
    const obj = JSON.parse(msg);

    if (ws[`f_${obj.request_id}`]) {
      ws[`f_${obj.request_id}`](obj);
      delete ws[obj.request_id];
    } else if (!ws[`f_${obj.name}`]) {
      console.log(obj);
    }

    if (ws[`f_${obj.name}`]) {
      ws[`f_${obj.name}`](obj);
    }
  });

  return {
    ws,
    user,
    setCmd,
    getTime,
    setOpen,
    setHeartbeat,
    send,
    sendMsg,
    sendSub,
    sendUnsub,
  };
};
