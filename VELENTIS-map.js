/* VELENTIS map: a small real map for runs and dungeon gates. No outside code. It draws map tiles from the internet,
   with your trail, gates and a walking route on top. With no internet it still shows the trail on a plain background. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u;
  var TS = 256, MAXZ = 18, MINZ = 3;
  var PROVIDERS = [
    { id: 'carto', url: function (z, x, y, dark, hi) { return 'https://' + 'abcd'[(x + y) & 3] + '.basemaps.cartocdn.com/' + (dark ? 'dark_all' : 'rastertiles/voyager') + '/' + z + '/' + x + '/' + y + (hi ? '@2x' : '') + '.png'; }, credit: '© OpenStreetMap © CARTO' },
    { id: 'osm', url: function (z, x, y) { return 'https://tile.openstreetmap.org/' + z + '/' + x + '/' + y + '.png'; }, credit: '© OpenStreetMap contributors' }
  ];
  var prov = 0, bad = 0, cache = {}, order = [];
  function css() {
    if (document.getElementById('vmapCss')) return;
    var s = document.createElement('style'); s.id = 'vmapCss';
    s.textContent = '.vmap{position:relative;width:100%;height:300px;border-radius:16px;overflow:hidden;border:1px solid var(--card-line,rgba(255,255,255,.15));background:#2a2118;touch-action:none;user-select:none;-webkit-user-select:none}' +
      '.vmap canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}' +
      '.vmap .vm-btns{position:absolute;right:8px;top:8px;display:flex;flex-direction:column;gap:6px}' +
      '.vmap .vm-btns button{width:38px;height:38px;border-radius:12px;border:1px solid rgba(0,0,0,.25);background:rgba(255,250,240,.92);color:#2a2118;font-size:20px;font-weight:700;line-height:1;cursor:pointer;display:grid;place-items:center;padding:0}' +
      '.vmap .vm-btns button.on{background:#E0A458}' +
      '.vmap .vm-compass{position:absolute;left:8px;top:8px;width:40px;height:40px;padding:0;border:0;background:none;cursor:pointer;z-index:2;transition:transform .15s linear}.vmap .vm-compass .vm-n{position:absolute;left:0;right:0;top:-1px;text-align:center;font:700 9px system-ui,sans-serif;color:#fff;text-shadow:0 0 3px #000;pointer-events:none}' +
      '.vmap .vm-credit{position:absolute;left:6px;bottom:4px;font-size:10px;color:#222;background:rgba(255,255,255,.7);padding:1px 5px;border-radius:6px;pointer-events:none}' +
      '.vmap .vm-off{position:absolute;left:8px;top:8px;font-size:11px;background:rgba(0,0,0,.55);color:#fff;padding:3px 8px;border-radius:8px;pointer-events:none}';
    document.head.appendChild(s);
  }
  function isDark() {
    try { var c = getComputedStyle(document.body).color.match(/\d+/g).map(Number); return (c[0] * 299 + c[1] * 587 + c[2] * 114) / 1000 > 140; } catch (e) { return true; }
  }
  function accent() { try { return getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#E0A458'; } catch (e) { return '#E0A458'; } }
  /* ---------- map maths ---------- */
  function wx(lon, z) { return (lon + 180) / 360 * Math.pow(2, z) * TS; }
  function wy(lat, z) { var s = Math.sin(lat * Math.PI / 180); s = Math.max(-0.9999, Math.min(0.9999, s)); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * Math.pow(2, z) * TS; }
  function unx(x, z) { return x / (Math.pow(2, z) * TS) * 360 - 180; }
  function uny(y, z) { var n = Math.PI - 2 * Math.PI * y / (Math.pow(2, z) * TS); return 180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))); }

  function tileImg(z, x, y, dark, hi, redraw) {
    var P = PROVIDERS[prov], k = P.id + (dark ? 'd' : 'l') + (hi ? 'h' : '') + '/' + z + '/' + x + '/' + y, e = cache[k];
    if (e) return e.ok ? e.im : null;
    var im = new Image(); e = cache[k] = { im: im, ok: false }; order.push(k);
    if (order.length > 400) { var o = order.shift(); delete cache[o]; }
    im.onload = function () { e.ok = true; redraw(); };
    im.onerror = function () {
      bad++; delete cache[k];
      if (bad >= 8 && prov < PROVIDERS.length - 1) { prov++; bad = 0; cache = {}; order = []; redraw(); }
    };
    im.src = P.url(z, x, y, dark, hi);
    return null;
  }

  /* ---------- which way you face: your walking direction when moving, the phone's compass when standing ---------- */
  var D2R = Math.PI / 180, CS = { h: null, subs: [], on: false };
  function angDiff(a, b) { var d = ((a - b + 540) % 360) - 180; return d; }
  function bearingTo(a, b) { var y = Math.sin((b[1] - a[1]) * D2R) * Math.cos(b[0] * D2R), x = Math.cos(a[0] * D2R) * Math.sin(b[0] * D2R) - Math.sin(a[0] * D2R) * Math.cos(b[0] * D2R) * Math.cos((b[1] - a[1]) * D2R); return (Math.atan2(y, x) / D2R + 360) % 360; }
  function metres(a, b) { var R = 6371000, dl = (b[0] - a[0]) * D2R, dn = (b[1] - a[1]) * D2R, x = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(a[0] * D2R) * Math.cos(b[0] * D2R) * Math.sin(dn / 2) * Math.sin(dn / 2); return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)); }
  function compassFrom(e) {
    if (typeof e.webkitCompassHeading === 'number') return e.webkitCompassHeading;
    if (e.alpha == null || e.beta == null || e.gamma == null) return null;
    var x = e.beta * D2R, y = e.gamma * D2R, z = e.alpha * D2R, cY = Math.cos(y), cZ = Math.cos(z), sX = Math.sin(x), sY = Math.sin(y), sZ = Math.sin(z);
    var Vx = -cZ * sY - sZ * sX * cY, Vy = -sZ * sY + cZ * sX * cY, h = Math.atan(Vx / Vy);
    if (Vy < 0) h += Math.PI; else if (Vx < 0) h += 2 * Math.PI;
    return h / D2R;
  }
  function onOrient(e) {
    if (e.type === 'deviceorientation' && !e.absolute && typeof e.webkitCompassHeading !== 'number') return;   /* a relative reading is no use as a compass */
    var h = compassFrom(e); if (h == null || isNaN(h)) return;
    CS.h = CS.h == null ? h : (CS.h + angDiff(h, CS.h) * 0.25 + 360) % 360;
    CS.subs.forEach(function (fn) { try { fn(CS.h); } catch (x) {} });
  }
  function compassOn() {
    if (CS.on) return; CS.on = true;
    window.addEventListener('deviceorientationabsolute', onOrient, true);
    window.addEventListener('deviceorientation', onOrient, true);
  }
  /* "ahead", "left", "behind-right" ... for a bearing seen from the way you face */
  function rel(bear, hdg) {
    if (hdg == null) return '';
    var d = ((bear - hdg + 540) % 360) - 180, a = Math.abs(d);
    var w = a < 22 ? 'straight ahead' : a < 67 ? 'ahead-' + (d > 0 ? 'right' : 'left') : a < 112 ? (d > 0 ? 'to your right' : 'to your left') : a < 157 ? 'behind-' + (d > 0 ? 'right' : 'left') : 'behind you';
    return w;
  }

  /* ---------- the map ---------- */
  function mount(el, opts) {
    opts = opts || {}; css();
    el.classList.add('vmap'); if (opts.height) el.style.height = opts.height + 'px';
    el.innerHTML = '<canvas></canvas><button type="button" class="vm-compass" data-vm="compass" aria-label="Compass. Tap to switch between map turns with you and north up"><svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="rgba(255,250,240,.94)" stroke="rgba(0,0,0,.3)"/><path d="M20 5 25 20H15Z" fill="#D8452F"/><path d="M20 35 15 20H25Z" fill="#555"/><circle cx="20" cy="20" r="2.4" fill="#fff" stroke="#333"/></svg><span class="vm-n">N</span></button><div class="vm-btns"><button type="button" data-vm="in" aria-label="Zoom in">+</button><button type="button" data-vm="out" aria-label="Zoom out">−</button><button type="button" data-vm="me" aria-label="Follow me" class="on">◎</button></div><div class="vm-credit"></div>';
    var cv = el.querySelector('canvas'), cx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    var dark = isDark(), live = !!opts.live, mode0 = 'heading'; try { mode0 = localStorage.getItem('velentis.map.mode') || 'heading'; } catch (e) {}
    var M = { live: live, mode: live ? mode0 : 'north', hdg: null, course: null, courseAt: 0, prev: null, lat: opts.lat || 20.59, lon: opts.lon || 78.96, z: opts.zoom || 15, trail: null, lines: {}, markers: [], me: null, follow: opts.follow !== false, explored: opts.explored || null, dead: false, raf: 0, t0: Date.now() };
    el.querySelector('.vm-credit').textContent = PROVIDERS[prov].credit;
    if (!live) { var cb = el.querySelector('.vm-compass'); cb.style.pointerEvents = 'none'; }
    function rotNow() { return M.live && M.mode === 'heading' && M.hdg != null ? M.hdg * D2R : 0; }
    function setHdg(t) {
      if (t == null) return; var old = M.hdg; M.hdg = old == null ? t : (old + angDiff(t, old) * 0.3 + 360) % 360;
      if (old == null || Math.abs(angDiff(M.hdg, old)) >= 1) { redraw(); if (opts.onHeading && (old == null || Math.abs(angDiff(M.hdg, old)) >= 2)) { try { opts.onHeading(M.hdg); } catch (e) {} } }
    }
    function fromCompass(h) { if (Date.now() - M.courseAt > 5000) setHdg(h); }
    if (live) { compassOn(); CS.subs.push(fromCompass); if (CS.h != null) setHdg(CS.h); }
    function size() { var r = el.getBoundingClientRect(); W = Math.max(50, r.width); H = Math.max(50, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); redraw(); }
    function alive() { return !M.dead && el.isConnected; }
    function redraw() { if (M.raf || M.dead) return; M.raf = requestAnimationFrame(function () { M.raf = 0; if (alive()) draw(); }); }
    function project(lat, lon, z0) {
      var zi = Math.min(MAXZ, Math.max(0, Math.floor(M.z))), s = Math.pow(2, M.z - zi), z = z0 == null ? zi : z0;
      return [(wx(lon, zi) - wx(M.lon, zi)) * s + W / 2, (wy(lat, zi) - wy(M.lat, zi)) * s + H / 2];
    }
    function draw() {
      var rot = rotNow(), cr = Math.cos(rot), sr = Math.sin(rot);
      var zi = Math.min(MAXZ, Math.max(0, Math.floor(M.z))), s = Math.pow(2, M.z - zi), ts = TS * s, n = Math.pow(2, zi);
      var useMe = M.live && M.mode === 'heading' && M.follow && M.me, ax = W / 2, ay = useMe ? H * 0.64 : H / 2;
      var pc = useMe ? project(M.me.lat, M.me.lon) : [W / 2, H / 2];
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.fillStyle = dark ? '#1d1a16' : '#ece6d8'; cx.fillRect(0, 0, W, H);
      cx.translate(ax, ay); cx.rotate(-rot); cx.translate(-pc[0], -pc[1]);
      /* which part of the flat map is on screen (it is a tilted rectangle once the map turns) */
      var mnx = 1e9, mny = 1e9, mxx = -1e9, mxy = -1e9;
      [[0, 0], [W, 0], [0, H], [W, H]].forEach(function (c) { var dx = c[0] - ax, dy = c[1] - ay, px = pc[0] + dx * cr - dy * sr, py = pc[1] + dx * sr + dy * cr; mnx = Math.min(mnx, px); mxx = Math.max(mxx, px); mny = Math.min(mny, py); mxy = Math.max(mxy, py); });
      var cxw = wx(M.lon, zi), cyw = wy(M.lat, zi), wl = cxw + (mnx - W / 2) / s, wr = cxw + (mxx - W / 2) / s, wt = cyw + (mny - H / 2) / s, wb = cyw + (mxy - H / 2) / s;
      var x0 = cxw - W / 2 / s, y0 = cyw - H / 2 / s, hi = dpr >= 1.5 && PROVIDERS[prov].id === 'carto', got = 0, want = 0;
      cx.strokeStyle = dark ? 'rgba(224,164,88,.10)' : 'rgba(80,60,30,.10)'; cx.lineWidth = 1; cx.beginPath();
      for (var gx = Math.floor(wl / TS) * TS; gx <= wr; gx += TS) { var px1 = (gx - x0) * s; cx.moveTo(px1, mny); cx.lineTo(px1, mxy); }
      for (var gy = Math.floor(wt / TS) * TS; gy <= wb; gy += TS) { var py1 = (gy - y0) * s; cx.moveTo(mnx, py1); cx.lineTo(mxx, py1); }
      cx.stroke();
      var tcount = 0;
      for (var tx = Math.floor(wl / TS); tx <= Math.floor(wr / TS); tx++) {
        for (var ty = Math.floor(wt / TS); ty <= Math.floor(wb / TS); ty++) {
          if (ty < 0 || ty >= n || ++tcount > 120) continue;
          var txw = ((tx % n) + n) % n; want++;
          var im = tileImg(zi, txw, ty, dark, hi, redraw);
          if (im) { got++; cx.drawImage(im, (tx * TS - x0) * s, (ty * TS - y0) * s, ts + 0.6, ts + 0.6); }
        }
      }
      var off = el.querySelector('.vm-off');
      if (want && !got && bad > 2) { if (!off) { off = document.createElement('div'); off.className = 'vm-off'; off.textContent = 'Map pictures need internet'; el.appendChild(off); } } else if (off) off.remove();
      if (M.explored && M.z >= 12) {
        var keys = Object.keys(M.explored); if (keys.length > 4000) keys.length = 4000;
        cx.fillStyle = 'rgba(224,164,88,.16)'; cx.strokeStyle = 'rgba(224,164,88,.35)'; cx.lineWidth = 1;
        keys.forEach(function (k) {
          var p = k.split('|'), la = +p[0] * 0.002, lo = +p[1] * 0.002, a = project(la, lo), b = project(la + 0.002, lo + 0.002);
          if (b[0] < mnx - 20 || a[0] > mxx + 20 || a[1] < mny - 20 || b[1] > mxy + 20) return;
          cx.fillRect(a[0], b[1], b[0] - a[0], a[1] - b[1]); cx.strokeRect(a[0], b[1], b[0] - a[0], a[1] - b[1]);
        });
      }
      Object.keys(M.lines).forEach(function (id) {
        var L = M.lines[id]; if (!L.pts || L.pts.length < 2) return;
        path(L.pts); cx.lineCap = cx.lineJoin = 'round'; cx.setLineDash([]); cx.lineWidth = (L.w || 5) + 3; cx.strokeStyle = 'rgba(255,255,255,.85)'; cx.stroke();
        path(L.pts); cx.setLineDash(L.dash ? [9, 8] : []); cx.lineWidth = L.w || 5; cx.strokeStyle = L.color || '#E0A458'; cx.stroke(); cx.setLineDash([]);
      });
      if (M.trail && M.trail.length > 1) {
        path(M.trail); cx.lineCap = cx.lineJoin = 'round'; cx.lineWidth = 8; cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.stroke();
        path(M.trail); cx.lineWidth = 5; cx.strokeStyle = accent(); cx.stroke();
        dot(M.trail[0], 6, '#3FBF6F');
      }
      var now = Date.now();
      M.markers.forEach(function (m) {
        var p = project(m.lat, m.lon);
        cx.save(); cx.translate(p[0], p[1]); cx.rotate(rot);          /* labels stay upright when the map turns */
        if (m.pulse) { var ph = ((now - M.t0) % 1600) / 1600; cx.beginPath(); cx.arc(0, 0, 14 + ph * 22, 0, 7); cx.strokeStyle = 'rgba(242,193,78,' + (0.7 - ph * 0.7).toFixed(2) + ')'; cx.lineWidth = 3; cx.stroke(); }
        cx.beginPath(); cx.arc(0, 0, m.big ? 17 : 14, 0, 7); cx.fillStyle = m.color || '#F2C14E'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = m.sel ? '#fff' : 'rgba(0,0,0,.55)'; cx.stroke();
        cx.fillStyle = '#1a1208'; cx.font = '700 ' + (m.big ? 15 : 13) + 'px system-ui,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(m.label || '', 0, 1);
        if (m.name && M.z >= 14) { cx.font = '600 11px system-ui,sans-serif'; var tw = cx.measureText(m.name).width; cx.fillStyle = 'rgba(0,0,0,.65)'; cx.fillRect(-tw / 2 - 4, 20, tw + 8, 16); cx.fillStyle = '#fff'; cx.fillText(m.name, 0, 28.5); }
        cx.restore();
      });
      if (M.me) {
        var q = project(M.me.lat, M.me.lon), r = M.me.acc ? M.me.acc / (156543.03 * Math.cos(M.me.lat * Math.PI / 180) / Math.pow(2, M.z)) : 0;
        if (r > 8) { cx.beginPath(); cx.arc(q[0], q[1], Math.min(r, 90), 0, 7); cx.fillStyle = 'rgba(80,160,255,.16)'; cx.fill(); }
        if (M.live && M.hdg != null) {          /* the beam shows which way you face */
          cx.save(); cx.translate(q[0], q[1]); cx.rotate(M.hdg * D2R);
          var gr = cx.createRadialGradient(0, 0, 4, 0, 0, 58); gr.addColorStop(0, 'rgba(59,155,255,.55)'); gr.addColorStop(1, 'rgba(59,155,255,0)');
          cx.beginPath(); cx.moveTo(0, 0); cx.arc(0, 0, 58, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); cx.closePath(); cx.fillStyle = gr; cx.fill(); cx.restore();
        }
        cx.beginPath(); cx.arc(q[0], q[1], 9, 0, 7); cx.fillStyle = '#3B9BFF'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = '#fff'; cx.stroke();
      }
      /* arrows at the screen edge for gates that are off the map */
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      M.markers.forEach(function (m) {
        if (!m.arrow) return;
        var p = project(m.lat, m.lon), dx = p[0] - pc[0], dy = p[1] - pc[1], sx = ax + dx * cr + dy * sr, sy = ay - dx * sr + dy * cr, pad = 26;
        if (sx >= pad && sx <= W - pad && sy >= pad && sy <= H - pad) return;
        var vx = sx - W / 2, vy = sy - H / 2, t = Math.min((W / 2 - pad) / (Math.abs(vx) || 1e-6), (H / 2 - pad) / (Math.abs(vy) || 1e-6)), ex = W / 2 + vx * t, ey = H / 2 + vy * t, ang = Math.atan2(vy, vx);
        cx.save(); cx.translate(ex, ey); cx.rotate(ang);
        cx.beginPath(); cx.moveTo(22, 0); cx.lineTo(10, -9); cx.lineTo(10, 9); cx.closePath(); cx.fillStyle = m.color || '#F2C14E'; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = 'rgba(0,0,0,.6)'; cx.stroke();
        cx.restore();
        cx.beginPath(); cx.arc(ex, ey, 13, 0, 7); cx.fillStyle = m.color || '#F2C14E'; cx.fill(); cx.lineWidth = 2.5; cx.strokeStyle = '#fff'; cx.stroke();
        cx.fillStyle = '#1a1208'; cx.font = '700 12px system-ui,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(m.label || '', ex, ey + 1);
      });
      var cb2 = el.querySelector('.vm-compass'); if (cb2) cb2.style.transform = 'rotate(' + (-rot / D2R).toFixed(1) + 'deg)';
      if (M.markers.some(function (m) { return m.pulse; })) { M.raf = requestAnimationFrame(function () { M.raf = 0; if (alive()) draw(); }); }
    }
    function path(pts) { cx.beginPath(); pts.forEach(function (p, i) { var q = project(p[0], p[1]); if (i) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); }
    function dot(p, r, col) { var q = project(p[0], p[1]); cx.beginPath(); cx.arc(q[0], q[1], r, 0, 7); cx.fillStyle = col; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = '#fff'; cx.stroke(); }
    function setModeUi() { var c = el.querySelector('.vm-compass'); if (c) c.title = M.mode === 'heading' ? 'Map turns with you' : 'North is up'; }
    setModeUi();
    function setFollowBtn() { var b = el.querySelector('[data-vm="me"]'); if (b) b.classList.toggle('on', M.follow); }

    /* touch and mouse: drag to move, pinch or buttons to zoom */
    var ptr = {}, pinch = 0;
    function zoomBy(d) { M.z = Math.max(MINZ, Math.min(MAXZ, M.z + d)); redraw(); }
    cv.addEventListener('pointerdown', function (e) { try { cv.setPointerCapture(e.pointerId); } catch (x) {} ptr[e.pointerId] = [e.clientX, e.clientY]; pinch = 0; });
    cv.addEventListener('pointermove', function (e) {
      var p = ptr[e.pointerId]; if (!p) return;
      var ids = Object.keys(ptr);
      if (ids.length >= 2) {
        ptr[e.pointerId] = [e.clientX, e.clientY];
        var a = ptr[ids[0]], b = ptr[ids[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (pinch) { M.z = Math.max(MINZ, Math.min(MAXZ, M.z + Math.log(d / pinch) / Math.LN2)); redraw(); }
        pinch = d; return;
      }
      var dx = e.clientX - p[0], dy = e.clientY - p[1]; ptr[e.pointerId] = [e.clientX, e.clientY];
      var rr = rotNow(), pdx = dx * Math.cos(rr) - dy * Math.sin(rr), pdy = dx * Math.sin(rr) + dy * Math.cos(rr);
      var zi = Math.floor(M.z), s = Math.pow(2, M.z - zi), nx = wx(M.lon, zi) - pdx / s, ny = wy(M.lat, zi) - pdy / s;
      M.lon = unx(nx, zi); M.lat = uny(ny, zi); if (M.follow && (Math.abs(dx) + Math.abs(dy)) > 2) { M.follow = false; setFollowBtn(); } redraw();
    });
    function up(e) { delete ptr[e.pointerId]; pinch = 0; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); zoomBy(e.deltaY < 0 ? 0.5 : -0.5); }, { passive: false });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vm]'); if (!b) return; e.stopPropagation();
      var a = b.getAttribute('data-vm');
      if (a === 'compass') { if (!M.live) return; M.mode = M.mode === 'heading' ? 'north' : 'heading'; try { localStorage.setItem('velentis.map.mode', M.mode); } catch (x) {} setModeUi(); redraw(); }
      else if (a === 'in') zoomBy(1); else if (a === 'out') zoomBy(-1);
      else if (a === 'me') { M.follow = true; setFollowBtn(); if (M.me) { M.lat = M.me.lat; M.lon = M.me.lon; } redraw(); }
    });
    var ro = null; try { ro = new ResizeObserver(size); ro.observe(el); } catch (e) {}
    size();

    var H_ = {
      alive: alive,
      destroy: function () { M.dead = true; var ix = CS.subs.indexOf(fromCompass); if (ix >= 0) CS.subs.splice(ix, 1); try { ro && ro.disconnect(); } catch (e) {} },
      setView: function (lat, lon, z) { M.lat = lat; M.lon = lon; if (z) M.z = z; redraw(); },
      setTrail: function (pts) { M.trail = pts; redraw(); },
      setLine: function (id, pts, o) { if (!pts) delete M.lines[id]; else { o = o || {}; M.lines[id] = { pts: pts, dash: o.dash, color: o.color, w: o.w }; } redraw(); },
      setMarkers: function (list) { M.markers = list || []; redraw(); },
      setExplored: function (set) { M.explored = set; redraw(); },
      setMe: function (p) {
        if (p && M.live) {                       /* walking direction, from where you were a moment ago */
          if (M.prev && metres([M.prev.lat, M.prev.lon], [p.lat, p.lon]) >= 4) { M.courseAt = Date.now(); setHdg(bearingTo([M.prev.lat, M.prev.lon], [p.lat, p.lon])); M.prev = { lat: p.lat, lon: p.lon }; }
          else if (!M.prev) M.prev = { lat: p.lat, lon: p.lon };
        }
        M.me = p; if (p && M.follow) { M.lat = p.lat; M.lon = p.lon; } redraw();
      },
      heading: function () { return M.hdg; },
      mode: function (m) { if (m) { M.mode = m; setModeUi(); redraw(); } return M.mode; },
      follow: function (b) { M.follow = !!b; setFollowBtn(); },
      /* zoom so all the points fit */
      fit: function (pts, pad) {
        pts = (pts || []).filter(Boolean); if (!pts.length) return;
        var la0 = 90, la1 = -90, lo0 = 180, lo1 = -180; pts.forEach(function (p) { la0 = Math.min(la0, p[0]); la1 = Math.max(la1, p[0]); lo0 = Math.min(lo0, p[1]); lo1 = Math.max(lo1, p[1]); });
        pad = pad == null ? 50 : pad;
        var z = MAXZ - 1; for (; z > MINZ; z--) { var w = Math.abs(wx(lo1, z) - wx(lo0, z)), h = Math.abs(wy(la0, z) - wy(la1, z)); if (w <= W - pad * 2 && h <= H - pad * 2) break; }
        M.z = z; M.lat = (la0 + la1) / 2; M.lon = (lo0 + lo1) / 2; M.follow = false; setFollowBtn(); redraw();
      }
    };
    return H_;
  }

  /* ---------- walking routes (free OpenStreetMap routing service). Everything falls back if it cannot be reached. ---------- */
  var BASE = 'https://routing.openstreetmap.de/routed-foot/';
  function getJSON(url, ms) {
    return new Promise(function (ok, no) {
      var done = false, t = setTimeout(function () { if (!done) { done = true; no(new Error('timeout')); } }, ms || 7000);
      fetch(url).then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); }).then(function (j) { if (!done) { done = true; clearTimeout(t); ok(j); } }, function (e) { if (!done) { done = true; clearTimeout(t); no(e); } });
    });
  }
  /* the nearest place you can actually walk to */
  function snap(p) {
    return getJSON(BASE + 'nearest/v1/driving/' + p.lon.toFixed(6) + ',' + p.lat.toFixed(6) + '?number=1').then(function (j) {
      var w = j && j.waypoints && j.waypoints[0]; if (!w || !w.location) throw new Error('none');
      return { lat: w.location[1], lon: w.location[0], off: w.distance || 0 };
    });
  }
  function thin(a, n) { if (a.length <= n) return a; var o = [], st = (a.length - 1) / (n - 1); for (var i = 0; i < n; i++) o.push(a[Math.round(i * st)]); return o; }
  function route(a, b) {
    return getJSON(BASE + 'route/v1/driving/' + a.lon.toFixed(6) + ',' + a.lat.toFixed(6) + ';' + b.lon.toFixed(6) + ',' + b.lat.toFixed(6) + '?overview=full&geometries=geojson').then(function (j) {
      var r = j && j.routes && j.routes[0]; if (!r || !r.geometry) throw new Error('none');
      return { pts: thin(r.geometry.coordinates.map(function (c) { return [Math.round(c[1] * 1e5) / 1e5, Math.round(c[0] * 1e5) / 1e5]; }), 160), dist: r.distance, dur: r.duration };
    });
  }
  /* real named places nearby (parks, temples, viewpoints, monuments) from OpenStreetMap */
  function places(me, R) {
    var q = '[out:json][timeout:9];(nwr["leisure"~"^(park|garden|nature_reserve)$"]["name"](around:' + R + ',' + me.lat.toFixed(5) + ',' + me.lon.toFixed(5) + ');nwr["tourism"~"^(viewpoint|attraction|museum|artwork)$"]["name"](around:' + R + ',' + me.lat.toFixed(5) + ',' + me.lon.toFixed(5) + ');nwr["amenity"="place_of_worship"]["name"](around:' + R + ',' + me.lat.toFixed(5) + ',' + me.lon.toFixed(5) + ');nwr["historic"]["name"](around:' + R + ',' + me.lat.toFixed(5) + ',' + me.lon.toFixed(5) + '););out center tags 120;';
    return getJSON('https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(q), 10000).then(function (j) {
      var out = [], seen = {};
      ((j && j.elements) || []).forEach(function (e) {
        var la = e.lat != null ? e.lat : e.center && e.center.lat, lo = e.lon != null ? e.lon : e.center && e.center.lon, nm = e.tags && (e.tags['name:en'] || e.tags.name);
        if (la == null || lo == null || !nm || seen[nm]) return; seen[nm] = 1; out.push({ lat: la, lon: lo, name: String(nm).slice(0, 40) });
      });
      return out;
    });
  }
  V.map = { places: places, mount: mount, snap: snap, route: route, rel: rel, bearing: bearingTo, thin: thin };
})();
