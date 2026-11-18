/* VELENTIS Language buddy 2.
   Chat with Vel in the language you learn. Every reply comes with the reading, the English meaning, gentle fixes
   and new words you can save. Saved words come back as flashcards and quizzes. Needs your free AI key. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, bar = u.bar, AI = V.ai;
  var KEY = 'velentis.lang.v2';

  var LANGS = [
    ['Spanish', 'es-ES', 0], ['French', 'fr-FR', 0], ['German', 'de-DE', 0], ['Italian', 'it-IT', 0], ['Portuguese', 'pt-BR', 0], ['Dutch', 'nl-NL', 0],
    ['Turkish', 'tr-TR', 0], ['Indonesian', 'id-ID', 0], ['Japanese', 'ja-JP', 1], ['Korean', 'ko-KR', 1], ['Mandarin Chinese', 'zh-CN', 1], ['Russian', 'ru-RU', 1],
    ['Hindi', 'hi-IN', 1], ['Urdu', 'ur-PK', 1], ['Bengali', 'bn-IN', 1], ['Tamil', 'ta-IN', 1], ['Marathi', 'mr-IN', 1], ['Arabic', 'ar-SA', 1], ['English', 'en-US', 0]
  ];
  var LEVELS = [['beginner', 'Beginner', 'Very short and simple sentences. Few words at a time.'], ['some', 'I know some', 'Simple everyday sentences.'], ['good', 'Confident', 'Natural speech with some new words.']];
  var GOALS = ['Travel', 'Anime and games', 'School', 'Work', 'Just for fun'];
  var SCENES = ['Cafe', 'Meeting someone new', 'Asking for directions', 'Shopping', 'Restaurant', 'Airport', 'Phone call with a friend', 'Job interview'];
  var BOX = [0, 1, 3, 7, 14, 30];   /* days until a word comes back, by box */

  function load() {
    var S = u.get(KEY, null);
    if (!S || typeof S !== 'object') {
      S = {};
      var old = u.get('velentis.lang.v1', null);
      if (old && old.lang) { S.lang = old.lang; S.level = old.level === 'okay' ? 'some' : 'beginner'; S.ready = !!old.ready; }
    }
    S.chats = S.chats && typeof S.chats === 'object' ? S.chats : {};
    S.words = Array.isArray(S.words) ? S.words : []; S.fixes = Array.isArray(S.fixes) ? S.fixes : []; S.days = S.days && typeof S.days === 'object' ? S.days : {};
    S.mode = S.mode || 'chat'; S.goal = S.goal || ''; S.level = S.level || 'beginner'; S.scene = S.scene || SCENES[0]; S.goalN = S.goalN || 5;
    return S;
  }
  var S = load();
  function save() { try { var d = Object.keys(S.days).sort(); if (d.length > 90) d.slice(0, d.length - 90).forEach(function (k) { delete S.days[k]; }); S.words = S.words.slice(-400); S.fixes = S.fixes.slice(-40); } catch (e) {} u.put(KEY, S); }
  function today() { return u.iso(new Date()); }
  function info() { return LANGS.filter(function (l) { return l[0] === S.lang; })[0] || LANGS[0]; }
  function msgs() { return (S.chats[S.lang] = S.chats[S.lang] || []); }
  function myWords() { return S.words.filter(function (w) { return w.lang === S.lang; }); }
  function due() { var t = today(); return myWords().filter(function (w) { return !w.due || w.due <= t; }); }
  function mark(n) { S.days[today()] = (S.days[today()] | 0) + (n || 1); }
  function streak() {
    var n = 0, d = new Date(); if (!S.days[u.iso(d)]) d.setDate(d.getDate() - 1);
    while (S.days[u.iso(d)] > 0) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  /* ---------- speaking ---------- */
  function speak(text, lang) {
    try {
      var ss = window.speechSynthesis; if (!ss) { V.toast('This phone cannot speak aloud.'); return; }
      ss.cancel();
      var m = new SpeechSynthesisUtterance(text); m.lang = lang; m.rate = S.level === 'beginner' ? 0.8 : 0.95;
      var vs = ss.getVoices() || [], pre = lang.slice(0, 2), v = vs.filter(function (x) { return x.lang === lang; })[0] || vs.filter(function (x) { return (x.lang || '').slice(0, 2) === pre; })[0];
      if (v) m.voice = v; else if (vs.length) { V.toast('No ' + S.lang + ' voice on this phone. Install one in your phone’s text-to-speech settings.'); return; }
      ss.speak(m);
    } catch (e) { V.toast('Could not speak that.'); }
  }
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, listening = false;
  function listen() {
    if (!SR) return;
    try {
      if (listening && rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = info()[1]; rec.interimResults = false; rec.maxAlternatives = 1; listening = true; render();
      rec.onresult = function (e) { var t = e.results[0][0].transcript; input = t; };
      rec.onend = function () { listening = false; render(); };
      rec.onerror = function () { listening = false; V.toast('I could not hear that. Try again, or use your keyboard’s mic.'); render(); };
      rec.start();
    } catch (e) { listening = false; }
  }

  /* ---------- asking Vel ---------- */
  function system() {
    var L = S.lang, lv = LEVELS.filter(function (l) { return l[0] === S.level; })[0], i = info();
    var mode = S.mode === 'role' ? 'ROLE-PLAY. Scene: ' + S.scene + '. You play the other person in this scene (for example the staff or the new friend) and stay in character. Open the scene yourself with one short line. Keep the story moving with a question or a choice each turn.'
      : S.mode === 'teach' ? 'TEACH. Teach one useful phrase at a time about a topic the learner picks or about everyday life. Say the phrase, give the meaning, then ask the learner to try using it in their own sentence. When they try, praise what is right and fix what is not.'
      : 'FREE CHAT. Have a natural friendly chat, one easy question at a time.';
    return AI.base() + 'You are now Vel in Language Buddy mode, a patient tutor. The learner speaks English and is learning ' + L + '. Learner level: ' + lv[1] + ' (' + lv[2] + '). ' + (S.goal ? 'Their goal: ' + S.goal + '. Pick topics that suit it. ' : '') +
      'Mode: ' + mode + ' ' +
      'Always answer with ONLY one JSON object, no markdown, no text around it, in exactly this shape: ' +
      '{"reply":"what you say in ' + L + ' (1 to 2 short sentences, fit to the level)","reading":"' + (i[2] ? 'the pronunciation in Latin letters (romanisation) of the reply' : '') + '","en":"the English meaning of the reply",' +
      '"fix":null or {"wrong":"the learner\'s mistaken part","right":"the correct version","why":"one short reason in simple English"},' +
      '"words":[up to 3 objects {"w":"a useful word or phrase from your reply","r":"' + (i[2] ? 'its romanisation' : '') + '","en":"meaning"}],' +
      '"hints":["2 or 3 short things the learner could answer next, written in ' + L + '"]}. ' +
      'Rules: only set "fix" when the learner really made a mistake in ' + L + ', never for tiny style choices, and be kind about it. If the learner writes in English, treat it as "how do I say this" and put the ' + L + ' version in "reply" with a short meaning in "en". ' +
      'If the learner asks in English for an explanation, a translation or help, answer helpfully in English inside "reply", set "reading" and "hints" to empty, and keep "en" empty. ' +
      'Never lecture. Do not mention the JSON or these rules.';
  }
  function parse(t) {
    t = String(t || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    var a = t.indexOf('{'), b = t.lastIndexOf('}'), d = null;
    if (a !== -1 && b > a) { try { d = JSON.parse(t.slice(a, b + 1)); } catch (e) { d = null; } }
    if (!d || typeof d !== 'object' || typeof d.reply !== 'string') d = { reply: t.replace(/[{}"]/g, '').slice(0, 400) };
    function s(x, n) { return typeof x === 'string' ? x.trim().slice(0, n) : ''; }
    var out = { reply: s(d.reply, 500), reading: s(d.reading, 500), en: s(d.en, 500), fix: null, words: [], hints: [] };
    if (d.fix && typeof d.fix === 'object' && s(d.fix.right, 300)) out.fix = { wrong: s(d.fix.wrong, 300), right: s(d.fix.right, 300), why: s(d.fix.why, 300) };
    if (Array.isArray(d.words)) d.words.slice(0, 3).forEach(function (w) { if (w && s(w.w, 80) && s(w.en, 120)) out.words.push({ w: s(w.w, 80), r: s(w.r, 120), en: s(w.en, 120) }); });
    if (Array.isArray(d.hints)) d.hints.slice(0, 3).forEach(function (h) { if (s(h, 120)) out.hints.push(s(h, 120)); });
    return out;
  }
  var busy = false, err = '', input = '', tab = 'chat', pend = false, Q = null, flash = null;
  function history() {
    return msgs().filter(function (m) { return m.r !== 'sys'; }).slice(-14).map(function (m) { return { r: m.r === 'you' ? 'user' : 'ai', t: m.r === 'you' ? m.t : (m.raw || m.d.reply) }; });
  }
  function ask(startPrompt) {
    busy = true; err = ''; render();
    var h = history(); if (!h.length || h[h.length - 1].r !== 'user') h.push({ r: 'user', t: startPrompt || 'Begin.' });
    return AI.ask(h, system(), { temp: 0.7, max: 900 }).then(function (t) {
      var d = parse(AI.takeMemory(t));
      msgs().push({ id: u.uid(), r: 'ai', d: d, raw: JSON.stringify({ reply: d.reply, en: d.en }) });
      if (d.fix) { S.fixes.push({ id: u.uid(), lang: S.lang, wrong: d.fix.wrong, right: d.fix.right, why: d.fix.why, d: today() }); }
      busy = false; msgs().splice(0, Math.max(0, msgs().length - 80)); save(); if (V.view() === 'lang') render();
    }, function (e) { busy = false; err = e.message; if (V.view() === 'lang') render(); });
  }
  function send(text) {
    text = String(text || '').trim(); if (!text || busy) return;
    var m = { id: u.uid(), r: 'you', t: text.slice(0, 400) }; msgs().push(m); input = ''; mark(1); save();
    V.emit('lang.turn', { ref: m.id });
    ask();
  }
  function startScene(label) {
    msgs().push({ id: u.uid(), r: 'sys', t: label }); save();
    ask(S.mode === 'role' ? 'Start the scene.' : S.mode === 'teach' ? 'Start the first lesson.' : 'Greet me and ask one easy question.');
  }

  /* ---------- words ---------- */
  function haveWord(w) { return S.words.some(function (x) { return x.lang === S.lang && x.w.toLowerCase() === w.toLowerCase(); }); }
  function addWord(w, r, en) { if (haveWord(w)) return false; S.words.push({ id: u.uid(), lang: S.lang, w: w, r: r || '', en: en, box: 0, due: today() }); save(); return true; }
  function grade(id, good) {
    var w = S.words.filter(function (x) { return x.id === id; })[0]; if (!w) return;
    w.box = good ? Math.min(5, w.box + 1) : 0; var d = new Date(); d.setDate(d.getDate() + BOX[w.box]); w.due = u.iso(d);
    mark(1); save(); V.emit('lang.review', { ref: id + ':' + today() });
  }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function newQuiz() {
    var ws = myWords(); if (ws.length < 4) return null;
    var picks = shuffle(ws).slice(0, 5);
    return { i: 0, ok: 0, done: false, ans: null, qs: picks.map(function (w) {
      var others = shuffle(ws.filter(function (x) { return x.id !== w.id && x.en !== w.en; })).slice(0, 3).map(function (x) { return x.en; });
      return { id: w.id, w: w.w, r: w.r, en: w.en, opts: shuffle(others.concat([w.en])) };
    }) };
  }

  /* ---------- screens ---------- */
  function setup() {
    var lg = S.lang || '';
    return bar(u.BACK_TOOLS, 'Language buddy') +
      '<div class="card pad"><div class="eyebrow">Pick a language</div><div class="chips" style="margin-top:10px">' + LANGS.map(function (l) { return '<button class="tag' + (lg === l[0] ? ' on' : '') + '" data-act="lb-lang" data-id="' + l[0] + '" aria-pressed="' + (lg === l[0]) + '">' + l[0] + '</button>'; }).join('') + '</div></div>' +
      '<div class="card pad"><div class="eyebrow">Your level</div><div class="chips" style="margin-top:10px">' + LEVELS.map(function (l) { return '<button class="tag' + (S.level === l[0] ? ' on' : '') + '" data-act="lb-level" data-id="' + l[0] + '" aria-pressed="' + (S.level === l[0]) + '">' + l[1] + '</button>'; }).join('') + '</div><p class="note" style="margin-top:8px">' + esc(LEVELS.filter(function (l) { return l[0] === S.level; })[0][2]) + '</p></div>' +
      '<div class="card pad"><div class="eyebrow">Why are you learning it? (optional)</div><div class="chips" style="margin-top:10px">' + GOALS.map(function (g) { return '<button class="tag' + (S.goal === g ? ' on' : '') + '" data-act="lb-goal" data-id="' + g + '" aria-pressed="' + (S.goal === g) + '">' + g + '</button>'; }).join('') + '</div></div>' +
      '<div class="card pad"><div class="eyebrow">Daily goal</div><div class="chips" style="margin-top:10px">' + [3, 5, 10, 20].map(function (n) { return '<button class="tag' + (S.goalN === n ? ' on' : '') + '" data-act="lb-goaln" data-id="' + n + '" aria-pressed="' + (S.goalN === n) + '">' + n + ' a day</button>'; }).join('') + '</div></div>' +
      '<button class="btn2 main" data-act="lb-go"' + (lg ? '' : ' disabled style="opacity:.4"') + '>' + (S.ready ? 'Save' : 'Start talking') + '</button>';
  }
  function aiBubble(m, last) {
    var d = m.d, i = info(), h = '';
    h += '<div style="display:flex;gap:8px;align-items:flex-start"><div style="flex:1;min-width:0"><div style="font-size:18px;line-height:1.4">' + esc(d.reply) + '</div>' +
      (d.reading ? '<div class="sub" style="margin-top:3px;font-style:italic">' + esc(d.reading) + '</div>' : '') +
      (d.en ? '<div class="sub" style="margin-top:5px">' + esc(d.en) + '</div>' : '') + '</div>' +
      '<button class="icon-btn" data-act="lb-say" data-id="' + esc(m.id) + '" aria-label="Hear it" style="flex:none">' + ic('volume') + '</button></div>';
    if (d.fix) h += '<div style="margin-top:10px;padding:9px 11px;border-radius:12px;border:1px solid var(--card-line);background:rgba(120,180,120,.12)"><div class="eyebrow" style="margin-bottom:4px">A small fix</div>' +
      (d.fix.wrong ? '<div style="text-decoration:line-through;opacity:.65">' + esc(d.fix.wrong) + '</div>' : '') + '<div><b>' + esc(d.fix.right) + '</b></div>' + (d.fix.why ? '<div class="sub">' + esc(d.fix.why) + '</div>' : '') + '</div>';
    if (d.words.length) h += '<div style="margin-top:10px;display:flex;flex-direction:column;gap:6px">' + d.words.map(function (w, k) {
      var has = haveWord(w.w);
      return '<div style="display:flex;gap:8px;align-items:center"><div style="flex:1;min-width:0"><b>' + esc(w.w) + '</b>' + (w.r ? ' <span class="sub">' + esc(w.r) + '</span>' : '') + '<div class="sub">' + esc(w.en) + '</div></div>' +
        '<button class="tag' + (has ? ' on' : '') + '" data-act="lb-save" data-id="' + esc(m.id) + ':' + k + '"' + (has ? ' disabled' : '') + '>' + (has ? 'Saved' : 'Save') + '</button></div>';
    }).join('') + '</div>';
    return h;
  }
  function chatTab() {
    var list = msgs(), last = list[list.length - 1], out = '';
    list.forEach(function (m) {
      if (m.r === 'sys') out += '<div class="note" style="align-self:center;text-align:center">' + esc(m.t) + '</div>';
      else if (m.r === 'you') out += '<div class="msg you">' + esc(m.t) + '</div>';
      else out += '<div class="msg ai" style="max-width:94%">' + aiBubble(m) + '</div>';
    });
    if (busy) out += '<div class="msg ai typing"><i></i><i></i><i></i></div>';
    if (err) out += '<div class="msg err">' + esc(err) + ' <button class="link" data-act="lb-retry">Try again</button></div>';
    var hints = !busy && last && last.r === 'ai' && last.d.hints.length ? '<div class="chips" style="margin:10px 0 0">' + last.d.hints.map(function (h, k) { return '<button class="tag" data-act="lb-hint" data-id="' + k + '">' + esc(h) + '</button>'; }).join('') + '</div>' : '';
    var helpers = !busy && last && last.r === 'ai' ? '<div class="chips" style="margin:8px 0 0"><button class="tag" data-act="lb-help" data-id="explain">Explain this</button><button class="tag" data-act="lb-help" data-id="slow">Simpler please</button><button class="tag" data-act="lb-help" data-id="again">Say it another way</button></div>' : '';
    var modes = '<div class="chips" style="margin-bottom:8px">' + [['chat', 'Free chat'], ['role', 'Role-play'], ['teach', 'Teach me']].map(function (x) { return '<button class="tag' + (S.mode === x[0] ? ' on' : '') + '" data-act="lb-mode" data-id="' + x[0] + '" aria-pressed="' + (S.mode === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>' +
      (S.mode === 'role' ? '<div class="chips" style="margin-bottom:8px">' + SCENES.map(function (c) { return '<button class="tag' + (S.scene === c ? ' on' : '') + '" data-act="lb-scene" data-id="' + c + '" aria-pressed="' + (S.scene === c) + '">' + c + '</button>'; }).join('') + '</div>' : '');
    return modes + '<div class="msgs" id="lbList">' + (list.length || busy ? out : '<p class="note">Say hi in ' + esc(S.lang) + ', or write in English and Vel will show you how to say it.</p>') + '</div>' + hints + helpers +
      '<form class="form chatbox" id="lbForm" novalidate><input class="field" id="lbIn" maxlength="400" placeholder="Write in ' + esc(S.lang) + ' (or English)" aria-label="Message" autocomplete="off" value="' + esc(input) + '"' + (busy ? ' disabled' : '') + '>' +
      (SR ? '<button class="icon-btn' + (listening ? ' warn' : '') + '" type="button" data-act="lb-mic" aria-label="Speak">' + ic('mic') + '</button>' : '') +
      '<button class="add" type="submit"' + (busy ? ' disabled' : '') + '>Send</button></form>';
  }
  function wordsTab() {
    var ws = myWords(), dn = due().length, h = '';
    if (flash) {
      var w = myWords().filter(function (x) { return x.id === flash.id; })[0];
      if (!w) { flash = null; return wordsTab(); }
      return '<div class="card pad" style="text-align:center"><div class="eyebrow">Card ' + (flash.n + 1) + ' of ' + flash.total + '</div><div style="font-size:30px;margin:16px 0 4px">' + esc(w.w) + '</div>' + (w.r ? '<div class="sub" style="font-style:italic">' + esc(w.r) + '</div>' : '') +
        '<button class="btn2" style="margin-top:12px" data-act="lb-say-word" data-id="' + w.id + '">Hear it</button>' +
        (flash.show ? '<div style="font-size:20px;margin:16px 0"><b>' + esc(w.en) + '</b></div><div class="chips" style="justify-content:center"><button class="btn2" data-act="lb-miss" data-id="' + w.id + '">Missed it</button><button class="btn2 main" data-act="lb-got" data-id="' + w.id + '">Got it</button></div>'
          : '<button class="btn2 main" style="margin-top:16px" data-act="lb-reveal">Show meaning</button>') + '</div><button class="link" data-act="lb-stop">Stop reviewing</button>';
    }
    if (Q) return quizView();
    h += '<div class="card hero"><span class="chip">' + ic('book') + '</span><h2>' + ws.length + ' saved word' + (ws.length === 1 ? '' : 's') + '</h2><p>' + (dn ? dn + ' ready to review today.' : ws.length ? 'Nothing due today. Nice.' : 'Tap Save on a word in the chat and it lands here.') + '</p></div>';
    h += '<div class="chips"><button class="btn2 main" data-act="lb-review"' + (dn ? '' : ' disabled style="opacity:.4"') + '>Review ' + dn + '</button><button class="btn2" data-act="lb-quiz"' + (ws.length >= 4 ? '' : ' disabled style="opacity:.4"') + '>Quiz me</button></div>' + (ws.length < 4 ? '<p class="note">Save 4 words to unlock the quiz.</p>' : '');
    if (ws.length) h += '<div class="eyebrow" style="margin-top:14px">Your words</div><ul class="list">' + ws.slice().reverse().slice(0, 60).map(function (w) {
      return '<li class="card row"><span class="txt"><div class="nm">' + esc(w.w) + (w.r ? ' <span class="sub">' + esc(w.r) + '</span>' : '') + '</div><div class="sub">' + esc(w.en) + ' · level ' + (w.box + 1) + ' of 6</div></span><button class="icon-btn" data-act="lb-say-word" data-id="' + w.id + '" aria-label="Hear it">' + ic('volume') + '</button><button class="icon-btn" data-act="lb-del" data-id="' + w.id + '" aria-label="Remove">' + ic('trash') + '</button></li>';
    }).join('') + '</ul>';
    var fx = S.fixes.filter(function (f) { return f.lang === S.lang; }).slice(-8).reverse();
    if (fx.length) h += '<div class="eyebrow" style="margin-top:14px">Your recent mistakes</div><ul class="list">' + fx.map(function (f) {
      return '<li class="card row"><span class="txt"><div class="sub" style="text-decoration:line-through">' + esc(f.wrong) + '</div><div class="nm">' + esc(f.right) + '</div><div class="sub">' + esc(f.why) + '</div></span></li>';
    }).join('') + '</ul>';
    return h;
  }
  function quizView() {
    if (Q.done) return '<div class="card hero"><span class="chip">' + ic('trophy') + '</span><h2>' + Q.ok + ' of ' + Q.qs.length + '</h2><p>' + (Q.ok === Q.qs.length ? 'Perfect round.' : Q.ok >= 3 ? 'Good work. The tricky ones will come back.' : 'Keep going, they will stick.') + '</p></div><button class="btn2 main" data-act="lb-quiz">Another round</button><button class="link" data-act="lb-stop">Back to words</button>';
    var q = Q.qs[Q.i];
    return '<div class="card pad"><div class="eyebrow">Question ' + (Q.i + 1) + ' of ' + Q.qs.length + '</div><div style="font-size:28px;margin:12px 0 2px;text-align:center">' + esc(q.w) + '</div>' + (q.r ? '<div class="sub" style="text-align:center;font-style:italic">' + esc(q.r) + '</div>' : '') +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">' + q.opts.map(function (o, k) {
        var st = Q.ans == null ? '' : o === q.en ? ' main' : (Q.ans === k ? ' warn' : '');
        return '<button class="btn2' + st + '" data-act="lb-pick" data-id="' + k + '"' + (Q.ans != null ? ' disabled' : '') + '>' + esc(o) + '</button>';
      }).join('') + '</div>' + (Q.ans != null ? '<button class="btn2 main" style="margin-top:12px" data-act="lb-next">' + (Q.i + 1 < Q.qs.length ? 'Next' : 'See score') + '</button>' : '') + '</div><button class="link" data-act="lb-stop">Stop</button>';
  }
  function render() {
    var el = $('v-lang'); if (!el) return;
    if (!AI.hasKey()) { el.innerHTML = bar(u.BACK_TOOLS, 'Language buddy') + '<div class="card hero"><span class="chip">' + ic('spark') + '</span><h2>Add your free key</h2><p>Vel runs on a free AI key that you paste once. It takes about two minutes and stays on this phone.</p></div><button class="btn2 main" data-act="go" data-to="aikey">Set it up</button>'; return; }
    if (!S.ready || tab === 'setup') { el.innerHTML = setup(); return; }
    var t = today(), done = S.days[t] | 0, goal = S.goalN, pct = Math.min(100, Math.round(done / goal * 100)), sk = streak();
    var extra = '<button class="icon-btn" style="margin-left:auto" data-act="lb-tab" data-id="setup" aria-label="Settings">' + ic('settings') + '</button>';
    var head = '<div class="card pad" style="padding:10px 14px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap"><b>' + esc(S.lang) + '</b><span class="sub">' + (sk ? sk + ' day streak · ' : '') + 'Today ' + done + ' of ' + goal + '</span></div><div style="height:6px;border-radius:4px;background:var(--card-line);margin-top:8px;overflow:hidden"><div style="width:' + pct + '%;height:100%;background:var(--accent)"></div></div></div>';
    var tabs = '<div class="chips" style="margin:10px 0" role="tablist">' + [['chat', 'Chat'], ['words', 'Words' + (due().length ? ' (' + due().length + ')' : '')]].map(function (x) { return '<button class="tag' + (tab === x[0] ? ' on' : '') + '" data-act="lb-tab" data-id="' + x[0] + '" aria-pressed="' + (tab === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div>';
    el.innerHTML = bar(u.BACK_TOOLS, 'Language buddy', extra) + head + tabs + (tab === 'words' ? wordsTab() : chatTab());
    if (tab === 'chat') { var l = $('lbList'); if (l && l.lastElementChild) l.lastElementChild.scrollIntoView({ block: 'end' }); }
  }
  V.registerTool('lang', function () { tab = 'chat'; render(); });

  /* ---------- actions ---------- */
  function nthWord(ref) { var p = ref.split(':'), m = msgs().filter(function (x) { return x.id === p[0]; })[0]; return m && m.d && m.d.words[+p[1]]; }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'); if (a.indexOf('lb-') !== 0) return;
    var id = t.getAttribute('data-id'); a = a.slice(3);
    if (a === 'lang') { S.lang = id; save(); render(); }
    else if (a === 'level') { S.level = id; save(); render(); }
    else if (a === 'goal') { S.goal = S.goal === id ? '' : id; save(); render(); }
    else if (a === 'goaln') { S.goalN = +id; save(); render(); }
    else if (a === 'go') { if (!S.lang) return; var first = !S.ready || !msgs().length; S.ready = true; tab = 'chat'; save(); if (first) ask('Greet me and ask one easy question.'); else render(); }
    else if (a === 'tab') { tab = id; Q = null; flash = null; render(); }
    else if (a === 'mode') { if (S.mode === id) return; S.mode = id; save(); startScene(id === 'role' ? 'Role-play: ' + S.scene : id === 'teach' ? 'Lesson mode' : 'Free chat'); }
    else if (a === 'scene') { S.scene = id; S.mode = 'role'; save(); startScene('Role-play: ' + id); }
    else if (a === 'say') { var m = msgs().filter(function (x) { return x.id === id; })[0]; if (m) speak(m.d.reply, info()[1]); }
    else if (a === 'say-word') { var w = S.words.filter(function (x) { return x.id === id; })[0]; if (w) speak(w.w, info()[1]); }
    else if (a === 'save') { var nw = nthWord(id); if (nw && addWord(nw.w, nw.r, nw.en)) { V.toast('Saved: ' + nw.w); render(); } }
    else if (a === 'hint') { var last = msgs()[msgs().length - 1]; if (last && last.d && last.d.hints[+id]) send(last.d.hints[+id]); }
    else if (a === 'help') { send(id === 'explain' ? 'Please explain your last message in English, and any grammar in it.' : id === 'slow' ? 'Please say that again in simpler ' + S.lang + '.' : 'Please say that another way.'); }
    else if (a === 'retry') { ask(); }
    else if (a === 'mic') { listen(); }
    else if (a === 'del') { S.words = S.words.filter(function (x) { return x.id !== id; }); save(); render(); }
    else if (a === 'review') { var dd = due(); if (!dd.length) return; flash = { ids: shuffle(dd).slice(0, 15).map(function (x) { return x.id; }), n: 0, show: false }; flash.total = flash.ids.length; flash.id = flash.ids[0]; render(); }
    else if (a === 'reveal') { flash.show = true; render(); }
    else if (a === 'got' || a === 'miss') { grade(id, a === 'got'); flash.n++; if (flash.n >= flash.total) { flash = null; V.toast('Review done.'); } else { flash.id = flash.ids[flash.n]; flash.show = false; } render(); }
    else if (a === 'stop') { flash = null; Q = null; render(); }
    else if (a === 'quiz') { Q = newQuiz(); render(); }
    else if (a === 'pick') { var q = Q.qs[Q.i]; if (Q.ans != null) return; Q.ans = +id; if (q.opts[+id] === q.en) { Q.ok++; mark(1); V.emit('lang.review', { ref: q.id + ':' + today() }); } save(); render(); }
    else if (a === 'next') { if (Q.i + 1 < Q.qs.length) { Q.i++; Q.ans = null; } else Q.done = true; render(); }
  });
  document.addEventListener('submit', function (e) { if (e.target.id !== 'lbForm') return; e.preventDefault(); send($('lbIn').value); });
  document.addEventListener('input', function (e) { if (e.target.id === 'lbIn') input = e.target.value; });

  V.lang = { words: function () { return S.words.length; } };
})();
