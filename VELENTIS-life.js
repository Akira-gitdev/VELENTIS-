/* Life tools: Expense notebook, Fridge chef, Notes vault, Countdown board. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, iso = u.iso, addDays = u.addDays, plural = u.plural, bar = u.bar;

  var SP = u.get('velentis.spend.v1', { items: [], budget: 0, cur: '₹' });
  if (!SP || !Array.isArray(SP.items)) SP = { items: [], budget: 0, cur: '₹' };
  var CATS = ['Food', 'Travel', 'Shopping', 'Bills', 'Fun', 'Health', 'Other'];
  var CURS = ['₹', '$', '€', '£'];
  var spMonth = iso(new Date()).slice(0, 7), spPend = null;
  function spSave() { u.put('velentis.spend.v1', SP); }
  function money(n) { return (SP.cur || '₹') + Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }); }
  function monthLabel(m) { var p = m.split('-'); return new Date(+p[0], +p[1] - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }
  function shiftMonth(m, n) { var p = m.split('-'); return iso(new Date(+p[0], +p[1] - 1 + n, 1)).slice(0, 7); }
  function sumOf(list) { return list.reduce(function (a, x) { return a + x.amt; }, 0); }

  function renderSpend() {
    var nowM = iso(new Date()).slice(0, 7);
    var cur = SP.items.filter(function (x) { return x.date.slice(0, 7) === spMonth; });
    var prev = SP.items.filter(function (x) { return x.date.slice(0, 7) === shiftMonth(spMonth, -1); });
    var total = sumOf(cur), pt = sumOf(prev);
    var cmp = pt > 0 ? (total <= pt ? Math.round((1 - total / pt) * 100) + '% less than last month' : Math.round((total / pt - 1) * 100) + '% more than last month')
                     : (total > 0 ? 'No spending recorded last month' : 'Nothing spent yet');
    var byCat = {}; cur.forEach(function (x) { byCat[x.cat] = (byCat[x.cat] || 0) + x.amt; });
    var cats = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; });
    var catHTML = cats.length ? cats.map(function (c) {
      return '<div class="catrow"><div class="cl"><span>' + esc(c) + '</span><span>' + money(byCat[c]) + '</span></div><div class="bar" style="margin-top:0"><i style="width:' + Math.max(3, Math.round(byCat[c] / total * 100)) + '%"></i></div></div>';
    }).join('') : '<p class="note">Add an expense to see where your money goes.</p>';
    var budgetHTML = '';
    if (SP.budget > 0) {
      var pct = Math.min(100, Math.round(total / SP.budget * 100)), left = SP.budget - total;
      budgetHTML = '<div class="bar"><i style="width:' + pct + '%"></i></div><p class="note" style="margin-top:8px">' +
        (left >= 0 ? money(left) + ' left of your ' + money(SP.budget) + ' budget' : 'Over your ' + money(SP.budget) + ' budget by ' + money(-left)) + '</p>';
    }
    var sorted = cur.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : (a.id < b.id ? 1 : -1); });
    var rows = sorted.map(function (x) {
      var pend = spPend === x.id;
      return '<li class="card row"><div class="txt"><div class="nm">' + esc(x.note || x.cat) + '</div><div class="sub">' + esc(x.cat) + ' · ' + u.niceDate(x.date) + '</div></div>' +
        '<strong style="font-variant-numeric:tabular-nums">' + money(x.amt) + '</strong>' +
        '<button class="icon-btn' + (pend ? ' warn' : '') + '" data-act="sp-del" data-id="' + x.id + '" aria-label="Delete this expense">' + (pend ? 'Delete?' : ic('trash')) + '</button></li>';
    }).join('');
    var opts = CATS.map(function (c) { return '<option>' + c + '</option>'; }).join('');
    var today = iso(new Date());
    $('v-spend').innerHTML =
      bar(u.BACK_TOOLS, 'Expense notebook', '<button class="pill" style="margin-left:auto;height:44px;padding:0 16px;font-size:15px" data-act="sp-cur" aria-label="Change currency">' + esc(SP.cur) + '</button>') +
      '<div class="card pad"><div class="head" style="align-items:center"><button class="icon-btn" data-act="sp-prev" aria-label="Previous month">' + ic('back') + '</button>' +
      '<div style="text-align:center"><div class="eyebrow">' + monthLabel(spMonth) + '</div><div class="big" style="font-size:30px">' + money(total) + '</div><div class="note">' + cmp + '</div></div>' +
      '<button class="icon-btn" data-act="sp-next" aria-label="Next month"' + (spMonth >= nowM ? ' disabled style="opacity:.35"' : '') + '>' + ic('chev') + '</button></div>' + budgetHTML + '</div>' +
      '<form class="stack" id="spNL" novalidate style="gap:6px"><div class="form"><input class="field" id="spNLIn" maxlength="200" placeholder="Type it: pizza 250 yesterday" aria-label="Type an expense in plain words" autocomplete="off"><button class="add" type="submit">Add</button></div><div class="note" id="spNLMsg" hidden></div></form>' +
      '<form class="stack" id="spForm" novalidate style="gap:8px"><div class="form"><input class="field" id="spAmt" inputmode="decimal" placeholder="Amount" aria-label="Amount" autocomplete="off" style="max-width:130px"><select class="field" id="spCat" aria-label="Category">' + opts + '</select></div>' +
      '<div class="form"><input class="field" id="spNote" maxlength="40" placeholder="What was it? (optional)" aria-label="Note" autocomplete="off"><input class="field" id="spDate" type="date" value="' + today + '" max="' + today + '" aria-label="Date" style="max-width:150px"></div>' +
      '<button class="add" type="submit" style="width:100%">Add expense</button><div class="err" id="spErr" hidden>Type an amount above zero.</div></form>' +
      '<div class="card pad"><div class="eyebrow" style="margin-bottom:12px">Where it went</div>' + catHTML + '</div>' +
      (rows ? '<div class="sec"><h2>' + plural(cur.length, 'entry').replace('entrys', 'entries') + '</h2></div><ul class="list">' + rows + '</ul>' : '<div class="card empty"><h2>No expenses this month</h2><p>Add your first one above.</p></div>') +
      '<form class="form" id="spBudgetForm" novalidate><input class="field" id="spBudget" inputmode="decimal" placeholder="Monthly budget (optional)" aria-label="Monthly budget" value="' + (SP.budget > 0 ? SP.budget : '') + '" autocomplete="off"><button class="add" type="submit">Save</button></form>';
  }

  /* ---------- Fridge chef (works offline) ---------- */
  var RECIPES = [
    ['Egg bhurji', 10, 0, ['egg', 'onion', 'tomato'], ['Chop the onion and tomato.', 'Fry the onion in a little oil until soft, add the tomato and cook for 2 minutes.', 'Add salt, turmeric and chilli powder, then crack in the eggs.', 'Stir until the eggs are just set. Serve with bread.']],
    ['Masala omelette', 8, 0, ['egg', 'onion'], ['Beat the eggs with salt and finely chopped onion (add chilli and coriander if you have them).', 'Pour into a hot, oiled pan.', 'Cook until set, fold and serve.']],
    ['Egg curry', 25, 0, ['egg', 'onion', 'tomato'], ['Boil the eggs for 8 minutes, peel and cut small slits in them.', 'Fry chopped onion until golden, add tomato and spices, and cook to a thick paste.', 'Add a cup of water and simmer 5 minutes.', 'Add the eggs and simmer 5 more minutes.']],
    ['French toast', 10, 0, ['egg', 'bread', 'milk'], ['Whisk the egg, milk and a pinch of salt or sugar.', 'Dip each bread slice quickly on both sides.', 'Fry in a little butter or oil until golden on both sides.']],
    ['Egg fried rice', 15, 0, ['egg', 'rice'], ['Scramble the eggs in a hot pan and set them aside.', 'Fry any chopped veg you have for 2 minutes.', 'Add cooked rice, salt and pepper, and toss on high heat.', 'Mix the eggs back in and serve hot.']],
    ['Egg sandwich', 10, 0, ['egg', 'bread'], ['Boil or scramble the eggs and season with salt and pepper.', 'Spread butter on the bread and add the eggs.', 'Toast the sandwich in a pan until crisp.']],
    ['Banana pancakes', 15, 0, ['banana', 'egg', 'flour'], ['Mash the banana well.', 'Mix in the egg and a few spoons of flour to make a thick batter.', 'Cook small spoonfuls on a lightly oiled pan until golden on both sides.']],
    ['Poha', 15, 1, ['poha', 'onion'], ['Rinse the poha and let it drain.', 'Fry mustard seeds, chopped onion and green chilli (potato or peanuts if you have them).', 'Add turmeric, salt and the poha, and toss gently for 2 minutes.', 'Finish with lemon juice and coriander.']],
    ['Upma', 20, 1, ['semolina', 'onion'], ['Dry roast the semolina until it smells nutty, then set it aside.', 'Fry mustard seeds, onion and chilli.', 'Add 2 cups of hot water and salt, and bring to a boil.', 'Pour in the semolina slowly while stirring. Cover for 2 minutes.']],
    ['Aloo jeera', 20, 1, ['potato'], ['Boil, peel and cube the potatoes.', 'Splutter cumin seeds in oil.', 'Add the potatoes, turmeric, chilli powder and salt, and fry until crisp at the edges.']],
    ['Aloo paratha', 30, 1, ['flour', 'potato'], ['Knead the flour with water into a soft dough.', 'Mash boiled potatoes with salt, chilli and spices for the filling.', 'Stuff a ball of dough with filling, seal and roll out gently.', 'Cook on a hot pan with oil until golden on both sides.']],
    ['Aloo fry', 20, 1, ['potato'], ['Cut the potatoes into thin pieces.', 'Fry in oil on medium heat, stirring often.', 'Add salt, chilli powder and turmeric when golden and crisp.']],
    ['Dal tadka', 30, 1, ['dal', 'onion', 'tomato'], ['Boil the dal with turmeric and salt until soft.', 'Fry cumin, chopped onion and tomato in oil or ghee.', 'Pour this tadka over the dal and simmer for 5 minutes.']],
    ['Khichdi', 30, 1, ['rice', 'dal'], ['Rinse the rice and dal together.', 'Pressure cook or boil with turmeric, salt and 4 cups of water until very soft.', 'Serve with curd, pickle or a spoon of ghee.']],
    ['Jeera rice', 20, 1, ['rice'], ['Rinse the rice.', 'Splutter a spoon of cumin in oil or ghee.', 'Add the rice, salt and water, and cook until fluffy.']],
    ['Lemon rice', 15, 1, ['rice', 'lemon'], ['Fry mustard seeds, chilli and turmeric in oil.', 'Add cooked rice and salt, and toss.', 'Turn off the heat and mix in lemon juice.']],
    ['Tomato rice', 25, 1, ['rice', 'tomato', 'onion'], ['Fry chopped onion until soft.', 'Add tomato, salt and spices and cook until mushy.', 'Mix in cooked rice and toss until coated.']],
    ['Veg pulao', 30, 1, ['rice', 'onion', 'peas'], ['Fry whole spices and sliced onion.', 'Add peas (and any other veg), salt and rinsed rice.', 'Add water, cover and cook until the rice is done.']],
    ['Curd rice', 10, 1, ['rice', 'curd'], ['Mash cooked rice while warm.', 'Mix in curd and salt.', 'Top with a quick tempering of mustard seeds and chilli if you like.']],
    ['Paneer bhurji', 15, 1, ['paneer', 'onion', 'tomato'], ['Crumble the paneer.', 'Fry onion and tomato with turmeric, chilli powder and salt until soft.', 'Add the paneer and cook for 3 minutes.']],
    ['Palak paneer', 30, 1, ['spinach', 'paneer', 'onion'], ['Blanch the spinach for 2 minutes and blend to a puree.', 'Fry onion and garlic, then add the puree and salt.', 'Add cubed paneer and simmer for 5 minutes.']],
    ['Matar paneer', 30, 1, ['peas', 'paneer', 'tomato', 'onion'], ['Fry onion until golden, add tomato and spices and cook to a thick gravy.', 'Add peas and a little water, and simmer 8 minutes.', 'Add cubed paneer and cook 3 more minutes.']],
    ['Chana masala', 35, 1, ['chickpeas', 'onion', 'tomato'], ['Boil the soaked chickpeas until soft (or use canned).', 'Fry onion and tomato with spices into a thick masala.', 'Add the chickpeas and some water, and simmer 10 minutes.']],
    ['Rajma', 45, 1, ['rajma', 'onion', 'tomato'], ['Boil the soaked rajma until soft.', 'Fry onion, tomato and spices into a thick masala.', 'Add the rajma with its water and simmer 15 minutes. Serve with rice.']],
    ['Besan chilla', 15, 1, ['besan', 'onion'], ['Mix besan with water, salt and spices into a pourable batter.', 'Stir in chopped onion (and tomato or coriander).', 'Spread a ladle on a hot oiled pan and cook both sides until golden.']],
    ['Cucumber raita', 5, 1, ['curd', 'cucumber'], ['Whisk the curd with a pinch of salt.', 'Mix in grated or chopped cucumber.', 'Add roasted cumin powder on top.']],
    ['Tomato soup', 25, 1, ['tomato'], ['Chop the tomatoes (and an onion or garlic if you have them).', 'Simmer in water with salt for 15 minutes.', 'Blend, strain if you like, and finish with pepper and butter.']],
    ['Veg sandwich', 10, 1, ['bread', 'tomato', 'cucumber'], ['Butter the bread.', 'Layer tomato and cucumber slices with salt and pepper.', 'Close and toast or eat as is.']],
    ['Grilled cheese', 10, 1, ['bread', 'cheese', 'butter'], ['Butter the outside of two bread slices.', 'Put cheese between them.', 'Cook in a pan on medium heat until golden and melted.']],
    ['Red sauce pasta', 25, 1, ['pasta', 'tomato', 'onion'], ['Boil the pasta in salted water.', 'Fry onion and garlic, add chopped tomato and cook down to a sauce.', 'Toss the pasta in the sauce with pepper and herbs.']],
    ['Mac and cheese', 20, 1, ['pasta', 'cheese', 'milk'], ['Boil the pasta and drain.', 'Warm the milk, melt in the cheese and add salt and pepper.', 'Stir in the pasta until coated.']],
    ['Veg noodles', 20, 1, ['noodles', 'cabbage'], ['Boil the noodles and drain.', 'Stir fry sliced cabbage (and carrot or capsicum) on high heat.', 'Add the noodles, salt, pepper and a splash of soy sauce if you have it.']],
    ['Chicken curry', 45, 0, ['chicken', 'onion', 'tomato'], ['Fry onion until deep golden, add ginger-garlic paste.', 'Add tomato and spices and cook to a thick masala.', 'Add the chicken and a little water, cover and cook until tender (about 25 minutes).']],
    ['Chicken stir fry', 25, 0, ['chicken', 'capsicum', 'onion'], ['Slice the chicken thin and season with salt and pepper.', 'Sear it on high heat until cooked through, then set aside.', 'Stir fry the onion and capsicum, then add the chicken back and toss.']],
    ['Banana oats', 10, 1, ['oats', 'banana', 'milk'], ['Cook the oats in the milk for 3 to 4 minutes.', 'Slice the banana on top.', 'Add honey or sugar if you like.']],
    ['Banana shake', 5, 1, ['banana', 'milk'], ['Blend a banana with cold milk.', 'Add sugar or honey to taste and serve cold.']],
    ['Aloo gobi', 30, 1, ['potato', 'cauliflower'], ['Cut the potato and cauliflower into pieces.', 'Splutter cumin in oil, then add the veg with turmeric, chilli powder and salt.', 'Cover and cook on low heat until soft, stirring now and then.']],
    ['Cabbage stir fry', 15, 1, ['cabbage'], ['Shred the cabbage.', 'Splutter mustard seeds in oil, add chilli and the cabbage.', 'Cook on medium heat with turmeric and salt until tender.']],
    ['Beans poriyal', 20, 1, ['beans', 'onion'], ['Chop the beans small.', 'Fry mustard seeds, onion and chilli.', 'Add the beans, salt and a splash of water, and cook covered until tender.']]
  ];
  var QUICK = ['egg', 'onion', 'tomato', 'potato', 'rice', 'bread', 'milk', 'paneer', 'chicken', 'dal', 'pasta', 'cheese', 'spinach', 'peas', 'curd', 'capsicum', 'flour', 'besan', 'banana', 'oats', 'cauliflower', 'cabbage', 'beans', 'noodles', 'lemon', 'semolina', 'poha', 'chickpeas', 'rajma', 'butter', 'cucumber'];
  var SYN = { yogurt: 'curd', yoghurt: 'curd', dahi: 'curd', lentil: 'dal', lentils: 'dal', daal: 'dal', atta: 'flour', maida: 'flour', 'wheat flour': 'flour', 'bell pepper': 'capsicum', chana: 'chickpeas', 'kidney beans': 'rajma', rava: 'semolina', suji: 'semolina', sooji: 'semolina', 'gram flour': 'besan', 'flattened rice': 'poha', matar: 'peas', 'green peas': 'peas', gobi: 'cauliflower', 'phool gobi': 'cauliflower', noodle: 'noodles', spaghetti: 'pasta', macaroni: 'pasta', 'green beans': 'beans', 'french beans': 'beans', 'rolled oats': 'oats', oatmeal: 'oats', lime: 'lemon', chickens: 'chicken' };
  var KEEP = { peas: 1, beans: 1, oats: 1, noodles: 1, chickpeas: 1, hummus: 1, asparagus: 1 };
  function canon(s) {
    s = String(s).toLowerCase().replace(/[^a-z\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (SYN[s]) return SYN[s];
    if (!KEEP[s]) {
      if (/ies$/.test(s)) s = s.replace(/ies$/, 'y');
      else if (/oes$/.test(s)) s = s.replace(/oes$/, 'o');
      else if (/[^s]s$/.test(s)) s = s.replace(/s$/, '');
    }
    return SYN[s] || s;
  }
  var CH = u.get('velentis.chef.v1', { have: [], veg: false });
  if (!CH || !Array.isArray(CH.have)) CH = { have: [], veg: false };
  var chOpen = -1;
  function chSave() { u.put('velentis.chef.v1', CH); }

  function recipeCard(r, idx, mins) {
    var missing = r[3].filter(function (n) { return CH.have.indexOf(n) === -1; });
    return '<button class="card row btn" data-act="ch-open" data-id="' + idx + '"><span class="chip">' + ic('chef') + '</span><span class="txt"><span class="nm">' + esc(r[0]) + '</span><br><span class="sub">' + r[1] + ' min' + (r[2] ? ' · veg' : '') + ' · ' +
      (missing.length ? 'need ' + esc(missing.join(', ')) : 'you have everything') + '</span></span>' + ic('chev') + '</button>';
  }
  function renderChef() {
    if (chOpen >= 0 && RECIPES[chOpen]) {
      var r = RECIPES[chOpen];
      var ings = r[3].map(function (n) {
        var has = CH.have.indexOf(n) !== -1;
        return '<div class="ing"><span class="chip" style="width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:' + (has ? 'var(--accent)' : 'var(--field)') + ';color:' + (has ? 'var(--on-accent)' : 'var(--muted)') + '">' + (has ? ic('tick') : '') + '</span><span' + (has ? '' : ' class="miss"') + '>' + esc(n) + (has ? '' : ' (missing)') + '</span></div>';
      }).join('');
      $('v-chef').innerHTML =
        bar('data-act="ch-back"', r[0]) +
        '<div class="card pad"><div class="eyebrow">' + r[1] + ' minutes' + (r[2] ? ' · vegetarian' : '') + '</div><div style="margin-top:8px">' + ings + '</div>' +
        '<p class="note" style="margin-top:8px">Assumes you have salt, oil, water and basic spices.</p></div>' +
        '<div class="card pad"><div class="eyebrow" style="margin-bottom:12px">Steps</div><ol class="steps">' + r[4].map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>' +
        '<button class="btn2 main" data-act="ch-cooked" data-id="' + chOpen + '">I cooked this</button>';
      return;
    }
    var have = CH.have;
    var chips = have.map(function (n) { return '<button class="tag on" data-act="ch-rm" data-id="' + esc(n) + '" aria-label="Remove ' + esc(n) + '">' + esc(n) + ' ×</button>'; }).join('');
    var quick = QUICK.filter(function (n) { return have.indexOf(n) === -1; }).map(function (n) { return '<button class="tag" data-act="ch-add" data-id="' + n + '">+ ' + n + '</button>'; }).join('');
    var list = RECIPES.map(function (r, i) { return { r: r, i: i }; }).filter(function (o) { return !CH.veg || o.r[2]; });
    var scored = list.map(function (o) {
      var m = o.r[3].filter(function (n) { return have.indexOf(n) !== -1; }).length;
      return { r: o.r, i: o.i, m: m, miss: o.r[3].length - m, sc: m / o.r[3].length };
    }).filter(function (o) { return o.m > 0; }).sort(function (a, b) { return b.sc - a.sc || a.miss - b.miss || a.r[1] - b.r[1]; });
    var ready = scored.filter(function (o) { return o.miss === 0; }), near = scored.filter(function (o) { return o.miss > 0; }).slice(0, 12);
    var out = '';
    if (!have.length) out = '<div class="card empty"><h2>What is in your fridge?</h2><p>Add a few ingredients above and I will show what you can cook.</p></div>';
    else if (!scored.length) out = '<div class="card empty"><h2>No match yet</h2><p>Try adding more ingredients like onion, tomato, rice or egg.</p></div>';
    else {
      if (ready.length) out += '<div class="sec"><h2>Ready to cook</h2><span class="note">' + ready.length + '</span></div><div class="list">' + ready.map(function (o) { return recipeCard(o.r, o.i); }).join('') + '</div>';
      if (near.length) out += '<div class="sec"><h2>Almost there</h2></div><div class="list">' + near.map(function (o) { return recipeCard(o.r, o.i); }).join('') + '</div>';
    }
    $('v-chef').innerHTML =
      bar(u.BACK_TOOLS, 'Fridge chef') +
      '<form class="form" id="chForm" novalidate><input class="field" id="chIng" placeholder="Add an ingredient, like potato" aria-label="Ingredient" autocomplete="off" autocapitalize="none"><button class="add" type="submit">Add</button></form>' +
      (chips ? '<div class="chips">' + chips + '</div>' : '') +
      '<div class="chips">' + quick + '</div>' +
      '<button class="tag' + (CH.veg ? ' on' : '') + '" data-act="ch-veg" aria-pressed="' + CH.veg + '" style="align-self:flex-start">Vegetarian only</button>' + out;
  }

  /* ---------- Notes vault ---------- */
  var NT = u.get('velentis.notes.v1', { notes: [] });
  if (!NT || !Array.isArray(NT.notes)) NT = { notes: [] };
  var nt = { open: null, q: '', pend: null };
  function ntSave() { u.put('velentis.notes.v1', NT); }
  function noteById(id) { return NT.notes.filter(function (n) { return n.id === id; })[0]; }
  function ntTitle(n) { var t = (n.title || '').trim(); if (t) return t; var l = (n.body || '').trim().split('\n')[0]; return l ? l.slice(0, 40) : 'Untitled note'; }
  function renderNotes() {
    var n = nt.open && noteById(nt.open);
    if (n) {
      $('v-notes').innerHTML =
        bar('data-act="nt-back"', 'Note', '<button class="icon-btn' + (nt.pend === n.id ? ' warn' : '') + '" style="margin-left:auto" data-act="nt-del" data-id="' + n.id + '" aria-label="Delete note">' + (nt.pend === n.id ? 'Delete?' : ic('trash')) + '</button>') +
        '<input class="field" id="ntTitle" maxlength="60" placeholder="Title" aria-label="Note title" value="' + esc(n.title || '') + '" autocomplete="off">' +
        '<textarea class="field" id="ntBody" style="min-height:300px" placeholder="Write anything..." aria-label="Note text">' + esc(n.body || '') + '</textarea>' +
        '<p class="note" id="ntSaved">Saved automatically.</p>';
      return;
    }
    var q = nt.q.toLowerCase();
    var list = NT.notes.slice().sort(function (a, b) { return b.t - a.t; }).filter(function (x) { return !q || (x.title + ' ' + x.body).toLowerCase().indexOf(q) !== -1; });
    var rows = list.map(function (x) {
      return '<button class="card row btn" data-act="nt-open" data-id="' + x.id + '"><span class="chip">' + ic('notes') + '</span><span class="txt"><span class="nm">' + esc(ntTitle(x)) + '</span><br><span class="sub">' + esc((x.body || '').replace(/\s+/g, ' ').slice(0, 60) || 'Empty') + '</span></span>' + ic('chev') + '</button>';
    }).join('');
    $('v-notes').innerHTML =
      bar(u.BACK_TOOLS, 'Notes vault', '<button class="add" style="margin-left:auto" data-act="nt-new">New</button>') +
      (NT.notes.length ? '<input class="field" id="ntSearch" placeholder="Search notes" aria-label="Search notes" value="' + esc(nt.q) + '" autocomplete="off">' : '') +
      (rows ? '<div class="list">' + rows + '</div>' : '<div class="card empty"><h2>' + (NT.notes.length ? 'No match' : 'Your notes live here') + '</h2><p>' + (NT.notes.length ? 'Try a different word.' : 'Tap New to write your first note.') + '</p></div>');
  }
  function ntClose() {
    var n = nt.open && noteById(nt.open);
    if (n && !(n.title || '').trim() && !(n.body || '').trim()) NT.notes = NT.notes.filter(function (x) { return x.id !== n.id; });
    ntSave(); nt.open = null; nt.pend = null;
  }
  function ntAward(n) {
    if (!n.xp && (n.body || '').trim().length >= 20) { n.xp = 1; ntSave(); V.emit('note.add', { ref: n.id }); }
  }

  /* ---------- Countdown board ---------- */
  var CD = u.get('velentis.count.v1', { items: [] });
  if (!CD || !Array.isArray(CD.items)) CD = { items: [] };
  var cdPend = null;
  function cdSave() { u.put('velentis.count.v1', CD); }
  function daysTo(d) { var a = u.parse(iso(new Date())), b = u.parse(d); return Math.round((b - a) / 86400000); }
  function renderCount() {
    var rows = CD.items.slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).map(function (x) {
      var n = daysTo(x.date), pend = cdPend === x.id;
      var big = n === 0 ? 'Today' : n > 0 ? plural(n, 'day') + ' left' : plural(-n, 'day') + ' ago';
      return '<li class="card row"><div class="txt"><div class="nm">' + esc(x.name) + '</div><div class="sub">' + u.niceDate(x.date) + '</div></div><strong style="font-variant-numeric:tabular-nums">' + big + '</strong>' +
        '<button class="icon-btn' + (pend ? ' warn' : '') + '" data-act="cd-del" data-id="' + x.id + '" aria-label="Delete ' + esc(x.name) + '">' + (pend ? 'Delete?' : ic('trash')) + '</button></li>';
    }).join('');
    $('v-count').innerHTML =
      bar(u.BACK_TOOLS, 'Countdown') +
      (rows ? '<ul class="list">' + rows + '</ul>' : '<div class="card empty"><h2>Count down to something</h2><p>An exam, a trip, a birthday. Add it below.</p></div>') +
      '<form class="stack" id="cdForm" novalidate style="gap:8px"><div class="form"><input class="field" id="cdName" maxlength="40" placeholder="What are you waiting for?" aria-label="Event name" autocomplete="off"><input class="field" id="cdDate" type="date" value="' + iso(addDays(new Date(), 7)) + '" aria-label="Date" style="max-width:150px"></div><button class="add" type="submit" style="width:100%">Add</button><div class="err" id="cdErr" hidden>Type a name and pick a date.</div></form>';
  }

  V.spend = { add: function (amt, cat, note, date, quiet) {
    var rid = u.uid(); SP.items.push({ id: rid, amt: amt, cat: cat, note: note || '', date: date || iso(new Date()) });
    spMonth = (date || iso(new Date())).slice(0, 7); spSave(); V.emit('spend.add', { ref: rid });
  } };
  V.registerTool('spend', renderSpend);
  V.registerTool('chef', renderChef);
  V.registerTool('notes', renderNotes);
  V.registerTool('count', renderCount);
  V.registerSearch(function (q) {
    var out = [];
    NT.notes.forEach(function (n) { if ((n.title + ' ' + n.body).toLowerCase().indexOf(q) !== -1) out.push({ icon: 'notes', title: ntTitle(n), sub: 'Note', to: 'notes' }); });
    CD.items.forEach(function (c) { if (c.name.toLowerCase().indexOf(q) !== -1) out.push({ icon: 'calendar', title: c.name, sub: 'Countdown', to: 'count' }); });
    RECIPES.forEach(function (r) { if (r[0].toLowerCase().indexOf(q) !== -1) out.push({ icon: 'chef', title: r[0], sub: 'Recipe', to: 'chef' }); });
    return out.slice(0, 8);
  });
  V.on('view.leave', function (name) { if (name === 'notes' && nt.open) { var cn = noteById(nt.open); if (cn) ntAward(cn); ntClose(); } });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a.indexOf('sp-') === 0) {
      if (a === 'sp-prev') { spMonth = shiftMonth(spMonth, -1); }
      else if (a === 'sp-next') { if (spMonth < iso(new Date()).slice(0, 7)) spMonth = shiftMonth(spMonth, 1); }
      else if (a === 'sp-cur') { SP.cur = CURS[(CURS.indexOf(SP.cur) + 1) % CURS.length]; spSave(); }
      else if (a === 'sp-del') {
        if (spPend === id) { SP.items = SP.items.filter(function (x) { return x.id !== id; }); spPend = null; spSave(); }
        else { spPend = id; setTimeout(function () { if (spPend === id) { spPend = null; if (V.view() === 'spend') renderSpend(); } }, 3000); }
      }
      renderSpend();
    } else if (a.indexOf('ch-') === 0) {
      if (a === 'ch-add') { if (CH.have.indexOf(id) === -1) CH.have.push(id); chSave(); }
      else if (a === 'ch-rm') { CH.have = CH.have.filter(function (n) { return n !== id; }); chSave(); }
      else if (a === 'ch-veg') { CH.veg = !CH.veg; chSave(); }
      else if (a === 'ch-open') { chOpen = +id; window.scrollTo(0, 0); }
      else if (a === 'ch-back') { chOpen = -1; }
      else if (a === 'ch-cooked') { V.emit('chef.cook', { ref: id }); chOpen = -1; }
      renderChef();
    } else if (a.indexOf('nt-') === 0) {
      if (a === 'nt-new') { var n = { id: 'n' + u.uid(), title: '', body: '', t: Date.now() }; NT.notes.push(n); ntSave(); nt.open = n.id; }
      else if (a === 'nt-open') { nt.open = id; }
      else if (a === 'nt-back') { var cur = noteById(nt.open); if (cur) ntAward(cur); ntClose(); }
      else if (a === 'nt-del') {
        if (nt.pend === id) { NT.notes = NT.notes.filter(function (x) { return x.id !== id; }); nt.open = null; nt.pend = null; ntSave(); }
        else { nt.pend = id; setTimeout(function () { if (nt.pend === id) { nt.pend = null; if (V.view() === 'notes' && nt.open) renderNotes(); } }, 3000); }
      }
      renderNotes(); window.scrollTo(0, 0);
    } else if (a === 'cd-del') {
      if (cdPend === id) { CD.items = CD.items.filter(function (x) { return x.id !== id; }); cdPend = null; cdSave(); }
      else { cdPend = id; setTimeout(function () { if (cdPend === id) { cdPend = null; if (V.view() === 'count') renderCount(); } }, 3000); }
      renderCount();
    }
  });

  document.addEventListener('submit', function (e) {
    var id = e.target.id, f, v;
    if (id === 'spForm') {
      e.preventDefault();
      var amt = parseFloat(String($('spAmt').value).replace(',', '.'));
      if (!(amt > 0)) { $('spErr').hidden = false; $('spAmt').focus(); return; }
      var date = $('spDate').value || iso(new Date()), rid = u.uid();
      SP.items.push({ id: rid, amt: Math.round(amt * 100) / 100, cat: $('spCat').value, note: $('spNote').value.trim(), date: date });
      spMonth = date.slice(0, 7); spSave(); renderSpend(); var nn = $('spAmt'); if (nn) nn.focus();
      V.emit('spend.add', { ref: rid });
    } else if (id === 'spBudgetForm') {
      e.preventDefault();
      var b = parseFloat(String($('spBudget').value).replace(',', '.'));
      SP.budget = b > 0 ? b : 0; spSave(); renderSpend();
    } else if (id === 'chForm') {
      e.preventDefault();
      f = $('chIng'); v = canon(f.value);
      if (v && CH.have.indexOf(v) === -1) { CH.have.push(v); chSave(); }
      renderChef(); $('chIng').focus();
    } else if (id === 'cdForm') {
      e.preventDefault();
      var nm = $('cdName').value.trim(), dt = $('cdDate').value;
      if (!nm || !dt) { $('cdErr').hidden = false; return; }
      CD.items.push({ id: 'c' + u.uid(), name: nm, date: dt }); cdSave(); renderCount();
    }
  });
  document.addEventListener('input', function (e) {
    var id = e.target.id;
    if (id === 'spAmt') $('spErr').hidden = true;
    else if (id === 'cdName') $('cdErr').hidden = true;
    else if (id === 'ntTitle' || id === 'ntBody') {
      var n = noteById(nt.open); if (!n) return;
      if (id === 'ntTitle') n.title = e.target.value; else n.body = e.target.value;
      n.t = Date.now(); ntSave();
    } else if (id === 'ntSearch') {
      nt.q = e.target.value; var pos = e.target.selectionStart; renderNotes(); var s = $('ntSearch'); if (s) { s.focus(); try { s.setSelectionRange(pos, pos); } catch (x) {} }
    }
  });
})();

/* Watchlist and Voice memos. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, iso = u.iso, plural = u.plural, bar = u.bar;

  /* ---------- Watchlist ---------- */
  var WK = 'velentis.watch.v1', W = u.get(WK, { items: [] });
  if (!W || !Array.isArray(W.items)) W = { items: [] };
  var KINDS = ['Anime', 'Show', 'Movie', 'Song', 'Book'], wf = 'All', wk = 'Anime', wpend = null;
  var STATES = [['plan', 'Planned'], ['now', 'In progress'], ['done', 'Finished']];
  function wSave() { u.put(WK, W); }
  function renderWatch() {
    var list = W.items.filter(function (i) { return wf === 'All' || i.kind === wf; });
    var rows = list.map(function (i) {
      var st = STATES.filter(function (x) { return x[0] === i.st; })[0] || STATES[0], pend = wpend === i.id;
      return '<li class="card row"><button class="check' + (i.st === 'done' ? ' on' : '') + '" data-act="wt-cycle" data-id="' + i.id + '" aria-label="Change status, now ' + st[1] + '">' + (i.st === 'done' ? ic('tick') : '') + '</button>' +
        '<div class="txt"><div class="nm">' + esc(i.title) + '</div><div class="sub">' + esc(i.kind) + ' · ' + st[1] + '</div></div>' +
        '<button class="icon-btn' + (pend ? ' warn' : '') + '" data-act="wt-del" data-id="' + i.id + '" aria-label="Delete ' + esc(i.title) + '">' + (pend ? 'Delete?' : ic('trash')) + '</button></li>';
    }).join('');
    $('v-watch').innerHTML = bar(u.BACK_TOOLS, 'Watchlist') +
      '<div class="chips">' + ['All'].concat(KINDS).map(function (k) { return '<button class="tag' + (wf === k ? ' on' : '') + '" data-act="wt-filter" data-id="' + k + '" aria-pressed="' + (wf === k) + '">' + k + '</button>'; }).join('') + '</div>' +
      (rows ? '<ul class="list">' + rows + '</ul>' : '<div class="card empty"><h2>Nothing here yet</h2><p>Add the anime, songs, shows and books you want to get to.</p></div>') +
      '<form class="stack" id="wtForm" novalidate style="gap:8px"><div class="chips">' + KINDS.map(function (k) { return '<button type="button" class="tag' + (wk === k ? ' on' : '') + '" data-act="wt-kind" data-id="' + k + '" aria-pressed="' + (wk === k) + '">' + k + '</button>'; }).join('') + '</div>' +
      '<div class="form"><input class="field" id="wtTitle" maxlength="60" placeholder="Title" aria-label="Title" autocomplete="off"><button class="add" type="submit">Add</button></div><div class="err" id="wtErr" hidden>Type a title first.</div></form>' +
      '<p class="note">Tap the circle to move something from planned to in progress to finished. Finishing earns XP.</p>';
  }
  V.registerTool('watch', renderWatch);
  V.registerSearch(function (q) {
    return W.items.filter(function (i) { return i.title.toLowerCase().indexOf(q) !== -1; }).map(function (i) { return { icon: 'play', title: i.title, sub: i.kind, to: 'watch' }; });
  });

  /* ---------- Voice memos (audio kept in IndexedDB on this phone) ---------- */
  var VK = 'velentis.voice.v1', VM = u.get(VK, { items: [] });
  if (!VM || !Array.isArray(VM.items)) VM = { items: [] };
  var vs = { rec: null, chunks: [], stream: null, t0: 0, timer: 0, msg: '', play: null, url: '', pend: null };
  function vSave() { u.put(VK, VM); }
  function db() {
    return new Promise(function (ok, no) {
      var r = indexedDB.open('velentis-voice', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('a'); };
      r.onsuccess = function () { ok(r.result); }; r.onerror = function () { no(r.error); };
    });
  }
  function dbPut(id, blob) { return db().then(function (d) { return new Promise(function (ok, no) { var t = d.transaction('a', 'readwrite'); t.objectStore('a').put(blob, id); t.oncomplete = ok; t.onerror = no; }); }); }
  function dbGet(id) { return db().then(function (d) { return new Promise(function (ok, no) { var r = d.transaction('a').objectStore('a').get(id); r.onsuccess = function () { ok(r.result); }; r.onerror = no; }); }); }
  function dbDel(id) { return db().then(function (d) { d.transaction('a', 'readwrite').objectStore('a').delete(id); }); }
  function clock(s) { s = Math.round(s); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); }

  function renderVoice() {
    var recording = !!vs.rec;
    var rows = VM.items.slice().reverse().map(function (m) {
      var on = vs.play === m.id, pend = vs.pend === m.id;
      return '<li class="card row"><button class="check' + (on ? ' on' : '') + '" data-act="vm-play" data-id="' + m.id + '" aria-label="' + (on ? 'Stop' : 'Play') + ' memo">' + (on ? ic('tick') : ic('play')) + '</button>' +
        '<div class="txt"><div class="nm">' + esc(m.name) + '</div><div class="sub">' + esc(m.day) + ' · ' + clock(m.sec) + '</div></div>' +
        '<button class="icon-btn' + (pend ? ' warn' : '') + '" data-act="vm-del" data-id="' + m.id + '" aria-label="Delete memo">' + (pend ? 'Delete?' : ic('trash')) + '</button></li>';
    }).join('');
    $('v-voice').innerHTML = bar(u.BACK_TOOLS, 'Voice memos') +
      '<div class="card hero"><span class="chip">' + ic('mic') + '</span><h2 id="vmClock">' + (recording ? '0:00' : 'Ready') + '</h2><p>' + esc(vs.msg || (recording ? 'Recording. Tap stop when you are done.' : 'Tap the button and talk. Memos stay on this phone.')) + '</p></div>' +
      '<button class="btn2 main" data-act="vm-' + (recording ? 'stop' : 'start') + '">' + (recording ? 'Stop and save' : 'Start recording') + '</button>' +
      (rows ? '<ul class="list">' + rows + '</ul>' : '');
  }
  function stopStream() { if (vs.stream) { vs.stream.getTracks().forEach(function (t) { t.stop(); }); vs.stream = null; } clearInterval(vs.timer); vs.timer = 0; }
  function stopPlay() { var a = $('vmAudio'); if (a) { a.pause(); a.remove(); } if (vs.url) { URL.revokeObjectURL(vs.url); vs.url = ''; } vs.play = null; }
  function vStart() {
    if (!navigator.mediaDevices || !window.MediaRecorder) { vs.msg = 'This device cannot record audio here.'; renderVoice(); return; }
    stopPlay();
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
      vs.stream = s; vs.chunks = []; vs.msg = '';
      var r = new MediaRecorder(s); vs.rec = r; vs.t0 = Date.now();
      r.ondataavailable = function (e) { if (e.data && e.data.size) vs.chunks.push(e.data); };
      r.onstop = function () {
        var sec = (Date.now() - vs.t0) / 1000, blob = new Blob(vs.chunks, { type: r.mimeType || 'audio/webm' });
        stopStream(); vs.rec = null;
        if (sec < 1) { vs.msg = 'Too short, nothing saved.'; if (V.view() === 'voice') renderVoice(); return; }
        var id = 'v' + u.uid(), n = VM.items.length + 1;
        dbPut(id, blob).then(function () {
          VM.items.push({ id: id, name: 'Memo ' + n, day: iso(new Date()), sec: Math.round(sec) }); vSave(); vs.msg = 'Saved.';
          V.emit('voice.memo', { ref: id });
          if (V.view() === 'voice') renderVoice();
        }, function () { vs.msg = 'Could not save the memo.'; if (V.view() === 'voice') renderVoice(); });
      };
      r.start(); renderVoice();
      vs.timer = setInterval(function () { var c = $('vmClock'); if (c && V.view() === 'voice') c.textContent = clock((Date.now() - vs.t0) / 1000); }, 500);
    }).catch(function (err) {
      vs.msg = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError') ? 'Microphone is blocked. Open your phone Settings, Apps, Velentis, Permissions, Microphone, then choose Allow.' : 'The microphone did not open (' + ((err && err.name) || 'unknown') + ').';
      renderVoice();
    });
  }
  V.registerTool('voice', renderVoice);
  V.on('view.leave', function (k) { if (k === 'voice') { if (vs.rec) { try { vs.rec.onstop = null; vs.rec.stop(); } catch (e) {} vs.rec = null; } stopStream(); stopPlay(); } });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a.indexOf('wt-') === 0) {
      if (a === 'wt-filter') wf = id;
      else if (a === 'wt-kind') { wk = id; var tv = $('wtTitle') ? $('wtTitle').value : ''; renderWatch(); if ($('wtTitle')) $('wtTitle').value = tv; return; }
      else if (a === 'wt-cycle') {
        var i = W.items.filter(function (x) { return x.id === id; })[0]; if (!i) return;
        i.st = i.st === 'plan' ? 'now' : i.st === 'now' ? 'done' : 'plan'; wSave();
        if (i.st === 'done') V.emit('watch.done', { ref: id });
      } else if (a === 'wt-del') {
        if (wpend === id) { W.items = W.items.filter(function (x) { return x.id !== id; }); wpend = null; wSave(); }
        else { wpend = id; setTimeout(function () { if (wpend === id) { wpend = null; if (V.view() === 'watch') renderWatch(); } }, 3000); }
      }
      renderWatch();
    } else if (a.indexOf('vm-') === 0) {
      if (a === 'vm-start') vStart();
      else if (a === 'vm-stop') { if (vs.rec) vs.rec.stop(); }
      else if (a === 'vm-play') {
        if (vs.play === id) { stopPlay(); renderVoice(); return; }
        stopPlay();
        dbGet(id).then(function (b) {
          if (!b) { vs.msg = 'That memo is missing.'; renderVoice(); return; }
          vs.url = URL.createObjectURL(b); vs.play = id;
          var au = document.createElement('audio'); au.id = 'vmAudio'; au.src = vs.url; document.body.appendChild(au);
          au.onended = function () { stopPlay(); if (V.view() === 'voice') renderVoice(); };
          au.play().catch(function () {}); renderVoice();
        });
      } else if (a === 'vm-del') {
        if (vs.pend === id) { if (vs.play === id) stopPlay(); VM.items = VM.items.filter(function (x) { return x.id !== id; }); dbDel(id); vs.pend = null; vSave(); renderVoice(); }
        else { vs.pend = id; renderVoice(); setTimeout(function () { if (vs.pend === id) { vs.pend = null; if (V.view() === 'voice') renderVoice(); } }, 3000); }
      }
    }
  });
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'wtForm') return;
    e.preventDefault();
    var f = $('wtTitle'), v = f.value.trim();
    if (!v) { $('wtErr').hidden = false; f.focus(); return; }
    W.items.push({ id: 'w' + u.uid(), title: v, kind: wk, st: 'plan' }); wSave(); renderWatch(); $('wtTitle').focus();
  });
  document.addEventListener('input', function (e) { if (e.target.id === 'wtTitle') $('wtErr').hidden = true; });
})();
