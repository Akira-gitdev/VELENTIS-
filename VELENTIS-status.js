/* VELENTIS Status check: one screen that tests the things that can break and says, in plain words, what to do.
   Green = fine, yellow = works but could be better, red = needs fixing. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, bar = u.bar;
  var CFG = window.VELENTIS_CONFIG || {};
  var R = null, running = false;

  function ago(ts) { if (!ts) return 'never'; var s = Math.round((Date.now() - ts) / 1000); return s < 60 ? 'just now' : s < 3600 ? Math.round(s / 60) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' days ago'; }
  function timeout(p, ms) { return new Promise(function (res, rej) { var t = setTimeout(function () { rej(new Error('timeout')); }, ms); p.then(function (v) { clearTimeout(t); res(v); }, function (e) { clearTimeout(t); rej(e); }); }); }
  function item(name, st, text, tip) { return { name: name, st: st, text: text, tip: tip || '' }; }
  function table(O, path) {
    return timeout(O.req('GET', path), 8000).then(function () { return true; }, function (e) { var m = String(e && (e.message || e.body) || e); return /relation|does not exist|PGRST205|42P01|404/i.test(m + ' ' + (e && e.status)) ? false : null; });
  }

  function run() {
    if (running) return; running = true; R = []; render();
    var O = V.online, ses = O && O.session && O.session(), jobs = [];
    R.push(item('Internet', navigator.onLine ? 'ok' : 'bad', navigator.onLine ? 'Your phone is online.' : 'No internet right now.', navigator.onLine ? '' : 'Turn on Wi-Fi or mobile data. Most tools still work offline.'));
    R.push(item('This app', 'ok', 'Version ' + (window.VELENTIS_VERSION || 'current') + ' is running.'));
    if (!CFG.url || !CFG.key) R.push(item('Online setup', 'bad', 'Not set up.', 'Open VELENTIS-config.js on GitHub and add your Supabase address and public key.'));
    else {
      jobs.push(timeout(fetch(CFG.url.replace(/\/$/, '') + '/auth/v1/settings', { headers: { apikey: CFG.key } }), 8000).then(function (r) {
        R.push(item('Server', r.ok ? 'ok' : 'bad', r.ok ? 'Your Supabase server answers.' : 'The server answered with an error (' + r.status + ').', r.ok ? '' : 'Check the address and key in VELENTIS-config.js, and that your Supabase project is not paused.'));
      }, function () { R.push(item('Server', 'bad', 'Could not reach the server.', 'Check your internet. If it is fine, your free Supabase project may be paused: open supabase.com and press Restore.')); }));
      R.push(item('Account', ses ? 'ok' : 'warn', ses ? 'Signed in as ' + ses.username + '.' : 'Not signed in.', ses ? '' : 'Open Account and sync to log in. Without it nothing is backed up.'));
      if (ses) {
        var st = O.state ? O.state() : {};
        R.push(item('Last backup', st.last ? (st.dirty ? 'warn' : 'ok') : 'bad', st.at ? ago(st.at) + (st.dirty ? ', and you have changes waiting.' : '.') : 'No backup yet.', st.at && !st.dirty ? '' : 'Open Account and sync and press Back up now.'));
        R.push(item('Auto backup', st.auto ? 'ok' : 'warn', st.auto ? 'On.' : 'Off.', st.auto ? '' : 'Turn on Back up automatically in Account and sync.'));
        jobs.push(table(O, '/rest/v1/vault?select=kind&limit=1').then(function (v) {
          R.push(item('Photos and key backup', v === true ? 'ok' : v === false ? 'bad' : 'warn', v === true ? 'Ready.' : v === false ? 'The backup table is missing.' : 'Could not check.', v === false ? 'Run VELENTIS-supabase-4.sql once in Supabase (SQL Editor, paste, Run).' : ''));
        }));
        jobs.push(table(O, '/rest/v1/wallets?select=gold&limit=1').then(function (v) {
          R.push(item('Gold and trading', v === true ? 'ok' : v === false ? 'bad' : 'warn', v === true ? 'Ready.' : v === false ? 'The market tables are missing.' : 'Could not check.', v === false ? 'Run VELENTIS-supabase-3.sql once in Supabase.' : ''));
        }));
      }
    }
    var ai = {}; try { ai = JSON.parse(localStorage.getItem('velentis.ai.v1') || '{}') || {}; } catch (e) {}
    R.push(item('AI key', ai.gem || ai.groq ? 'ok' : 'warn', ai.gem || ai.groq ? 'A key is saved (' + [ai.gem ? 'Gemini' : '', ai.groq ? 'Groq' : ''].filter(Boolean).join(' and ') + ').' : 'No key saved.', ai.gem || ai.groq ? '' : 'Vel chat and Language buddy need a free key. Open Vel settings. The Word course works without one.'));
    jobs.push(new Promise(function (res) {
      var img = new Image(), t = setTimeout(function () { res(false); }, 7000);
      img.onload = function () { clearTimeout(t); res(true); }; img.onerror = function () { clearTimeout(t); res(false); };
      img.src = 'https://tile.openstreetmap.org/1/0/0.png?c=' + Date.now();
    }).then(function (ok) { R.push(item('Map pictures', ok ? 'ok' : 'warn', ok ? 'Map tiles load.' : 'Map tiles did not load.', ok ? '' : 'The map needs internet. Try again on Wi-Fi.')); }));
    jobs.push((navigator.permissions && navigator.permissions.query ? navigator.permissions.query({ name: 'geolocation' }).then(function (p) { return p.state; }, function () { return 'unknown'; }) : Promise.resolve('unknown')).then(function (s) {
      R.push(item('Location', s === 'granted' ? 'ok' : s === 'denied' ? 'bad' : 'warn', s === 'granted' ? 'Allowed.' : s === 'denied' ? 'Blocked.' : 'Not allowed yet. It asks when you start a run.', s === 'denied' ? 'Phone Settings, Apps, Velentis, Permissions, Location: set it to Allow, and turn on Precise.' : s === 'granted' ? '' : 'Choose Allow, and Precise, when it asks.'));
    }));
    var comp = typeof window.DeviceOrientationEvent !== 'undefined';
    R.push(item('Compass sensor', comp ? 'ok' : 'warn', comp ? 'Your phone reports a compass.' : 'No compass found.', comp ? 'If the map spins wrong, wave your phone in a figure 8 to calibrate.' : 'The map will still work, but it will not rotate with your phone.'));
    var vs = 0; try { vs = (window.speechSynthesis && window.speechSynthesis.getVoices().length) || 0; } catch (e) {}
    R.push(item('Voice', vs ? 'ok' : 'warn', vs ? vs + ' voices on this phone.' : 'No voices found.', vs ? '' : 'Hear it buttons need a text-to-speech voice. Add one in phone Settings, Language, Text-to-speech.'));
    try {
      var bytes = 0, i; for (i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); bytes += (k.length + (localStorage.getItem(k) || '').length) * 2; }
      var mb = bytes / 1048576; R.push(item('Storage used', mb > 4 ? 'warn' : 'ok', mb.toFixed(1) + ' MB of about 5 MB.', mb > 4 ? 'Getting full. Delete old cooking or wardrobe photos you do not need.' : ''));
    } catch (e) {}
    Promise.all(jobs).then(function () {
      var o = { bad: 0, warn: 1, ok: 2 }; R.sort(function (a, b) { return o[a.st] - o[b.st]; });
      running = false; render();
    });
  }

  function render() {
    var el = $('v-status'); if (!el) return;
    var good = R ? R.filter(function (x) { return x.st === 'ok'; }).length : 0, bad = R ? R.filter(function (x) { return x.st === 'bad'; }).length : 0, warn = R ? R.filter(function (x) { return x.st === 'warn'; }).length : 0;
    var head = running ? 'Checking...' : !R ? 'Press the button to check everything' : bad ? bad + ' thing' + (bad === 1 ? '' : 's') + ' to fix' : warn ? 'Working, with ' + warn + ' suggestion' + (warn === 1 ? '' : 's') : 'Everything works';
    var dot = { ok: '#3bb273', warn: '#e0a030', bad: '#d9534f' };
    el.innerHTML = bar(u.BACK_TOOLS, 'Status check') +
      '<div class="card hero"><span class="chip">' + ic('check') + '</span><h2>' + head + '</h2>' + (R && !running ? '<p>' + good + ' of ' + R.length + ' are green.</p>' : '') + '</div>' +
      '<button class="btn2 main" data-act="st-run"' + (running ? ' disabled' : '') + '>' + (running ? 'Checking...' : R ? 'Check again' : 'Check everything') + '</button>' +
      (R ? '<ul class="list" style="margin-top:12px">' + R.map(function (x) {
        return '<li class="card pad"><div style="display:flex;gap:10px;align-items:flex-start"><span style="width:12px;height:12px;border-radius:50%;background:' + dot[x.st] + ';margin-top:5px;flex:none" aria-label="' + x.st + '"></span><div style="min-width:0"><div class="nm"><b>' + esc(x.name) + '</b></div><div class="sub">' + esc(x.text) + '</div>' + (x.tip ? '<div class="note" style="margin-top:4px">' + esc(x.tip) + '</div>' : '') + '</div></div></li>';
      }).join('') + '</ul>' : '<p class="note" style="margin-top:12px">It tests your internet, server, backup, tables, map, location, compass and voice, then tells you what to do about anything that is not green.</p>');
  }
  V.registerTool('status', function () { render(); run(); });
  document.addEventListener('click', function (e) { var t = e.target.closest('[data-act="st-run"]'); if (t) run(); });
})();
