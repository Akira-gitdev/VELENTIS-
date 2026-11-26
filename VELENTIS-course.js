/* VELENTIS Word course.
   A small offline language course, no AI and no key needed.
   Each language is a "pack" file (VELENTIS-course-ja.js and so on) with 100 verbs, 100 objects, 100 subjects, 100 helper words,
   a letters chart, short grammar lessons and practice sentences. This file is the engine that shows them. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, bar = u.bar;
  var KEY = 'velentis.course.v1';
  var INT = [1, 3, 7, 14, 30, 60];                 /* days until a word comes back, by level */
  var ALL = [['ja', 'Japanese'], ['de', 'German'], ['ko', 'Korean'], ['zh', 'Chinese'], ['es', 'Spanish'], ['fr', 'French'], ['ru', 'Russian'], ['ar', 'Arabic']];
  var SETS = [['verbs', 'Verbs', 'v'], ['objects', 'Objects', 'o'], ['subjects', 'Subjects', 's'], ['helpers', 'Helpers', 'h']];
  var PACKS = {};

  function load() {
    var S = u.get(KEY, null); if (!S || typeof S !== 'object') S = {};
    S.w = S.w && typeof S.w === 'object' ? S.w : {}; S.l = S.l && typeof S.l === 'object' ? S.l : {};
    S.days = S.days && typeof S.days === 'object' ? S.days : {}; S.read = S.read && typeof S.read === 'object' ? S.read : {};
    S.lang = S.lang || 'ja'; S.set = S.set || 'verbs'; S.sh = S.sh && typeof S.sh === 'object' ? S.sh : { r: 1, ro: 1, m: 1 };
    return S;
  }
  var S = load();
  function save() { try { var d = Object.keys(S.days).sort(); if (d.length > 90) d.slice(0, d.length - 90).forEach(function (k) { delete S.days[k]; }); } catch (e) {} u.put(KEY, S); }
  function today() { return u.iso(new Date()); }
  function addDays(n) { var d = new Date(); d.setDate(d.getDate() + n); return u.iso(d); }
  function pack() { return PACKS[S.lang] || PACKS[Object.keys(PACKS)[0]] || null; }
  function words(set) { var P = pack(); return P && P.sets[set] ? P.sets[set] : []; }
  function wid(set, i) { return S.lang + '.' + set.charAt(0) + i; }
  function lvl(id) { var x = S.w[id]; return x ? x.b + 1 : 0; }
  function mark(n) { S.days[today()] = (S.days[today()] | 0) + (n || 1); }
  function streak() { var n = 0, d = new Date(); if (!S.days[u.iso(d)]) d.setDate(d.getDate() - 1); while (S.days[u.iso(d)] > 0) { n++; d.setDate(d.getDate() - 1); } return n; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function grade(id, ok) {
    var x = S.w[id];
    if (!x) x = S.w[id] = { b: 0, d: addDays(INT[0]) };
    else if (ok) { x.b = Math.min(5, x.b + 1); x.d = addDays(INT[x.b]); } else { x.b = Math.max(0, x.b - 1); x.d = today(); }
    if (!ok && !x.d) x.d = today();
    mark(1); V.emit('course.learn', { ref: id + ':' + today() });
  }
  function dueList() {
    var t = today(), out = [];
    SETS.forEach(function (s) { words(s[0]).forEach(function (w, i) { var x = S.w[wid(s[0], i)]; if (x && x.d <= t) out.push({ set: s[0], i: i }); }); });
    return out;
  }
  function learned(set) { var n = 0; words(set).forEach(function (w, i) { if (S.w[wid(set, i)]) n++; }); return n; }

  /* ---------- speaking ---------- */
  function speak(text) {
    var P = pack(); if (!P) return;
    try {
      var ss = window.speechSynthesis; if (!ss) { V.toast('This phone cannot speak aloud.'); return; }
      ss.cancel();
      var m = new SpeechSynthesisUtterance(text); m.lang = P.tts; m.rate = 0.8;
      var vs = ss.getVoices() || [], pre = P.tts.slice(0, 2), v = vs.filter(function (x) { return x.lang === P.tts; })[0] || vs.filter(function (x) { return (x.lang || '').slice(0, 2) === pre; })[0];
      if (v) m.voice = v; else if (vs.length) { V.toast('No ' + P.name + ' voice on this phone. Add one in your phone’s text-to-speech settings.'); return; }
      ss.speak(m);
    } catch (e) { V.toast('Could not speak that.'); }
  }

  /* ---------- small drawing helpers ---------- */
  (function () {
    var st = document.createElement('style');
    st.textContent = '.cs-row{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}' +
      '.cs-b{display:inline-flex;flex-direction:column;align-items:center;text-align:center;padding:6px 9px;border-radius:12px;border:1px solid var(--card-line);min-width:38px}' +
      '.cs-w{font-size:22px;line-height:1.2}.cs-r{font-size:11px;font-style:italic;opacity:.75}.cs-g{font-size:11px;opacity:.7;margin-top:2px}' +
      '.cs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(58px,1fr));gap:6px}' +
      '.cs-cell{border:1px solid var(--card-line);border-radius:10px;padding:8px 2px;font-size:15px;line-height:1.2;min-height:42px;background:transparent;color:inherit;overflow:hidden;word-break:break-all}' +
      '.cs-cell.sel{outline:2px solid var(--accent)}' +
      '.cs-lg{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}' +
      '.cs-lg .cs-cell{font-size:22px;padding:8px 0}' +
      '.cs-pick{padding:8px 11px;border-radius:12px;border:1px solid var(--card-line);background:transparent;color:inherit;font-size:20px}' +
      '.cs-sel{width:100%;margin-top:4px}' +
      '.cs-tabs{display:flex;gap:6px;overflow-x:auto;white-space:nowrap;scrollbar-width:none;margin:10px 0;padding-bottom:2px}.cs-tabs::-webkit-scrollbar{display:none}.cs-tabs .tag{flex:none}' +
      '.cs-ring{position:relative;width:58px;height:58px;display:grid;place-items:center;flex:none;font-weight:700;font-size:16px}.cs-ring>i{position:absolute;inset:0;border-radius:50%;-webkit-mask:radial-gradient(circle,transparent 22px,#000 23px);mask:radial-gradient(circle,transparent 22px,#000 23px)}' +
      '.cs-top{display:flex;gap:12px;align-items:center}.cs-set{display:flex;gap:10px;align-items:center;width:100%;text-align:left}.cs-set .txt{flex:1;min-width:0}' +
      '.cs-dots{display:flex;gap:5px;margin-bottom:10px}.cs-dots i{flex:1;height:5px;border-radius:3px;background:var(--card-line)}.cs-dots i.on{background:var(--accent)}' +
      '.cs-leg{display:flex;align-items:center;gap:8px;font-size:11px;opacity:.8;margin:2px 0 8px}.cs-leg i{flex:1;height:8px;border-radius:4px;background:linear-gradient(90deg,hsla(210,58%,53%,.35),hsla(174,66%,49%,.55),hsla(66,74%,45%,.75),hsla(30,82%,41%,.9))}' +
      '.cs-big{font-size:36px;line-height:1.6;text-align:center}.cs-pop{animation:csPop .25s ease}@keyframes csPop{from{transform:scale(.96);opacity:.4}to{transform:none;opacity:1}}';
    document.head.appendChild(st);
  })();
  function heat(l) { return l ? 'background:hsla(' + Math.round(210 - (l - 1) * 36) + ',' + (50 + l * 8) + '%,' + (55 - l * 2) + '%,' + (0.22 + l * 0.1) + ')' : 'background:rgba(128,128,128,.10)'; }
  function blk(p) {
    return '<span class="cs-b"><span class="cs-w">' + esc(p[0]) + '</span>' + (S.sh.r && !noR() && p[1] && p[1] !== p[0] ? '<span class="cs-r">' + esc(p[1]) + '</span>' : '') +
      (S.sh.m && p[2] ? '<span class="cs-g">' + esc(p[2]) + '</span>' : '') + '</span>';
  }
  function blocks(parts) { return '<div class="cs-row"' + rtl() + '>' + parts.map(blk).join('') + '</div>'; }
  function big(w) {
    var a = esc(w.w);
    if (S.sh.r && !noR() && w.r && w.r !== w.w) a = '<ruby>' + a + '<rt>' + esc(w.r) + '</rt></ruby>';
    return '<div class="cs-big"' + rtl() + '>' + a + '</div>' + (S.sh.ro && !noR() && w.ro ? '<div class="sub" style="font-style:italic;text-align:center">' + esc(w.ro) + '</div>' : '');
  }
  function noR() { var P = pack(); return !!(P && P.noRead); }
  function rtl() { var P = pack(); return P && P.rtl ? ' dir="rtl"' : ''; }
  function lvlName(l) { return ['New', 'Seen', 'Warm', 'Good', 'Strong', 'Hot', 'Mastered'][l] || ''; }

  /* ---------- state ---------- */
  var tab = 'learn', sel = null, sess = null, lesson = null, drill = null, sub = 'arrange', mk = { s: 0, o: 0, v: 0, f: 0 }, lq = null, lsel = null, drillN = 0;

  /* ---------- learning sessions ---------- */
  function startNew(set) {
    var ws = words(set), ids = [];
    for (var i = 0; i < ws.length && ids.length < 5; i++) if (!S.w[wid(set, i)]) ids.push({ set: set, i: i });
    if (!ids.length) { V.toast('You have seen every ' + set + ' word. Use Review.'); return; }
    sess = { kind: 'new', list: ids, n: 0, phase: 'intro', show: false, ok: 0, qs: null, qi: 0, ans: null };
  }
  function startOne(set, i) { sess = { kind: 'new', list: [{ set: set, i: i }], n: 0, phase: 'intro', show: false, ok: 0, qs: null, qi: 0, ans: null }; tab = 'learn'; }
  function startRev() {
    var d = dueList(); if (!d.length) return;
    sess = { kind: 'rev', list: shuffle(d).slice(0, 10), n: 0, phase: 'flash', show: false, ok: 0, qs: null, qi: 0, ans: null };
  }
  function quizFor(sset) {
    return sset.list.map(function (it) {
      var ws = words(it.set), w = ws[it.i];
      var others = shuffle(ws.filter(function (x) { return x.en !== w.en; })).slice(0, 3).map(function (x) { return x.en; });
      return { it: it, w: w, opts: shuffle(others.concat([w.en])) };
    });
  }
  function cur() { var it = sess.list[sess.n]; return it ? { it: it, w: words(it.set)[it.i] } : null; }

  function sessionView() {
    var P = pack(), s = sess, html = '';
    if (s.phase === 'done') {
      var pct = Math.round(s.ok / s.list.length * 100);
      return '<div class="card hero cs-pop"><span class="chip">' + ic('trophy') + '</span><h2>' + (s.kind === 'new' ? 'Nice. ' + s.list.length + ' new words' : 'Review done') + '</h2><p>' + s.ok + ' of ' + s.list.length + ' right (' + pct + '%). ' + (pct === 100 ? 'Perfect round.' : 'Words you miss come back sooner.') + '</p></div>' +
        '<button class="btn2 main" data-act="' + (s.kind === 'new' ? 'cs-again' : 'cs-home') + '">' + (s.kind === 'new' ? 'Learn 5 more' : 'Back to the course') + '</button><button class="link" data-act="cs-home">Back to the course</button>';
    }
    if (s.phase === 'intro') {
      var c = cur(), w = c.w;
      html = '<div class="card pad cs-pop" style="text-align:center">' + dots(s.n + 1, s.list.length) + '<div class="eyebrow">New word ' + (s.n + 1) + ' of ' + s.list.length + '</div>' + big(w) +
        (S.sh.m ? '<div style="font-size:20px;margin:6px 0 10px"><b>' + esc(w.en) + '</b></div>' : '') +
        '<button class="btn2" data-act="cs-say" data-id="' + esc(w.w) + '">' + ic('volume') + ' Hear it</button>' + demo(c.it.set, w) +
        '<div style="margin-top:14px"><button class="btn2 main" data-act="cs-intro-next">' + (s.n + 1 < s.list.length ? 'Next word' : 'Quick check') + '</button></div></div>';
      return html + '<button class="link" data-act="cs-home">Stop</button>';
    }
    if (s.phase === 'quiz') {
      var q = s.qs[s.qi];
      html = '<div class="card pad cs-pop">' + dots(s.qi + 1, s.qs.length) + '<div class="eyebrow">Check ' + (s.qi + 1) + ' of ' + s.qs.length + '</div><div style="text-align:center">' + big(q.w) + '</div>' +
        '<div style="display:flex;flex-direction:column;gap:8px;margin-top:12px">' + q.opts.map(function (o, k) {
          var st = s.ans == null ? '' : o === q.w.en ? ' main' : (s.ans === k ? ' warn' : '');
          return '<button class="btn2' + st + '" data-act="cs-pick" data-id="' + k + '"' + (s.ans != null ? ' disabled' : '') + '>' + esc(o) + '</button>';
        }).join('') + '</div>' + (s.ans != null ? '<button class="btn2 main" style="margin-top:12px" data-act="cs-qnext">' + (s.qi + 1 < s.qs.length ? 'Next' : 'Finish') + '</button>' : '') + '</div><button class="link" data-act="cs-home">Stop</button>';
      return html;
    }
    var f = cur(), fw = f.w;   /* flash review */
    return '<div class="card pad cs-pop" style="text-align:center">' + dots(s.n + 1, s.list.length) + '<div class="eyebrow">Review ' + (s.n + 1) + ' of ' + s.list.length + '</div>' + big(fw) +
      '<button class="btn2" data-act="cs-say" data-id="' + esc(fw.w) + '">' + ic('volume') + ' Hear it</button>' +
      (s.show ? '<div style="font-size:20px;margin:14px 0"><b>' + esc(fw.en) + '</b></div><div class="chips" style="justify-content:center"><button class="btn2" data-act="cs-miss">Missed it</button><button class="btn2 main" data-act="cs-got">Got it</button></div>'
        : '<div style="margin-top:14px"><button class="btn2 main" data-act="cs-reveal">Show meaning</button></div>') + '</div><button class="link" data-act="cs-home">Stop</button>';
  }
  function dots(n, t) { var h = '<div class="cs-dots">'; for (var i = 1; i <= t; i++) h += '<i' + (i <= n ? ' class="on"' : '') + '></i>'; return h + '</div>'; }
  function demo(set, w) {
    var P = pack(), d = P && P.demo ? P.demo(set, w) : null; if (!d || !d.parts) return '';
    return '<div style="margin-top:14px;text-align:left"><div class="eyebrow" style="margin-bottom:6px">In a sentence</div>' + blocks(d.parts) +
      (d.en ? '<div class="sub" style="margin-top:6px">' + esc(d.en) + '</div>' : '') + '</div>';
  }

  /* ---------- tabs ---------- */
  function langChips() {
    var soon = ALL.filter(function (l) { return !PACKS[l[0]]; }).map(function (l) { return l[1]; });
    return '<div class="cs-tabs" style="margin:6px 0">' + ALL.filter(function (l) { return PACKS[l[0]]; }).map(function (l) {
      return '<button class="tag' + (S.lang === l[0] ? ' on' : '') + '" data-act="cs-lang" data-id="' + l[0] + '" aria-pressed="' + (S.lang === l[0]) + '">' + l[1] + '</button>';
    }).join('') + '</div>' + (soon.length ? '<p class="note" style="margin:0 0 4px">Coming next: ' + soon.join(', ') + '.</p>' : '');
  }
  function lab(k) { var P = pack(), L = (P && P.labels) || {}; return L[k] === undefined ? (k === 'r' ? 'Reading' : 'Letters') : L[k]; }
  function toggles() {
    var P = pack(), list = [];
    if (!P.noRead) { if (lab('r') !== null) list.push(['r', lab('r')]); if (lab('ro') !== null) list.push(['ro', lab('ro')]); }
    list.push(['m', 'Meaning']);
    return '<div class="cs-tabs" style="margin:6px 0"><span class="sub" style="align-self:center">Show:</span>' + list.map(function (x) {
      return '<button class="tag' + (S.sh[x[0]] ? ' on' : '') + '" data-act="cs-sh" data-id="' + x[0] + '" aria-pressed="' + (!!S.sh[x[0]]) + '">' + esc(x[1]) + '</button>';
    }).join('') + '</div>';
  }
  function setChips() {
    return '<div class="chips" style="margin:6px 0">' + SETS.map(function (s) { return '<button class="tag' + (S.set === s[0] ? ' on' : '') + '" data-act="cs-set" data-id="' + s[0] + '" aria-pressed="' + (S.set === s[0]) + '">' + s[1] + '</button>'; }).join('') + '</div>';
  }
  function learnTab() {
    var P = pack(), d = dueList(), t = today(), done = S.days[t] | 0, sk = streak(), h = '', tot = 0, got = 0, goal = 10, pct = Math.min(100, Math.round(done / goal * 100));
    SETS.forEach(function (x) { tot += words(x[0]).length; got += learned(x[0]); });
    h += '<div class="card pad"><div class="cs-top"><div class="cs-ring"><i style="background:conic-gradient(var(--accent) ' + pct + '%,var(--card-line) 0)"></i><span>' + Math.min(done, goal) + '</span></div><div style="flex:1;min-width:0"><div style="font-size:20px;font-weight:700">' + esc(P.name) + '</div><div class="sub">' + got + ' of ' + tot + ' words · ' + (sk ? sk + ' day streak' : 'start a streak today') + '</div><div class="sub">Daily goal: ' + goal + ' practices (' + done + ' so far)</div></div></div></div>';
    h += d.length ? '<button class="btn2 main" data-act="cs-rev">Review ' + d.length + ' word' + (d.length === 1 ? '' : 's') + ' due</button>' : '<div class="note">Nothing to review right now. Learn some new words below.</div>';
    h += '<div class="eyebrow" style="margin:14px 0 6px">Learn new words</div><ul class="list">' + SETS.map(function (x) {
      var n = learned(x[0]), tt = words(x[0]).length || 100;
      return '<li><button class="card row cs-set" data-act="cs-newset" data-id="' + x[0] + '"><span class="txt"><div class="nm">' + x[1] + '</div><div class="sub">' + n + ' of ' + tt + ' learned</div><div style="height:5px;border-radius:3px;background:var(--card-line);margin-top:6px;overflow:hidden"><div style="width:' + Math.round(n / tt * 100) + '%;height:100%;background:var(--accent)"></div></div></span><span class="pill">' + (n >= tt ? 'Done' : 'Learn 5') + '</span></button></li>';
    }).join('') + '</ul><p class="note">Words come in order, most used first. You see each one, then a quick check.</p>';
    h += '<button class="btn2" data-act="go" data-to="lang">Chat with Vel in ' + esc(P.name) + '</button>';
    return h;
  }
  function chartTab() {
    var ws = words(S.set), h = setChips() + toggles();
    var gotN = learned(S.set); h += '<div class="cs-leg"><span>New</span><i></i><span>Hot</span></div><div class="sub" style="margin:0 0 8px">' + gotN + ' of ' + (ws.length || 100) + ' seen. Most used words come first. Tap one to open it.</div><div class="cs-grid"' + rtl() + '>';
    ws.forEach(function (w, i) { var l = lvl(wid(S.set, i)); h += '<button class="cs-cell' + (sel === i ? ' sel' : '') + '" style="' + heat(l) + '" data-act="cs-cell" data-id="' + i + '" aria-label="' + esc(w.en) + '">' + esc(w.w) + '</button>'; });
    h += '</div>';
    if (sel != null && ws[sel]) {
      var w = ws[sel], l = lvl(wid(S.set, sel));
      h += '<div class="card pad" style="margin-top:12px;text-align:center"><div class="eyebrow">Word ' + (sel + 1) + ' · ' + lvlName(l) + '</div>' + big(w) + (S.sh.m ? '<div style="font-size:20px;margin:6px 0 10px"><b>' + esc(w.en) + '</b></div>' : '') +
        '<div class="chips" style="justify-content:center"><button class="btn2" data-act="cs-say" data-id="' + esc(w.w) + '">' + ic('volume') + ' Hear it</button>' + (l ? '' : '<button class="btn2 main" data-act="cs-one" data-id="' + sel + '">Learn it now</button>') + '</div>' + demo(S.set, w) + '</div>';
    }
    return h;
  }
  function lettersTab() {
    var P = pack(); if (!P.letters || !P.letters.length) return '<div class="card hero"><span class="chip">' + ic('book') + '</span><h2>' + esc(P.name) + ' uses letters you know</h2><p>No new alphabet to learn here. Go straight to the words.</p></div>';
    if (lq) return lettersQuiz();
    var h = '';
    P.letters.forEach(function (g, gi) {
      h += '<div class="eyebrow" style="margin:12px 0 6px">' + esc(g.name) + '</div><div class="cs-lg">' + g.rows.map(function (row) {
        return row.map(function (c) { return c ? '<button class="cs-cell" style="' + heat(S.l[c[0]] || 0) + '" data-act="cs-let" data-id="' + esc(c[0]) + '">' + esc(c[0]) + '</button>' : '<span></span>'; }).join('');
      }).join('') + '</div><button class="btn2" style="margin-top:8px" data-act="cs-lq" data-id="' + gi + '">Quiz me on ' + esc(g.name) + '</button>';
    });
    if (lsel) h = '<div class="card pad" style="text-align:center"><div style="font-size:56px;line-height:1.2">' + esc(lsel[0]) + '</div><div style="font-size:20px"><b>' + esc(lsel[1]) + '</b></div><button class="btn2" style="margin-top:8px" data-act="cs-say" data-id="' + esc(lsel[0]) + '">' + ic('volume') + ' Hear it</button></div>' + h;
    return h;
  }
  function lettersQuiz() {
    if (lq.done) return '<div class="card hero"><span class="chip">' + ic('trophy') + '</span><h2>' + lq.ok + ' of ' + lq.qs.length + '</h2><p>Letters you miss stay cold on the chart until you get them.</p></div><button class="btn2 main" data-act="cs-lq" data-id="' + lq.gi + '">Another round</button><button class="link" data-act="cs-lqstop">Back to letters</button>';
    var q = lq.qs[lq.i];
    return '<div class="card pad"><div class="eyebrow">Letter ' + (lq.i + 1) + ' of ' + lq.qs.length + '</div><div style="font-size:64px;text-align:center;margin:8px 0">' + esc(q.c[0]) + '</div><div style="text-align:center"><button class="btn2" data-act="cs-say" data-id="' + esc(q.c[0]) + '">' + ic('volume') + ' Hear it</button></div>' +
      '<div class="chips" style="margin-top:12px;justify-content:center">' + q.opts.map(function (o, k) { var st = lq.ans == null ? '' : o === q.c[1] ? ' main' : (lq.ans === k ? ' warn' : ''); return '<button class="btn2' + st + '" data-act="cs-lpick" data-id="' + k + '"' + (lq.ans != null ? ' disabled' : '') + '>' + esc(o) + '</button>'; }).join('') + '</div>' +
      (lq.ans != null ? '<button class="btn2 main" style="margin-top:12px" data-act="cs-lnext">' + (lq.i + 1 < lq.qs.length ? 'Next' : 'Finish') + '</button>' : '') + '</div><button class="link" data-act="cs-lqstop">Stop</button>';
  }
  function grammarTab() {
    var P = pack(), L = P.lessons || [];
    if (lesson != null && L[lesson]) {
      var l = L[lesson], h = '<button class="link" data-act="cs-lback">All lessons</button><div class="card pad"><div class="eyebrow">Lesson ' + (lesson + 1) + ' of ' + L.length + '</div><h3 style="margin:6px 0">' + esc(l.t) + '</h3>' +
        (l.intro || []).map(function (p) { return '<p style="margin:8px 0">' + esc(p) + '</p>'; }).join('') +
        (l.points && l.points.length ? '<ul style="margin:8px 0 0 18px;padding:0">' + l.points.map(function (p) { return '<li style="margin:5px 0">' + esc(p) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
      (l.ex || []).forEach(function (e) { h += '<div class="card pad">' + blocks(e.s) + (e.en ? '<div style="margin-top:8px"><b>' + esc(e.en) + '</b></div>' : '') + (e.say ? '<button class="btn2" style="margin-top:8px" data-act="cs-say" data-id="' + esc(e.say) + '">' + ic('volume') + ' Hear it</button>' : '') + '</div>'; });
      return h + '<button class="btn2 main" data-act="cs-ldone">' + (S.read[S.lang + lesson] ? 'Read again, done' : 'Got it') + '</button>';
    }
    return toggles() + '<ul class="list">' + L.map(function (l, i) {
      return '<li><button class="card row" style="width:100%;text-align:left" data-act="cs-lesson" data-id="' + i + '"><span class="txt"><div class="nm">' + (i + 1) + '. ' + esc(l.t) + '</div><div class="sub">' + esc((l.intro && l.intro[0]) || '') + '</div></span>' + (S.read[S.lang + i] ? ic('check') : ic('chev')) + '</button></li>';
    }).join('') + '</ul>';
  }
  function newDrill() {
    var P = pack(), L = P.sentences || []; if (!L.length) return null;
    var i = drillN++ % L.length, s = L[i];
    return { i: i, s: s, pool: shuffle(s.t.map(function (_, k) { return k; })), put: [], bad: false, ok: false };
  }
  function buildTab() {
    var P = pack(), h = '<div class="chips" style="margin:6px 0">' + [['arrange', 'Put in order'], ['make', 'Make your own']].map(function (x) { return '<button class="tag' + (sub === x[0] ? ' on' : '') + '" data-act="cs-sub" data-id="' + x[0] + '" aria-pressed="' + (sub === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' + toggles();
    if (sub === 'arrange') {
      if (!drill) drill = newDrill();
      if (!drill) return h + '<p class="note">No practice sentences yet.</p>';
      var d = drill, s = d.s;
      h += '<div class="card pad"><div class="eyebrow">Say it in ' + esc(P.name) + '</div><div style="font-size:20px;margin:8px 0"><b>' + esc(s.en) + '</b></div>' +
        '<div class="cs-row"' + rtl() + ' style="min-height:58px;padding:8px;border:1px dashed var(--card-line);border-radius:12px">' + (d.put.length ? d.put.map(function (k, n) { return '<button class="cs-pick" data-act="cs-unput" data-id="' + n + '">' + esc(s.t[k][0]) + '</button>'; }).join('') : '<span class="sub">Tap the words below in order</span>') + '</div>' +
        '<div class="cs-row"' + rtl() + ' style="margin-top:12px">' + d.pool.filter(function (k) { return d.put.indexOf(k) < 0; }).map(function (k) { return '<button class="cs-pick" data-act="cs-put" data-id="' + k + '">' + esc(s.t[k][0]) + '</button>'; }).join('') + '</div>';
      if (d.ok) h += '<div style="margin-top:14px">' + blocks(s.t) + '<div style="margin-top:8px"><b>Correct.</b></div><div class="chips" style="margin-top:8px"><button class="btn2" data-act="cs-say" data-id="' + esc(s.say || s.t.map(function (x) { return x[0]; }).join('')) + '">' + ic('volume') + ' Hear it</button><button class="btn2 main" data-act="cs-dnext">Next sentence</button></div></div></div>';
      else if (d.bad) h += '<div class="note" style="margin-top:10px">Not quite. Remember the order of this language. Tap a word to take it back.</div><button class="btn2" style="margin-top:8px" data-act="cs-dreset">Start again</button></div>';
      else h += '</div>';
      return h + '</div>'.slice(0, 0);
    }
    /* make your own */
    var Ss = words('subjects'), Os = words('objects'), Vs = words('verbs'); if (!Ss.length || !Vs.length || !P.make) return h + '<p class="note">Not ready for this language yet.</p>';
    function sel1(id, arr, v) { return '<select class="field cs-sel" id="' + id + '" aria-label="' + id + '">' + arr.map(function (w, i) { return '<option value="' + i + '"' + (i === v ? ' selected' : '') + '>' + esc(w.w + (w.r && w.r !== w.w ? ' (' + w.r + ')' : '') + ' — ' + w.en) + '</option>'; }).join('') + '</select>'; }
    var r = P.make(Ss[mk.s], Os[mk.o], Vs[mk.v], mk.f), fm = P.forms || [];
    h += '<div class="card pad"><div class="eyebrow">Who does it</div>' + sel1('csS', Ss, mk.s) + '<div class="eyebrow" style="margin-top:10px">The action</div>' + sel1('csV', Vs, mk.v) +
      (r.needsObj ? '<div class="eyebrow" style="margin-top:10px">What / where</div>' + sel1('csO', Os, mk.o) : '<p class="note" style="margin-top:10px">This verb needs no object.</p>') +
      '<div class="eyebrow" style="margin-top:10px">Form</div><div class="chips" style="margin-top:6px">' + fm.map(function (f, i) { return '<button class="tag' + (mk.f === i ? ' on' : '') + '" data-act="cs-form" data-id="' + i + '" aria-pressed="' + (mk.f === i) + '">' + esc(f) + '</button>'; }).join('') + '</div></div>' +
      '<div class="card pad"><div class="eyebrow">Your sentence</div>' + blocks(r.parts) + (S.sh.ro && r.rom ? '<div class="sub" style="margin-top:8px;font-style:italic">' + esc(r.rom) + '</div>' : '') +
      '<div class="note" style="margin-top:8px">The grammar is right. It may not make sense in real life, and that is fine for practice.</div><button class="btn2 main" style="margin-top:8px" data-act="cs-say" data-id="' + esc(r.text) + '">' + ic('volume') + ' Hear it</button></div>';
    return h;
  }

  function render() {
    var el = $('v-course'); if (!el) return;
    var P = pack();
    if (!P) { el.innerHTML = bar(u.BACK_TOOLS, 'Word course') + '<div class="card hero"><span class="chip">' + ic('book') + '</span><h2>No language file found</h2><p>Upload the VELENTIS-course-*.js files to GitHub, rebuild, and install again.</p></div>'; return; }
    var tabs = [['learn', 'Learn'], ['chart', 'Chart'], ['letters', 'Letters'], ['grammar', 'Grammar'], ['build', 'Build']].filter(function (x) { return x[0] !== 'letters' || (P.letters && P.letters.length); });
    if (tab === 'letters' && !(P.letters && P.letters.length)) tab = 'learn';
    var body;
    if (sess) body = sessionView();
    else {
      body = '<div class="cs-tabs" role="tablist">' + tabs.map(function (x) { return '<button class="tag' + (tab === x[0] ? ' on' : '') + '" data-act="cs-tab" data-id="' + x[0] + '" aria-pressed="' + (tab === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
        (tab === 'learn' ? learnTab() : tab === 'chart' ? chartTab() : tab === 'letters' ? lettersTab() : tab === 'grammar' ? grammarTab() : buildTab());
    }
    el.innerHTML = bar(u.BACK_TOOLS, 'Word course') + (sess ? '' : langChips()) + body;
  }
  V.registerTool('course', function () { sess = null; render(); });

  /* ---------- actions ---------- */
  function afterQuiz() { sess.phase = 'done'; }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'); if (a.indexOf('cs-') !== 0) return;
    var id = t.getAttribute('data-id'); a = a.slice(3);
    var P = pack();
    if (a === 'lang') { S.lang = id; sel = null; drill = null; lesson = null; lq = null; lsel = null; mk = { s: 0, o: 0, v: 0, f: 0 }; save(); }
    else if (a === 'tab') { tab = id; lesson = null; lq = null; }
    else if (a === 'set') { S.set = id; sel = null; save(); }
    else if (a === 'sh') { S.sh[id] = S.sh[id] ? 0 : 1; save(); }
    else if (a === 'say') { speak(id); return; }
    else if (a === 'new') { startNew(S.set); }
    else if (a === 'newset') { S.set = id; startNew(id); }
    else if (a === 'again') { startNew(S.set); }
    else if (a === 'one') { startOne(S.set, +id); }
    else if (a === 'rev') { startRev(); }
    else if (a === 'home') { sess = null; }
    else if (a === 'intro-next') { if (sess.n + 1 < sess.list.length) sess.n++; else { sess.phase = 'quiz'; sess.qs = quizFor(sess); sess.qi = 0; sess.ans = null; } }
    else if (a === 'pick') { var q = sess.qs[sess.qi]; if (sess.ans != null) return; sess.ans = +id; var ok = q.opts[+id] === q.w.en; if (ok) sess.ok++; grade(wid(q.it.set, q.it.i), ok); }
    else if (a === 'qnext') { if (sess.qi + 1 < sess.qs.length) { sess.qi++; sess.ans = null; } else afterQuiz(); }
    else if (a === 'reveal') { sess.show = true; }
    else if (a === 'got' || a === 'miss') { var c = sess.list[sess.n]; var good = a === 'got'; if (good) sess.ok++; grade(wid(c.set, c.i), good); sess.n++; sess.show = false; if (sess.n >= sess.list.length) afterQuiz(); }
    else if (a === 'cell') { sel = sel === +id ? null : +id; }
    else if (a === 'let') { var all = []; P.letters.forEach(function (g) { g.rows.forEach(function (r) { r.forEach(function (c) { if (c && c[0] === id) all = c; }); }); }); lsel = all.length ? all : null; speak(id); }
    else if (a === 'lq') {
      var g = P.letters[+id], pool = []; g.rows.forEach(function (r) { r.forEach(function (c) { if (c) pool.push(c); }); });
      var picks = shuffle(pool).slice(0, 8);
      lq = { gi: +id, i: 0, ok: 0, ans: null, done: false, qs: picks.map(function (c) { var oth = shuffle(pool.filter(function (x) { return x[1] !== c[1]; })).slice(0, 3).map(function (x) { return x[1]; }); return { c: c, opts: shuffle(oth.concat([c[1]])) }; }) };
    }
    else if (a === 'lpick') { var lqq = lq.qs[lq.i]; if (lq.ans != null) return; lq.ans = +id; var lok = lqq.opts[+id] === lqq.c[1]; if (lok) { lq.ok++; S.l[lqq.c[0]] = Math.min(6, (S.l[lqq.c[0]] || 0) + 2); } else S.l[lqq.c[0]] = Math.max(0, (S.l[lqq.c[0]] || 0) - 1); mark(1); V.emit('course.learn', { ref: 'L' + lqq.c[0] + ':' + today() }); save(); }
    else if (a === 'lnext') { if (lq.i + 1 < lq.qs.length) { lq.i++; lq.ans = null; } else lq.done = true; }
    else if (a === 'lqstop') { lq = null; }
    else if (a === 'lesson') { lesson = +id; }
    else if (a === 'lback') { lesson = null; }
    else if (a === 'ldone') { if (!S.read[S.lang + lesson]) { S.read[S.lang + lesson] = 1; mark(1); V.emit('course.learn', { ref: 'G' + S.lang + lesson }); } lesson = null; }
    else if (a === 'sub') { sub = id; }
    else if (a === 'put') { if (drill && !drill.ok) { drill.put.push(+id); drill.bad = false; if (drill.put.length === drill.s.t.length) { var good2 = drill.put.every(function (k, n) { return k === n || drill.s.t[k][0] === drill.s.t[n][0]; }); if (good2) { drill.ok = true; mark(1); V.emit('course.learn', { ref: 'S' + S.lang + drill.i + ':' + today() }); } else drill.bad = true; } } }
    else if (a === 'unput') { if (drill && !drill.ok) { drill.put.splice(+id, 1); drill.bad = false; } }
    else if (a === 'dreset') { if (drill) { drill.put = []; drill.bad = false; } }
    else if (a === 'dnext') { drill = newDrill(); }
    else if (a === 'form') { mk.f = +id; }
    save(); render();
  });
  document.addEventListener('change', function (e) {
    var id = e.target.id; if (id !== 'csS' && id !== 'csO' && id !== 'csV') return;
    var v = +e.target.value; if (id === 'csS') mk.s = v; else if (id === 'csO') mk.o = v; else mk.v = v; render();
  });

  V.course = { add: function (p) { PACKS[p.id] = p; }, strength: lvl };
})();
