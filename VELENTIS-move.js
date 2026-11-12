/* Rep counter: the camera counts your reps. Pose model (loaded on demand) with a basic motion fallback. */
(function () {
  'use strict';
  var V = window.Velentis, u = V.u, $ = u.$, esc = u.esc, ic = u.ic, bar = u.bar;
  var MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  var MODEL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

  /* lo = bent, hi = straight (degrees at the joint). A rep is: straight, then bent, then straight again. */
  var EXS = {
    squat: { name: 'Squats', joints: [[23, 25, 27], [24, 26, 28]], lo: 105, hi: 160, tip: 'Stand sideways, 2 meters from the phone, so your whole body is in view.' },
    pushup: { name: 'Push-ups', joints: [[11, 13, 15], [12, 14, 16]], lo: 95, hi: 155, tip: 'Put the phone on the floor beside you, filming your side.' },
    curl: { name: 'Bicep curls', joints: [[11, 13, 15], [12, 14, 16]], lo: 60, hi: 150, tip: 'Face the phone with your upper body in view.' },
    jack: { name: 'Jumping jacks', jack: true, tip: 'Face the phone with your whole body in view.' },
    motion: { name: 'Any up and down move', motion: true, tip: 'Keep the phone still and stay in view. Works for most moves.' }
  };
  var ORDER = ['squat', 'pushup', 'curl', 'jack', 'motion'];

  function angle(a, b, c) {
    var x1 = a.x - b.x, y1 = a.y - b.y, x2 = c.x - b.x, y2 = c.y - b.y, m = Math.hypot(x1, y1) * Math.hypot(x2, y2);
    if (!m) return 180;
    return Math.acos(Math.max(-1, Math.min(1, (x1 * x2 + y1 * y2) / m))) * 180 / Math.PI;
  }
  /* pure counters: feed landmarks (or a motion value), get the rep total */
  function makeCounter(kind) {
    var ex = EXS[kind], reps = 0, state = 'wait', sm = null;
    var maxY = 0, minY = 1, dir = 0, started = false;
    return {
      reps: function () { return reps; },
      pose: function (lm) {
        if (!lm) return { ok: false };
        if (ex.jack) {
          var ls = lm[11], rs = lm[12], lw = lm[15], rw = lm[16], la = lm[27], ra = lm[28];
          if (!ls || !rs || !lw || !rw || !la || !ra) return { ok: false };
          var sw = Math.abs(ls.x - rs.x) || 0.1, open = lw.y < ls.y && rw.y < rs.y && Math.abs(la.x - ra.x) > sw * 1.4, closed = lw.y > ls.y && rw.y > rs.y && Math.abs(la.x - ra.x) < sw * 1.2;
          if (open && state === 'closed') { state = 'open'; }
          else if (closed) { if (state === 'open') reps++; state = 'closed'; }
          return { ok: true, reps: reps };
        }
        var best = null, bv = 0;
        ex.joints.forEach(function (j) {
          var p = [lm[j[0]], lm[j[1]], lm[j[2]]]; if (!p[0] || !p[1] || !p[2]) return;
          var v = (p[0].visibility || 0) + (p[1].visibility || 0) + (p[2].visibility || 0);
          if (v > bv) { bv = v; best = p; }
        });
        if (!best || bv < 1.5) return { ok: false };
        var a = angle(best[0], best[1], best[2]);
        sm = sm == null ? a : sm * 0.5 + a * 0.5;
        if (state === 'wait') { if (sm > ex.hi) state = 'up'; }
        else if (state === 'up') { if (sm < ex.lo) state = 'down'; }
        else if (state === 'down') { if (sm > ex.hi) { state = 'up'; reps++; } }
        return { ok: true, angle: Math.round(sm), reps: reps };
      },
      motion: function (y) {   /* y = vertical position of the moving part, 0 (top) to 1 (bottom) */
        if (!started) { started = true; maxY = minY = y; }
        if (dir >= 0) { if (y > maxY) maxY = y; if (maxY - y > 0.09) { dir = -1; minY = y; } }
        else { if (y < minY) minY = y; if (y - minY > 0.09) { dir = 1; maxY = y; reps++; } }
        return reps;
      }
    };
  }
  V.repCounter = makeCounter;   /* exposed so the counting rules can be tested */

  var S = { v: 'setup', kind: 'squat', back: false, status: '', reps: 0, saved: false };
  var stream = null, raf = 0, counter = null, landmarker = null, poseP = null, mode = 'pose', lastT = 0, prevGray = null, running = false, started = 0;

  function loadPose() {
    if (poseP) return poseP;
    var timeout = new Promise(function (_, rej) { setTimeout(function () { rej(new Error('slow')); }, 25000); });
    var load = import(MP + '/vision_bundle.mjs').then(function (m) {
      return m.FilesetResolver.forVisionTasks(MP + '/wasm').then(function (fs) {
        function make(delegate) { return m.PoseLandmarker.createFromOptions(fs, { baseOptions: { modelAssetPath: MODEL, delegate: delegate }, runningMode: 'VIDEO', numPoses: 1 }); }
        return make('GPU').catch(function () { return make('CPU'); });
      }).then(function (lm) { return { lm: lm, util: m.DrawingUtils }; });
    });
    poseP = Promise.race([load, timeout]);
    poseP.catch(function () { poseP = null; });
    return poseP;
  }

  function render() {
    var el = $('v-reps');
    if (S.v === 'live') {
      el.innerHTML = bar('data-act="rp-stop"', EXS[S.kind].name) +
        '<div class="cam"><video id="rpVideo" playsinline muted autoplay' + (S.back ? '' : ' class="mirror"') + '></video><canvas id="rpCanvas"' + (S.back ? '' : ' class="mirror"') + '></canvas><div class="rpcount" id="rpCount">' + S.reps + '</div></div>' +
        '<p class="note" id="rpStatus" style="text-align:center">' + esc(S.status) + '</p><button class="btn2 main" data-act="rp-stop">Finish</button>';
      return;
    }
    if (S.v === 'done') {
      el.innerHTML = bar('data-act="rp-again"', 'Result') +
        '<div class="card hero"><span class="chip">' + ic('check') + '</span><h2>' + S.reps + ' ' + (S.reps === 1 ? 'rep' : 'reps') + '</h2><p>' + esc(EXS[S.kind].name) + (S.mode === 'motion' ? ' (basic counting)' : '') + '</p></div>' +
        (S.saved ? '<p class="note" style="text-align:center">Saved to your workout log.</p>' : (S.reps > 0 ? '<button class="btn2 main" data-act="rp-save">Save to workout log</button>' : '')) +
        '<div class="duo"><button class="btn2" data-act="rp-again">Count again</button><button class="btn2" data-act="go" data-to="move">Workout log</button></div>';
      return;
    }
    el.innerHTML = bar(u.BACK_TOOLS, 'Rep counter') +
      '<div class="card pad"><div class="eyebrow">Pick a move</div><div class="chips" style="margin-top:10px">' + ORDER.map(function (k) { return '<button class="tag' + (S.kind === k ? ' on' : '') + '" data-act="rp-kind" data-id="' + k + '" aria-pressed="' + (S.kind === k) + '">' + EXS[k].name + '</button>'; }).join('') + '</div>' +
      '<p class="note" style="margin-top:12px">' + esc(EXS[S.kind].tip) + '</p></div>' +
      '<div class="card pad"><div class="eyebrow">Camera</div><div class="chips" style="margin-top:10px"><button class="tag' + (!S.back ? ' on' : '') + '" data-act="rp-cam" data-id="front">Front</button><button class="tag' + (S.back ? ' on' : '') + '" data-act="rp-cam" data-id="back">Back</button></div>' +
      '<p class="note" style="margin-top:10px">The video stays on your phone. Nothing is recorded or sent anywhere.</p></div>' +
      (S.status ? '<p class="note" style="text-align:center">' + esc(S.status) + '</p>' : '') +
      '<button class="btn2 main" data-act="rp-start">Start counting</button>';
  }
  function setStatus(t) { S.status = t; var e = $('rpStatus'); if (e) e.textContent = t; }

  function stopAll() {
    running = false; cancelAnimationFrame(raf);
    if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
    var v = $('rpVideo'); if (v) { try { v.srcObject = null; } catch (e) {} }
  }
  // Ask Android for camera permission first (shows the real popup). Plain browsers skip this.
  function askCamera() {
    var cap = window.Capacitor, cam = cap && cap.Plugins && cap.Plugins.Camera;
    if (!cam || !cam.requestPermissions) return Promise.resolve();
    return cam.requestPermissions({ permissions: ['camera'] }).then(function (r) {
      if (r && r.camera && r.camera !== 'granted') { var e = new Error('denied'); e.denied = true; throw e; }
    }, function () {});
  }
  function start() {
    S.status = 'Getting the camera ready...'; S.reps = 0; S.saved = false; S.v = 'live'; render();
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { S.v = 'setup'; S.status = 'This device cannot open the camera here.'; render(); return; }
    askCamera().then(function () { return navigator.mediaDevices.getUserMedia({ video: { facingMode: S.back ? 'environment' : 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false }); }).then(function (s) {
      stream = s;
      var v = $('rpVideo'); if (!v) { stopAll(); return; }
      v.srcObject = s; v.play().catch(function () {});
      counter = makeCounter(S.kind); mode = EXS[S.kind].motion ? 'motion' : 'pose'; prevGray = null; running = true; started = Date.now();
      if (mode === 'pose') {
        setStatus('Loading the movement model (first time needs internet)...');
        loadPose().then(function (r) { landmarker = r; setStatus('Step back so your body is in view.'); loop(); },
          function () { mode = 'motion'; setStatus('Using basic counting. Keep the phone still and stay in view.'); loop(); });
      } else { setStatus('Keep the phone still and start moving.'); loop(); }
    }).catch(function (err) {
      S.v = 'setup';
      S.status = err && err.denied ? 'Camera is blocked. Open your phone Settings, Apps, Velentis, Permissions, Camera, then choose Allow.' : 'The camera did not open. Close other apps using it and try again.';
      render();
    });
  }

  var small = document.createElement('canvas'); small.width = 48; small.height = 36;
  var sctx = small.getContext('2d', { willReadFrequently: true });
  function motionY(video) {
    sctx.drawImage(video, 0, 0, 48, 36);
    var d = sctx.getImageData(0, 0, 48, 36).data, g = new Uint8Array(48 * 36), i, sum = 0, wy = 0, n = 0;
    for (i = 0; i < g.length; i++) g[i] = (d[i * 4] * 3 + d[i * 4 + 1] * 6 + d[i * 4 + 2]) / 10;
    if (prevGray) {
      for (i = 0; i < g.length; i++) { if (Math.abs(g[i] - prevGray[i]) > 22) { n++; wy += Math.floor(i / 48); } }
    }
    prevGray = g;
    return n > 25 ? (wy / n) / 36 : -1;
  }
  var lastMotion = 0.5, lastDraw = 0;
  function loop() {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    var now = performance.now(); if (now - lastT < 66) return; lastT = now;
    var v = $('rpVideo'); if (!v || v.readyState < 2) return;
    var before = counter.reps();
    if (mode === 'pose' && landmarker) {
      var res; try { res = landmarker.lm.detectForVideo(v, now); } catch (e) { res = null; }
      var lm = res && res.landmarks && res.landmarks[0];
      var out = counter.pose(lm);
      var c = $('rpCanvas');
      if (c) {
        if (c.width !== v.videoWidth) { c.width = v.videoWidth || 640; c.height = v.videoHeight || 480; }
        var cx = c.getContext('2d'); cx.clearRect(0, 0, c.width, c.height);
        if (lm) { cx.fillStyle = '#7CE8D4'; lm.forEach(function (p, idx) { if (idx > 10 && (p.visibility || 0) > 0.5) { cx.beginPath(); cx.arc(p.x * c.width, p.y * c.height, 4, 0, 7); cx.fill(); } }); }
      }
      if (out.ok === false && lm === undefined) { /* keep status */ }
      else if (out.ok === false) setStatus('Step back so your whole body is in view.');
      else if (Date.now() - started > 1500) setStatus(EXS[S.kind].jack ? 'Counting' : 'Counting. Angle ' + out.angle + '°');
    } else if (mode === 'motion') {
      var y = motionY(v);
      if (y >= 0) { lastMotion = lastMotion * 0.6 + y * 0.4; counter.motion(lastMotion); }
    }
    var r = counter.reps();
    if (r !== before) { S.reps = r; var e = $('rpCount'); if (e) e.textContent = r; try { if (navigator.vibrate) navigator.vibrate(30); } catch (x) {} }
  }

  V.registerTool('reps', render);
  V.on('view.leave', function (name) { if (name === 'reps' && S.v === 'live') { stopAll(); S.v = 'setup'; S.status = ''; } });
  document.addEventListener('visibilitychange', function () { if (document.hidden && S.v === 'live') { S.mode = mode; S.reps = counter ? counter.reps() : 0; stopAll(); S.v = 'done'; if (V.view() === 'reps') render(); } });

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
    var a = t.getAttribute('data-act'), id = t.getAttribute('data-id');
    if (a.indexOf('rp-') !== 0) return;
    if (a === 'rp-kind') { S.kind = id; S.status = ''; }
    else if (a === 'rp-cam') { S.back = id === 'back'; }
    else if (a === 'rp-start') { start(); return; }
    else if (a === 'rp-stop') { S.mode = mode; S.reps = counter ? counter.reps() : S.reps; stopAll(); S.v = 'done'; }
    else if (a === 'rp-again') { S.v = 'setup'; S.status = ''; S.saved = false; }
    else if (a === 'rp-save' && !S.saved && S.reps > 0) {
      S.saved = true;
      if (V.fit) V.fit.addSet(EXS[S.kind].name, S.reps, 0, 0, 'camera');
      var units = Math.floor(S.reps / 5); if (units > 0) V.emit('reps.done', { ref: 'r' + u.uid(), units: units });
    }
    render();
  });
})();
