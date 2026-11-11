/* Self tools: Daily planner, Focus timer, Mood journal. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, iso = u.iso, addDays = u.addDays, plural = u.plural, bar = u.bar;

  /* ---------- Daily planner ---------- */
  var PL = u.get('velentis.plan.v1', { items: [] });
  if (!PL || !Array.isArray(PL.items)) PL = { items: [] };
  var plDay = iso(new Date()), plPend = null;
  function plSave() { u.put('velentis.plan.v1', PL); }
  function dayLabel(d) {
    var t = iso(new Date());
    if (d === t) return 'Today';
    if (d === iso(addDays(new Date(), 1))) return 'Tomorrow';
    if (d === iso(addDays(new Date(), -1))) return 'Yesterday';
    return u.parse(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function renderPlan() {
    var today = iso(new Date());
    var list = PL.items.filter(function (x) { return x.day === plDay; }).sort(function (a, b) {
      if (a.done !== b.done) return a.done ? 1 : -1;
      return (a.time || '99:99') < (b.time || '99:99') ? -1 : (a.time || '99:99') > (b.time || '99:99') ? 1 : 0;
    });
    var done = list.filter(function (x) { return x.done; }).length, pct = list.length ? Math.round(done / list.length * 100) : 0;
    var late = plDay === today ? PL.items.filter(function (x) { return x.day < today && !x.done; }).length : 0;
    var rows = list.map(function (x) {
      var pend = plPend === x.id;
      return '<li class="card row"><button class="check' + (x.done ? ' on' : '') + '" data-act="pl-toggle" data-id="' + x.id + '" aria-pressed="' + !!x.done + '" aria-label="Mark done">' + (x.done ? ic('tick') : '') + '</button>' +
        '<div class="txt"><div class="nm" style="' + (x.done ? 'text-decoration:line-through;opacity:.6' : '') + '">' + esc(x.text) + '</div>' + (x.time ? '<div class="sub">' + esc(x.time) + '</div>' : '') + '</div>' +
        '<button class="icon-btn' + (pend ? ' warn' : '') + '" data-act="pl-del" data-id="' + x.id + '" aria-label="Delete task">' + (pend ? 'Delete?' : ic('trash')) + '</button></li>';
    }).join('');
    $('v-plan').innerHTML =
      bar(u.BACK_TOOLS, 'Daily planner') +
      '<div class="card pad"><div class="head" style="align-items:center"><button class="icon-btn" data-act="pl-prev" aria-label="Previous day">' + ic('back') + '</button>' +
      '<div style="text-align:center"><div class="big" style="font-size:24px">' + dayLabel(plDay) + '</div><div class="note">' + (list.length ? done + ' of ' + list.length + ' done' : 'Nothing planned') + '</div></div>' +
      '<button class="icon-btn" data-act="pl-next" aria-label="Next day">' + ic('chev') + '</button></div>' + (list.length ? '<div class="bar"><i style="width:' + pct + '%"></i></div>' : '') + '</div>' +
      (late ? '<button class="btn2" data-act="pl-move">Move ' + late + ' unfinished ' + (late === 1 ? 'task' : 'tasks') + ' to today</button>' : '') +
      (rows ? '<ul class="list">' + rows + '</ul>' : '<div class="card empty"><h2>Plan your day</h2><p>Add the things you want to get done.</p></div>') +
      '<form class="stack" id="plForm" novalidate style="gap:8px"><div class="form"><input class="field" id="plText" maxlength="80" placeholder="What needs doing?" aria-label="Task" autocomplete="off"><input class="field" id="plTime" type="time" aria-label="Time (optional)" style="max-width:120px"></div><button class="add" type="submit" style="width:100%">Add task</button><div class="err" id="plErr" hidden>Type a task first.</div></form>';
  }

  /* ---------- Focus timer ---------- */
  var FO = u.get('velentis.focus.v1', { sessions: [] });
  if (!FO || !Array.isArray(FO.sessions)) FO = { sessions: [] };
  var RUN = u.get('velentis.focus.run', null);
  var foMin = 25, tick = 0;
  function foSave() { u.put('velentis.focus.v1', FO); }
  function runSave() { if (RUN) u.put('velentis.focus.run', RUN); else { try { localStorage.removeItem('velentis.focus.run'); } catch (e) {} } }
  function remainMs() { if (!RUN) return foMin * 60000; return RUN.paused ? RUN.left : Math.max(0, RUN.end - Date.now()); }
  function fmt(ms) { var s = Math.ceil(ms / 1000), m = Math.floor(s / 60); s = s % 60; return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s; }
  function beep() {
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
    try {
      var A = window.AudioContext || window.webkitAudioContext, c = new A(), o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination); o.frequency.value = 660; g.gain.value = 0.15; o.start(); o.stop(c.currentTime + 0.5);
    } catch (e) {}
  }
  function finishRun() {
    if (!RUN) return;
    var r = RUN; RUN = null; runSave();
    FO.sessions.push({ id: r.id, day: iso(new Date()), min: r.min });
    foSave(); beep();
    V.emit('focus.done', { ref: r.id, units: Math.floor(r.min / 5) });
    V.toast('Focus round complete');
  }
  function checkRun() { if (RUN && !RUN.paused && Date.now() >= RUN.end) finishRun(); }
  function todayMin() { var t = iso(new Date()); return FO.sessions.filter(function (s) { return s.day === t; }).reduce(function (a, s) { return a + s.min; }, 0); }
  function renderFocus() {
    checkRun();
    var t = new Date(), bars = '', letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'], max = 1, vals = [];
    for (var i = 6; i >= 0; i--) {
      var d = addDays(t, -i), k = iso(d), m = FO.sessions.filter(function (s) { return s.day === k; }).reduce(function (a, s) { return a + s.min; }, 0);
      vals.push([d, m]); if (m > max) max = m;
    }
    vals.forEach(function (p) { bars += '<div><b style="height:' + Math.max(3, Math.round(p[1] / max * 84)) + 'px" title="' + p[1] + ' min"></b><span>' + letters[p[0].getDay()] + '</span></div>'; });
    var run = !!RUN, running = run && !RUN.paused;
    var presets = [15, 25, 45].map(function (m) {
      return '<button class="tag' + (foMin === m ? ' on' : '') + '"' + (run ? ' disabled' : '') + ' data-act="fo-pre" data-id="' + m + '">' + m + ' min</button>';
    }).join('');
    $('v-focus').innerHTML =
      bar(u.BACK_TOOLS, 'Focus timer') +
      '<div class="card pad" style="text-align:center"><div class="eyebrow">' + (run ? (running ? 'Stay with it' : 'Paused') : 'Ready') + '</div><div class="clock" id="clockTxt" aria-live="off">' + fmt(remainMs()) + '</div>' +
      '<div class="chips" style="justify-content:center">' + presets + '</div>' +
      (run ? '' : '<div class="form" style="margin-top:12px"><input class="field" id="foCustom" type="number" inputmode="numeric" min="1" max="180" placeholder="Custom minutes" aria-label="Custom minutes" autocomplete="off"><button class="add" data-act="fo-custom" type="button">Set</button></div>') + '</div>' +
      '<div class="duo">' + (running ? '<button class="btn2 main" data-act="fo-pause">Pause</button>' : '<button class="btn2 main" data-act="fo-start">' + (run ? 'Resume' : 'Start') + '</button>') +
      '<button class="btn2" data-act="fo-reset"' + (run ? '' : ' disabled style="opacity:.4"') + '>Reset</button></div>' +
      '<div class="card pad"><div class="eyebrow">Today</div><div class="big">' + todayMin() + ' min focused</div><div class="bars" role="img" aria-label="Focus minutes in the last 7 days">' + bars + '</div></div>';
  }
  function tickLoop() {
    clearInterval(tick);
    tick = setInterval(function () {
      if (!RUN || RUN.paused) return;
      if (Date.now() >= RUN.end) { finishRun(); if (V.view() === 'focus') renderFocus(); return; }
      var el = $('clockTxt'); if (el && V.view() === 'focus') el.textContent = fmt(remainMs());
    }, 500);
  }
  tickLoop();

  /* ---------- Mood journal ---------- */
  var MD = u.get('velentis.mood.v1', { days: {} });
  if (!MD || typeof MD.days !== 'object' || !MD.days) MD = { days: {} };
  var MOODS = [[1, 'Awful'], [2, 'Low'], [3, 'Okay'], [4, 'Good'], [5, 'Great']], mdPick = 0;
  function mdSave() { u.put('velentis.mood.v1', MD); }
  function renderMood() {
    var td = iso(new Date()), cur = MD.days[td], t = new Date(), bars = '', letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (var i = 13; i >= 0; i--) {
      var d = addDays(t, -i), e = MD.days[iso(d)];
      bars += '<div><b style="height:' + (e ? e.m * 16 : 3) + 'px;' + (e ? '' : 'opacity:.35') + '" title="' + (e ? MOODS[e.m - 1][1] : 'No entry') + '"></b><span>' + letters[d.getDay()] + '</span></div>';
    }
    var pick = mdPick || (cur ? cur.m : 0);
    var buttons = MOODS.map(function (m) {
      return '<button class="mood' + (pick === m[0] ? ' on' : '') + '" data-act="md-pick" data-id="' + m[0] + '" aria-pressed="' + (pick === m[0]) + '"><b>' + m[0] + '</b><span>' + m[1] + '</span></button>';
    }).join('');
    var hist = Object.keys(MD.days).sort().reverse().slice(0, 14).map(function (k) {
      var e = MD.days[k];
      return '<li class="card row"><div class="txt"><div class="nm">' + MOODS[e.m - 1][1] + '</div><div class="sub">' + u.niceDate(k) + (e.note ? ' · ' + esc(e.note) : '') + '</div></div></li>';
    }).join('');
    $('v-mood').innerHTML =
      bar(u.BACK_TOOLS, 'Mood journal') +
      '<div class="card pad"><div class="eyebrow">How are you today?</div><div class="moods">' + buttons + '</div></div>' +
      '<form class="stack" id="mdForm" novalidate style="gap:8px"><textarea class="field" id="mdNote" maxlength="240" placeholder="A few words about your day (optional)" aria-label="Note">' + esc(cur ? cur.note || '' : '') + '</textarea><button class="add" type="submit" style="width:100%">' + (cur ? 'Update today' : 'Save today') + '</button><div class="err" id="mdErr" hidden>Pick a mood first.</div></form>' +
      '<div class="card pad"><div class="eyebrow">Last 14 days</div><div class="bars b14" role="img" aria-label="Mood over the last 14 days">' + bars + '</div></div>' +
      (hist ? '<ul class="list">' + hist + '</ul>' : '');
  }

  V.registerTool('plan', renderPlan);
  V.registerTool('focus', renderFocus);
  V.registerTool('mood', renderMood);
  V.registerSearch(function (q) {
    var out = [];
    PL.items.forEach(function (x) { if (x.text.toLowerCase().indexOf(q) !== -1) out.push({ icon: 'list', title: x.text, sub: 'Task', to: 'plan' }); });
    return out.slice(0, 5);
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a.indexOf('pl-') === 0) {
      if (a === 'pl-prev') plDay = iso(addDays(u.parse(plDay), -1));
      else if (a === 'pl-next') plDay = iso(addDays(u.parse(plDay), 1));
      else if (a === 'pl-toggle') {
        var x = PL.items.filter(function (i) { return i.id === id; })[0];
        if (x) { x.done = !x.done; plSave(); if (x.done) V.emit('plan.done', { ref: x.id }); }
      } else if (a === 'pl-del') {
        if (plPend === id) { PL.items = PL.items.filter(function (i) { return i.id !== id; }); plPend = null; plSave(); }
        else { plPend = id; setTimeout(function () { if (plPend === id) { plPend = null; if (V.view() === 'plan') renderPlan(); } }, 3000); }
      } else if (a === 'pl-move') {
        var today = iso(new Date());
        PL.items.forEach(function (i) { if (i.day < today && !i.done) i.day = today; });
        plSave();
      }
      renderPlan();
    } else if (a.indexOf('fo-') === 0) {
      if (a === 'fo-pre') { foMin = +id; }
      else if (a === 'fo-custom') { var v = parseInt($('foCustom').value, 10); if (v >= 1 && v <= 180) foMin = v; }
      else if (a === 'fo-start') {
        if (RUN && RUN.paused) { RUN.end = Date.now() + RUN.left; RUN.paused = false; delete RUN.left; }
        else RUN = { id: 'f' + u.uid(), min: foMin, end: Date.now() + foMin * 60000 };
        runSave();
      } else if (a === 'fo-pause') { if (RUN && !RUN.paused) { RUN.left = Math.max(0, RUN.end - Date.now()); RUN.paused = true; runSave(); } }
      else if (a === 'fo-reset') { RUN = null; runSave(); }
      renderFocus();
    } else if (a === 'md-pick') { mdPick = +id; renderMood(); }
  });
  document.addEventListener('submit', function (e) {
    var id = e.target.id;
    if (id === 'plForm') {
      e.preventDefault();
      var tx = $('plText').value.trim();
      if (!tx) { $('plErr').hidden = false; return; }
      PL.items.push({ id: 'p' + u.uid(), day: plDay, text: tx, time: $('plTime').value || '', done: false });
      plSave(); renderPlan(); $('plText').focus();
    } else if (id === 'mdForm') {
      e.preventDefault();
      var cur = MD.days[iso(new Date())], m = mdPick || (cur ? cur.m : 0);
      if (!m) { $('mdErr').hidden = false; return; }
      var day = iso(new Date()), first = !MD.days[day];
      MD.days[day] = { m: m, note: $('mdNote').value.trim() }; mdSave(); mdPick = 0; renderMood();
      if (first) V.emit('mood.log', { ref: day });
      V.toast('Saved');
    }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'plText') $('plErr').hidden = true;
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) { checkRun(); if (V.view() === 'focus') renderFocus(); } });
})();
