/* Workout log: sets, personal records, weekly view. Other tools (rep counter) can add sets too. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, iso = u.iso, addDays = u.addDays, plural = u.plural, bar = u.bar;
  var KEY = 'velentis.fit.v1';
  var F = u.get(KEY, { sets: [] });
  if (!F || !Array.isArray(F.sets)) F = { sets: [] };
  var EX = [['Push-ups', 'reps'], ['Squats', 'reps'], ['Pull-ups', 'reps'], ['Sit-ups', 'reps'], ['Lunges', 'reps'], ['Burpees', 'reps'], ['Bicep curls', 'weight'], ['Bench press', 'weight'], ['Deadlift', 'weight'], ['Shoulder press', 'weight'], ['Plank', 'time'], ['Wall sit', 'time']];
  var sel = 'Push-ups', pend = null;
  function save() { u.put(KEY, F); }
  function kind(name) { for (var i = 0; i < EX.length; i++) if (EX[i][0] === name) return EX[i][1]; return 'reps'; }
  function score(s) { return s.sec ? s.sec : s.kg ? s.kg * (s.reps || 1) : s.reps || 0; }

  V.fit = {
    addSet: function (ex, reps, kg, sec, src) {
      var today = iso(new Date()), first = !F.sets.some(function (s) { return s.day === today; });
      F.sets.push({ id: 's' + u.uid(), day: today, ex: ex, reps: reps || 0, kg: kg || 0, sec: sec || 0, src: src || 'manual' });
      F.sets = F.sets.slice(-800); save();
      if (first) V.emit('workout.log', { ref: today });
    }
  };

  function best(ex) { var b = null; F.sets.forEach(function (s) { if (s.ex === ex && (!b || score(s) > score(b))) b = s; }); return b; }
  function fmtSet(s) {
    if (s.sec) return s.sec + ' sec';
    return (s.reps ? s.reps + ' reps' : '') + (s.kg ? (s.reps ? ' at ' : '') + s.kg + ' kg' : '');
  }
  function render() {
    var today = iso(new Date()), t = new Date(), k = kind(sel);
    var todays = F.sets.filter(function (s) { return s.day === today; });
    var days = {}; F.sets.forEach(function (s) { days[s.day] = 1; });
    var week = 0, bars = '', letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (var i = 6; i >= 0; i--) {
      var d = addDays(t, -i), key = iso(d), n = F.sets.filter(function (s) { return s.day === key; }).length;
      if (n) week++;
      bars += '<div><b style="height:' + Math.max(3, Math.min(84, n * 12)) + 'px" title="' + plural(n, 'set') + '"></b><span>' + letters[d.getDay()] + '</span></div>';
    }
    var rows = todays.slice().reverse().map(function (s) {
      var p = pend === s.id;
      return '<li class="card row"><div class="txt"><div class="nm">' + esc(s.ex) + '</div><div class="sub">' + esc(fmtSet(s)) + (s.src === 'camera' ? ' · counted by camera' : '') + '</div></div><button class="icon-btn' + (p ? ' warn' : '') + '" data-act="mv-del" data-id="' + s.id + '" aria-label="Delete set">' + (p ? 'Delete?' : ic('trash')) + '</button></li>';
    }).join('');
    var b = best(sel);
    $('v-move').innerHTML =
      bar(u.BACK_TOOLS, 'Workout log') +
      '<div class="metrics"><div class="card pad"><div class="eyebrow">This week</div><div class="big">' + plural(week, 'day') + '</div></div><div class="card pad"><div class="eyebrow">Today</div><div class="big">' + plural(todays.length, 'set') + '</div></div></div>' +
      '<div class="card pad"><div class="bars" role="img" aria-label="Sets in the last 7 days">' + bars + '</div></div>' +
      '<div class="card pad"><div class="eyebrow">Pick an exercise</div><div class="chips" style="margin-top:10px">' + EX.map(function (e) { return '<button class="tag' + (sel === e[0] ? ' on' : '') + '" data-act="mv-ex" data-id="' + esc(e[0]) + '" aria-pressed="' + (sel === e[0]) + '">' + esc(e[0]) + '</button>'; }).join('') + '</div>' +
      (b ? '<p class="note" style="margin-top:10px">Your best: ' + esc(fmtSet(b)) + '</p>' : '') + '</div>' +
      '<form class="stack" id="mvForm" novalidate style="gap:8px"><div class="form">' +
      (k === 'time' ? '<input class="field" id="mvSec" type="number" inputmode="numeric" min="1" placeholder="Seconds" aria-label="Seconds" autocomplete="off">'
        : '<input class="field" id="mvReps" type="number" inputmode="numeric" min="1" placeholder="Reps" aria-label="Reps" autocomplete="off">' + (k === 'weight' ? '<input class="field" id="mvKg" type="number" inputmode="decimal" min="0" placeholder="Weight kg" aria-label="Weight in kilograms" autocomplete="off">' : '')) +
      '<button class="add" type="submit">Add set</button></div><div class="err" id="mvErr" hidden>Type a number first.</div></form>' +
      (rows ? '<ul class="list">' + rows + '</ul>' : '<p class="note" style="text-align:center">No sets yet today.</p>');
  }
  V.registerTool('move', render);
  V.registerSearch(function (q) { return EX.filter(function (e) { return e[0].toLowerCase().indexOf(q) !== -1; }).map(function (e) { return { icon: 'activity', title: e[0], sub: 'Exercise', to: 'move' }; }).slice(0, 4); });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a === 'mv-ex') { sel = id; render(); }
    else if (a === 'mv-del') {
      if (pend === id) { F.sets = F.sets.filter(function (s) { return s.id !== id; }); pend = null; save(); }
      else { pend = id; setTimeout(function () { if (pend === id) { pend = null; if (V.view() === 'move') render(); } }, 3000); }
      render();
    }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'mvForm') return;
    e.preventDefault();
    var k = kind(sel), r = $('mvReps'), kg = $('mvKg'), sc = $('mvSec');
    var reps = r ? parseInt(r.value, 10) : 0, w = kg ? parseFloat(kg.value) || 0 : 0, sec = sc ? parseInt(sc.value, 10) : 0;
    if ((k === 'time' && !(sec > 0)) || (k !== 'time' && !(reps > 0))) { $('mvErr').hidden = false; return; }
    V.fit.addSet(sel, reps, w, sec, 'manual'); render();
  });
  document.addEventListener('input', function (e) { if (/^mv(Reps|Kg|Sec)$/.test(e.target.id)) $('mvErr').hidden = true; });
})();
