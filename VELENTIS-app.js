/* VELENTIS app shell: skins, router, home dashboard, profile, tools list, look, intro, search.
   Each tool lives in its own file and plugs in with Velentis.registerTool(). */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, core = V.core;

  var SKIN_KEY = 'velentis.skin';
  var SKINS = [
    ['realm', 'Realm', 'Warm wood and parchment'], ['midnight', 'Midnight', 'Dark frosted glass'], ['ember', 'Ember', 'Warm soft clay'], ['calm', 'Calm', 'Sage and sand'],
    ['glass', 'Glass', 'Light liquid glass'], ['neo', 'Neo', 'Slate with blue glow'], ['forest', 'Forest', 'Deep green glass'],
    ['ember-night', 'Ember night', 'Dark amber glass'], ['mono', 'Mono', 'Black and white glass'], ['mochi', 'Mochi', 'Flat paper and ink']
  ];
  var LIGHT_SKINS = ['ember', 'calm', 'glass', 'mono', 'mochi'];

  /* the full list of planned tools; a tool becomes "ready" when its file registers it */
  var TOOLS = V.TOOLS = [
    { k: 'ai', n: 'Vel, your companion', d: 'Talk, ask, think out loud', i: 'spark' },
    { k: 'chef', n: 'Fridge chef', d: 'Recipes from what you have', i: 'chef' },
    { k: 'lang', n: 'Language buddy', d: 'Practice a little every day', i: 'lang' },
    { k: 'story', n: 'Text adventure', d: 'A story that reacts to you', i: 'compass' },
    { k: 'habits', n: 'Habit tracker', d: 'Check off your day', i: 'check' },
    { k: 'spend', n: 'Expense notebook', d: 'See where your money goes', i: 'wallet' },
    { k: 'cards', n: 'Flashcards', d: 'Turn notes into quiz cards', i: 'layers' },
    { k: 'notes', n: 'Notes vault', d: 'Keep ideas in one place', i: 'notes' },
    { k: 'plan', n: 'Daily planner', d: 'Plan your day', i: 'list' },
    { k: 'focus', n: 'Focus timer', d: 'Study in focused rounds', i: 'timer' },
    { k: 'mood', n: 'Mood journal', d: 'A few lines a day', i: 'smile' },
    { k: 'quiz', n: 'Quiz game', d: 'Test what you know', i: 'help' },
    { k: 'move', n: 'Workout log', d: 'Log sets and streaks', i: 'activity' },
    { k: 'reps', n: 'Rep counter', d: 'Your camera counts the reps', i: 'camera' },
    { k: 'run', n: 'Run tracker', d: 'GPS distance, time and pace', i: 'route' },
    { k: 'online', n: 'Account and sync', d: 'Log in, back up, use two phones', i: 'cloud' },
    { k: 'friends', n: 'Friends', d: 'Add friends and compare', i: 'users' },
    { k: 'board', n: 'Leaderboards', d: 'Weekly XP, distance, explorers', i: 'trophy' },
    { k: 'watch', n: 'Watchlist', d: 'Anime, songs, and books', i: 'play' },
    { k: 'write', n: 'Story and poem helper', d: 'Get unstuck and write', i: 'pen' },
    { k: 'facts', n: 'Myths and facts', d: 'Explore how things work', i: 'globe' },
    { k: 'lib', n: 'Knowledge library', d: 'Short explainers on big ideas', i: 'book' },
    { k: 'gent', n: 'Gentleman academy', d: 'Manners, calm and presence', i: 'award' },
    { k: 'skills', n: 'Life skills academy', d: 'Money, sleep, work, safety', i: 'bulb' },
    { k: 'count', n: 'Countdown board', d: 'Exams, birthdays, events', i: 'calendar' },
    { k: 'voice', n: 'Voice memos', d: 'Capture ideas by talking', i: 'mic' }
  ];
  var HOME_TILES = ['ai', 'story', 'habits', 'plan', 'focus', 'notes'];
  function toolByKey(k) { return TOOLS.filter(function (t) { return t.k === k; })[0]; }

  /* ---------- views ---------- */
  V.views = {};
  var current = 'home', stub = null, searchers = [];
  V.view = function () { return current; };
  V.registerView = function (name, fn) {
    V.views[name] = fn;
    if (!$('v-' + name)) {
      var s = document.createElement('section'); s.className = 'view stack'; s.id = 'v-' + name; s.hidden = true;
      $('app').appendChild(s);
    }
  };
  V.registerTool = function (k, fn) { var t = toolByKey(k); if (t) t.built = true; V.registerView(k, fn); };
  V.registerSearch = function (fn) { searchers.push(fn); };
  V.refresh = function () { if (V.views[current]) V.views[current](); };

  function show(name) {
    if (!V.views[name]) name = 'home';
    if (name === 'soon' && !stub) name = 'home';
    if (current !== name) V.emit('view.leave', current);
    current = name;
    V.views[name]();
    Object.keys(V.views).forEach(function (v) { var el = $('v-' + v); if (el) el.hidden = v !== name; });
    var NAVOF = { home: 'home', inventory: 'inventory', me: 'inventory', stats: 'inventory', look: 'inventory', world: 'world', run: 'world', reps: 'world', move: 'world',
      messages: 'messages', online: 'messages', friends: 'messages', board: 'messages' };
    var on = NAVOF[name] || 'workshop';
    ['home', 'inventory', 'world', 'workshop', 'messages'].forEach(function (k) {
      var b = $('n-' + k); if (!b) return;
      b.classList.toggle('on', k === on);
      if (k === on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    V.emit('view.enter', name);
  }
  function go(name) {
    if (location.hash === '#' + name) show(name); else location.hash = name;
    window.scrollTo(0, 0);
  }
  V.go = go;
  function openTool(k) {
    if (V.views[k] && toolByKey(k) && toolByKey(k).built) { go(k); return; }
    stub = k; go('soon');
  }

  /* ---------- skins ---------- */
  function applySkin(id) {
    if (!SKINS.some(function (s) { return s[0] === id; })) id = 'realm';
    document.documentElement.setAttribute('data-skin', id);
    return id;
  }
  var skin = 'realm';
  try { skin = localStorage.getItem(SKIN_KEY) || 'realm'; } catch (e) {}
  skin = applySkin(skin);

  /* ---------- intro (the animated logo) ---------- */
  var introEl = null, introTimer = 0;
  function introOn() { try { return localStorage.getItem('velentis.intro') !== 'off'; } catch (e) { return true; } }
  function endIntro() {
    clearTimeout(introTimer);
    if (!introEl) return;
    introEl.style.opacity = 0;
    setTimeout(function () { introEl.hidden = true; introEl.src = 'about:blank'; }, 600);
  }
  function playIntro() {
    if (!introEl) return;
    var light = LIGHT_SKINS.indexOf(skin) !== -1;
    introEl.style.background = light ? '#F5F5F2' : '#0A0A0B';
    introEl.hidden = false; introEl.style.opacity = 1;
    introEl.src = 'intro.html?theme=' + (light ? 'light' : 'dark') + '&t=' + Date.now();
    clearTimeout(introTimer);
    introTimer = setTimeout(endIntro, 14000);
  }
  window.addEventListener('message', function (e) {
    if (introEl && e.source === introEl.contentWindow && e.data && e.data.type === 'velentis-intro-done') endIntro();
  });

  /* ---------- home: the dashboard ---------- */
  function attrGrid() {
    var st = core.state();
    return '<div class="attrs">' + core.ATTRS.map(function (a) {
      var l = core.attrLevel(st.xp[a[0]]);
      return '<div class="attr"><div class="top"><span>' + esc(a[1]) + '</span><span class="muted">Lv ' + l.level + '</span></div><div class="bar" style="margin-top:6px"><i style="width:' + Math.max(l.pct, st.xp[a[0]] > 0 ? 4 : 0) + '%"></i></div></div>';
    }).join('') + '</div>';
  }
  function questList() {
    return core.quests().map(function (q) {
      return '<button class="qrow" data-act="open" data-k="' + esc(q.tool || '') + '"' + (q.tool ? '' : ' disabled') + '><span class="qdot' + (q.done ? ' on' : '') + '">' + (q.done ? ic('tick') : '') + '</span>' +
        '<span class="txt" style="text-align:left;flex:1;min-width:0"><span class="nm" style="font-weight:600' + (q.done ? ';text-decoration:line-through;opacity:.6' : '') + '">' + esc(q.text) + '</span><br><span class="sub muted" style="font-size:12.5px">' +
        (q.done ? 'Done' : q.have + ' of ' + q.need) + ' · +' + q.bonus + ' XP bonus</span></span>' + ic('chev') + '</button>';
    }).join('');
  }
  function tileHTML(t) {
    var sub = t.d;
    if (t.k === 'habits' && V.habits) { var b = V.habits.bestStreak(); sub = b > 0 ? u.plural(b, 'day') + ' streak' : 'Start a streak'; }
    return '<button class="card tile" data-act="open" data-k="' + t.k + '">' + ic(t.i) +
      '<span><span class="t">' + esc(t.n) + '</span><span class="s">' + esc(sub) + '</span></span></button>';
  }
  function renderHome() {
    var st = core.state(), now = new Date(), h = now.getHours();
    var greet = (h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening') + (st.name ? ', ' + st.name : '');
    var date = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    var li = core.levelInfo(st.total), na = core.nextAction(), w = core.week();
    var readyCount = TOOLS.filter(function (t) { return t.built; }).length;
    var habitsCard = '';
    if (V.habits) {
      var m = V.habits.count(), n = V.habits.doneToday(), pct = m ? Math.round(n / m * 100) : 0;
      habitsCard = '<div class="card pad today">' + (m
        ? '<div><div class="eyebrow">Habits today</div><div class="big">' + n + ' of ' + m + '</div><div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
          '<div class="div"></div><div><div class="eyebrow">Best streak</div><div class="big">' + u.plural(V.habits.bestStreak(), 'day') + '</div><p class="note" style="margin-top:12px">Keep it going</p></div>'
        : '<div><div class="eyebrow">Habits today</div><div class="big">No habits yet</div><p class="note" style="margin-top:8px">Add your first one to start a streak.</p></div>') + '</div>';
    }
    var R = 34, C = 2 * Math.PI * R, off = C * (1 - Math.max(li.pct, st.total > 0 ? 3 : 0) / 100);
    $('v-home').innerHTML =
      '<header class="head"><div><div class="eyebrow">' + esc(date) + '</div><h1 class="greet">' + esc(greet) + '</h1></div>' +
      '<button class="icon-btn" data-act="go" data-to="look" aria-label="Change look">' + ic('palette') + '</button></header>' +
      '<label class="card search" for="q">' + ic('search') + '<input id="q" type="search" placeholder="Search tools, habits and notes" autocomplete="off"></label>' +
      '<div id="searchOut" class="stack" hidden></div>' +
      '<div id="homeBody" class="stack">' +
      '<button class="card playercard" data-act="go" data-to="me"><div class="lvl"><span class="ringwrap"><svg viewBox="0 0 80 80" class="ring" aria-hidden="true"><circle cx="40" cy="40" r="' + R + '" class="rt"/><circle cx="40" cy="40" r="' + R + '" class="rf" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '"/></svg><b>' + li.level + '</b></span>' +
      '<span class="lvltxt"><span class="eyebrow">Level ' + li.level + '</span><span class="xp">' + st.total + ' XP</span><span class="note">' + (li.need - li.into) + ' XP to level ' + (li.level + 1) + '</span></span></div>' + attrGrid() + '</button>' +
      '<section class="stack tight"><div class="sec"><h2>Today’s quests</h2><span class="eyebrow">' + w.active + ' of ' + w.goal + ' days this week</span></div><div class="card pad qlist">' + questList() + '</div></section>' +
      '<div class="card next"><span class="eyebrow">Suggested next</span><div class="nt">' + esc(na.text) + '</div><div class="note">' + esc(na.why) + '</div>' +
      (na.to ? '<button class="add" data-act="open" data-k="' + na.to + '">Start</button>' : '') + '</div>' +
      habitsCard +
      '<section class="stack tight"><div class="sec"><h2>Your tools</h2><span class="eyebrow">' + readyCount + ' of ' + TOOLS.length + ' ready</span></div>' +
      '<div class="grid">' + HOME_TILES.map(function (k) { return tileHTML(toolByKey(k)); }).join('') + '</div>' +
      '<button class="link" data-act="go" data-to="tools">See all ' + TOOLS.length + ' tools</button></section></div>';
  }

  /* ---------- all tools ---------- */
  function rowTool(t) {
    return '<button class="card row btn" data-act="open" data-k="' + t.k + '"><span class="chip">' + ic(t.i) + '</span>' +
      '<span class="txt"><span class="nm">' + esc(t.n) + '</span><br><span class="sub">' + esc(t.d) + '</span></span>' +
      (t.built ? ic('chev') : '<span class="pill">Soon</span>') + '</button>';
  }
  var GROUPS = [
    ['Companion', ['ai', 'lang', 'story', 'write']],
    ['Learn', ['quiz', 'facts', 'lib', 'cards', 'gent', 'skills']],
    ['Body', ['move', 'reps', 'run']],
    ['Daily life', ['habits', 'plan', 'focus', 'mood', 'notes', 'count', 'spend', 'chef']],
    ['Together', ['online', 'friends', 'board']],
    ['More', ['watch', 'voice']]
  ];
  function renderTools() {
    var html = '', seen = {};
    GROUPS.forEach(function (g) {
      var items = g[1].map(toolByKey).filter(Boolean);
      items.forEach(function (t) { seen[t.k] = 1; });
      if (items.length) html += '<section class="group"><div class="eyebrow">' + g[0] + '</div><div class="list">' + items.map(rowTool).join('') + '</div></section>';
    });
    var rest = TOOLS.filter(function (t) { return !seen[t.k]; });
    if (rest.length) html += '<section class="group"><div class="eyebrow">More</div><div class="list">' + rest.map(rowTool).join('') + '</div></section>';
    $('v-tools').innerHTML = '<div class="topbar"><button class="icon-btn" data-act="go" data-to="home" aria-label="Back">' + ic('back') + '</button><h1>All tools</h1></div>' + html;
  }

  function renderSoon() {
    var t = stub && toolByKey(stub);
    if (!t) { go('home'); return; }
    $('v-soon').innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="go" data-to="tools" aria-label="Back">' + ic('back') + '</button><h1>' + esc(t.n) + '</h1></div>' +
      '<div class="card hero"><span class="chip">' + ic(t.i) + '</span><h2>Coming soon</h2><p>' + esc(t.d) + '. We will build this one in a later step.</p></div>';
  }

  /* ---------- me: profile, progress, badges, your data ---------- */
  var dataMsg = '', eraseArmed = false, showExport = false, exportText = '';
  function renderMe() {
    var st = core.state(), li = core.levelInfo(st.total), w = core.week();
    var attrs = core.ATTRS.map(function (a) {
      var l = core.attrLevel(st.xp[a[0]]);
      return '<div class="attr" style="margin-bottom:14px"><div class="top"><span style="font-weight:600">' + esc(a[1]) + '</span><span class="muted">Lv ' + l.level + ' · ' + st.xp[a[0]] + ' XP</span></div>' +
        '<div class="bar" style="margin-top:6px"><i style="width:' + Math.max(l.pct, st.xp[a[0]] > 0 ? 4 : 0) + '%"></i></div><div class="note" style="margin-top:4px">' + esc(a[2]) + '</div></div>';
    }).join('');
    var ach = core.achievements(), got = ach.filter(function (a) { return a.on; }).length;
    var badges = ach.map(function (a) {
      return '<div class="' + (a.on ? '' : 'off') + '"><div style="font-weight:600;font-size:14px">' + esc(a.name) + '</div><div class="note">' + esc(a.text) + '</div></div>';
    }).join('');
    var recent = core.recent(8).map(function (e) {
      return '<li class="row" style="padding:8px 0"><div class="txt"><div class="nm" style="font-weight:500">' + esc(e.n) + '</div><div class="sub">' + u.niceDate(e.d) + '</div></div><strong>+' + e.xp + ' XP</strong></li>';
    }).join('');
    $('v-me').innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="go" data-to="home" aria-label="Back">' + ic('back') + '</button><h1>You</h1></div>' +
      '<div class="card pad"><div class="lvl"><span class="badge">' + li.level + '</span><span style="flex:1;min-width:0"><span class="eyebrow">Level ' + li.level + '</span><span class="big" style="display:block;font-size:22px;margin-top:2px">' + st.total + ' XP</span>' +
      '<span class="bar"><i style="width:' + Math.max(li.pct, st.total > 0 ? 3 : 0) + '%"></i></span><span class="note" style="display:block;margin-top:6px">' + (li.need - li.into) + ' XP to level ' + (li.level + 1) + '</span></span></div>' +
      '<form class="form" id="nameForm" novalidate style="margin-top:14px"><input class="field" id="nameIn" maxlength="24" placeholder="Your name" aria-label="Your name" value="' + esc(st.name) + '" autocomplete="off"><button class="add" type="submit">Save</button></form></div>' +
      '<div class="card pad"><div class="eyebrow" style="margin-bottom:12px">Attributes</div>' + attrs + '<p class="note">These are game points for fun, not medical measurements. XP comes only from real activity, and each kind of activity has a daily limit.</p></div>' +
      '<div class="card pad"><div class="sec" style="margin:0 0 10px"><h2>This week</h2><span class="eyebrow">' + w.active + ' of ' + w.goal + ' active days</span></div>' +
      '<div class="week">' + ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(function (l, i) { return '<div class="day"><div class="l">' + l + '</div><div class="c ' + (w.days[i] ? 'full' : '') + '">' + (w.days[i] ? ic('tick') : '') + '</div></div>'; }).join('') + '</div></div>' +
      '<div class="card pad"><div class="sec" style="margin:0 0 10px"><h2>Badges</h2><span class="eyebrow">' + got + ' of ' + ach.length + '</span></div><div class="ach">' + badges + '</div></div>' +
      '<div class="card pad"><div class="eyebrow" style="margin-bottom:6px">Recent XP</div>' + (recent ? '<ul class="list" style="gap:0">' + recent + '</ul>' : '<p class="note">Nothing yet. Check off a habit or finish a quest.</p>') + '</div>' +
      '<button class="card row btn" data-act="go" data-to="online"><span class="chip">' + ic('cloud') + '</span><span class="txt"><span class="nm">Account and sync</span><br><span class="sub">Log in and back up online</span></span>' + ic('chev') + '</button>' +
      '<button class="card row btn" data-act="go" data-to="aikey"><span class="chip">' + ic('spark') + '</span><span class="txt"><span class="nm">Vel settings</span><br><span class="sub">Add your free AI key</span></span>' + ic('chev') + '</button>' +
      '<button class="card row btn" data-act="go" data-to="stats"><span class="chip">' + ic('bars') + '</span><span class="txt"><span class="nm">Habit stats</span><br><span class="sub">Your last 7 days</span></span>' + ic('chev') + '</button>' +
      '<div class="card pad stack" style="gap:10px"><div class="eyebrow">Your data</div><p class="note">Everything lives on this phone only. Copy a backup now and then, so you can restore it after reinstalling.</p>' +
      '<button class="btn2" data-act="exportData">' + (showExport ? 'Refresh backup text' : 'Make a backup') + '</button>' +
      (showExport ? '<textarea class="field" id="exportBox" readonly aria-label="Backup text">' + esc(exportText) + '</textarea><button class="btn2 main" data-act="copyData">Copy backup text</button>' : '') +
      '<textarea class="field" id="importBox" placeholder="Paste a backup here to restore it" aria-label="Paste a backup"></textarea><button class="btn2" data-act="importData">Restore from backup</button>' +
      '<button class="link" data-act="eraseData" style="margin:0">' + (eraseArmed ? 'Tap again to erase everything' : 'Erase everything') + '</button>' +
      (dataMsg ? '<div class="note" style="color:var(--fg)">' + esc(dataMsg) + '</div>' : '') + '</div>';
  }

  /* ---------- look ---------- */
  function renderLook() {
    var on = introOn();
    $('v-look').innerHTML =
      '<div class="topbar"><button class="icon-btn" data-act="go" data-to="home" aria-label="Back">' + ic('back') + '</button><h1>Look</h1></div>' +
      '<p class="muted">Pick how Velentis feels. It changes the whole app and stays after you close it.</p>' +
      '<div class="skins">' + SKINS.map(function (s) {
        return '<button class="skin" data-skin="' + s[0] + '" data-act="skin" data-id="' + s[0] + '" aria-pressed="' + (s[0] === skin) + '">' +
          '<span class="mini"><i></i><i></i><u></u></span><span><span class="n">' + s[1] + '</span><br><span class="d">' + s[2] + '</span></span></button>';
      }).join('') + '</div>' +
      '<div class="list">' +
      '<button class="card row btn" data-act="introPlay"><span class="chip">' + ic('play') + '</span><span class="txt"><span class="nm">Replay intro</span><br><span class="sub">Watch the logo animation again</span></span>' + ic('chev') + '</button>' +
      '<button class="card row btn" data-act="introToggle" aria-pressed="' + on + '"><span class="chip">' + ic('check') + '</span><span class="txt"><span class="nm">Intro on start</span><br><span class="sub">' + (on ? 'On. It plays each time you open Velentis.' : 'Off. Velentis opens straight to home.') + '</span></span><span class="pill">' + (on ? 'On' : 'Off') + '</span></button></div>';
  }

  V.registerView('home', renderHome);
  V.registerView('tools', renderTools);
  V.registerView('me', renderMe);
  V.registerView('look', renderLook);
  V.registerView('soon', renderSoon);

  /* ---------- clicks ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a === 'go') go(t.getAttribute('data-to'));
    else if (a === 'open') { var k = t.getAttribute('data-k'); if (k) openTool(k); }
    else if (a === 'skin') {
      skin = applySkin(id);
      try { localStorage.setItem(SKIN_KEY, skin); } catch (err) {}
      renderLook();
    } else if (a === 'introPlay') playIntro();
    else if (a === 'introToggle') { try { localStorage.setItem('velentis.intro', introOn() ? 'off' : 'on'); } catch (err) {} renderLook(); }
    else if (a === 'exportData') { exportText = core.exportAll(); showExport = true; dataMsg = ''; renderMe(); }
    else if (a === 'copyData') {
      var box = $('exportBox');
      function done(ok) { dataMsg = ok ? 'Copied. Paste it somewhere safe, like a note to yourself.' : 'Could not copy. Press and hold the text, then choose Copy.'; renderMe(); }
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(exportText).then(function () { done(true); }, function () { done(false); });
      else { try { box.select(); done(document.execCommand('copy')); } catch (err) { done(false); } }
    } else if (a === 'importData') {
      var msg = core.importAll($('importBox').value);
      if (msg) { dataMsg = msg; renderMe(); } else { location.reload(); }
    } else if (a === 'eraseData') {
      if (eraseArmed) { core.eraseAll(); location.hash = 'home'; location.reload(); }
      else { eraseArmed = true; renderMe(); setTimeout(function () { eraseArmed = false; if (current === 'me') renderMe(); }, 3000); }
    }
  });

  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'nameForm') return;
    e.preventDefault();
    core.setName($('nameIn').value); V.toast('Saved'); renderMe();
  });

  document.addEventListener('input', function (e) {
    if (e.target.id !== 'q') return;
    var q = e.target.value.trim().toLowerCase(), out = $('searchOut'), body = $('homeBody');
    if (!q) { out.hidden = true; body.hidden = false; return; }
    var rows = TOOLS.filter(function (t) { return (t.n + ' ' + t.d).toLowerCase().indexOf(q) !== -1; }).map(rowTool);
    searchers.forEach(function (fn) {
      (fn(q) || []).forEach(function (r) {
        rows.push('<button class="card row btn" data-act="go" data-to="' + esc(r.to) + '"><span class="chip">' + ic(r.icon) + '</span><span class="txt"><span class="nm">' + esc(r.title) + '</span><br><span class="sub">' + esc(r.sub) + '</span></span>' + ic('chev') + '</button>');
      });
    });
    out.innerHTML = rows.length ? '<div class="list">' + rows.join('') + '</div>' : '<p class="note">Nothing matches that yet.</p>';
    out.hidden = false; body.hidden = true;
  });

  window.addEventListener('hashchange', function () { show(location.hash.slice(1)); });
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden && ['home', 'habits', 'stats', 'me'].indexOf(current) !== -1) V.views[current]();
  });
  V.on('core.changed', function () { if (current === 'home' || current === 'me') V.views[current](); });

  V.boot = function () {
    introEl = $('intro');
    show(location.hash.slice(1) || 'home');
    if (introEl) { if (introOn()) playIntro(); else introEl.hidden = true; }
  };
})();
