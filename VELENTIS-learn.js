/* Learning: Quiz game, Myths and facts, Knowledge library, Gentleman and Life Skills academies. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, plural = u.plural, bar = u.bar, D = V.data;
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function askVel() { return V.ai && V.ai.hasKey(); }

  /* ================= Quiz game ================= */
  var QS = u.get('velentis.quiz.v1', { best: {}, played: 0 });
  if (!QS || typeof QS.best !== 'object') QS = { best: {}, played: 0 };
  var qz = { v: 'menu', run: null, busy: false, msg: '' };
  var CATS = ['Mixed', 'Science', 'History', 'Geography', 'Tech', 'General'];
  function qzSave() { u.put('velentis.quiz.v1', QS); }
  function mkQ(row) {
    var opts = shuffle([row[2], row[3], row[4], row[5]]);
    return { q: row[1], opts: opts, a: opts.indexOf(row[2]), why: row[6] };
  }
  function startQuiz(cat, custom) {
    var qs;
    if (custom) qs = custom;
    else {
      var pool = D.quiz.filter(function (r) { return cat === 'Mixed' || r[0] === cat; });
      qs = shuffle(pool).slice(0, 8).map(mkQ);
    }
    qz.run = { id: 'q' + u.uid(), cat: custom ? 'Custom' : cat, qs: qs, i: 0, right: 0, pick: -1 };
    qz.v = 'run'; render_quiz();
  }
  function renderQuizMenu() {
    var cats = CATS.map(function (c) {
      var b = QS.best[c];
      return '<button class="card row btn" data-act="qz-cat" data-id="' + c + '"><span class="chip">' + ic('help') + '</span><span class="txt"><span class="nm">' + c + '</span><br><span class="sub">' + (b != null ? 'Best: ' + b + ' of 8' : '8 questions') + '</span></span>' + ic('chev') + '</button>';
    }).join('');
    return bar(u.BACK_TOOLS, 'Quiz game') +
      '<div class="list">' + cats + '</div>' +
      '<div class="card pad"><div class="eyebrow">Quiz on any topic</div>' +
      (askVel() ? '<form class="form" id="qzAsk" novalidate style="margin-top:10px"><input class="field" id="qzTopic" maxlength="60" placeholder="Like volcanoes or cricket" aria-label="Quiz topic" autocomplete="off"><button class="add" type="submit">Go</button></form>' + (qz.msg ? '<p class="note" style="margin-top:8px">' + esc(qz.msg) + '</p>' : '')
        : '<p class="note" style="margin-top:8px">Add your free key in Vel settings and Vel can quiz you on anything.</p>') + '</div>';
  }
  function renderQuizRun() {
    var r = qz.run; if (!r) return renderQuizMenu();
    if (r.i >= r.qs.length) {
      var best = QS.best[r.cat];
      return bar('data-act="qz-menu"', 'Result') +
        '<div class="card hero"><span class="chip">' + ic('check') + '</span><h2>' + r.right + ' of ' + r.qs.length + '</h2><p>' + (r.right === r.qs.length ? 'Perfect round.' : r.right >= r.qs.length / 2 ? 'Solid. Try again to beat it.' : 'Good practice. Every round teaches you something.') + '</p></div>' +
        '<div class="duo"><button class="btn2 main" data-act="qz-again">Play again</button><button class="btn2" data-act="qz-menu">Menu</button></div>';
    }
    var q = r.qs[r.i], answered = r.pick >= 0;
    var opts = q.opts.map(function (o, i) {
      var cls = 'btn2 opt' + (answered ? (i === q.a ? ' right' : (i === r.pick ? ' wrong' : '')) : '');
      return '<button class="' + cls + '" data-act="qz-pick" data-id="' + i + '"' + (answered ? ' disabled' : '') + '>' + esc(o) + '</button>';
    }).join('');
    return bar('data-act="qz-menu"', r.cat) +
      '<div><div class="note">Question ' + (r.i + 1) + ' of ' + r.qs.length + '</div><div class="bar"><i style="width:' + Math.round(r.i / r.qs.length * 100) + '%"></i></div></div>' +
      '<div class="card pad"><div class="qtext">' + esc(q.q) + '</div></div><div class="choices">' + opts + '</div>' +
      (answered ? '<div class="card pad"><div class="eyebrow">' + (r.pick === q.a ? 'Correct' : 'Not quite') + '</div><p style="margin:6px 0 0">' + esc(q.why || '') + '</p></div><button class="btn2 main" data-act="qz-next">' + (r.i + 1 >= r.qs.length ? 'See result' : 'Next') + '</button>' : '');
  }
  function render_quiz() { $('v-quiz').innerHTML = qz.v === 'run' ? renderQuizRun() : renderQuizMenu(); }
  V.registerTool('quiz', render_quiz);
  function aiQuiz(topic) {
    qz.msg = 'Vel is writing your quiz...'; render_quiz();
    var sys = 'You write multiple choice quizzes. Reply with ONLY a JSON array of 6 items about the topic, no other text. Each item: {"q": question, "a": correct answer, "w": [three plausible wrong answers], "e": one short sentence explaining the answer}. Keep language simple and facts accurate.';
    V.ai.ask([{ r: 'user', t: 'Topic: ' + topic }], sys, { temp: 0.4, max: 2000 }).then(function (t) {
      var m = t.match(/\[[\s\S]*\]/), arr = [];
      try { arr = JSON.parse(m ? m[0] : t); } catch (e) {}
      var qs = (Array.isArray(arr) ? arr : []).filter(function (x) { return x && x.q && x.a && Array.isArray(x.w) && x.w.length >= 3; }).map(function (x) {
        var opts = shuffle([String(x.a)].concat(x.w.slice(0, 3).map(String)));
        return { q: String(x.q), opts: opts, a: opts.indexOf(String(x.a)), why: String(x.e || '') };
      });
      if (qs.length < 3) { qz.msg = 'Vel could not make that quiz. Try another topic.'; if (V.view() === 'quiz') render_quiz(); return; }
      qz.msg = ''; startQuiz('Custom', qs);
    }, function (e) { qz.msg = e.message; if (V.view() === 'quiz') render_quiz(); });
  }

  /* ================= Myths and facts ================= */
  var FS = u.get('velentis.facts.v1', { seen: 0, right: 0 });
  if (!FS || typeof FS.seen !== 'number') FS = { seen: 0, right: 0 };
  var ft = { order: shuffle(D.facts.map(function (_, i) { return i; })), pos: 0, pick: null, streak: 0 };
  function renderFacts() {
    var i = ft.order[ft.pos % ft.order.length], f = D.facts[i], answered = ft.pick !== null;
    var correct = answered && ((ft.pick === 'fact') === f[1]);
    $('v-facts').innerHTML =
      bar(u.BACK_TOOLS, 'Myths and facts') +
      '<div class="card pad"><div class="eyebrow">Myth or fact?</div><div class="qtext" style="margin-top:10px">' + esc(f[0]) + '</div></div>' +
      (answered ? '<div class="card pad ' + (correct ? 'okc' : '') + '"><div class="eyebrow">' + (correct ? 'You got it' : 'Not quite') + ' · it is a ' + (f[1] ? 'fact' : 'myth') + '</div><p style="margin:6px 0 0">' + esc(f[2]) + '</p></div><button class="btn2 main" data-act="ft-next">Next</button>'
        : '<div class="duo"><button class="btn2" data-act="ft-pick" data-id="myth">Myth</button><button class="btn2 main" data-act="ft-pick" data-id="fact">Fact</button></div>') +
      '<p class="note" style="text-align:center">Streak ' + ft.streak + ' · ' + FS.right + ' right of ' + FS.seen + ' played</p>';
  }
  V.registerTool('facts', renderFacts);

  /* ================= Knowledge library ================= */
  var LS = u.get('velentis.lib.v1', { read: {} });
  if (!LS || typeof LS.read !== 'object') LS = { read: {} };
  var lb = { topic: 'All', open: null, ask: '', busy: false, ans: '' };
  var TOPICS = ['All', 'Science', 'Health', 'Money', 'Tech'];
  function renderLib() {
    var a = lb.open && D.lib.filter(function (x) { return x[0] === lb.open; })[0];
    if (a) {
      $('v-lib').innerHTML =
        bar('data-act="lb-back"', a[1]) +
        '<div class="card pad"><div class="eyebrow">' + esc(a[1]) + '</div><h2 style="margin:6px 0 10px;font-size:22px">' + esc(a[2]) + '</h2><p class="prose">' + esc(a[3]) + '</p></div>' +
        '<button class="btn2 main" data-act="lb-read" data-id="' + a[0] + '">' + (LS.read[a[0]] ? 'Read again' : 'I read it') + '</button>' +
        (askVel() ? '<button class="btn2" data-act="lb-simpler" data-id="' + a[0] + '">Explain it more simply</button>' : '') +
        (lb.ans ? '<div class="card pad"><div class="eyebrow">Vel says</div><p class="prose" style="margin:6px 0 0">' + esc(lb.ans) + '</p></div>' : '');
      return;
    }
    var rows = D.lib.filter(function (x) { return lb.topic === 'All' || x[1] === lb.topic; }).map(function (x) {
      return '<button class="card row btn" data-act="lb-open" data-id="' + x[0] + '"><span class="chip">' + ic(LS.read[x[0]] ? 'tick' : 'book') + '</span><span class="txt"><span class="nm">' + esc(x[2]) + '</span><br><span class="sub">' + esc(x[1]) + '</span></span>' + ic('chev') + '</button>';
    }).join('');
    $('v-lib').innerHTML =
      bar(u.BACK_TOOLS, 'Knowledge library') +
      '<div class="chips">' + TOPICS.map(function (t) { return '<button class="tag' + (lb.topic === t ? ' on' : '') + '" data-act="lb-topic" data-id="' + t + '" aria-pressed="' + (lb.topic === t) + '">' + t + '</button>'; }).join('') + '</div>' +
      '<div class="list">' + rows + '</div>' +
      '<div class="card pad"><div class="eyebrow">Ask Vel to explain anything</div>' +
      (askVel() ? '<form class="form" id="lbAsk" novalidate style="margin-top:10px"><input class="field" id="lbQ" maxlength="120" placeholder="Why do we yawn?" aria-label="Question" autocomplete="off" value="' + esc(lb.ask) + '"><button class="add" type="submit"' + (lb.busy ? ' disabled' : '') + '>Ask</button></form>' +
        (lb.busy ? '<p class="note" style="margin-top:8px">Vel is thinking...</p>' : '') + (lb.ans ? '<p class="prose" style="margin:10px 0 0">' + esc(lb.ans) + '</p>' : '')
        : '<p class="note" style="margin-top:8px">Add your free key in Vel settings to ask anything.</p>') + '</div>';
  }
  V.registerTool('lib', renderLib);

  /* ================= Academies ================= */
  var AC = u.get('velentis.acad.v1', { gent: {}, skills: {} });
  if (!AC || typeof AC.gent !== 'object' || typeof AC.skills !== 'object') AC = { gent: {}, skills: {} };
  function makeAcademy(cfg) {
    var st = { open: null, pick: -1, shuffled: null }, p = cfg.p;
    function lesson(id) { return cfg.lessons.filter(function (l) { return l[0] === id; })[0]; }
    function render() {
      var el = $('v-' + cfg.view), done = AC[cfg.key], l = st.open && lesson(st.open);
      if (l) {
        var opts = st.shuffled || (st.shuffled = shuffle([l[5], l[6], l[7], l[8]])), answered = st.pick >= 0;
        var correct = answered && opts[st.pick] === l[5];
        el.innerHTML = bar('data-act="' + p + '-back"', l[1]) +
          '<div class="card pad"><h2 style="margin:0 0 10px;font-size:22px">' + esc(l[1]) + '</h2><p class="prose">' + esc(l[2]) + '</p></div>' +
          '<div class="card pad"><div class="eyebrow">Try this today</div><p style="margin:6px 0 0">' + esc(l[3]) + '</p></div>' +
          '<div class="card pad"><div class="eyebrow">Quick check</div><div class="qtext" style="margin:8px 0 12px">' + esc(l[4]) + '</div><div class="choices">' +
          opts.map(function (o, i) {
            var cls = 'btn2 opt' + (answered ? (o === l[5] ? ' right' : (i === st.pick ? ' wrong' : '')) : '');
            return '<button class="' + cls + '" data-act="' + p + '-pick" data-id="' + i + '"' + (answered ? ' disabled' : '') + '>' + esc(o) + '</button>';
          }).join('') + '</div>' +
          (answered ? '<p class="note" style="margin-top:10px">' + (correct ? 'Correct. ' : 'Not quite. ') + esc(l[9]) + '</p>' : '') + '</div>' +
          (answered && !correct ? '<button class="btn2" data-act="' + p + '-retry">Try the question again</button>' : '') +
          (done[l[0]] ? '<p class="note" style="text-align:center">Lesson completed</p>' : '');
        return;
      }
      var n = cfg.lessons.filter(function (x) { return done[x[0]]; }).length;
      el.innerHTML = bar(u.BACK_TOOLS, cfg.title) +
        '<div class="card pad"><div class="eyebrow">Progress</div><div class="big">' + n + ' of ' + cfg.lessons.length + ' lessons</div><div class="bar"><i style="width:' + Math.round(n / cfg.lessons.length * 100) + '%"></i></div><p class="note" style="margin-top:10px">' + esc(cfg.blurb) + '</p></div>' +
        '<div class="list">' + cfg.lessons.map(function (x, i) {
          return '<button class="card row btn" data-act="' + p + '-open" data-id="' + x[0] + '"><span class="chip">' + (done[x[0]] ? ic('tick') : '<b>' + (i + 1) + '</b>') + '</span><span class="txt"><span class="nm">' + esc(x[1]) + '</span><br><span class="sub">' + (done[x[0]] ? 'Done' : 'About 2 minutes') + '</span></span>' + ic('chev') + '</button>';
        }).join('') + '</div>';
    }
    V.registerTool(cfg.view, render);
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
      var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
      if (a.indexOf(p + '-') !== 0) return;
      a = a.slice(p.length + 1);
      if (a === 'open') { st.open = id; st.pick = -1; st.shuffled = null; window.scrollTo(0, 0); }
      else if (a === 'back') { st.open = null; }
      else if (a === 'retry') { st.pick = -1; }
      else if (a === 'pick') {
        var l = lesson(st.open); if (!l) return;
        st.pick = +id;
        if (st.shuffled[st.pick] === l[5] && !AC[cfg.key][l[0]]) { AC[cfg.key][l[0]] = u.iso(new Date()); u.put('velentis.acad.v1', AC); V.emit(cfg.event, { ref: l[0] }); }
      }
      render();
    });
  }
  makeAcademy({ p: 'gn', view: 'gent', key: 'gent', event: 'gent.lesson', title: 'Gentleman academy', lessons: D.gent, blurb: 'Short lessons on presence, manners and staying calm. Read, try one thing today, and answer the check.' });
  makeAcademy({ p: 'sk', view: 'skills', key: 'skills', event: 'skills.lesson', title: 'Life skills academy', lessons: D.skills, blurb: 'Money, sleep, work and safety basics that nobody teaches in a hurry.' });

  /* ================= clicks and forms ================= */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a.indexOf('qz-') === 0) {
      var r = qz.run;
      if (a === 'qz-cat') { qz.msg = ''; startQuiz(id); return; }
      else if (a === 'qz-menu') { qz.v = 'menu'; qz.run = null; }
      else if (a === 'qz-again') { startQuiz(r && r.cat !== 'Custom' ? r.cat : 'Mixed'); return; }
      else if (a === 'qz-pick' && r && r.pick < 0) { r.pick = +id; if (r.pick === r.qs[r.i].a) r.right++; }
      else if (a === 'qz-next' && r) {
        r.i++; r.pick = -1;
        if (r.i >= r.qs.length) {
          QS.played++; if (r.cat !== 'Custom' && (QS.best[r.cat] == null || r.right > QS.best[r.cat])) QS.best[r.cat] = r.right; qzSave();
          if (r.right > 0) V.emit('quiz.done', { ref: r.id, units: r.right });
        }
      }
      render_quiz();
    } else if (a.indexOf('ft-') === 0) {
      if (a === 'ft-pick' && ft.pick === null) {
        var f = D.facts[ft.order[ft.pos % ft.order.length]], ok = (id === 'fact') === f[1];
        ft.pick = id; FS.seen++; if (ok) { FS.right++; ft.streak++; } else ft.streak = 0;
        u.put('velentis.facts.v1', FS); V.emit('facts.guess', { ref: 'f' + ft.order[ft.pos % ft.order.length] + '-' + FS.seen });
      } else if (a === 'ft-next') { ft.pos++; ft.pick = null; }
      renderFacts();
    } else if (a.indexOf('lb-') === 0) {
      if (a === 'lb-topic') lb.topic = id;
      else if (a === 'lb-open') { lb.open = id; lb.ans = ''; window.scrollTo(0, 0); }
      else if (a === 'lb-back') { lb.open = null; lb.ans = ''; }
      else if (a === 'lb-read') { LS.read[id] = u.iso(new Date()); u.put('velentis.lib.v1', LS); V.emit('lib.read', { ref: id }); lb.open = null; window.scrollTo(0, 0); }
      else if (a === 'lb-simpler') {
        var art = D.lib.filter(function (x) { return x[0] === id; })[0]; lb.ans = 'Vel is thinking...'; renderLib();
        V.ai.ask([{ r: 'user', t: 'Explain this in simpler words, like to a 12 year old, in 3 short sentences:\n' + art[3] }], V.ai.persona(), { max: 500 }).then(function (r) { lb.ans = r; if (V.view() === 'lib') renderLib(); }, function (er) { lb.ans = er.message; if (V.view() === 'lib') renderLib(); });
        return;
      }
      renderLib();
    }
  });
  document.addEventListener('submit', function (e) {
    var id = e.target.id;
    if (id === 'qzAsk') { e.preventDefault(); var t = $('qzTopic').value.trim(); if (t) aiQuiz(t); }
    else if (id === 'lbAsk') {
      e.preventDefault(); var q = $('lbQ').value.trim(); if (!q || lb.busy) return;
      lb.ask = q; lb.busy = true; lb.ans = ''; renderLib();
      V.ai.ask([{ r: 'user', t: q }], V.ai.persona() + ' The user asked a curiosity question. Explain clearly in at most 5 short sentences with one simple example.', { max: 700 }).then(function (r) { lb.busy = false; lb.ans = r; if (V.view() === 'lib') renderLib(); }, function (er) { lb.busy = false; lb.ans = er.message; if (V.view() === 'lib') renderLib(); });
    }
  });
  V.registerSearch(function (q) {
    var out = [];
    D.lib.forEach(function (a) { if ((a[2] + ' ' + a[1]).toLowerCase().indexOf(q) !== -1) out.push({ icon: 'book', title: a[2], sub: 'Library', to: 'lib' }); });
    D.gent.concat(D.skills).forEach(function (l) { if (l[1].toLowerCase().indexOf(q) !== -1) out.push({ icon: 'award', title: l[1], sub: 'Lesson', to: l[0].charAt(0) === 'g' ? 'gent' : 'skills' }); });
    return out.slice(0, 6);
  });
})();
