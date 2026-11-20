/* VELENTIS avatar and gear.
   The hero is built from painted layers (body, bottom, top, hair) that are tinted on the fly, so skin tone, hair colour and clothes
   can be any colour. Earned gear shows as an aura and in the Inventory slots. A free image service can also make a portrait
   from a text prompt. Everything is saved on this phone. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, core = V.core;

  /* =============================================================
     GEAR: eight slots, four tiers
     ============================================================= */
  var GK = 'velentis.gear.v1';
  var G = u.get(GK, { tier: {}, log: [] });
  if (!G || typeof G.tier !== 'object') G = { tier: {}, log: [] };
  function gsave() { u.put(GK, G); }
  var SLOTS = [
    ['helm', 'Helm', 'discipline'], ['amulet', 'Amulet', 'communication'], ['tome', 'Tome', 'knowledge'], ['cloak', 'Cloak', 'lvl5'],
    ['crown', 'Crown', 'lvl10'], ['gauntlets', 'Gauntlets', 'strength'], ['satchel', 'Satchel', 'practical'], ['boots', 'Boots', 'endurance']
  ];
  var TIERS = ['None', 'Worn', 'Tempered', 'Runed', 'Mythic'];
  var TIER_COL = [null, '#A9773F', '#8FB3D4', '#A97BE0', '#F2C14E'];
  function base(slotKey) {
    var s = SLOTS.filter(function (x) { return x[0] === slotKey; })[0]; if (!s) return 0;
    var st = core.state(), k = s[2];
    if (k === 'lvl5') return core.levelInfo(st.total).level >= 5 ? 1 : 0;
    if (k === 'lvl10') return core.levelInfo(st.total).level >= 10 ? 1 : 0;
    return core.attrLevel(st.xp[k]).level >= 2 ? 1 : 0;
  }
  function tier(slotKey) { return Math.max(base(slotKey), G.tier[slotKey] || 0); }
  function gearName(slotKey, t) { var s = SLOTS.filter(function (x) { return x[0] === slotKey; })[0]; return (TIERS[t || tier(slotKey)] + ' ' + (s ? s[1] : slotKey)).trim(); }
  /* a dungeon of rank 0..5 (E to S) may drop gear. bonus adds a tier. Returns the drop, or null */
  var CHANCE = [0.35, 0.45, 0.55, 0.7, 0.85, 1];
  function drop(rankIdx, bonus) {
    if (Math.random() > CHANCE[Math.max(0, Math.min(5, rankIdx))]) return null;
    var t = Math.min(4, 1 + Math.floor(rankIdx * 0.6 + Math.random() * 1.3) + (bonus ? 1 : 0));
    var open = SLOTS.filter(function (s) { return tier(s[0]) < t; });
    if (!open.length) return null;
    var s = open[Math.floor(Math.random() * open.length)];
    G.tier[s[0]] = t; G.log.push({ slot: s[0], tier: t, date: u.iso(new Date()) }); G.log = G.log.slice(-40); gsave();
    return { slot: s[0], tier: t, name: gearName(s[0], t) };
  }
  V.gear = { slots: SLOTS, tiers: TIERS, tierColor: function (t) { return TIER_COL[t] || '#777'; }, tier: tier, base: base, name: gearName, drop: drop,
    owned: function () { return SLOTS.filter(function (s) { return tier(s[0]) > 0; }).length; } };


  /* =============================================================
     LOOK: painted layers that are tinted with the chosen colours
     ============================================================= */
  var AK = 'velentis.avatar.v2';
  var KITS = {
    f: { name: 'Female', ratio: 612 / 1292,
      tops: [['top1', 'Tee']], bots: [['bot1', 'Slim pants']],
      hairs: [['h1', 'Bob'], ['h2', 'Ponytail'], ['h3', 'Messy crop'], ['h4', 'Side part'], ['h5', 'Braids'], ['h6', 'Long waves'], ['h7', 'Long straight']], backs: {},
      face: '', eyeL: [298, 173], eyeR: [348, 177], eyeRot: 4.6, eyeSc: 0.17, mouth: [320, 217], mouthRot: 0, mouthSc: 0.27 }
  };
  /* new painted eyes (5 styles x 5 colours) and mouths (30), cut from two sheets. [x, y, w, h] inside each sheet */
  var EYE_SL = [[0, 0, 231, 89], [235, 0, 253, 89], [492, 0, 251, 89], [747, 0, 248, 89], [999, 0, 246, 89], [0, 93, 258, 95], [262, 93, 259, 95], [525, 93, 259, 94], [788, 93, 259, 95], [1051, 93, 247, 95], [0, 192, 223, 99], [227, 192, 224, 100], [455, 192, 224, 99], [683, 192, 225, 99], [912, 192, 224, 98], [1140, 192, 228, 102], [0, 298, 232, 106], [236, 298, 233, 110], [473, 298, 236, 105], [713, 298, 241, 109], [958, 298, 261, 100], [0, 412, 254, 96], [258, 412, 266, 95], [528, 412, 263, 99], [795, 412, 252, 97]];
  var MOUTH_SL = [[0, 0, 98, 16], [102, 0, 103, 25], [209, 0, 120, 42], [333, 0, 103, 52], [440, 0, 112, 36], [556, 0, 109, 50], [669, 0, 109, 47], [782, 0, 95, 42], [881, 0, 106, 38], [991, 0, 116, 49], [1111, 0, 96, 38], [1211, 0, 113, 41], [0, 56, 122, 36], [126, 56, 119, 40], [249, 56, 117, 38], [370, 56, 125, 36], [499, 56, 101, 22], [604, 56, 92, 57], [700, 56, 105, 39], [809, 56, 112, 30], [925, 56, 123, 35], [1052, 56, 123, 43], [1179, 56, 123, 52], [0, 117, 106, 71], [110, 117, 115, 39], [229, 117, 135, 67], [368, 117, 115, 32], [487, 117, 107, 68], [598, 117, 115, 36], [717, 117, 94, 53]];
  var EYE_COLS = ['Ash', 'Violet', 'Sky', 'Blood', 'Ember'];
  var EXPR = [['f0', 'Calm', 3, 0, 0], ['f1', 'Smirk', 0, 1, 24], ['f2', 'Blank', 3, 0, 16], ['f3', 'Angry', 1, 3, 21], ['f4', 'Shy', 2, 2, 10]];
  var MOUTH_N = 30;
  var DEF = { body: 'f', skin: '#E8B58E', hair: 'h1', face: 'f0', eye: 3, eyec: 0, mouth: 0, hairColor: '#3B2A20', top: 'top1', topColor: '#5B7BA6', bot: 'bot1', bottomColor: '#3C3C42', match: false, portrait: '' };
  var A = u.get(AK, null);
  A = Object.assign({}, DEF, A && typeof A === 'object' ? A : {});
  function fix() {
    var k = KITS[A.body] || KITS.f; if (!KITS[A.body]) A.body = 'f';
    function has(list, id) { return list.some(function (x) { return x[0] === id; }); }
    if (!has(k.hairs, A.hair)) A.hair = k.hairs[0][0];
    if (!has(k.tops, A.top)) A.top = k.tops[0][0];
    if (!has(k.bots, A.bot)) A.bot = k.bots[0][0];
    if (!has(EXPR, A.face)) A.face = 'f0';
    A.eye = Math.max(0, Math.min(4, A.eye | 0)); A.eyec = Math.max(0, Math.min(4, A.eyec | 0)); A.mouth = Math.max(0, Math.min(MOUTH_N - 1, A.mouth | 0));
  }
  fix();
  function asave() { fix(); u.put(AK, A); }
  var SKINS = ['#FBD9BF', '#F1C7A0', '#E8B58E', '#D69E73', '#BC8156', '#9A6540', '#734A30', '#4F3222'];
  var HAIRC = ['#1C1612', '#3B2A20', '#6B4A2E', '#A8743A', '#D9B25A', '#C7C7CF', '#B5483C', '#2F5D8C', '#3E7A55', '#7B4DB3'];
  var CLOTH = ['#1F1F24', '#F2EDE4', '#8C8C93', '#2B3A5C', '#5B7BA6', '#3E6B52', '#7A8F4B', '#8A5A3B', '#C9A27A', '#A33B3B', '#D18A3C', '#7B4DB3', '#D7889A', '#2E7F86'];

  function look() { return A; }
  /* colours of today's real outfit from the Wardrobe, when the player asks for the match */
  function todaysFit() { return V.wardrobe && V.wardrobe.today ? V.wardrobe.today() : null; }

  /* ---------- image loading ---------- */
  var IMG = {}, WAIT = {};
  function loadImg(name) {
    if (IMG[name]) return Promise.resolve(IMG[name]);
    if (WAIT[name]) return WAIT[name];
    WAIT[name] = new Promise(function (ok, no) {
      var im = new Image(); im.onload = function () { IMG[name] = im; ok(im); }; im.onerror = function () { delete WAIT[name]; no(new Error('missing ' + name)); };
      im.src = 'VELENTIS-av-' + name + '.webp';
    });
    return WAIT[name];
  }
  function tinted(im, color, scale) {
    var c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * scale); c.height = Math.round(im.naturalHeight * scale);
    var x = c.getContext('2d'); x.drawImage(im, 0, 0, c.width, c.height);
    x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    x.globalCompositeOperation = 'destination-in'; x.drawImage(im, 0, 0, c.width, c.height);
    return c;
  }
  function maxTier() { var m = 0; SLOTS.forEach(function (s) { m = Math.max(m, tier(s[0])); }); return m; }
  function spec(o) {
    o = o || {};
    var L = Object.assign({}, A, o.look || {}); var kit = KITS[L.body] || KITS.f;
    var fit = L.match ? todaysFit() : null;
    return { b: L.body in KITS ? L.body : 'f', skin: L.skin, hair: L.hair, face: kit.face, eye: L.eye | 0, eyec: L.eyec | 0, mouth: L.mouth | 0, hc: L.hairColor, top: L.top, tc: (fit && fit.top) || L.topColor, bot: L.bot, bc: (fit && fit.bottom) || L.bottomColor,
      aura: o.nogear ? 0 : maxTier(), res: o.res === 'hi' ? 1 : 0.5, ratio: kit.ratio };
  }
  function keyOf(s) { return [s.b, s.skin, s.hair, s.face, s.eye, s.eyec, s.mouth, s.hc, s.top, s.tc, s.bot, s.bc, s.aura, s.res].join('|'); }
  var DONE = {}, DONE_ORDER = [], BUSY = {}, MISSING = {}, FAILED = {};
  function build(s, key) {
    var kit = KITS[s.b], order = [];
    var back = kit.backs[s.hair]; if (back) order.push([back, s.hc]);
    order.push(['body', s.skin], [s.bot, s.bc]); if (s.face) order.push([s.face, s.skin]);
    order.push([s.top, s.tc], [s.hair, s.hc]);
    var extra = [loadImg('eyes').then(function (im) { return im; }, function () { MISSING.eyes = 1; return null; }), loadImg('mouths').then(function (im) { return im; }, function () { MISSING.mouths = 1; return null; })];
    return Promise.all(order.map(function (o) { return loadImg(s.b + '-' + o[0]).then(function (im) { return im; }, function () { MISSING[s.b + '-' + o[0]] = 1; return null; }); }).concat(extra)).then(function (all) {
      var ims = all.slice(0, order.length), eyeIm = all[order.length], mouthIm = all[order.length + 1];
      var body = ims[back ? 1 : 0]; if (!body) { MISSING.fatal = 1; throw new Error('no body'); }
      var W = Math.round(body.naturalWidth * s.res), Hh = Math.round(body.naturalHeight * s.res);
      var c = document.createElement('canvas'); c.width = W; c.height = Hh; var x = c.getContext('2d');
      if (s.aura >= 2) {
        var col = TIER_COL[s.aura], g = x.createRadialGradient(W / 2, Hh * 0.52, W * 0.05, W / 2, Hh * 0.52, Hh * 0.5);
        g.addColorStop(0, col + (s.aura >= 3 ? '66' : '33')); g.addColorStop(1, col + '00'); x.fillStyle = g; x.fillRect(0, 0, W, Hh);
      }
      order.forEach(function (o, i) {
        if (ims[i]) x.drawImage(tinted(ims[i], o[1], s.res), 0, 0);
        if (o[0] === s.face || (!s.face && o[0] === s.bot)) drawFace(x, s, kit, eyeIm, mouthIm);
      });
      var url = ''; try { url = c.toDataURL('image/webp', 0.9); if (url.indexOf('data:image/webp') !== 0) url = c.toDataURL('image/png'); } catch (e) { url = ''; }
      return url;
    });
  }
  /* eyes and mouth are drawn on top of the blank face, under the top and hair. The second eye is a mirror of the first. */
  function drawFace(x, s, kit, eyeIm, mouthIm) {
    var r = s.res, i;
    function put(im, sl, cx, cy, sc, rot, flip, ay) {
      if (!im || !sl) return;
      x.save(); x.translate(cx * r, cy * r); x.rotate(rot * Math.PI / 180); x.scale(flip ? -sc * r : sc * r, sc * r);
      x.drawImage(im, sl[0], sl[1], sl[2], sl[3], -sl[2] / 2, -sl[3] * ay, sl[2], sl[3]); x.restore();
    }
    var es = EYE_SL[s.eye * 5 + s.eyec]; 
    put(eyeIm, es, kit.eyeL[0], kit.eyeL[1], kit.eyeSc, kit.eyeRot, true, 0.62);
    put(eyeIm, es, kit.eyeR[0], kit.eyeR[1], kit.eyeSc, kit.eyeRot, false, 0.62);
    put(mouthIm, MOUTH_SL[s.mouth], kit.mouth[0], kit.mouth[1], kit.mouthSc, kit.mouthRot, false, 0.5);
  }
  function ensure(s) {
    var key = keyOf(s); if (DONE[key] || BUSY[key] || FAILED[key]) return key;
    BUSY[key] = build(s, key).then(function (url) {
      delete BUSY[key]; if (!url) return;
      DONE[key] = url; DONE_ORDER.push(key); while (DONE_ORDER.length > 14) delete DONE[DONE_ORDER.shift()];
      var list = document.querySelectorAll('img[data-avk]');
      for (var i = 0; i < list.length; i++) if (list[i].getAttribute('data-avk') === key) list[i].src = url;
    }, function () { delete BUSY[key]; FAILED[key] = 1; setTimeout(function () { if (V.view && V.view() === 'avatar') renderAvatar(); }, 50); });
    return key;
  }
  var BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  /* =============================================================
     FULL SETS: rigid painted outfits. Not tinted, no customising. One is a gift for making an account,
     one unlocks at level 10, two drop from dungeons.
     ============================================================= */
  var FK = 'velentis.outfit.v1';
  var FITS = [
    { id: 'knit', n: 3, name: 'Quiet Knit', how: 'Gift for making an account', w: 368, h: 1018 },
    { id: 'hood', n: 2, name: 'Violet Hood', how: 'Reach level 10', w: 373, h: 1019 },
    { id: 'gate', n: 1, name: 'Gate Runner', how: 'Dungeon loot, rank C or higher', w: 382, h: 1018 },
    { id: 'raid', n: 4, name: 'Night Raider', how: 'Dungeon loot, rank B or higher', w: 320, h: 1017 }
  ];
  var F = u.get(FK, null);
  if (!F || typeof F !== 'object') { var oldF = u.get('velentis.fit.v1', null); F = oldF && oldF.own && typeof oldF.own === 'object' ? { own: oldF.own, on: oldF.on, miss: oldF.miss } : {}; }   /* outfits used to share a box with the workout log */
  F.own = F.own && typeof F.own === 'object' ? F.own : {}; F.on = F.on || ''; F.miss = F.miss | 0;
  function fsave() { u.put(FK, F); }
  function fitOf(id) { return FITS.filter(function (f) { return f.id === id; })[0]; }
  function addFit(id, equip) {
    if (!fitOf(id) || F.own[id]) return null;
    F.own[id] = u.iso(new Date()); if (equip) F.on = id; fsave();
    try { V.toast && V.toast('New outfit: ' + fitOf(id).name); } catch (e) {}
    return fitOf(id);
  }
  function checkLevel() { try { if (core.levelInfo(core.state().total).level >= 10) addFit('hood', false); } catch (e) {} }
  /* dungeon loot: rank index 0..5. Only C (2) and up can drop; a miss streak raises the next chance */
  function fitDrop(rankIdx, bonus) {
    var pool = []; if (rankIdx >= 2) pool.push('gate'); if (rankIdx >= 3) pool.push('raid');
    pool = pool.filter(function (id) { return !F.own[id]; }); if (!pool.length) return null;
    var ch = 0.12 + (rankIdx - 2) * 0.1 + (bonus ? 0.1 : 0) + F.miss * 0.06;
    if (Math.random() > ch) { F.miss++; fsave(); return null; }
    F.miss = 0; var id = pool[Math.floor(Math.random() * pool.length)];
    return addFit(id, false);
  }
  var TRADABLE = ['gate', 'raid'];
  function removeFit(id) { if (!F.own[id]) return false; delete F.own[id]; if (F.on === id) F.on = ''; fsave(); return true; }
  V.outfit = { list: FITS, own: function (id) { return !!F.own[id]; }, on: function () { return F.on; }, gift: function () { return addFit('knit', false); }, drop: fitDrop, check: checkLevel,
    add: function (id, wear) { return addFit(id, !!wear); }, remove: removeFit, tradable: function (id) { return TRADABLE.indexOf(id) !== -1; },
    mine: function () { return FITS.filter(function (f) { return F.own[f.id]; }); }, get: fitOf };
  checkLevel(); V.on && V.on('core.changed', checkLevel);
  function fitImg(f, h) {
    return '<img class="avimg" src="VELENTIS-fit-' + f.n + '.webp" alt="' + esc(f.name) + '" style="height:' + (typeof h === 'number' ? h + 'px' : h) + ';width:auto;aspect-ratio:' + (f.w / f.h).toFixed(4) + '">';
  }
  /* returns an <img> tag (kept name "svg" so other screens keep working); the picture fills in as soon as it is painted */
  function svg(o) {
    o = o || {}; var h = o.h || 340, ft = F.on && !o.nofit ? fitOf(F.on) : null; if (ft && F.own[ft.id]) return fitImg(ft, h);
    var s = spec(o), key = ensure(s);
    return '<img class="avimg" data-avk="' + esc(key) + '" src="' + (DONE[key] || BLANK) + '" alt="Your hero" style="height:' + (typeof h === 'number' ? h + 'px' : h) + ';width:auto;aspect-ratio:' + s.ratio.toFixed(4) + '">';
  }
  V.avatar = { svg: svg, look: look, portrait: function () { return A.portrait || ''; }, setPortrait: function (p) { A.portrait = p; asave(); }, kits: KITS };
  setTimeout(function () { try { ensure(spec({ res: 'hi' })); ensure(spec({})); } catch (e) {} }, 400);

  /* =============================================================
     EDITOR
     ============================================================= */
  var av = { tab: 'body', gen: { st: 'idle', url: '', prompt: '' } };
  function sw(k, list, cur) {
    return '<div class="swrow">' + list.map(function (c) { return '<button class="sw' + (c.toLowerCase() === String(cur).toLowerCase() ? ' on' : '') + '" style="background:' + c + '" data-act="av-set" data-k="' + k + '" data-v="' + c + '" aria-label="' + c + '"></button>'; }).join('') + '</div>';
  }
  function chips(k, list, cur) {
    return '<div class="chips">' + list.map(function (x) { return '<button class="tag' + (x[0] === cur ? ' on' : '') + '" data-act="av-set" data-k="' + k + '" data-v="' + x[0] + '" aria-pressed="' + (x[0] === cur) + '">' + x[1] + '</button>'; }).join('') + '</div>';
  }
  function picker(k, cur, label) {
    return '<label class="pick"><span>' + label + '</span><input type="color" data-av="' + k + '" value="' + (/^#[0-9a-f]{6}$/i.test(cur) ? cur : '#888888') + '" aria-label="' + label + '"></label>';
  }
  function renderAvatar() {
    var kit = KITS[A.body], body = '';
    var miss = Object.keys(MISSING).filter(function (k) { return k !== 'fatal'; }).map(function (k) { return 'VELENTIS-av-' + k + '.webp'; });
    if (av.tab === 'body') {
      body = '<div class="eyebrow">Body</div>' + '<p class="note">More bodies are coming. Full sets under the Sets tab are ready-made looks.</p>' +
        '<div class="eyebrow">Skin tone</div>' + sw('skin', SKINS, A.skin) + picker('skin', A.skin, 'Custom skin tone') +
        '<div class="eyebrow">Name</div><input class="field" id="avName" maxlength="24" value="' + esc(core.state().name || '') + '" placeholder="Your hero name" aria-label="Hero name" autocomplete="off">';
    } else if (av.tab === 'face') {
      var mo = ''; for (var mi = 0; mi < MOUTH_N; mi++) mo += '<button class="tag' + (A.mouth === mi ? ' on' : '') + '" data-act="av-set" data-k="mouth" data-v="' + mi + '" aria-pressed="' + (A.mouth === mi) + '">' + (mi + 1) + '</button>';
      body = '<div class="eyebrow">Expression</div>' + chips('face', EXPR, A.face) +
        '<div class="eyebrow">Eye style</div><div class="chips">' + [0, 1, 2, 3, 4].map(function (n) { return '<button class="tag' + (A.eye === n ? ' on' : '') + '" data-act="av-set" data-k="eye" data-v="' + n + '" aria-pressed="' + (A.eye === n) + '">Style ' + (n + 1) + '</button>'; }).join('') + '</div>' +
        '<div class="eyebrow">Eye colour</div><div class="chips">' + EYE_COLS.map(function (n, i) { return '<button class="tag' + (A.eyec === i ? ' on' : '') + '" data-act="av-set" data-k="eyec" data-v="' + i + '" aria-pressed="' + (A.eyec === i) + '">' + n + '</button>'; }).join('') + '</div>' +
        '<div class="eyebrow">Mouth (30)</div><div class="chips">' + mo + '</div>';
    } else if (av.tab === 'sets') {
      body = '<div class="eyebrow">Full sets</div><p class="note">A full set is a finished outfit. It replaces your customised look while it is on. Turn it off to go back.</p>' +
        FITS.map(function (f) {
          var own = !!F.own[f.id];
          return '<div class="card pad" style="display:flex;gap:12px;align-items:center;margin:8px 0">' +
            '<div style="flex:0 0 64px;height:120px;display:flex;align-items:center;justify-content:center;overflow:hidden">' + (own ? fitImg(f, 120) : '<span style="font-size:34px;opacity:.5">?</span>') + '</div>' +
            '<div style="flex:1 1 0;min-width:0"><b>' + esc(own ? f.name : 'Locked set') + '</b><div class="sub" style="font-size:13px">' + esc(f.how) + '</div></div>' +
            (own ? '<button class="btn2' + (F.on === f.id ? '' : ' main') + '" style="flex:0 0 88px;width:88px;margin:0;position:static" data-act="av-fit" data-id="' + f.id + '">' + (F.on === f.id ? 'Take off' : 'Wear') + '</button>' : '') + '</div>';
        }).join('');
    } else if (av.tab === 'hair') {
      body = '<div class="eyebrow">Style</div>' + chips('hair', kit.hairs, A.hair) + '<div class="eyebrow">Colour</div>' + sw('hairColor', HAIRC, A.hairColor) + picker('hairColor', A.hairColor, 'Custom hair colour');
    } else if (av.tab === 'outfit') {
      var wd = V.wardrobe && V.wardrobe.count ? V.wardrobe.count() : 0, fit = todaysFit();
      body = '<div class="eyebrow">Top</div>' + chips('top', kit.tops, A.top) + '<div class="eyebrow">Top colour</div>' + sw('topColor', CLOTH, A.topColor) + picker('topColor', A.topColor, 'Custom top colour') +
        '<div class="eyebrow">Bottom</div>' + chips('bot', kit.bots, A.bot) + '<div class="eyebrow">Bottom colour</div>' + sw('bottomColor', CLOTH, A.bottomColor) + picker('bottomColor', A.bottomColor, 'Custom bottom colour') +
        '<label class="chk"><input type="checkbox" id="avMatch"' + (A.match ? ' checked' : '') + '><span>Match my real outfit from the Wardrobe' + (fit ? ' (today: set)' : wd ? ' (pick today’s outfit first)' : ' (add clothes first)') + '</span></label>' +
        '<p class="note">Gear you earn from levels and dungeons glows around your hero and fills your Inventory slots.</p>';
    } else {
      var g = av.gen;
      body = '<div class="eyebrow">Describe your hero</div><textarea class="field" id="avPrompt" maxlength="160" placeholder="e.g. silver-haired scout with a green cloak and a calm smile" aria-label="Portrait description">' + esc(g.prompt) + '</textarea>' +
        '<button class="btn2 main" data-act="av-gen"' + (g.st === 'loading' ? ' disabled' : '') + '>' + (g.st === 'loading' ? 'Painting…' : 'Make portrait') + '</button>' +
        (g.st === 'ready' ? '<div class="portrait"><img src="' + esc(g.url) + '" alt="Generated portrait"></div><div class="duo"><button class="btn2 main" data-act="av-use">Use as my portrait</button><button class="btn2" data-act="av-gen">Try again</button></div>' : '') +
        (g.st === 'error' ? '<div class="err">Could not make a portrait. Check your internet and try again.</div>' : '') +
        (A.portrait ? '<div class="portrait small"><img src="' + esc(A.portrait) + '" alt="Your portrait"></div><button class="link" data-act="av-unuse">Remove my portrait</button>' : '') +
        '<p class="note">This uses a free image service over the internet, so your description is sent to it. Do not type your real name or personal details. The result is saved on this phone.</p>';
    }
    var tabs = [['body', 'Body'], ['face', 'Face'], ['hair', 'Hair'], ['sets', 'Sets'], ['outfit', 'Outfit'], ['portrait', 'Portrait']];
    $('v-avatar').innerHTML = u.bar('data-act="go" data-to="inventory"', 'Your hero') +
      (miss.length ? '<div class="err">These picture files did not load. Upload them to GitHub and rebuild: ' + esc(miss.join(', ')) + '</div>' : '') + '<div class="card pad avprev"><div class="avstage">' + svg({ h: 430, res: 'hi' }) + '</div><div class="avinfo"><b>' + esc(core.state().name || 'Traveler') + '</b><span class="sub">Level ' + core.levelInfo(core.state().total).level + ' · ' + V.gear.owned() + ' of 8 gear slots filled</span>' +
      (A.portrait ? '<img class="avpic" src="' + esc(A.portrait) + '" alt="">' : '') + '</div></div>' +
      '<div class="chips">' + tabs.map(function (t) { return '<button class="tag' + (av.tab === t[0] ? ' on' : '') + '" data-act="av-tab" data-id="' + t[0] + '" aria-pressed="' + (av.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="card pad avbody">' + body + '</div>' +
      '<button class="btn2" data-act="av-reset">Reset look</button>';
  }
  V.registerView('avatar', renderAvatar);

  function rerender(keepScroll) { if (V.view() === 'avatar') { var y = window.scrollY; renderAvatar(); if (keepScroll) window.scrollTo(0, y); } }
  function refreshStage() { var st = document.querySelector('#v-avatar .avstage'); if (st) st.innerHTML = svg({ h: 430, res: 'hi' }); }

  function hash(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }
  function generate() {
    var ta = $('avPrompt'), p = (ta ? ta.value : av.gen.prompt).trim();
    if (p.length < 3) { av.gen = { st: 'error', url: '', prompt: p }; rerender(true); return; }
    av.gen = { st: 'loading', url: '', prompt: p }; rerender(true);
    var q = 'anime style character portrait, head and shoulders, ' + p + ', medieval fantasy, warm lighting, painted, plain soft background';
    var url = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(q) + '?width=512&height=512&nologo=true&seed=' + (hash(p) + Math.floor(Math.random() * 99999));
    var im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = function () { av.gen = { st: 'ready', url: url, prompt: p, im: im }; rerender(true); };
    im.onerror = function () {
      var im2 = new Image();
      im2.onload = function () { av.gen = { st: 'ready', url: url, prompt: p }; rerender(true); };
      im2.onerror = function () { av.gen = { st: 'error', url: '', prompt: p }; rerender(true); };
      im2.src = url;
    };
    im.src = url;
  }
  function usePortrait() {
    var g = av.gen; if (g.st !== 'ready') return;
    var done = function (v) { A.portrait = v; asave(); av.gen = { st: 'idle', url: '', prompt: g.prompt }; rerender(); V.toast && V.toast('Portrait saved'); };
    try {
      if (g.im) { var c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d').drawImage(g.im, 0, 0, 256, 256); done(c.toDataURL('image/jpeg', 0.82)); return; }
    } catch (e) {}
    done(g.url);   /* could not copy the pixels, so keep the link */
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'); if (a.indexOf('av-') !== 0) return;
    if (a === 'av-tab') { av.tab = t.getAttribute('data-id'); rerender(); }
    else if (a === 'av-set') {
      var k = t.getAttribute('data-k'), v = t.getAttribute('data-v');
      if (k === 'body' && v !== A.body) { A.body = v; A.hair = ''; A.top = ''; A.bot = ''; }
      else if (k === 'face') { var ex = EXPR.filter(function (e) { return e[0] === v; })[0]; A.face = v; if (ex) { A.eye = ex[2]; A.eyec = ex[3]; A.mouth = ex[4]; } }
      else if (k === 'eye' || k === 'eyec' || k === 'mouth') A[k] = parseInt(v, 10) || 0;
      else A[k] = v;
      asave(); rerender(true);
    }
    else if (a === 'av-fit') { var fid = t.getAttribute('data-id'); if (F.own[fid]) { F.on = F.on === fid ? '' : fid; fsave(); rerender(true); } }
    else if (a === 'av-gen') generate();
    else if (a === 'av-use') usePortrait();
    else if (a === 'av-unuse') { A.portrait = ''; asave(); rerender(true); }
    else if (a === 'av-reset') { var p = A.portrait, b = A.body; A = Object.assign({}, DEF, { portrait: p, body: b }); asave(); rerender(); }
  });
  document.addEventListener('input', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-av');
    if (k) { A[k] = e.target.value; asave(); refreshStage(); }
    else if (e.target.id === 'avName') core.setName(e.target.value);
    else if (e.target.id === 'avPrompt') av.gen.prompt = e.target.value;
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'avMatch') { A.match = e.target.checked; asave(); refreshStage(); }
  });
})();
