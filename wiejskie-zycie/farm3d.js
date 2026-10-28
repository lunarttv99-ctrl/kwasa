import * as THREE from './vendor/three.module.min.js';

// Low-poly 3D farm drawn with Three.js. The game logic lives in game.js;
// this module only reads the state through the `api` callbacks and renders it.

const STEP = 1.06;
const TILE = 0.98;
const ELEV = 0.8;

const SKY = [
  [0, '#18234d'],
  [4.5, '#2b3468'],
  [6, '#f2a77f'],
  [8, '#a9dcf7'],
  [17, '#a4d6f3'],
  [19.5, '#f4a46a'],
  [21, '#3a3570'],
  [22.5, '#18234d'],
  [24, '#18234d']
];

function mulberry32(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- Shared geometry & materials ---------- */

const geoCache = new Map();
const matCache = new Map();

function cached(map, key, make) {
  let v = map.get(key);
  if (!v) {
    v = make();
    map.set(key, v);
  }
  return v;
}

function pumpkinGeo(r) {
  const g = new THREE.SphereGeometry(r, 16, 10);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let k = 0; k < p.count; k++) {
    v.fromBufferAttribute(p, k);
    const f = 1 + 0.08 * Math.cos(Math.atan2(v.z, v.x) * 8);
    v.x *= f;
    v.z *= f;
    v.y *= 0.72;
    p.setXYZ(k, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function gableGeo(w, h, d) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(0, h);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
  g.translate(0, 0, -d / 2);
  return g;
}

function wingGeo() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -0.05, 0.3, 0.03, -0.1, 0.22, 0, 0.1, 0, 0, -0.05, 0.22, 0, 0.1, 0, 0, 0.06], 3));
  g.computeVertexNormals();
  return g;
}

const G = {
  box: (w, h, d) => cached(geoCache, `b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)),
  cyl: (rt, rb, h, s = 6) => cached(geoCache, `c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s)),
  cone: (r, h, s = 6) => cached(geoCache, `k${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s)),
  ico: (r, d = 0) => cached(geoCache, `i${r},${d}`, () => new THREE.IcosahedronGeometry(r, d)),
  dodeca: r => cached(geoCache, `d${r}`, () => new THREE.DodecahedronGeometry(r, 0)),
  sphere: (r, w = 8, h = 6) => cached(geoCache, `s${r},${w},${h}`, () => new THREE.SphereGeometry(r, w, h)),
  cap: r => cached(geoCache, `h${r}`, () => new THREE.SphereGeometry(r, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2)),
  pumpkin: r => cached(geoCache, `p${r}`, () => pumpkinGeo(r)),
  gable: (w, h, d) => cached(geoCache, `g${w},${h},${d}`, () => gableGeo(w, h, d)),
  ring: (a, b) => cached(geoCache, `r${a},${b}`, () => new THREE.RingGeometry(a, b, 24)),
  wing: () => cached(geoCache, 'wing', wingGeo)
};

const mat = (color, opts = {}) =>
  cached(matCache, `l${color}${JSON.stringify(opts)}`, () => new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts }));
const glow = color => cached(matCache, `g${color}`, () => new THREE.MeshBasicMaterial({ color }));

function mesh(geo, material, x = 0, y = 0, z = 0, cast = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = cast;
  return m;
}

/* ---------- Sprites (labels drawn on canvas) ---------- */

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const spriteMats = new Map();

function spriteMaterial(text, style) {
  return cached(spriteMats, `${style}|${text}`, () => {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (style === 'pill') {
      ctx.fillStyle = 'rgba(62,42,20,.88)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(8, 24, 240, 80, 40);
      else ctx.rect(8, 24, 240, 80);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = `bold 52px "Fredoka", ${EMOJI_FONT}`;
      ctx.fillText(text, 128, 66);
    } else if (style === 'bubble') {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(128, 64, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `68px ${EMOJI_FONT}`;
      ctx.fillText(text, 128, 70);
    } else {
      ctx.font = `92px ${EMOJI_FONT}`;
      ctx.fillText(text, 128, 70);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    return new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false });
  });
}

function sprite(text, style, w, h = w / 2) {
  const s = new THREE.Sprite(spriteMaterial(text, style));
  s.scale.set(w, h, 1);
  s.renderOrder = 5;
  return s;
}

/* ---------- Models ---------- */

function grid(rnd, n, spread) {
  const pts = [];
  const side = Math.ceil(Math.sqrt(n));
  for (let k = 0; k < n; k++) {
    const a = (k % side) / Math.max(1, side - 1) - 0.5;
    const b = Math.floor(k / side) / Math.max(1, side - 1) - 0.5;
    pts.push([a * spread * 2 + (rnd() - 0.5) * 0.08, b * spread * 2 + (rnd() - 0.5) * 0.08]);
  }
  return pts;
}

function sproutModel(rnd) {
  const g = new THREE.Group();
  const leaf = mat('#7cc242');
  grid(rnd, 4, 0.22).forEach(([x, z]) => {
    g.add(mesh(G.cyl(0.01, 0.012, 0.08, 4), leaf, x, 0.04, z));
    const a = mesh(G.ico(0.045), leaf, x - 0.03, 0.09, z);
    a.scale.set(1.4, 0.4, 0.8);
    a.rotation.z = 0.5;
    const b = a.clone();
    b.position.x = x + 0.03;
    b.rotation.z = -0.5;
    g.add(a, b);
  });
  return g;
}

function cropModel(type, ripe, rnd) {
  const g = new THREE.Group();
  const add = o => {
    g.add(o);
    return o;
  };
  switch (type) {
    case 'wheat': {
      const stalk = mat(ripe ? '#cfae4e' : '#7fb13d');
      const head = mat(ripe ? '#f2c94c' : '#9ccc65');
      grid(rnd, 9, 0.28).forEach(([x, z]) => {
        const h = 0.36 + rnd() * 0.1;
        add(mesh(G.cyl(0.014, 0.018, h, 4), stalk, x, h / 2, z));
        const top = add(mesh(G.cyl(0.03, 0.042, 0.16, 5), head, x, h + 0.07, z));
        top.rotation.z = (rnd() - 0.5) * 0.4;
      });
      break;
    }
    case 'carrot': {
      const leaf = mat('#4caf50');
      const root = mat(ripe ? '#ff8a1f' : '#ffc46b');
      grid(rnd, 4, 0.2).forEach(([x, z]) => {
        [-0.35, 0, 0.35].forEach(r => {
          const l = add(mesh(G.cone(0.035, 0.28, 4), leaf, x + r * 0.15, 0.17, z));
          l.rotation.z = r;
        });
        const c = add(mesh(G.cone(ripe ? 0.07 : 0.045, 0.2, 6), root, x, 0.03, z));
        c.rotation.x = Math.PI;
      });
      break;
    }
    case 'potato': {
      const leaf = mat('#5d9b3a');
      grid(rnd, 3, 0.2).forEach(([x, z]) => {
        const b = add(mesh(G.ico(0.17), leaf, x, 0.13, z));
        b.scale.set(1, 0.75, 1);
        b.rotation.y = rnd() * 3;
        if (ripe) {
          add(mesh(G.dodeca(0.07), mat('#b5835a'), x + 0.14, 0.04, z + 0.1));
          add(mesh(G.sphere(0.03, 5, 4), mat('#f5f5f5'), x, 0.28, z));
        }
      });
      break;
    }
    case 'corn': {
      const stalk = mat('#6aa84f');
      grid(rnd, 4, 0.2).forEach(([x, z]) => {
        add(mesh(G.cyl(0.025, 0.035, 0.9, 5), stalk, x, 0.45, z));
        [-0.9, 0.9].forEach((r, k) => {
          const l = add(mesh(G.cone(0.05, 0.42, 3), stalk, x + r * 0.08, 0.35 + k * 0.2, z));
          l.scale.z = 0.3;
          l.rotation.z = r;
        });
        add(mesh(G.cone(0.04, 0.14, 4), mat('#e0c27a'), x, 0.96, z));
        if (ripe) {
          const cob = add(mesh(G.cyl(0.05, 0.04, 0.2, 6), mat('#f7d046'), x + 0.07, 0.56, z + 0.02));
          cob.rotation.z = -0.45;
        }
      });
      break;
    }
    case 'tomato': {
      const leaf = mat('#4f8f32');
      const fruit = mat(ripe ? '#e53935' : '#9ccc65');
      [-0.2, 0.2].forEach(x => {
        add(mesh(G.cyl(0.012, 0.012, 0.62, 4), mat('#8d6e4a'), x, 0.31, -0.12));
        const b = add(mesh(G.ico(0.2), leaf, x, 0.3, 0));
        b.scale.set(1, 1.25, 1);
        for (let k = 0; k < 5; k++) {
          const a = rnd() * Math.PI * 2;
          add(mesh(G.sphere(0.055, 6, 5), fruit, x + Math.cos(a) * 0.17, 0.18 + rnd() * 0.3, Math.sin(a) * 0.17 + 0.03));
        }
      });
      break;
    }
    case 'sunflower': {
      const stalk = mat('#5e9e3a');
      [-0.24, 0, 0.24].forEach((x, k) => {
        const z = (k - 1) * 0.12 + (rnd() - 0.5) * 0.1;
        add(mesh(G.cyl(0.02, 0.03, 0.85, 5), stalk, x, 0.42, z));
        const l = add(mesh(G.cone(0.06, 0.25, 3), stalk, x + 0.06, 0.4, z));
        l.scale.z = 0.3;
        l.rotation.z = -1.1;
        if (ripe) {
          const head = new THREE.Group();
          head.position.set(x, 0.9, z + 0.04);
          head.rotation.x = Math.PI / 2 - 0.5;
          head.add(mesh(G.cyl(0.15, 0.15, 0.03, 10), mat('#ffcc1a')));
          head.add(mesh(G.cyl(0.08, 0.08, 0.05, 10), mat('#6d4c25'), 0, 0.02, 0));
          add(head);
        } else {
          add(mesh(G.sphere(0.06, 6, 5), stalk, x, 0.88, z));
        }
      });
      break;
    }
    case 'strawberry': {
      const leaf = mat('#4caf50');
      const berry = mat(ripe ? '#e8283a' : '#eef5c8');
      grid(rnd, 4, 0.2).forEach(([x, z]) => {
        const b = add(mesh(G.ico(0.12), leaf, x, 0.07, z));
        b.scale.set(1, 0.55, 1);
        [-1, 1].forEach(s => {
          const c = add(mesh(G.cone(0.04, 0.09, 5), berry, x + s * 0.1, 0.06, z + 0.07));
          c.rotation.x = Math.PI;
        });
      });
      break;
    }
    case 'pumpkin': {
      const leaf = mat('#4f8f32');
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.5;
        const l = add(mesh(G.ico(0.12), leaf, Math.cos(a) * 0.3, 0.04, Math.sin(a) * 0.3));
        l.scale.set(1.2, 0.35, 1.2);
      }
      add(mesh(G.pumpkin(0.27), mat(ripe ? '#ff8c1a' : '#9cc95a'), 0, 0.2, 0));
      add(mesh(G.cyl(0.025, 0.035, 0.1, 5), mat('#6d4c25'), 0, 0.42, 0));
      break;
    }
    default:
      break;
  }
  return g;
}

function weedModel(rnd) {
  const g = new THREE.Group();
  const m = mat('#3b6e22');
  for (let k = 0; k < 7; k++) {
    const c = mesh(G.cone(0.03, 0.22 + rnd() * 0.1, 3), m, (rnd() - 0.5) * 0.6, 0.11, (rnd() - 0.5) * 0.6);
    c.rotation.set((rnd() - 0.5) * 0.8, rnd() * 3, (rnd() - 0.5) * 0.8);
    g.add(c);
  }
  return g;
}

function treeModel(rnd, scale = 1) {
  const g = new THREE.Group();
  g.add(mesh(G.cyl(0.07, 0.1, 0.4, 5), mat('#7a5230'), 0, 0.2, 0));
  g.add(mesh(G.ico(0.34), mat('#4f9a35'), 0, 0.62, 0));
  g.add(mesh(G.ico(0.24), mat('#63b043'), 0.1, 0.86, 0.05));
  g.rotation.y = rnd() * 6;
  g.scale.setScalar(scale);
  return g;
}

function pineModel(rnd, scale = 1) {
  const g = new THREE.Group();
  g.add(mesh(G.cyl(0.06, 0.08, 0.25, 5), mat('#6b4423'), 0, 0.12, 0));
  g.add(mesh(G.cone(0.36, 0.5, 6), mat('#2f7a3b'), 0, 0.45, 0));
  g.add(mesh(G.cone(0.27, 0.42, 6), mat('#358a43'), 0, 0.72, 0));
  g.add(mesh(G.cone(0.17, 0.34, 6), mat('#3d9a4c'), 0, 0.96, 0));
  g.rotation.y = rnd() * 6;
  g.scale.setScalar(scale);
  return g;
}

function decoModel(deco, rnd) {
  if (deco === '🌲') return pineModel(rnd);
  if (deco === '🪨') {
    const g = new THREE.Group();
    const a = g.add(mesh(G.dodeca(0.26), mat('#9e9e9e'), 0, 0.1, 0)).children[0];
    a.scale.set(1, 0.65, 1);
    a.rotation.y = rnd() * 3;
    g.add(mesh(G.dodeca(0.13), mat('#888888'), 0.24, 0.05, 0.18));
    return g;
  }
  if (deco === '🍄') {
    const g = new THREE.Group();
    g.add(mesh(G.cyl(0.06, 0.07, 0.18, 6), mat('#f3eadb'), 0, 0.09, 0));
    g.add(mesh(G.cap(0.17), mat('#d84a3a'), 0, 0.16, 0));
    [[0.08, 0.04], [-0.06, 0.07], [0, -0.09]].forEach(([x, z]) => g.add(mesh(G.sphere(0.025, 5, 4), mat('#ffffff'), x, 0.28, z, false)));
    g.add(mesh(G.cyl(0.04, 0.05, 0.1, 6), mat('#f3eadb'), 0.22, 0.05, 0.15));
    g.add(mesh(G.cap(0.1), mat('#d84a3a'), 0.22, 0.09, 0.15));
    return g;
  }
  if (deco === '🌿') {
    const g = new THREE.Group();
    [[0, 0, 0.2], [0.2, 0.1, 0.15], [-0.18, -0.08, 0.16]].forEach(([x, z, r]) => {
      const b = mesh(G.ico(r), mat('#4e8f2f'), x, r * 0.7, z);
      b.scale.y = 0.8;
      g.add(b);
    });
    return g;
  }
  return treeModel(rnd);
}

function jackLantern(r = 0.17) {
  const g = new THREE.Group();
  g.add(mesh(G.pumpkin(r), mat('#ff7a1a'), 0, r * 0.7, 0));
  g.add(mesh(G.cyl(0.02, 0.03, 0.07, 5), mat('#5d4025'), 0, r * 1.45, 0));
  const lit = glow('#ffd23f');
  [-1, 1].forEach(s => {
    const eye = mesh(G.cone(r * 0.2, r * 0.22, 3), lit, s * r * 0.36, r * 0.86, r * 0.92, false);
    eye.rotation.x = Math.PI / 2;
    g.add(eye);
  });
  g.add(mesh(G.box(r * 0.8, r * 0.14, 0.02), lit, 0, r * 0.5, r * 0.97, false));
  return g;
}

function chickenModel() {
  const g = new THREE.Group();
  const white = mat('#fbfbf6');
  const body = g.add(mesh(G.sphere(0.13, 8, 6), white, 0, 0.17, 0)).children[0];
  body.scale.set(0.9, 0.85, 1.2);
  g.add(mesh(G.sphere(0.075, 7, 5), white, 0, 0.31, 0.12));
  g.add(mesh(G.box(0.02, 0.06, 0.07), mat('#e53935'), 0, 0.39, 0.12));
  const beak = g.add(mesh(G.cone(0.025, 0.06, 4), mat('#ffa000'), 0, 0.3, 0.2)).children[3];
  beak.rotation.x = Math.PI / 2;
  const tail = g.add(mesh(G.cone(0.06, 0.14, 4), white, 0, 0.25, -0.15)).children[4];
  tail.rotation.x = -0.8;
  [-0.05, 0.05].forEach(x => g.add(mesh(G.cyl(0.012, 0.012, 0.09, 4), mat('#ffa000'), x, 0.045, 0)));
  return g;
}

function cowModel() {
  const g = new THREE.Group();
  const white = mat('#f7f5ef');
  const black = mat('#2e2b28');
  g.add(mesh(G.box(0.36, 0.3, 0.62), white, 0, 0.42, 0));
  g.add(mesh(G.box(0.37, 0.16, 0.2), black, 0, 0.47, -0.1));
  g.add(mesh(G.box(0.2, 0.12, 0.15), black, 0.09, 0.53, 0.16));
  g.add(mesh(G.box(0.24, 0.24, 0.24), white, 0, 0.55, 0.4));
  g.add(mesh(G.box(0.2, 0.11, 0.08), mat('#f4a6a6'), 0, 0.48, 0.53));
  [-1, 1].forEach(s => {
    const horn = mesh(G.cone(0.025, 0.09, 4), mat('#efe3c8'), s * 0.1, 0.71, 0.38);
    horn.rotation.z = -s * 0.5;
    g.add(horn);
  });
  [[-0.12, -0.22], [0.12, -0.22], [-0.12, 0.22], [0.12, 0.22]].forEach(([x, z]) => g.add(mesh(G.cyl(0.045, 0.045, 0.28, 5), black, x, 0.14, z)));
  return g;
}

function sheepModel() {
  const g = new THREE.Group();
  const wool = mat('#f4f1ea');
  [[0, 0.38, 0, 0.19], [0.1, 0.42, 0.12, 0.14], [-0.1, 0.42, 0.12, 0.14], [0.1, 0.42, -0.12, 0.14], [-0.1, 0.42, -0.12, 0.14], [0, 0.5, 0, 0.14]].forEach(([x, y, z, r]) =>
    g.add(mesh(G.ico(r), wool, x, y, z)));
  const dark = mat('#3e3a36');
  g.add(mesh(G.box(0.14, 0.16, 0.18), dark, 0, 0.46, 0.27));
  [[-0.09, -0.12], [0.09, -0.12], [-0.09, 0.12], [0.09, 0.12]].forEach(([x, z]) => g.add(mesh(G.cyl(0.03, 0.03, 0.24, 4), dark, x, 0.12, z)));
  return g;
}

function hiveModel() {
  const g = new THREE.Group();
  g.add(mesh(G.box(0.36, 0.06, 0.32), mat('#8d6e4a'), 0, 0.03, 0));
  g.add(mesh(G.box(0.34, 0.2, 0.3), mat('#f4c542'), 0, 0.16, 0));
  g.add(mesh(G.box(0.36, 0.04, 0.32), mat('#e0a82e'), 0, 0.27, 0));
  g.add(mesh(G.box(0.34, 0.18, 0.3), mat('#f4c542'), 0, 0.38, 0));
  g.add(mesh(G.box(0.42, 0.05, 0.38), mat('#a8743f'), 0, 0.5, 0));
  g.add(mesh(G.box(0.1, 0.03, 0.02), mat('#3e2a14'), 0, 0.1, 0.16, false));
  return g;
}

function batModel() {
  const g = new THREE.Group();
  const black = new THREE.MeshLambertMaterial({ color: '#1d1626', side: THREE.DoubleSide });
  g.add(mesh(G.sphere(0.06, 6, 5), black, 0, 0, 0, false));
  const left = new THREE.Mesh(G.wing(), black);
  const right = new THREE.Mesh(G.wing(), black);
  right.scale.x = -1;
  g.add(left, right);
  g.userData.wings = [left, right];
  return g;
}

function ghostModel() {
  const g = new THREE.Group();
  const white = new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true, opacity: 0.78, emissive: '#c9d6ff', emissiveIntensity: 0.25 });
  g.add(mesh(G.sphere(0.28, 12, 8), white, 0, 0.32, 0));
  g.add(mesh(G.cyl(0.28, 0.33, 0.42, 12), white, 0, 0.1, 0));
  [-0.09, 0.09].forEach(x => g.add(mesh(G.sphere(0.045, 6, 5), mat('#1b1b1b'), x, 0.38, 0.25, false)));
  g.add(mesh(G.sphere(0.05, 6, 5), mat('#1b1b1b'), 0, 0.24, 0.27, false));
  return g;
}

function scarecrowModel() {
  const g = new THREE.Group();
  const wood = mat('#8d6e4a');
  g.add(mesh(G.cyl(0.04, 0.05, 1.25, 5), wood, 0, 0.62, 0));
  g.add(mesh(G.box(0.95, 0.05, 0.05), wood, 0, 0.95, 0));
  g.add(mesh(G.box(0.34, 0.4, 0.2), mat('#6b4fa0'), 0, 0.84, 0));
  g.add(mesh(G.box(0.36, 0.06, 0.22), mat('#ff8f1f'), 0, 0.7, 0));
  [-1, 1].forEach(s => {
    const straw = mesh(G.cone(0.05, 0.12, 4), mat('#f2c94c'), s * 0.52, 0.95, 0);
    straw.rotation.z = s * Math.PI / 2;
    g.add(straw);
  });
  const head = jackLantern(0.17);
  head.position.y = 1.05;
  g.add(head);
  g.add(mesh(G.cyl(0.27, 0.27, 0.02, 12), mat('#231a2e'), 0, 1.33, 0));
  g.add(mesh(G.cone(0.15, 0.4, 8), mat('#231a2e'), 0, 1.53, 0));
  g.add(mesh(G.box(0.31, 0.04, 0.31), mat('#7cff4f'), 0, 1.36, 0, false));
  return g;
}

function cauldronModel() {
  const g = new THREE.Group();
  const iron = mat('#3a3a44');
  [0, 2.1, 4.2].forEach(a => {
    const leg = mesh(G.cyl(0.03, 0.03, 0.3, 4), iron, Math.cos(a) * 0.25, 0.15, Math.sin(a) * 0.25);
    g.add(leg);
  });
  const pot = mesh(G.sphere(0.36, 12, 8), iron, 0, 0.42, 0);
  pot.scale.y = 0.8;
  g.add(pot);
  g.add(mesh(G.cyl(0.33, 0.33, 0.05, 14), iron, 0, 0.64, 0));
  g.add(mesh(G.cyl(0.29, 0.29, 0.03, 14), glow('#7cff4f'), 0, 0.66, 0, false));
  [0, 2.1, 4.2].forEach(a => {
    const f = mesh(G.cone(0.08, 0.22, 4), glow('#ff9d2e'), Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12, false);
    g.add(f);
  });
  const bubbles = [];
  for (let k = 0; k < 4; k++) {
    const b = mesh(G.sphere(0.04, 6, 4), glow('#b6ff9a'), 0, 0.7, 0, false);
    b.userData.seed = k * 1.7;
    bubbles.push(b);
    g.add(b);
  }
  g.userData.bubbles = bubbles;
  return g;
}

function gabledBuilding({ w, h, d, roofH, wall, roof }) {
  const g = new THREE.Group();
  const body = mesh(G.box(w, h, d), mat(wall), 0, h / 2, 0);
  body.receiveShadow = true;
  g.add(body);
  g.add(mesh(G.gable(w, roofH, d), mat(wall), 0, h, 0));
  const slope = Math.atan2(roofH, w / 2);
  const len = Math.hypot(w / 2, roofH) + 0.14;
  [-1, 1].forEach(s => {
    const r = mesh(G.box(len, 0.09, d + 0.2), mat(roof), (s * w) / 4, h + roofH / 2 + 0.03, 0);
    r.rotation.z = -s * slope;
    g.add(r);
  });
  return g;
}

/* ---------- Scene ---------- */

export function createFarm3D(canvas, api) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const { cols, rows } = api;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#a9dcf7', 34, 60);
  scene.background = new THREE.Color('#a9dcf7');

  const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 1, 80);
  let azimuth = 0;
  let azimuthTarget = 0;

  const hemi = new THREE.HemisphereLight('#dff1ff', '#5a7a3a', 1.2);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff4e0', 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  const rnd = mulberry32(7);
  const tileX = c => (c - (cols - 1) / 2) * STEP;
  const tileZ = r => (r - (rows - 1) / 2) * STEP;
  const hx = (cols * STEP) / 2 + 0.14;
  const hz = (rows * STEP) / 2 + 0.14;

  // Ground & surroundings
  const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 40), mat('#7cb342'));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.14;
  ground.receiveShadow = true;
  scene.add(ground);

  const bed = mesh(G.box(cols * STEP + 0.4, 0.04, rows * STEP + 0.4), mat('#5d8f2f'), 0, -0.13, 0, false);
  bed.receiveShadow = true;
  scene.add(bed);

  // Fence around the field
  const fence = new THREE.Group();
  const postM = mat('#a8743f');
  const railM = mat('#c08a52');
  const postTops = [];
  const addPost = (x, z) => {
    fence.add(mesh(G.cyl(0.05, 0.06, 0.5, 5), postM, x, 0.11, z));
    postTops.push(new THREE.Vector3(x, 0.36, z));
  };
  for (let k = 0; k <= cols; k++) {
    const x = -hx + (2 * hx * k) / cols;
    addPost(x, -hz);
    addPost(x, hz);
  }
  for (let k = 1; k < rows; k++) {
    const z = -hz + (2 * hz * k) / rows;
    addPost(-hx, z);
    addPost(hx, z);
  }
  [0.06, 0.24].forEach(y => {
    [-hz, hz].forEach(z => fence.add(mesh(G.box(2 * hx, 0.05, 0.04), railM, 0, y, z)));
    [-hx, hx].forEach(x => fence.add(mesh(G.box(0.04, 0.05, 2 * hz), railM, x, y, 0)));
  });
  scene.add(fence);

  // Buildings behind the field
  const barn = gabledBuilding({ w: 2.0, h: 1.25, d: 1.7, roofH: 0.75, wall: '#c0392b', roof: '#5b3a29' });
  barn.add(mesh(G.box(0.72, 0.92, 0.05), mat('#8e2a20'), 0, 0.46, 0.86, false));
  [-1, 1].forEach(s => {
    const brace = mesh(G.box(0.05, 1.05, 0.02), mat('#fff3e0'), 0, 0.46, 0.89, false);
    brace.rotation.z = s * 0.66;
    barn.add(brace);
  });
  barn.add(mesh(G.box(0.4, 0.32, 0.05), mat('#3e2a14'), 0, 1.5, 0.86, false));
  barn.position.set(2.3, -0.14, -hz - 2.6);
  scene.add(barn);

  const house = gabledBuilding({ w: 1.9, h: 1.05, d: 1.5, roofH: 0.7, wall: '#f3e1c1', roof: '#8d4b2a' });
  const windowMat = new THREE.MeshLambertMaterial({ color: '#3b4a6b', emissive: '#ffcf6a', emissiveIntensity: 0 });
  house.add(mesh(G.box(0.36, 0.6, 0.05), mat('#7a4a2a'), 0.3, 0.3, 0.76, false));
  [-0.45, 0.85].forEach(x => house.add(mesh(G.box(0.32, 0.3, 0.05), windowMat, x - 0.15, 0.62, 0.76, false)));
  house.add(mesh(G.box(0.22, 0.5, 0.22), mat('#9e5a3c'), -0.5, 1.6, -0.2));
  house.position.set(-5.4, -0.14, -hz - 2.3);
  house.rotation.y = 0.35;
  scene.add(house);

  const mill = new THREE.Group();
  mill.add(mesh(G.cyl(0.35, 0.6, 2.3, 6), mat('#efe3c8'), 0, 1.15, 0));
  mill.add(mesh(G.cone(0.5, 0.6, 6), mat('#8d4b2a'), 0, 2.6, 0));
  const blades = new THREE.Group();
  blades.position.set(0, 2.25, 0.55);
  for (let k = 0; k < 4; k++) {
    const arm = new THREE.Group();
    arm.rotation.z = (k * Math.PI) / 2;
    arm.add(mesh(G.box(0.05, 1.3, 0.04), mat('#6b4423'), 0, 0.65, 0));
    arm.add(mesh(G.box(0.24, 0.9, 0.02), mat('#fff8e7'), 0.13, 0.8, 0));
    blades.add(arm);
  }
  blades.add(mesh(G.sphere(0.09, 6, 5), mat('#6b4423')));
  mill.add(blades);
  mill.position.set(5.6, -0.14, -hz - 3.2);
  scene.add(mill);

  // Animal pen
  const PEN = { x0: -3.7, x1: 0.6, z0: -hz - 3.6, z1: -hz - 0.8 };
  const pen = new THREE.Group();
  const straw = mesh(G.box(PEN.x1 - PEN.x0, 0.03, PEN.z1 - PEN.z0), mat('#d9c27a'), (PEN.x0 + PEN.x1) / 2, -0.12, (PEN.z0 + PEN.z1) / 2, false);
  straw.receiveShadow = true;
  pen.add(straw);
  const penW = PEN.x1 - PEN.x0;
  const penD = PEN.z1 - PEN.z0;
  for (let k = 0; k <= 6; k++) {
    const x = PEN.x0 + (penW * k) / 6;
    pen.add(mesh(G.cyl(0.04, 0.05, 0.42, 5), postM, x, 0.07, PEN.z0), mesh(G.cyl(0.04, 0.05, 0.42, 5), postM, x, 0.07, PEN.z1));
  }
  for (let k = 1; k < 4; k++) {
    const z = PEN.z0 + (penD * k) / 4;
    pen.add(mesh(G.cyl(0.04, 0.05, 0.42, 5), postM, PEN.x0, 0.07, z), mesh(G.cyl(0.04, 0.05, 0.42, 5), postM, PEN.x1, 0.07, z));
  }
  [0.02, 0.18].forEach(y => {
    pen.add(mesh(G.box(penW, 0.04, 0.03), railM, (PEN.x0 + PEN.x1) / 2, y, PEN.z0), mesh(G.box(penW, 0.04, 0.03), railM, (PEN.x0 + PEN.x1) / 2, y, PEN.z1));
    pen.add(mesh(G.box(0.03, 0.04, penD), railM, PEN.x0, y, (PEN.z0 + PEN.z1) / 2), mesh(G.box(0.03, 0.04, penD), railM, PEN.x1, y, (PEN.z0 + PEN.z1) / 2));
  });
  const coop = gabledBuilding({ w: 0.8, h: 0.5, d: 0.6, roofH: 0.32, wall: '#e9c46a', roof: '#a0522d' });
  coop.position.set(PEN.x0 + 0.55, -0.12, PEN.z0 + 0.45);
  pen.add(coop);
  pen.add(mesh(G.box(0.8, 0.14, 0.24), mat('#8d6e4a'), PEN.x1 - 0.6, -0.04, PEN.z1 - 0.3));
  scene.add(pen);

  // Trees and flowers around
  [
    [-6.6, -2.5, 'tree', 1.4], [-6.2, 1.8, 'pine', 1.5], [-7.0, 5.0, 'tree', 1.3], [6.4, -1.6, 'pine', 1.4], [6.8, 2.4, 'tree', 1.5],
    [6.0, 5.8, 'pine', 1.2], [-3.5, -hz - 5.2, 'pine', 1.6], [-0.6, -hz - 5.6, 'tree', 1.6], [3.8, -hz - 5.4, 'pine', 1.7],
    [-4.8, 7.4, 'tree', 1.2], [4.6, 7.8, 'tree', 1.3], [0.4, 8.4, 'pine', 1.2], [-8.5, -6, 'pine', 1.8], [8.6, -6.2, 'tree', 1.8]
  ].forEach(([x, z, kind, s]) => {
    const t = kind === 'pine' ? pineModel(rnd, s) : treeModel(rnd, s);
    t.position.set(x, -0.14, z);
    scene.add(t);
  });
  const flowerColors = ['#ff6f91', '#ffd54f', '#ffffff', '#b388ff'];
  for (let k = 0; k < 40; k++) {
    const x = (rnd() - 0.5) * 16;
    const z = hz + 0.6 + rnd() * 4.5;
    if (Math.abs(x) < 3.6 && z < hz + 2.6) continue;
    scene.add(mesh(G.sphere(0.05, 5, 4), mat(flowerColors[k % 4]), x, -0.08, z, false));
  }
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1.1, 18), new THREE.MeshLambertMaterial({ color: '#4fa3d9' }));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(5.2, -0.12, hz + 2.4);
  pond.scale.set(1.3, 0.8, 1);
  scene.add(pond);

  // Clouds: invisible to the camera, but their shadows drift over the field
  const cloudMat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const clouds = [];
  for (let k = 0; k < 4; k++) {
    const c = new THREE.Group();
    [[0, 0, 0, 0.9], [0.8, -0.1, 0.2, 0.7], [-0.8, -0.1, -0.1, 0.65], [0.3, 0.3, -0.3, 0.6]].forEach(([x, y, z, r]) =>
      c.add(mesh(G.ico(r, 1), cloudMat, x, y, z)));
    c.position.set(-14 + k * 8, 8 + (k % 2), -4 + k * 2.5);
    c.userData.speed = 0.25 + k * 0.05;
    clouds.push(c);
    scene.add(c);
  }

  // Rain
  const DROPS = 500;
  const rainPos = new Float32Array(DROPS * 6);
  for (let k = 0; k < DROPS; k++) {
    const x = (rnd() - 0.5) * 18;
    const y = rnd() * 9;
    const z = (rnd() - 0.5) * 22 - 2;
    rainPos.set([x, y, z, x - 0.04, y - 0.35, z], k * 6);
  }
  const rainGeo = new THREE.BufferGeometry();
  rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: '#d6e6ff', transparent: true, opacity: 0.6 }));
  rain.frustumCulled = false;
  scene.add(rain);

  // Halloween props
  const spooky = new THREE.Group();
  [[-0.55, 0.95], [0.55, 0.95]].forEach(([x, z]) => {
    const j = jackLantern(0.16);
    j.position.set(barn.position.x + x, -0.14, barn.position.z + z);
    spooky.add(j);
  });
  const doorLantern = jackLantern(0.14);
  doorLantern.position.set(house.position.x + 0.75, -0.14, house.position.z + 1.05);
  spooky.add(doorLantern);
  const cauldron = cauldronModel();
  cauldron.position.set(-1.0, -0.14, hz + 0.8);
  cauldron.scale.setScalar(0.85);
  spooky.add(cauldron);
  const bats = [];
  for (let k = 0; k < 8; k++) {
    const b = batModel();
    b.userData.r = 3 + rnd() * 3;
    b.userData.h = 1.8 + rnd() * 1.6;
    b.userData.speed = (0.4 + rnd() * 0.4) * (k % 2 ? 1 : -1);
    b.userData.phase = rnd() * Math.PI * 2;
    bats.push(b);
    spooky.add(b);
  }
  scene.add(spooky);

  // Event rewards (stay after the event)
  const decor = {
    lanterns: new THREE.Group(),
    scarecrow: scarecrowModel(),
    ghost: ghostModel(),
    goldpumpkin: new THREE.Group()
  };
  postTops.forEach((p, k) => {
    if (k % 2) return;
    const j = jackLantern(0.11);
    j.position.copy(p);
    decor.lanterns.add(j);
  });
  decor.scarecrow.position.set(-2.9, -0.14, hz + 0.75);
  decor.ghost.scale.setScalar(0.75);
  decor.scarecrow.rotation.y = 0.3;
  const gold = mesh(G.pumpkin(0.6), new THREE.MeshLambertMaterial({ color: '#ffcf33', emissive: '#b8860b', emissiveIntensity: 0.35, flatShading: true }), 0, 0.42, 0);
  decor.goldpumpkin.add(gold, mesh(G.cyl(0.06, 0.09, 0.25, 6), mat('#5d4025'), 0, 0.92, 0));
  decor.goldpumpkin.position.set(2.7, -0.14, hz + 0.85);
  decor.goldpumpkin.scale.setScalar(0.8);
  Object.values(decor).forEach(d => {
    d.visible = false;
    scene.add(d);
  });

  /* ---------- Tiles ---------- */

  const tileGeo = G.box(TILE, 0.14, TILE);
  const soilGeo = G.box(TILE, 0.16, TILE);
  const ridgeGeo = G.box(0.88, 0.06, 0.15);
  const ringGeo = G.ring(0.36, 0.46);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ffd54f', transparent: true, opacity: 0.8, depthWrite: false });
  const BASES = {
    grass: mat('#8bc34a'),
    soil: mat('#8d5a3b'),
    wet: mat('#5e3822'),
    locked: mat('#6a9c3c'),
    buyable: mat('#79ab45')
  };

  const tiles = [];
  for (let i = 0; i < cols * rows; i++) {
    const group = new THREE.Group();
    group.position.set(tileX(i % cols), 0, tileZ(Math.floor(i / cols)));
    const base = new THREE.Mesh(tileGeo, BASES.grass);
    base.position.y = -0.07;
    base.receiveShadow = true;
    group.add(base);
    scene.add(group);
    tiles.push({ group, base, content: null, extra: [], sig: '', pulse: 0 });
  }

  function rebuildTile(i, info) {
    const t = tiles[i];
    if (t.content) t.group.remove(t.content);
    t.extra.forEach(o => t.group.remove(o));
    t.extra = [];
    t.content = null;
    t.drop = null;
    t.ring = null;
    const r = mulberry32(i * 97 + 13);

    let baseKey = 'grass';
    if (info.s === 'locked') baseKey = info.buyable ? 'buyable' : 'locked';
    else if (info.s !== 'grass') baseKey = info.wet ? 'wet' : 'soil';
    t.base.material = BASES[baseKey];
    t.base.geometry = baseKey === 'soil' || baseKey === 'wet' ? soilGeo : tileGeo;
    t.base.position.y = baseKey === 'soil' || baseKey === 'wet' ? -0.06 : -0.07;

    const extra = o => {
      t.extra.push(o);
      t.group.add(o);
      return o;
    };

    if (info.s === 'grass') {
      for (let k = 0; k < 4; k++) extra(mesh(G.cone(0.03, 0.1, 3), mat('#6fae3a'), (r() - 0.5) * 0.7, 0.04, (r() - 0.5) * 0.7, false));
    } else if (info.s === 'locked') {
      t.content = decoModel(info.deco, r);
      if (!info.buyable) t.content.scale.setScalar(0.9);
      t.group.add(t.content);
      if (info.buyable) {
        const label = extra(sprite(`🪙 ${info.price}`, 'pill', 0.66, 0.33));
        label.position.set(0, 0.32, 0.36);
      }
    } else {
      const ridgeM = mat(info.wet ? '#6b4029' : '#9c6744');
      [-0.3, 0, 0.3].forEach(z => extra(mesh(ridgeGeo, ridgeM, 0, 0.04, z, false)).receiveShadow = true);
      if (info.weed) {
        t.content = weedModel(r);
      } else if (info.s === 'crop') {
        t.content = info.stage === 0 ? sproutModel(r) : cropModel(info.crop, info.ready, r);
        if (!info.wet && !info.ready) {
          t.drop = extra(sprite('💧', 'plain', 0.42, 0.21));
          t.drop.position.set(0.28, 0.75, 0.1);
        }
        if (info.ready) {
          t.ring = extra(new THREE.Mesh(ringGeo, ringMat));
          t.ring.rotation.x = -Math.PI / 2;
          t.ring.position.y = 0.09;
        }
      }
      if (t.content) t.group.add(t.content);
    }
  }

  /* ---------- Animals ---------- */

  let animalSig = '';
  let animalObjs = [];
  const animalRoot = new THREE.Group();
  scene.add(animalRoot);
  const HIVE_SPOTS = [[1.0, -hz - 0.75], [1.6, -hz - 0.8], [3.4, -hz - 0.75], [4.0, -hz - 0.8]];

  function syncAnimals(list) {
    const sig = list.map(a => a.type).join(',');
    if (sig === animalSig) return;
    animalSig = sig;
    animalRoot.clear();
    let hive = 0;
    animalObjs = list.map((a, k) => {
      const r = mulberry32(k * 31 + 5);
      let obj;
      if (a.type === 'bee') {
        obj = hiveModel();
        const [x, z] = HIVE_SPOTS[hive++ % HIVE_SPOTS.length];
        obj.position.set(x, -0.14, z);
        obj.userData.bees = [0, 1, 2].map(n => {
          const b = mesh(G.sphere(0.03, 5, 4), mat(n % 2 ? '#2b2b2b' : '#ffcc1a'), 0, 0.4, 0, false);
          obj.add(b);
          return b;
        });
      } else {
        obj = a.type === 'cow' ? cowModel() : a.type === 'sheep' ? sheepModel() : chickenModel();
        obj.position.set(PEN.x0 + 0.5 + r() * (penW - 1), -0.12, PEN.z0 + 0.5 + r() * (penD - 1));
        obj.userData.target = obj.position.clone();
        obj.userData.speed = a.type === 'chicken' ? 0.45 : 0.25;
        obj.userData.wait = r() * 3;
      }
      obj.userData.type = a.type;
      obj.userData.phase = r() * 6;
      const bubble = sprite('?', 'bubble', 0.5, 0.25);
      bubble.visible = false;
      bubble.position.y = a.type === 'cow' ? 1.05 : a.type === 'bee' ? 0.95 : 0.75;
      obj.userData.bubbleY = bubble.position.y;
      obj.add(bubble);
      obj.userData.bubble = bubble;
      animalRoot.add(obj);
      return obj;
    });
  }

  function animateAnimals(list, dt, time) {
    animalObjs.forEach((obj, k) => {
      const a = list[k];
      if (!a) return;
      const u = obj.userData;
      const ready = a.s === 'ready';
      u.bubble.visible = ready;
      if (ready) {
        const icon = api.animalProduct(a.type);
        if (u.bubbleIcon !== icon) {
          u.bubble.material = spriteMaterial(icon, 'bubble');
          u.bubbleIcon = icon;
        }
        u.bubble.position.y = u.bubbleY + Math.sin(time * 4 + u.phase) * 0.06;
      }
      if (u.type === 'bee') {
        u.bees.forEach((b, n) => {
          const ang = time * (2 + n * 0.6) + n * 2;
          b.position.set(Math.cos(ang) * 0.35, 0.45 + Math.sin(time * 5 + n) * 0.1, Math.sin(ang) * 0.35);
        });
        return;
      }
      const busy = a.s === 'busy';
      if (u.wait > 0) {
        u.wait -= dt;
        if (u.type === 'chicken') obj.rotation.x = Math.max(0, Math.sin(time * 9 + u.phase)) * 0.35;
        return;
      }
      obj.rotation.x = 0;
      const to = u.target.clone().sub(obj.position);
      const dist = to.length();
      if (dist < 0.05) {
        u.target.set(PEN.x0 + 0.4 + Math.random() * (penW - 0.8), obj.position.y, PEN.z0 + 0.4 + Math.random() * (penD - 0.8));
        u.wait = 1 + Math.random() * (busy ? 4 : 2);
        return;
      }
      to.normalize();
      obj.position.addScaledVector(to, Math.min(dist, u.speed * dt));
      const yaw = Math.atan2(to.x, to.z);
      obj.rotation.y += Math.atan2(Math.sin(yaw - obj.rotation.y), Math.cos(yaw - obj.rotation.y)) * Math.min(1, dt * 6);
      obj.position.y = -0.12 + Math.abs(Math.sin(time * 10 + u.phase)) * 0.03;
    });
  }

  /* ---------- Camera ---------- */

  const framePts = [];
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => [0, 0.6].forEach(y => framePts.push(new THREE.Vector3(sx * hx, y, sz * hz)))));
  const tmp = new THREE.Vector3();
  let viewW = 1;
  let viewH = 1;

  function updateCamera() {
    const dir = new THREE.Vector3(Math.sin(azimuth) * Math.cos(ELEV), Math.sin(ELEV), Math.cos(azimuth) * Math.cos(ELEV));
    camera.position.copy(dir).multiplyScalar(30);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    framePts.forEach(p => {
      tmp.copy(p).applyMatrix4(camera.matrixWorldInverse);
      minX = Math.min(minX, tmp.x);
      maxX = Math.max(maxX, tmp.x);
      minY = Math.min(minY, tmp.y);
      maxY = Math.max(maxY, tmp.y);
    });
    const pad = 0.35;
    minX -= pad;
    maxX += pad;
    minY -= pad;
    maxY += pad + 0.4;
    const aspect = viewW / viewH;
    let w = maxX - minX;
    let h = maxY - minY;
    if (w / h < aspect) {
      const extra = h * aspect - w;
      minX -= extra / 2;
      maxX += extra / 2;
    } else {
      const extra = w / aspect - h;
      maxY += extra * 0.62;
      minY -= extra * 0.38;
    }
    camera.left = minX;
    camera.right = maxX;
    camera.top = maxY;
    camera.bottom = minY;
    camera.updateProjectionMatrix();
  }

  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return;
    viewW = rect.width;
    viewH = rect.height;
    renderer.setSize(viewW, viewH, false);
    updateCamera();
  }

  /* ---------- Lighting by time of day ---------- */

  const cA = new THREE.Color();
  const cB = new THREE.Color();
  const skyColor = new THREE.Color();

  function skyAt(h, out) {
    let k = 0;
    while (k < SKY.length - 2 && SKY[k + 1][0] <= h) k++;
    const [h0, a] = SKY[k];
    const [h1, b] = SKY[k + 1];
    return out.set(a).lerp(cB.set(b), (h - h0) / (h1 - h0));
  }

  function updateLighting() {
    const h = api.hour();
    const weather = api.weather();
    const halloween = api.halloween();
    skyAt(h, skyColor);
    if (weather !== 'sunny') skyColor.lerp(cA.set('#8c96a0'), weather === 'rain' ? 0.5 : 0.28);
    const night = h >= 20.5 || h < 5.5;
    if (halloween && (h >= 18 || h < 6.5)) skyColor.lerp(cA.set('#4a2a6b'), 0.35);
    scene.background.copy(skyColor);
    scene.fog.color.copy(skyColor);

    const p = Math.min(1, Math.max(0, (h - 5.5) / 15));
    const elev = Math.sin(Math.PI * p);
    const dim = weather === 'rain' ? 0.45 : weather === 'cloudy' ? 0.7 : 1;
    if (!night) {
      sun.position.set(Math.cos(Math.PI * p) * -12, 4 + elev * 14, 6);
      sun.color.set('#ffb36b').lerp(cA.set('#fff6e5'), Math.min(1, elev * 1.6));
      sun.intensity = (0.5 + 2.2 * elev) * dim;
      hemi.intensity = (0.55 + 0.75 * elev) * (0.75 + 0.25 * dim);
      hemi.color.set('#dff1ff');
    } else {
      sun.position.set(-6, 14, 4);
      sun.color.set(halloween ? '#b49cff' : '#9fb4ff');
      sun.intensity = 0.6 * dim;
      hemi.intensity = 0.45;
      hemi.color.set(halloween ? '#7a5aa8' : '#5b6fa8');
    }
    windowMat.emissiveIntensity = night || h > 19.5 ? 1.1 : 0;
    rain.visible = weather === 'rain';
    return { night, halloween, dusk: h >= 18 || h < 6.5 };
  }

  /* ---------- Loop ---------- */

  let running = false;
  let last = performance.now();
  let raf = 0;

  function frame(now) {
    raf = 0;
    if (!running) return;
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const time = now / 1000;

    if (Math.abs(azimuthTarget - azimuth) > 0.001) {
      azimuth += (azimuthTarget - azimuth) * Math.min(1, dt * 7);
      updateCamera();
    }

    const env = updateLighting();

    ringMat.opacity = 0.45 + Math.sin(time * 4) * 0.3;
    for (let i = 0; i < tiles.length; i++) {
      const info = api.tile(i);
      info.stage = info.s === 'crop' ? (info.ready ? 2 : info.f < 0.3 ? 0 : 1) : -1;
      const sig = `${info.s}|${info.deco}|${info.buyable ? info.price : ''}|${info.crop}|${info.stage}|${info.wet}|${info.weed}`;
      const t = tiles[i];
      if (sig !== t.sig) {
        t.sig = sig;
        rebuildTile(i, info);
      }
      let s = 1;
      let lift = 0;
      if (info.stage === 1) s = 0.45 + 0.55 * Math.min(1, (info.f - 0.3) / 0.7);
      if (info.stage === 0) s = 0.7 + info.f;
      if (info.stage === 2) lift = Math.abs(Math.sin(time * 3 + i)) * 0.05;
      if (t.pulse > 0) {
        t.pulse = Math.max(0, t.pulse - dt * 3);
        s *= 1 + Math.sin(t.pulse * Math.PI) * 0.25;
      }
      if (t.content && info.s !== 'locked') {
        t.content.scale.set(s, s, s);
        t.content.position.y = lift;
      }
      if (t.drop) t.drop.position.y = 0.75 + Math.sin(time * 4 + i) * 0.06;
    }

    syncAnimals(api.animals());
    animateAnimals(api.animals(), dt, time);

    blades.rotation.z -= dt * (api.weather() === 'rain' ? 1.6 : 0.8);
    clouds.forEach(c => {
      c.position.x += c.userData.speed * dt;
      if (c.position.x > 16) c.position.x = -16;
    });
    if (rain.visible) {
      const pos = rainGeo.attributes.position;
      for (let k = 0; k < DROPS; k++) {
        let y = pos.array[k * 6 + 1] - dt * 9;
        if (y < 0) y += 9;
        pos.array[k * 6 + 1] = y;
        pos.array[k * 6 + 4] = y - 0.35;
      }
      pos.needsUpdate = true;
    }

    spooky.visible = env.halloween;
    if (env.halloween) {
      bats.forEach(b => {
        const u = b.userData;
        b.visible = env.dusk;
        const ang = time * u.speed + u.phase;
        b.position.set(Math.cos(ang) * u.r, u.h + Math.sin(time * 2 + u.phase) * 0.3, Math.sin(ang) * u.r - 2);
        b.rotation.y = -ang + (u.speed > 0 ? 0 : Math.PI);
        const flap = Math.sin(time * 16 + u.phase) * 0.8;
        u.wings[0].rotation.z = flap;
        u.wings[1].rotation.z = -flap;
      });
      cauldron.userData.bubbles.forEach(b => {
        const k = (time * 0.8 + b.userData.seed) % 1;
        b.position.set(Math.sin(b.userData.seed * 3) * 0.15, 0.7 + k * 0.5, Math.cos(b.userData.seed * 3) * 0.15);
        b.scale.setScalar(1 - k);
      });
    }

    const owned = api.decor();
    Object.entries(decor).forEach(([id, obj]) => {
      obj.visible = owned.includes(id);
    });
    if (decor.ghost.visible) {
      const ang = time * 0.18;
      decor.ghost.position.set(Math.cos(ang) * hx, 1.1 + Math.sin(time * 1.7) * 0.2, Math.sin(ang) * hz);
      decor.ghost.rotation.y = -ang;
    }
    if (decor.goldpumpkin.visible) decor.goldpumpkin.rotation.y = Math.sin(time * 0.4) * 0.15;

    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }

  function setActive(on) {
    if (on === running) return;
    running = on;
    if (on) {
      resize();
      last = performance.now();
      if (!raf) raf = requestAnimationFrame(frame);
    }
  }

  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.02);
  const ndc = new THREE.Vector2();
  const hit = new THREE.Vector3();

  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    if (!raycaster.ray.intersectPlane(plane, hit)) return -1;
    const c = Math.round(hit.x / STEP + (cols - 1) / 2);
    const r = Math.round(hit.z / STEP + (rows - 1) / 2);
    if (c < 0 || c >= cols || r < 0 || r >= rows) return -1;
    if (Math.abs(hit.x - tileX(c)) > STEP / 2 || Math.abs(hit.z - tileZ(r)) > STEP / 2) return -1;
    return r * cols + c;
  }

  function screenPos(i, y = 0.45) {
    const rect = canvas.getBoundingClientRect();
    tmp.set(tileX(i % cols), y, tileZ(Math.floor(i / cols))).project(camera);
    return { x: rect.left + ((tmp.x + 1) / 2) * rect.width, y: rect.top + ((1 - tmp.y) / 2) * rect.height };
  }

  function rotate(dir = 1) {
    azimuthTarget += (dir * Math.PI) / 2;
  }

  canvas.addEventListener('webglcontextlost', e => e.preventDefault());

  resize();
  return {
    pick,
    screenPos,
    rotate,
    resize,
    setActive,
    pulse: i => {
      tiles[i].pulse = 1;
    }
  };
}
