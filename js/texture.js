/*
 * Procedural tile textures.
 *
 * Every tile look is painted with the Canvas 2D API from the parameters in
 * data.js, so the showroom needs no image files. Textures are drawn per cell
 * with a deterministic seed so each laid tile looks subtly different (real
 * marble veins, terrazzo chips, etc. never repeat exactly).
 */
window.TileTexture = (function () {
  'use strict';

  // Small deterministic PRNG (mulberry32) so a given seed always paints the
  // same tile - important for stable swatches and repeatable visualizer scenes.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function shade(ctx, x, y, w, h, color, alpha) {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;
  }

  // --- individual material painters -------------------------------------

  function marble(ctx, x, y, w, h, t, rnd) {
    ctx.fillStyle = t.texture.base;
    ctx.fillRect(x, y, w, h);
    const veins = 5 + Math.floor(rnd() * 4);
    for (let i = 0; i < veins; i++) {
      ctx.beginPath();
      let px = x + rnd() * w;
      let py = y - 4;
      ctx.moveTo(px, py);
      const steps = 6;
      for (let s = 0; s < steps; s++) {
        px += (rnd() - 0.5) * w * 0.5;
        py += h / steps;
        ctx.lineTo(px, py);
      }
      ctx.strokeStyle = i % 2 ? t.texture.veinAlt : t.texture.vein;
      ctx.globalAlpha = 0.35 + rnd() * 0.4;
      ctx.lineWidth = 0.6 + rnd() * 2.2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function granite(ctx, x, y, w, h, t, rnd) {
    ctx.fillStyle = t.texture.base;
    ctx.fillRect(x, y, w, h);
    const n = Math.floor((w * h) / 22);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = rnd() > 0.5 ? t.texture.fleck1 : t.texture.fleck2;
      ctx.globalAlpha = 0.25 + rnd() * 0.5;
      const r = 0.5 + rnd() * 1.8;
      ctx.fillRect(x + rnd() * w, y + rnd() * h, r, r);
    }
    ctx.globalAlpha = 1;
  }

  function stone(ctx, x, y, w, h, t, rnd) {
    ctx.fillStyle = t.texture.base;
    ctx.fillRect(x, y, w, h);
    const n = Math.floor((w * h) / 120);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = t.texture.spot;
      ctx.globalAlpha = 0.15 + rnd() * 0.25;
      const r = 2 + rnd() * 6;
      ctx.beginPath();
      ctx.arc(x + rnd() * w, y + rnd() * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function wood(ctx, x, y, w, h, t, rnd) {
    ctx.fillStyle = t.texture.base;
    ctx.fillRect(x, y, w, h);
    // grain runs along the longer dimension
    const along = w >= h;
    const lines = Math.floor((along ? h : w) / 5);
    for (let i = 0; i < lines; i++) {
      ctx.beginPath();
      ctx.strokeStyle = t.texture.grain;
      ctx.globalAlpha = 0.1 + rnd() * 0.3;
      ctx.lineWidth = 0.5 + rnd() * 1.5;
      if (along) {
        const gy = y + (i / lines) * h + (rnd() - 0.5) * 3;
        ctx.moveTo(x, gy);
        for (let sx = 0; sx <= w; sx += w / 6) {
          ctx.lineTo(x + sx, gy + Math.sin(sx * 0.05 + i) * 1.5);
        }
      } else {
        const gx = x + (i / lines) * w + (rnd() - 0.5) * 3;
        ctx.moveTo(gx, y);
        for (let sy = 0; sy <= h; sy += h / 6) {
          ctx.lineTo(gx + Math.sin(sy * 0.05 + i) * 1.5, y + sy);
        }
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function mosaic(ctx, x, y, w, h, t, rnd) {
    const cells = 6;
    const cw = w / cells, ch = h / cells;
    ctx.fillStyle = t.texture.grout;
    ctx.fillRect(x, y, w, h);
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        ctx.fillStyle = (r + c) % 2 || rnd() > 0.7 ? t.texture.alt : t.texture.base;
        ctx.globalAlpha = 0.85 + rnd() * 0.15;
        ctx.fillRect(x + c * cw + 0.6, y + r * ch + 0.6, cw - 1.2, ch - 1.2);
      }
    }
    ctx.globalAlpha = 1;
  }

  function terrazzo(ctx, x, y, w, h, t, rnd) {
    ctx.fillStyle = t.texture.base;
    ctx.fillRect(x, y, w, h);
    const n = Math.floor((w * h) / 60);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = t.texture.chips[Math.floor(rnd() * t.texture.chips.length)];
      ctx.globalAlpha = 0.7;
      const r = 1.5 + rnd() * 4;
      ctx.beginPath();
      ctx.ellipse(x + rnd() * w, y + rnd() * h, r, r * (0.6 + rnd() * 0.6), rnd() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function cement(ctx, x, y, w, h, t, rnd) {
    ctx.fillStyle = t.texture.base;
    ctx.fillRect(x, y, w, h);
    const n = Math.floor((w * h) / 40);
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = t.texture.mottle;
      ctx.globalAlpha = 0.04 + rnd() * 0.12;
      const r = 4 + rnd() * 14;
      ctx.beginPath();
      ctx.arc(x + rnd() * w, y + rnd() * h, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const PAINTERS = { marble, granite, stone, wood, mosaic, terrazzo, cement };

  /* Draw a single tile face filling the rect (x,y,w,h). seed varies the look. */
  function draw(ctx, x, y, w, h, tile, seed) {
    const rnd = rng(hashStr(tile.id) ^ (seed >>> 0));
    const painter = PAINTERS[tile.texture.kind] || stone;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    painter(ctx, x, y, w, h, tile, rnd);
    // soft sheen for polished/glossy finishes
    if (tile.finish === 'Polished' || tile.finish === 'Glossy') {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, 'rgba(255,255,255,0.10)');
      g.addColorStop(0.5, 'rgba(255,255,255,0)');
      g.addColorStop(1, 'rgba(0,0,0,0.06)');
      shadeGrad(ctx, x, y, w, h, g);
    }
    ctx.restore();
  }

  function shadeGrad(ctx, x, y, w, h, grad) {
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);
  }

  /* Build a standalone swatch canvas for catalog cards / detail view. */
  function swatch(tile, size) {
    const dpr = window.devicePixelRatio || 1;
    const cv = document.createElement('canvas');
    cv.width = size * dpr;
    cv.height = size * dpr;
    cv.style.width = size + 'px';
    cv.style.height = size + 'px';
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    draw(ctx, 0, 0, size, size, tile, 1);
    return cv;
  }

  return { draw, swatch, shade };
})();
