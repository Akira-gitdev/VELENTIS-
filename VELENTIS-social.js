/* Social: private chats with friends, guilds, and invitations. Uses the same online account as Friends.
   Needs the second SQL file (VELENTIS-supabase-2.sql) to be run once in your Supabase project. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, bar = u.bar;
  var O = V.online;
  function ses() { return O && O.session(); }
  function ok() { return !!(O && O.ready && ses()); }
  function gate(el, title, icon) {
    el.innerHTML = bar(u.BACK_TOOLS, title) + '<div class="card hero"><span class="chip">' + ic(icon) + '</span><h2>Log in first</h2><p>' + (O && O.ready ? 'This needs an account.' : 'Online is not set up yet.') + '</p></div><button class="btn2 main" data-act="go" data-to="online">Account and sync</button>';
  }
  function nice(e) {
    var m = String(e && (e.raw || e.message) || '');
    if (e && (e.status === 404 || /relation|does not exist|schema cache|Could not find/i.test(m))) return 'Chats and guilds need the second setup file. Run VELENTIS-supabase-2.sql in Supabase once (see the README).';
    if (/duplicate|unique/i.test(m)) return 'That name or request already exists.';
    if (/guilds? with that code|up to 5|invite is gone/i.test(m)) return m.replace(/^.*?"message":"?/, '').replace(/".*$/, '');
    return O.plain(e);
  }
  function when(t) { var d = new Date(t), now = new Date(); return (d.toDateString() === now.toDateString() ? '' : (d.getDate() + '/' + (d.getMonth() + 1) + ' ')) + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function bubbles(list, who) {
    if (!list.length) return '<p class="note">No messages yet. Say hello.</p>';
    return list.map(function (m) {
      var mine = m.sender === ses().id;
      return '<div class="msg ' + (mine ? 'you' : 'ai') + '">' + (who && !mine ? '<div class="note" style="font-weight:700;margin-bottom:2px">' + esc(who(m.sender)) + '</div>' : '') + esc(m.body) + '<div class="note" style="text-align:right;margin-top:2px;opacity:.7">' + when(m.created_at) + '</div></div>';
    }).join('');
  }
  function compose(id, ph) {
    return '<form class="form chatbox" id="' + id + '" novalidate><input class="field" id="' + id + 'In" maxlength="500" placeholder="' + ph + '" aria-label="Message" autocomplete="off"><button class="add" type="submit">Send</button></form>';
  }
  function keep(el) { var l = el.querySelector('.msgs'); if (l && l.lastElementChild) l.lastElementChild.scrollIntoView({ block: 'end' }); }

  /* ---------- shared data ---------- */
  var S = { friends: null, prof: {}, unread: {}, last: {}, guilds: null, invites: [], finv: [], msg: '', busy: false };
  function loadBase() {
    if (!ok()) return Promise.resolve();
    var me = ses().id;
    return O.req('GET', '/rest/v1/friends?select=user_id,friend_id,status&or=(user_id.eq.' + me + ',friend_id.eq.' + me + ')').then(function (rows) {
      rows = rows || []; var acc = [], incoming = [];
      rows.forEach(function (r) { var o = r.user_id === me ? r.friend_id : r.user_id; if (r.status === 'accepted') acc.push(o); else if (r.friend_id === me) incoming.push(o); });
      S.friends = acc; S.finv = incoming;
      var ids = acc.concat(incoming); if (!ids.length) return [];
      return O.req('GET', '/rest/v1/profiles?select=id,username,level,week_xp,total_xp&id=in.(' + ids.join(',') + ')');
    }).then(function (ps) { (ps || []).forEach(function (p) { S.prof[p.id] = p; }); S.msg = ''; }, function (e) { S.msg = nice(e); });
  }
  function loadUnread() {
    if (!ok()) return Promise.resolve();
    return O.req('GET', '/rest/v1/direct_messages?select=sender,body,created_at,read,recipient&or=(sender.eq.' + ses().id + ',recipient.eq.' + ses().id + ')&order=created_at.desc&limit=200').then(function (rows) {
      S.unread = {}; S.last = {};
      (rows || []).forEach(function (m) {
        var other = m.sender === ses().id ? m.recipient : m.sender;
        if (!S.last[other]) S.last[other] = m;
        if (m.recipient === ses().id && !m.read) S.unread[other] = (S.unread[other] || 0) + 1;
      });
    }, function (e) { S.msg = nice(e); });
  }
  function loadInvites() {
    if (!ok()) return Promise.resolve();
    return O.req('GET', '/rest/v1/guild_invites?select=id,guild_id,from_user,created_at,guilds(name,motto)&to_user=eq.' + ses().id).then(function (rows) {
      S.invites = rows || [];
      var ids = S.invites.map(function (r) { return r.from_user; }).filter(function (i) { return !S.prof[i]; });
      if (!ids.length) return [];
      return O.req('GET', '/rest/v1/profiles?select=id,username,level,week_xp,total_xp&id=in.(' + ids.join(',') + ')');
    }).then(function (ps) { (ps || []).forEach(function (p) { S.prof[p.id] = p; }); }, function (e) { S.msg = nice(e); });
  }
  function name(id) { return (S.prof[id] && S.prof[id].username) || 'someone'; }

  /* ---------- Chats: list of friends ---------- */
  function renderChats() {
    var el = $('v-chats'); if (!ok()) { gate(el, 'Chats', 'mail'); return; }
    var list = (S.friends || []).slice().sort(function (a, b) { var x = S.last[a] ? S.last[a].created_at : '', y = S.last[b] ? S.last[b].created_at : ''; return x < y ? 1 : -1; });
    el.innerHTML = bar(u.BACK_TOOLS, 'Chats') + (S.msg ? '<div class="card pad"><p class="note" style="margin:0">' + esc(S.msg) + '</p></div>' : '') +
      (list.length ? '<ul class="list">' + list.map(function (id) {
        var p = S.prof[id] || { username: 'friend' }, l = S.last[id], n = S.unread[id] || 0;
        return '<li><button class="card row btn" data-act="sc-open" data-id="' + id + '"><span class="chip"><b>' + esc(p.username.charAt(0).toUpperCase()) + '</b></span><span class="txt"><div class="nm">' + esc(p.username) + '</div><div class="sub">' + (l ? esc((l.sender === ses().id ? 'You: ' : '') + l.body.slice(0, 40)) : 'Say hello') + '</div></span>' + (n ? '<span class="pill" style="color:var(--accent);border-color:var(--accent)">' + n + ' new</span>' : ic('chev')) + '</button></li>';
      }).join('') + '</ul>' : '<div class="card hero"><span class="chip">' + ic('users') + '</span><h2>No friends to chat with yet</h2><p>Add a friend by username first. Then you can message each other here.</p></div><button class="btn2 main" data-act="go" data-to="friends">Open friends</button>') +
      '<p class="note">Chats are only between you and your friend. Be kind. You can delete your own messages by long pressing them.</p>';
  }
  V.registerTool('chats', function () { renderChats(); if (ok()) Promise.all([loadBase(), loadUnread()]).then(function () { if (V.view() === 'chats') renderChats(); }); });

  /* ---------- one chat thread ---------- */
  var T = { id: null, msgs: [], busy: false };
  function renderThread() {
    var el = $('v-chat'); if (!ok() || !T.id) { gate(el, 'Chat', 'mail'); return; }
    el.innerHTML = bar('data-act="go" data-to="chats"', name(T.id)) + '<div class="msgs" id="scList">' + bubbles(T.msgs) + '</div>' + compose('scForm', 'Message ' + esc(name(T.id)));
    keep(el);
  }
  V.registerView('chat', function () { renderThread(); });
  function pullThread() {
    if (!ok() || !T.id) return Promise.resolve();
    var me = ses().id, other = T.id;
    return O.req('GET', '/rest/v1/direct_messages?select=id,sender,recipient,body,created_at&or=(and(sender.eq.' + me + ',recipient.eq.' + other + '),and(sender.eq.' + other + ',recipient.eq.' + me + '))&order=created_at.asc&limit=100').then(function (rows) {
      var changed = (rows || []).length !== T.msgs.length || (rows.length && rows[rows.length - 1].id !== (T.msgs[T.msgs.length - 1] || {}).id);
      T.msgs = rows || [];
      if (changed && V.view() === 'chat') { var inp = $('scFormIn'), v = inp ? inp.value : ''; renderThread(); if ($('scFormIn')) $('scFormIn').value = v; }
      return O.req('PATCH', '/rest/v1/direct_messages?recipient=eq.' + me + '&sender=eq.' + other + '&read=eq.false', { read: true }, { 'Prefer': 'return=minimal' });
    }).catch(function (e) { S.msg = nice(e); });
  }

  /* ---------- Guilds ---------- */
  function loadGuilds() {
    if (!ok()) return Promise.resolve();
    return O.req('GET', '/rest/v1/guild_members?select=role,guilds(id,name,motto,code,owner)&user_id=eq.' + ses().id).then(function (rows) {
      S.guilds = (rows || []).filter(function (r) { return r.guilds; }).map(function (r) { return Object.assign({ role: r.role }, r.guilds); });
      S.msg = '';
    }, function (e) { S.guilds = S.guilds || []; S.msg = nice(e); });
  }
  function renderGuilds() {
    var el = $('v-guilds'); if (!ok()) { gate(el, 'Guilds', 'shield'); return; }
    var gl = S.guilds || [];
    el.innerHTML = bar(u.BACK_TOOLS, 'Guilds') + (S.msg ? '<div class="card pad"><p class="note" style="margin:0">' + esc(S.msg) + '</p></div>' : '') +
      (gl.length ? '<ul class="list">' + gl.map(function (g) {
        return '<li><button class="card row btn" data-act="sg-open" data-id="' + g.id + '"><span class="chip">' + ic('shield') + '</span><span class="txt"><div class="nm">' + esc(g.name) + '</span><span class="sub">' + esc(g.motto || (g.role === 'owner' ? 'You lead this guild' : 'Member')) + '</span></span>' + ic('chev') + '</button></li>';
      }).join('') + '</ul>' : '<div class="card hero"><span class="chip">' + ic('shield') + '</span><h2>No guild yet</h2><p>A guild is a small group that cheers each other on. Start one, or join with a code a friend gives you.</p></div>') +
      '<div class="card pad"><div class="eyebrow">Start a guild</div><form class="stack" id="sgNew" novalidate style="gap:8px;margin-top:10px"><input class="field" id="sgName" maxlength="24" placeholder="Guild name (3 to 24 letters)" aria-label="Guild name" autocomplete="off"><input class="field" id="sgMotto" maxlength="80" placeholder="Motto (optional)" aria-label="Motto" autocomplete="off"><button class="add" type="submit" style="width:100%">Create guild</button></form></div>' +
      '<div class="card pad"><div class="eyebrow">Join with a code</div><form class="form" id="sgJoin" novalidate style="margin-top:10px"><input class="field" id="sgCode" maxlength="6" autocapitalize="none" placeholder="6 letter code" aria-label="Guild code" autocomplete="off"><button class="add" type="submit">Join</button></form></div>';
  }
  V.registerTool('guilds', function () { renderGuilds(); loadGuilds().then(function () { if (V.view() === 'guilds') renderGuilds(); }); });

  var G = { id: null, g: null, members: [], msgs: [], tab: 'chat', msg: '', pend: false };
  function renderGuild() {
    var el = $('v-guild'); if (!ok() || !G.g) { gate(el, 'Guild', 'shield'); return; }
    var g = G.g, wk = 0, tot = 0;
    G.members.forEach(function (m) { var p = S.prof[m.user_id]; if (p) { wk += p.week_xp || 0; tot += p.total_xp || 0; } });
    var head = '<div class="card pad"><div class="eyebrow">' + esc(g.motto || 'Guild') + '</div><div style="font-family:var(--serif);font-weight:700;font-size:20px;margin:4px 0">' + esc(g.name) + '</div><div class="note">' + G.members.length + ' member' + (G.members.length === 1 ? '' : 's') + ' · ' + wk + ' XP together this week</div></div>';
    var tabs = '<div class="chips">' + [['chat', 'Chat'], ['members', 'Members'], ['invite', 'Invite']].map(function (t) { return '<button class="tag' + (G.tab === t[0] ? ' on' : '') + '" data-act="sg-tab" data-id="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>';
    var body;
    if (G.tab === 'chat') body = '<div class="msgs" id="sgList">' + bubbles(G.msgs, name) + '</div>' + compose('sgForm', 'Message the guild');
    else if (G.tab === 'members') {
      body = '<ul class="list">' + G.members.slice().sort(function (a, b) { return ((S.prof[b.user_id] || {}).week_xp || 0) - ((S.prof[a.user_id] || {}).week_xp || 0); }).map(function (m, i) {
        var p = S.prof[m.user_id] || { username: 'hidden' };
        return '<li class="card row"><span class="rank">' + (i + 1) + '</span><div class="txt"><div class="nm">' + esc(p.username) + (m.role === 'owner' ? ' · leader' : '') + (m.user_id === ses().id ? ' (you)' : '') + '</div><div class="sub">' + (p.level ? 'Level ' + p.level : '') + '</div></div><strong>' + (p.week_xp || 0) + ' XP</strong></li>';
      }).join('') + '</ul>' +
        '<button class="btn2' + (G.pend ? ' warn' : '') + '" data-act="sg-leave">' + (G.pend ? 'Tap again to ' + (g.owner === ses().id ? 'delete this guild' : 'leave') : (g.owner === ses().id ? 'Delete guild' : 'Leave guild')) + '</button>';
    } else {
      var inGuild = G.members.map(function (m) { return m.user_id; });
      var cand = (S.friends || []).filter(function (id) { return inGuild.indexOf(id) < 0; });
      body = '<div class="card pad"><div class="eyebrow">Guild code</div><div style="font-family:var(--serif);font-weight:700;font-size:26px;letter-spacing:.2em;margin:8px 0">' + esc(g.code) + '</div><p class="note" style="margin:0">Anyone with this code can join. Share it only with people you trust.</p></div>' +
        '<div class="eyebrow" style="padding:0 4px">Invite a friend</div>' + (cand.length ? '<ul class="list">' + cand.map(function (id) { return '<li class="card row"><span class="chip"><b>' + esc(name(id).charAt(0).toUpperCase()) + '</b></span><div class="txt"><div class="nm">' + esc(name(id)) + '</div></div><button class="add" data-act="sg-invite" data-id="' + id + '">Invite</button></li>'; }).join('') + '</ul>' : '<p class="note">All your friends are already here, or you have no friends yet.</p>');
    }
    el.innerHTML = bar('data-act="go" data-to="guilds"', 'Guild') + head + tabs + (G.msg ? '<p class="note">' + esc(G.msg) + '</p>' : '') + body;
    keep(el);
  }
  V.registerView('guild', function () { renderGuild(); });
  function pullGuild() {
    if (!ok() || !G.id) return Promise.resolve();
    return Promise.all([
      O.req('GET', '/rest/v1/guild_members?select=user_id,role&guild_id=eq.' + G.id),
      O.req('GET', '/rest/v1/guild_messages?select=id,sender,body,created_at&guild_id=eq.' + G.id + '&order=created_at.asc&limit=100')
    ]).then(function (r) {
      var members = r[0] || [], msgs = r[1] || [];
      var ids = members.map(function (m) { return m.user_id; }).concat(msgs.map(function (m) { return m.sender; })).filter(function (i, k, a) { return a.indexOf(i) === k; });
      return O.req('GET', '/rest/v1/profiles?select=id,username,level,week_xp,total_xp&id=in.(' + ids.join(',') + ')').then(function (ps) {
        (ps || []).forEach(function (p) { S.prof[p.id] = p; });
        var changed = msgs.length !== G.msgs.length || members.length !== G.members.length || (msgs.length && msgs[msgs.length - 1].id !== (G.msgs[G.msgs.length - 1] || {}).id);
        G.members = members; G.msgs = msgs;
        if (V.view() === 'guild' && (changed || !G.seen)) { G.seen = 1; var inp = $('sgFormIn'), v = inp ? inp.value : ''; renderGuild(); if ($('sgFormIn')) $('sgFormIn').value = v; }
      });
    }).catch(function (e) { G.msg = nice(e); if (V.view() === 'guild') renderGuild(); });
  }

  /* ---------- Invites ---------- */
  function renderInvites() {
    var el = $('v-invites'); if (!ok()) { gate(el, 'Invites', 'bell'); return; }
    var gi = S.invites || [], fi = S.finv || [];
    el.innerHTML = bar(u.BACK_TOOLS, 'Invites') + (S.msg ? '<div class="card pad"><p class="note" style="margin:0">' + esc(S.msg) + '</p></div>' : '') +
      '<div class="eyebrow" style="padding:0 4px">Guild invitations</div>' +
      (gi.length ? '<ul class="list">' + gi.map(function (r) {
        return '<li class="card row"><span class="chip">' + ic('shield') + '</span><div class="txt"><div class="nm">' + esc(r.guilds ? r.guilds.name : 'A guild') + '</div><div class="sub">from ' + esc(name(r.from_user)) + '</div></div><button class="add" data-act="si-yes" data-id="' + r.id + '">Join</button><button class="icon-btn" data-act="si-no" data-id="' + r.id + '" aria-label="Decline">' + ic('trash') + '</button></li>';
      }).join('') + '</ul>' : '<p class="note">No guild invitations right now.</p>') +
      '<div class="eyebrow" style="padding:0 4px">Friend requests</div>' +
      (fi.length ? '<ul class="list">' + fi.map(function (id) {
        return '<li class="card row"><span class="chip"><b>' + esc(name(id).charAt(0).toUpperCase()) + '</b></span><div class="txt"><div class="nm">' + esc(name(id)) + '</div><div class="sub">wants to be friends</div></div><button class="add" data-act="si-fyes" data-id="' + id + '">Accept</button><button class="icon-btn" data-act="si-fno" data-id="' + id + '" aria-label="Decline">' + ic('trash') + '</button></li>';
      }).join('') + '</ul>' : '<p class="note">No friend requests right now.</p>');
  }
  V.registerTool('invites', function () { renderInvites(); if (ok()) Promise.all([loadBase(), loadInvites()]).then(function () { if (V.view() === 'invites') renderInvites(); }); });

  /* ---------- actions ---------- */
  function fail(e, rerender) { S.msg = nice(e); G.msg = S.msg; rerender(); }
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a === 'sc-open') { T = { id: id, msgs: [], busy: false }; V.go('chat'); pullThread(); }
    else if (a === 'sg-open') {
      G = { id: id, g: (S.guilds || []).filter(function (g) { return g.id === id; })[0], members: [], msgs: [], tab: 'chat', msg: '', pend: false };
      V.go('guild'); Promise.all([loadBase(), pullGuild()]);
    }
    else if (a === 'sg-tab') { G.tab = id; G.msg = ''; renderGuild(); }
    else if (a === 'sg-invite') {
      O.req('POST', '/rest/v1/guild_invites', { guild_id: G.id, from_user: ses().id, to_user: id }, { 'Prefer': 'return=minimal' }).then(function () { G.msg = 'Invitation sent to ' + name(id) + '.'; renderGuild(); }, function (er) { G.msg = /duplicate|unique/i.test(String(er.raw)) ? 'They already have an invitation.' : nice(er); renderGuild(); });
    }
    else if (a === 'sg-leave') {
      if (!G.pend) { G.pend = true; renderGuild(); setTimeout(function () { G.pend = false; if (V.view() === 'guild') renderGuild(); }, 3000); return; }
      var del = G.g.owner === ses().id;
      (del ? O.req('DELETE', '/rest/v1/guilds?id=eq.' + G.id) : O.req('DELETE', '/rest/v1/guild_members?guild_id=eq.' + G.id + '&user_id=eq.' + ses().id)).then(function () { G = { id: null, g: null, members: [], msgs: [], tab: 'chat', msg: '', pend: false }; V.go('guilds'); }, function (er) { fail(er, renderGuild); });
    }
    else if (a === 'si-yes') { O.req('POST', '/rest/v1/rpc/accept_guild_invite', { inv: id }).then(function () { return Promise.all([loadInvites(), loadGuilds()]); }).then(function () { S.msg = 'Welcome to the guild.'; renderInvites(); }, function (er) { fail(er, renderInvites); }); }
    else if (a === 'si-no') { O.req('DELETE', '/rest/v1/guild_invites?id=eq.' + id).then(loadInvites).then(renderInvites, function (er) { fail(er, renderInvites); }); }
    else if (a === 'si-fyes') { O.req('PATCH', '/rest/v1/friends?user_id=eq.' + id + '&friend_id=eq.' + ses().id, { status: 'accepted' }, { 'Prefer': 'return=minimal' }).then(loadBase).then(renderInvites, function (er) { fail(er, renderInvites); }); }
    else if (a === 'si-fno') { O.req('DELETE', '/rest/v1/friends?user_id=eq.' + id + '&friend_id=eq.' + ses().id).then(loadBase).then(renderInvites, function (er) { fail(er, renderInvites); }); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.id;
    if (f === 'scForm') {
      e.preventDefault(); var v = $('scFormIn').value.trim(); if (!v || T.busy) return; T.busy = true;
      O.req('POST', '/rest/v1/direct_messages', { sender: ses().id, recipient: T.id, body: v }, { 'Prefer': 'return=minimal' }).then(function () { $('scFormIn').value = ''; return pullThread(); }, function (er) { S.msg = nice(er); }).then(function () { T.busy = false; if (S.msg && V.view() === 'chat') { var l = $('scList'); if (l) l.insertAdjacentHTML('beforeend', '<div class="msg err">' + esc(S.msg) + '</div>'); S.msg = ''; } });
    } else if (f === 'sgForm') {
      e.preventDefault(); var w = $('sgFormIn').value.trim(); if (!w) return;
      O.req('POST', '/rest/v1/guild_messages', { guild_id: G.id, sender: ses().id, body: w }, { 'Prefer': 'return=minimal' }).then(function () { $('sgFormIn').value = ''; return pullGuild(); }, function (er) { G.msg = nice(er); renderGuild(); });
    } else if (f === 'sgNew') {
      e.preventDefault(); var n = $('sgName').value.trim(), m = $('sgMotto').value.trim();
      if (n.length < 3) { S.msg = 'Guild name needs 3 or more letters.'; renderGuilds(); return; }
      if (V.eco && !V.eco.has('guild')) { S.msg = 'Starting a guild costs ' + V.eco.cost('guild') + ' crystals. Unlock it in the Market. Joining a guild is free.'; renderGuilds(); return; }
      O.req('POST', '/rest/v1/rpc/create_guild', { gname: n, gmotto: m }).then(function () { return loadGuilds(); }).then(function () { S.msg = 'Guild created.'; renderGuilds(); }, function (er) { fail(er, renderGuilds); });
    } else if (f === 'sgJoin') {
      e.preventDefault(); var c = $('sgCode').value.trim().toLowerCase(); if (c.length < 4) return;
      O.req('POST', '/rest/v1/rpc/join_guild_code', { c: c }).then(function () { return loadGuilds(); }).then(function () { S.msg = 'You joined the guild.'; renderGuilds(); }, function (er) { fail(er, renderGuilds); });
    }
  });
  /* new messages arrive while a chat is open */
  setInterval(function () {
    if (document.hidden || !ok()) return;
    if (V.view() === 'chat') pullThread(); else if (V.view() === 'guild') pullGuild();
  }, 6000);
  V.registerSearch(function (q) {
    var out = [];
    if (/chat|messag|dm/.test(q)) out.push({ icon: 'mail', title: 'Chats', sub: 'Message friends', to: 'chats' });
    if (/guild|clan|team/.test(q)) out.push({ icon: 'shield', title: 'Guilds', sub: 'Groups with friends', to: 'guilds' });
    if (/invit/.test(q)) out.push({ icon: 'bell', title: 'Invites', sub: 'Guild and friend invites', to: 'invites' });
    return out;
  });
  V.social = { unread: function () { return Object.keys(S.unread).reduce(function (n, k) { return n + S.unread[k]; }, 0); }, refresh: function () { return Promise.all([loadBase(), loadUnread(), loadInvites(), loadGuilds()]); } };
})();
