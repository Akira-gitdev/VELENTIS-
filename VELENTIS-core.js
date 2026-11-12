/* VELENTIS Core: shared helpers, events, player profile, XP, attributes, quests, achievements, backup.
   Every tool talks to the Core by sending events (Velentis.emit). The Core decides what XP they earn.
   Nothing here asks an AI. All rules are plain and the same for everyone. */
(function () {
  'use strict';
  var V = window.Velentis = window.Velentis || {};
  var u = V.u = {};

  /* ---------- small helpers ---------- */
  u.$ = function (id) { return document.getElementById(id); };
  u.esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
  };
  u.ic = function (n) { return '<svg class="i" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; };
  u.iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  u.addDays = function (d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; };
  u.parse = function (s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  u.plural = function (n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); };
  u.uid = function () { return Date.now().toString(36) + Math.floor(Math.random() * 46656).toString(36); };
  u.niceDate = function (s) { return u.parse(s).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); };
  u.get = function (key, fb) {
    try { var r = localStorage.getItem(key); if (r) { var o = JSON.parse(r); if (o !== null && o !== undefined) return o; } } catch (e) {}
    return fb;
  };
  u.put = function (key, v) { try { localStorage.setItem(key, JSON.stringify(v)); return true; } catch (e) { return false; } };
  u.bar = function (attrs, title, extra) {
    return '<div class="topbar"><button class="icon-btn" ' + attrs + ' aria-label="Back">' + u.ic('back') + '</button><h1>' + u.esc(title) + '</h1>' + (extra || '') + '</div>';
  };
  u.BACK_TOOLS = 'data-act="go" data-to="tools"';

  /* ---------- events ---------- */
  var handlers = {};
  V.on = function (t, fn) { (handlers[t] = handlers[t] || []).push(fn); };
  V.emit = function (t, d) {
    (handlers[t] || []).slice().forEach(function (fn) { try { fn(d || {}); } catch (e) { if (window.console) console.error(e); } });
  };

  /* ---------- toast ---------- */
  var toastTimer = 0;
  V.toast = function (msg) {
    var el = u.$('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast card'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = msg; el.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2600);
  };

  /* ---------- player state ---------- */
  var KEY = 'velentis.core.v1';
  var ATTRS = [
    ['strength', 'Strength', 'Grows with workouts and rep counting'],
    ['endurance', 'Endurance', 'Grows with walking and running'],
    ['knowledge', 'Knowledge', 'Flashcards, notes and learning'],
    ['discipline', 'Discipline', 'Habits, plans, focus and check-ins'],
    ['practical', 'Practical Skills', 'Cooking and money skills'],
    ['communication', 'Communication', 'Grows with language practice and chatting']
  ];

  function fresh() {
    var xp = {}; ATTRS.forEach(function (a) { xp[a[0]] = 0; });
    return { v: 1, name: '', created: u.iso(new Date()), xp: xp, total: 0, ledger: [], cnt: {}, tot: {}, ach: {}, once: {}, seen: { d: '', keys: {} }, best: { streak: 0 } };
  }
  var C = u.get(KEY, null);
  if (!C || C.v !== 1 || !C.xp) C = fresh();
  (function fill() {
    var f = fresh();
    Object.keys(f).forEach(function (k) { if (C[k] === undefined) C[k] = f[k]; });
    ATTRS.forEach(function (a) { if (typeof C.xp[a[0]] !== 'number') C.xp[a[0]] = 0; });
  })();
  function save() { u.put(KEY, C); }
  function today() { return u.iso(new Date()); }

  /* ---------- levels ---------- */
  function thr(L) { return 50 * (L - 1) * L; }               // total XP needed to reach level L
  function levelInfo(xp) {
    var L = Math.max(1, Math.floor((1 + Math.sqrt(1 + xp / 12.5)) / 2));
    var base = thr(L), next = thr(L + 1);
    return { level: L, into: xp - base, need: next - base, pct: Math.round((xp - base) / (next - base) * 100) };
  }
  function attrLevel(xp) {
    var L = Math.floor(Math.sqrt(xp / 25)) + 1, a = 25 * (L - 1) * (L - 1), b = 25 * L * L;
    return { level: L, pct: Math.round((xp - a) / (b - a) * 100) };
  }

  /* ---------- the rules: what each kind of activity is worth ---------- */
  var RULES = {
    'habit.done': { attr: 'discipline', xp: 10, cap: 60, label: 'Completed a habit' },
    'cards.study': { attr: 'knowledge', xp: 2, cap: 40, label: 'Studied a flashcard' },
    'spend.add': { attr: 'practical', xp: 5, cap: 15, label: 'Logged an expense' },
    'chef.cook': { attr: 'practical', xp: 15, cap: 30, label: 'Cooked a recipe' },
    'note.add': { attr: 'knowledge', xp: 4, cap: 12, label: 'Wrote a note' },
    'plan.done': { attr: 'discipline', xp: 6, cap: 48, label: 'Finished a planned task' },
    'focus.done': { attr: 'discipline', xp: 2, cap: 40, label: 'Focused for 5 minutes' },
    'mood.log': { attr: 'discipline', xp: 5, cap: 5, label: 'Checked in with your mood' },
    'ai.chat': { attr: 'communication', xp: 2, cap: 10, label: 'Chatted with Vel' },
    'lang.turn': { attr: 'communication', xp: 3, cap: 30, label: 'Practiced a language' },
    'story.turn': { attr: 'knowledge', xp: 2, cap: 20, label: 'Played the story' },
    'quiz.done': { attr: 'knowledge', xp: 3, cap: 45, label: 'Got a quiz answer right' },
    'facts.guess': { attr: 'knowledge', xp: 1, cap: 10, label: 'Played myth or fact' },
    'lib.read': { attr: 'knowledge', xp: 3, cap: 15, label: 'Read a library article' },
    'gent.lesson': { attr: 'communication', xp: 10, cap: 20, label: 'Finished a Gentleman lesson' },
    'skills.lesson': { attr: 'practical', xp: 10, cap: 20, label: 'Finished a Life Skills lesson' },
    'workout.log': { attr: 'strength', xp: 10, cap: 20, label: 'Logged a workout' },
    'reps.done': { attr: 'strength', xp: 1, cap: 30, label: 'Counted 5 reps' },
    'run.done': { attr: 'endurance', xp: 4, cap: 48, label: 'Covered half a kilometer' },
    'write.turn': { attr: 'communication', xp: 3, cap: 15, label: 'Wrote with the helper' },
    'watch.done': { attr: 'knowledge', xp: 3, cap: 9, label: 'Finished something on your watchlist' },
    'voice.memo': { attr: 'discipline', xp: 3, cap: 9, label: 'Recorded a voice memo' }
  };
  var TOOL_FOR = { 'write.turn': 'write', 'watch.done': 'watch', 'voice.memo': 'voice', 'habit.done': 'habits', 'cards.study': 'cards', 'spend.add': 'spend', 'chef.cook': 'chef', 'note.add': 'notes', 'plan.done': 'plan', 'focus.done': 'focus', 'mood.log': 'mood', 'ai.chat': 'ai', 'lang.turn': 'lang', 'story.turn': 'story', 'quiz.done': 'quiz', 'facts.guess': 'facts', 'lib.read': 'lib', 'gent.lesson': 'gent', 'skills.lesson': 'skills', 'workout.log': 'move', 'reps.done': 'reps', 'run.done': 'run' };

  function seenToday(d) { if (C.seen.d !== d) C.seen = { d: d, keys: {} }; return C.seen.keys; }
  function dayXp(type, d) { return C.ledger.reduce(function (a, e) { return e.d === d && e.s === type ? a + e.xp : a; }, 0); }
  function count(type, d) { return (C.cnt[d] && C.cnt[d][type]) || 0; }
  function bump(type, d, n) {
    C.cnt[d] = C.cnt[d] || {}; C.cnt[d][type] = (C.cnt[d][type] || 0) + n;
    C.tot[type] = (C.tot[type] || 0) + n;
  }
  function prune() {
    var cut = u.iso(u.addDays(new Date(), -45));
    Object.keys(C.cnt).forEach(function (d) { if (d < cut) delete C.cnt[d]; });
    if (C.ledger.length > 600) C.ledger = C.ledger.slice(-600);
    var ks = Object.keys(C.once); if (ks.length > 400) ks.slice(0, ks.length - 300).forEach(function (k) { delete C.once[k]; });
  }
  function credit(type, attr, xp, label, note) {
    var before = levelInfo(C.total).level;
    C.xp[attr] += xp; C.total += xp;
    C.ledger.push({ t: Date.now(), d: today(), s: type, a: attr, xp: xp, n: label });
    var after = levelInfo(C.total).level;
    return after > before ? after : 0;
  }
  function attrName(id) { return ATTRS.filter(function (a) { return a[0] === id; })[0][1]; }

  var pending = [];   // messages to show once everything is saved
  function grant(type, o) {
    var r = RULES[type]; if (!r) return;
    var d = today(), keys = seenToday(d), key = type + '|' + (o.ref == null ? '' : o.ref);
    if (keys[key]) return;                       // the same thing can only count once a day
    var units = o.units == null ? 1 : Math.floor(o.units);
    if (units <= 0) return;
    keys[key] = 1;
    bump(type, d, units);
    if (type === 'habit.done' && o.streak > C.best.streak) C.best.streak = o.streak;
    var xp = Math.min(r.xp * units, Math.max(0, r.cap - dayXp(type, d)));
    var up = 0;
    if (xp > 0) { up = credit(type, r.attr, xp, r.label); pending.push('+' + xp + ' XP · ' + attrName(r.attr)); }
    if (up) pending.push('Level up! You are level ' + up);
    afterChange();
  }
  function once(key, type, attr, xp, label) {
    if (C.once[key]) return false;
    C.once[key] = 1; C.tot[type] = (C.tot[type] || 0) + 1;
    var up = credit(type, attr, xp, label);
    pending.push('+' + xp + ' XP · ' + label);
    if (up) pending.push('Level up! You are level ' + up);
    return true;
  }

  /* ---------- daily quests: three a day, the same for everyone on the same date ---------- */
  var POOL = [
    { id: 'habits2', text: 'Check off 2 habits', type: 'habit.done', need: 2, bonus: 12, attr: 'discipline' },
    { id: 'cards10', text: 'Study 10 flashcards', type: 'cards.study', need: 10, bonus: 12, attr: 'knowledge' },
    { id: 'spend1', text: 'Log an expense', type: 'spend.add', need: 1, bonus: 8, attr: 'practical' },
    { id: 'note1', text: 'Write a note', type: 'note.add', need: 1, bonus: 8, attr: 'knowledge' },
    { id: 'plan2', text: 'Finish 2 planned tasks', type: 'plan.done', need: 2, bonus: 12, attr: 'discipline' },
    { id: 'focus1', text: 'Focus for 10 minutes', type: 'focus.done', need: 2, bonus: 12, attr: 'discipline' },
    { id: 'mood1', text: 'Check in with your mood', type: 'mood.log', need: 1, bonus: 8, attr: 'discipline' },
    { id: 'chat1', text: 'Talk with Vel', type: 'ai.chat', need: 2, bonus: 6, attr: 'communication' },
    { id: 'lang3', text: 'Practice a language 3 times', type: 'lang.turn', need: 3, bonus: 12, attr: 'communication' },
    { id: 'quiz5', text: 'Get 5 quiz answers right', type: 'quiz.done', need: 5, bonus: 12, attr: 'knowledge' },
    { id: 'facts3', text: 'Play 3 rounds of myth or fact', type: 'facts.guess', need: 3, bonus: 8, attr: 'knowledge' },
    { id: 'lib1', text: 'Read a library article', type: 'lib.read', need: 1, bonus: 8, attr: 'knowledge' },
    { id: 'gent1', text: 'Finish a Gentleman lesson', type: 'gent.lesson', need: 1, bonus: 14, attr: 'communication' },
    { id: 'skills1', text: 'Finish a Life Skills lesson', type: 'skills.lesson', need: 1, bonus: 14, attr: 'practical' },
    { id: 'move1', text: 'Log a workout', type: 'workout.log', need: 1, bonus: 12, attr: 'strength' },
    { id: 'reps20', text: 'Count 20 reps', type: 'reps.done', need: 4, bonus: 12, attr: 'strength' },
    { id: 'run1', text: 'Walk or run 1 km', type: 'run.done', need: 2, bonus: 14, attr: 'endurance' },
    { id: 'cook1', text: 'Cook something', type: 'chef.cook', need: 1, bonus: 12, attr: 'practical' }
  ];
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rng(seed) { return function () { seed = (seed + 0x6D2B79F5) | 0; var t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function questsFor(d) {
    var r = rng(hash('velentis' + d)), a = POOL.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a.slice(0, 3);
  }
  function quests() {
    var d = today();
    return questsFor(d).map(function (q) {
      var have = count(q.type, d);
      return { id: q.id, text: q.text, need: q.need, have: Math.min(have, q.need), done: have >= q.need, bonus: q.bonus, attr: q.attr, tool: TOOL_FOR[q.type] };
    });
  }
  function checkQuests() {
    var d = today();
    questsFor(d).forEach(function (q) {
      if (count(q.type, d) >= q.need) once('q|' + d + '|' + q.id, 'quest.done', q.attr, q.bonus, 'Quest: ' + q.text);
    });
  }

  /* ---------- weekly goal: be active on 5 different days ---------- */
  function weekStart(d) { var x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return u.iso(x); }
  function week() {
    var ws = u.parse(weekStart(new Date())), active = 0, days = [];
    for (var i = 0; i < 7; i++) {
      var k = u.iso(u.addDays(ws, i)), c = C.cnt[k], on = !!c && Object.keys(c).some(function (t) { return c[t] > 0; });
      if (on) active++; days.push(on);
    }
    return { active: active, goal: 5, days: days };
  }
  function checkWeek() {
    var w = week();
    if (w.active >= w.goal) once('w|' + weekStart(new Date()), 'week.done', 'discipline', 40, 'Weekly goal reached');
  }

  /* ---------- achievements (badges, no XP) ---------- */
  var ACH = [
    ['first', 'First step', 'Earn your first XP', function () { return C.total > 0; }],
    ['lvl3', 'Level 3', 'Reach level 3', function () { return levelInfo(C.total).level >= 3; }],
    ['lvl5', 'Level 5', 'Reach level 5', function () { return levelInfo(C.total).level >= 5; }],
    ['lvl10', 'Level 10', 'Reach level 10', function () { return levelInfo(C.total).level >= 10; }],
    ['xp500', '500 XP', 'Earn 500 XP in total', function () { return C.total >= 500; }],
    ['streak7', 'Week streak', 'Keep one habit going for 7 days', function () { return C.best.streak >= 7; }],
    ['quest10', 'Questing', 'Complete 10 daily quests', function () { return (C.tot['quest.done'] || 0) >= 10; }],
    ['focus60', 'Deep focus', 'Focus for 60 minutes in total', function () { return (C.tot['focus.done'] || 0) >= 12; }],
    ['notes10', 'Note keeper', 'Write 10 notes', function () { return (C.tot['note.add'] || 0) >= 10; }],
    ['spend20', 'Money aware', 'Log 20 expenses', function () { return (C.tot['spend.add'] || 0) >= 20; }],
    ['cards100', 'Card sharp', 'Study 100 flashcards', function () { return (C.tot['cards.study'] || 0) >= 100; }],
    ['cook5', 'Home cook', 'Cook 5 recipes', function () { return (C.tot['chef.cook'] || 0) >= 5; }],
    ['plan25', 'Plan keeper', 'Finish 25 planned tasks', function () { return (C.tot['plan.done'] || 0) >= 25; }],
    ['lang10', 'Word by word', 'Practice a language 10 times', function () { return (C.tot['lang.turn'] || 0) >= 10; }],
    ['story10', 'Storyteller', 'Play 10 story turns', function () { return (C.tot['story.turn'] || 0) >= 10; }],
    ['quiz50', 'Quiz whiz', 'Get 50 quiz answers right', function () { return (C.tot['quiz.done'] || 0) >= 50; }],
    ['facts20', 'Myth buster', 'Play 20 rounds of myth or fact', function () { return (C.tot['facts.guess'] || 0) >= 20; }],
    ['lib10', 'Bookworm', 'Read 10 library articles', function () { return (C.tot['lib.read'] || 0) >= 10; }],
    ['academy8', 'Lifelong learner', 'Finish 8 academy lessons', function () { return (C.tot['gent.lesson'] || 0) + (C.tot['skills.lesson'] || 0) >= 8; }],
    ['workout10', 'Regular', 'Log 10 workouts', function () { return (C.tot['workout.log'] || 0) >= 10; }],
    ['reps500', 'Rep machine', 'Count 500 reps with the camera', function () { return (C.tot['reps.done'] || 0) >= 100; }],
    ['run10', 'Ten kilometers', 'Cover 10 km in total', function () { return (C.tot['run.done'] || 0) >= 20; }],
    ['mood7', 'Self aware', 'Check in with your mood 7 times', function () { return (C.tot['mood.log'] || 0) >= 7; }]
  ];
  function checkAch() {
    ACH.forEach(function (a) {
      if (!C.ach[a[0]] && a[3]()) { C.ach[a[0]] = today(); pending.push('Badge unlocked: ' + a[1]); }
    });
  }
  function achievements() { return ACH.map(function (a) { return { id: a[0], name: a[1], text: a[2], on: !!C.ach[a[0]], date: C.ach[a[0]] || '' }; }); }

  function afterChange() {
    checkQuests(); checkWeek(); checkAch(); prune(); save();
    var msgs = pending.slice(); pending = [];
    if (msgs.length) V.toast(msgs.join('  ·  '));
    V.emit('core.changed', {});
  }

  /* ---------- a gentle suggestion for what to do next ---------- */
  function nextAction() {
    var qs = quests().filter(function (q) { return !q.done; }), w = week();
    var xpToday = C.ledger.reduce(function (a, e) { return e.d === today() ? a + e.xp : a; }, 0);
    if (w.active >= 6 && xpToday === 0) return { text: 'Take a rest day', why: 'You were active on ' + w.active + ' days this week. Rest also counts.', to: '' };
    if (qs.length) return { text: qs[0].text, why: 'It is one of today’s quests and gives +' + qs[0].bonus + ' XP.', to: qs[0].tool || '' };
    return { text: 'All quests done', why: 'Nice work. Anything more today is a bonus. Maybe review a flashcard deck.', to: 'cards' };
  }

  Object.keys(RULES).forEach(function (t) { V.on(t, function (d) { grant(t, d); }); });

  /* ---------- backup: everything the app saved on this phone ---------- */
  function allKeys() {
    var out = [];
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k && k.indexOf('velentis.') === 0 && k !== 'velentis.logo.theme' && k !== 'velentis.ai.v1' && k !== 'velentis.session' && k !== 'velentis.sync.v1') out.push(k); } } catch (e) {}
    return out;
  }
  function exportAll() {
    var data = {}; allKeys().forEach(function (k) { data[k] = localStorage.getItem(k); });
    return JSON.stringify({ app: 'velentis', version: 1, exported: new Date().toISOString(), data: data });
  }
  function importAll(text) {
    var o; try { o = JSON.parse(text); } catch (e) { return 'That is not a Velentis backup. Paste the whole text you copied.'; }
    if (!o || o.app !== 'velentis' || !o.data || typeof o.data !== 'object') return 'That is not a Velentis backup.';
    var n = 0;
    Object.keys(o.data).forEach(function (k) {
      if (k.indexOf('velentis.') === 0 && typeof o.data[k] === 'string') { try { localStorage.setItem(k, o.data[k]); n++; } catch (e) {} }
    });
    return n ? '' : 'The backup was empty.';
  }
  function eraseAll() { allKeys().concat(['velentis.session', 'velentis.sync.v1']).forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} }); }

  V.core = {
    ATTRS: ATTRS, RULES: RULES,
    state: function () { return C; },
    levelInfo: levelInfo, attrLevel: attrLevel,
    quests: quests, week: week, achievements: achievements, nextAction: nextAction,
    recent: function (n) { return C.ledger.slice(-n).reverse(); },
    setName: function (s) { C.name = String(s).trim().slice(0, 24); save(); },
    exportAll: exportAll, importAll: importAll, eraseAll: eraseAll
  };
})();
