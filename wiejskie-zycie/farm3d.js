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
    case 'cabbage': {
      grid(rnd, 4, 0.2).forEach(([x, z]) => {
        const outer = add(mesh(G.ico(0.15), mat('#6fa83c'), x, 0.08, z));
        outer.scale.set(1.25, 0.55, 1.25);
        add(mesh(G.ico(ripe ? 0.12 : 0.08, 1), mat(ripe ? '#b5d98a' : '#8cc152'), x, 0.14, z));
      });
      break;
    }
    case 'cucumber': {
      const leaf = mat('#3f8a2f');
      [-0.22, 0.22].forEach(x => {
        add(mesh(G.cyl(0.012, 0.012, 0.62, 4), mat('#8d6e4a'), x, 0.31, -0.08));
        for (let k = 0; k < 3; k++) {
          const l = add(mesh(G.ico(0.1), leaf, x + (rnd() - 0.5) * 0.16, 0.14 + k * 0.15, (rnd() - 0.5) * 0.12));
          l.scale.set(1.2, 0.5, 1);
        }
        if (ripe) {
          [0, 1].forEach(k => {
            const c = add(mesh(G.cyl(0.035, 0.035, 0.2, 6), mat('#2e7d32'), x + 0.1, 0.16 + k * 0.18, 0.08));
            c.rotation.z = 0.3;
          });
        }
      });
      break;
    }
    default:
      break;
  }
  return g;
}

function crowModel() {
  const g = new THREE.Group();
  const black = mat('#1f1d24');
  const body = mesh(G.sphere(0.09, 7, 5), black, 0, 0.12, 0);
  body.scale.set(0.9, 0.85, 1.4);
  g.add(body);
  g.add(mesh(G.sphere(0.06, 6, 5), black, 0, 0.2, 0.1));
  const beak = mesh(G.cone(0.022, 0.08, 4), mat('#f2b134'), 0, 0.2, 0.18);
  beak.rotation.x = Math.PI / 2;
  g.add(beak);
  const tail = mesh(G.box(0.08, 0.02, 0.14), black, 0, 0.12, -0.16);
  tail.rotation.x = 0.4;
  g.add(tail);
  [-1, 1].forEach(sd => g.add(mesh(G.box(0.02, 0.07, 0.16), black, sd * 0.08, 0.14, -0.01)));
  [-0.03, 0.03].forEach(x => g.add(mesh(G.cyl(0.008, 0.008, 0.06, 3), mat('#f2b134'), x, 0.03, 0)));
  g.scale.setScalar(1.7);
  return g;
}

function personModel({ shirt, hat = 'straw' }) {
  const g = new THREE.Group();
  [-0.05, 0.05].forEach(x => g.add(mesh(G.cyl(0.035, 0.035, 0.22, 5), mat('#3b4a6b'), x, 0.11, 0)));
  g.add(mesh(G.cyl(0.1, 0.11, 0.26, 7), mat(shirt), 0, 0.34, 0));
  g.add(mesh(G.sphere(0.08, 8, 6), mat('#f1c27d'), 0, 0.55, 0));
  if (hat === 'straw') {
    g.add(mesh(G.cyl(0.16, 0.16, 0.02, 10), mat('#e5c06a'), 0, 0.6, 0));
    g.add(mesh(G.cyl(0.07, 0.09, 0.08, 8), mat('#e5c06a'), 0, 0.65, 0));
  } else if (hat === 'scarf') {
    g.add(mesh(G.cap(0.088), mat('#d84a3a'), 0, 0.56, 0));
  } else {
    g.add(mesh(G.cyl(0.09, 0.07, 0.16, 8), mat('#ffffff'), 0, 0.68, 0));
  }
  [-1, 1].forEach(sd => {
    const arm = mesh(G.cyl(0.025, 0.025, 0.2, 4), mat(shirt), sd * 0.13, 0.36, 0);
    arm.rotation.z = sd * 0.3;
    g.add(arm);
  });
  g.scale.setScalar(1.25);
  return g;
}

function dogModel() {
  const g = new THREE.Group();
  const fur = mat('#a0672e');
  const dark = mat('#5d3a1a');
  g.add(mesh(G.box(0.16, 0.14, 0.32), fur, 0, 0.2, 0));
  g.add(mesh(G.box(0.14, 0.13, 0.14), fur, 0, 0.3, 0.2));
  g.add(mesh(G.box(0.08, 0.06, 0.08), dark, 0, 0.27, 0.3));
  [-1, 1].forEach(sd => g.add(mesh(G.box(0.04, 0.08, 0.05), dark, sd * 0.06, 0.4, 0.18)));
  [[-0.05, -0.11], [0.05, -0.11], [-0.05, 0.11], [0.05, 0.11]].forEach(([x, z]) => g.add(mesh(G.cyl(0.025, 0.025, 0.14, 4), fur, x, 0.07, z)));
  const tail = mesh(G.cyl(0.015, 0.02, 0.14, 4), fur, 0, 0.3, -0.18);
  tail.rotation.x = -0.8;
  g.add(tail);
  g.userData.tail = tail;
  g.scale.setScalar(1.3);
  return g;
}

function wellModel() {
  const g = new THREE.Group();
  g.add(mesh(G.cyl(0.3, 0.33, 0.32, 10), mat('#9e9e9e'), 0, 0.16, 0));
  g.add(mesh(G.cyl(0.24, 0.24, 0.02, 10), mat('#4fa3d9'), 0, 0.3, 0, false));
  [-1, 1].forEach(sd => g.add(mesh(G.box(0.06, 0.6, 0.06), mat('#7a5230'), sd * 0.26, 0.5, 0)));
  const roof = mesh(G.gable(0.75, 0.25, 0.5), mat('#8d4b2a'), 0, 0.8, 0);
  g.add(roof);
  g.add(mesh(G.cyl(0.06, 0.05, 0.1, 6), mat('#6b4423'), 0.1, 0.55, 0));
  return g;
}

function waterMillModel() {
  const g = gabledBuilding({ w: 1.0, h: 0.8, d: 0.9, roofH: 0.45, wall: '#d7b98e', roof: '#7a4a2a' });
  const wheel = new THREE.Group();
  wheel.position.set(-0.6, 0.45, 0);
  const rim = mesh(G.cyl(0.45, 0.45, 0.1, 12), mat('#6b4423'));
  rim.rotation.z = Math.PI / 2;
  wheel.add(rim);
  for (let k = 0; k < 6; k++) {
    const paddle = mesh(G.box(0.14, 0.95, 0.08), mat('#8d6e4a'));
    paddle.rotation.x = (k * Math.PI) / 6;
    wheel.add(paddle);
  }
  g.add(wheel);
  g.userData.wheel = wheel;
  return g;
}

function hallModel() {
  const g = gabledBuilding({ w: 2.0, h: 1.0, d: 1.4, roofH: 0.6, wall: '#9ec5e8', roof: '#4a5a7a' });
  g.add(mesh(G.box(0.4, 0.6, 0.05), mat('#6b4423'), 0, 0.3, 0.72, false));
  [-0.6, 0.6].forEach(x => g.add(mesh(G.box(0.3, 0.3, 0.05), mat('#fff6d5'), x, 0.6, 0.72, false)));
  g.add(mesh(G.cyl(0.02, 0.02, 1.4, 4), mat('#dddddd'), 1.15, 0.7, 0.5));
  g.add(mesh(G.box(0.4, 0.13, 0.02), mat('#ffffff'), 1.36, 1.3, 0.5, false));
  g.add(mesh(G.box(0.4, 0.13, 0.02), mat('#dc143c'), 1.36, 1.17, 0.5, false));
  return g;
}

function bridgeModel() {
  const g = new THREE.Group();
  const deck = mesh(G.box(2.9, 0.07, 0.55), mat('#a8743f'), 0, 0.14, 0);
  deck.receiveShadow = true;
  g.add(deck);
  for (let k = -3; k <= 3; k++) {
    [-1, 1].forEach(sd => g.add(mesh(G.cyl(0.025, 0.03, 0.3, 4), mat('#7a5230'), k * 0.45, 0.28, sd * 0.25)));
  }
  [-1, 1].forEach(sd => g.add(mesh(G.box(2.8, 0.04, 0.04), mat('#c08a52'), 0, 0.4, sd * 0.25)));
  return g;
}

function shrineModel() {
  const g = new THREE.Group();
  g.add(mesh(G.box(0.4, 0.12, 0.4), mat('#9e9e9e'), 0, 0.06, 0));
  g.add(mesh(G.box(0.32, 0.75, 0.32), mat('#efe9dc'), 0, 0.5, 0));
  g.add(mesh(G.box(0.18, 0.22, 0.03), mat('#4a6fa5'), 0, 0.62, 0.17, false));
  g.add(mesh(G.gable(0.46, 0.2, 0.42), mat('#b33a2e'), 0, 0.88, 0));
  g.add(mesh(G.box(0.03, 0.22, 0.03), mat('#d4af37'), 0, 1.18, 0));
  g.add(mesh(G.box(0.13, 0.03, 0.03), mat('#d4af37'), 0, 1.22, 0));
  [-0.18, 0.18].forEach(x => g.add(mesh(G.sphere(0.05, 5, 4), mat('#ff6f91'), x, 0.05, 0.25, false)));
  return g;
}

function firehallModel() {
  const g = gabledBuilding({ w: 1.6, h: 1.1, d: 1.4, roofH: 0.5, wall: '#c0392b', roof: '#3e3e3e' });
  g.add(mesh(G.box(0.8, 0.8, 0.05), mat('#eeeeee'), 0, 0.4, 0.72, false));
  g.add(mesh(G.box(0.42, 2.0, 0.42), mat('#b03024'), 0.95, 1.0, -0.3));
  g.add(mesh(G.cone(0.34, 0.4, 4), mat('#3e3e3e'), 0.95, 2.2, -0.3));
  g.add(mesh(G.sphere(0.06, 6, 5), glow('#4fc3ff'), 0.95, 1.85, -0.07, false));
  return g;
}

function greenhouseModel() {
  const g = new THREE.Group();
  const glass = new THREE.MeshLambertMaterial({ color: '#d5f3ff', transparent: true, opacity: 0.42, depthWrite: false });
  g.add(mesh(G.box(1.4, 0.7, 0.9), glass, 0, 0.35, 0, false));
  g.add(mesh(G.gable(1.4, 0.35, 0.9), glass, 0, 0.7, 0, false));
  [-0.6, -0.2, 0.2, 0.6].forEach(x => {
    const plant = mesh(G.ico(0.14), mat('#5fae40'), x, 0.16, 0);
    plant.scale.y = 1.2;
    g.add(plant);
    g.add(mesh(G.sphere(0.04, 5, 4), mat('#e53935'), x + 0.06, 0.24, 0.08, false));
  });
  [-0.7, 0.7].forEach(x => g.add(mesh(G.box(0.03, 0.7, 0.92), mat('#ffffff'), x, 0.35, 0)));
  return g;
}

const TREE_LOOK = {
  apple:  { leaf: '#5aa83e', fruit: '#e53935', blossom: '#ffe4ec', r: 0.055 },
  cherry: { leaf: '#4e9a3a', fruit: '#a3141c', blossom: '#ffd1e0', r: 0.04 },
  pear:   { leaf: '#6aae48', fruit: '#cddc39', blossom: '#ffffff', r: 0.055 },
  peach:  { leaf: '#7cb342', fruit: '#ffab73', blossom: '#ffc1d6', r: 0.06 }
};

function fruitTreeModel(type, { ready, dormant, blossom, young }, rnd) {
  const look = TREE_LOOK[type];
  const g = new THREE.Group();
  const bark = mat('#7a5230');
  g.add(mesh(G.cyl(0.06, 0.09, 0.55, 5), bark, 0, 0.27, 0));
  [-1, 1].forEach(sd => {
    const br = mesh(G.cyl(0.025, 0.035, 0.32, 4), bark, sd * 0.1, 0.62, 0);
    br.rotation.z = -sd * 0.7;
    g.add(br);
  });
  if (dormant) {
    const up = mesh(G.cyl(0.02, 0.03, 0.3, 4), bark, 0, 0.72, 0);
    g.add(up);
    [-1, 1].forEach(sd => g.add(mesh(G.ico(0.06), mat('#f4f8fb'), sd * 0.2, 0.78, 0, false)));
    g.add(mesh(G.ico(0.07), mat('#f4f8fb'), 0, 0.88, 0, false));
  } else {
    g.add(mesh(G.ico(0.36), mat(look.leaf), 0, 0.82, 0));
    g.add(mesh(G.ico(0.24), mat(look.leaf), 0.16, 1.02, 0.06));
    const dots = ready ? 8 : blossom ? 12 : 0;
    const dotMat = mat(ready ? look.fruit : look.blossom);
    for (let k = 0; k < dots; k++) {
      const a = rnd() * Math.PI * 2;
      const y = 0.68 + rnd() * 0.35;
      const rr = 0.34 - Math.abs(y - 0.82) * 0.4;
      const d = mesh(G.sphere(ready ? look.r : 0.035, 6, 5), dotMat, Math.cos(a) * rr, y, Math.sin(a) * rr + 0.04, false);
      if (type === 'pear' && ready) d.scale.y = 1.3;
      g.add(d);
    }
  }
  if (young) g.scale.setScalar(0.7);
  return g;
}

function heaterModel() {
  const g = new THREE.Group();
  const iron = mat('#4a4a52');
  g.add(mesh(G.box(0.4, 0.06, 0.4), mat('#8d8d8d'), 0, 0.03, 0));
  g.add(mesh(G.box(0.34, 0.34, 0.34), iron, 0, 0.23, 0));
  g.add(mesh(G.box(0.38, 0.04, 0.38), mat('#2f2f35'), 0, 0.42, 0));
  g.add(mesh(G.cyl(0.05, 0.05, 0.45, 6), iron, -0.1, 0.65, -0.1));
  const grill = mesh(G.box(0.22, 0.12, 0.02), mat('#2a2a2a'), 0, 0.2, 0.18, false);
  g.add(grill);
  g.userData.grill = grill;
  const puffs = [0, 1, 2].map(k => {
    const puff = mesh(G.ico(0.07), new THREE.MeshLambertMaterial({ color: '#d9d9d9', transparent: true, opacity: 0.6, depthWrite: false }), -0.1, 0.9, -0.1, false);
    puff.userData.seed = k / 3;
    g.add(puff);
    return puff;
  });
  g.userData.puffs = puffs;
  return g;
}

function pressModel() {
  const g = gabledBuilding({ w: 1.1, h: 0.75, d: 0.9, roofH: 0.4, wall: '#c8a26a', roof: '#7a4a2a' });
  g.add(mesh(G.cyl(0.22, 0.22, 0.45, 10), mat('#8d5a3b'), 0.75, 0.22, 0.25));
  [0.1, 0.32].forEach(y => g.add(mesh(G.cyl(0.23, 0.23, 0.04, 10), mat('#3e3e3e'), 0.75, y, 0.25, false)));
  g.add(mesh(G.box(0.3, 0.15, 0.22), mat('#a8743f'), 0.7, 0.07, -0.3));
  [[-0.06, 0], [0.06, 0.04], [0, -0.05]].forEach(([x, z]) => g.add(mesh(G.sphere(0.05, 6, 5), mat('#e53935'), 0.7 + x, 0.17, -0.3 + z, false)));
  return g;
}

function dairyModel() {
  const g = gabledBuilding({ w: 1.1, h: 0.8, d: 0.9, roofH: 0.4, wall: '#f5f5f5', roof: '#3f6fb5' });
  g.add(mesh(G.box(0.3, 0.45, 0.04), mat('#6b8fc7'), 0, 0.22, 0.46, false));
  [-0.1, 0.12].forEach(x => {
    g.add(mesh(G.cyl(0.07, 0.08, 0.22, 8), mat('#c9ced6'), 0.7 + x, 0.11, 0.3));
    g.add(mesh(G.cyl(0.04, 0.05, 0.05, 8), mat('#c9ced6'), 0.7 + x, 0.25, 0.3));
  });
  return g;
}

function oilmillModel() {
  const g = gabledBuilding({ w: 1.2, h: 0.85, d: 1.0, roofH: 0.45, wall: '#e0b84a', roof: '#6b4423' });
  const petals = mesh(G.cyl(0.2, 0.2, 0.06, 10), mat('#ffcc1a'), 0, 0.95, 0.52, false);
  const seeds = mesh(G.cyl(0.1, 0.1, 0.07, 10), mat('#6d4c25'), 0, 0.95, 0.55, false);
  petals.rotation.x = Math.PI / 2;
  seeds.rotation.x = Math.PI / 2;
  g.add(petals, seeds);
  [0, 0.28].forEach(z => g.add(mesh(G.cyl(0.13, 0.13, 0.36, 8), mat('#7a5230'), 0.8, 0.18, z)));
  return g;
}

function fertworksModel() {
  const g = new THREE.Group();
  const heap = mesh(G.ico(0.42, 1), mat('#5d4025'), 0, 0.05, 0);
  heap.scale.set(1.2, 0.55, 1);
  g.add(heap);
  [[-0.55, 0], [0.55, 0], [0, -0.45]].forEach(([x, z]) => {
    const plank = mesh(G.box(Math.abs(x) ? 0.05 : 1.1, 0.28, Math.abs(x) ? 0.9 : 0.05), mat('#a8743f'), x, 0.1, z);
    g.add(plank);
  });
  [[0.1, 0.1], [-0.15, -0.05]].forEach(([x, z]) => {
    const worm = mesh(G.cyl(0.02, 0.02, 0.14, 5), mat('#e88e9c'), x, 0.24, z, false);
    worm.rotation.z = 1.2;
    g.add(worm);
  });
  g.add(mesh(G.box(0.08, 0.5, 0.04), mat('#7a5230'), 0.5, 0.25, 0.42));
  g.add(mesh(G.box(0.36, 0.2, 0.03), mat('#fff8e7'), 0.5, 0.52, 0.44, false));
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
  // Free camera: pan target, zoom factor and pan inertia (pixels per second)
  const target = new THREE.Vector3();
  let zoom = 1;
  const MIN_ZOOM = 0.55;
  const MAX_ZOOM = 3.2;
  const MAX_PAN = 9;
  const panVel = new THREE.Vector2();
  let coasting = false;
  let lastPanAt = 0;

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
  const millArms = [];
  blades.position.set(0, 2.25, 0.55);
  for (let k = 0; k < 4; k++) {
    const arm = new THREE.Group();
    millArms.push(arm);
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
    [-6.6, -2.5, 'tree', 1.4], [-6.2, 1.8, 'pine', 1.5], [6.4, -1.6, 'pine', 1.4],
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
  const POND = { x: 2.6, z: hz + 1.7, rx: 1.3, rz: 0.75 };
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1, 20), new THREE.MeshLambertMaterial({ color: '#4fa3d9' }));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(POND.x, -0.11, POND.z);
  pond.scale.set(POND.rx, POND.rz, 1);
  pond.receiveShadow = true;
  scene.add(pond);
  const shore = new THREE.Mesh(new THREE.CircleGeometry(1, 20), mat('#c9b37a'));
  shore.rotation.x = -Math.PI / 2;
  shore.position.set(POND.x, -0.125, POND.z);
  shore.scale.set(POND.rx + 0.15, POND.rz + 0.12, 1);
  scene.add(shore);
  [[-0.9, -0.3], [0.95, 0.35], [-0.6, 0.45]].forEach(([dx, dz]) => {
    for (let k = 0; k < 4; k++) {
      const reed = mesh(G.cyl(0.012, 0.015, 0.4, 3), mat('#5e8c31'), POND.x + dx + (k - 1.5) * 0.06, 0.05, POND.z + dz + (k % 2) * 0.05, false);
      reed.rotation.z = (k - 1.5) * 0.12;
      scene.add(reed);
    }
  });
  [[0.3, 0.1], [-0.35, -0.15], [0.7, -0.2]].forEach(([dx, dz]) => {
    const pad = mesh(G.cyl(0.12, 0.12, 0.01, 8), mat('#4caf50'), POND.x + dx, -0.1, POND.z + dz, false);
    scene.add(pad);
  });
  const fishSign = sprite('🎣', 'bubble', 0.6, 0.3);
  fishSign.position.set(POND.x, 0.85, POND.z);
  scene.add(fishSign);

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
  cauldron.position.set(-1.1, -0.14, hz + 0.8);
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
  decor.goldpumpkin.position.set(0.6, -0.14, hz + 0.85);
  decor.goldpumpkin.scale.setScalar(0.8);
  Object.values(decor).forEach(d => {
    d.visible = false;
    scene.add(d);
  });

  // Village projects appear as buildings once finished
  const village = {
    well: wellModel(),
    mill: waterMillModel(),
    hall: hallModel(),
    bridge: bridgeModel(),
    shrine: shrineModel(),
    firehall: firehallModel()
  };
  village.well.position.set(-1.9, -0.14, hz + 2.3);
  village.shrine.position.set(-3.4, -0.14, hz + 2.2);
  village.mill.position.set(POND.x + 2.1, -0.14, POND.z - 0.1);
  village.mill.rotation.y = -0.2;
  village.bridge.position.set(POND.x, -0.14, POND.z);
  village.hall.position.set(-6.4, -0.14, -0.6);
  village.hall.rotation.y = 0.9;
  village.firehall.position.set(6.3, -0.14, 0.4);
  village.firehall.rotation.y = -0.9;
  const greenhouse = greenhouseModel();
  greenhouse.position.set(-5.3, -0.14, -4.1);
  greenhouse.rotation.y = 0.3;
  [...Object.values(village), greenhouse].forEach(b => {
    b.visible = false;
    scene.add(b);
  });

  // Processing plant buildings
  const procBuildings = {
    press: pressModel(),
    dairy: dairyModel(),
    oilmill: oilmillModel(),
    fertworks: fertworksModel()
  };
  procBuildings.press.position.set(-6.6, -0.14, 3.6);
  procBuildings.press.rotation.y = 0.8;
  procBuildings.dairy.position.set(6.7, -0.14, 3.4);
  procBuildings.dairy.rotation.y = -0.8;
  procBuildings.oilmill.position.set(6.6, -0.14, -3.4);
  procBuildings.oilmill.rotation.y = -1.0;
  procBuildings.fertworks.position.set(-4.8, -0.14, hz + 1.1);
  Object.values(procBuildings).forEach(b => {
    b.visible = false;
    scene.add(b);
  });
  const warmMat = new THREE.MeshBasicMaterial({ color: '#ff9a3c', transparent: true, opacity: 0.22, depthWrite: false });
  const warmGeo = new THREE.CircleGeometry(0.5, 20);

  // Helpers and the dog
  const jozek = personModel({ shirt: '#4a7bd0', hat: 'straw' });
  const basia = personModel({ shirt: '#c2185b', hat: 'scarf' });
  const mietek = personModel({ shirt: '#f5f5f5', hat: 'chef' });
  const dog = dogModel();
  jozek.position.set(-hx - 0.45, -0.14, 0);
  basia.position.set(-1.5, -0.12, -hz - 2.0);
  basia.userData.target = basia.position.clone();
  mietek.position.set(house.position.x + 1.1, -0.14, house.position.z + 1.2);
  dog.position.set(hx + 0.5, -0.14, hz - 1);
  [jozek, basia, mietek, dog].forEach(o => {
    o.visible = false;
    scene.add(o);
  });

  // Snow (winter)
  const FLAKES = 450;
  const snowPos = new Float32Array(FLAKES * 3);
  for (let k = 0; k < FLAKES; k++) snowPos.set([(rnd() - 0.5) * 20, rnd() * 9, (rnd() - 0.5) * 24 - 2], k * 3);
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(snowGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 4, sizeAttenuation: false, transparent: true, opacity: 0.9, depthWrite: false }));
  snow.frustumCulled = false;
  scene.add(snow);

  // Seasonal recolouring of shared materials
  const SEASONAL = [
    ['#4f9a35', 'canopy'], ['#63b043', 'canopy2'], ['#4e8f2f', 'bush'], ['#2f7a3b', 'pine'], ['#358a43', 'pine'], ['#3d9a4c', 'pine'],
    ['#7cb342', 'ground'], ['#5d8f2f', 'ground'], ['#8bc34a', 'grass'], ['#6a9c3c', 'grass'], ['#79ab45', 'grass'], ['#6fae3a', 'grass']
  ].map(([color, kind]) => ({ m: mat(color), base: new THREE.Color(color), kind }));
  const TINTS = [
    { canopy: ['#9be07a', 0.25], canopy2: ['#f7b6d2', 0.45], bush: ['#9be07a', 0.25], pine: ['#7ccf6a', 0.1], ground: ['#a5e05a', 0.25], grass: ['#a5e05a', 0.2] },
    {},
    { canopy: ['#e0892e', 0.75], canopy2: ['#d04a2a', 0.7], bush: ['#c47a2c', 0.55], pine: ['#5b6e2a', 0.2], ground: ['#b8a948', 0.35], grass: ['#c2b14d', 0.3] },
    { canopy: ['#eef4f7', 0.7], canopy2: ['#eef4f7', 0.7], bush: ['#eef4f7', 0.6], pine: ['#eef4f7', 0.35], ground: ['#f2f6f8', 0.85], grass: ['#f2f6f8', 0.7] }
  ];
  let seasonShown = -1;
  const tint = new THREE.Color();
  function applySeason(season) {
    seasonShown = season;
    SEASONAL.forEach(({ m, base, kind }) => {
      const t = TINTS[season][kind];
      m.color.copy(base);
      if (t) m.color.lerp(tint.set(t[0]), t[1]);
    });
  }

  /* ---------- Tiles ---------- */

  const tileGeo = G.box(TILE, 0.14, TILE);
  const soilGeo = G.box(TILE, 0.16, TILE);
  const ridgeGeo = G.box(0.88, 0.06, 0.15);
  const ringGeo = G.ring(0.36, 0.46);
  const ringMat = new THREE.MeshBasicMaterial({ color: '#ffd54f', transparent: true, opacity: 0.8, depthWrite: false });
  const goldMat = new THREE.MeshLambertMaterial({ color: '#ffd54f', emissive: '#b8860b', emissiveIntensity: 0.5, flatShading: true });
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
    t.crow = null;
    t.sparkle = null;
    const r = mulberry32(i * 97 + 13);

    t.heater = null;
    let baseKey = 'grass';
    if (info.s === 'locked') baseKey = info.buyable ? 'buyable' : 'locked';
    else if (info.s === 'tree') baseKey = 'grass';
    else if (info.s !== 'grass') baseKey = info.wet ? 'wet' : 'soil';
    t.base.material = BASES[baseKey];
    t.base.geometry = baseKey === 'soil' || baseKey === 'wet' ? soilGeo : tileGeo;
    t.base.position.y = baseKey === 'soil' || baseKey === 'wet' ? -0.06 : -0.07;

    const extra = o => {
      t.extra.push(o);
      t.group.add(o);
      return o;
    };

    if (info.heated && info.s !== 'heater' && info.s !== 'locked') {
      const warm = extra(new THREE.Mesh(warmGeo, warmMat));
      warm.rotation.x = -Math.PI / 2;
      warm.position.y = 0.075;
    }
    if (info.frozen) {
      const ice = extra(sprite('❄️', 'plain', 0.45, 0.225));
      ice.position.set(-0.25, 0.7, 0.15);
    }
    if (info.s === 'tree') {
      t.content = fruitTreeModel(info.tree, info, r);
      t.group.add(t.content);
      if (info.ready) {
        t.ring = extra(new THREE.Mesh(ringGeo, ringMat));
        t.ring.rotation.x = -Math.PI / 2;
        t.ring.position.y = 0.02;
      }
    } else if (info.s === 'heater') {
      t.heater = extra(heaterModel());
      t.heater.userData.grill.material = info.active ? glow('#ff7a1a') : mat('#2a2a2a');
      t.heater.userData.puffs.forEach(pf => { pf.visible = info.active; });
    } else if (info.s === 'grass') {
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
        if (info.golden) {
          t.content.traverse(o => {
            if (o.isMesh) o.material = goldMat;
          });
          t.sparkle = extra(sprite('✨', 'plain', 0.5, 0.25));
          t.sparkle.position.set(-0.25, 0.9, 0.1);
        }
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
    if (info.crow) {
      t.crow = extra(crowModel());
      t.crow.position.set(0.12, 0.3, 0.12);
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

  /* ---------- Helpers & dog ---------- */

  const walkTo = (obj, x, z, speed, dt, time) => {
    const dx = x - obj.position.x;
    const dz = z - obj.position.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 0.05) {
      obj.position.y = -0.14;
      return true;
    }
    const step = Math.min(dist, speed * dt);
    obj.position.x += (dx / dist) * step;
    obj.position.z += (dz / dist) * step;
    const yaw = Math.atan2(dx, dz);
    obj.rotation.y += Math.atan2(Math.sin(yaw - obj.rotation.y), Math.cos(yaw - obj.rotation.y)) * Math.min(1, dt * 8);
    obj.position.y = -0.14 + Math.abs(Math.sin(time * 12)) * 0.04;
    return false;
  };

  function animateHelpers(dt, time) {
    const h = api.helpers();
    jozek.visible = !!h.jozek;
    basia.visible = !!h.basia;
    mietek.visible = !!h.mietek;
    dog.visible = api.dog();
    if (jozek.visible) {
      const target = api.helperTarget();
      if (target >= 0) walkTo(jozek, tileX(target % cols), tileZ(Math.floor(target / cols)) + 0.45, 3, dt, time);
    }
    if (basia.visible) {
      const u = basia.userData;
      if (walkTo(basia, u.target.x, u.target.z, 0.8, dt, time)) {
        u.wait = (u.wait || 0) - dt;
        if (u.wait <= 0) {
          u.target.set(PEN.x0 + 0.4 + Math.random() * (penW - 0.8), 0, PEN.z0 + 0.4 + Math.random() * (penD - 0.8));
          u.wait = 1.5 + Math.random() * 2;
        }
      }
    }
    if (mietek.visible) mietek.rotation.y = Math.sin(time * 0.7) * 0.6;
    if (dog.visible) {
      const crowTile = tiles.findIndex(t => t.crow);
      if (crowTile >= 0) walkTo(dog, tileX(crowTile % cols), tileZ(Math.floor(crowTile / cols)) + 0.3, 4.5, dt, time);
      else {
        const ang = time * 0.25;
        walkTo(dog, Math.cos(ang) * (hx + 0.5), Math.sin(ang) * (hz + 0.5), 1.4, dt, time);
      }
      dog.userData.tail.rotation.z = Math.sin(time * 14) * 0.6;
    }
  }

  /* ---------- Camera ---------- */

  const framePts = [];
  [-1, 1].forEach(sx => [-1, 1].forEach(sz => [0, 0.6].forEach(y => framePts.push(new THREE.Vector3(sx * hx, y, sz * hz)))));
  framePts.push(new THREE.Vector3(POND.x, 0, POND.z + 0.3));
  const tmp = new THREE.Vector3();
  let viewW = 1;
  let viewH = 1;

  function updateCamera() {
    const dir = new THREE.Vector3(Math.sin(azimuth) * Math.cos(ELEV), Math.sin(ELEV), Math.cos(azimuth) * Math.cos(ELEV));
    // Frame the field as if the camera were centred, then apply zoom and pan.
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
      maxY += extra * 0.6;
      minY -= extra * 0.4;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const hw = (maxX - minX) / 2 / zoom;
    const hh = (maxY - minY) / 2 / zoom;
    camera.left = cx - hw;
    camera.right = cx + hw;
    camera.top = cy + hh;
    camera.bottom = cy - hh;
    camera.position.copy(dir).multiplyScalar(30).add(target);
    camera.lookAt(target);
    camera.updateMatrixWorld();
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
    if (weather === 'snow') skyColor.lerp(cA.set('#c9d3dc'), 0.5);
    else if (weather !== 'sunny') skyColor.lerp(cA.set('#8c96a0'), weather === 'rain' ? 0.5 : 0.28);
    const night = h >= 20.5 || h < 5.5;
    if (halloween && (h >= 18 || h < 6.5)) skyColor.lerp(cA.set('#4a2a6b'), 0.35);
    if (api.frostNight()) skyColor.lerp(cA.set('#9fd0ff'), 0.3);
    scene.background.copy(skyColor);
    scene.fog.color.copy(skyColor);

    const p = Math.min(1, Math.max(0, (h - 5.5) / 15));
    const elev = Math.sin(Math.PI * p);
    const dim = weather === 'rain' ? 0.45 : weather === 'snow' ? 0.6 : weather === 'cloudy' ? 0.7 : 1;
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
    snow.visible = weather === 'snow';
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

    if (coasting && !panVel.equals(new THREE.Vector2())) {
      panBy(panVel.x * dt, panVel.y * dt, true);
      panVel.multiplyScalar(Math.pow(0.04, dt));
      if (panVel.length() < 8) {
        panVel.set(0, 0);
        coasting = false;
      }
    }
    if (Math.abs(azimuthTarget - azimuth) > 0.001) {
      azimuth += (azimuthTarget - azimuth) * Math.min(1, dt * 7);
      updateCamera();
    }

    const env = updateLighting();

    ringMat.opacity = 0.45 + Math.sin(time * 4) * 0.3;
    for (let i = 0; i < tiles.length; i++) {
      const info = api.tile(i);
      info.stage = info.s === 'crop' ? (info.ready ? 2 : info.f < 0.3 ? 0 : 1) : -1;
      const sig = `${info.s}|${info.deco}|${info.buyable ? info.price : ''}|${info.crop}|${info.stage}|${info.wet}|${info.weed}|${info.crow}|${info.golden}|${info.tree}|${info.ready}|${info.dormant}|${info.blossom}|${info.young}|${info.heated}|${info.frozen}|${info.active}`;
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
      if (info.s === 'tree' && t.content) {
        const base = info.young ? 0.7 : 1;
        const pulse = t.pulse > 0 ? 1 + Math.sin(t.pulse * Math.PI) * 0.15 : 1;
        t.content.scale.setScalar(base * pulse);
        t.content.rotation.z = info.ready ? Math.sin(time * 2 + i) * 0.03 : 0;
      } else if (t.content && info.s !== 'locked') {
        t.content.scale.set(s, s, s);
        t.content.position.y = lift;
      }
      if (t.heater && info.active) {
        t.heater.userData.puffs.forEach(pf => {
          const k = (time * 0.5 + pf.userData.seed) % 1;
          pf.position.set(-0.1 + Math.sin(time + pf.userData.seed * 6) * 0.05, 0.9 + k * 0.7, -0.1);
          pf.scale.setScalar(0.6 + k * 1.2);
          pf.material.opacity = 0.6 * (1 - k);
        });
        t.heater.userData.grill.scale.y = 1 + Math.sin(time * 9 + i) * 0.15;
      }
      if (t.drop) t.drop.position.y = 0.75 + Math.sin(time * 4 + i) * 0.06;
      if (t.sparkle) t.sparkle.position.y = 0.9 + Math.sin(time * 3 + i) * 0.08;
      if (t.crow) {
        t.crow.position.y = 0.3 + Math.abs(Math.sin(time * 5 + i)) * 0.08;
        t.crow.rotation.y = Math.sin(time * 2 + i) * 0.8;
        t.crow.children[1].position.y = 0.2 - Math.max(0, Math.sin(time * 9 + i)) * 0.05;
      }
    }

    if (seasonShown !== api.season()) applySeason(api.season());
    if (snow.visible) {
      const pos = snowGeo.attributes.position;
      for (let k = 0; k < FLAKES; k++) {
        let y = pos.array[k * 3 + 1] - dt * 1.1;
        if (y < 0) y += 9;
        pos.array[k * 3 + 1] = y;
        pos.array[k * 3] += Math.sin(time + k) * dt * 0.25;
      }
      pos.needsUpdate = true;
    }

    const done = api.projects();
    Object.entries(village).forEach(([id, obj]) => {
      obj.visible = done.includes(id);
    });
    if (village.mill.visible) village.mill.userData.wheel.rotation.x -= dt * 0.8;
    greenhouse.visible = api.greenhouse();
    fishSign.visible = api.fishingReady();
    if (fishSign.visible) fishSign.position.y = 0.85 + Math.sin(time * 2.5) * 0.08;
    animateHelpers(dt, time);

    syncAnimals(api.animals());
    animateAnimals(api.animals(), dt, time);

    const builtProc = api.processors();
    const millFixed = builtProc.includes('grainmill');
    millArms[1].visible = millFixed;
    millArms[3].visible = millFixed;
    if (millFixed) blades.rotation.z -= dt * (api.weather() === 'rain' ? 1.6 : 0.8);
    Object.entries(procBuildings).forEach(([id, b]) => {
      b.visible = builtProc.includes(id);
    });
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
    if (((hit.x - POND.x) / POND.rx) ** 2 + ((hit.z - POND.z) / POND.rz) ** 2 <= 1) return -2;
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
    azimuthTarget = Math.round(azimuthTarget / (Math.PI / 2)) * (Math.PI / 2) + (dir * Math.PI) / 2;
  }

  /* ---------- Touch camera controls ---------- */

  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const groundHit = new THREE.Vector3();

  function groundPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    return raycaster.ray.intersectPlane(groundPlane, groundHit) ? groundHit.clone() : null;
  }

  function clampTarget() {
    const len = Math.hypot(target.x, target.z);
    if (len > MAX_PAN) {
      target.x *= MAX_PAN / len;
      target.z *= MAX_PAN / len;
    }
  }

  // Moves the map so the point under the finger follows the finger.
  function panBy(dx, dy, fromInertia = false) {
    const upp = (camera.right - camera.left) / viewW;
    const right = new THREE.Vector3(Math.cos(azimuth), 0, -Math.sin(azimuth));
    const away = new THREE.Vector3(-Math.sin(azimuth), 0, -Math.cos(azimuth));
    target.addScaledVector(right, -dx * upp).addScaledVector(away, (dy * upp) / Math.sin(ELEV));
    clampTarget();
    updateCamera();
    if (!fromInertia) {
      const now = performance.now();
      const span = Math.max(8, now - lastPanAt) / 1000;
      lastPanAt = now;
      panVel.lerp(new THREE.Vector2(dx / span, dy / span), 0.5);
      coasting = false;
    }
  }

  function zoomAt(factor, clientX, clientY) {
    const before = groundPoint(clientX, clientY);
    zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor));
    updateCamera();
    const after = groundPoint(clientX, clientY);
    if (before && after) {
      target.x += before.x - after.x;
      target.z += before.z - after.z;
      clampTarget();
      updateCamera();
    }
  }

  function rotateBy(angle) {
    azimuth += angle;
    azimuthTarget = azimuth;
    updateCamera();
  }

  function release() {
    coasting = performance.now() - lastPanAt < 80 && panVel.length() > 60;
    if (!coasting) panVel.set(0, 0);
  }

  function stopInertia() {
    coasting = false;
    panVel.set(0, 0);
  }

  function resetView() {
    stopInertia();
    zoom = 1;
    target.set(0, 0, 0);
    azimuthTarget = Math.round(azimuth / (Math.PI / 2)) * (Math.PI / 2);
    updateCamera();
  }

  canvas.addEventListener('webglcontextlost', e => e.preventDefault());

  resize();
  return {
    pick,
    screenPos,
    rotate,
    panBy,
    zoomAt,
    rotateBy,
    release,
    stopInertia,
    resetView,
    get zoom() {
      return zoom;
    },
    resize,
    setActive,
    pulse: i => {
      tiles[i].pulse = 1;
    }
  };
}
