/* VELENTIS dungeons.
   A gate appears at a real place near you. Reach it before the timer ends. Farther gates with tighter timers are harder
   (rank E to S) and pay more XP and better gear. You choose from three offers, can reroll, and can walk away any time.
   Gates only open in the daytime and never ask you to go farther than 4.5 km. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, core = V.core;
  var KEY = 'velentis.dungeon.v1';
  var D = u.get(KEY, null);
  if (!D || typeof D !== 'object') D = {};
  D.offers = Array.isArray(D.offers) ? D.offers : []; D.history = Array.isArray(D.history) ? D.history : []; D.active = D.active || null; D.result = null;
  function save() { var c = Object.assign({}, D); delete c.result; u.put(KEY, c); }

  var RANKS = ['E', 'D', 'C', 'B', 'A', 'S'];
  var RANK_WORD = ['Easy', 'Steady', 'Solid', 'Hard', 'Brutal', 'Legendary'];
  var NIGHT_FROM = 21.5, NIGHT_TO = 5.5, DETOUR = 1.25, MAX_M = 4500, ARRIVE_M = 40;
  var ui = { busy: false, msg: '', live: null, quit: false, boss: null };

  /* ---------- the numbers ---------- */
  function rankOf(distM, f) {
    var score = distM / 1000 * 1.5 + (1 / f - 0.6) * 4;
    return score < 1.3 ? 0 : score < 2.3 ? 1 : score < 3.5 ? 2 : score < 5 ? 3 : score < 7 ? 4 : 5;
  }
  function isNight() { var d = new Date(), h = d.getHours() + d.getMinutes() / 60; return h >= NIGHT_FROM || h < NIGHT_TO; }
  function rad(x) { return x * Math.PI / 180; }
  function dist(a, b) { var R = 6371000, dl = rad(b.lat - a.lat), dn = rad(b.lon - a.lon), x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dn / 2) * Math.sin(dn / 2); return 2 * R * Math.asin(Math.sqrt(x)); }
  function bearing(a, b) { var y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat)), x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon)); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; }
  function compass(deg) { return ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'][Math.round(deg / 45) % 8]; }
  function fmtDist(m) { return m < 1000 ? Math.round(m / 10) * 10 + ' m' : (Math.round(m / 100) / 10) + ' km'; }
  function fmtClock(ms) { var s = Math.max(0, Math.round(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function xpFor(rank) { return Math.min(8 * (rank + 1), 96); }

  function makeOffers(me) {
    var kinds = [[300, 900, [1.6, 1.3]], [900, 2200, [1.4, 1.1, 0.9]], [2200, MAX_M, [1.2, 1.0, 0.8]]], now = Date.now(), out = [];
    kinds.forEach(function (k, i) {
      var d = Math.round(k[0] + Math.random() * (k[1] - k[0])), f = pick(k[2]), th = Math.random() * 2 * Math.PI;
      var dLat = d * Math.cos(th) / 111320, dLon = d * Math.sin(th) / (111320 * Math.cos(rad(me.lat)));
      var mins = Math.max(5, Math.round(d / 1000 / 4 * 60 * f * DETOUR));
      out.push({ id: 'g' + now + i, rank: rankOf(d, f), distM: d, mins: mins, lat: me.lat + dLat, lon: me.lon + dLon, expires: now + 15 * 60000 });
    });
    return out;
  }

  /* ---------- GPS, with the phone's own permission popup ---------- */
  function plug() { var c = window.Capacitor; return c && c.Plugins && c.Plugins.Geolocation && c.Plugins.Geolocation.watchPosition ? c.Plugins.Geolocation : null; }
  function askLoc() {
    var g = plug();
    if (!g || !g.requestPermissions) return Promise.resolve();
    return g.requestPermissions({ permissions: ['location'] }).then(function (r) {
      if (r && r.location && r.location !== 'granted' && r.fine !== 'granted') { var e = new Error('denied'); e.denied = true; throw e; }
    }, function () {});
  }
  function getFix() {
    return askLoc().then(function () {
      var g = plug(), opts = { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 };
      if (g && g.getCurrentPosition) return Promise.resolve(g.getCurrentPosition(opts));
      return new Promise(function (ok, no) { if (!navigator.geolocation) return no(new Error('none')); navigator.geolocation.getCurrentPosition(ok, no, opts); });
    }).then(function (p) { return { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }; });
  }
  var watchId = null, lock = null;
  function watch() {
    if (watchId != null) return;
    var g = plug(), opts = { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 };
    var on = function (p, err) { if (err || !p) return; onPos({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy }); };
    askLoc().then(function () {
      if (g) { var r = g.watchPosition(opts, on); Promise.resolve(r).then(function (id) { watchId = id; }); }
      else if (navigator.geolocation) watchId = navigator.geolocation.watchPosition(function (p) { on(p, null); }, function () {}, opts);
    }, function () { ui.msg = 'Location is blocked. Open your phone Settings, Apps, Velentis, Permissions, Location, then choose Allow.'; draw(); });
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then(function (l) { lock = l; }, function () {}); } catch (e) {}
  }
  function unwatch() {
    if (watchId != null) { try { var g = plug(); if (g) g.clearWatch({ id: watchId }); else if (navigator.geolocation) navigator.geolocation.clearWatch(watchId); } catch (e) {} watchId = null; }
    try { if (lock) { lock.release(); lock = null; } } catch (e) {}
  }

  /* ---------- play ---------- */
  function onPos(p) {
    var A = D.active; if (!A) return;
    ui.live = p;
    if (p.acc <= 60 && dist(p, A) <= ARRIVE_M) { arrive(); return; }
    draw();
  }
  function finish(kind, extra) {
    var A = D.active; if (!A) return;
    D.history.unshift(Object.assign({ date: u.iso(new Date()), rank: A.rank, result: kind, distM: A.distM }, extra || {})); D.history = D.history.slice(0, 20);
    D.result = Object.assign({ kind: kind, rank: A.rank }, extra || {});
    D.active = null; ui.live = null; ui.quit = false; ui.boss = null; unwatch(); save(); draw();
  }
  function reward(A, bonus) {
    V.emit('dungeon.clear', { ref: A.id, units: A.rank + 1 });
    var drop = V.gear.drop(A.rank, bonus);
    finish('clear', { xp: xpFor(A.rank), drop: drop ? { name: drop.name, tier: drop.tier } : null, bonus: !!bonus });
  }
  function arrive() {
    var A = D.active; if (!A || ui.boss) return;
    if (A.rank >= 3) { ui.boss = 'ask'; unwatch(); draw(); } else reward(A, false);
  }
  function tick() {
    var A = D.active; if (!A) return;
    var left = A.deadline - Date.now();
    if (left <= 0 && !ui.boss) { finish('fail'); return; }
    var el = $('dgClock'); if (el) el.textContent = fmtClock(left);
  }
  setInterval(function () { if (V.view() === 'dungeon') tick(); }, 1000);

  /* ---------- screens ---------- */
  function badge(rank, big) { return '<span class="rank r' + rank + (big ? ' big' : '') + '" aria-label="Rank ' + RANKS[rank] + '">' + RANKS[rank] + '</span>'; }
  function radar(A) {
    var me = ui.live, R = 96, cx = 110, cy = 110, s = '<svg viewBox="0 0 220 220" class="radar" role="img" aria-label="Gate radar, north is up">' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + R + '" fill="rgba(0,0,0,.25)" stroke="rgba(224,164,88,.5)"/><circle cx="' + cx + '" cy="' + cy + '" r="' + (R * .5) + '" fill="none" stroke="rgba(224,164,88,.25)"/>' +
      '<text x="' + cx + '" y="14" text-anchor="middle" fill="#E0A458" font-size="12" font-weight="700">N</text>';
    if (me) {
      var d = dist(me, A), b = bearing(me, A), r = Math.min(R - 8, Math.max(10, d / Math.max(A.distM, d) * (R - 8))), x = cx + r * Math.sin(rad(b)), y = cy - r * Math.cos(rad(b));
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#E0A458" stroke-width="2" stroke-dasharray="4 4"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" fill="#F2C14E" stroke="#fff" stroke-width="2"/>';
    }
    return s + '<circle cx="' + cx + '" cy="' + cy + '" r="6" fill="#7FD1FF" stroke="#fff" stroke-width="2"/></svg>';
  }
  function head(title, back) { return u.bar(back || u.BACK_TOOLS, title); }
  function render() {
    var el = $('v-dungeon'); if (!el) return;
    var A = D.active, h = '';
    if (D.result) {
      var r = D.result, rk = r.rank;
      if (r.kind === 'clear') {
        h = head('Dungeon') + '<div class="card hero"><span class="chip">' + badge(rk, true) + '</span><h2>Gate cleared</h2><p>' + RANK_WORD[rk] + ' dungeon, rank ' + RANKS[rk] + '. You earned XP.</p>' +
          (r.drop ? '<p style="margin-top:10px"><b style="color:' + V.gear.tierColor(r.drop.tier) + '">New gear: ' + esc(r.drop.name) + '</b><br><span class="sub">It is already on your hero.</span></p>' : '<p class="sub" style="margin-top:10px">No gear this time. Harder gates drop it more often.</p>') + '</div>' +
          '<button class="btn2 main" data-act="dg-ok">Done</button><button class="btn2" data-act="go" data-to="inventory">See my hero</button>';
      } else {
        h = head('Dungeon') + '<div class="card hero"><span class="chip">' + ic('lock') + '</span><h2>The gate collapsed</h2><p>Time ran out. No penalty. Try a gentler one, or the same one when you are ready.</p></div><button class="btn2 main" data-act="dg-ok">Back</button>';
      }
    } else if (A && ui.boss === 'ask') {
      h = head('Boss floor') + '<div class="card hero"><span class="chip">' + badge(A.rank, true) + '</span><h2>The boss waits</h2><p>Do 15 squats or push-ups. Then tap Done for a chance at better gear. This is on your honor, and skipping is fine.</p></div>' +
        '<button class="btn2 main" data-act="dg-boss" data-v="1">Done, I did them</button><button class="btn2" data-act="dg-boss" data-v="0">Skip</button>';
    } else if (A) {
      var me = ui.live, d = me ? dist(me, A) : null;
      h = head('Dungeon', 'data-act="dg-back"') + '<div class="card pad" style="text-align:center"><div class="row" style="justify-content:center;gap:12px;display:flex;align-items:center">' + badge(A.rank) + '<span class="eyebrow" style="margin:0">' + RANK_WORD[A.rank] + ' gate</span></div>' +
        '<div class="big" id="dgClock" style="font-size:44px;margin:6px 0">' + fmtClock(A.deadline - Date.now()) + '</div><div class="sub">time left</div>' + radar(A) +
        '<div class="big" style="font-size:26px">' + (d == null ? 'Finding you...' : fmtDist(d)) + '</div><div class="sub">' + (d == null ? 'Looking for GPS' : 'to the gate, ' + compass(bearing(me, A)) + (me.acc > 60 ? ' (GPS is weak)' : '')) + '</div></div>' +
        (ui.msg ? '<div class="err">' + esc(ui.msg) + '</div>' : '') +
        '<p class="note">Keep the screen on. Stay on public paths and roads, watch for traffic, and never enter private land or water. Get within ' + ARRIVE_M + ' m of the gate to clear it.</p>' +
        '<button class="btn2" data-act="dg-quit">' + (ui.quit ? 'Tap again to give up' : 'Give up this gate') + '</button>';
    } else {
      var night = isNight(), live = D.offers.filter(function (o) { return o.expires > Date.now(); });
      var cards = live.map(function (o) {
        return '<button class="card row btn" data-act="dg-take" data-id="' + o.id + '">' + badge(o.rank) + '<span class="txt"><span class="nm">' + fmtDist(o.distM) + ' away · ' + o.mins + ' min</span><br><span class="sub">' + RANK_WORD[o.rank] + ' · up to ' + xpFor(o.rank) + ' XP · gear chance ' + Math.round([35, 45, 55, 70, 85, 100][o.rank]) + '%</span></span>' + ic('chev') + '</button>';
      }).join('');
      h = head('Dungeon') + '<div class="card hero"><span class="chip">' + ic('map') + '</span><h2>Dungeon gates</h2><p>Gates open at real places near you. Reach one before its timer ends. Farther and faster means harder, with better rewards.</p></div>' +
        (night ? '<div class="card pad"><div class="eyebrow">Gates are asleep</div><p class="note" style="margin-top:6px">They open between 5:30 am and 9:30 pm, so you are never sent out in the dark.</p></div>' :
          (live.length ? '<div class="list">' + cards + '</div><p class="note">Straight-line distances. The time includes extra for turns and crossings. Offers last 15 minutes.</p>' : '') +
          '<button class="btn2 main" data-act="dg-find"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Finding gates...' : live.length ? 'Reroll gates' : 'Find gates near me') + '</button>') +
        (ui.msg ? '<div class="err">' + esc(ui.msg) + '</div>' : '') +
        (D.history.length ? '<div class="eyebrow" style="margin-top:8px">Recent</div><div class="list">' + D.history.slice(0, 5).map(function (x) { return '<div class="card row">' + badge(x.rank) + '<span class="txt"><span class="nm">' + (x.result === 'clear' ? 'Cleared' : 'Collapsed') + '</span><br><span class="sub">' + esc(u.niceDate(x.date)) + (x.drop ? ' · ' + esc(x.drop.name) : '') + '</span></span></div>'; }).join('') + '</div>' : '') +
        '<p class="note">Safety first: stay on public paths, watch traffic, bring water, and skip any gate that feels wrong. Rerolling is free.</p>';
    }
    el.innerHTML = h;
  }
  function draw() { if (V.view() === 'dungeon') render(); }
  V.registerTool('dungeon', function () {
    if (D.active && !ui.boss && D.active.deadline <= Date.now()) finish('fail');
    render();
    if (D.active && watchId == null && !ui.boss) watch();
  });
  V.dungeon = { active: function () { return D.active; }, left: function () { return D.active ? Math.max(0, D.active.deadline - Date.now()) : 0; }, cleared: function () { return D.history.filter(function (x) { return x.result === 'clear'; }).length; } };

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'); if (a.indexOf('dg-') !== 0) return;
    if (a === 'dg-find') {
      if (isNight()) { render(); return; }
      ui.busy = true; ui.msg = ''; render();
      getFix().then(function (me) { D.offers = makeOffers(me); save(); ui.busy = false; render(); }, function (er) {
        ui.busy = false; ui.msg = er && er.denied ? 'Location is blocked. Open your phone Settings, Apps, Velentis, Permissions, Location, then choose Allow.' : 'Could not find you. Go outside, or somewhere with open sky, and try again.'; render();
      });
    } else if (a === 'dg-take') {
      var o = D.offers.filter(function (x) { return x.id === t.getAttribute('data-id'); })[0]; if (!o || o.expires < Date.now()) { render(); return; }
      D.active = { id: o.id, rank: o.rank, distM: o.distM, mins: o.mins, lat: o.lat, lon: o.lon, deadline: Date.now() + o.mins * 60000, started: Date.now() };
      D.offers = []; D.result = null; ui.live = null; ui.msg = ''; ui.quit = false; save(); render(); watch();
    } else if (a === 'dg-quit') {
      if (ui.quit) { D.history.unshift({ date: u.iso(new Date()), rank: D.active.rank, result: 'gave up', distM: D.active.distM }); D.active = null; ui.quit = false; unwatch(); save(); render(); }
      else { ui.quit = true; render(); setTimeout(function () { ui.quit = false; if (V.view() === 'dungeon') render(); }, 3000); }
    } else if (a === 'dg-boss') { var A = D.active; if (A) reward(A, t.getAttribute('data-v') === '1'); }
    else if (a === 'dg-ok') { D.result = null; render(); }
    else if (a === 'dg-back') V.go('workshop');
  });
})();
