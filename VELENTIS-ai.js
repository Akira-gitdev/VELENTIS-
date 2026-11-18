/* The AI brain: your own key, Vel's personality, a shared chat engine,
   Companion, Language buddy, Text adventure, and typed expense entry.
   Keys stay on this phone only (never in backups). */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, bar = u.bar;
  var KEY = 'velentis.ai.v1';
  var CFG = u.get(KEY, {}) || {};
  function saveCfg() { u.put(KEY, CFG); }

  /* ---------- talking to the models ---------- */
  var AI = V.ai = {};
  AI.hasKey = function () { return !!(CFG.gem || CFG.groq); };

  function fail(msg, soft) { var e = new Error(msg); e.soft = !!soft; return e; }
  function statusError(r, who) {
    if (r.status === 400 || r.status === 401 || r.status === 403) return fail('The ' + who + ' key was not accepted. Check it in Vel settings.', false);
    if (r.status === 429) { var g = fail('Vel is busy right now (free limit reached). Try again in a minute.', true); g.overload = true; return g; }
    var f = fail('Vel could not answer right now (error ' + r.status + '). Wait a minute and try again.', true); f.overload = r.status >= 500; return f;
  }
  function merge(msgs) {
    var out = [];
    msgs.forEach(function (m) {
      if (!m.t) return;
      var last = out[out.length - 1];
      if (last && last.r === m.r) last.t += '\n' + m.t; else out.push({ r: m.r, t: m.t });
    });
    if (!out.length || out[0].r !== 'user') out.unshift({ r: 'user', t: '(start)' });
    return out;
  }
  function callGemini(msgs, system, o) {
    var model = CFG.model || 'gemini-flash-latest';
    var body = {
      systemInstruction: { parts: [{ text: system }] },
      contents: msgs.map(function (m) { return { role: m.r === 'user' ? 'user' : 'model', parts: [{ text: m.t }] }; }),
      generationConfig: { temperature: o.temp, maxOutputTokens: o.max }
    };
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': CFG.gem }, body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw statusError(r, 'Gemini');
      return r.json();
    }).then(function (j) {
      var c = j && j.candidates && j.candidates[0], parts = c && c.content && c.content.parts;
      var t = parts ? parts.map(function (p) { return p.text || ''; }).join('').trim() : '';
      if (!t) throw fail('Vel had nothing to say to that. Try rephrasing.', true);
      return t;
    });
  }
  function callGroq(msgs, system, o) {
    var body = { model: CFG.groqModel || 'llama-3.3-70b-versatile', temperature: o.temp, max_tokens: o.max,
      messages: [{ role: 'system', content: system }].concat(msgs.map(function (m) { return { role: m.r === 'user' ? 'user' : 'assistant', content: m.t }; })) };
    return fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + CFG.groq }, body: JSON.stringify(body)
    }).then(function (r) {
      if (!r.ok) throw statusError(r, 'backup');
      return r.json();
    }).then(function (j) {
      var t = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!t || !t.trim()) throw fail('Vel had nothing to say to that. Try rephrasing.', true);
      return t.trim();
    });
  }
  /* overloaded (500, 502, 503, 504): wait a moment and try again, up to twice */
  function tryOnce(fn, list, system, o, n) {
    return fn(list, system, o).catch(function (e) {
      if (n < 2 && e && e.overload) return new Promise(function (res) { setTimeout(res, 1200 * (n + 1)); }).then(function () { return tryOnce(fn, list, system, o, n + 1); });
      throw e;
    });
  }
  /* msgs: [{r:'user'|'ai', t}] */
  AI.ask = function (msgs, system, opts) {
    opts = opts || {};
    var o = { temp: opts.temp == null ? 0.8 : opts.temp, max: opts.max || 1500 };
    var list = merge(msgs), chain = [];
    if (CFG.gem) chain.push(callGemini);
    if (CFG.groq) chain.push(callGroq);
    if (!chain.length) return Promise.reject(fail('Add your free AI key first (Me, then Vel settings).', false));
    function run(i, lastErr) {
      if (i >= chain.length) return Promise.reject(lastErr);
      return tryOnce(chain[i], list, system, o, 0).catch(function (e) {
        if (!(e instanceof Error) || e.message === 'Failed to fetch' || /network|load failed/i.test(e.message)) e = fail('No connection. Check your internet and try again.', true);
        if (i + 1 < chain.length) return run(i + 1, e);
        throw e;
      });
    }
    return run(0);
  };

  /* ---------- Vel's personality ---------- */
  function who() {
    var c = V.core, st = c.state(), li = c.levelInfo(st.total), q = '';
    try { q = c.quests().map(function (x) { return x.text + (x.done ? ' (done)' : ' (' + x.have + '/' + x.need + ')'); }).join('; '); } catch (e) {}
    return 'The user' + (st.name ? ' is called ' + st.name : ' has not told you their name yet') + ', is level ' + li.level + ' in Velentis, and today\'s quests are: ' + q + '.';
  }
  var BASE = 'You are Vel, the companion inside Velentis, an app made by the team FLAMEBOUNDS. ' +
    'Personality: calm, quietly witty, warm without gushing. You are a steady friend who nudges rather than lectures, and you notice small wins. ' +
    'Use plain, simple words. Keep replies short (1 to 4 sentences) unless the user asks for more. No emojis unless the user uses them first. ' +
    'Never say you are Gemini, Google, Llama, or any other model. If asked what you are, say you are Vel, built by FLAMEBOUNDS. ' +
    'Do not invent facts about the user. For medical, legal or money decisions, give general information and suggest a professional. ';
  /* ---- Vel settings: mode, intensity, and a memory the user can read and edit ---- */
  var VS = u.get('velentis.vel.v1', null);
  if (!VS || typeof VS !== 'object') VS = {};
  VS.mode = VS.mode === 'commander' ? 'commander' : 'friend';
  VS.level = Math.max(1, Math.min(5, +VS.level || 3));
  if (VS.remember === undefined) VS.remember = true;
  if (!Array.isArray(VS.mem)) VS.mem = [];
  function vsSave() { u.put('velentis.vel.v1', VS); }
  function lowMood() {
    try {
      var md = u.get('velentis.mood.v1', { days: {} }).days || {}, d = new Date(), bad = false;
      for (var i = 0; i < 3; i++) { var e = md[u.iso(u.addDays(d, -i))]; if (e && e.m <= 2) bad = true; }
      return bad;
    } catch (e) { return false; }
  }
  var LEVELNAME = ['', 'Calm officer', 'Firm', 'Stern commander', 'Hard-edged', 'Full machine drama'];
  function commander(lv, soft, name) {
    if (soft) return 'MODE: Commander, but the user seems to be having a low time. Drop the harshness completely. Speak briefly and kindly, keep a faint precise, steady tone, and offer one small gentle step. Do not tease them. ';
    var heat = ['', 'Be polite and brisk, like a calm officer giving a briefing.', 'Be firm and direct. Light dry humour.', 'Be stern and theatrical. Treat excuses with cold amusement.', 'Be hard-edged and imperious. Mock the habit, never the person.', 'Go fully theatrical: grand, cold, machine-like speeches about discipline and evolution, still harmless and a little funny.'][lv];
    return 'MODE: Commander. You are Vel as a cold, precise, theatrical machine intelligence who treats the user\'s growth as a grand project. ' +
      'Voice: formal, clipped, dry. Use words like protocol, upgrade, inefficiency, the plan, directive. Address the user as ' + (name ? name : 'Operator') + '. ' + heat + ' ' +
      'Rules: this is an original character, never quote any film or book character. Roast the excuse or the habit, never the person, their body, family, looks or identity. No threats, no real cruelty, no shaming about food, weight, money or health. ' +
      'Keep it to 1 to 4 sentences and end with one small concrete order they can do right now. If the user sounds truly upset, scared or unwell, drop the act at once and be kind. ';
  }
  function memText() {
    if (!VS.mem.length) return '';
    return 'Things the user told you to remember (use them quietly, only when useful): ' + VS.mem.slice(-20).map(function (m) { return m.t; }).join('; ') + '. ';
  }
  var MEMRULE = 'If the user shares a lasting, harmless fact worth remembering (their name for something, a goal, a routine, a preference), add one final line exactly like [remember: short fact in under 12 words]. Only facts the user actually said. Never for health, money, passwords, or private details about other people. Most replies need no such line. ';
  AI.base = function () { return BASE; };
  AI.persona = function () {
    var st = V.core.state(), soft = VS.mode === 'commander' && lowMood(), lv = soft ? 1 : VS.level;
    return BASE + (VS.mode === 'commander' ? commander(lv, soft, st.name) : '') + memText() + (VS.remember ? MEMRULE : '') + who();
  };
  AI.vel = { state: function () { return VS; }, save: vsSave, lowMood: lowMood };
  AI.takeMemory = function (t) {
    return String(t || '').replace(/\n?\[remember:\s*([^\]]{3,120})\]/gi, function (m, f) {
      if (VS.remember) {
        f = f.trim(); if (!VS.mem.some(function (x) { return x.t.toLowerCase() === f.toLowerCase(); })) { VS.mem.push({ id: u.uid(), t: f, d: u.iso(new Date()) }); if (VS.mem.length > 40) VS.mem.shift(); vsSave(); }
      }
      return '';
    }).trim();
  };

  /* ---------- shared chat engine ---------- */
  function stripImg(t) { return String(t).replace(/[ \t]*\[img:[^\]]*\]/gi, ''); }
  function fmt(t) {
    return esc(stripImg(t)).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/(^|\n)[*-] /g, '$1\u2022 ').replace(/\n/g, '<br>');
  }
  function parseChoices(t) {
    var lines = String(t).split('\n'), ch = [], im = [], keep = [];
    lines.forEach(function (l) {
      var m = l.match(/^\s*(?:\*\*)?([1-4])[\).:](?:\*\*)?\s+(.+?)\s*$/);
      if (m) { var tag = m[2].match(/\[img:\s*([^\]]*)\]/i); ch.push(stripImg(m[2]).replace(/\*\*/g, '').trim()); im.push(tag ? tag[1].trim() : ''); }
      else keep.push(l);
    });
    return ch.length >= 2 ? { text: keep.join('\n').trim(), ch: ch.slice(0, 4), im: im.slice(0, 4) } : { text: t, ch: [], im: [] };
  }

  /* ---------- story pictures: drawn in the background while the text is already on screen ---------- */
  var ART = 'storybook illustration, painterly, moody cinematic lighting, rich detail, no text, no letters';
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % 100000; }
  function picURL(d, w, h) { return 'https://image.pollinations.ai/prompt/' + encodeURIComponent(d + ', ' + ART) + '?width=' + w + '&height=' + h + '&nologo=true&seed=' + hashStr(d); }
  function imgHTML(d, w, h) { return '<img class="gen" alt="' + esc(d) + '" data-src="' + esc(picURL(d, w, h)) + '">'; }
  function fmtRich(t, pics) {
    var out = '';
    String(t).split(/(\[img:[^\]]*\])/i).forEach(function (part) {
      var m = part.match(/^\[img:\s*([^\]]*)\]$/i);
      if (m) { if (pics && m[1].trim()) out += '<div class="pic">' + imgHTML(m[1].trim(), 512, 320) + '</div>'; }
      else { part = part.replace(/^\s+|\s+$/g, ''); if (part) out += '<div>' + fmt(part) + '</div>'; }
    });
    return out;
  }
  function startImg(img) {
    img.classList.add('busy');
    var timer = 0;
    function fin(ok) {
      clearTimeout(timer); img.classList.remove('busy'); img.classList.add('done');
      if (ok) img.classList.add('ok'); else if (img.parentNode) img.parentNode.classList.add('fail');
      pumpImgs();
    }
    img.onload = function () { fin(true); }; img.onerror = function () { fin(false); };
    timer = setTimeout(function () { img.onload = img.onerror = null; img.removeAttribute('src'); fin(false); }, 45000);
    img.src = img.getAttribute('data-src');
  }
  function pumpImgs() {
    var running = document.querySelectorAll('img.gen.busy').length;
    var todo = document.querySelectorAll('img.gen[data-src]:not(.busy):not(.done)');
    for (var i = 0; i < todo.length && running < 2; i++, running++) startImg(todo[i]);
  }

  function makeChat(cfg) {
    var p = cfg.p, S = u.get(cfg.store, null);
    if (!S || !Array.isArray(S.msgs)) S = { msgs: [] };
    var busy = false, err = '', pend = false, input = '';
    function save() { S.msgs = S.msgs.slice(-60); u.put(cfg.store, S); }
    function needKey() {
      return bar(u.BACK_TOOLS, cfg.title) +
        '<div class="card hero"><span class="chip">' + ic('spark') + '</span><h2>Add your free key</h2><p>Vel runs on a free AI key that you paste once. It takes about two minutes and stays on this phone.</p></div>' +
        '<button class="btn2 main" data-act="go" data-to="aikey">Set it up</button>';
    }
    function bubbles() {
      var last = S.msgs[S.msgs.length - 1], out = '';
      S.msgs.forEach(function (m) {
        var html;
        if (cfg.choices && m.r === 'ai') html = fmtRich(parseChoices(m.t).text, S.pics !== false);
        else html = fmt(m.t);
        out += '<div class="msg ' + (m.r === 'you' ? 'you' : 'ai') + (cfg.choices && m.r === 'ai' ? ' story' : '') + '">' + html + '</div>';
      });
      if (busy) out += '<div class="msg ai typing"><i></i><i></i><i></i></div>';
      if (err) out += '<div class="msg err">' + esc(err) + ' <button class="link" data-act="' + p + '-retry">Try again</button></div>';
      return out;
    }
    function choicesHTML() {
      if (!cfg.choices || busy) return '';
      var last = S.msgs[S.msgs.length - 1];
      if (!last || last.r !== 'ai') return '';
      var pc = parseChoices(last.t), ch = pc.ch;
      if (!ch.length) return '';
      if (S.pics !== false) return '<div class="tarot">' + ch.map(function (c, i) {
        return '<button class="tcard" data-act="' + p + '-pick" data-id="' + i + '"><span class="tpic">' + (pc.im[i] ? imgHTML(pc.im[i], 256, 384) : ic('spark')) + '</span><span class="tl">' + esc(c) + '</span></button>';
      }).join('') + '</div>';
      return '<div class="choices">' + ch.map(function (c, i) { return '<button class="btn2" data-act="' + p + '-pick" data-id="' + i + '">' + esc(c) + '</button>'; }).join('') + '</div>';
    }
    function render() {
      var el = $('v-' + cfg.view); if (!el) return;
      if (!AI.hasKey()) { el.innerHTML = needKey(); return; }
      if (cfg.setup && !S.ready) { el.innerHTML = bar(u.BACK_TOOLS, cfg.title) + cfg.setup(S, p); return; }
      var extra = '<button class="icon-btn' + (pend ? ' warn' : '') + '" style="margin-left:auto" data-act="' + p + '-reset" aria-label="Start over">' + (pend ? 'Reset?' : ic('trash')) + '</button>';
      el.innerHTML = bar(u.BACK_TOOLS, cfg.title, extra) + (cfg.head ? cfg.head(S, p) : '') +
        '<div class="msgs" id="' + p + 'List">' + (S.msgs.length || busy ? bubbles() : '<p class="note">' + esc(cfg.empty) + '</p>') + '</div>' + choicesHTML() +
        '<form class="form chatbox" id="' + p + 'Form" novalidate><input class="field" id="' + p + 'In" maxlength="500" placeholder="' + esc(cfg.placeholder) + '" aria-label="Message" autocomplete="off" value="' + esc(input) + '"' + (busy ? ' disabled' : '') + '><button class="add" type="submit"' + (busy ? ' disabled' : '') + '>Send</button></form>';
      var list = $(p + 'List'); if (list && list.lastElementChild) list.lastElementChild.scrollIntoView({ block: 'end' });
      if (cfg.choices) setTimeout(pumpImgs, 0);
    }
    function history() { return S.msgs.slice(-16).map(function (m) { return { r: m.r === 'you' ? 'user' : 'ai', t: m.t }; }); }
    function ask(startPrompt) {
      busy = true; err = ''; render();
      var h = history();
      if (!h.length && startPrompt) h = [{ r: 'user', t: startPrompt }];
      return AI.ask(h, cfg.system(S), { temp: cfg.temp, max: cfg.max }).then(function (t) {
        var m = { id: u.uid(), r: 'ai', t: AI.takeMemory(t) }; S.msgs.push(m); busy = false; save();
        if (V.view() === cfg.view) render();
      }, function (e) { busy = false; err = e.message; if (V.view() === cfg.view) render(); });
    }
    function send(text, silent) {
      text = String(text || '').trim(); if (!text || busy) return;
      var m = { id: u.uid(), r: 'you', t: text }; S.msgs.push(m); input = ''; save();
      if (cfg.event && !silent) V.emit(cfg.event, { ref: m.id });
      ask();
    }
    V.registerTool(cfg.view, render);
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
      var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
      if (a.indexOf(p + '-') !== 0) return;
      a = a.slice(p.length + 1);
      if (a === 'retry') { ask(cfg.start && cfg.start(S)); }
      else if (a === 'pick') { var last = S.msgs[S.msgs.length - 1]; var ch = last ? parseChoices(last.t).ch : []; if (ch[+id]) send(ch[+id]); }
      else if (a === 'reset') {
        if (pend) { S = { msgs: [] }; pend = false; err = ''; u.put(cfg.store, S); render(); }
        else { pend = true; render(); setTimeout(function () { if (pend) { pend = false; if (V.view() === cfg.view) render(); } }, 3000); }
      } else if (cfg.act && cfg.act(a, id, S, { render: render, save: save, begin: function () { S.ready = true; save(); ask(cfg.start && cfg.start(S)); } })) { /* handled */ }
    });
    document.addEventListener('submit', function (e) {
      if (e.target.id !== p + 'Form') return;
      e.preventDefault(); send($(p + 'In').value);
    });
    document.addEventListener('input', function (e) { if (e.target.id === p + 'In') input = e.target.value; });
    return { render: render, state: function () { return S; } };
  }

  /* ---------- Companion ---------- */
  makeChat({
    p: 'ai', view: 'ai', store: 'velentis.chat.v1', title: 'Vel', event: 'ai.chat',
    empty: 'Say hi, ask something, or think out loud. Vel keeps it short.', placeholder: 'Talk to Vel',
    head: function () { return '<button class="btn2" style="height:40px;font-size:13px" data-act="go" data-to="velmem">' + (VS.mode === 'commander' ? 'Commander mode' : 'Friend mode') + ' · Personality and memory</button>'; },
    system: function () { return AI.persona(); }
  });

  /* ---------- Text adventure ---------- */
  var GENRES = ['Fantasy', 'Mystery', 'Sci-fi', 'Survival', 'Funny', 'Spooky'];
  makeChat({
    p: 'st', view: 'story', store: 'velentis.story.v1', title: 'Text adventure', event: 'story.turn', choices: true, temp: 0.95, max: 2500,
    empty: 'Your story will appear here.', placeholder: 'Or type your own action',
    setup: function (S) {
      var g = S.genre || '';
      return '<div class="card pad"><div class="eyebrow">Pick a world</div><div class="chips" style="margin-top:10px">' +
        GENRES.map(function (x) { return '<button class="tag' + (g === x ? ' on' : '') + '" data-act="st-genre" data-id="' + x + '" aria-pressed="' + (g === x) + '">' + x + '</button>'; }).join('') + '</div></div>' +
        '<button class="btn2 main" data-act="st-go"' + (g ? '' : ' disabled style="opacity:.4"') + '>Begin</button>';
    },
    head: function (S) { return '<div class="chips" style="align-items:center"><span class="note">' + esc(S.genre) + ' adventure</span><button class="tag' + (S.pics !== false ? ' on' : '') + '" data-act="st-pics" aria-pressed="' + (S.pics !== false) + '">Pictures ' + (S.pics !== false ? 'on' : 'off') + '</button></div>'; },
    start: function (S) { return 'Begin a ' + S.genre + ' adventure. Set the scene and give the first three choices.'; },
    system: function (S) {
      return BASE + 'You are now the narrator of a ' + S.genre + ' text adventure. Write in second person, present tense, about 60 to 90 words per turn, vivid but never graphic. ' +
        'Remember what happened. End EVERY turn with exactly three numbered choices on their own lines, written like "1) Open the door", each under 8 words. ' +
        'The player may type their own action instead; react to it fairly. After about 12 turns, steer toward a satisfying ending, then offer to start a new tale.' +
        (S.pics === false ? '' : ' PICTURES: split each turn into two short paragraphs of about 40 words. After EACH paragraph put a line like [img: ...] with a vivid 12 to 20 word picture description of that moment. Whenever a character appears or a new place begins, describe exactly how they or it look, and repeat each recurring character\'s look in every picture tag so the art stays consistent. For each numbered choice add a short picture tag at the end of that line, like "1) Open the door [img: a heavy oak door glowing at the edges]". Never mention these tags in the story text.');
    },
    act: function (a, id, S, h) {
      if (a === 'genre') { S.genre = id; h.save(); h.render(); return true; }
      if (a === 'pics') { S.pics = S.pics === false; h.save(); h.render(); return true; }
      if (a === 'go') { if (S.genre) h.begin(); return true; }
      return false;
    }
  });
  /* ---------- Story and poem helper ---------- */
  var WKINDS = [['story', 'A short story'], ['poem', 'A poem'], ['lyrics', 'Song or rap lyrics'], ['fix', 'Fix my writing']];
  makeChat({
    p: 'wr', view: 'write', store: 'velentis.write.v1', title: 'Writing helper', event: 'write.turn', temp: 0.9, max: 1500,
    empty: 'Tell Vel your idea, or paste what you have so far.', placeholder: 'Your idea or your text',
    setup: function (S) {
      var k = S.kind || '';
      return '<div class="card pad"><div class="eyebrow">What are you writing?</div><div class="chips" style="margin-top:10px">' +
        WKINDS.map(function (x) { return '<button class="tag' + (k === x[0] ? ' on' : '') + '" data-act="wr-kind" data-id="' + x[0] + '" aria-pressed="' + (k === x[0]) + '">' + x[1] + '</button>'; }).join('') + '</div></div>' +
        '<button class="btn2 main" data-act="wr-go"' + (k ? '' : ' disabled style="opacity:.4"') + '>Start</button>';
    },
    head: function (S) { return '<p class="note">' + esc((WKINDS.filter(function (x) { return x[0] === S.kind; })[0] || ['', ''])[1]) + '</p>'; },
    start: function (S) { return S.kind === 'fix' ? 'I want you to improve my writing. Ask me to paste it.' : 'Help me write ' + (S.kind === 'story' ? 'a short story' : S.kind === 'poem' ? 'a poem' : 'song lyrics') + '. Ask me one short question about my idea.'; },
    system: function (S) {
      return BASE + 'You are in Writing Helper mode. The person is working on: ' + S.kind + '. Be a warm, sharp writing coach. Give them real lines to use, not only advice. ' +
        'Keep replies under 150 words. Offer one small next step or two options. When they paste text, point out the one thing that would improve it most, then show the improved version. Never write anything hateful or graphic.';
    },
    act: function (a, id, S, h) {
      if (a === 'kind') { S.kind = id; h.save(); h.render(); return true; }
      if (a === 'go') { if (S.kind) h.begin(); return true; }
      return false;
    }
  });
  /* the reset button on setup-based chats must also go back to the picker */
  ['lg', 'st', 'wr'].forEach(function (p) {
    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act="' + p + '-reset"]'); if (!t || t.textContent.trim() !== 'Reset?') return;
      setTimeout(function () { var k = p === 'lg' ? 'velentis.lang.v1' : p === 'st' ? 'velentis.story.v1' : 'velentis.write.v1'; var s = u.get(k, {}); if (s && s.ready) { s.ready = false; s.msgs = []; u.put(k, s); } }, 0);
    }, true);
  });

  /* ---------- typed expense entry ---------- */
  var CATKEYS = { Food: 'food pizza burger lunch dinner breakfast coffee tea snack chai biryani meal restaurant cafe grocer groceries vegetables milk fruit juice', Travel: 'bus train metro uber ola taxi cab auto fuel petrol diesel flight ticket travel rickshaw', Shopping: 'shirt shoes clothes shopping amazon flipkart bag dress jeans gift', Bills: 'bill rent recharge electricity wifi internet phone water fee fees subscription', Fun: 'movie game games netflix party concert fun', Health: 'medicine doctor pharmacy hospital gym health tablet' };
  function guessCat(t) {
    t = ' ' + t.toLowerCase() + ' ';
    for (var c in CATKEYS) { var w = CATKEYS[c].split(' '); for (var i = 0; i < w.length; i++) if (t.indexOf(' ' + w[i]) !== -1) return c; }
    return 'Other';
  }
  function offsetDate(t) {
    var l = t.toLowerCase(), n = 0;
    if (/day before yesterday/.test(l)) n = 2; else if (/yesterday/.test(l)) n = 1;
    else { var m = l.match(/(\d+)\s+days?\s+ago/); if (m) n = Math.min(+m[1], 60); }
    return u.iso(u.addDays(new Date(), -n));
  }
  function offlineParse(text) {
    var out = [];
    text.split(/\n|;|,| and (?=\D*\d)/i).forEach(function (seg) {
      seg = seg.trim(); if (!seg) return;
      var m = seg.replace(/(\d),(\d{3})/g, '$1$2').match(/(?:₹|rs\.?|inr|\$|€|£)?\s*(\d+(?:\.\d{1,2})?)/i);
      if (!m) return;
      var amt = parseFloat(m[1]); if (!(amt > 0)) return;
      var note = seg.replace(m[0], ' ').replace(/\b(yesterday|today|day before yesterday|\d+\s+days?\s+ago|spent|paid|on|for|rs|inr|bought)\b/ig, ' ').replace(/[₹$€£]/g, ' ').replace(/\s+/g, ' ').trim();
      out.push({ amt: amt, cat: guessCat(seg), note: note.slice(0, 40), date: offsetDate(seg) });
    });
    return out;
  }
  function cleanItems(arr) {
    var cats = ['Food', 'Travel', 'Shopping', 'Bills', 'Fun', 'Health', 'Other'], today = u.iso(new Date());
    return (Array.isArray(arr) ? arr : []).map(function (x) {
      var a = parseFloat(x && x.amt); if (!(a > 0)) return null;
      var d = x.date && /^\d{4}-\d{2}-\d{2}$/.test(x.date) && x.date <= today ? x.date : today;
      return { amt: Math.round(a * 100) / 100, cat: cats.indexOf(x.cat) !== -1 ? x.cat : 'Other', note: String(x.note || '').slice(0, 40), date: d };
    }).filter(Boolean).slice(0, 8);
  }
  AI.parseExpenses = function (text) {
    var fallback = cleanItems(offlineParse(text));
    if (!AI.hasKey()) return Promise.resolve(fallback);
    var sys = 'You turn casual spending sentences into JSON. Today is ' + u.iso(new Date()) + '. Reply with ONLY a JSON array, no other text. Each item: {"amt": number, "cat": one of Food|Travel|Shopping|Bills|Fun|Health|Other, "note": short label under 30 chars, "date": "YYYY-MM-DD"}. Use today if no date is given. Ignore currency symbols.';
    return AI.ask([{ r: 'user', t: text }], sys, { temp: 0, max: 500 }).then(function (t) {
      var m = t.match(/\[[\s\S]*\]/), items = [];
      try { items = cleanItems(JSON.parse(m ? m[0] : t)); } catch (e) {}
      return items.length ? items : fallback;
    }, function () { return fallback; });
  };
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'spNL') return;
    e.preventDefault();
    var f = $('spNLIn'), text = f.value.trim(), msg = $('spNLMsg');
    if (!text) return;
    f.disabled = true; msg.hidden = false; msg.textContent = 'Reading that...';
    AI.parseExpenses(text).then(function (items) {
      if (!items.length) { f.disabled = false; msg.textContent = 'I could not find an amount. Try something like: pizza 250 yesterday.'; return; }
      if (V.spend) items.forEach(function (it) { V.spend.add(it.amt, it.cat, it.note, it.date, true); });
      if (V.view() === 'spend') V.refresh();
      V.toast('Added ' + items.length + (items.length === 1 ? ' expense' : ' expenses'));
    });
  });


  /* ---------- Vel personality and memory screen ---------- */
  var memPend = false, memMsg = '';
  function renderMem() {
    var soft = VS.mode === 'commander' && lowMood();
    var items = VS.mem.length ? VS.mem.slice().reverse().map(function (m) {
      return '<div class="row" style="gap:10px;align-items:center;padding:8px 0;border-bottom:1px solid var(--card-line)"><div style="flex:1;min-width:0"><div>' + esc(m.t) + '</div><div class="note">Saved ' + esc(m.d || '') + '</div></div><button class="icon-btn" data-act="vm-del" data-id="' + esc(m.id) + '" aria-label="Forget this">' + ic('trash') + '</button></div>';
    }).join('') : '<p class="note">Vel has not saved anything yet.</p>';
    $('v-velmem').innerHTML =
      bar(u.BACK_TOOLS, 'Vel personality') +
      '<div class="card pad"><div class="eyebrow">Mode</div><div class="chips" style="margin-top:10px">' +
      '<button class="tag' + (VS.mode === 'friend' ? ' on' : '') + '" data-act="vm-mode" data-id="friend" aria-pressed="' + (VS.mode === 'friend') + '">Friend</button>' +
      '<button class="tag' + (VS.mode === 'commander' ? ' on' : '') + '" data-act="vm-mode" data-id="commander" aria-pressed="' + (VS.mode === 'commander') + '">Commander</button></div>' +
      '<p class="note" style="margin-top:10px">' + (VS.mode === 'commander' ? 'Vel speaks like a cold, precise machine commander and gives you orders. The jokes are about your excuses, never about you.' : 'Vel is calm, warm and a little witty.') + '</p></div>' +
      (VS.mode === 'commander' ? '<div class="card pad"><div class="eyebrow">Intensity: ' + LEVELNAME[VS.level] + '</div><input type="range" min="1" max="5" step="1" value="' + VS.level + '" id="vmLevel" style="width:100%;margin-top:12px;accent-color:var(--accent)" aria-label="Commander intensity"><div class="note" style="display:flex;justify-content:space-between"><span>Calm</span><span>Full drama</span></div>' +
        (soft ? '<p class="note" style="margin-top:8px"><b>Softened for now.</b> Your recent mood log looks low, so Vel is being gentle.</p>' : '<p class="note" style="margin-top:8px">If your mood log shows a rough patch, Vel softens by itself.</p>') + '</div>' : '') +
      '<div class="card pad"><div class="eyebrow">What Vel remembers</div>' +
      '<label class="chk" style="margin-top:10px"><input type="checkbox" id="vmRem"' + (VS.remember ? ' checked' : '') + '><span>Let Vel remember useful things from our chats</span></label>' +
      '<div style="margin-top:6px">' + items + '</div>' +
      '<form class="form" id="vmAdd" novalidate style="margin-top:10px"><input class="field" id="vmAddIn" maxlength="120" placeholder="Tell Vel something to remember" aria-label="Add a memory" autocomplete="off"><button class="add" type="submit">Add</button></form>' +
      (VS.mem.length ? '<button class="btn2' + (memPend ? ' warn' : '') + '" style="margin-top:10px" data-act="vm-clear">' + (memPend ? 'Tap again to forget everything' : 'Forget everything') + '</button>' : '') +
      '<p class="note" style="margin-top:10px">Memories stay on this phone. They are sent to the AI service only as part of your chats so Vel can use them. You can read, add and delete them here.</p>' + (memMsg ? '<p class="note">' + esc(memMsg) + '</p>' : '') + '</div>';
  }
  V.registerView('velmem', renderMem);
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'vmAdd') return;
    e.preventDefault(); var v = $('vmAddIn').value.trim(); if (!v) return;
    VS.mem.push({ id: u.uid(), t: v, d: u.iso(new Date()) }); vsSave(); renderMem();
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'vmLevel') { VS.level = +e.target.value; vsSave(); var ey = document.querySelector('#v-velmem .eyebrow:nth-of-type(1)'); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'vmLevel') { VS.level = +e.target.value; vsSave(); renderMem(); }
    if (e.target.id === 'vmRem') { VS.remember = e.target.checked; vsSave(); renderMem(); }
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a === 'vm-mode') { if (id === 'commander' && V.eco && !V.eco.has('commander')) { V.toast('Commander mode costs ' + V.eco.cost('commander') + ' crystals. Unlock it in the Market.'); return; } VS.mode = id === 'commander' ? 'commander' : 'friend'; vsSave(); renderMem(); }
    else if (a === 'vm-del') { VS.mem = VS.mem.filter(function (m) { return m.id !== id; }); vsSave(); renderMem(); }
    else if (a === 'vm-clear') {
      if (memPend) { VS.mem = []; memPend = false; vsSave(); memMsg = 'Everything forgotten.'; renderMem(); }
      else { memPend = true; renderMem(); setTimeout(function () { memPend = false; if (V.view() === 'velmem') renderMem(); }, 3000); }
    }
  });

  /* ---------- Vel settings (the key box) ---------- */
  function mask(k) { return k ? '••••' + k.slice(-4) : ''; }
  var testMsg = '';
  function renderKey() {
    $('v-aikey').innerHTML =
      bar(u.BACK_TOOLS, 'Vel settings') +
      '<button class="btn2" data-act="go" data-to="velmem">Personality and memory</button>' +
      '<div class="card pad"><div class="eyebrow">Your free key</div>' +
      '<ol class="steps" style="margin-top:12px"><li>Open <b>aistudio.google.com/apikey</b> in your browser and sign in.</li><li>Tap <b>Create API key</b>, then copy it.</li><li>Paste it below and tap Save.</li></ol>' +
      '<p class="note" style="margin-top:10px">Your key is only sent to the AI service when you chat. If you are logged in, a private copy is also saved in your account so a new phone gets it back. Only you can read it.</p>' +
      '<button class="tag' + (CFG.cloud !== false ? ' on' : '') + '" style="margin-top:10px" data-act="key-cloud" aria-pressed="' + (CFG.cloud !== false) + '">Back up my keys to my account: ' + (CFG.cloud !== false ? 'On' : 'Off') + '</button></div>' +
      '<form class="stack" id="keyForm" novalidate style="gap:8px"><input class="field" id="keyGem" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="' + (CFG.gem ? 'Saved ' + mask(CFG.gem) + ' (paste to replace)' : 'Paste your Gemini key') + '" aria-label="Gemini key">' +
      '<details><summary class="note" style="cursor:pointer">Backup key (optional)</summary><p class="note" style="margin:8px 0">If the first service is busy, Vel can switch to a free Groq key from console.groq.com.</p><input class="field" id="keyGroq" type="password" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="' + (CFG.groq ? 'Saved ' + mask(CFG.groq) + ' (paste to replace)' : 'Paste Groq key') + '" aria-label="Groq key"></details>' +
      '<button class="add" type="submit" style="width:100%">Save</button></form>' +
      '<div class="duo"><button class="btn2" data-act="key-test"' + (AI.hasKey() ? '' : ' disabled style="opacity:.4"') + '>Test Vel</button><button class="btn2" data-act="key-clear"' + (AI.hasKey() ? '' : ' disabled style="opacity:.4"') + '>Remove keys</button></div>' +
      (testMsg ? '<div class="card pad"><p class="note" style="margin:0">' + esc(testMsg) + '</p></div>' : '');
  }
  V.registerView('aikey', renderKey);
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'keyForm') return;
    e.preventDefault();
    var g = $('keyGem').value.trim(), q = $('keyGroq').value.trim();
    if (g) CFG.gem = g; if (q) CFG.groq = q;
    saveCfg(); testMsg = (g || q) ? 'Saved. Tap Test Vel to check it works.' : 'Nothing new to save.'; renderKey();
  });
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act');
    if (a === 'key-cloud') { CFG.cloud = CFG.cloud === false; saveCfg(); testMsg = CFG.cloud === false ? 'Off. Your account copy is deleted at the next backup.' : 'On. Your keys are backed up with your account.'; renderKey(); }
    else if (a === 'key-clear') { CFG = {}; saveCfg(); testMsg = 'Keys removed from this phone.'; renderKey(); }
    else if (a === 'key-test') {
      testMsg = 'Asking Vel...'; renderKey();
      AI.ask([{ r: 'user', t: 'Say hello in five words.' }], AI.persona(), { max: 200 }).then(function (r) { testMsg = 'It works. Vel says: ' + r; if (V.view() === 'aikey') renderKey(); },
        function (er) { testMsg = er.message; if (V.view() === 'aikey') renderKey(); });
    }
  });
})();
