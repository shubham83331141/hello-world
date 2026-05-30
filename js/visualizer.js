/*
 * Room visualizer.
 *
 * Renders the selected tile onto a floor so a customer can see how it reads at
 * scale. Two modes:
 *   - 'room'  one-point-perspective room with walls and furniture for context
 *   - 'flat'  straight top-down repeat, to judge the pattern and grout
 *
 * Everything is drawn on a single <canvas>; tiles are warped into the floor
 * with triangle (affine) texture mapping so the perspective looks convincing.
 */
window.Visualizer = (function () {
  'use strict';

  // Cache one offscreen texture image per tile id so we don't repaint the
  // procedural texture for every floor cell.
  const imgCache = {};
  function tileImage(tile) {
    if (imgCache[tile.id]) return imgCache[tile.id];
    const [mw, mh] = tile.sizeMm;
    const aspect = mh / mw;
    const w = 256;
    const h = Math.max(48, Math.round(256 * aspect));
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    window.TileTexture.draw(ctx, 0, 0, w, h, tile, 7);
    imgCache[tile.id] = cv;
    return cv;
  }

  // Map source triangle -> destination triangle and draw the image clipped to
  // the destination triangle. Classic affine texture-warp.
  function drawTriangle(ctx, img, s, d) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(d[0], d[1]);
    ctx.lineTo(d[2], d[3]);
    ctx.lineTo(d[4], d[5]);
    ctx.closePath();
    ctx.clip();

    const x0 = s[0], y0 = s[1], x1 = s[2], y1 = s[3], x2 = s[4], y2 = s[5];
    const u0 = d[0], v0 = d[1], u1 = d[2], v1 = d[3], u2 = d[4], v2 = d[5];

    const denom = x0 * (y2 - y1) - x1 * y2 + x2 * y1 + (x1 - x2) * y0;
    if (denom === 0) { ctx.restore(); return; }
    const id = 1 / denom;
    const a = -(y0 * (u2 - u1) - y1 * u2 + y2 * u1 + (y1 - y2) * u0) * id;
    const b = (y1 * v2 + y0 * (v1 - v2) - y2 * v1 + (y2 - y1) * v0) * id;
    const c = (x0 * (u2 - u1) - x1 * u2 + x2 * u1 + (x1 - x2) * u0) * id;
    const e = -(x1 * v2 + x0 * (v1 - v2) - x2 * v1 + (x2 - x1) * v0) * id;
    const t = (x0 * (y2 * u1 - y1 * u2) + y0 * (x1 * u2 - x2 * u1) + (x2 * y1 - x1 * y2) * u0) * id;
    const f = (x0 * (y2 * v1 - y1 * v2) + y0 * (x1 * v2 - x2 * v1) + (x2 * y1 - x1 * y2) * v0) * id;

    ctx.transform(a, b, c, e, t, f);
    ctx.drawImage(img, 0, 0);
    ctx.restore();
  }

  // Draw a textured quad (two triangles). Source is the full image rect.
  function drawQuad(ctx, img, p) {
    const iw = img.width, ih = img.height;
    // p = [tl, tr, br, bl] each [x,y]
    drawTriangle(ctx, img,
      [0, 0, iw, 0, iw, ih],
      [p[0][0], p[0][1], p[1][0], p[1][1], p[2][0], p[2][1]]);
    drawTriangle(ctx, img,
      [0, 0, iw, ih, 0, ih],
      [p[0][0], p[0][1], p[2][0], p[2][1], p[3][0], p[3][1]]);
  }

  function lerp(a, b, t) { return a + (b - a) * t; }

  function renderRoom(ctx, W, H, tile, opt) {
    const img = tileImage(tile);
    const horizonY = H * 0.40;

    // Walls
    const wall = ctx.createLinearGradient(0, 0, 0, horizonY);
    wall.addColorStop(0, '#e9e4dc');
    wall.addColorStop(1, '#d4cdc2');
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, horizonY);

    // Wall art + window for scale / ambience
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(W * 0.12, H * 0.10, W * 0.16, H * 0.20);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(W * 0.62, H * 0.06, W * 0.26, H * 0.24);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 3;
    ctx.strokeRect(W * 0.62, H * 0.06, W * 0.26, H * 0.24);
    ctx.beginPath();
    ctx.moveTo(W * 0.75, H * 0.06); ctx.lineTo(W * 0.75, H * 0.30);
    ctx.moveTo(W * 0.62, H * 0.18); ctx.lineTo(W * 0.88, H * 0.18);
    ctx.stroke();

    // Skirting board
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fillRect(0, horizonY - 6, W, 6);

    // Floor grout backdrop
    ctx.fillStyle = opt.groutColor;
    ctx.fillRect(0, horizonY, W, H - horizonY);

    // Perspective floor tiling.
    const cx = W / 2;
    const floorH = H - horizonY;
    const [mw, mh] = tile.sizeMm;
    const baseTilePx = (opt.scale * 80); // visual size of a 1m tile at the front
    const tileWworld = (mw / 1000) * baseTilePx;
    const tileHworld = (mh / 1000) * baseTilePx;

    // Z mapping: screenY = horizonY + floorH * (1/(1+Z))
    const persp = 2.4; // strength
    function project(worldX, Z) {
      const k = 1 / (1 + Z * persp);
      return [cx + worldX * k, horizonY + floorH * k];
    }
    function yToZ() {}

    const grout = Math.max(0, opt.grout);
    const cols = 9;
    let Z = 0.02;
    let row = 0;
    const maxZ = 6;
    while (Z < maxZ) {
      const Znext = Z + tileHworld / floorH;
      const offset = (opt.layout === 'brick' && row % 2) ? tileWworld / 2 : 0;
      for (let c = -cols; c <= cols; c++) {
        const x0 = c * tileWworld - tileWworld / 2 + offset;
        const x1 = x0 + tileWworld;
        const gpx = grout; // grout inset in world px (approx)
        const tl = project(x0 + gpx, Znext);
        const tr = project(x1 - gpx, Znext);
        const br = project(x1 - gpx, Z);
        const bl = project(x0 + gpx, Z);
        // cull fully off-screen columns
        if (Math.max(tl[0], tr[0], br[0], bl[0]) < 0) continue;
        if (Math.min(tl[0], tr[0], br[0], bl[0]) > W) continue;
        drawQuad(ctx, img, [tl, tr, br, bl]);
      }
      Z = Znext;
      row++;
      if (row > 200) break;
    }

    // Furniture silhouette (sofa) for scale and a lived-in feel
    ctx.fillStyle = 'rgba(30,28,26,0.18)';
    roundRect(ctx, W * 0.30, H * 0.62, W * 0.40, H * 0.16, 14);
    ctx.fill();

    // Ambient light + vignette
    const glow = ctx.createRadialGradient(W * 0.5, horizonY, 10, W * 0.5, H, H);
    glow.addColorStop(0, 'rgba(255,250,235,0.18)');
    glow.addColorStop(1, 'rgba(255,250,235,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, horizonY, W, floorH);
    vignette(ctx, W, H);
  }

  function renderFlat(ctx, W, H, tile, opt) {
    const img = tileImage(tile);
    ctx.fillStyle = opt.groutColor;
    ctx.fillRect(0, 0, W, H);
    const [mw, mh] = tile.sizeMm;
    const base = opt.scale * 120;
    const tw = base;
    const th = base * (mh / mw);
    const grout = Math.max(0, opt.grout);
    let row = 0;
    for (let y = 0; y < H + th; y += th) {
      const offset = (opt.layout === 'brick' && row % 2) ? tw / 2 : 0;
      for (let x = -tw; x < W + tw; x += tw) {
        ctx.drawImage(img, x + offset + grout, y + grout, tw - grout * 2, th - grout * 2);
      }
      row++;
    }
    vignette(ctx, W, H);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function vignette(ctx, W, H) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.7);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }

  function render(canvas, tile, opt) {
    if (!tile) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const W = Math.max(320, rect.width);
    const H = Math.max(240, rect.height);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (opt.mode === 'flat') renderFlat(ctx, W, H, tile, opt);
    else renderRoom(ctx, W, H, tile, opt);
  }

  return { render };
})();
