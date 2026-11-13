/* VELENTIS avatar and gear.
   The hero is drawn in layers (body, hair, outfit, then one layer per gear slot), so changing the look or earning gear
   always fits. A free image service can also make a portrait from a text prompt. Everything is saved on this phone. */
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
     LOOK
     ============================================================= */
  var AK = 'velentis.avatar.v1';
  var DEF = { skin: '#E8B58E', hair: 'short', hairColor: '#3B2A20', eyes: '#4A7A9B', top: 'tunic', topColor: '#5B7BA6', bottomColor: '#4A3B30', acc: 'none', match: false, portrait: '', note: '' };
  var A = u.get(AK, null);
  A = Object.assign({}, DEF, A && typeof A === 'object' ? A : {});
  function asave() { u.put(AK, A); }
  var SKINS = ['#FBD9BF', '#F1C7A0', '#E8B58E', '#D69E73', '#BC8156', '#9A6540', '#734A30', '#4F3222'];
  var EYES = ['#4A7A9B', '#3F8F5B', '#7A5232', '#2E2E36', '#8A6BC4', '#B04A4A'];
  var HAIRC = ['#1C1612', '#3B2A20', '#6B4A2E', '#A8743A', '#D9B25A', '#C7C7CF', '#B5483C', '#2F5D8C', '#3E7A55', '#7B4DB3'];
  var CLOTH = ['#1F1F24', '#F2EDE4', '#8C8C93', '#2B3A5C', '#5B7BA6', '#3E6B52', '#7A8F4B', '#8A5A3B', '#C9A27A', '#A33B3B', '#D18A3C', '#7B4DB3', '#D7889A', '#2E7F86'];
  var HAIRS = [['short', 'Short'], ['spiky', 'Spiky'], ['long', 'Long'], ['bun', 'Bun'], ['curly', 'Curly'], ['buzz', 'Buzz']];
  var TOPS = [['tee', 'Tee'], ['tunic', 'Tunic'], ['robe', 'Robe']];
  var ACCS = [['none', 'None'], ['glasses', 'Glasses'], ['scarf', 'Scarf'], ['headband', 'Headband']];

  function hexRGB(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function shade(h, a) { var c = hexRGB(h).map(function (v) { return Math.max(0, Math.min(255, Math.round(a < 0 ? v * (1 + a) : v + (255 - v) * a))); }); return '#' + c.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join(''); }
  function look() { return A; }

  /* colours of today's real outfit from the Wardrobe, when the player asks for the match */
  function todaysFit() { return V.wardrobe && V.wardrobe.today ? V.wardrobe.today() : null; }

  function svg(o) {
    o = o || {};
    var L = Object.assign({}, A, o.look || {});
    var fit = L.match ? todaysFit() : null;
    var topC = (fit && fit.top) || L.topColor, botC = (fit && fit.bottom) || L.bottomColor;
    var sk = L.skin, skD = shade(sk, -.14), hc = L.hairColor, hcD = shade(hc, -.25), tcD = shade(topC, -.22), bcD = shade(botC, -.22);
    var T = function (k) { return o.nogear ? 0 : tier(k); };
    var col = function (k) { return TIER_COL[T(k)]; };
    var glow = function (k, inner) { var t = T(k); return t >= 3 ? '<g style="filter:drop-shadow(0 0 ' + (t >= 4 ? 5 : 3) + 'px ' + TIER_COL[t] + ')">' + inner + '</g>' : inner; };
    var s = '';
    /* behind everything */
    if (T('cloak')) s += glow('cloak', '<path d="M60 124 L140 124 L166 288 Q100 306 34 288 Z" fill="' + shade(col('cloak'), -.35) + '" stroke="' + shade(col('cloak'), -.6) + '" stroke-width="2"/>');
    if (L.hair === 'long') s += '<path d="M56 66 Q54 18 100 18 Q146 18 144 66 L150 156 Q100 170 50 156 Z" fill="' + hcD + '"/>';
    /* legs and boots */
    s += '<rect x="72" y="198" width="27" height="98" rx="8" fill="' + botC + '"/><rect x="101" y="198" width="27" height="98" rx="8" fill="' + botC + '"/><rect x="99" y="200" width="2" height="94" fill="' + bcD + '"/>';
    var bootC = T('boots') ? col('boots') : '#4A3426';
    s += glow('boots', '<path d="M68 292 h34 v18 q0 10 -10 10 h-26 q-8 0 -8 -8 q0 -6 10 -8 z" fill="' + bootC + '" stroke="' + shade(bootC, -.4) + '" stroke-width="2"/><path d="M98 292 h34 v18 q0 10 -10 10 h-26 q-8 0 -8 -8 q0 -6 10 -8 z" transform="translate(30 0) scale(1 1)" fill="' + bootC + '" stroke="' + shade(bootC, -.4) + '" stroke-width="2"/>');
    /* torso by style */
    var torso;
    if (L.top === 'tee') torso = '<rect x="62" y="122" width="76" height="86" rx="14" fill="' + topC + '"/>';
    else if (L.top === 'robe') torso = '<path d="M62 122 h76 q8 70 14 148 q-52 10 -104 0 q6 -78 14 -148 z" fill="' + topC + '"/><path d="M100 124 L100 268" stroke="' + tcD + '" stroke-width="2"/><rect x="62" y="186" width="76" height="9" fill="' + tcD + '"/>';
    else torso = '<path d="M62 122 h76 q4 40 12 112 q-50 10 -100 0 q8 -72 12 -112 z" fill="' + topC + '"/><rect x="64" y="190" width="72" height="9" rx="3" fill="' + tcD + '"/>';
    s += torso;
    /* arms */
    var sl = L.top === 'tee' ? 30 : 48;
    s += '<rect x="42" y="126" width="21" height="76" rx="10" fill="' + sk + '"/><rect x="137" y="126" width="21" height="76" rx="10" fill="' + sk + '"/>' +
      '<rect x="42" y="126" width="21" height="' + sl + '" rx="10" fill="' + topC + '"/><rect x="137" y="126" width="21" height="' + sl + '" rx="10" fill="' + topC + '"/>' +
      '<circle cx="52" cy="204" r="9" fill="' + sk + '"/><circle cx="148" cy="204" r="9" fill="' + sk + '"/>';
    if (T('gauntlets')) s += glow('gauntlets', '<rect x="40" y="164" width="25" height="30" rx="6" fill="' + col('gauntlets') + '" stroke="' + shade(col('gauntlets'), -.4) + '" stroke-width="2"/><rect x="135" y="164" width="25" height="30" rx="6" fill="' + col('gauntlets') + '" stroke="' + shade(col('gauntlets'), -.4) + '" stroke-width="2"/>');
    /* neck and head */
    s += '<rect x="90" y="104" width="20" height="24" rx="6" fill="' + skD + '"/>';
    if (L.acc === 'scarf') s += '<rect x="82" y="112" width="36" height="14" rx="7" fill="#B5483C"/><rect x="104" y="120" width="12" height="34" rx="5" fill="#B5483C"/>';
    s += '<circle cx="60" cy="76" r="7" fill="' + sk + '"/><circle cx="140" cy="76" r="7" fill="' + sk + '"/><ellipse cx="100" cy="72" rx="40" ry="44" fill="' + sk + '"/>';
    /* face */
    s += '<ellipse cx="84" cy="78" rx="8" ry="9" fill="#fff"/><ellipse cx="116" cy="78" rx="8" ry="9" fill="#fff"/>' +
      '<circle cx="85" cy="79" r="5.2" fill="' + L.eyes + '"/><circle cx="115" cy="79" r="5.2" fill="' + L.eyes + '"/><circle cx="85" cy="79" r="2.4" fill="#1b1b1f"/><circle cx="115" cy="79" r="2.4" fill="#1b1b1f"/>' +
      '<circle cx="87" cy="76.5" r="1.4" fill="#fff"/><circle cx="117" cy="76.5" r="1.4" fill="#fff"/>' +
      '<path d="M75 66 Q84 61 92 65" stroke="' + hcD + '" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M108 65 Q116 61 125 66" stroke="' + hcD + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M93 98 Q100 104 107 98" stroke="#8A4A3A" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="76" cy="92" r="5" fill="#E58C8C" opacity=".25"/><circle cx="124" cy="92" r="5" fill="#E58C8C" opacity=".25"/>';
    if (L.acc === 'glasses') s += '<circle cx="84" cy="78" r="12" fill="none" stroke="#2A2A30" stroke-width="2.4"/><circle cx="116" cy="78" r="12" fill="none" stroke="#2A2A30" stroke-width="2.4"/><path d="M96 78 h8" stroke="#2A2A30" stroke-width="2.4"/>';
    /* hair in front */
    var H = '';
    if (L.hair === 'short' || L.hair === 'long') H = '<path d="M57 72 Q54 24 100 22 Q146 24 143 72 Q138 52 124 48 Q108 58 92 50 Q70 52 57 72 Z" fill="' + hc + '"/>';
    else if (L.hair === 'spiky') H = '<path d="M57 70 L52 38 L70 50 L74 20 L90 44 L102 14 L112 44 L130 22 L132 48 L148 36 L143 70 Q130 52 100 52 Q70 52 57 70 Z" fill="' + hc + '"/>';
    else if (L.hair === 'bun') H = '<circle cx="100" cy="16" r="14" fill="' + hc + '"/><path d="M57 72 Q54 26 100 24 Q146 26 143 72 Q136 50 100 48 Q64 50 57 72 Z" fill="' + hc + '"/>';
    else if (L.hair === 'curly') H = [[64, 46], [82, 34], [104, 30], [124, 36], [140, 48], [56, 68], [146, 68], [100, 44]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="17" fill="' + hc + '"/>'; }).join('');
    else H = '<path d="M60 70 Q60 32 100 32 Q140 32 140 70 Q130 54 100 54 Q70 54 60 70 Z" fill="' + hc + '"/>';
    if (!T('helm') || L.hair === 'bun' || L.hair === 'curly') s += H; else s += '<g opacity=".95">' + H + '</g>';
    if (L.acc === 'headband') s += '<rect x="58" y="46" width="84" height="9" rx="4" fill="#B5483C"/>';
    /* gear worn on the head and chest */
    if (T('helm')) s += glow('helm', '<path d="M56 70 Q52 18 100 16 Q148 18 144 70 L136 66 Q100 40 64 66 Z" fill="' + col('helm') + '" stroke="' + shade(col('helm'), -.4) + '" stroke-width="2.4"/><rect x="97" y="40" width="6" height="30" rx="2" fill="' + shade(col('helm'), -.15) + '"/>');
    if (T('crown')) s += glow('crown', '<path d="M68 30 L74 4 L88 20 L100 0 L112 20 L126 4 L132 30 Z" fill="' + col('crown') + '" stroke="' + shade(col('crown'), -.4) + '" stroke-width="2"/><circle cx="100" cy="14" r="3.4" fill="#fff" opacity=".8"/>');
    if (T('cloak')) s += '<circle cx="100" cy="126" r="6" fill="' + col('cloak') + '" stroke="' + shade(col('cloak'), -.5) + '" stroke-width="2"/>';
    if (T('amulet')) s += glow('amulet', '<path d="M84 128 Q100 172 116 128" stroke="' + col('amulet') + '" stroke-width="2.6" fill="none"/><circle cx="100" cy="158" r="7.5" fill="' + col('amulet') + '" stroke="' + shade(col('amulet'), -.4) + '" stroke-width="2"/><circle cx="100" cy="158" r="3" fill="#fff" opacity=".7"/>');
    if (T('satchel')) s += glow('satchel', '<path d="M138 128 L70 212" stroke="#5A3B24" stroke-width="6" stroke-linecap="round"/><rect x="124" y="196" width="36" height="32" rx="7" fill="' + col('satchel') + '" stroke="' + shade(col('satchel'), -.4) + '" stroke-width="2"/><rect x="124" y="204" width="36" height="6" fill="' + shade(col('satchel'), -.3) + '"/>');
    if (T('tome')) s += glow('tome', '<rect x="18" y="196" width="32" height="38" rx="4" fill="' + col('tome') + '" stroke="' + shade(col('tome'), -.45) + '" stroke-width="2"/><rect x="22" y="200" width="3" height="30" fill="' + shade(col('tome'), -.4) + '"/><path d="M30 208 h14 M30 214 h14 M30 220 h10" stroke="#fff" stroke-width="1.6" opacity=".7"/>');
    var h = o.h || 340, w = Math.round(h * 200 / 340);
    return '<svg viewBox="-6 -4 212 334" style="height:' + h + (typeof h === 'number' ? 'px' : '') + ';width:auto" role="img" aria-label="Your hero" xmlns="http://www.w3.org/2000/svg">' + s + '</svg>';
  }
  V.avatar = { svg: svg, look: look, portrait: function () { return A.portrait || ''; }, setPortrait: function (p) { A.portrait = p; asave(); } };

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
    var body = '';
    if (av.tab === 'body') {
      body = '<div class="eyebrow">Skin</div>' + sw('skin', SKINS, A.skin) + picker('skin', A.skin, 'Custom skin') +
        '<div class="eyebrow">Eyes</div>' + sw('eyes', EYES, A.eyes) + picker('eyes', A.eyes, 'Custom eyes') +
        '<div class="eyebrow">Accessory</div>' + chips('acc', ACCS, A.acc) +
        '<div class="eyebrow">Name</div><input class="field" id="avName" maxlength="24" value="' + esc(core.state().name || '') + '" placeholder="Your hero name" aria-label="Hero name" autocomplete="off">';
    } else if (av.tab === 'hair') {
      body = '<div class="eyebrow">Style</div>' + chips('hair', HAIRS, A.hair) + '<div class="eyebrow">Colour</div>' + sw('hairColor', HAIRC, A.hairColor) + picker('hairColor', A.hairColor, 'Custom hair colour');
    } else if (av.tab === 'outfit') {
      var wd = V.wardrobe && V.wardrobe.count ? V.wardrobe.count() : 0, fit = todaysFit();
      body = '<div class="eyebrow">Top</div>' + chips('top', TOPS, A.top) + '<div class="eyebrow">Top colour</div>' + sw('topColor', CLOTH, A.topColor) + picker('topColor', A.topColor, 'Custom top colour') +
        '<div class="eyebrow">Bottom colour</div>' + sw('bottomColor', CLOTH, A.bottomColor) + picker('bottomColor', A.bottomColor, 'Custom bottom colour') +
        '<label class="chk"><input type="checkbox" id="avMatch"' + (A.match ? ' checked' : '') + '><span>Match my real outfit from the Wardrobe' + (fit ? ' (today: set)' : wd ? ' (pick today’s outfit first)' : ' (add clothes first)') + '</span></label>' +
        '<p class="note">Gear you earn from levels and dungeons is drawn on top automatically.</p>';
    } else {
      var g = av.gen;
      body = '<div class="eyebrow">Describe your hero</div><textarea class="field" id="avPrompt" maxlength="160" placeholder="e.g. silver-haired scout with a green cloak and a calm smile" aria-label="Portrait description">' + esc(g.prompt) + '</textarea>' +
        '<button class="btn2 main" data-act="av-gen"' + (g.st === 'loading' ? ' disabled' : '') + '>' + (g.st === 'loading' ? 'Painting…' : 'Make portrait') + '</button>' +
        (g.st === 'ready' ? '<div class="portrait"><img src="' + esc(g.url) + '" alt="Generated portrait"></div><div class="duo"><button class="btn2 main" data-act="av-use">Use as my portrait</button><button class="btn2" data-act="av-gen">Try again</button></div>' : '') +
        (g.st === 'error' ? '<div class="err">Could not make a portrait. Check your internet and try again.</div>' : '') +
        (A.portrait ? '<div class="portrait small"><img src="' + esc(A.portrait) + '" alt="Your portrait"></div><button class="link" data-act="av-unuse">Remove my portrait</button>' : '') +
        '<p class="note">This uses a free image service over the internet, so your description is sent to it. Do not type your real name or personal details. The result is saved on this phone.</p>';
    }
    var tabs = [['body', 'Body'], ['hair', 'Hair'], ['outfit', 'Outfit'], ['portrait', 'Portrait']];
    $('v-avatar').innerHTML = u.bar('data-act="go" data-to="inventory"', 'Your hero') +
      '<div class="card pad avprev"><div class="avstage">' + svg({ h: 250 }) + '</div><div class="avinfo"><b>' + esc(core.state().name || 'Traveler') + '</b><span class="sub">Level ' + core.levelInfo(core.state().total).level + ' · ' + V.gear.owned() + ' of 8 gear slots filled</span>' +
      (A.portrait ? '<img class="avpic" src="' + esc(A.portrait) + '" alt="">' : '') + '</div></div>' +
      '<div class="chips">' + tabs.map(function (t) { return '<button class="tag' + (av.tab === t[0] ? ' on' : '') + '" data-act="av-tab" data-id="' + t[0] + '" aria-pressed="' + (av.tab === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</div>' +
      '<div class="card pad avbody">' + body + '</div>' +
      '<button class="btn2" data-act="av-reset">Reset look</button>';
  }
  V.registerView('avatar', renderAvatar);

  function rerender(keepScroll) { if (V.view() === 'avatar') { var y = window.scrollY; renderAvatar(); if (keepScroll) window.scrollTo(0, y); } }

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
    else if (a === 'av-set') { A[t.getAttribute('data-k')] = t.getAttribute('data-v'); asave(); rerender(true); }
    else if (a === 'av-gen') generate();
    else if (a === 'av-use') usePortrait();
    else if (a === 'av-unuse') { A.portrait = ''; asave(); rerender(true); }
    else if (a === 'av-reset') { var p = A.portrait; A = Object.assign({}, DEF, { portrait: p }); asave(); rerender(); }
  });
  document.addEventListener('input', function (e) {
    var k = e.target.getAttribute && e.target.getAttribute('data-av');
    if (k) { A[k] = e.target.value; asave(); var st = document.querySelector('#v-avatar .avstage'); if (st) st.innerHTML = svg({ h: 250 }); }
    else if (e.target.id === 'avName') core.setName(e.target.value);
    else if (e.target.id === 'avPrompt') av.gen.prompt = e.target.value;
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'avMatch') { A.match = e.target.checked; asave(); var st = document.querySelector('#v-avatar .avstage'); if (st) st.innerHTML = svg({ h: 250 }); }
  });
})();
