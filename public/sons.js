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
    fin: () => [523, 523, 523, 659, 784, 659, 784, 1047].forEach((f, i) => note(f, f, i === 7 ? 0.5 : 0.12, 'square', 0.06, [0, .14, .28, .42, .62, .82, .96, 1.12][i])),
  };
  return {
    play(n) { if (!muted && SONS[n]) try { SONS[n](); } catch {} },
    get muted() { return muted; },
    toggle() { muted = !muted; try { localStorage.setItem('arene-muet', muted ? '1' : '0'); } catch {} if (!muted) ctx(); return muted; },
    unlock() { if (!muted) ctx(); },
  };
})();
