/* Flashcards: decks, notes-to-cards import, spaced-repetition study. Sends cards.study events. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, iso = u.iso, addDays = u.addDays, plural = u.plural, bar = u.bar;
  var KEY = 'velentis.cards.v1';
  var FC = u.get(KEY, { decks: [] });
  if (!FC || !Array.isArray(FC.decks)) FC = { decks: [] };
  var fc = { v: 'decks', d: null, s: null, pend: null };
  var INTERVALS = [0, 1, 3, 7, 14];
  function fcSave() { u.put(KEY, FC); }
  function deckById(id) { return FC.decks.filter(function (d) { return d.id === id; })[0]; }
  function dueCards(d) { var t = iso(new Date()); return d.cards.filter(function (c) { return !c.due || c.due <= t; }); }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  function fcDecks() {
    var rows = FC.decks.map(function (d) {
      return '<button class="card row btn" data-act="fc-open" data-id="' + d.id + '"><span class="chip">' + ic('layers') + '</span><span class="txt"><span class="nm">' + esc(d.name) + '</span><br><span class="sub">' + plural(d.cards.length, 'card') + ' · ' + dueCards(d).length + ' due</span></span>' + ic('chev') + '</button>';
    }).join('');
    return bar(u.BACK_TOOLS, 'Flashcards') +
      (rows ? '<div class="list">' + rows + '</div>' : '<div class="card empty"><h2>Make your first deck</h2><p>A deck is a set of cards, like Biology or Spanish words.</p></div>') +
      '<form class="stack" id="fcDeckForm" novalidate style="gap:6px"><div class="form"><input class="field" id="fcDeckName" maxlength="40" placeholder="New deck name" aria-label="New deck name" autocomplete="off"><button class="add" type="submit">Add</button></div><div class="err" id="fcDeckErr" hidden>Type a deck name first.</div></form>';
  }
  function fcDeck(d) {
    var due = dueCards(d).length;
    var rows = d.cards.map(function (c) {
      var pend = fc.pend === c.id;
      return '<li class="card row"><div class="txt"><div class="nm">' + esc(c.q) + '</div><div class="sub">' + esc(c.a) + '</div></div><button class="icon-btn' + (pend ? ' warn' : '') + '" data-act="fc-del-card" data-id="' + c.id + '" aria-label="Delete card">' + (pend ? 'Delete?' : ic('trash')) + '</button></li>';
    }).join('');
    return bar('data-act="fc-back"', d.name) +
      '<div class="card pad"><div class="today"><div><div class="eyebrow">Cards</div><div class="big">' + d.cards.length + '</div></div><div class="div"></div><div><div class="eyebrow">Due now</div><div class="big">' + due + '</div></div></div></div>' +
      '<div class="duo"><button class="btn2 main" data-act="fc-study-due"' + (due ? '' : ' disabled style="opacity:.4"') + '>Study due</button><button class="btn2" data-act="fc-study-all"' + (d.cards.length ? '' : ' disabled style="opacity:.4"') + '>Study all</button></div>' +
      '<form class="stack" id="fcCardForm" novalidate style="gap:8px"><input class="field" id="fcQ" maxlength="200" placeholder="Question or word" aria-label="Question" autocomplete="off"><input class="field" id="fcA" maxlength="200" placeholder="Answer" aria-label="Answer" autocomplete="off"><button class="add" type="submit" style="width:100%">Add card</button><div class="err" id="fcErr" hidden>Fill in both the question and the answer.</div></form>' +
      '<form class="stack" id="fcBulkForm" novalidate style="gap:8px"><textarea class="field" id="fcBulk" placeholder="Paste notes, one card per line, like:&#10;Capital of France - Paris&#10;H2O : water" aria-label="Paste notes to make cards"></textarea><button class="btn2" type="submit">Make cards from notes</button><div class="err" id="fcBulkMsg" hidden></div></form>' +
      (rows ? '<ul class="list">' + rows + '</ul>' : '') +
      '<button class="link" data-act="fc-del-deck">' + (fc.pend === 'deck' ? 'Tap again to delete this deck' : 'Delete this deck') + '</button>';
  }
  function fcStudy() {
    var d = deckById(fc.d), s = fc.s;
    if (!d || !s) { fc.v = 'decks'; return fcDecks(); }
    if (!s.queue.length) {
      return bar('data-act="fc-exit"', 'Done') +
        '<div class="card hero"><span class="chip">' + ic('check') + '</span><h2>Nice work</h2><p>You got ' + s.first + ' of ' + s.total + ' right the first time.</p></div>' +
        '<button class="btn2 main" data-act="fc-exit">Back to deck</button>';
    }
    var card = d.cards.filter(function (c) { return c.id === s.queue[0]; })[0];
    if (!card) { s.queue.shift(); return fcStudy(); }
    var pct = Math.round(s.done / s.total * 100);
    return bar('data-act="fc-exit"', 'Study') +
      '<div><div class="note">' + (s.done + 1 > s.total ? s.total : s.done + 1) + ' of ' + s.total + '</div><div class="bar"><i style="width:' + pct + '%"></i></div></div>' +
      '<div class="card flash"><div><div class="q">' + esc(card.q) + '</div>' + (s.show ? '<div class="a">' + esc(card.a) + '</div>' : '') + '</div></div>' +
      (s.show ? '<div class="duo"><button class="btn2" data-act="fc-again">Again</button><button class="btn2 main" data-act="fc-good">Got it</button></div>' : '<button class="btn2 main" data-act="fc-reveal">Show answer</button>');
  }
  function renderCards() {
    var h;
    if (fc.v === 'study') h = fcStudy();
    else if (fc.v === 'deck' && deckById(fc.d)) h = fcDeck(deckById(fc.d));
    else { fc.v = 'decks'; h = fcDecks(); }
    $('v-cards').innerHTML = h;
  }
  function startStudy(all) {
    var d = deckById(fc.d); if (!d) return;
    var pool = all ? d.cards : dueCards(d);
    if (!pool.length) return;
    fc.s = { queue: shuffle(pool.map(function (c) { return c.id; })), total: pool.length, done: 0, first: 0, show: false, failed: {} };
    fc.v = 'study'; renderCards();
  }

  V.registerTool('cards', renderCards);

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a.indexOf('fc-') !== 0) return;
    var d = deckById(fc.d), s = fc.s;
    if (a === 'fc-open') { fc.d = id; fc.v = 'deck'; fc.pend = null; window.scrollTo(0, 0); }
    else if (a === 'fc-back') { fc.v = 'decks'; fc.pend = null; }
    else if (a === 'fc-exit') { fc.v = 'deck'; fc.s = null; }
    else if (a === 'fc-study-due') { startStudy(false); return; }
    else if (a === 'fc-study-all') { startStudy(true); return; }
    else if (a === 'fc-reveal' && s) { s.show = true; }
    else if (a === 'fc-again' && s && d) {
      var cid = s.queue.shift(), c = d.cards.filter(function (x) { return x.id === cid; })[0];
      if (c) { c.box = 0; c.due = iso(new Date()); s.failed[cid] = 1; s.queue.push(cid); }
      s.show = false; fcSave();
    } else if (a === 'fc-good' && s && d) {
      var gid = s.queue.shift(), g = d.cards.filter(function (x) { return x.id === gid; })[0];
      if (g) {
        if (s.failed[gid]) g.box = 1; else { g.box = Math.min((g.box || 0) + 1, 4); s.first++; }
        g.due = iso(addDays(new Date(), INTERVALS[g.box]));
      }
      s.done++; s.show = false; fcSave();
      V.emit('cards.study', { ref: gid, units: 1 });   // each card can earn XP once a day
    } else if (a === 'fc-del-card' && d) {
      if (fc.pend === id) { d.cards = d.cards.filter(function (x) { return x.id !== id; }); fc.pend = null; fcSave(); }
      else { fc.pend = id; setTimeout(function () { if (fc.pend === id) { fc.pend = null; if (V.view() === 'cards') renderCards(); } }, 3000); }
    } else if (a === 'fc-del-deck' && d) {
      if (fc.pend === 'deck') { FC.decks = FC.decks.filter(function (x) { return x.id !== d.id; }); fc.pend = null; fc.v = 'decks'; fcSave(); }
      else { fc.pend = 'deck'; setTimeout(function () { if (fc.pend === 'deck') { fc.pend = null; if (V.view() === 'cards') renderCards(); } }, 3000); }
    }
    renderCards();
  });

  document.addEventListener('submit', function (e) {
    var id = e.target.id, f, v;
    if (id === 'fcDeckForm') {
      e.preventDefault();
      f = $('fcDeckName'); v = f.value.trim();
      if (!v) { $('fcDeckErr').hidden = false; f.focus(); return; }
      var deck = { id: 'd' + u.uid(), name: v, cards: [] }; FC.decks.push(deck); fcSave();
      fc.d = deck.id; fc.v = 'deck'; renderCards();
    } else if (id === 'fcCardForm') {
      e.preventDefault();
      var q = $('fcQ').value.trim(), an = $('fcA').value.trim(), d = deckById(fc.d);
      if (!q || !an || !d) { $('fcErr').hidden = false; return; }
      d.cards.push({ id: 'c' + u.uid(), q: q, a: an, box: 0, due: '' }); fcSave(); renderCards(); $('fcQ').focus();
    } else if (id === 'fcBulkForm') {
      e.preventDefault();
      var dd = deckById(fc.d), made = 0, seps = [' - ', ' – ', ' — ', ' | ', ' = ', ': ', '\t', ' : '];
      $('fcBulk').value.split(/\r?\n/).forEach(function (line) {
        line = line.trim(); if (!line) return;
        for (var i = 0; i < seps.length; i++) {
          var k = line.indexOf(seps[i]);
          if (k > 0) {
            var qq = line.slice(0, k).trim(), aa = line.slice(k + seps[i].length).trim();
            if (qq && aa) { dd.cards.push({ id: 'c' + u.uid() + made, q: qq, a: aa, box: 0, due: '' }); made++; break; }
          }
        }
      });
      if (made) { fcSave(); renderCards(); }
      else { var m = $('fcBulkMsg'); m.textContent = 'Put a dash or colon between the question and answer on each line.'; m.hidden = false; }
    }
  });
  document.addEventListener('input', function (e) {
    if (e.target.id === 'fcDeckName') $('fcDeckErr').hidden = true;
    else if (e.target.id === 'fcQ' || e.target.id === 'fcA') $('fcErr').hidden = true;
  });
})();
