/* ══════════════════════════════════════════════════════════════
   OUT LOUD — shared lesson engine
   Teacher Nanda · American English only

   Every mechanic is wired automatically from markup.
   You never write JavaScript in a lesson file, and two lessons
   can never collide on a function name.

   USAGE in a lesson file, at the very end of <body>:
     <script src="../engine/outloud.js"></script>
     <script>OUTLOUD.init({
       level:'a1', code:'A1 · Mission 1 · Lesson 1',
       title:'This Is Me',
       url:'https://teacher-nanda.github.io/OUT-LOUD/A1-M1-L1/index.html'
     });</script>
   ══════════════════════════════════════════════════════════════ */

var OUTLOUD = (function () {
  'use strict';

  var slides = [], labels = [], current = 0, notesOpen = false, notesData = {}, cfg = {}, notesMoved = false;

  /* ─────────── helpers ─────────── */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function norm(s) {
    return (s || '').trim().toLowerCase()
      .replace(/[’ʼ']/g, "'")
      .replace(/[.,!?;:]+$/, '')
      .replace(/\s+/g, ' ');
  }
  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function ex(el) { return el.closest('[data-ex]'); }

  /* ─────────── speech (American English) ─────────── */
  var voice = null, voicesReady = false;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    var vs = speechSynthesis.getVoices();
    if (!vs.length) return;
    var pref = ['Google US English', 'Samantha', 'Microsoft Aria', 'Microsoft Jenny', 'Alex'];
    for (var i = 0; i < pref.length; i++) {
      var m = vs.filter(function (v) { return v.name.indexOf(pref[i]) === 0; })[0];
      if (m) { voice = m; voicesReady = true; return; }
    }
    voice = vs.filter(function (v) { return v.lang === 'en-US'; })[0] ||
            vs.filter(function (v) { return /^en/.test(v.lang); })[0] || null;
    voicesReady = true;
  }
  function say(text, rate) {
    if (!window.speechSynthesis) return;
    if (!voicesReady) pickVoice();
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = rate || 0.92;
    u.pitch = 1;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  }
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  /* Build 🔊 buttons + IPA links from markup:
       <span data-say="I'm from Brazil.">…</span>
       <i data-ipa="aɪm"></i>
       <span data-say="think" data-slow>…</span>            */
  function wireSpeech(root) {
    $$('[data-say]', root).forEach(function (el) {
      if (el.dataset.wired) return;
      el.dataset.wired = '1';
      var b = document.createElement('button');
      b.className = 'say' + (el.hasAttribute('data-say-big') ? ' big' : '');
      b.type = 'button';
      b.textContent = '🔊';
      b.title = 'Listen (American English)';
      b.onclick = function (e) {
        e.stopPropagation();
        say(el.getAttribute('data-say'), el.hasAttribute('data-slow') ? 0.62 : 0.92);
      };
      el.appendChild(b);
    });
    $$('[data-ipa]', root).forEach(function (el) {
      if (el.dataset.wired) return;
      el.dataset.wired = '1';
      var a = document.createElement('a');
      a.className = 'ipa';
      a.href = 'https://tophonetics.com/#';
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = el.getAttribute('data-ipa');
      a.title = 'Open tophonetics';
      el.appendChild(a);
    });
  }

  /* ─────────── generic Check / Reset / Answer key ─────────── */
  function gradeGaps(box) {
    $$('.gap', box).forEach(function (inp) {
      inp.classList.remove('correct', 'wrong', 'empty');
      var v = norm(inp.value);
      if (!v) { inp.classList.add('empty'); return; }
      var ok = v === norm(inp.dataset.ans);
      if (!ok && inp.dataset.alt) {
        ok = inp.dataset.alt.split('|').some(function (a) { return norm(a) === v; });
      }
      inp.classList.add(ok ? 'correct' : 'wrong');
    });
  }
  function resetBox(box) {
    $$('.gap', box).forEach(function (i) { i.value = ''; i.classList.remove('correct', 'wrong', 'empty'); });
    $$('.bigbox,.line,.esc-in,.auc-bet', box).forEach(function (i) { i.value = ''; });
    $$('.mt-item', box).forEach(function (i) {
      i.className = 'mt-item'; delete i.dataset.pair;
    });
    $$('.tile', box).forEach(function (t) { t.className = 'tile'; });
    $$('.flip', box).forEach(function (f) { f.classList.remove('open'); });
    $$('.chip', box).forEach(function (c) { c.classList.remove('used'); });
    $$('.day', box).forEach(function (d) { d.classList.remove('done'); });
    $$('.star', box).forEach(function (s) { s.classList.remove('on'); });
    $$('.auc-row', box).forEach(function (r) {
      r.classList.remove('ok', 'no');
      $$('.auc-btn', r).forEach(function (b) { b.classList.remove('on'); });
    });
    $$('.key', box).forEach(function (k) { k.classList.remove('show'); });
    if (box.dataset.ex === 'surgery') buildSurgery(box);
    if (box.dataset.ex === 'memory') buildMemory(box);
    if (box.dataset.ex === 'btc') btcReset(box);
    if (box.dataset.ex === 'escalator') buildEscalator(box);
    if (box.dataset.ex === 'sort') resetSort(box);
    if (box.dataset.ex === 'auction') resetAuction(box);
  }

  /* ─────────── matching ─────────── */
  var mtSel = null;
  function wireMatch(box) {
    var lefts = $$('[data-side="l"] .mt-item', box);
    var rights = $$('[data-side="r"] .mt-item', box);
    lefts.forEach(function (el) {
      el.onclick = function () {
        lefts.forEach(function (x) { x.classList.remove('sel'); });
        el.classList.add('sel'); mtSel = el;
      };
    });
    rights.forEach(function (el) {
      el.onclick = function () {
        if (!mtSel) return;
        var n = (box.dataset.n = String(+(box.dataset.n || 0) + 1));
        var c = 'p' + ((+n - 1) % 6);
        ['p0','p1','p2','p3','p4','p5','sel'].forEach(function (k) {
          mtSel.classList.remove(k); el.classList.remove(k);
        });
        mtSel.classList.add(c); el.classList.add(c);
        mtSel.dataset.pair = c; el.dataset.pair = c;
        mtSel = null;
      };
    });
  }
  function checkMatch(box) {
    var lefts = $$('[data-side="l"] .mt-item', box);
    var rights = $$('[data-side="r"] .mt-item', box);
    lefts.forEach(function (L) {
      if (!L.dataset.pair) return;
      var R = rights.filter(function (r) { return r.dataset.pair === L.dataset.pair; })[0];
      if (!R) return;
      var ok = L.dataset.k === R.dataset.k;
      L.classList.add(ok ? 'ok' : 'no'); R.classList.add(ok ? 'ok' : 'no');
    });
  }

  /* ─────────── flip cards ─────────── */
  function wireFlip(box) {
    $$('.flip', box).forEach(function (f) {
      f.onclick = function () {
        f.classList.toggle('open');
        /* no automatic audio — the teacher speaks, or clicks a 🔊 icon */
      };
    });
  }

  /* ─────────── Beat the Clock ─────────── */
  function wireBtc(box) {
    box._t = null; box._left = +(box.dataset.seconds || 60); box._n = 0; box._best = 0;
    $('.btc-tap', box).onclick = function () {
      box._n++; $('.btc-count', box).textContent = box._n;
    };
    $('[data-btc-start]', box).onclick = function () { btcStart(box); };
  }
  function btcStart(box) {
    btcReset(box);
    $('.btc-tap', box).disabled = false;
    var total = +(box.dataset.seconds || 60);
    box._t = setInterval(function () {
      box._left--;
      $('.btc-time', box).textContent = box._left;
      $('.btc-fill', box).style.width = (box._left / total * 100) + '%';
      if (box._left <= 0) {
        clearInterval(box._t); box._t = null;
        $('.btc-tap', box).disabled = true;
        var b = $('.btc-best', box);
        if (box._n > box._best) { box._best = box._n; b.textContent = '🏆 New personal best: ' + box._n + '!'; }
        else b.textContent = 'Personal best: ' + box._best;
      }
    }, 1000);
  }
  function btcReset(box) {
    clearInterval(box._t); box._t = null;
    box._left = +(box.dataset.seconds || 60); box._n = 0;
    $('.btc-time', box).textContent = box._left;
    $('.btc-count', box).textContent = '0';
    $('.btc-fill', box).style.width = '100%';
    $('.btc-tap', box).disabled = true;
  }

  /* ─────────── Sentence Surgery ─────────── */
  function buildSurgery(box) {
    $$('.surg', box).forEach(function (s) {
      delete s.dataset.healed;
      var bad = $('[data-bad]', s);
      if (bad && bad.dataset.orig) bad.textContent = bad.dataset.orig;
      $$('.sw', s).forEach(function (w) {
        if (!w.dataset.orig) w.dataset.orig = w.textContent;
        w.classList.remove('picked', 'healed', 'miss');
        w.onclick = function () { surgPick(s, w); };
      });
      $('.cures', s).classList.remove('show');
      $$('.cure', s).forEach(function (c) { c.onclick = function () { surgCure(box, s, c); }; });
    });
    var v = $('.vitals-f', box); if (v) v.style.width = '0%';
    box._done = 0;
  }
  function surgPick(s, w) {
    if (s.dataset.healed) return;
    if (!w.hasAttribute('data-bad')) {
      w.classList.add('miss');
      setTimeout(function () { w.classList.remove('miss'); }, 650);
      return;
    }
    $$('.sw', s).forEach(function (x) { x.classList.remove('picked'); });
    w.classList.add('picked');
    $('.cures', s).classList.add('show');
  }
  function surgCure(box, s, c) {
    if (s.dataset.healed) return;
    if (!c.hasAttribute('data-ok')) {
      c.classList.add('no');
      setTimeout(function () { c.classList.remove('no'); }, 650);
      return;
    }
    var bad = $('[data-bad]', s);
    bad.textContent = c.textContent;
    bad.classList.remove('picked'); bad.classList.add('healed');
    $('.cures', s).classList.remove('show');
    s.dataset.healed = '1';
    box._done = (box._done || 0) + 1;
    var total = $$('.surg', box).length;
    var v = $('.vitals-f', box); if (v) v.style.width = (box._done / total * 100) + '%';
    /* no automatic audio on heal — the teacher reads the corrected sentence */
  }

  /* ─────────── Escalator ─────────── */
  function buildEscalator(box) {
    var steps = $$('.esc-step', box);
    box._step = 1;
    steps.forEach(function (s, i) { s.classList.toggle('live', i === 0); });
    $$('.esc-in', box).forEach(function (i) { i.value = ''; i.oninput = function () { escCount(box); }; });
    var btn = $('[data-esc-next]', box);
    if (btn) {
      btn.textContent = '↓ Next step';
      btn.onclick = function () {
        if (box._step >= steps.length) return;
        box._step++;
        steps[box._step - 1].classList.add('live');
        steps[box._step - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        if (box._step === steps.length) btn.textContent = '✓ Top of the escalator';
        escCount(box);
      };
    }
    escCount(box);
  }
  function wc(s) { return (s || '').trim().split(/\s+/).filter(function (w) { return w.length; }).length; }
  function escCount(box) {
    var ins = $$('.esc-in', box);
    var first = wc(ins[0] && ins[0].value), last = 0;
    for (var i = ins.length - 1; i >= 0; i--) {
      if (ins[i].value && ins[i].value.trim()) { last = wc(ins[i].value); break; }
    }
    var a = $('[data-esc-start]', box), b = $('[data-esc-words]', box), c = $('[data-esc-grow]', box);
    if (a) a.textContent = first;
    if (b) b.textContent = last;
    if (c) c.textContent = (first > 0 ? (last / first).toFixed(1) : '0') + '×';
  }

  /* ─────────── Memory match ─────────── */
  function buildMemory(box) {
    var grid = $('.mem', box);
    if (!box._cards) {
      box._cards = $$('.mem-c', grid).map(function (c) {
        return { pair: c.dataset.pair, text: c.textContent.trim(), say: c.getAttribute('data-say-word') || '' };
      });
    }
    grid.innerHTML = '';
    box._open = []; box._lock = false;
    shuffle(box._cards.slice()).forEach(function (d) {
      var el = document.createElement('div');
      el.className = 'mem-c'; el.textContent = '?';
      el.dataset.pair = d.pair; el.dataset.text = d.text;
      if (d.say) el.dataset.sayWord = d.say;
      el.onclick = function () { memFlip(box, el); };
      grid.appendChild(el);
    });
  }
  function memFlip(box, el) {
    if (box._lock || el.classList.contains('up') || el.classList.contains('done')) return;
    el.classList.add('up'); el.textContent = el.dataset.text;
    box._open.push(el);
    if (box._open.length < 2) return;
    box._lock = true;
    var a = box._open[0], b = box._open[1];
    if (a.dataset.pair === b.dataset.pair && a !== b) {
      setTimeout(function () {
        a.classList.remove('up'); b.classList.remove('up');
        a.classList.add('done'); b.classList.add('done');
        box._open = []; box._lock = false;
      }, 420);
    } else {
      setTimeout(function () {
        a.classList.remove('up'); a.textContent = '?';
        b.classList.remove('up'); b.textContent = '?';
        box._open = []; box._lock = false;
      }, 900);
    }
  }

  /* ─────────── Sort into columns ─────────── */
  function homeTile(t) { var bank = t.closest('[data-ex]') && $('.sortbank', t.closest('[data-ex]')); if (bank) bank.appendChild(t); }
  function wireSort(box) {
    box._sel = null;
    $$('.tile', box).forEach(function (t) {
      if (!t.dataset.home) t.dataset.home = '1';
      t.onclick = function () {
        $$('.tile', box).forEach(function (x) { x.classList.remove('sel'); });
        t.classList.add('sel'); box._sel = t;
        /* no automatic audio on select — teacher speaks, or clicks a 🔊 icon */
      };
    });
    $$('.sortcol', box).forEach(function (col) {
      col.onclick = function () {
        if (!box._sel) return;
        col.appendChild(box._sel);
        box._sel.classList.remove('sel');
        box._sel = null;
      };
    });
  }
  function checkSort(box) {
    $$('.sortcol', box).forEach(function (col) {
      $$('.tile', col).forEach(function (t) {
        t.classList.remove('ok', 'no');
        t.classList.add(t.dataset.col === col.dataset.col ? 'ok' : 'no');
      });
    });
  }
  function resetSort(box) {
    var bank = $('.sortbank', box);
    $$('.sortcol .tile', box).forEach(function (t) { t.classList.remove('ok', 'no', 'sel'); bank.appendChild(t); });
    $$('.tile', box).forEach(function (t) { t.classList.remove('ok', 'no', 'sel'); });
    box._sel = null;
  }

  /* ─────────── Word order chips ─────────── */
  function wireChips(box) {
    $$('.chip', box).forEach(function (c) {
      c.onclick = function () { c.classList.toggle('used'); };
    });
  }

  /* ─────────── Word Auction ─────────── */
  function wireAuction(box) {
    $$('.auc-btn', box).forEach(function (b) {
      b.onclick = function () {
        var row = b.closest('.auc-row');
        $$('.auc-btn', row).forEach(function (x) { x.classList.remove('on'); });
        b.classList.add('on');
      };
    });
  }
  function checkAuction(box) {
    var start = +(box.dataset.points || 100), total = start;
    $$('.auc-row', box).forEach(function (row) {
      row.classList.remove('ok', 'no');
      var chosen = $('.auc-btn.on', row);
      var bet = Math.max(0, Math.min(start, +($('.auc-bet', row).value || 0)));
      if (!chosen || !bet) return;
      var ok = chosen.dataset.v === row.dataset.correct;
      row.classList.add(ok ? 'ok' : 'no');
      total += ok ? bet : -bet;
    });
    var out = $('[data-auc-total]', box);
    if (out) out.textContent = total;
  }
  function resetAuction(box) {
    var out = $('[data-auc-total]', box);
    if (out) out.textContent = box.dataset.points || 100;
  }

  /* ─────────── Dice ─────────── */
  var faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  function wireDice(box) {
    var prompts = $$('[data-face]', box).map(function (p) { return p.textContent.trim(); });
    $('[data-dice-roll]', box).onclick = function () {
      var f = $('.die', box), out = $('.dice-p', box), n = 0, r = 0;
      var t = setInterval(function () {
        n = Math.floor(Math.random() * 6);
        f.textContent = faces[n];
        if (++r > 10) { clearInterval(t); out.textContent = prompts[n] || ''; }
      }, 80);
    };
  }

  /* ─────────── Can-do self check ─────────── */
  function wireStars(box) {
    $$('.stars', box).forEach(function (row) {
      $$('.star', row).forEach(function (s, i) {
        s.onclick = function () {
          $$('.star', row).forEach(function (x, j) { x.classList.toggle('on', j <= i); });
        };
      });
    });
  }

  /* ─────────── Streak days ─────────── */
  function wireDays(box) {
    $$('.day', box).forEach(function (d) { d.onclick = function () { d.classList.toggle('done'); }; });
  }

  /* ─────────── Recorder ─────────── */
  function wireRecorder(box) {
    var rec = null, chunks = [], stream = null, timer = null, secs = 0;
    var dot = $('.rec-dot', box), tEl = $('.rec-t', box), note = $('.rec-note', box);
    var startB = $('[data-rec-start]', box), stopB = $('[data-rec-stop]', box);
    var maxs = +(box.dataset.max || 90);

    startB.onclick = function () {
      if (!navigator.mediaDevices || !window.MediaRecorder) {
        note.textContent = 'This browser cannot record. Use Chrome or Edge, and open the lesson over https.';
        return;
      }
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) {
        stream = s; chunks = []; secs = 0;
        rec = new MediaRecorder(s);
        rec.ondataavailable = function (e) { if (e.data.size > 0) chunks.push(e.data); };
        rec.onstop = function () {
          var blob = new Blob(chunks, { type: 'audio/webm' });
          $('audio', box).src = URL.createObjectURL(blob);
          $('.rec-play', box).classList.add('show');
          if (stream) stream.getTracks().forEach(function (t) { t.stop(); });
        };
        rec.start();
        dot.classList.add('on');
        startB.disabled = true; stopB.disabled = false;
        note.textContent = 'Recording… keep going. Do not stop to correct yourself.';
        timer = setInterval(function () {
          secs++;
          var m = Math.floor(secs / 60), ss = secs % 60;
          tEl.textContent = m + ':' + (ss < 10 ? '0' : '') + ss;
          if (secs >= maxs) stopB.onclick();
        }, 1000);
      }).catch(function () {
        note.textContent = 'Microphone permission was refused. Allow the microphone and try again.';
      });
    };
    stopB.onclick = function () {
      if (rec && rec.state !== 'inactive') rec.stop();
      clearInterval(timer); timer = null;
      dot.classList.remove('on');
      startB.disabled = false; stopB.disabled = true;
      note.textContent = 'Saved in this page. Right-click the player and choose Save audio as…';
    };
  }

  /* ─────────── Copy button ─────────── */
  function wireCopy(root) {
    $$('[data-copy]', root).forEach(function (b) {
      b.onclick = function () {
        var src = $('#' + b.getAttribute('data-copy'));
        if (!src) return;
        var text = src.innerText, old = b.textContent;
        function done() { b.textContent = '✓ Copied!'; setTimeout(function () { b.textContent = old; }, 1800); }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
        } else fallback(text, done);
      };
    });
    function fallback(t, cb) {
      var ta = document.createElement('textarea');
      ta.value = t; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); cb(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  /* ─────────── wire every exercise on the page ─────────── */
  function wireAll() {
    $$('[data-ex]').forEach(function (box) {
      switch (box.dataset.ex) {
        case 'match': wireMatch(box); break;
        case 'flip': wireFlip(box); break;
        case 'btc': wireBtc(box); btcReset(box); break;
        case 'surgery': buildSurgery(box); break;
        case 'escalator': buildEscalator(box); break;
        case 'memory': buildMemory(box); break;
        case 'sort': wireSort(box); break;
        case 'wordorder': wireChips(box); break;
        case 'auction': wireAuction(box); resetAuction(box); break;
        case 'dice': wireDice(box); break;
        case 'candocheck': wireStars(box); break;
        case 'streak': wireDays(box); break;
        case 'recorder': wireRecorder(box); break;
      }
    });
    /* generic buttons, always scoped to their own exercise */
    $$('[data-check]').forEach(function (b) {
      b.onclick = function () {
        var box = ex(b); if (!box) return;
        if (box.dataset.ex === 'match') checkMatch(box);
        else if (box.dataset.ex === 'sort') checkSort(box);
        else if (box.dataset.ex === 'auction') checkAuction(box);
        else gradeGaps(box);
      };
    });
    $$('[data-reset]').forEach(function (b) {
      b.onclick = function () { var box = ex(b); if (box) resetBox(box); };
    });
    $$('[data-key]').forEach(function (b) {
      b.onclick = function () {
        var box = ex(b) || document;
        var k = $('.key', box); if (!k) return;
        k.classList.toggle('show');
        b.textContent = k.classList.contains('show') ? '🔒 Hide Answer Key' : '🔑 Show Answer Key';
      };
    });
    wireSpeech(document);
    wireCopy(document);
  }

  /* ─────────── navigation ─────────── */
  function goTo(n) {
    if (n < 0 || n >= slides.length) return;
    saveNotes();
    slides[current].classList.remove('active');
    current = n;
    slides[current].classList.add('active');
    var dots = $$('#dots .dot');
    dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
    $('#counter').textContent = (current + 1) + ' / ' + slides.length;
    $('#prevBtn').disabled = current === 0;
    $('#nextBtn').disabled = current === slides.length - 1;
    $('#homeBtn').style.display = current === 0 ? 'none' : 'flex';
    if (window.speechSynthesis) speechSynthesis.cancel();
    loadNotes(current);
  }

  /* ─────────── notes ─────────── */
  function toggleNotes() {
    notesOpen = !notesOpen;
    $('#notesPanel').classList.toggle('open', notesOpen);
    $('#notesBtn').textContent = notesOpen ? '✕ Close' : '📝 Notes';
  }

  /* Drag the notes panel anywhere on screen, by its toolbar.
     Position is kept for the whole lesson, across every slide.
     Double-click the toolbar to snap it back to the top right. */
  function makeNotesDraggable() {
    var panel = $('#notesPanel'), handle = $('#notesToolbar');
    var startX = 0, startY = 0, originX = 0, originY = 0, dragging = false;

    handle.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;      /* let toolbar buttons work */
      var r = panel.getBoundingClientRect();
      panel.style.left = r.left + 'px';
      panel.style.top = r.top + 'px';
      panel.style.right = 'auto';
      startX = e.clientX; startY = e.clientY;
      originX = r.left; originY = r.top;
      dragging = true; notesMoved = true;
      panel.classList.add('dragging');
      handle.classList.add('grabbing');
      try { handle.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });

    handle.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var w = panel.offsetWidth, h = panel.offsetHeight;
      var x = Math.min(Math.max(0, originX + e.clientX - startX), Math.max(0, window.innerWidth - w));
      var y = Math.min(Math.max(0, originY + e.clientY - startY), Math.max(0, window.innerHeight - h));
      panel.style.left = x + 'px';
      panel.style.top = y + 'px';
    });

    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      panel.classList.remove('dragging');
      handle.classList.remove('grabbing');
      try { handle.releasePointerCapture(e.pointerId); } catch (err) {}
    }
    handle.addEventListener('pointerup', endDrag);
    handle.addEventListener('pointercancel', endDrag);

    handle.addEventListener('dblclick', function (e) {
      if (e.target.closest('button')) return;
      resetNotesPosition();
    });

    /* keep it on screen if the window is resized mid-lesson */
    window.addEventListener('resize', function () {
      if (!notesMoved) return;
      var w = panel.offsetWidth, h = panel.offsetHeight;
      var x = Math.min(parseInt(panel.style.left, 10) || 0, Math.max(0, window.innerWidth - w));
      var y = Math.min(parseInt(panel.style.top, 10) || 0, Math.max(0, window.innerHeight - h));
      panel.style.left = Math.max(0, x) + 'px';
      panel.style.top = Math.max(0, y) + 'px';
    });
  }

  function resetNotesPosition() {
    var panel = $('#notesPanel');
    panel.style.left = ''; panel.style.top = ''; panel.style.right = '';
    panel.style.height = '';
    $('#notesTA').style.height = '';
    notesMoved = false;
  }
  function saveNotes() { var t = $('#notesTA'); if (t) notesData[current] = t.innerHTML; }
  function loadNotes(i) { var t = $('#notesTA'); if (t) t.innerHTML = notesData[i] || ''; }
  function notesFormat(cmd) { $('#notesTA').focus(); document.execCommand(cmd, false, null); saveNotes(); }
  function sameColor(a, b) {
    if (!a) return false;
    var m = a.match(/\d+/g);
    if (!m) return a.toLowerCase() === b.toLowerCase();
    var hex = '#' + m.slice(0, 3).map(function (x) {
      return ('0' + parseInt(x, 10).toString(16)).slice(-2);
    }).join('');
    return hex.toLowerCase() === b.toLowerCase();
  }
  function notesHilite(color) {
    var ta = $('#notesTA'); ta.focus();
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    if (color === 'remove') document.execCommand('hiliteColor', false, 'transparent');
    else {
      var cur = document.queryCommandValue('backColor');
      document.execCommand('hiliteColor', false, sameColor(cur, color) ? 'transparent' : color);
    }
    saveNotes();
  }

  /* ─────────── save notes / print ─────────── */
  function savePDF() {
    saveNotes();
    var any = false, html = '';
    slides.forEach(function (s, i) {
      var n = notesData[i] || '';
      if (n.replace(/<[^>]*>/g, '').trim()) {
        any = true;
        html += '<div class="nc"><div class="nh">' + (i + 1) + ' · ' + labels[i] + '</div><div class="nb">' + n + '</div></div>';
      }
    });
    if (!any) { alert('No notes to save yet!'); return; }
    var w = window.open('', '_blank');
    w.document.write('<html><head><title>Notes — ' + cfg.title + '</title><style>'
      + 'body{font-family:Segoe UI,Arial,sans-serif;padding:34px;color:#1C2B3A;max-width:820px;margin:0 auto}'
      + 'h1{font-size:23px;color:#231708;margin-bottom:4px}h2{font-size:13px;color:#8A7A6A;font-weight:400;margin-bottom:22px}'
      + '.nc{border:1px solid #E0D8CE;border-radius:9px;margin-bottom:14px;overflow:hidden}'
      + '.nh{background:#231708;color:#fff;padding:8px 14px;font-size:12px;font-weight:700}'
      + '.nb{padding:12px 16px;font-size:14px;line-height:1.6}</style></head><body>'
      + '<h1>OUT LOUD — ' + cfg.code + ' — ' + cfg.title + '</h1>'
      + '<h2>Lesson notes · ' + new Date().toLocaleDateString('en-US') + '</h2>'
      + html + '</body></html>');
    w.document.close();
    setTimeout(function () { w.print(); }, 400);
  }

  function printAll() {
    saveNotes();
    var injected = [];
    slides.forEach(function (slide, i) {
      if (i === 0) {
        var l = document.createElement('div');
        l.className = 'lesson-link-print';
        l.innerHTML = '<span class="lp-title">' + cfg.title + '</span>'
          + '<span class="lp-sub">Click here to access the lesson online: '
          + '<a href="' + cfg.url + '" target="_blank">' + cfg.url + '</a></span>';
        slide.insertBefore(l, slide.firstChild);
        injected.push(l);
      }
      var n = notesData[i] || '';
      if (n.replace(/<[^>]*>/g, '').trim()) {
        var d = document.createElement('div');
        d.className = 'slide-notes-print';
        d.innerHTML = '<div class="slide-notes-print-label">📝 Teacher Notes</div>' + n;
        slide.appendChild(d);
        injected.push(d);
      }
    });
    document.body.classList.add('print-all');
    window.print();
    setTimeout(function () {
      document.body.classList.remove('print-all');
      injected.forEach(function (el) { el.parentNode && el.parentNode.removeChild(el); });
    }, 1500);
  }

  /* ─────────── chrome builder ─────────── */
  function buildChrome() {
    var nb = document.createElement('button');
    nb.id = 'notesBtn'; nb.textContent = '📝 Notes'; nb.onclick = toggleNotes;
    document.body.appendChild(nb);

    var panel = document.createElement('div');
    panel.id = 'notesPanel';
    panel.innerHTML =
      '<div id="notesToolbar" title="Drag me anywhere · double-click to reset">'
      + '<span id="notesGrip">⠿</span>'
      + '<button title="Bold"><b>B</b></button><button title="Underline"><u>U</u></button>'
      + '<span style="display:flex;gap:3px;align-items:center;margin-left:6px;padding-left:6px;border-left:1px solid rgba(255,255,255,.2)">'
      + '<button data-h="#FFE600" title="Yellow" style="background:#FFE600;width:20px;height:20px;padding:0;border-radius:4px"></button>'
      + '<button data-h="#90EE90" title="Green" style="background:#90EE90;width:20px;height:20px;padding:0;border-radius:4px"></button>'
      + '<button data-h="#FFB3C6" title="Pink" style="background:#FFB3C6;width:20px;height:20px;padding:0;border-radius:4px"></button>'
      + '<button data-h="#ADD8E6" title="Blue" style="background:#ADD8E6;width:20px;height:20px;padding:0;border-radius:4px"></button>'
      + '<button data-h="remove" title="Remove highlight" style="font-size:.78rem;padding:2px 7px;color:#ff9999;margin-left:2px;background:rgba(255,255,255,.1)">✕</button>'
      + '</span><span id="notesHint">drag</span></div>'
      + '<div id="notesTA" contenteditable="true" data-placeholder="Your notes for this slide…" spellcheck="false"></div>';
    document.body.appendChild(panel);
    var tb = $$('#notesToolbar button');
    tb[0].onclick = function () { notesFormat('bold'); };
    tb[1].onclick = function () { notesFormat('underline'); };
    $$('#notesToolbar button[data-h]').forEach(function (b) {
      b.onclick = function () { notesHilite(b.getAttribute('data-h')); };
    });
    $('#notesTA').oninput = saveNotes;
    makeNotesDraggable();

    var hb = document.createElement('button');
    hb.id = 'homeBtn'; hb.textContent = '🏠'; hb.onclick = function () { goTo(0); };
    document.body.appendChild(hb);

    var nav = document.createElement('div');
    nav.id = 'nav';
    nav.innerHTML = '<button id="prevBtn">◀ Prev</button><div id="dots"></div>'
      + '<span id="counter"></span><button id="nextBtn">Next ▶</button>'
      + '<button class="util" id="saveNotesBtn" style="background:#2E2A6B">💾 Save Notes</button>'
      + '<button class="util" id="printBtn" style="background:#0E7A8A">🖨️ Print Lesson</button>';
    document.body.appendChild(nav);
    $('#prevBtn').onclick = function () { goTo(current - 1); };
    $('#nextBtn').onclick = function () { goTo(current + 1); };
    $('#saveNotesBtn').onclick = savePDF;
    $('#printBtn').onclick = printAll;

    var dots = $('#dots');
    slides.forEach(function (s, i) {
      var d = document.createElement('div');
      d.className = 'dot'; d.title = labels[i];
      d.onclick = function () { goTo(i); };
      dots.appendChild(d);
    });
  }

  /* ─────────── init ─────────── */
  function init(config) {
    cfg = config || {};
    if (cfg.level) document.body.classList.add('lv-' + cfg.level);

    slides = $$('#deck .slide');
    labels = slides.map(function (s, i) { return s.getAttribute('data-label') || ('Slide ' + (i + 1)); });
    slides.forEach(function (s) {
      s.setAttribute('data-print-header', 'OUT LOUD — ' + (cfg.code || '') + ' — ' + (cfg.title || ''));
    });

    buildChrome();
    wireAll();

    /* cover buttons */
    $$('[data-goto-hw]').forEach(function (b) {
      b.onclick = function () {
        var i = slides.map(function (s) { return s.id; }).indexOf('hw-cover');
        if (i >= 0) goTo(i);
      };
    });

    document.addEventListener('keydown', function (e) {
      var tag = document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement.contentEditable === 'true') return;
      if (e.key === 'ArrowRight') goTo(current + 1);
      if (e.key === 'ArrowLeft') goTo(current - 1);
    });

    slides.forEach(function (s) { s.classList.remove('active'); });
    current = 0;
    goTo(0);
    console.log('OUT LOUD · ' + slides.length + ' slides · ' + (cfg.title || ''));
  }

  return { init: init, goTo: goTo, say: say };
})();
