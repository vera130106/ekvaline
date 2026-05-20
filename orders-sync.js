(function (root) {
  const CHANNEL = 'ekvaline-orders-v1';

  function notifyOrdersDataChanged() {
    const msg = { t: Date.now() };
    try {
      const bc = new BroadcastChannel(CHANNEL);
      bc.postMessage(msg);
      bc.close();
    } catch {
      /**/
    }
    try {
      root.localStorage.setItem('ekvaline_orders_ping', String(msg.t));
    } catch {
      /**/
    }
  }

  function subscribeOrdersDataChanged(fn) {
    if (typeof fn !== 'function') return () => {};
    let bc = null;
    try {
      bc = new BroadcastChannel(CHANNEL);
      bc.onmessage = () => fn();
    } catch {
      /**/
    }
    const onStorage = (ev) => {
      if (ev.key === 'ekvaline_orders_ping') fn();
    };
    root.addEventListener('storage', onStorage);
    return () => {
      try {
        bc?.close();
      } catch {
        /**/
      }
      root.removeEventListener('storage', onStorage);
    };
  }

  root.EkvalineOrdersSync = { notifyOrdersDataChanged, subscribeOrdersDataChanged, CHANNEL };
})(typeof window !== 'undefined' ? window : globalThis);
