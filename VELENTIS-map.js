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

  /* ---------- the map ---------- */
  function mount(el, opts) {
    opts = opts || {}; css();
    el.classList.add('vmap'); if (opts.height) el.style.height = opts.height + 'px';
    el.innerHTML = '<canvas></canvas><div class="vm-btns"><button type="button" data-vm="in" aria-label="Zoom in">+</button><button type="button" data-vm="out" aria-label="Zoom out">−</button><button type="button" data-vm="me" aria-label="Follow me" class="on">◎</button></div><div class="vm-credit"></div>';
    var cv = el.querySelector('canvas'), cx = cv.getContext('2d'), W = 0, H = 0, dpr = Math.min(2, window.devicePixelRatio || 1);
    var dark = isDark(), M = { lat: opts.lat || 20.59, lon: opts.lon || 78.96, z: opts.zoom || 15, trail: null, lines: {}, markers: [], me: null, follow: opts.follow !== false, explored: opts.explored || null, dead: false, raf: 0, t0: Date.now() };
    el.querySelector('.vm-credit').textContent = PROVIDERS[prov].credit;
    function size() { var r = el.getBoundingClientRect(); W = Math.max(50, r.width); H = Math.max(50, r.height); cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); redraw(); }
    function alive() { return !M.dead && el.isConnected; }
    function redraw() { if (M.raf || M.dead) return; M.raf = requestAnimationFrame(function () { M.raf = 0; if (alive()) draw(); }); }
    function project(lat, lon, z0) {
      var zi = Math.min(MAXZ, Math.max(0, Math.floor(M.z))), s = Math.pow(2, M.z - zi), z = z0 == null ? zi : z0;
      return [(wx(lon, zi) - wx(M.lon, zi)) * s + W / 2, (wy(lat, zi) - wy(M.lat, zi)) * s + H / 2];
    }
    function draw() {
      cx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx.fillStyle = dark ? '#1d1a16' : '#ece6d8'; cx.fillRect(0, 0, W, H);
      var zi = Math.min(MAXZ, Math.max(0, Math.floor(M.z))), s = Math.pow(2, M.z - zi), ts = TS * s, n = Math.pow(2, zi);
      var cxw = wx(M.lon, zi), cyw = wy(M.lat, zi), x0 = cxw - W / 2 / s, y0 = cyw - H / 2 / s, hi = dpr >= 1.5 && PROVIDERS[prov].id === 'carto', got = 0, want = 0;
      /* grid under the tiles so a missing map still looks deliberate */
      cx.strokeStyle = dark ? 'rgba(224,164,88,.10)' : 'rgba(80,60,30,.10)'; cx.lineWidth = 1; cx.beginPath();
      for (var gx = -((x0 % TS) * s); gx < W; gx += ts) { cx.moveTo(gx, 0); cx.lineTo(gx, H); }
      for (var gy = -((y0 % TS) * s); gy < H; gy += ts) { cx.moveTo(0, gy); cx.lineTo(W, gy); }
      cx.stroke();
      for (var tx = Math.floor(x0 / TS); tx <= Math.floor((x0 + W / s) / TS); tx++) {
        for (var ty = Math.floor(y0 / TS); ty <= Math.floor((y0 + H / s) / TS); ty++) {
          if (ty < 0 || ty >= n) continue;
          var txw = ((tx % n) + n) % n; want++;
          var im = tileImg(zi, txw, ty, dark, hi, redraw);
          if (im) { got++; cx.drawImage(im, (tx * TS - x0) * s, (ty * TS - y0) * s, ts + 0.6, ts + 0.6); }
        }
      }
      var off = el.querySelector('.vm-off');
      if (want && !got && bad > 2) { if (!off) { off = document.createElement('div'); off.className = 'vm-off'; off.textContent = 'Map pictures need internet'; el.appendChild(off); } } else if (off) off.remove();
      /* explored squares (200 m each) */
      if (M.explored && M.z >= 12) {
        var keys = Object.keys(M.explored); if (keys.length > 4000) keys.length = 4000;
        cx.fillStyle = 'rgba(224,164,88,.16)'; cx.strokeStyle = 'rgba(224,164,88,.35)'; cx.lineWidth = 1;
        keys.forEach(function (k) {
          var p = k.split('|'), la = +p[0] * 0.002, lo = +p[1] * 0.002, a = project(la, lo), b = project(la + 0.002, lo + 0.002);
          if (b[0] < -20 || a[0] > W + 20 || a[1] < -20 || b[1] > H + 20) return;
          cx.fillRect(a[0], b[1], b[0] - a[0], a[1] - b[1]); cx.strokeRect(a[0], b[1], b[0] - a[0], a[1] - b[1]);
        });
      }
      /* lines (routes) */
      Object.keys(M.lines).forEach(function (id) {
        var L = M.lines[id]; if (!L.pts || L.pts.length < 2) return;
        path(L.pts); cx.lineCap = cx.lineJoin = 'round'; cx.setLineDash([]); cx.lineWidth = (L.w || 5) + 3; cx.strokeStyle = 'rgba(255,255,255,.85)'; cx.stroke();
        path(L.pts); cx.setLineDash(L.dash ? [9, 8] : []); cx.lineWidth = L.w || 5; cx.strokeStyle = L.color || '#E0A458'; cx.stroke(); cx.setLineDash([]);
      });
      /* your trail */
      if (M.trail && M.trail.length > 1) {
        path(M.trail); cx.lineCap = cx.lineJoin = 'round'; cx.lineWidth = 8; cx.strokeStyle = 'rgba(255,255,255,.9)'; cx.stroke();
        path(M.trail); cx.lineWidth = 5; cx.strokeStyle = accent(); cx.stroke();
        dot(M.trail[0], 6, '#3FBF6F');
      }
      /* markers */
      var now = Date.now();
      M.markers.forEach(function (m) {
        var p = project(m.lat, m.lon); if (p[0] < -30 || p[0] > W + 30 || p[1] < -30 || p[1] > H + 30) return;
        if (m.pulse) { var ph = ((now - M.t0) % 1600) / 1600; cx.beginPath(); cx.arc(p[0], p[1], 14 + ph * 22, 0, 7); cx.strokeStyle = 'rgba(242,193,78,' + (0.7 - ph * 0.7).toFixed(2) + ')'; cx.lineWidth = 3; cx.stroke(); }
        cx.beginPath(); cx.arc(p[0], p[1], m.big ? 17 : 14, 0, 7); cx.fillStyle = m.color || '#F2C14E'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = m.sel ? '#fff' : 'rgba(0,0,0,.55)'; cx.stroke();
        cx.fillStyle = '#1a1208'; cx.font = '700 ' + (m.big ? 15 : 13) + 'px system-ui,sans-serif'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(m.label || '', p[0], p[1] + 1);
      });
      /* you */
      if (M.me) {
        var q = project(M.me.lat, M.me.lon), r = M.me.acc ? M.me.acc / (156543.03 * Math.cos(M.me.lat * Math.PI / 180) / Math.pow(2, M.z)) : 0;
        if (r > 8) { cx.beginPath(); cx.arc(q[0], q[1], Math.min(r, 90), 0, 7); cx.fillStyle = 'rgba(80,160,255,.16)'; cx.fill(); }
        cx.beginPath(); cx.arc(q[0], q[1], 9, 0, 7); cx.fillStyle = '#3B9BFF'; cx.fill(); cx.lineWidth = 3; cx.strokeStyle = '#fff'; cx.stroke();
      }
      if (M.markers.some(function (m) { return m.pulse; })) { M.raf = requestAnimationFrame(function () { M.raf = 0; if (alive()) draw(); }); }
    }
    function path(pts) { cx.beginPath(); pts.forEach(function (p, i) { var q = project(p[0], p[1]); if (i) cx.lineTo(q[0], q[1]); else cx.moveTo(q[0], q[1]); }); }
    function dot(p, r, col) { var q = project(p[0], p[1]); cx.beginPath(); cx.arc(q[0], q[1], r, 0, 7); cx.fillStyle = col; cx.fill(); cx.lineWidth = 2; cx.strokeStyle = '#fff'; cx.stroke(); }
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
      var zi = Math.floor(M.z), s = Math.pow(2, M.z - zi), nx = wx(M.lon, zi) - dx / s, ny = wy(M.lat, zi) - dy / s;
      M.lon = unx(nx, zi); M.lat = uny(ny, zi); if (M.follow && (Math.abs(dx) + Math.abs(dy)) > 2) { M.follow = false; setFollowBtn(); } redraw();
    });
    function up(e) { delete ptr[e.pointerId]; pinch = 0; }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', function (e) { e.preventDefault(); zoomBy(e.deltaY < 0 ? 0.5 : -0.5); }, { passive: false });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-vm]'); if (!b) return; e.stopPropagation();
      var a = b.getAttribute('data-vm');
      if (a === 'in') zoomBy(1); else if (a === 'out') zoomBy(-1);
      else if (a === 'me') { M.follow = true; setFollowBtn(); if (M.me) { M.lat = M.me.lat; M.lon = M.me.lon; } redraw(); }
    });
    var ro = null; try { ro = new ResizeObserver(size); ro.observe(el); } catch (e) {}
    size();

    var H_ = {
      alive: alive,
      destroy: function () { M.dead = true; try { ro && ro.disconnect(); } catch (e) {} },
      setView: function (lat, lon, z) { M.lat = lat; M.lon = lon; if (z) M.z = z; redraw(); },
      setTrail: function (pts) { M.trail = pts; redraw(); },
      setLine: function (id, pts, o) { if (!pts) delete M.lines[id]; else { o = o || {}; M.lines[id] = { pts: pts, dash: o.dash, color: o.color, w: o.w }; } redraw(); },
      setMarkers: function (list) { M.markers = list || []; redraw(); },
      setExplored: function (set) { M.explored = set; redraw(); },
      setMe: function (p) { M.me = p; if (p && M.follow) { M.lat = p.lat; M.lon = p.lon; } redraw(); },
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
  V.map = { mount: mount, snap: snap, route: route };
})();
