/* Run tracker: GPS distance, time and pace. Walks count too. Data stays on the phone. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, iso = u.iso, addDays = u.addDays, plural = u.plural, bar = u.bar;
  var KEY = 'velentis.runs.v1';
  var R = u.get(KEY, { runs: [] });
  if (!R || !Array.isArray(R.runs)) R = { runs: [] };
  function save() { R.runs = R.runs.slice(-200); u.put(KEY, R); }
  /* areas explored: coarse 200 m squares you have been inside. Only the count is ever shared. */
  var TK = 'velentis.tiles.v1', T = u.get(TK, { set: {} });
  if (!T || typeof T.set !== 'object') T = { set: {} };
  V.tiles = {
    count: function () { return Object.keys(T.set).length; },
    add: function (pts) { var n = 0; pts.forEach(function (p) { var k = Math.floor(p[0] / 0.002) + '|' + Math.floor(p[1] / 0.002); if (!T.set[k]) { T.set[k] = 1; n++; } }); u.put(TK, T); return n; }
  };

  var L = null, watchId = null, wake = null, tick = 0, view = 'idle', result = null, msg = '', pend = null;
  function km(m) { return (m / 1000).toFixed(2); }
  function clock(sec) { sec = Math.max(0, Math.round(sec)); var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60; return (h ? h + ':' + (m < 10 ? '0' : '') : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function pace(m, sec) { if (m < 50 || !sec) return '--'; var p = sec / (m / 1000), mm = Math.floor(p / 60), ss = Math.round(p % 60); if (ss === 60) { mm++; ss = 0; } return mm + ':' + (ss < 10 ? '0' : '') + ss; }
  function dist(a, b) {
    var R6 = 6371000, rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R6 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function elapsed() { return L ? (L.acc + (L.paused ? 0 : Date.now() - L.seg)) / 1000 : 0; }

  /* stats other parts of the app can read */
  V.run = {
    stats: function () {
      var wk = iso(addDays(new Date(), -6)), total = 0, week = 0;
      R.runs.forEach(function (r) { total += r.m; if (r.day >= wk) week += r.m; });
      return { totalKm: Math.round(total / 10) / 100, weekKm: Math.round(week / 10) / 100, runs: R.runs.length };
    }
  };

  function drawPath(canvas, pts) {
    if (!canvas || !pts || pts.length < 2) return;
    var w = canvas.width = canvas.clientWidth * 2 || 600, h = canvas.height = canvas.clientHeight * 2 || 300, c = canvas.getContext('2d');
    var minLa = 90, maxLa = -90, minLo = 180, maxLo = -180;
    pts.forEach(function (p) { minLa = Math.min(minLa, p[0]); maxLa = Math.max(maxLa, p[0]); minLo = Math.min(minLo, p[1]); maxLo = Math.max(maxLo, p[1]); });
    var cosLat = Math.cos((minLa + maxLa) / 2 * Math.PI / 180), spanX = Math.max((maxLo - minLo) * cosLat, 1e-6), spanY = Math.max(maxLa - minLa, 1e-6);
    var sc = Math.min((w - 40) / spanX, (h - 40) / spanY), ox = (w - spanX * sc) / 2, oy = (h - spanY * sc) / 2;
    c.clearRect(0, 0, w, h); c.lineWidth = 6; c.lineJoin = c.lineCap = 'round';
    c.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7CE8D4';
    c.beginPath();
    pts.forEach(function (p, i) { var x = ox + (p[1] - minLo) * cosLat * sc, y = h - (oy + (p[0] - minLa) * sc); if (i) c.lineTo(x, y); else c.moveTo(x, y); });
    c.stroke();
  }
  function thin(pts, n) { if (pts.length <= n) return pts; var out = [], step = pts.length / n; for (var i = 0; i < n; i++) out.push(pts[Math.floor(i * step)]); out.push(pts[pts.length - 1]); return out; }

  function liveHTML() {
    var s = elapsed();
    return '<div class="card pad" style="text-align:center"><div class="eyebrow">' + (L.paused ? 'Paused' : L.fix ? 'Tracking' : 'Looking for GPS...') + '</div>' +
      '<div class="clock" id="rnTime">' + clock(s) + '</div>' +
      '<div class="metrics"><div><div class="eyebrow">Distance</div><div class="big" id="rnDist">' + km(L.m) + ' km</div></div><div><div class="eyebrow">Pace</div><div class="big" id="rnPace">' + pace(L.m, s) + '</div></div></div></div>' +
      (msg ? '<p class="note" style="text-align:center">' + esc(msg) + '</p>' : '') +
      '<div class="duo">' + (L.paused ? '<button class="btn2 main" data-act="rn-resume">Resume</button>' : '<button class="btn2" data-act="rn-pause">Pause</button>') + '<button class="btn2 main" data-act="rn-stop">Finish</button></div>';
  }
  function render() {
    var el = $('v-run');
    if (view === 'live' && L) { el.innerHTML = bar('data-act="rn-stop"', 'Run tracker') + liveHTML(); return; }
    if (view === 'result' && result) {
      var r = result;
      el.innerHTML = bar('data-act="rn-home"', 'Nice one') +
        '<div class="card pad" style="text-align:center"><div class="eyebrow">Distance</div><div class="clock">' + km(r.m) + ' km</div><div class="metrics"><div><div class="eyebrow">Time</div><div class="big">' + clock(r.sec) + '</div></div><div><div class="eyebrow">Pace per km</div><div class="big">' + pace(r.m, r.sec) + '</div></div></div></div>' +
        '<canvas class="route" id="rnMap"></canvas>' +
        '<p class="note" style="text-align:center">' + esc(r.note) + '</p><button class="btn2 main" data-act="rn-home">Done</button>';
      setTimeout(function () { drawPath($('rnMap'), r.pts); }, 0);
      return;
    }
    var st = V.run.stats();
    var rows = R.runs.slice().reverse().slice(0, 12).map(function (r) {
      var p = pend === r.id;
      return '<li class="card row"><div class="txt"><div class="nm">' + km(r.m) + ' km · ' + clock(r.sec) + '</div><div class="sub">' + u.niceDate(r.day) + ' · ' + pace(r.m, r.sec) + ' per km</div></div><button class="icon-btn' + (p ? ' warn' : '') + '" data-act="rn-del" data-id="' + r.id + '" aria-label="Delete run">' + (p ? 'Delete?' : ic('trash')) + '</button></li>';
    }).join('');
    el.innerHTML = bar(u.BACK_TOOLS, 'Run tracker') +
      '<div class="metrics"><div class="card pad"><div class="eyebrow">Last 7 days</div><div class="big">' + st.weekKm.toFixed(1) + ' km</div></div><div class="card pad"><div class="eyebrow">All time</div><div class="big">' + st.totalKm.toFixed(1) + ' km</div></div></div>' +
      (msg ? '<p class="note" style="text-align:center">' + esc(msg) + '</p>' : '') +
      '<button class="btn2 main" data-act="rn-start">Start a run or walk</button>' +
      '<p class="note" style="text-align:center">Areas explored: ' + V.tiles.count() + '</p>' +
      '<p class="note">Keep Velentis open and the screen on while you go. Distance only counts while GPS is clear.</p>' +
      (rows ? '<ul class="list">' + rows + '</ul>' : '');
  }

  function onPos(pos) {
    if (!L || L.paused) return;
    var c = pos.coords, p = { lat: c.latitude, lon: c.longitude, t: Date.now() };
    L.fix = true;
    if (c.accuracy > 35) { msg = 'GPS is weak. Move to open sky.'; return; }
    msg = '';
    if (L.last) {
      var d = dist(L.last, p), dt = Math.max((p.t - L.last.t) / 1000, 1);
      if (d < 3) return;                 /* standing still or GPS jitter */
      if (d / dt > 12) return;           /* a jump, not a person */
      L.m += d; L.pts.push([Math.round(p.lat * 1e5) / 1e5, Math.round(p.lon * 1e5) / 1e5]);
    } else L.pts.push([Math.round(p.lat * 1e5) / 1e5, Math.round(p.lon * 1e5) / 1e5]);
    L.last = p;
  }
  function onErr(e) {
    msg = e && e.code === 1 ? 'Location is blocked. Open your phone Settings, Apps, Velentis, Permissions, Location, then choose Allow.' : 'Cannot get GPS right now.';
    if (L && !L.fix) { cleanup(); view = 'idle'; L = null; }
    if (V.view() === 'run') render();
  }
  function cleanup() {
    clearInterval(tick); tick = 0;
    if (watchId != null) {
      var g = geo();
      try { if (g) g.clearWatch({ id: watchId }); else if (navigator.geolocation) navigator.geolocation.clearWatch(watchId); } catch (e) {}
    }
    watchId = null;
    if (wake) { try { wake.release(); } catch (e) {} wake = null; }
  }
  function geo() { var c = window.Capacitor; return c && c.Plugins && c.Plugins.Geolocation && c.Plugins.Geolocation.watchPosition ? c.Plugins.Geolocation : null; }
  function wrapPos(p) { return { coords: p.coords, timestamp: p.timestamp }; }
  function begin() {
    var g = geo(), opts = { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 };
    if (g) {
      var dead = false;
      var ret = g.watchPosition(opts, function (p, err) { if (dead) return; if (err || !p) onErr({ code: err && /denied|permission/i.test(err.message || '') ? 1 : 2 }); else onPos(wrapPos(p)); });
      Promise.resolve(ret).then(function (id) { watchId = id; }, function () { onErr({ code: 2 }); });
    } else watchId = navigator.geolocation.watchPosition(onPos, onErr, opts);
  }
  function start() {
    if (!geo() && !navigator.geolocation) { msg = 'This device has no GPS access here.'; render(); return; }
    msg = ''; L = { m: 0, acc: 0, seg: Date.now(), paused: false, last: null, pts: [], fix: false, day: iso(new Date()) };
    view = 'live'; render();
    var g = geo();
    if (g && g.requestPermissions) {
      g.requestPermissions({ permissions: ['location'] }).then(function (r) {
        if (r && r.location && r.location !== 'granted' && r.fine !== 'granted') onErr({ code: 1 }); else begin();
      }, function () { begin(); });
    } else begin();
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (w) { wake = w; }, function () {}); } catch (e) {}
    tick = setInterval(function () {
      if (V.view() !== 'run' || view !== 'live' || !L) return;
      var s = elapsed(), a = $('rnTime'); if (a) a.textContent = clock(s);
      var b = $('rnDist'); if (b) b.textContent = km(L.m) + ' km';
      var c = $('rnPace'); if (c) c.textContent = pace(L.m, s);
    }, 1000);
  }
  function finish() {
    var sec = elapsed(), m = L.m, pts = L.pts, day = L.day; cleanup(); L = null;
    var note, avg = sec ? m / sec : 0;
    if (m < 50) { view = 'idle'; msg = 'That was too short to save.'; render(); return; }
    var id = 'r' + u.uid();
    R.runs.push({ id: id, day: day, sec: Math.round(sec), m: Math.round(m), pts: thin(pts, 120) }); save();
    if (m >= 200 && avg >= 0.5 && avg <= 7) {
      var units = Math.floor(m / 500);
      note = units > 0 ? 'Saved. XP earned for ' + plural(units, 'half kilometer') + '.' : 'Saved. Go 500 m to earn XP.';
      if (units > 0) V.emit('run.done', { ref: id, units: units });
    } else note = avg > 7 ? 'Saved. That speed is too fast for a run, so no XP this time.' : 'Saved. Too short or too slow to earn XP.';
    var fresh = V.tiles.add(pts); if (fresh > 0) note += ' New areas explored: ' + fresh + '.';
    result = { m: m, sec: sec, pts: thin(pts, 120), note: note }; view = 'result'; render();
    V.emit('core.changed', {});
  }

  V.registerTool('run', render);
  V.on('view.leave', function (name) { /* keep tracking while you look at other screens */ });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && L && !L.paused && navigator.wakeLock && !wake) { try { navigator.wakeLock.request('screen').then(function (w) { wake = w; }, function () {}); } catch (e) {} }
    if (!document.hidden && V.view() === 'run') render();
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a.indexOf('rn-') !== 0) return;
    if (a === 'rn-start') { start(); return; }
    else if (a === 'rn-pause' && L) { L.acc += Date.now() - L.seg; L.paused = true; }
    else if (a === 'rn-resume' && L) { L.seg = Date.now(); L.paused = false; L.last = null; }
    else if (a === 'rn-stop' && L) { finish(); return; }
    else if (a === 'rn-home') { view = 'idle'; result = null; msg = ''; }
    else if (a === 'rn-del') {
      if (pend === id) { R.runs = R.runs.filter(function (r) { return r.id !== id; }); pend = null; save(); }
      else { pend = id; setTimeout(function () { if (pend === id) { pend = null; if (V.view() === 'run' && view === 'idle') render(); } }, 3000); }
    }
    render();
  });
})();
