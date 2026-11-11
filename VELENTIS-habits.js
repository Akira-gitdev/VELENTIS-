/* Habit tracker and habit stats. Sends habit.done events to the Core. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, iso = u.iso, addDays = u.addDays, plural = u.plural;
  var KEY = 'velentis.habits.v1', pendingDel = null, focusAdd = false;

  function seed() {
    var t = new Date();
    function days(list) { return list.map(function (n) { return iso(addDays(t, -n)); }); }
    return { sample: true, habits: [
      { id: 'h1', name: 'Drink 8 glasses of water', days: days([0, 1, 2, 3, 4]) },
      { id: 'h2', name: 'Read 10 pages', days: days([0, 1, 2]) },
      { id: 'h3', name: 'Walk outside', days: days([1, 2, 3]) },
      { id: 'h4', name: 'Revise flashcards', days: days([1]) }
    ] };
  }
  var S = u.get(KEY, null);
  if (!S || !Array.isArray(S.habits)) S = seed();
  function save() { u.put(KEY, S); }

  function has(h, d) { return h.days.indexOf(d) !== -1; }
  function streak(h) {
    var d = new Date();
    if (!has(h, iso(d))) d = addDays(d, -1);
    var n = 0;
    while (has(h, iso(d))) { n++; d = addDays(d, -1); }
    return n;
  }
  function doneToday() { var t = iso(new Date()); return S.habits.filter(function (h) { return has(h, t); }).length; }
  function bestStreak() { return S.habits.reduce(function (m, h) { return Math.max(m, streak(h)); }, 0); }
  V.habits = { count: function () { return S.habits.length; }, doneToday: doneToday, bestStreak: bestStreak };

  function renderHabits() {
    var t = new Date(), td = iso(t), dow = (t.getDay() + 6) % 7, mon = addDays(t, -dow);
    var letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'], total = S.habits.length, cells = '';
    for (var i = 0; i < 7; i++) {
      var d = addDays(mon, i), key = iso(d), c = S.habits.filter(function (h) { return has(h, key); }).length;
      var cls = (total && c === total ? 'full' : c > 0 ? 'part' : '') + (key === td ? ' today' : '') + (key > td ? ' future' : '');
      cells += '<div class="day"><div class="l">' + letters[i] + '</div><div class="c ' + cls + '">' + d.getDate() + '</div></div>';
    }
    var rows = S.habits.map(function (h) {
      var done = has(h, td), s = streak(h), pend = pendingDel === h.id;
      return '<li class="card row"><button class="check' + (done ? ' on' : '') + '" data-act="toggle" data-id="' + h.id + '" aria-pressed="' + done + '" aria-label="Mark ' + esc(h.name) + ' done today">' + (done ? ic('tick') : '') + '</button>' +
        '<div class="txt"><div class="nm">' + esc(h.name) + '</div><div class="sub">' + (s > 0 ? plural(s, 'day') + ' streak' : 'No streak yet') + '</div></div>' +
        '<button class="icon-btn' + (pend ? ' warn' : '') + '" data-act="del" data-id="' + h.id + '" aria-label="Delete ' + esc(h.name) + '">' + (pend ? 'Delete?' : ic('trash')) + '</button></li>';
    }).join('');
    var empty = '<div class="card empty"><h2>Start your first habit</h2><p>Type a habit below and check it off each day.</p></div>';
    $('v-habits').innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="go" data-to="home" aria-label="Back">' + ic('back') + '</button><h1>Habit tracker</h1></div>' +
      '<div class="card pad"><div class="eyebrow">This week</div><div class="week">' + cells + '</div></div>' +
      (S.sample ? '<p class="note">These are example habits. Delete them or add your own.</p>' : '') +
      (total ? '<ul class="list">' + rows + '</ul>' : empty) +
      '<form class="stack" id="addForm" novalidate style="gap:6px"><div class="form"><input class="field" id="habitName" maxlength="40" placeholder="New habit, like Stretch for 5 minutes" aria-label="New habit name" autocomplete="off"><button class="add" type="submit">Add</button></div><div class="err" id="addErr" hidden>Type a habit name first.</div></form>';
    if (focusAdd) { focusAdd = false; var f = $('habitName'); if (f) f.focus(); }
  }

  function renderStats() {
    var t = new Date(), total = S.habits.length, sum = 0, bars = '', letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (var i = 6; i >= 0; i--) {
      var d = addDays(t, -i), key = iso(d), c = S.habits.filter(function (h) { return has(h, key); }).length;
      var p = total ? c / total : 0; sum += p;
      bars += '<div><b style="height:' + Math.max(3, Math.round(p * 84)) + 'px" title="' + Math.round(p * 100) + '%"></b><span>' + letters[d.getDay()] + '</span></div>';
    }
    var avg = total ? Math.round(sum / 7 * 100) : 0;
    $('v-stats').innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="go" data-to="me" aria-label="Back">' + ic('back') + '</button><h1>Habit stats</h1></div>' +
      '<div class="metrics"><div class="card pad"><div class="eyebrow">Habits</div><div class="big">' + total + '</div></div>' +
      '<div class="card pad"><div class="eyebrow">Best streak</div><div class="big">' + plural(bestStreak(), 'day') + '</div></div></div>' +
      '<div class="card pad"><div class="eyebrow">Last 7 days</div><div class="big">' + avg + '% done</div><div class="bars" role="img" aria-label="Habits completed each of the last 7 days">' + bars + '</div></div>';
  }

  V.registerTool('habits', renderHabits);
  V.registerView('stats', renderStats);
  V.registerSearch(function (q) {
    return S.habits.filter(function (h) { return h.name.toLowerCase().indexOf(q) !== -1; }).map(function (h) { return { icon: 'check', title: h.name, sub: 'Habit', to: 'habits' }; });
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a === 'quick') { focusAdd = true; if (V.view() === 'habits') renderHabits(); else V.go('habits'); }
    else if (a === 'toggle') {
      var h = S.habits.filter(function (x) { return x.id === id; })[0]; if (!h) return;
      var td = iso(new Date()), i = h.days.indexOf(td);
      if (i === -1) { h.days.push(td); save(); V.emit('habit.done', { ref: id, streak: streak(h) }); }
      else { h.days.splice(i, 1); save(); }
      if (V.view() === 'habits') renderHabits();
    } else if (a === 'del') {
      if (pendingDel === id) { S.habits = S.habits.filter(function (x) { return x.id !== id; }); S.sample = false; pendingDel = null; save(); renderHabits(); }
      else { pendingDel = id; renderHabits(); setTimeout(function () { if (pendingDel === id) { pendingDel = null; if (V.view() === 'habits') renderHabits(); } }, 3000); }
    }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'addForm') return;
    e.preventDefault();
    var f = $('habitName'), name = f.value.trim();
    if (!name) { $('addErr').hidden = false; f.focus(); return; }
    S.habits.push({ id: 'h' + u.uid(), name: name, days: [] });
    S.sample = false; save(); focusAdd = true; renderHabits();
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'habitName') $('addErr').hidden = true; });
})();
