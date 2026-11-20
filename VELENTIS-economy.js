/* VELENTIS Market: crystals (earned by effort, kept on this phone), gold (kept on the server so it cannot be faked),
   gifts, trades and duels between friends, and the free outfit for every account.
   Gold, gifts, trades and duels need the third SQL file (VELENTIS-supabase-3.sql) to be run once in Supabase. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, bar = u.bar, core = V.core, O = V.online;
  var EK = 'velentis.eco.v1';
  var E = u.get(EK, null); if (!E || typeof E !== 'object') E = {};
  E.cr = E.cr | 0; E.frac = +E.frac || 0; E.seen = E.seen == null ? null : +E.seen; E.day = E.day || ''; E.dayCr = E.dayCr | 0; E.login = E.login || '';
  E.un = E.un && typeof E.un === 'object' ? E.un : {}; E.loot = Array.isArray(E.loot) ? E.loot : []; E.hold = E.hold && typeof E.hold === 'object' ? E.hold : {};
  E.applied = E.applied && typeof E.applied === 'object' ? E.applied : {}; E.gold = E.gold | 0; E.lg = !!E.lg;
  function save() { u.put(EK, E); }
  function today() { return u.iso(new Date()); }

  /* ---------- what crystals unlock, and what gold buys ---------- */
  var UNL = [
    ['commander', 'Vel Commander mode', 20, 'Vel speaks like a strict commander and gives you orders.'],
    ['guild', 'Start a guild', 30, 'Create your own guild. Joining one is always free.']
  ];
  var SHOP = [['gate', 300], ['raid', 600]];
  var LOOT = ['Rusty coin pouch', 'Cracked gem', 'Torn map', 'Iron shard', 'Wolf fang', 'Moon glass'];
  function unl(id) { return UNL.filter(function (x) { return x[0] === id; })[0]; }
  try { var vv = JSON.parse(localStorage.getItem('velentis.vel.v1') || 'null'); if (vv && vv.mode === 'commander') E.un.commander = 1; } catch (e) {}

  /* ---------- crystals ---------- */
  function addCr(n, why) { n = n | 0; if (n <= 0) return; E.cr += n; save(); if (why) V.toast('+' + n + ' crystals' + (why === true ? '' : ' · ' + why)); refreshHub(); }
  function xpTick() {
    var t = core.state().total | 0;
    if (E.seen == null) { E.seen = t; save(); return; }
    var d = t - E.seen; E.seen = t;
    if (d > 0) {
      if (E.day !== today()) { E.day = today(); E.dayCr = 0; }
      E.frac += d / 10; var n = Math.floor(E.frac); E.frac -= n;
      n = Math.max(0, Math.min(n, 60 - E.dayCr)); E.dayCr += n; E.cr += n;
    }
    save(); refreshHub();
  }
  V.on('core.changed', xpTick);
  V.on('dungeon.clear', function (d) { addCr(3 * ((d && d.units) || 1), 'dungeon'); });
  if (E.login !== today()) { E.login = today(); E.cr += 2; save(); setTimeout(function () { V.toast('+2 crystals · daily visit'); }, 1500); }

  /* ---------- online helpers ---------- */
  function ses() { return O && O.session(); }
  function ok() { return !!(O && O.ready && ses()); }
  function rpc(name, args) { return O.req('POST', '/rest/v1/rpc/' + name, args || {}); }
  function nice(e) {
    var m = String(e && (e.raw || e.message) || '');
    if (e && (e.status === 404 || /schema cache|does not exist|Could not find/i.test(m))) return 'The Market needs the third setup file. Run VELENTIS-supabase-3.sql in Supabase once.';
    var mm = m.match(/"message"\s*:\s*"([^"]+)"/); if (mm) return mm[1];
    if (/^[A-Z][^{}]{3,100}$/.test(m)) return m;
    return O.plain(e);
  }
  var F = { friends: [], prof: {}, loaded: false };
  function name(id) { var p = F.prof[id]; return p ? p.username : (id ? 'a player' : 'Velentis'); }
  function loadFriends() {
    if (!ok()) return Promise.resolve();
    var me = ses().id;
    return O.req('GET', '/rest/v1/friends?select=user_id,friend_id,status&status=eq.accepted&or=(user_id.eq.' + me + ',friend_id.eq.' + me + ')').then(function (rows) {
      F.friends = (rows || []).map(function (r) { return r.user_id === me ? r.friend_id : r.user_id; });
      return needNames(F.friends);
    }).then(function () { F.loaded = true; }, function () { F.loaded = true; });
  }
  function needNames(ids) {
    var miss = ids.filter(function (i) { return i && !F.prof[i]; }); if (!miss.length) return Promise.resolve();
    return O.req('GET', '/rest/v1/profiles?select=id,username,level&id=in.(' + miss.join(',') + ')').then(function (ps) { (ps || []).forEach(function (p) { F.prof[p.id] = p; }); }, function () {});
  }

  /* ---------- gold ---------- */
  function setGold(n) { E.gold = n | 0; save(); refreshHub(); }
  function pullGold() { if (!ok()) return Promise.resolve(); return rpc('wallet_get').then(function (g) { setGold(g); return g; }, function () {}); }
  function earnGold(src, amt) {
    if (!ok()) return Promise.resolve(0);
    var before = E.gold;
    return rpc('gold_earn', { src: src, amt: amt }).then(function (g) {
      var got = (g | 0) - before; setGold(g); if (got > 0) V.toast('+' + got + ' gold'); return got;
    }, function () { return 0; });
  }
  function loot(rank) {
    var r = Math.max(0, Math.min(5, rank | 0)), it = { id: u.uid(), n: LOOT[r], v: 8 + r * 12 + Math.floor(Math.random() * 10) };
    E.loot.push(it); E.loot = E.loot.slice(-40); save(); return it;
  }
  function boss(rank) { return earnGold('boss', 20 + (rank | 0) * 12); }

  /* ---------- gifts ---------- */
  var G = { list: [], sent: 0 };
  function loadGifts() {
    if (!ok()) return Promise.resolve();
    return O.req('GET', '/rest/v1/gifts?select=id,sender,kind,fit,gold,note,code,status,created_at&recipient=eq.' + ses().id + '&status=eq.pending&order=created_at.asc').then(function (rows) {
      G.list = rows || []; return needNames(G.list.map(function (g) { return g.sender; }));
    }, function (e) { M.msg = nice(e); });
  }
  function applyGift(r) {
    if (r && r.kind === 'fit' && r.fit) { var f = V.outfit.add(r.fit, false); return f ? f.name : (V.outfit.get(r.fit) || {}).name; }
    if (r && r.kind === 'gold') { pullGold(); return '+' + r.gold + ' gold'; }
    return '';
  }
  function claim(id) {
    return rpc('claim_gift', { gid: id }).then(function (r) { var w = applyGift(r); return loadGifts().then(function () { return w; }); });
  }
  /* the free outfit is claimed by itself the first time you open the app logged in */
  function welcome() {
    if (!ok()) return Promise.resolve();
    return rpc('welcome_check').then(loadGifts).then(function () {
      var mine = G.list.filter(function (g) { return g.code === 'welcome'; });
      return mine.reduce(function (p, g) { return p.then(function () { return claim(g.id).then(function (w) { if (w) V.toast('A gift arrived: ' + w); }); }); }, Promise.resolve());
    }, function (e) {
      if (!E.lg && V.outfit) { E.lg = true; save(); V.outfit.gift(); }   /* the setup file is missing: give it on this phone anyway */
    });
  }

  /* ---------- trades ---------- */
  var T = { open: [], cur: null, offerG: 0, offerF: [] };
  function loadTrades() {
    if (!ok()) return Promise.resolve();
    return O.req('GET', '/rest/v1/trades?select=*&status=eq.open&order=updated_at.desc&limit=20').then(function (rows) {
      T.open = rows || [];
      return needNames(T.open.map(function (t) { return t.a === ses().id ? t.b : t.a; }));
    }).then(syncClosed, function (e) { M.msg = nice(e); });
  }
  function side(t) { var me = ses().id; return t.a === me ? { me: 'a', you: 'b' } : { me: 'b', you: 'a' }; }
  function giveBack(tid) { (E.hold[tid] || []).forEach(function (id) { V.outfit.add(id, false); }); delete E.hold[tid]; save(); }
  /* closed trades: hand over what you won, or return what you set aside */
  function syncClosed() {
    return O.req('GET', '/rest/v1/trades?select=*&status=in.(done,cancelled)&order=updated_at.desc&limit=15').then(function (rows) {
      (rows || []).forEach(function (t) {
        if (E.applied[t.id]) return;
        var s = side(t);
        if (t.status === 'done') { (t[s.you + '_fits'] || []).forEach(function (id) { V.outfit.add(id, false); }); delete E.hold[t.id]; if ((t[s.you + '_fits'] || []).length) V.toast('Trade done. New outfit received.'); pullGold(); }
        else giveBack(t.id);
        E.applied[t.id] = 1; save();
      });
      var keys = Object.keys(E.applied); if (keys.length > 60) { keys.slice(0, keys.length - 60).forEach(function (k) { delete E.applied[k]; }); save(); }
    }, function () {});
  }

  /* ---------- duels ---------- */
  var D = { open: [], done: [], res: '' };
  function power() {
    var lv = core.levelInfo(core.state().total).level, g = 0;
    (V.gear.slots || []).forEach(function (s) { g += V.gear.tier(s[0]); });
    return Math.max(1, lv * 8 + g * 6);
  }
  function loadDuels() {
    if (!ok()) return Promise.resolve();
    return O.req('GET', '/rest/v1/duels?select=*&order=created_at.desc&limit=14').then(function (rows) {
      rows = rows || []; var me = ses().id;
      D.open = rows.filter(function (d) { return d.status === 'pending'; }); D.done = rows.filter(function (d) { return d.status === 'done'; }).slice(0, 6);
      return needNames(rows.map(function (d) { return d.a === me ? d.b : d.a; }));
    }, function (e) { M.msg = nice(e); });
  }

  /* ---------- the screen ---------- */
  var M = { tab: 'wallet', msg: '', trade: null, busy: false };
  var TABS = [['wallet', 'Wallet'], ['shop', 'Shop'], ['gifts', 'Gifts'], ['trades', 'Trades'], ['duels', 'Duels']];
  function refreshHub() { if (V.view() === 'market') safeRender(); }
  function safeRender() { var a = document.activeElement; if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && $('v-market') && $('v-market').contains(a)) return; render(); }
  function needLogin(what) {
    return '<div class="card hero"><span class="chip">' + ic('cloud') + '</span><h2>Log in first</h2><p>' + what + ' need an account.' + (O && O.ready ? '' : ' Online features are not set up in this app yet.') + '</p></div><button class="btn2 main" data-act="go" data-to="online">Account and sync</button>';
  }
  function fname(id) { var f = V.outfit.get(id); return f ? f.name : id; }
  function friendSelect(id) {
    if (!F.friends.length) return '<p class="note">Add a friend first. Gifts, trades and duels are for friends only.</p><button class="btn2" data-act="go" data-to="friends">Open friends</button>';
    return '<select class="field" id="' + id + '" aria-label="Friend">' + F.friends.map(function (f) { return '<option value="' + f + '">' + esc(name(f)) + '</option>'; }).join('') + '</select>';
  }
  function tabWallet() {
    var rows = '';
    return '<div class="card hero"><span class="chip">' + ic('spark') + '</span><h2>' + E.cr + ' crystals</h2><p>You earn crystals from effort: about 1 for every 10 XP (up to 60 a day), dungeons, and a small daily visit bonus. They stay on this phone and cannot be traded.</p></div>' +
      '<div class="card hero"><span class="chip">' + ic('award') + '</span><h2>' + (ok() ? E.gold + ' gold' : 'Gold needs an account') + '</h2><p>Gold comes from boss floors, selling dungeon loot and winning duels. It is kept on the server, so nobody can fake it. At most 500 gold a day from bosses and selling.</p></div>' +
      '<div class="card pad"><div class="eyebrow">Crystals buy</div><p class="note" style="margin:6px 0 0">Extra features, like Commander mode and starting a guild. See the Shop tab.</p><div class="eyebrow" style="margin-top:12px">Gold buys</div><p class="note" style="margin:6px 0 0">Dungeon outfits, gifts for friends and trades. See Shop, Gifts and Trades.</p></div>' +
      (ok() ? '<div id="ecLog"></div>' : '');
  }
  function tabShop() {
    var h = '<div class="eyebrow">Unlock with crystals</div>' + UNL.map(function (x) {
      var has = !!E.un[x[0]];
      return '<div class="card pad"><b>' + esc(x[1]) + '</b><div class="sub" style="margin:4px 0 8px">' + esc(x[3]) + '</div>' + (has ? '<span class="tag on">Unlocked</span>' : '<button class="btn2 main" data-act="ec-unlock" data-id="' + x[0] + '"' + (E.cr < x[2] ? ' disabled' : '') + '>Unlock for ' + x[2] + ' crystals</button>') + '</div>';
    }).join('');
    h += '<div class="eyebrow" style="margin-top:14px">Outfits for gold</div>';
    if (!ok()) h += '<p class="note">Log in to buy with gold.</p>';
    else h += SHOP.map(function (s) {
      var own = V.outfit.own(s[0]);
      return '<div class="card pad"><b>' + esc(fname(s[0])) + '</b><div class="sub" style="margin:4px 0 8px">A full set. You can also find it in dungeons.</div>' + (own ? '<span class="tag on">You own it</span>' : '<button class="btn2 main" data-act="ec-buy" data-id="' + s[0] + '"' + (E.gold < s[1] ? ' disabled' : '') + '>Buy for ' + s[1] + ' gold</button>') + '</div>';
    }).join('');
    h += '<div class="eyebrow" style="margin-top:14px">Sell loot</div>';
    if (!E.loot.length) h += '<p class="note">No loot yet. Clear dungeons to find some.</p>';
    else {
      var tot = E.loot.reduce(function (a, i) { return a + i.v; }, 0);
      h += '<ul class="list">' + E.loot.map(function (i) { return '<li class="card row"><span class="chip">' + ic('award') + '</span><span class="txt"><div class="nm">' + esc(i.n) + '</div><div class="sub">' + i.v + ' gold</div></span><button class="btn2" style="flex:none" data-act="ec-sell" data-id="' + i.id + '"' + (ok() ? '' : ' disabled') + '>Sell</button></li>'; }).join('') + '</ul>' +
        '<button class="btn2" data-act="ec-sellall"' + (ok() ? '' : ' disabled') + '>Sell all for ' + tot + ' gold</button>' + (ok() ? '' : '<p class="note">Log in to sell.</p>');
    }
    return h;
  }
  function tabGifts() {
    if (!ok()) return needLogin('Gifts');
    var inbox = G.list.length ? '<ul class="list">' + G.list.map(function (g) {
      return '<li class="card row"><span class="chip">' + ic('award') + '</span><span class="txt"><div class="nm">' + (g.kind === 'gold' ? g.gold + ' gold' : esc(fname(g.fit))) + '</div><div class="sub">from ' + esc(g.sender ? name(g.sender) : 'Velentis') + (g.note ? ' · ' + esc(g.note) : '') + '</div></span><button class="btn2 main" style="flex:none" data-act="ec-claim" data-id="' + g.id + '">Claim</button></li>';
    }).join('') + '</ul>' : '<p class="note">No gifts waiting.</p>';
    var tr = V.outfit.mine().filter(function (f) { return V.outfit.tradable(f.id); });
    return '<div class="eyebrow">Waiting for you</div>' + inbox + '<div class="eyebrow" style="margin-top:14px">Send a gift</div>' +
      '<form class="form" id="ecGift" novalidate>' + friendSelect('ecGF') +
      '<select class="field" id="ecGK" aria-label="Gift type"><option value="gold">Gold (1 to 100)</option>' + tr.map(function (f) { return '<option value="fit:' + f.id + '">Outfit: ' + esc(f.name) + '</option>'; }).join('') + '</select>' +
      '<input class="field" id="ecGA" type="number" min="1" max="100" inputmode="numeric" placeholder="Gold amount" aria-label="Gold amount">' +
      '<input class="field" id="ecGN" maxlength="120" placeholder="A short note (optional)" aria-label="Note" autocomplete="off">' +
      '<button class="btn2 main" type="submit"' + (F.friends.length ? '' : ' disabled') + '>Send gift</button></form>' +
      '<p class="note">One gift per friend per day. Your account and level-10 outfits cannot be given away. Crystals cannot be gifted.</p>';
  }
  function offerHtml(t, mine) {
    var s = side(t), who = mine ? s.me : s.you, g = t[who + '_gold'], fits = t[who + '_fits'] || [];
    return (g ? g + ' gold' : '') + (g && fits.length ? ' + ' : '') + fits.map(fname).join(', ') || 'Nothing yet';
  }
  function tabTrades() {
    if (!ok()) return needLogin('Trades');
    var t = M.trade && T.open.filter(function (x) { return x.id === M.trade; })[0];
    if (t) {
      var s = side(t), other = t[s.you === 'a' ? 'a' : 'b'], okMe = t[s.me + '_ok'], okYou = t[s.you + '_ok'];
      var mine = V.outfit.mine().filter(function (f) { return V.outfit.tradable(f.id); });
      (E.hold[t.id] || []).forEach(function (id) { if (!mine.some(function (f) { return f.id === id; })) mine.push(V.outfit.get(id)); });
      var sel = T.offerF.length || T.offerG || E.hold[t.id] ? T.offerF : (t[s.me + '_fits'] || []);
      return '<div class="card pad"><div class="eyebrow">Trading with ' + esc(name(other)) + '</div></div>' +
        '<div class="card pad"><div class="eyebrow">They offer</div><b>' + esc(offerHtml(t, false)) + '</b><div class="sub">' + (okYou ? 'They confirmed' : 'Not confirmed yet') + '</div></div>' +
        '<form class="card pad form" id="ecOffer" novalidate><div class="eyebrow">You offer</div>' +
        '<input class="field" id="ecTG" type="number" min="0" inputmode="numeric" value="' + (T.offerG != null ? T.offerG : t[s.me + '_gold']) + '" aria-label="Gold you offer">' +
        (mine.length ? mine.map(function (f) { return '<label class="row" style="gap:10px;padding:6px 0"><input type="checkbox" class="ecTF" value="' + f.id + '"' + (sel.indexOf(f.id) !== -1 ? ' checked' : '') + '> ' + esc(f.name) + '</label>'; }).join('') : '<p class="note">You have no outfits that can be traded.</p>') +
        '<button class="btn2" type="submit">Save my offer</button><div class="sub">Saved: ' + esc(offerHtml(t, true)) + ' · ' + (okMe ? 'You confirmed' : 'You have not confirmed') + '</div></form>' +
        '<button class="btn2 main" data-act="ec-tconfirm" data-id="' + t.id + '"' + (okMe ? ' disabled' : '') + '>Confirm this trade</button>' +
        '<button class="btn2" data-act="ec-tcancel" data-id="' + t.id + '">Cancel trade</button><button class="link" data-act="ec-tback">Back to trades</button>' +
        '<p class="note">Changing an offer clears both confirmations. When you both confirm, everything swaps at once.</p>';
    }
    return '<div class="eyebrow">Open trades</div>' + (T.open.length ? '<ul class="list">' + T.open.map(function (x) {
      var s = side(x), o = x[s.you];
      return '<li><button class="card row btn" data-act="ec-topen" data-id="' + x.id + '"><span class="chip">' + ic('users') + '</span><span class="txt"><div class="nm">' + esc(name(o)) + '</div><div class="sub">You: ' + esc(offerHtml(x, true)) + ' · They: ' + esc(offerHtml(x, false)) + '</div></span></button></li>';
    }).join('') + '</ul>' : '<p class="note">No open trades.</p>') +
      '<div class="eyebrow" style="margin-top:14px">Start a trade</div><form class="form" id="ecNewTrade" novalidate>' + friendSelect('ecTF2') + '<button class="btn2 main" type="submit"' + (F.friends.length ? '' : ' disabled') + '>Start trade</button></form>';
  }
  function tabDuels() {
    if (!ok()) return needLogin('Duels');
    var me = ses().id;
    var inc = D.open.filter(function (d) { return d.b === me; }), out = D.open.filter(function (d) { return d.a === me; });
    return '<div class="card hero"><span class="chip">' + ic('shield') + '</span><h2>Your power: ' + power() + '</h2><p>Power comes from your level and your gear. A duel has luck in it. The loser gives up 10 to 30 percent of their gold, the harder the beating the more. The winner gets double what the loser lost. A player under 20 gold loses nothing. Five duels a day.</p></div>' +
      (D.res ? '<div class="card pad"><b>' + esc(D.res) + '</b></div>' : '') +
      '<div class="eyebrow">Waiting for you</div>' + (inc.length ? '<ul class="list">' + inc.map(function (d) { return '<li class="card row"><span class="chip">' + ic('shield') + '</span><span class="txt"><div class="nm">' + esc(name(d.a)) + '</div><div class="sub">Power ' + d.a_power + '</div></span><button class="btn2 main" style="flex:none" data-act="ec-fight" data-id="' + d.id + '">Fight</button></li>'; }).join('') + '</ul>' : '<p class="note">No challenges right now.</p>') +
      (out.length ? '<div class="eyebrow" style="margin-top:14px">You challenged</div><ul class="list">' + out.map(function (d) { return '<li class="card row"><span class="chip">' + ic('timer') + '</span><span class="txt"><div class="nm">' + esc(name(d.b)) + '</div><div class="sub">Waiting for them</div></span><button class="btn2" style="flex:none" data-act="ec-dcancel" data-id="' + d.id + '">Cancel</button></li>'; }).join('') + '</ul>' : '') +
      '<div class="eyebrow" style="margin-top:14px">Challenge a friend</div><form class="form" id="ecDuel" novalidate>' + friendSelect('ecDF') + '<button class="btn2 main" type="submit"' + (F.friends.length ? '' : ' disabled') + '>Send challenge</button></form>' +
      '<div class="eyebrow" style="margin-top:14px">Recent duels</div>' + (D.done.length ? '<ul class="list">' + D.done.map(function (d) {
        var o = d.a === me ? d.b : d.a, won = d.winner === me;
        return '<li class="card row"><span class="chip">' + ic(won ? 'trophy' : 'shield') + '</span><span class="txt"><div class="nm">' + (won ? 'You beat ' : 'You lost to ') + esc(name(o)) + '</div><div class="sub">' + (won ? '+' + d.won + ' gold' : '-' + d.lost + ' gold') + '</div></span></li>';
      }).join('') + '</ul>' : '<p class="note">No duels yet.</p>');
  }
  function render() {
    var el = $('v-market'); if (!el) return;
    var body = M.tab === 'wallet' ? tabWallet() : M.tab === 'shop' ? tabShop() : M.tab === 'gifts' ? tabGifts() : M.tab === 'trades' ? tabTrades() : tabDuels();
    var badge = G.list.length ? ' (' + G.list.length + ')' : '';
    el.innerHTML = bar(u.BACK_TOOLS, 'Market and wallet') +
      '<div class="chips" role="tablist" style="margin-bottom:10px">' + TABS.map(function (t) { return '<button class="tag' + (M.tab === t[0] ? ' on' : '') + '" data-act="ec-tab" data-id="' + t[0] + '" aria-pressed="' + (M.tab === t[0]) + '">' + t[1] + (t[0] === 'gifts' ? badge : '') + '</button>'; }).join('') + '</div>' +
      (M.msg ? '<div class="card pad"><p class="note" style="margin:0">' + esc(M.msg) + '</p></div>' : '') + body;
    if (M.tab === 'wallet' && ok()) loadLog();
  }
  function loadLog() {
    O.req('GET', '/rest/v1/gold_log?select=delta,why,created_at&order=created_at.desc&limit=8').then(function (rows) {
      var el = $('ecLog'); if (!el) return;
      el.innerHTML = rows && rows.length ? '<div class="eyebrow" style="margin:6px 0">Recent gold</div><ul class="list">' + rows.map(function (r) { return '<li class="card row"><span class="txt"><div class="nm">' + (r.delta > 0 ? '+' : '') + r.delta + ' gold</div><div class="sub">' + esc(r.why) + '</div></span></li>'; }).join('') + '</ul>' : '';
    }, function () {});
  }
  function pullAll() {
    if (!ok()) { render(); return Promise.resolve(); }
    return Promise.all([loadFriends(), pullGold()]).then(function () { return Promise.all([loadGifts(), loadTrades(), loadDuels()]); }).then(function () { if (V.view() === 'market') safeRender(); });
  }
  V.registerTool('market', function () { M.msg = ''; render(); pullAll(); });
  function fail(e) { M.msg = nice(e); render(); }

  /* ---------- actions ---------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'); if (a.indexOf('ec-') !== 0) return;
    var id = t.getAttribute('data-id');
    if (a === 'ec-tab') { M.tab = id; M.msg = ''; M.trade = null; render(); pullAll(); }
    else if (a === 'ec-unlock') { var x = unl(id); if (x && !E.un[id] && E.cr >= x[2]) { E.cr -= x[2]; E.un[id] = 1; save(); M.msg = x[1] + ' unlocked.'; render(); } }
    else if (a === 'ec-buy') {
      var p = SHOP.filter(function (s) { return s[0] === id; })[0]; if (!p || V.outfit.own(id)) return;
      rpc('buy_fit', { item: id }).then(function (g) { setGold(g); V.outfit.add(id, false); M.msg = 'You bought ' + fname(id) + '.'; render(); }, fail);
    }
    else if (a === 'ec-sell') {
      var it = E.loot.filter(function (i) { return i.id === id; })[0]; if (!it) return;
      earnGold('sell', it.v).then(function (got) { if (got > 0) { E.loot = E.loot.filter(function (i) { return i.id !== id; }); save(); M.msg = 'Sold ' + it.n + '.'; } else M.msg = 'You reached today’s gold limit. Try again tomorrow.'; render(); });
    }
    else if (a === 'ec-sellall') {
      var list = E.loot.slice(), done = 0, stopped = false;
      list.reduce(function (pr, it2) { return pr.then(function () { if (stopped) return; return earnGold('sell', it2.v).then(function (got) { if (got > 0) { E.loot = E.loot.filter(function (i) { return i.id !== it2.id; }); done++; } else stopped = true; }); }); }, Promise.resolve()).then(function () { save(); M.msg = done ? 'Sold ' + done + ' items.' : 'You reached today’s gold limit. Try again tomorrow.'; if (stopped && done) M.msg += ' Daily limit reached.'; render(); });
    }
    else if (a === 'ec-claim') { claim(id).then(function (w) { M.msg = w ? 'You got ' + w + '.' : 'Claimed.'; render(); }, fail); }
    else if (a === 'ec-topen') { M.trade = id; T.offerG = null; T.offerF = []; render(); }
    else if (a === 'ec-tback') { M.trade = null; render(); }
    else if (a === 'ec-tcancel') { rpc('trade_cancel', { tid: id }).then(function () { giveBack(id); M.trade = null; return loadTrades(); }).then(function () { M.msg = 'Trade cancelled.'; render(); }, fail); }
    else if (a === 'ec-tconfirm') {
      var tr = T.open.filter(function (x) { return x.id === id; })[0]; if (!tr) return;
      var s = side(tr), fits = (tr[s.me + '_fits'] || []).filter(function (f) { return V.outfit.own(f); });
      fits.forEach(function (f) { V.outfit.remove(f); }); E.hold[id] = (E.hold[id] || []).concat(fits); save();   /* set aside while the trade is open */
      rpc('trade_confirm', { tid: id }).then(function (st) { return loadTrades().then(function () { if (st === 'done') { M.trade = null; M.msg = 'Trade done.'; } else M.msg = 'Confirmed. Waiting for your friend.'; render(); }); }, function (er) { giveBack(id); fail(er); });
    }
    else if (a === 'ec-fight') {
      rpc('duel_accept', { did: id, pw: power() }).then(function (r) { D.res = r.winner === ses().id ? 'You won! +' + r.won + ' gold.' : 'You lost. -' + r.lost + ' gold (' + r.pct + ' percent).'; return Promise.all([pullGold(), loadDuels()]); }).then(function () { render(); }, fail);
    }
    else if (a === 'ec-dcancel') { rpc('duel_cancel', { did: id }).then(loadDuels).then(render, fail); }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.id; if (f.indexOf('ec') !== 0) return;
    e.preventDefault();
    if (f === 'ecGift') {
      var to = $('ecGF') && $('ecGF').value, k = $('ecGK').value, note = $('ecGN').value.trim(), g = parseInt($('ecGA').value, 10) || 0, fit = '';
      if (!to) return;
      if (k.indexOf('fit:') === 0) { fit = k.slice(4); k = 'fit'; g = 0; if (!V.outfit.own(fit)) return; }
      else if (g < 1 || g > 100) { M.msg = 'Pick 1 to 100 gold.'; render(); return; }
      rpc('send_gift', { to_user: to, k: k, f: fit || null, g: g, n: note }).then(function () { if (fit) V.outfit.remove(fit); M.msg = 'Gift sent to ' + name(to) + '.'; return pullGold(); }).then(function () { render(); }, fail);
    } else if (f === 'ecNewTrade') {
      var who = $('ecTF2') && $('ecTF2').value; if (!who) return;
      rpc('trade_open', { to_user: who }).then(function (tid) { return loadTrades().then(function () { M.trade = tid; T.offerG = null; T.offerF = []; render(); }); }, fail);
    } else if (f === 'ecOffer') {
      var tid = M.trade, g2 = Math.max(0, parseInt($('ecTG').value, 10) || 0), fits = Array.prototype.map.call(document.querySelectorAll('.ecTF:checked'), function (c) { return c.value; });
      if (E.hold[tid]) giveBack(tid);
      rpc('trade_set', { tid: tid, g: g2, fits: fits }).then(function () { T.offerG = null; T.offerF = []; return loadTrades(); }).then(function () { M.msg = 'Offer saved.'; render(); }, fail);
    } else if (f === 'ecDuel') {
      var op = $('ecDF') && $('ecDF').value; if (!op) return;
      rpc('duel_challenge', { opp: op, pw: power() }).then(loadDuels).then(function () { M.msg = 'Challenge sent to ' + name(op) + '.'; render(); }, fail);
    }
  });
  /* open trades, gifts and duels update by themselves */
  setInterval(function () {
    if (document.hidden || !ok() || V.view() !== 'market') return;
    Promise.all([loadGifts(), loadTrades(), loadDuels()]).then(function () { safeRender(); });
  }, 6000);

  V.registerSearch && V.registerSearch(function (q) {
    var out = [];
    if (/market|wallet|gold|crystal|shop|gift|trade|duel|sell/.test(q)) out.push({ icon: 'wallet', title: 'Market and wallet', sub: 'Crystals, gold, gifts, trades, duels', to: 'market' });
    return out;
  });

  /* anything else can ask these */
  V.eco = {
    crystals: function () { return E.cr; }, gold: function () { return E.gold; },
    has: function (id) { return !!E.un[id]; }, cost: function (id) { var x = unl(id); return x ? x[2] : 0; }, name: function (id) { var x = unl(id); return x ? x[1] : id; },
    loot: loot, boss: boss, earnGold: earnGold, sync: function () { return welcome().then(function () { return Promise.all([pullGold(), loadFriends()]); }).then(function () { return loadTrades(); }); }
  };
  /* when you are already logged in, check for gifts a moment after the app opens */
  setTimeout(function () { if (ok()) V.eco.sync(); }, 2500);
})();
