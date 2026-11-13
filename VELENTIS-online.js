/* Online: account, sync between phones, friends, leaderboards. Talks to your own Supabase project.
   Public stats shared: username, level, XP numbers, weekly distance, areas explored count. Nothing else. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, iso = u.iso, addDays = u.addDays, plural = u.plural, bar = u.bar;
  var CFG = window.VELENTIS_CONFIG || {};
  var ready = !!(CFG.url && CFG.key);
  var SK = 'velentis.session', YK = 'velentis.sync.v1';
  var sess = u.get(SK, null), Y = u.get(YK, { last: '', auto: true, visible: true, at: 0 }) || {};
  if (typeof Y.auto !== 'boolean') Y.auto = true;
  if (typeof Y.visible !== 'boolean') Y.visible = true;
  function saveY() { u.put(YK, Y); }
  var ui = { tab: 'login', msg: '', busy: false, sync: '', choose: null, test: '' };

  /* ---------- talking to Supabase ---------- */
  function mkErr(status, body) {
    var m = (body && (body.msg || body.message || body.error_description || body.error)) || '';
    var e = new Error(String(m)); e.status = status; e.raw = String(m); return e;
  }
  function plain(e) {
    var m = (e && e.raw || e && e.message || '').toLowerCase();
    if (/failed to fetch|network|load failed/.test(m) || (e && e.name === 'TypeError')) return 'No connection. Check your internet and try again.';
    if (/already registered|already been registered|database error saving|duplicate|unique/.test(m)) return 'That username is taken. Try another.';
    if (/invalid login|invalid credentials/.test(m)) return 'Wrong username or password.';
    if (/password/.test(m) && /(short|least|weak)/.test(m)) return 'Choose a longer password (at least 8 characters).';
    if (/rate|too many|over_/.test(m)) return 'Too many tries. Wait a minute and try again.';
    var raw = String((e && (e.raw || e.message)) || '').slice(0, 90);
    return 'Something went wrong' + (e && e.status ? ' (error ' + e.status + ')' : '') + (raw ? ': ' + raw : '') + '. Tap "Test connection" below.';
  }
  function req(method, path, body, extra, retried) {
    var h = { 'apikey': CFG.key, 'Content-Type': 'application/json' };
    if (sess && sess.access_token) h['Authorization'] = 'Bearer ' + sess.access_token;   /* new-style publishable keys go in apikey only */
    if (extra) for (var k in extra) h[k] = extra[k];
    return fetch(CFG.url.replace(/\/$/, '') + path, { method: method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) }).then(function (r) {
      if (r.status === 401 && sess && sess.refresh_token && !retried && path.indexOf('/auth/') !== 0) {
        return refresh().then(function () { return req(method, path, body, extra, true); });
      }
      return r.text().then(function (t) {
        var j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
        if (!r.ok) throw mkErr(r.status, j);
        return j;
      });
    });
  }
  function refresh() {
    return req('POST', '/auth/v1/token?grant_type=refresh_token', { refresh_token: sess.refresh_token }, null, true).then(function (j) { setSession(j, sess.username); }, function (e) {
      if (e.status === 400 || e.status === 401) { sess = null; u.put(SK, null); try { localStorage.removeItem(SK); } catch (x) {} }
      throw e;
    });
  }
  function setSession(j, username) {
    sess = { access_token: j.access_token, refresh_token: j.refresh_token, id: j.user && j.user.id || (sess && sess.id), username: username };
    u.put(SK, sess);
  }
  function emailOf(name) { return name + '@velentis.app'; }
  function okName(n) { return /^[a-z0-9_]{3,20}$/.test(n); }

  /* ---------- what gets shared and what gets synced ---------- */
  function publicStats() {
    var c = V.core, st = c.state(), wk = iso(addDays(new Date(), -6)), wxp = 0, attrs = {};
    st.ledger.forEach(function (l) { if (l.d >= wk) wxp += l.xp || 0; });
    c.ATTRS.forEach(function (a) { attrs[a[0]] = c.attrLevel(st.xp[a[0]] || 0); });
    return { level: c.levelInfo(st.total).level, total_xp: st.total, week_xp: wxp, best_streak: (st.best && st.best.streak) || 0,
      week_km: V.run ? V.run.stats().weekKm : 0, tiles: V.tiles ? V.tiles.count() : 0, attrs: attrs, visible: Y.visible, updated_at: new Date().toISOString() };
  }
  function snapshotData() {
    var d = {}, i, k;
    for (i = 0; i < localStorage.length; i++) { k = localStorage.key(i); if (k && k.indexOf('velentis.') === 0 && k !== SK && k !== YK && k !== 'velentis.ai.v1' && k !== 'velentis.logo.theme') d[k] = localStorage.getItem(k); }
    return d;
  }
  function pushAll() {
    if (!sess) return Promise.resolve();
    var now = new Date().toISOString(), dev = (navigator.userAgent.match(/\(([^)]+)\)/) || [0, 'phone'])[1].split(';').slice(0, 2).join(',').slice(0, 40);
    var prefer = { 'Prefer': 'resolution=merge-duplicates,return=minimal' };
    return req('PATCH', '/rest/v1/profiles?id=eq.' + sess.id, publicStats(), { 'Prefer': 'return=minimal' }).then(function () {
      return req('POST', '/rest/v1/snapshots?on_conflict=user_id', { user_id: sess.id, data: snapshotData(), device: dev, updated_at: now }, prefer);
    }).then(function () { Y.last = now; Y.at = Date.now(); saveY(); ui.sync = 'Backed up just now'; });
  }
  function applyCloud(data) {
    Object.keys(data).forEach(function (k) { if (k.indexOf('velentis.') === 0 && typeof data[k] === 'string') { try { localStorage.setItem(k, data[k]); } catch (e) {} } });
  }
  function fresh() { var s = V.core.state(); return !s.total; }
  /* look at the cloud copy and decide: nothing there, same as ours, or different */
  function checkCloud(first) {
    return req('GET', '/rest/v1/snapshots?select=data,device,updated_at&user_id=eq.' + sess.id).then(function (rows) {
      var row = rows && rows[0];
      if (!row) return pushAll();
      if (Y.last && row.updated_at <= Y.last) return pushAll();
      if (fresh()) { applyCloud(row.data); Y.last = row.updated_at; saveY(); location.reload(); return; }
      if (first || row.updated_at > Y.last) { ui.choose = row; if (V.view() === 'online') render(); }
    });
  }
  var timer = 0;
  function later() { if (!sess || !Y.auto || ui.choose) return; clearTimeout(timer); timer = setTimeout(function () { pushAll().catch(function (e) { ui.sync = 'Could not back up (' + plain(e) + ')'; }).then(function () { if (V.view() === 'online') render(); }); }, 30000); }
  V.on('core.changed', later);
  document.addEventListener('visibilitychange', function () { if (document.hidden && sess && Y.auto && !ui.choose && Date.now() - (Y.at || 0) > 60000) pushAll().catch(function () {}); });

  /* ---------- sign up, log in, log out ---------- */
  function auth(kind, name, pass) {
    ui.busy = true; ui.msg = ''; render();
    var p;
    if (kind === 'signup') {
      p = req('POST', '/rest/v1/rpc/username_free', { name: name }).then(function (free) {
        if (free === false) throw Object.assign(new Error('taken'), { raw: 'already registered' });
        return req('POST', '/auth/v1/signup', { email: emailOf(name), password: pass, data: { username: name } });
      });
    } else p = req('POST', '/auth/v1/token?grant_type=password', { email: emailOf(name), password: pass });
    return p.then(function (j) {
      if (!j || !j.access_token) throw new Error('Turn off "Confirm email" in Supabase (see the README).');
      setSession(j, name); ui.busy = false; ui.msg = '';
      return checkCloud(true).then(function () { return pushAll().catch(function () {}); });
    }).catch(function (e) { ui.busy = false; ui.msg = /Confirm email/.test(e.message) ? e.message : plain(e); }).then(function () { render(); });
  }
  function logout() { sess = null; try { localStorage.removeItem(SK); } catch (e) {} Y.last = ''; saveY(); ui.sync = ''; ui.choose = null; render(); }

  /* ---------- screens ---------- */
  function ago(ts) { var s = Math.round((Date.now() - ts) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago'; }
  function setupCard() {
    return '<div class="card hero"><span class="chip">' + ic('cloud') + '</span><h2>Online is not set up yet</h2><p>Your app needs a free Supabase project first. The README has the steps. It takes about 10 minutes, one time.</p></div>';
  }
  function render() {
    var el = $('v-online'); if (!el) return;
    if (!ready) { el.innerHTML = bar(u.BACK_TOOLS, 'Account and sync') + setupCard(); return; }
    if (!sess) {
      el.innerHTML = bar(u.BACK_TOOLS, 'Account and sync') +
        '<div class="card pad"><div class="chips"><button class="tag' + (ui.tab === 'login' ? ' on' : '') + '" data-act="on-tab" data-id="login">Log in</button><button class="tag' + (ui.tab === 'signup' ? ' on' : '') + '" data-act="on-tab" data-id="signup">Create account</button></div>' +
        '<form class="stack" id="authForm" novalidate style="gap:8px;margin-top:12px"><input class="field" id="auUser" maxlength="20" autocapitalize="none" autocomplete="username" spellcheck="false" placeholder="Username (letters, numbers, _)" aria-label="Username"><input class="field" id="auPass" type="password" autocomplete="' + (ui.tab === 'signup' ? 'new-password' : 'current-password') + '" placeholder="Password (8 or more characters)" aria-label="Password">' +
        '<button class="add" type="submit" style="width:100%"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'One moment...' : ui.tab === 'signup' ? 'Create account' : 'Log in') + '</button>' + (ui.msg ? '<div class="err">' + esc(ui.msg) + '</div>' : '') + '</form></div>' +
        '<button class="link" data-act="on-test">Test connection</button>' + (ui.test ? '<div class="note" style="white-space:pre-line">' + esc(ui.test) + '</div>' : '') +
        '<p class="note">Your tools keep working without an account. An account backs up your data and lets you use two phones, add friends and join leaderboards. There is no email, so keep your password safe: it cannot be reset.</p>';
      return;
    }
    var s = V.core.state(), li = V.core.levelInfo(s.total);
    var choose = ui.choose ? '<div class="card pad"><div class="eyebrow">Two copies found</div><p style="margin:6px 0 12px">The online copy is from ' + esc(new Date(ui.choose.updated_at).toLocaleString()) + (ui.choose.device ? ' (' + esc(ui.choose.device) + ')' : '') + '. Which one do you want to keep?</p><div class="duo"><button class="btn2 main" data-act="on-usecloud">Use online copy</button><button class="btn2" data-act="on-usephone">Keep this phone</button></div></div>' : '';
    el.innerHTML = bar(u.BACK_TOOLS, 'Account and sync') +
      '<div class="card pad"><div class="eyebrow">Signed in as</div><div class="big">' + esc(sess.username) + '</div><p class="note" style="margin-top:6px">Level ' + li.level + ' · ' + s.total + ' XP</p></div>' + choose +
      '<div class="card pad"><div class="eyebrow">Backup and sync</div><p class="note" style="margin:6px 0 12px">' + esc(ui.sync || (Y.at ? 'Last backup ' + ago(Y.at) : 'Not backed up yet')) + '</p><button class="btn2 main" data-act="on-sync"' + (ui.busy ? ' disabled' : '') + '>' + (ui.busy ? 'Working...' : 'Back up now') + '</button>' +
      '<label class="row" style="margin-top:12px;gap:10px;display:flex;align-items:center"><input type="checkbox" id="onAuto"' + (Y.auto ? ' checked' : '') + '> <span>Back up automatically</span></label>' +
      '<label class="row" style="margin-top:8px;gap:10px;display:flex;align-items:center"><input type="checkbox" id="onVis"' + (Y.visible ? ' checked' : '') + '> <span>Show me on leaderboards and to friends</span></label></div>' +
      '<div class="list"><button class="card row btn" data-act="go" data-to="friends"><span class="chip">' + ic('users') + '</span><span class="txt"><span class="nm">Friends</span></span>' + ic('chev') + '</button><button class="card row btn" data-act="go" data-to="board"><span class="chip">' + ic('trophy') + '</span><span class="txt"><span class="nm">Leaderboards</span></span>' + ic('chev') + '</button></div>' +
      '<p class="note">Shared with others: your username, level, XP, weekly distance and areas explored. Your notes, mood, money and chats are never shared. They are only in your private backup.</p>' +
      (ui.msg ? '<div class="err">' + esc(ui.msg) + '</div>' : '') +
      '<button class="link" data-act="on-out">Log out</button>';
  }
  V.registerTool('online', render);

  /* ---------- friends ---------- */
  var fr = { rows: null, prof: {}, msg: '', busy: false, open: null };
  function loadFriends() {
    if (!sess) return Promise.resolve();
    fr.busy = true;
    return req('GET', '/rest/v1/friends?select=user_id,friend_id,status&or=(user_id.eq.' + sess.id + ',friend_id.eq.' + sess.id + ')').then(function (rows) {
      fr.rows = rows || [];
      var ids = fr.rows.map(function (r) { return r.user_id === sess.id ? r.friend_id : r.user_id; });
      if (!ids.length) return [];
      return req('GET', '/rest/v1/profiles?select=id,username,level,total_xp,week_xp,week_km,tiles,best_streak&id=in.(' + ids.join(',') + ')');
    }).then(function (ps) { fr.prof = {}; (ps || []).forEach(function (p) { fr.prof[p.id] = p; }); fr.busy = false; fr.msg = ''; },
      function (e) { fr.busy = false; fr.msg = plain(e); }).then(function () { if (V.view() === 'friends') renderFriends(); });
  }
  function renderFriends() {
    var el = $('v-friends'); if (!el) return;
    if (!ready || !sess) { el.innerHTML = bar(u.BACK_TOOLS, 'Friends') + '<div class="card hero"><span class="chip">' + ic('users') + '</span><h2>Log in first</h2><p>Friends need an account.</p></div><button class="btn2 main" data-act="go" data-to="online">Account and sync</button>'; return; }
    var rows = fr.rows || [], incoming = [], outgoing = [], mine = [];
    rows.forEach(function (r) {
      var other = r.user_id === sess.id ? r.friend_id : r.user_id, p = fr.prof[other] || { username: 'hidden user', id: other };
      if (r.status === 'accepted') mine.push(p); else if (r.friend_id === sess.id) incoming.push(p); else outgoing.push(p);
    });
    function row(p, btns, open) { return '<li class="card row"><span class="chip"><b>' + esc((p.username || '?').charAt(0).toUpperCase()) + '</b></span><div class="txt"><div class="nm">' + esc(p.username) + '</div><div class="sub">' + (p.level ? 'Level ' + p.level + ' · ' + (p.week_xp || 0) + ' XP this week' : '') + '</div></div>' + btns + '</li>'; }
    var cmp = '';
    if (fr.open && fr.prof[fr.open]) {
      var f = fr.prof[fr.open], me = publicStats();
      var line = function (label, a, b) { return '<div class="cmp"><span>' + label + '</span><b class="' + (a > b ? 'lead' : '') + '">' + a + '</b><b class="' + (b > a ? 'lead' : '') + '">' + b + '</b></div>'; };
      cmp = '<div class="card pad"><div class="cmp head"><span></span><b>You</b><b>' + esc(f.username) + '</b></div>' + line('Level', me.level, f.level) + line('XP this week', me.week_xp, f.week_xp || 0) + line('Total XP', me.total_xp, f.total_xp || 0) + line('Km this week', +me.week_km, +(f.week_km || 0)) + line('Areas explored', me.tiles, f.tiles || 0) + line('Best streak', me.best_streak, f.best_streak || 0) + '</div>';
    }
    el.innerHTML = bar(u.BACK_TOOLS, 'Friends') +
      '<form class="form" id="frForm" novalidate><input class="field" id="frName" maxlength="20" autocapitalize="none" spellcheck="false" placeholder="Add a friend by username" aria-label="Friend username" autocomplete="off"><button class="add" type="submit">Add</button></form>' +
      (fr.msg ? '<p class="note">' + esc(fr.msg) + '</p>' : '') + cmp +
      (incoming.length ? '<div class="eyebrow">Requests</div><ul class="list">' + incoming.map(function (p) { return row(p, '<button class="add" data-act="fr-yes" data-id="' + p.id + '">Accept</button><button class="icon-btn" data-act="fr-no" data-id="' + p.id + '" aria-label="Decline">' + ic('trash') + '</button>'); }).join('') + '</ul>' : '') +
      '<div class="eyebrow">Your friends</div>' +
      (mine.length ? '<ul class="list">' + mine.map(function (p) { return row(p, '<button class="btn2" data-act="fr-cmp" data-id="' + p.id + '">Compare</button><button class="icon-btn" data-act="fr-no" data-id="' + p.id + '" aria-label="Remove friend">' + ic('trash') + '</button>'); }).join('') + '</ul>' : '<p class="note">' + (fr.busy ? 'Loading...' : 'No friends yet. Add someone by their username.') + '</p>') +
      (outgoing.length ? '<div class="eyebrow">Waiting for them</div><ul class="list">' + outgoing.map(function (p) { return row(p, '<button class="icon-btn" data-act="fr-no" data-id="' + p.id + '" aria-label="Cancel request">' + ic('trash') + '</button>'); }).join('') + '</ul>' : '');
  }
  V.registerTool('friends', function () { renderFriends(); loadFriends(); });

  /* ---------- leaderboards ---------- */
  var lb = { by: 'week_xp', scope: 'all', rows: null, msg: '', busy: false };
  var BYS = [['week_xp', 'XP this week'], ['total_xp', 'Total XP'], ['week_km', 'Km this week'], ['tiles', 'Explorers']];
  function loadBoard() {
    if (!sess) return;
    lb.busy = true; lb.msg = ''; renderBoard();
    var base = '/rest/v1/profiles?select=id,username,level,total_xp,week_xp,week_km,tiles&order=' + lb.by + '.desc&limit=50';
    var p;
    if (lb.scope === 'friends') {
      p = req('GET', '/rest/v1/friends?select=user_id,friend_id&status=eq.accepted&or=(user_id.eq.' + sess.id + ',friend_id.eq.' + sess.id + ')').then(function (rows) {
        var ids = [sess.id]; (rows || []).forEach(function (r) { ids.push(r.user_id === sess.id ? r.friend_id : r.user_id); });
        return req('GET', base + '&id=in.(' + ids.join(',') + ')');
      });
    } else p = req('GET', base);
    p.then(function (rows) { lb.rows = rows || []; lb.busy = false; }, function (e) { lb.busy = false; lb.msg = plain(e); }).then(function () { if (V.view() === 'board') renderBoard(); });
  }
  function renderBoard() {
    var el = $('v-board'); if (!el) return;
    if (!ready || !sess) { el.innerHTML = bar(u.BACK_TOOLS, 'Leaderboards') + '<div class="card hero"><span class="chip">' + ic('trophy') + '</span><h2>Log in first</h2><p>Leaderboards need an account.</p></div><button class="btn2 main" data-act="go" data-to="online">Account and sync</button>'; return; }
    var unit = lb.by === 'week_km' ? ' km' : lb.by === 'tiles' ? ' areas' : ' XP';
    var rows = (lb.rows || []).map(function (p, i) {
      var v = lb.by === 'week_km' ? (+p[lb.by]).toFixed(1) : p[lb.by];
      return '<li class="card row' + (p.id === sess.id ? ' me' : '') + '"><span class="rank">' + (i + 1) + '</span><div class="txt"><div class="nm">' + esc(p.username) + (p.id === sess.id ? ' (you)' : '') + '</div><div class="sub">Level ' + p.level + '</div></div><strong>' + v + unit + '</strong></li>';
    }).join('');
    el.innerHTML = bar(u.BACK_TOOLS, 'Leaderboards') +
      '<div class="chips">' + BYS.map(function (b) { return '<button class="tag' + (lb.by === b[0] ? ' on' : '') + '" data-act="lb2-by" data-id="' + b[0] + '">' + b[1] + '</button>'; }).join('') + '</div>' +
      '<div class="chips"><button class="tag' + (lb.scope === 'all' ? ' on' : '') + '" data-act="lb2-scope" data-id="all">Everyone</button><button class="tag' + (lb.scope === 'friends' ? ' on' : '') + '" data-act="lb2-scope" data-id="friends">Friends</button></div>' +
      (lb.msg ? '<p class="note">' + esc(lb.msg) + '</p>' : '') +
      (rows ? '<ul class="list">' + rows + '</ul>' : '<p class="note" style="text-align:center">' + (lb.busy ? 'Loading...' : 'Nobody here yet.') + '</p>') +
      '<p class="note">Numbers are reported by each phone. This board is for fun and friendly competition.</p>';
  }
  V.registerTool('board', function () { renderBoard(); loadBoard(); });

  /* ---------- clicks and forms ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a === 'on-test') {
      ui.test = 'Checking...'; render();
      fetch(CFG.url.replace(/\/$/, '') + '/auth/v1/settings', { headers: { apikey: CFG.key } }).then(function (r) {
        return r.text().then(function (t) {
          var j = null; try { j = JSON.parse(t); } catch (x) {}
          if (!r.ok) { ui.test = 'The server answered with error ' + r.status + '. ' + String(t).slice(0, 120) + '\nCheck the URL and key in VELENTIS-config.js.'; return; }
          var on = j && j.external && j.external.email, auto = j && j.mailer_autoconfirm, closed = j && j.disable_signup;
          ui.test = 'Server reachable.\nEmail sign-in: ' + (on ? 'on' : 'OFF') + '\nConfirm email: ' + (auto ? 'off (good)' : 'ON (turn it off)') + '\nNew sign-ups: ' + (closed ? 'BLOCKED' : 'allowed');
        });
      }).catch(function (er) { ui.test = 'Could not reach the server: ' + String(er && er.message || er) + '\nCheck your internet, and the URL in VELENTIS-config.js.'; }).then(function () { render(); });
    } else if (a === 'on-tab') { ui.tab = id; ui.msg = ''; render(); }
    else if (a === 'on-out') logout();
    else if (a === 'on-sync') { ui.busy = true; ui.msg = ''; render(); checkCloud(false).then(function () { return ui.choose ? null : pushAll(); }).catch(function (er) { ui.msg = plain(er); }).then(function () { ui.busy = false; render(); }); }
    else if (a === 'on-usecloud' && ui.choose) { applyCloud(ui.choose.data); Y.last = ui.choose.updated_at; saveY(); location.reload(); }
    else if (a === 'on-usephone') { ui.choose = null; ui.busy = true; render(); pushAll().catch(function (er) { ui.msg = plain(er); }).then(function () { ui.busy = false; render(); }); }
    else if (a === 'fr-yes') { req('PATCH', '/rest/v1/friends?user_id=eq.' + id + '&friend_id=eq.' + sess.id, { status: 'accepted' }, { 'Prefer': 'return=minimal' }).then(loadFriends, function (er) { fr.msg = plain(er); renderFriends(); }); }
    else if (a === 'fr-no') { req('DELETE', '/rest/v1/friends?or=(and(user_id.eq.' + sess.id + ',friend_id.eq.' + id + '),and(user_id.eq.' + id + ',friend_id.eq.' + sess.id + '))').then(function () { if (fr.open === id) fr.open = null; return loadFriends(); }, function (er) { fr.msg = plain(er); renderFriends(); }); }
    else if (a === 'fr-cmp') { fr.open = fr.open === id ? null : id; renderFriends(); }
    else if (a === 'lb2-by') { lb.by = id; loadBoard(); }
    else if (a === 'lb2-scope') { lb.scope = id; loadBoard(); }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'onAuto') { Y.auto = e.target.checked; saveY(); }
    else if (e.target.id === 'onVis') { Y.visible = e.target.checked; saveY(); if (sess) pushAll().catch(function () {}); }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id === 'authForm') {
      e.preventDefault();
      var name = $('auUser').value.trim().toLowerCase(), pass = $('auPass').value;
      if (!okName(name)) { ui.msg = 'Username: 3 to 20 letters, numbers or underscores.'; render(); return; }
      if (pass.length < 8) { ui.msg = 'Password needs at least 8 characters.'; render(); return; }
      auth(ui.tab, name, pass);
    } else if (e.target.id === 'frForm') {
      e.preventDefault();
      var n = $('frName').value.trim().toLowerCase();
      if (!n || n === sess.username) { fr.msg = n ? 'That is you.' : ''; renderFriends(); return; }
      req('GET', '/rest/v1/profiles?select=id,username&username=eq.' + encodeURIComponent(n)).then(function (r) {
        if (!r || !r[0]) { fr.msg = 'No one found with that username.'; renderFriends(); return; }
        return req('POST', '/rest/v1/friends', { user_id: sess.id, friend_id: r[0].id, status: 'pending' }, { 'Prefer': 'return=minimal' }).then(function () { fr.msg = 'Request sent to ' + r[0].username + '.'; return loadFriends(); });
      }).catch(function (er) { fr.msg = /duplicate|already/.test(er.raw || '') ? 'You already have a request with them.' : plain(er); renderFriends(); });
    }
  });
  V.registerSearch(function (q) { return /acc|sync|login|friend|board|rank/.test(q) ? [{ icon: 'cloud', title: 'Account and sync', sub: 'Online', to: 'online' }] : []; });

  /* on app start: if signed in, quietly check for a newer copy from another phone */
  if (ready && sess) setTimeout(function () { checkCloud(false).catch(function () {}); }, 2500);
})();
