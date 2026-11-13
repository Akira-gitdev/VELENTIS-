/* VELENTIS realm: the five painted sections (Home, Inventory, World, Workshop, Messages).
   Each section is one of your original paintings with real, working interface laid on top.
   Positions are written in picture pixels (941 x 1672) and turned into percentages, so they line up on every phone. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, core = V.core;
  var W = 941, H = 1672;

  /* ---------- tiny helpers ---------- */
  function ic(n) { return '<svg class="ic" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function pct(v, t) { return (v / t * 100).toFixed(3) + '%'; }
  function box(x0, y0, x1, y1) { return 'left:' + pct(x0, W) + ';top:' + pct(y0, H) + ';width:' + pct(x1 - x0, W) + ';height:' + pct(y1 - y0, H) + ';'; }
  function at(cls, b, inner, extra) { return '<div class="' + cls + '" style="' + box(b[0], b[1], b[2], b[3]) + (extra || '') + '">' + inner + '</div>'; }
  function btn(cls, b, inner, attrs, extra) { return '<button class="rm-btn ' + cls + '" style="' + box(b[0], b[1], b[2], b[3]) + (extra || '') + '" ' + attrs + '>' + inner + '</button>'; }
  function plaque(b, text, cls) { return at('rm-plaque ' + (cls || ''), b, esc(text)); }
  function scene(bg, inner, label) { return '<div class="scene" data-bg="' + bg + '" role="group" aria-label="' + esc(label) + '">' + inner + '</div>'; }
  function put(view, bg, html, label) {
    var el = $('v-' + view); if (!el) return;
    el.className = 'view realm';
    el.innerHTML = scene(bg, html, label);
  }
  function bar(p, extra) { return '<div class="rm-bar" style="' + (extra || '') + '"><i style="width:' + Math.max(0, Math.min(100, p)) + '%"></i></div>'; }
  function clip(s, n) { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function km(n) { return (Math.round(n * 10) / 10).toString(); }
  function refresh() { if (V.views[V.view()]) V.views[V.view()](); }

  /* ---------- the facts every section shows ---------- */
  function facts() {
    var st = core.state(), li = core.levelInfo(st.total);
    var rs = V.run ? V.run.stats() : { totalKm: 0, weekKm: 0, runs: 0 };
    return { st: st, li: li, name: st.name || 'Traveler', km: rs.totalKm, areas: V.tiles ? V.tiles.count() : 0, streak: (st.best && st.best.streak) || 0 };
  }

  /* =============================================================
     HOME
     ============================================================= */
  function spot(x, y, icon, label, to) {
    return '<button class="rm-spot" style="left:' + pct(x, W) + ';top:' + pct(y, H) + '" ' + (to === 'world' ? 'data-act="go" data-to="world"' : 'data-act="open" data-k="' + to + '"') + ' aria-label="' + esc(label) + '"><b>' + ic(icon) + '</b><span>' + esc(label) + '</span></button>';
  }
  function renderHome() {
    var f = facts(), li = f.li, qs = core.quests(), wk = core.week();
    var hr = new Date().getHours(), greet = hr < 5 ? 'Still up' : hr < 12 ? 'Good morning' : hr < 18 ? 'Good afternoon' : 'Good evening';
    var top = '<div class="rm-row" style="height:100%;gap:calc(var(--u)*2.6)">' +
      '<div style="flex:none;width:calc(var(--u)*13);height:calc(var(--u)*13);border-radius:50%;display:grid;place-items:center;background:linear-gradient(#F3C98A,#C98A3E);border:2px solid #FFF0D4;color:#2A1704;font-family:var(--serif);font-weight:700;font-size:calc(var(--u)*6)" aria-label="Level ' + li.level + '">' + li.level + '</div>' +
      '<div class="rm-in" style="flex:1;gap:calc(var(--u)*.9)"><div class="rm-small rm-muted">' + greet + '</div>' +
      '<div style="font-family:var(--serif);font-weight:700;font-size:calc(var(--u)*4.6);line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(f.name) + '</div>' +
      bar(li.pct) + '<div class="rm-small rm-muted">' + li.into + ' of ' + li.need + ' XP to level ' + (li.level + 1) + '</div></div>' +
      '<div style="flex:none;text-align:center"><div class="rm-big" style="font-size:calc(var(--u)*6)">' + wk.active + '<span class="rm-muted" style="font-size:calc(var(--u)*3.4)">/' + wk.goal + '</span></div><div class="rm-small rm-muted">days this week</div></div></div>';
    var rows = qs.slice(0, 3).map(function (q) {
      return '<button class="rm-row" style="background:none;border:0;padding:calc(var(--u)*1) 0;text-align:left;width:100%;cursor:pointer" data-act="open" data-k="' + esc(q.tool || '') + '"' + (q.tool ? '' : ' disabled') + '>' +
        '<span style="flex:none;width:calc(var(--u)*5);height:calc(var(--u)*5);border-radius:50%;border:2px solid ' + (q.done ? '#E0A458' : 'rgba(246,234,216,.45)') + ';background:' + (q.done ? '#E0A458' : 'transparent') + ';display:grid;place-items:center;color:#2A1704">' + (q.done ? ic('tick') : '') + '</span>' +
        '<span class="rm-txt" style="' + (q.done ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(q.text) + '</span>' +
        '<span class="rm-small" style="flex:none;color:#E0A458;font-weight:700">' + (q.done ? 'Done' : q.have + '/' + q.need) + '</span></button>';
    }).join('');
    var next = core.nextAction();
    var qcard = '<div style="font-family:var(--serif);font-weight:700;font-size:calc(var(--u)*3.6);margin-bottom:calc(var(--u)*1)">Today’s quests</div>' + (rows || '<div class="rm-muted">No quests right now.</div>') +
      (next && next.text ? '<div class="rm-small rm-muted" style="margin-top:auto;padding-top:calc(var(--u)*1.2)">Next step: ' + esc(next.text) + '</div>' : '');
    put('home', 'home',
      at('rm-card rm-in', [34, 36, 907, 226], top) +
      spot(270, 770, 'map', 'World', 'world') + spot(695, 690, 'book', 'Library', 'lib') + spot(610, 975, 'list', 'Planner', 'plan') + spot(860, 940, 'check', 'Habits', 'habits') +
      at('rm-card rm-in', [34, 1210, 907, 1620], qcard),
      'Home');
  }

  /* =============================================================
     INVENTORY
     ============================================================= */
  var inv = { sel: null };
  var CLASS = { strength: 'Vanguard', endurance: 'Wayfarer', knowledge: 'Scholar', discipline: 'Warden', practical: 'Artisan', communication: 'Bard' };
  var ATTR_ICON = { strength: 'activity', endurance: 'route', knowledge: 'book', discipline: 'timer', practical: 'chef', communication: 'lang' };
  var SLOTS = [
    ['Helm', 'discipline', 'timer'], ['Amulet', 'communication', 'lang'], ['Tome', 'knowledge', 'book'], ['Cloak', 'lvl5', 'shield'],
    ['Crown', 'lvl10', 'award'], ['Gauntlets', 'strength', 'activity'], ['Satchel', 'practical', 'chef'], ['Boots', 'endurance', 'route']
  ];
  var SLOT_Y = [133, 270, 408, 546];
  function attrName(k) { return (core.ATTRS.filter(function (a) { return a[0] === k; })[0] || [k, k])[1]; }
  function slotInfo(s, f) {
    var k = s[1];
    if (k === 'lvl5') return { on: f.li.level >= 5, need: 'Reach level 5' };
    if (k === 'lvl10') return { on: f.li.level >= 10, need: 'Reach level 10' };
    var lv = core.attrLevel(f.st.xp[k]).level;
    return { on: lv >= 2, need: attrName(k) + ' level 2', lv: lv };
  }
  function renderInventory() {
    var f = facts(), li = f.li, st = f.st, top = 'knowledge', best = 0;
    core.ATTRS.forEach(function (a) { if (st.xp[a[0]] > best) { best = st.xp[a[0]]; top = a[0]; } });
    var title = best > 0 ? CLASS[top] : 'Newcomer';
    var ach = core.achievements().slice().sort(function (a, b) { return (b.on ? 1 : 0) - (a.on ? 1 : 0); });
    var gotN = ach.filter(function (a) { return a.on; }).length;
    var h = '';
    h += plaque([232, 12, 712, 84], 'Character', 'big');
    /* character crest */
    var crest = '<div class="rm-in" style="height:100%;align-items:center;justify-content:center;gap:calc(var(--u)*1.6);text-align:center">' +
      '<svg viewBox="0 0 100 120" style="width:44%;filter:drop-shadow(0 6px 10px rgba(0,0,0,.6))" aria-hidden="true"><defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3C98A"/><stop offset="1" stop-color="#9B5E26"/></linearGradient></defs>' +
      '<path d="M50 4 L92 18 V58 C92 88 72 106 50 116 C28 106 8 88 8 58 V18 Z" fill="url(#cg)" stroke="#FFF0D4" stroke-width="3"/>' +
      '<path d="M50 14 L82 25 V58 C82 82 66 97 50 105 C34 97 18 82 18 58 V25 Z" fill="#2A1A10" stroke="#C98A3E" stroke-width="2"/>' +
      '<text x="50" y="70" text-anchor="middle" font-family="Cinzel,serif" font-weight="700" font-size="40" fill="#FFD79A">' + li.level + '</text>' +
      '<path d="M50 28 l3 7 7 .6 -5.3 4.7 1.7 7 -6.4 -3.8 -6.4 3.8 1.7 -7 -5.3 -4.7 7 -.6 z" fill="#E0A458" transform="translate(0,-6) scale(1) translate(0,0)"/></svg>' +
      '<div style="font-family:var(--serif);font-weight:700;font-size:calc(var(--u)*5)">' + esc(f.name) + '</div>' +
      '<div class="rm-muted" style="font-size:calc(var(--u)*3.2)">' + title + ' · Level ' + li.level + '</div>' +
      '<div style="width:70%">' + bar(li.pct) + '</div><div class="rm-small rm-muted">' + st.total + ' XP total · ' + (li.need - li.into) + ' to next level</div></div>';
    h += at('', [262, 100, 684, 640], crest);
    /* equipment slots */
    SLOTS.forEach(function (s, i) {
      var left = i < 4, x0 = left ? 100 : 728, y0 = SLOT_Y[i % 4], info = slotInfo(s, f);
      h += btn('rm-cell ' + (info.on ? 'on' : 'off') + (inv.sel && inv.sel.t === 's' && inv.sel.i === i ? ' sel' : ''), [x0, y0, x0 + 114, y0 + 112],
        ic(info.on ? s[2] : 'lock') + '<span class="t">' + (info.on ? s[0] : 'Locked') + '</span>', 'data-act="rm-inv" data-t="s" data-i="' + i + '" aria-label="' + s[0] + (info.on ? ', equipped' : ', locked') + '"', 'padding:0');
    });
    /* attributes */
    h += plaque([60, 730, 512, 774], 'Attributes');
    var arows = core.ATTRS.map(function (a) {
      var l = core.attrLevel(st.xp[a[0]]);
      return '<div class="rm-row">' + ic(ATTR_ICON[a[0]]) + '<span style="flex:none;width:38%;font-size:calc(var(--u)*2.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(a[1].replace('Practical Skills', 'Practical').replace('Communication', 'Speech')) + '</span><div style="flex:1">' + bar(Math.max(l.pct, st.xp[a[0]] > 0 ? 6 : 0)) + '</div><span class="rm-small rm-muted" style="flex:none;width:12%;text-align:right">Lv ' + l.level + '</span></div>';
    }).join('');
    h += at('rm-in', [46, 786, 528, 1040], arows, 'justify-content:space-between');
    /* recent deeds */
    h += plaque([592, 728, 898, 770], 'Recent deeds');
    var rec = core.recent(6);
    var YS = [783, 826, 868, 910, 953, 995];
    for (var r = 0; r < 6; r++) {
      var e = rec[r];
      h += at('rm-row', [622, YS[r], 884, YS[r] + 38], e ? '<span class="rm-txt">' + esc(clip(e.n, 26)) + '</span><b style="flex:none;color:#E0A458">+' + e.xp + '</b>' : '<span class="rm-muted rm-small">' + (r === 0 ? 'Nothing yet.' : '') + '</span>', 'font-size:calc(var(--u)*2.7)');
    }
    /* achievements grid */
    h += plaque([70, 1078, 865, 1120], 'Achievements  ' + gotN + ' / ' + ach.length);
    var COLX = [68, 185, 303, 420, 537, 655, 772], ROWY = [1137, 1240, 1343];
    for (var c = 0; c < 21; c++) {
      var a = ach[c], cx = COLX[c % 7], cy = ROWY[Math.floor(c / 7)];
      if (!a) { h += at('rm-cell off', [cx, cy, cx + 100, cy + 93], ''); continue; }
      h += btn('rm-cell ' + (a.on ? 'on' : 'off') + (inv.sel && inv.sel.t === 'a' && inv.sel.id === a.id ? ' sel' : ''), [cx, cy, cx + 100, cy + 93],
        ic(a.on ? 'award' : 'lock') + '<span class="t">' + esc(clip(a.name, 13)) + '</span>', 'data-act="rm-inv" data-t="a" data-id="' + esc(a.id) + '" aria-label="' + esc(a.name) + (a.on ? ', earned' : ', not yet') + '"');
    }
    /* bottom boxes */
    h += plaque([66, 1476, 286, 1512], 'Details');
    var det = '<div class="rm-muted">Tap a slot or a badge to see what it is.</div>';
    if (inv.sel && inv.sel.t === 's') {
      var s = SLOTS[inv.sel.i], inf = slotInfo(s, f);
      det = '<b>' + s[0] + '</b>' + (inf.on ? '<div class="rm-muted">Equipped. Earned through ' + esc(attrName(s[1] === 'lvl5' || s[1] === 'lvl10' ? top : s[1])) + '.</div>' : '<div class="rm-muted">Locked. ' + inf.need + ' to unlock.</div>');
    } else if (inv.sel && inv.sel.t === 'a') {
      var g = ach.filter(function (x) { return x.id === inv.sel.id; })[0];
      if (g) det = '<b>' + esc(g.name) + '</b><div class="rm-muted">' + esc(g.text) + '</div><div style="color:#E0A458">' + (g.on ? 'Earned ' + esc(u.niceDate(g.date)) : 'Not yet earned') + '</div>';
    }
    h += at('rm-in', [56, 1516, 298, 1612], det, 'gap:calc(var(--u)*.6);font-size:calc(var(--u)*2.6);justify-content:center');
    h += plaque([356, 1472, 586, 1508], 'Progress');
    h += at('rm-in', [346, 1520, 596, 1614], '<div class="rm-row"><span class="rm-muted">Level</span><b style="margin-left:auto">' + li.level + '</b></div><div class="rm-row"><span class="rm-muted">Total XP</span><b style="margin-left:auto">' + st.total + '</b></div><div class="rm-row"><span class="rm-muted">Best streak</span><b style="margin-left:auto">' + f.streak + ' d</b></div>', 'gap:calc(var(--u)*.4);font-size:calc(var(--u)*2.8);justify-content:center');
    h += plaque([656, 1476, 872, 1512], 'Menu');
    h += btn('', [648, 1522, 770, 1608], ic('user') + '<span class="t">Profile</span>', 'data-act="go" data-to="me"', 'flex-direction:column');
    h += btn('', [780, 1522, 898, 1608], ic('palette') + '<span class="t">Look</span>', 'data-act="go" data-to="look"', 'flex-direction:column');
    put('inventory', 'inventory', h, 'Inventory');
  }

  /* =============================================================
     WORLD
     ============================================================= */
  var wd = { sel: 'hearthvale' };
  var REGIONS = [
    { id: 'hearthvale', n: 'Hearthvale', x: 110, y: 1010, i: 'home', lore: 'A cosy village by the river, and the start of every journey.', ok: function () { return true; }, req: 'Open to everyone.' },
    { id: 'stonebridge', n: 'Stonebridge', x: 650, y: 1085, i: 'route', lore: 'An old stone bridge. Travelers say it remembers every footstep.', ok: function (c) { return c.areas >= 3; }, req: function (c) { return 'Explore 3 areas on a run (you have ' + c.areas + ').'; } },
    { id: 'millbrook', n: 'Millbrook', x: 790, y: 800, i: 'sun', lore: 'Golden fields and a turning windmill. A peaceful place to rest.', ok: function (c) { return c.km >= 3; }, req: function (c) { return 'Run or walk 3 km in total (you have ' + km(c.km) + ').'; } },
    { id: 'silverfall', n: 'Silverfall', x: 130, y: 700, i: 'bulb', lore: 'A tall waterfall that glitters at dawn. Only steady travelers reach it.', ok: function (c) { return c.km >= 10; }, req: function (c) { return 'Run or walk 10 km in total (you have ' + km(c.km) + ').'; } },
    { id: 'keep', n: 'Velentis Keep', x: 720, y: 545, i: 'award', lore: 'The castle on the far hill. Few ever stand at its gates.', ok: function (c) { return c.level >= 5 && c.areas >= 5; }, req: function (c) { return 'Reach level 5 and explore 5 areas (level ' + c.level + ', ' + c.areas + ' areas).'; } }
  ];
  function renderWorld() {
    var f = facts(), li = f.li, c = { km: f.km, areas: f.areas, level: li.level };
    var h = '';
    h += at('', [30, 20, 150, 140], '<div style="width:100%;height:100%;display:grid;place-items:center;font-family:var(--serif);font-weight:700;font-size:calc(var(--u)*7);color:#FFD79A" aria-label="Level ' + li.level + '">' + li.level + '</div>');
    h += at('rm-in', [176, 32, 676, 104], '<div style="font-family:var(--serif);font-weight:700;font-size:calc(var(--u)*3.4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(f.name) + ' <span class="rm-muted" style="font-family:var(--font);font-weight:500;font-size:calc(var(--u)*2.5)">' + li.into + ' / ' + li.need + ' XP</span></div>' + bar(li.pct, 'margin-top:calc(var(--u)*1.2)'), 'justify-content:center');
    h += at('rm-in', [724, 30, 920, 106], '<div style="font-family:var(--serif);font-weight:700;font-size:calc(var(--u)*3.6);line-height:1">' + f.areas + '</div><div class="rm-muted" style="font-size:calc(var(--u)*2)">areas explored</div>', 'justify-content:center;align-items:center;text-align:center');
    /* left tool strip */
    var tools = [['run', 'route', 'Run tracker'], ['reps', 'camera', 'Rep counter'], ['move', 'activity', 'Workout log'], ['board', 'trophy', 'Leaderboards']];
    tools.forEach(function (t, i) {
      var y0 = 196 + i * 92;
      h += btn('', [24, y0, 106, y0 + 82], ic(t[1]), 'data-act="open" data-k="' + t[0] + '" aria-label="' + t[2] + '"');
    });
    /* pins on the map */
    REGIONS.forEach(function (r) {
      var on = r.ok(c);
      h += '<button class="rm-pin' + (on ? '' : ' locked') + (wd.sel === r.id ? ' sel' : '') + '" style="left:' + pct(r.x, W) + ';top:' + pct(r.y, H) + '" data-act="rm-world" data-id="' + r.id + '" aria-label="' + esc(r.n) + (on ? '' : ', locked') + '"><b>' + ic(on ? r.i : 'lock') + '</b></button>';
    });
    /* bottom boxes */
    var r = REGIONS.filter(function (x) { return x.id === wd.sel; })[0] || REGIONS[0], ok = r.ok(c);
    var reqText = typeof r.req === 'function' ? r.req(c) : r.req;
    h += at('rm-in', [40, 1520, 700, 1644], '<div style="font-family:var(--serif);font-weight:700;font-size:calc(var(--u)*3.2);color:#FFD79A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(r.n) + (ok ? '' : ' · locked') + '</div><div style="font-size:calc(var(--u)*2.4);line-height:1.2;max-height:calc(var(--u)*6);overflow:hidden">' + (ok ? esc(r.lore) : esc(reqText)) + '</div>', 'justify-content:center;gap:calc(var(--u)*.5)');
    h += btn('solid', [740, 1524, 910, 1640], ic('route') + '<span class="t" style="font-size:calc(var(--u)*3);font-weight:700">Run</span><span class="t" style="font-weight:500;opacity:.8">' + km(f.km) + ' km</span>', 'data-act="open" data-k="run" aria-label="Start a run"', 'flex-direction:column');
    put('world', 'world', h, 'World');
  }

  /* =============================================================
     WORKSHOP
     ============================================================= */
  var DEPTS = [
    { n: 'SELF', plaque: [110, 432, 375, 478], b: [56, 488, 428, 728], tools: [['habits', 'check', 'Habits'], ['mood', 'smile', 'Mood'], ['focus', 'timer', 'Focus'], ['plan', 'list', 'Planner']], cols: 2 },
    { n: 'MIND', plaque: [565, 432, 830, 478], b: [514, 488, 878, 728], tools: [['quiz', 'help', 'Quiz'], ['facts', 'globe', 'Myths'], ['lib', 'book', 'Library'], ['cards', 'layers', 'Cards'], ['gent', 'award', 'Academy'], ['notes', 'notes', 'Notes']], cols: 3 },
    { n: 'LIFE', plaque: [110, 792, 375, 838], b: [56, 848, 428, 1092], tools: [['spend', 'wallet', 'Money'], ['chef', 'chef', 'Chef'], ['skills', 'bulb', 'Skills'], ['count', 'timer', 'Events'], ['watch', 'play', 'Watch'], ['voice', 'mic', 'Voice']], cols: 3 },
    { n: 'WORLD', plaque: [565, 792, 830, 838], b: [514, 848, 878, 1092], tools: [['run', 'route', 'Run'], ['reps', 'camera', 'Reps'], ['move', 'activity', 'Workout']], cols: 3 },
    { n: 'INTELLIGENCE', plaque: [290, 1152, 655, 1200], b: [54, 1210, 888, 1468], tools: [['ai', 'spark', 'Vel'], ['lang', 'lang', 'Languages'], ['story', 'compass', 'Adventure'], ['write', 'pen', 'Writing']], cols: 4, wide: true }
  ];
  function renderWorkshop() {
    var h = '';
    h += at('rm-card rm-in', [40, 70, 901, 270],
      '<div class="rm-row" style="height:100%"><div class="rm-in" style="flex:1;gap:calc(var(--u)*.8)"><div style="font-family:var(--serif);font-weight:700;font-size:calc(var(--u)*5)">The Workshop</div><div class="rm-muted" style="font-size:calc(var(--u)*2.9)">Five departments. Pick a tool and get to work.</div></div>' +
      '<button class="rm-btn" style="flex:none;height:calc(var(--u)*10);padding:0 calc(var(--u)*3)" data-act="go" data-to="tools">All tools</button></div>');
    DEPTS.forEach(function (d) {
      h += plaque(d.plaque, d.n);
      var rows = d.wide ? 1 : 2;
      var cells = d.tools.map(function (t) {
        var built = (V.views[t[0]] && true);
        return '<button class="rm-btn stack" data-act="open" data-k="' + t[0] + '" aria-label="' + esc(t[2]) + '" style="min-height:0">' + ic(t[1]) + '<span class="t">' + esc(t[2]) + '</span></button>';
      }).join('');
      var extra = '';
      if (d.wide) {
        var hasKey = V.ai && V.ai.hasKey && V.ai.hasKey();
        extra = '<div class="rm-row" style="flex:none;font-size:calc(var(--u)*2.8)"><span class="rm-txt rm-muted" style="white-space:normal">' + (hasKey ? 'Vel is ready. Talk, practice a language, play a story or write.' : 'These four run on a free AI key that stays on your phone.') + '</span>' +
          (hasKey ? '' : '<button class="rm-btn solid" style="flex:none;height:calc(var(--u)*8);padding:0 calc(var(--u)*2.5)" data-act="go" data-to="aikey">Add key</button>') + '</div>';
      }
      h += at('rm-in', d.b, '<div style="flex:1;display:grid;grid-template-columns:repeat(' + d.cols + ',minmax(0,1fr));grid-template-rows:repeat(' + rows + ',minmax(0,1fr));gap:calc(var(--u)*1.6);min-height:0">' + cells + '</div>' + extra, 'gap:calc(var(--u)*1.6)');
    });
    put('workshop', 'workshop', h, 'Workshop');
  }

  /* =============================================================
     MESSAGES
     ============================================================= */
  var ms = { tab: 'friends' };
  var TABS = [
    ['friends', 'Friends', 'users', [37, 424, 232, 552]],
    ['chats', 'Chats', 'mail', [37, 584, 232, 698]],
    ['guilds', 'Guilds', 'shield', [37, 736, 232, 854]],
    ['invites', 'Invites', 'plus', [37, 889, 232, 1002]],
    ['alerts', 'Alerts', 'bell', [37, 1040, 232, 1122]]
  ];
  function session() { var s = u.get('velentis.session', null); return s && s.username ? s : null; }
  function renderMessages() {
    var f = facts(), s = session(), h = '';
    h += plaque([228, 28, 716, 92], 'Messages', 'big');
    TABS.forEach(function (t) {
      h += btn('paper stack' + (ms.tab === t[0] ? ' on' : ''), t[3], ic(t[2]) + '<span class="t" style="font-size:calc(var(--u)*2.7);font-weight:700">' + t[1] + '</span>', 'data-act="rm-msg" data-id="' + t[0] + '" aria-pressed="' + (ms.tab === t[0]) + '"');
    });
    var tabName = TABS.filter(function (t) { return t[0] === ms.tab; })[0][1];
    h += plaque([430, 374, 742, 418], tabName);
    var body = '';
    function para(t) { return '<p style="margin:0">' + t + '</p>'; }
    function pbtn(label, to, solid) { return '<button class="rm-btn ' + (solid ? 'solid' : 'paper') + '" style="height:calc(var(--u)*10);flex:none" data-act="go" data-to="' + to + '">' + label + '</button>'; }
    if (ms.tab === 'friends') {
      body = s ? para('Signed in as <b>' + esc(s.username) + '</b>. Add friends by username and see how you compare.') + pbtn('Open friends', 'friends', true) + pbtn('Leaderboards', 'board')
        : para('Log in to add friends and compete on the leaderboards. Your data stays yours: only your level, XP and weekly distance are shared.') + pbtn('Log in or sign up', 'online', true);
    } else if (ms.tab === 'chats') {
      body = para('<b>Coming soon.</b> Private chats with friends need a bit more online setup.') + para('For now, add friends and compare progress. Chats are next on the list.') + (s ? pbtn('Open friends', 'friends') : pbtn('Log in first', 'online'));
    } else if (ms.tab === 'guilds') {
      body = para('<b>Coming soon.</b> Guilds will be small groups with a shared goal, like a weekly distance everyone adds to.') + para('Guilds need accounts and a few new tables online, so they come after chats.');
    } else if (ms.tab === 'invites') {
      body = para('<b>Coming soon.</b> Guild and friend invitations will land here.') + para('Friend requests already work from the Friends page.') + pbtn('Open friends', 'friends');
    } else {
      var rec = core.recent(6);
      body = '<div class="rm-muted" style="margin-bottom:calc(var(--u)*.6)">Your latest activity</div>' + (rec.length ? rec.map(function (e) { return '<div class="rm-row" style="padding:calc(var(--u)*.8) 0;border-bottom:1px solid rgba(59,42,28,.18)"><span class="rm-txt">' + esc(e.n) + '</span><b style="flex:none;color:#8A5424">+' + e.xp + ' XP</b></div>'; }).join('') : para('Nothing yet. Finish a quest and it shows up here.'));
    }
    h += at('rm-in rm-ink rm-scroll', [276, 432, 896, 1122], body, 'gap:calc(var(--u)*2.2);font-size:calc(var(--u)*3);line-height:1.45;padding:calc(var(--u)*.5)');
    h += plaque([70, 1167, 342, 1210], 'Rank');
    h += at('rm-in rm-ink', [50, 1218, 350, 1410], '<div class="rm-small" style="color:rgba(59,42,28,.8)">Level <b>' + f.li.level + '</b> · ' + f.st.total + ' XP · ' + km(f.km) + ' km</div>' + pbtn('Leaderboards', 'board'), 'gap:calc(var(--u)*1.6);justify-content:center');
    h += plaque([420, 1167, 778, 1210], 'Account');
    h += at('rm-in rm-ink', [404, 1218, 902, 1410], '<div class="rm-small" style="color:rgba(59,42,28,.8)">' + (s ? 'Signed in as <b>' + esc(s.username) + '</b>. Your progress can back up online.' : 'Not signed in. Everything is saved on this phone.') + '</div>' + pbtn(s ? 'Account and sync' : 'Log in or sign up', 'online', !s), 'gap:calc(var(--u)*1.6);justify-content:center');
    put('messages', 'messages', h, 'Messages');
  }

  /* ---------- views, backdrops, taps ---------- */
  V.registerView('home', renderHome);
  V.registerView('inventory', renderInventory);
  V.registerView('world', renderWorld);
  V.registerView('workshop', renderWorkshop);
  V.registerView('messages', renderMessages);

  var BG = { home: 'home', inventory: 'inventory', world: 'world', workshop: 'workshop', messages: 'messages' };
  V.on('view.enter', function (name) {
    var st = $('stage'); if (!st) return;
    var key = BG[name];
    st.style.backgroundImage = 'url(VELENTIS-bg-' + (key || 'workshop') + '.webp)';
    st.classList.toggle('tool', !key);
  });
  V.on('core.changed', function () { if (BG[V.view()] && V.view() !== 'home') refresh(); });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return;
    var a = t.getAttribute('data-act');
    if (a === 'rm-inv') {
      var type = t.getAttribute('data-t');
      inv.sel = type === 's' ? { t: 's', i: +t.getAttribute('data-i') } : { t: 'a', id: t.getAttribute('data-id') };
      renderInventory();
    } else if (a === 'rm-world') { wd.sel = t.getAttribute('data-id'); renderWorld(); }
    else if (a === 'rm-msg') { ms.tab = t.getAttribute('data-id'); renderMessages(); }
  });
})();
