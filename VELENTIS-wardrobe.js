/* VELENTIS wardrobe.
   Photograph your clothes once. Each day the app builds outfits from classic colour-theory rules: neutrals go with anything,
   keep to one accent colour, favour tonal (analogous) or balanced (complementary) pairs, avoid clashing brights.
   Photos stay on this phone only (they are left out of online backup). */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, iso = u.iso;
  var KEY = 'velentis.wardrobe.v1';
  var S = u.get(KEY, null);
  if (!S || !Array.isArray(S.items)) S = { items: [], worn: [], seed: 0 };
  S.worn = S.worn || []; S.seed = S.seed || 0;
  var saveErr = '';
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); saveErr = ''; return true; } catch (e) { saveErr = 'Your phone has no room left for more photos. Delete some clothes or add them without a photo.'; return false; } }

  var CATS = [['top', 'Top'], ['bottom', 'Bottom'], ['outer', 'Outer layer'], ['shoes', 'Shoes']];
  var STYLES = [['any', 'Any'], ['casual', 'Casual'], ['smart', 'Smart'], ['sport', 'Sport']];
  var NAMED = [
    ['Black', '#1A1A1D', 1], ['Charcoal', '#3C3C42', 1], ['Grey', '#8C8C93', 1], ['White', '#F4F2EC', 1], ['Cream', '#EFE6D0', 1], ['Beige', '#D2BC98', 1], ['Tan', '#B48B5E', 1], ['Brown', '#6B4A32', 1],
    ['Khaki', '#A89968', 1], ['Navy', '#1F2D4D', 1], ['Denim blue', '#4F6F96', 1],
    ['Olive', '#6F7A3E', 0], ['Burgundy', '#6E1F2F', 0], ['Red', '#C0392B', 0], ['Rust', '#B5532B', 0], ['Orange', '#E07B2B', 0], ['Mustard', '#D6A02A', 0], ['Yellow', '#EBCB3C', 0],
    ['Green', '#3F9A5A', 0], ['Forest green', '#2D5A3D', 0], ['Teal', '#2A8C8C', 0], ['Sky blue', '#7FB6E0', 0], ['Blue', '#2F6FD0', 0], ['Purple', '#7B4DB3', 0], ['Lavender', '#B7A2DD', 0], ['Pink', '#E58BA8', 0]
  ];
  var SWATCH = NAMED.map(function (n) { return n[1]; });

  /* ---------- colour maths ---------- */
  function rgb(h) { h = h.replace('#', ''); var n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function hex(r, g, b) { return '#' + [r, g, b].map(function (v) { return ('0' + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(''); }
  function hsl(h) {
    var c = rgb(h).map(function (v) { return v / 255; }), mx = Math.max(c[0], c[1], c[2]), mn = Math.min(c[0], c[1], c[2]), l = (mx + mn) / 2, d = mx - mn, hh = 0, s = 0;
    if (d) { s = d / (1 - Math.abs(2 * l - 1)); hh = mx === c[0] ? ((c[1] - c[2]) / d) % 6 : mx === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4; hh = (hh * 60 + 360) % 360; }
    return { h: hh, s: s, l: l };
  }
  function nearest(h) {
    var a = rgb(h), best = null, bd = 1e9;
    NAMED.forEach(function (n) {
      var b = rgb(n[1]), rm = (a[0] + b[0]) / 2, dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
      var d = (2 + rm / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rm) / 256) * db * db;
      if (d < bd) { bd = d; best = n; }
    });
    return best;
  }
  function info(h) { var n = nearest(h), c = hsl(h); return { name: n[0], neutral: !!n[2], h: c.h, s: c.s, l: c.l }; }
  function hdiff(a, b) { var d = Math.abs(a - b); return Math.min(d, 360 - d); }

  /* pair score and a plain-English reason */
  function pair(a, b) {
    var A = a._i, B = b._i, why = '', sc = 0;
    if (A.neutral && B.neutral) {
      var ld = Math.abs(A.l - B.l);
      if (A.name === B.name) { sc = 1; why = 'one tone head to toe'; }
      else if (ld > .55) { sc = 5; why = A.name + ' with ' + B.name + ', classic high contrast'; }
      else if (ld < .15) { sc = 1.5; why = A.name + ' and ' + B.name + ', very close tones'; }
      else sc = 3.5;
    } else if (A.neutral || B.neutral) {
      var ch = A.neutral ? B : A, ne = A.neutral ? A : B;
      sc = ch.s > .75 && ch.l > .45 ? 3.5 : 4.5; why = ne.name + ' base with ' + ch.name + ' as the one accent';
    } else {
      var dh = hdiff(A.h, B.h);
      if (dh <= 30) { sc = A.l !== B.l && Math.abs(A.l - B.l) > .15 ? 4.5 : 3.5; why = A.name + ' and ' + B.name + ', tonal neighbours on the colour wheel'; }
      else if (dh >= 150) { sc = (A.s < .55 || B.s < .55) ? 4 : 2; why = A.name + ' and ' + B.name + ', opposites that balance each other'; }
      else if (dh >= 100) { sc = 1; }
      else { sc = (A.s < .35 || B.s < .35) ? 0.5 : -2.5; why = ''; }
    }
    return { sc: sc, why: why };
  }
  function recentUse(id, days) {
    var cut = iso(new Date(Date.now() - days * 86400000)), n = 0;
    S.worn.forEach(function (w) { if (w.date >= cut && w.ids.indexOf(id) !== -1) n++; });
    return n;
  }
  function hashStr(s) { var h = 5381; for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; }
  function score(parts, occasion, seedKey) {
    var top = parts.top, bot = parts.bottom, out = parts.outer, sh = parts.shoes, sc = 0, notes = [];
    var tb = pair(top, bot); sc += tb.sc * 2; if (tb.why) notes.push(tb.why);
    if (out) { var to = pair(top, out), bo = pair(bot, out); sc += to.sc * 1.2 + bo.sc * .8; if (to.why && !tb.why) notes.push(to.why); }
    if (sh) {
      var si = sh._i;
      if (si.neutral) { sc += 1.5; notes.push(si.name + ' shoes keep it grounded'); }
      else { var m = hdiff(si._i ? 0 : si.h, bot._i.h) < 30 || hdiff(si.h, top._i.h) < 30; sc += m ? 1 : -1.5; if (m) notes.push('shoes echo your colours'); }
    }
    /* too many different bright colours */
    var chroma = [top, bot, out, sh].filter(function (p) { return p && !p._i.neutral; }), hues = [];
    chroma.forEach(function (p) { if (!hues.some(function (h) { return hdiff(h, p._i.h) < 40; })) hues.push(p._i.h); });
    if (hues.length > 2) sc -= 5; else if (hues.length === 2) sc -= 1;
    /* variety and occasion */
    [top, bot, out, sh].forEach(function (p) {
      if (!p) return; sc -= recentUse(p.id, 3) * 2.2 + recentUse(p.id, 10) * .3;
      if (p.style && p.style !== 'any' && occasion !== 'any' && p.style !== occasion) sc -= 3;
    });
    var ids = [top, bot, out, sh].filter(Boolean).map(function (p) { return p.id; }).sort().join(',');
    S.worn.forEach(function (w) { if (w.ids.slice().sort().join(',') === ids) sc -= 6; });
    sc += (hashStr(seedKey + ids) % 100) / 100 * 1.4;
    return { sc: sc, notes: notes };
  }
  function ensureInfo() { S.items.forEach(function (i) { i._i = info(i.color); }); }
  function by(cat) { return S.items.filter(function (i) { return i.cat === cat; }); }
  function suggest(occasion) {
    ensureInfo();
    var tops = by('top'), bots = by('bottom'), outs = by('outer'), shoes = by('shoes');
    if (!tops.length || !bots.length) return [];
    var seedKey = iso(new Date()) + ':' + S.seed + ':' + occasion, all = [];
    tops.forEach(function (t) { bots.forEach(function (b) { [null].concat(outs).forEach(function (o) { [null].concat(shoes).forEach(function (s) {
      var parts = { top: t, bottom: b, outer: o, shoes: s }, r = score(parts, occasion, seedKey);
      all.push({ parts: parts, sc: r.sc + (o ? .3 : 0) + (s ? .3 : 0), notes: r.notes });
    }); }); }); });
    all.sort(function (a, b) { return b.sc - a.sc; });
    var out = [], usedT = {}, usedB = {};
    all.forEach(function (c) {
      if (out.length >= 3) return;
      var kt = c.parts.top.id, kb = c.parts.bottom.id;
      if ((tops.length > 1 && usedT[kt]) || (bots.length > 1 && usedB[kb])) return;
      usedT[kt] = 1; usedB[kb] = 1; out.push(c);
    });
    all.forEach(function (c) { if (out.length < 3 && out.indexOf(c) === -1) out.push(c); });
    return out.slice(0, 3);
  }
  function todayWorn() { var t = iso(new Date()); return S.worn.filter(function (w) { return w.date === t; })[0] || null; }
  V.wardrobe = {
    count: function () { return S.items.length; },
    today: function () {
      var w = todayWorn(); if (!w) return null;
      var f = function (cat) { var i = S.items.filter(function (x) { return w.ids.indexOf(x.id) !== -1 && x.cat === cat; })[0]; return i ? i.color : null; };
      return { top: f('top'), bottom: f('bottom') };
    }
  };

  /* ---------- photos: shrink, and read the main colour ---------- */
  function readPhoto(file) {
    return new Promise(function (ok, no) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var s = Math.min(im.width, im.height), sx = (im.width - s) / 2, sy = (im.height - s) / 2, c = document.createElement('canvas'); c.width = c.height = 240;
        var x = c.getContext('2d'); x.drawImage(im, sx, sy, s, s, 0, 0, 240, 240);
        var data = c.toDataURL('image/jpeg', 0.72);
        /* main colour: busiest colour bucket in the middle of the picture */
        var px = x.getImageData(60, 60, 120, 120).data, bins = {}, best = null;
        for (var i = 0; i < px.length; i += 16) {
          var r = px[i], g = px[i + 1], b = px[i + 2]; if (r > 240 && g > 240 && b > 240) continue;
          var k = (r >> 4) + ',' + (g >> 4) + ',' + (b >> 4), e = bins[k] || (bins[k] = { n: 0, r: 0, g: 0, b: 0 }); e.n++; e.r += r; e.g += g; e.b += b;
        }
        Object.keys(bins).forEach(function (k) { if (!best || bins[k].n > best.n) best = bins[k]; });
        URL.revokeObjectURL(url);
        ok({ photo: data, color: best ? hex(best.r / best.n, best.g / best.n, best.b / best.n) : '#8C8C93' });
      };
      im.onerror = function () { URL.revokeObjectURL(url); no(new Error('bad image')); };
      im.src = url;
    });
  }

  /* ---------- screens ---------- */
  var w = { tab: 'today', draft: null, occ: 'casual', pend: null, picks: null, msg: '' };
  function thumb(i, cls) {
    return i ? '<span class="wthumb ' + (cls || '') + '" style="background:' + i.color + '">' + (i.photo ? '<img src="' + i.photo + '" alt="' + esc(i.name) + '">' : '') + '</span>' : '';
  }
  function chips(act, list, cur) { return '<div class="chips">' + list.map(function (x) { return '<button class="tag' + (x[0] === cur ? ' on' : '') + '" data-act="' + act + '" data-v="' + x[0] + '" aria-pressed="' + (x[0] === cur) + '">' + x[1] + '</button>'; }).join('') + '</div>'; }
  function sw(cur) { return '<div class="swrow">' + SWATCH.map(function (c) { return '<button class="sw' + (c.toLowerCase() === cur.toLowerCase() ? ' on' : '') + '" style="background:' + c + '" data-act="wd-color" data-v="' + c + '" aria-label="' + nearest(c)[0] + '"></button>'; }).join('') + '</div>'; }

  function renderDraft() {
    var d = w.draft, inf = info(d.color);
    return u.bar('data-act="wd-cancel"', 'Add clothing') +
      '<div class="card pad" style="display:flex;gap:14px;align-items:center">' + thumb({ color: d.color, photo: d.photo, name: 'new' }, 'big') + '<div><div class="eyebrow">Main colour</div><b>' + inf.name + '</b><br><span class="sub">Not right? Pick another below.</span></div></div>' +
      '<div class="card pad wdform"><div class="eyebrow">Name</div><input class="field" id="wdName" maxlength="30" value="' + esc(d.name) + '" aria-label="Name" autocomplete="off">' +
      '<div class="eyebrow">What is it?</div>' + chips('wd-cat', CATS, d.cat) +
      '<div class="eyebrow">Colour</div>' + sw(d.color) + '<label class="pick"><span>Custom colour</span><input type="color" id="wdPick" value="' + d.color + '" aria-label="Custom colour"></label>' +
      '<div class="eyebrow">Best for</div>' + chips('wd-style', STYLES, d.style) + '</div>' +
      (saveErr ? '<div class="err">' + esc(saveErr) + '</div>' : '') +
      '<button class="btn2 main" data-act="wd-save">Save to wardrobe</button>';
  }
  function outfitCard(c, i, worn) {
    var ps = [c.parts.top, c.parts.outer, c.parts.bottom, c.parts.shoes].filter(Boolean);
    return '<div class="card pad outfit"><div class="thumbs">' + ps.map(function (p) { return thumb(p); }).join('') + '</div>' +
      '<div class="nm" style="margin:8px 0 2px">' + ps.map(function (p) { return esc(p._i.name); }).join(' · ') + '</div>' +
      '<div class="sub">' + esc(c.notes.slice(0, 2).join('. ') || 'A balanced mix.') + '.</div>' +
      (worn ? '' : '<button class="btn2 main" style="margin-top:10px" data-act="wd-wear" data-id="' + i + '">Wear this today</button>') + '</div>';
  }
  function render() {
    var el = $('v-wardrobe'); if (!el) return;
    if (w.draft) { el.innerHTML = renderDraft(); return; }
    ensureInfo();
    var h = u.bar(u.BACK_TOOLS, 'Wardrobe') + '<div class="chips"><button class="tag' + (w.tab === 'today' ? ' on' : '') + '" data-act="wd-tab" data-v="today">Today</button><button class="tag' + (w.tab === 'closet' ? ' on' : '') + '" data-act="wd-tab" data-v="closet">Closet (' + S.items.length + ')</button></div>';
    if (w.tab === 'today') {
      var wr = todayWorn();
      if (wr) {
        var items = wr.ids.map(function (id) { return S.items.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean);
        h += '<div class="card pad outfit"><div class="eyebrow">You chose today</div><div class="thumbs">' + items.map(function (p) { return thumb(p); }).join('') + '</div><div class="nm" style="margin-top:8px">' + items.map(function (p) { return esc(p._i.name); }).join(' · ') + '</div></div><button class="btn2" data-act="wd-change">Pick a different outfit</button>';
      }
      if (!wr || w.picks) {
        if (!by('top').length || !by('bottom').length) h += '<div class="card empty"><h2>Add your clothes</h2><p>Add at least one top and one bottom. Shoes and an outer layer make the ideas better.</p></div>';
        else {
          w.picks = w.picks || suggest(w.occ);
          h += '<div class="eyebrow">Occasion</div>' + chips('wd-occ', [['casual', 'Casual'], ['smart', 'Smart'], ['sport', 'Sport'], ['any', 'Anything']], w.occ) +
            w.picks.map(function (c, i) { return outfitCard(c, i, false); }).join('') + '<button class="btn2" data-act="wd-shuffle">Shuffle ideas</button>';
        }
      }
      h += '<p class="note">How it picks: neutrals (black, white, grey, navy, beige) go with anything. One accent colour at most. Tonal or opposite colours pair well, clashing brights do not. It also avoids what you wore recently.</p>';
    } else {
      h += '<div class="clgrid">' + S.items.map(function (i) {
        var pend = w.pend === i.id;
        return '<div class="cl">' + thumb(i, 'big') + '<div class="nm">' + esc(i.name) + '</div><div class="sub">' + esc(i._i.name) + ' · ' + esc((CATS.filter(function (c) { return c[0] === i.cat; })[0] || ['', ''])[1]) + '</div><button class="icon-btn' + (pend ? ' warn' : '') + '" data-act="wd-del" data-id="' + i.id + '" aria-label="Delete ' + esc(i.name) + '">' + (pend ? 'Delete?' : ic('trash')) + '</button></div>';
      }).join('') + '</div>' + (S.items.length ? '' : '<div class="card empty"><h2>Your closet is empty</h2><p>Add a photo of each piece you wear.</p></div>');
    }
    if (saveErr) h += '<div class="err">' + esc(saveErr) + '</div>';
    h += '<input type="file" id="wdFile" accept="image/*" hidden><div class="duo"><button class="btn2 main" data-act="wd-add">Add with photo</button><button class="btn2" data-act="wd-addnp">Add without photo</button></div>';
    el.innerHTML = h;
  }
  V.registerTool('wardrobe', function () { w.picks = null; render(); });

  function newDraft(photo, color) { return { id: 'w' + u.uid(), name: '', cat: 'top', color: color || '#1A1A1D', style: 'any', photo: photo || '' }; }
  function autoName(d) { var c = (CATS.filter(function (x) { return x[0] === d.cat; })[0] || ['', ''])[1].toLowerCase(); return info(d.color).name + ' ' + (d.cat === 'outer' ? 'jacket' : c); }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'); if (a.indexOf('wd-') !== 0) return;
    var v = t.getAttribute('data-v');
    if (a === 'wd-tab') { w.tab = v; }
    else if (a === 'wd-add') { var f = $('wdFile'); if (f) f.click(); return; }
    else if (a === 'wd-addnp') { w.draft = newDraft('', '#1A1A1D'); w.draft.name = autoName(w.draft); }
    else if (a === 'wd-cancel') { w.draft = null; }
    else if (a === 'wd-cat') { var nm = $('wdName') ? $('wdName').value : w.draft.name; var auto = !nm || nm === autoName(w.draft); w.draft.cat = v; if (auto) w.draft.name = autoName(w.draft); else w.draft.name = nm; }
    else if (a === 'wd-style') { w.draft.style = v; w.draft.name = $('wdName') ? $('wdName').value : w.draft.name; }
    else if (a === 'wd-color') { var nm2 = $('wdName') ? $('wdName').value : w.draft.name, au = !nm2 || nm2 === autoName(w.draft); w.draft.color = v; w.draft.name = au ? autoName(w.draft) : nm2; }
    else if (a === 'wd-save') {
      var d = w.draft; d.name = ($('wdName') ? $('wdName').value : d.name).trim() || autoName(d);
      S.items.push({ id: d.id, name: d.name.slice(0, 30), cat: d.cat, color: d.color, style: d.style, photo: d.photo, added: iso(new Date()) });
      if (save()) { w.draft = null; w.picks = null; w.tab = 'closet'; } else S.items.pop();
    }
    else if (a === 'wd-occ') { w.occ = v; w.picks = null; }
    else if (a === 'wd-shuffle') { S.seed++; save(); w.picks = null; }
    else if (a === 'wd-change') { w.picks = null; S.worn = S.worn.filter(function (x) { return x.date !== iso(new Date()); }); save(); w.picks = suggest(w.occ); }
    else if (a === 'wd-wear') {
      var c = w.picks && w.picks[+t.getAttribute('data-id')]; if (!c) return;
      var ids = [c.parts.top, c.parts.outer, c.parts.bottom, c.parts.shoes].filter(Boolean).map(function (p) { return p.id; });
      S.worn = S.worn.filter(function (x) { return x.date !== iso(new Date()); }); S.worn.push({ date: iso(new Date()), ids: ids }); S.worn = S.worn.slice(-60); save(); w.picks = null;
      V.emit('wardrobe.wear', { ref: iso(new Date()) });
    }
    else if (a === 'wd-del') {
      var id = t.getAttribute('data-id');
      if (w.pend === id) { S.items = S.items.filter(function (x) { return x.id !== id; }); S.worn.forEach(function (x) { x.ids = x.ids.filter(function (i) { return i !== id; }); }); w.pend = null; w.picks = null; save(); }
      else { w.pend = id; setTimeout(function () { if (w.pend === id) { w.pend = null; if (V.view() === 'wardrobe') render(); } }, 3000); }
    }
    render();
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'wdPick' && w.draft) { var nm = $('wdName').value, au = !nm || nm === autoName(w.draft); w.draft.color = e.target.value; if (au) { w.draft.name = autoName(w.draft); $('wdName').value = w.draft.name; } }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id === 'wdPick' && w.draft) render();
    if (e.target.id !== 'wdFile' || !e.target.files || !e.target.files[0]) return;
    var file = e.target.files[0]; e.target.value = '';
    readPhoto(file).then(function (r) { w.draft = newDraft(r.photo, r.color); w.draft.name = autoName(w.draft); render(); }, function () { saveErr = 'That picture could not be read. Try another one.'; render(); });
  });
})();
