// Déplacement des héros, partagé par le serveur et le navigateur.
// Le navigateur fait bouger son propre héros tout de suite (prédiction) avec exactement les mêmes règles,
// puis le serveur le corrige doucement s'il y a une différence.
(function (exp) {
  const MARGE = 48, GRILLES = new WeakMap();
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Objets de chaque carte rangés par tuile : un test de collision ne regarde que les objets voisins
  function grilleObjs(c) {
    let g = GRILLES.get(c);
    if (g) return g;
    g = Array.from({ length: c.cols * c.rows }, () => []);
    for (const o of c.objs) {
      const i0 = Math.max(0, Math.floor((o.x - MARGE) / c.T)), i1 = Math.min(c.cols - 1, Math.floor((o.x + o.w + MARGE) / c.T));
      const j0 = Math.max(0, Math.floor((o.y - MARGE) / c.T)), j1 = Math.min(c.rows - 1, Math.floor((o.y + o.h + MARGE) / c.T));
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) g[j * c.cols + i].push(o);
    }
    GRILLES.set(c, g);
    return g;
  }
  function circleHitsRect(x, y, r, o) {
    const cx = clamp(x, o.x, o.x + o.w), cy = clamp(y, o.y, o.y + o.h);
    return (x - cx) ** 2 + (y - cy) ** 2 < r * r;
  }
  function tuile(c, x, y) {
    const i = Math.floor(x / c.T), j = Math.floor(y / c.T);
    if (i < 0 || j < 0 || i >= c.cols || j >= c.rows) return 'c';
    return c.tiles[j][i];
  }
  function touchObj(c, x, y, r) {
    const os = r > MARGE ? c.objs : grilleObjs(c)[clamp(Math.floor(y / c.T), 0, c.rows - 1) * c.cols + clamp(Math.floor(x / c.T), 0, c.cols - 1)];
    for (const o of os) if (circleHitsRect(x, y, r, o)) return true;
    return false;
  }
  // Murs, eau, objets et bords de la carte (dur = les tuiles où l'on ne marche pas)
  function heurte(c, dur, x, y, r) {
    if (x < r || y < r || x > c.W - r || y > c.H - r) return true;
    const k = r * 0.75, d = (px, py) => dur.has(tuile(c, px, py));
    if (d(x, y) || d(x + k, y) || d(x - k, y) || d(x, y + k) || d(x, y - k)) return true;
    if (touchObj(c, x, y, r)) return true;
    return !!(c.heal && c.heal.kind !== 'source' && Math.hypot(x - c.heal.x, y - c.heal.y) < 30 + r);
  }
  // Boue, gué, glace
  const terrain = t => t === 'm' ? 0.55 : t === '=' ? 0.7 : t === 'i' ? 1.4 : 1;

  // Un pas : chaque axe séparément, et on glisse sur le côté d'un coin au lieu de rester coincé.
  // Retourne vrai si le héros est bloqué dans les deux directions.
  function pas(p, mx, my, sp, bloque, R) {
    const bx = !mx || bloque(p.x + mx * sp, p.y, R), by = !my || bloque(p.x, p.y + my * sp, R);
    if (!bx) p.x += mx * sp;
    if (!by) p.y += my * sp;
    if (bx && mx && !my) glisse(p, 'y', 'x', mx, sp, bloque, R);
    else if (by && my && !mx) glisse(p, 'x', 'y', my, sp, bloque, R);
    return bx && by && (mx || my);
  }
  function glisse(p, cote, axe, dir, sp, bloque, R) {
    for (const k of [6, 12, 18]) for (const s of [1, -1]) {
      const a = { x: p.x, y: p.y }; a[cote] += s * k; a[axe] += dir * sp;
      if (!bloque(a.x, a.y, R)) {
        const b = { x: p.x, y: p.y }; b[cote] += s * Math.min(sp, k);
        if (!bloque(b.x, b.y, R)) { p[cote] = b[cote]; return; }
      }
    }
  }

  Object.assign(exp, { grilleObjs, circleHitsRect, tuile, touchObj, heurte, terrain, pas });
})(typeof module !== 'undefined' ? module.exports : (window.Mouvement = {}));
