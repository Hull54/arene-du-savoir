// Sons rétro 8 bits, fabriqués au vol (aucun fichier audio).
const Son = (() => {
  let ac = null, muted = false;
  try { muted = localStorage.getItem('arene-muet') === '1'; } catch {}
  const ctx = () => { if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (A) ac = new A(); } if (ac && ac.state === 'suspended') ac.resume(); return ac; };
  // une note : fréquence de départ, d'arrivée, durée, forme d'onde, volume, délai
  function note(f1, f2, dur, type = 'square', vol = 0.08, at = 0) {
    const a = ctx(); if (!a) return;
    const t = a.currentTime + at, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f1, t); o.frequency.exponentialRampToValueAtTime(Math.max(30, f2), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function bruit(dur, vol = 0.06, at = 0) {
    const a = ctx(); if (!a) return;
    const n = Math.floor(a.sampleRate * dur), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; g.gain.value = vol;
    s.connect(g).connect(a.destination); s.start(a.currentTime + at);
  }
  const SONS = {
    atk: () => bruit(0.07, 0.05),
    tir: () => note(900, 300, 0.09, 'square', 0.04),
    feu: () => { note(200, 80, 0.2, 'sawtooth', 0.05); bruit(0.15, 0.03); },
    touche: () => note(300, 120, 0.1, 'square', 0.06),
    ko: () => { note(500, 60, 0.5, 'square', 0.07); },
    retour: () => [523, 659, 784, 1047].forEach((f, i) => note(f, f, 0.09, 'square', 0.05, i * 0.07)),
    bon: () => { note(784, 784, 0.08, 'square', 0.06); note(1175, 1175, 0.14, 'square', 0.06, 0.08); },
    faux: () => note(180, 110, 0.35, 'sawtooth', 0.06),
    coffre: () => [392, 523, 659, 784, 1047].forEach((f, i) => note(f, f, 0.08, 'triangle', 0.08, i * 0.06)),
    objet: () => { note(1047, 1568, 0.12, 'square', 0.05); note(1568, 2093, 0.12, 'square', 0.04, 0.1); },
    serie: () => [659, 784, 988, 1319].forEach((f, i) => note(f, f, 0.1, 'square', 0.06, i * 0.08)),
    eclair: () => { note(1400, 700, 0.12, 'square', 0.06); note(1400, 700, 0.12, 'square', 0.06, 0.16); },
    boom: () => { bruit(0.4, 0.08); note(120, 40, 0.4, 'sawtooth', 0.06); },
    dash: () => { bruit(0.12, 0.04); note(300, 600, 0.1, 'triangle', 0.04); },
    tp: () => { note(400, 1600, 0.18, 'sine', 0.06); note(1600, 800, 0.12, 'sine', 0.04, 0.12); },
    boss: () => note(90, 50, 0.4, 'sawtooth', 0.08),
    miaou: () => { note(700, 1000, 0.12, 'triangle', 0.06); note(1000, 600, 0.2, 'triangle', 0.06, 0.12); },
    ouaf: () => { note(260, 140, 0.12, 'square', 0.07); note(260, 140, 0.12, 'square', 0.07, 0.18); },
    hibou: () => { note(500, 420, 0.25, 'sine', 0.08); note(500, 400, 0.35, 'sine', 0.08, 0.3); },
    slime: () => { note(150, 500, 0.15, 'sine', 0.08); bruit(0.1, 0.03, 0.05); },
    fin: () => [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => note(f, f, i === 7 ? 0.5 : 0.12, 'square', 0.06, [0, .14, .28, .42, .62, .82, .96, 1.12][i])),
  };
  // ----- Musique de fond : un petit air 8 bits par type de carte (chiffres = notes de la gamme, point = silence) -----
  const pad = t => (t + '.'.repeat(32)).slice(0, 32);
  const MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
  const AIRS = {
    village: { bpm: 116, root: 60, sc: [0, 2, 4, 7, 9], w: 'square', mel: ['5.6.7.9.8.7.6...5.6.7.5.6.4.5...', '7.8.9.8.7.6.5...6.5.4.3.4.6.5...'], bass: [0, 0, -3, -3, -7, -7, -5, -5, 0, 0, -3, -3, -7, -5, 0, 0] },
    foret: { bpm: 100, root: 62, sc: [0, 2, 3, 5, 7, 9, 10], w: 'triangle', mel: ['7.9.a.9.7...5.7.9...7.5.4.5....', '9.a.b.a.9.7.9...a.9.7.5.7......'], bass: [0, 0, -2, -2, -4, -4, -2, -2, 0, 0, 3, 3, -2, -2, 0, 0] },
    desert: { bpm: 96, root: 57, sc: [0, 1, 4, 5, 7, 8, 10], w: 'square', mel: ['7.8.7.5.4.5.7...8.a.8.7.5.4.5...', '4.5.7.8.7.5.4.1.0.1.4.5.4.......'], bass: [0, 0, 0, 0, 1, 1, 0, 0, 0, 0, -2, -2, 1, 1, 0, 0] },
    donjon: { bpm: 80, root: 57, sc: MIN, w: 'triangle', mel: ['7...8.7.5...4.3.4...5.4.3.2.0...', '7...9.a.9.7.8.7.5.4...3.4.5.....'], bass: [0, 0, -4, -4, -2, -2, -5, -5, 0, 0, -4, -4, -5, -5, 0, 0], calme: 1 },
    hiver: { bpm: 92, root: 65, sc: MAJ, w: 'sine', mel: ['7.9.b.e.b.9.7...8.9.a.9.7.5.7...', '9.a.b.a.9.8.7...4.5.7.9.8.7.....'], bass: [0, 0, -3, -3, -7, -7, -5, -5, 0, 0, -3, -3, -5, -5, 0, 0], calme: 1 },
    cite: { bpm: 120, root: 55, sc: MAJ, w: 'square', mel: ['7.7.9.b.a.9.7...8.8.a.c.b.a.9...', 'b.a.9.8.7.9.7.5.4.5.7.8.7.......'], bass: [0, 0, -7, -7, -3, -3, -5, -5, 0, 0, -7, -7, -5, -5, 0, 0] },
    colisee: { bpm: 132, root: 62, sc: MIN, w: 'square', mel: ['7.7.a.7.9.7.8.7.7.7.b.a.9.8.7...', 'a.b.c.b.a.9.8.9.a.9.8.7.5.7.....'], bass: [0, 0, -2, -2, -4, -4, -5, -5, 0, 0, -2, -2, -5, -5, 0, 0] },
    marais: { bpm: 88, root: 52, sc: [0, 3, 5, 7, 10], w: 'triangle', mel: ['5...6.7...8.7.6.5...3.5...6....', '8...9.8.7.6...5.6.7.5.3........'], bass: [0, 0, 0, 0, -4, -4, -2, -2, 0, 0, 0, 0, -5, -5, 0, 0], calme: 1 },
  };
  let musOn = false, air = null, pas = 0, prochain = 0, boucle = null, musGain = null;
  try { musOn = localStorage.getItem('arene-musique') === '1'; } catch {}
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function ton(m, dur, type, vol, t) {
    const a = ac, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(hz(m), t);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(musGain); o.start(t); o.stop(t + dur + 0.02);
  }
  function jouer() {
    const a = ctx(); if (!a || !air) return;
    if (!musGain) { musGain = a.createGain(); musGain.gain.value = 0.55; musGain.connect(a.destination); }
    musGain.gain.value = muted ? 0 : 0.55;
    const st = 60 / air.bpm / 2, L = air.sc.length, mel = pad(air.mel[0]) + pad(air.mel[1]);
    if (prochain < a.currentTime) prochain = a.currentTime + 0.05;
    while (prochain < a.currentTime + 0.3) {
      const i = pas % 64, ch = mel[i];
      if (ch !== '.') { const d = parseInt(ch, 36); ton(air.root + air.sc[d % L] + 12 * Math.floor(d / L), st * 0.9, air.w, air.w === 'sine' ? 0.05 : 0.028, prochain); }
      if (i % 4 === 0) ton(air.root - 24 + air.bass[i / 4], st * 3.6, 'triangle', 0.07, prochain);
      prochain += st; pas++;
    }
  }
  function majMusique() {
    if (musOn && air && !boucle) { pas = 0; prochain = 0; boucle = setInterval(jouer, 100); jouer(); }
    else if ((!musOn || !air) && boucle) { clearInterval(boucle); boucle = null; }
  }
  return {
    musique(theme) { const n = AIRS[theme] || AIRS.village; if (n !== air) { air = n; pas = 0; } majMusique(); },
    get musOn() { return musOn; },
    toggleMusique(save = true) { musOn = !musOn; if (save) try { localStorage.setItem('arene-musique', musOn ? '1' : '0'); } catch {} majMusique(); return musOn; },
    play(n) { if (!muted && SONS[n]) try { SONS[n](); } catch {} },
    get muted() { return muted; },
    toggle() { muted = !muted; try { localStorage.setItem('arene-muet', muted ? '1' : '0'); } catch {} if (!muted) ctx(); return muted; },
    unlock() { if (!muted) ctx(); },
  };
})();
