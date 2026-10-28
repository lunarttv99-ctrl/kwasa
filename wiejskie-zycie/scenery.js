import * as THREE from './vendor/three.module.min.js';

// Scenery and ambient life around the farm: rolling terrain, forest belt,
// meadow grass and flowers, animated pond, ducks, butterflies, fireflies,
// autumn leaves, birds, chimney smoke, lamps, props and particle bursts.

const BASE_Y = -0.14;

function smoothstep(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

export function terrainHeight(x, z) {
  const r = Math.hypot(x, z);
  const rise = smoothstep(11, 18, r);
  if (!rise) return 0;
  const n = Math.sin(x * 0.21) + Math.sin(z * 0.17 + 1.3) + Math.sin((x + z) * 0.11) * 1.5 + Math.sin(x * 0.6 + z * 0.4) * 0.3;
  return Math.max(0, rise * (1.1 + n * 0.8) * (0.6 + 0.6 * smoothstep(18, 42, r)));
}

const groundY = (x, z) => BASE_Y + terrainHeight(x, z);

function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createTerrain() {
  const geo = new THREE.PlaneGeometry(120, 120, 96, 96);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  for (let k = 0; k < pos.count; k++) {
    const x = pos.getX(k);
    const z = pos.getZ(k);
    const h = terrainHeight(x, z);
    pos.setY(k, h);
    const patch = 0.5 + 0.5 * Math.sin(x * 0.33 + Math.sin(z * 0.27) * 2.2);
    const shade = 0.86 + patch * 0.14 + Math.min(0.06, h * 0.02);
    colors.set([shade, shade * 1.02, shade * 0.97], k * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const material = new THREE.MeshLambertMaterial({ color: '#7cb342', vertexColors: true, flatShading: true });
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.y = BASE_Y;
  mesh.receiveShadow = true;
  return mesh;
}

// Blocked areas: the field, buildings, pond — used to keep scenery out of the way.
export function makeBlocker(rects, ellipses) {
  return (x, z, pad = 0) =>
    rects.some(([x0, z0, x1, z1]) => x > x0 - pad && x < x1 + pad && z > z0 - pad && z < z1 + pad) ||
    ellipses.some(([cx, cz, rx, rz]) => ((x - cx) / (rx + pad)) ** 2 + ((z - cz) / (rz + pad)) ** 2 < 1);
}

export function createForest(pineMats, trunkMat, quality) {
  const r = rng(99);
  const count = quality === 'low' ? 90 : 170;
  const crowns = [0.62, 0.5, 0.36].map((rad, k) => {
    return new THREE.InstancedMesh(new THREE.ConeGeometry(rad, 0.8 - k * 0.12, 6), pineMats[k], count);
  });
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.09, 0.12, 0.5, 5), trunkMat, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const ang = r() * Math.PI * 2;
    const rad = 15 + r() * 22;
    const x = Math.cos(ang) * rad;
    const z = Math.sin(ang) * rad;
    const scale = 1.3 + r() * 1.6;
    const y = groundY(x, z);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), r() * 6);
    s.setScalar(scale);
    p.set(x, y + 0.25 * scale, z);
    trunks.setMatrixAt(i, m.compose(p, q, s));
    [0.62, 0.9, 1.16].forEach((h, k) => {
      p.set(x, y + h * scale, z);
      crowns[k].setMatrixAt(i, m.compose(p, q, s));
    });
  }
  const g = new THREE.Group();
  g.add(trunks, ...crowns);
  return g;
}

export function createMeadow(grassMat, blocked, quality) {
  const r = rng(7);
  const grassCount = quality === 'low' ? 700 : 1600;
  const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(0.035, 0.18, 3), grassMat, grassCount);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  let placed = 0;
  for (let tries = 0; placed < grassCount && tries < grassCount * 6; tries++) {
    const x = (r() - 0.5) * 34;
    const z = (r() - 0.5) * 34;
    if (blocked(x, z, 0.2)) continue;
    q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.5, r() * 6, (r() - 0.5) * 0.5));
    s.setScalar(0.7 + r() * 0.8);
    p.set(x, groundY(x, z) + 0.06, z);
    grass.setMatrixAt(placed++, m.compose(p, q, s));
  }
  grass.count = placed;

  const flowerColors = ['#ff6f91', '#ffd54f', '#ffffff', '#b388ff', '#ff8a65', '#4fc3f7'].map(c => new THREE.Color(c));
  const flowerCount = quality === 'low' ? 140 : 320;
  const flowers = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.05, 0), new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), flowerCount);
  placed = 0;
  for (let tries = 0; placed < flowerCount && tries < flowerCount * 8; tries++) {
    const cluster = Math.floor(r() * 14);
    const cr = rng(cluster * 31 + 3);
    const cx = (cr() - 0.5) * 30;
    const cz = (cr() - 0.5) * 30;
    const x = cx + (r() - 0.5) * 2.2;
    const z = cz + (r() - 0.5) * 2.2;
    if (blocked(x, z, 0.3)) continue;
    s.setScalar(0.8 + r() * 0.6);
    p.set(x, groundY(x, z) + 0.06, z);
    flowers.setMatrixAt(placed, m.compose(p, q.identity(), s));
    flowers.setColorAt(placed++, flowerColors[cluster % flowerColors.length]);
  }
  flowers.count = placed;
  return { grass, flowers };
}

export function createWater(pond) {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color('#2f7fbf') },
      uShallow: { value: new THREE.Color('#86d6f7') },
      uLight: { value: 1 }
    },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform float uTime; uniform vec3 uDeep; uniform vec3 uShallow; uniform float uLight; varying vec2 vUv;
      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float r = length(p);
        float w = sin(p.x * 9.0 + uTime * 1.3) * sin(p.y * 11.0 - uTime * 1.1) * 0.5 + 0.5;
        float ripple = smoothstep(0.93, 1.0, sin(r * 15.0 - uTime * 1.8) * 0.5 + 0.5) * (1.0 - r);
        vec3 c = mix(uDeep, uShallow, smoothstep(0.1, 1.0, r) * 0.75 + w * 0.12);
        c += ripple * 0.18 + pow(w, 8.0) * 0.18;
        c = mix(c, vec3(1.0), smoothstep(0.9, 1.0, r) * 0.4);
        gl_FragColor = vec4(c * uLight, 1.0);
        #include <colorspace_fragment>
      }`
  });
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 40), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(pond.x, BASE_Y + 0.035, pond.z);
  mesh.scale.set(pond.rx, pond.rz, 1);
  return { mesh, update: (time, light) => { material.uniforms.uTime.value = time; material.uniforms.uLight.value = light; } };
}

const lambert = color => new THREE.MeshLambertMaterial({ color, flatShading: true });

export function createDucks(pond) {
  const group = new THREE.Group();
  const ducks = [0, 1].map(k => {
    const d = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), lambert(k ? '#8d6e4a' : '#f5f5f0'));
    body.scale.set(0.9, 0.7, 1.3);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), lambert(k ? '#6d4c2f' : '#2e7d32'));
    head.position.set(0, 0.11, 0.11);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 4), lambert('#ff9800'));
    beak.rotation.x = Math.PI / 2;
    beak.position.set(0, 0.1, 0.19);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.09, 4), lambert(k ? '#8d6e4a' : '#f5f5f0'));
    tail.rotation.x = -1.1;
    tail.position.set(0, 0.05, -0.14);
    d.add(body, head, beak, tail);
    d.castShadow = true;
    group.add(d);
    return d;
  });
  return {
    group,
    update(time) {
      ducks.forEach((d, k) => {
        const a = time * (0.25 + k * 0.07) + k * 2.5;
        d.position.set(pond.x + Math.cos(a) * pond.rx * 0.55, BASE_Y + 0.06 + Math.sin(time * 3 + k) * 0.01, pond.z + Math.sin(a) * pond.rz * 0.5);
        d.rotation.y = -a + Math.PI;
      });
    }
  };
}

export function createButterflies(blocked) {
  const r = rng(5);
  const colors = ['#ffd54f', '#ffffff', '#ff8a65', '#4fc3f7', '#f48fb1', '#ce93d8'];
  const group = new THREE.Group();
  const wingGeo = new THREE.PlaneGeometry(0.15, 0.11);
  wingGeo.translate(0.075, 0, 0);
  const list = colors.map((c, k) => {
    const b = new THREE.Group();
    const m = new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide });
    const left = new THREE.Mesh(wingGeo, m);
    const right = new THREE.Mesh(wingGeo, m);
    right.scale.x = -1;
    b.add(left, right, new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 4), lambert('#3e2a14')));
    b.children[2].rotation.x = Math.PI / 2;
    let ax;
    let az;
    do {
      ax = (r() - 0.5) * 18;
      az = (r() - 0.5) * 18;
    } while (blocked(ax, az, 0.5));
    b.userData = { ax, az, ph: r() * 10, sp: 0.6 + r() * 0.5, wings: [left, right] };
    group.add(b);
    return b;
  });
  return {
    group,
    update(time, visible) {
      group.visible = visible;
      if (!visible) return;
      list.forEach(b => {
        const u = b.userData;
        const t = time * u.sp + u.ph;
        b.position.set(u.ax + Math.sin(t) * 1.2, 0.45 + Math.sin(t * 2.3) * 0.2, u.az + Math.cos(t * 0.8) * 1.2);
        b.rotation.y = -t + Math.PI / 2;
        const flap = Math.sin(time * 18 + u.ph) * 1.1;
        u.wings[0].rotation.y = flap;
        u.wings[1].rotation.y = -flap;
      });
    }
  };
}

function glowTexture(inner, outer = 'rgba(0,0,0,0)') {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, inner);
  g.addColorStop(1, outer);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createFireflies(blocked) {
  const r = rng(11);
  const count = 45;
  const pos = new Float32Array(count * 3);
  const seeds = [];
  for (let k = 0; k < count; k++) {
    let x;
    let z;
    do {
      x = (r() - 0.5) * 20;
      z = (r() - 0.5) * 20;
    } while (blocked(x, z, 0.2));
    seeds.push({ x, z, ph: r() * 10 });
    pos.set([x, 0.5, z], k * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const material = new THREE.PointsMaterial({
    size: 14, sizeAttenuation: false, map: glowTexture('rgba(230,255,140,1)'), transparent: true,
    depthWrite: false, blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  return {
    points,
    update(time, visible) {
      points.visible = visible;
      if (!visible) return;
      seeds.forEach((sd, k) => {
        pos[k * 3] = sd.x + Math.sin(time * 0.4 + sd.ph) * 0.8;
        pos[k * 3 + 1] = 0.35 + Math.sin(time * 0.9 + sd.ph * 2) * 0.25;
        pos[k * 3 + 2] = sd.z + Math.cos(time * 0.35 + sd.ph) * 0.8;
      });
      geo.attributes.position.needsUpdate = true;
      material.opacity = 0.65 + Math.sin(time * 3) * 0.3;
    }
  };
}

export function createLeaves() {
  const r = rng(13);
  const group = new THREE.Group();
  const geo = new THREE.PlaneGeometry(0.1, 0.07);
  const mats = ['#e0892e', '#d04a2a', '#f2b134', '#a1541c'].map(c => new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
  const leaves = Array.from({ length: 50 }, (_, k) => {
    const leaf = new THREE.Mesh(geo, mats[k % mats.length]);
    leaf.userData = { x: (r() - 0.5) * 18, z: (r() - 0.5) * 18, y: r() * 6, ph: r() * 10, sp: 0.4 + r() * 0.4 };
    group.add(leaf);
    return leaf;
  });
  return {
    group,
    update(dt, time, visible) {
      group.visible = visible;
      if (!visible) return;
      leaves.forEach(l => {
        const u = l.userData;
        u.y -= dt * u.sp;
        if (u.y < 0) u.y += 6;
        l.position.set(u.x + Math.sin(time + u.ph) * 0.6, u.y, u.z + Math.cos(time * 0.7 + u.ph) * 0.4);
        l.rotation.set(time * 2 + u.ph, time * 1.3, time + u.ph);
      });
    }
  };
}

export function createBirds() {
  const group = new THREE.Group();
  const m = lambert('#2d2a32');
  const birds = Array.from({ length: 5 }, (_, k) => {
    const b = new THREE.Group();
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 0.07), m);
    const right = left.clone();
    left.position.x = -0.14;
    right.position.x = 0.14;
    b.add(left, right);
    b.userData = { wings: [left, right], off: new THREE.Vector3(-Math.abs(k - 2) * 0.5, Math.abs(k - 2) * 0.1, (k - 2) * 0.45) };
    group.add(b);
    return b;
  });
  let cycle = 0;
  return {
    group,
    update(dt, time, visible) {
      cycle += dt;
      const t = (cycle % 45) / 12;
      group.visible = visible && t < 1;
      if (!group.visible) return;
      const x = -22 + t * 44;
      birds.forEach((b, k) => {
        b.position.set(x + b.userData.off.x, 6 + b.userData.off.y, -4 + b.userData.off.z + Math.sin(time + k) * 0.1);
        b.rotation.y = -Math.PI / 2;
        const flap = Math.sin(time * 9 + k) * 0.5;
        b.userData.wings[0].rotation.z = flap;
        b.userData.wings[1].rotation.z = -flap;
      });
    }
  };
}

export function createSmoke(origin) {
  const group = new THREE.Group();
  const puffs = Array.from({ length: 7 }, (_, k) => {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12, 0), new THREE.MeshLambertMaterial({ color: '#e8e8e8', transparent: true, opacity: 0.6, depthWrite: false, flatShading: true }));
    puff.userData.seed = k / 7;
    group.add(puff);
    return puff;
  });
  return {
    group,
    update(time, strength) {
      puffs.forEach(p => {
        const k = (time * 0.25 + p.userData.seed) % 1;
        p.position.set(origin.x + Math.sin(time * 0.8 + p.userData.seed * 9) * 0.15 + k * 0.5, origin.y + k * 1.8, origin.z + k * 0.2);
        p.scale.setScalar(0.6 + k * 2.2);
        p.material.opacity = (1 - k) * 0.55 * strength;
        p.visible = strength > 0;
      });
    }
  };
}

export function createLamp() {
  const g = new THREE.Group();
  const iron = lambert('#3a3a44');
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 1.3, 6), iron);
  pole.position.y = 0.65;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.18), new THREE.MeshLambertMaterial({ color: '#4a4a52', emissive: '#ffcf6a', emissiveIntensity: 0 }));
  head.position.y = 1.38;
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.14, 4), iron);
  cap.position.y = 1.55;
  cap.rotation.y = Math.PI / 4;
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,210,120,0.9)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(1.6, 1.6, 1);
  halo.position.y = 1.38;
  pole.castShadow = true;
  g.add(pole, head, cap, halo);
  return {
    group: g,
    set(on) {
      head.material.emissiveIntensity = on ? 1.4 : 0;
      halo.visible = on;
    }
  };
}

export function createHayBale() {
  const g = new THREE.Group();
  const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.5, 12), lambert('#e3c16f'));
  bale.rotation.z = Math.PI / 2;
  bale.position.y = 0.32;
  bale.castShadow = true;
  [-0.25, 0.25].forEach(x => {
    const end = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.02, 12), lambert('#f0d48a'));
    end.rotation.z = Math.PI / 2;
    end.position.set(x + Math.sign(x) * 0.005, 0.32, 0);
    g.add(end);
  });
  g.add(bale);
  return g;
}

export function createLogPile() {
  const g = new THREE.Group();
  const bark = lambert('#7a5230');
  const cut = lambert('#d9b27c');
  [[0, 0.1, 0], [0.22, 0.1, 0], [-0.22, 0.1, 0], [0.11, 0.29, 0], [-0.11, 0.29, 0], [0, 0.47, 0]].forEach(([x, y, z]) => {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 7), bark);
    log.rotation.x = Math.PI / 2;
    log.position.set(x, y, z);
    log.castShadow = true;
    const end = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.02, 7), cut);
    end.rotation.x = Math.PI / 2;
    end.position.set(x, y, 0.41);
    g.add(log, end);
  });
  return g;
}

export function createCart() {
  const g = new THREE.Group();
  const wood = lambert('#a8743f');
  const bed = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.12, 0.6), wood);
  bed.position.y = 0.42;
  bed.castShadow = true;
  g.add(bed);
  [[0, 0.3], [0, -0.3]].forEach(([x, z]) => {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.04), wood);
    side.position.set(x, 0.56, z);
    g.add(side);
  });
  [[-0.3, 0.34], [-0.3, -0.34], [0.3, 0.34], [0.3, -0.34]].forEach(([x, z]) => {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 10), lambert('#5d3a1a'));
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(x, 0.2, z);
    g.add(wheel);
  });
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 0.04), wood);
  handle.position.set(0.75, 0.38, 0);
  handle.rotation.z = -0.25;
  g.add(handle);
  [[0.1, 0.55, 0.05, '#ff8c1a'], [-0.2, 0.55, -0.1, '#ff8c1a'], [-0.05, 0.6, 0.12, '#e53935']].forEach(([x, y, z, c]) => {
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), lambert(c));
    fruit.position.set(x, y, z);
    fruit.scale.y = 0.8;
    g.add(fruit);
  });
  return g;
}

// Particle bursts (harvest confetti, soil, water drops, gold sparkles)
export function createBursts(quality) {
  const max = quality === 'low' ? 80 : 220;
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), max);
  mesh.frustumCulled = false;
  const parts = Array.from({ length: max }, () => ({ life: 0, p: new THREE.Vector3(), v: new THREE.Vector3(), rot: 0, size: 1 }));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  for (let k = 0; k < max; k++) mesh.setMatrixAt(k, hidden);
  mesh.setColorAt(0, new THREE.Color('#ffffff'));
  let cursor = 0;
  const color = new THREE.Color();
  return {
    mesh,
    emit(origin, colors, count = 16, { up = 2.4, spread = 1.4, size = 1 } = {}) {
      for (let n = 0; n < count; n++) {
        const part = parts[cursor];
        part.life = 0.7 + Math.random() * 0.5;
        part.p.copy(origin);
        part.v.set((Math.random() - 0.5) * spread, up * (0.6 + Math.random() * 0.6), (Math.random() - 0.5) * spread);
        part.rot = Math.random() * 6;
        part.size = size * (0.7 + Math.random() * 0.6);
        mesh.setColorAt(cursor, color.set(colors[n % colors.length]));
        cursor = (cursor + 1) % max;
      }
      mesh.instanceColor.needsUpdate = true;
    },
    update(dt) {
      let any = false;
      parts.forEach((part, k) => {
        if (part.life <= 0) return;
        any = true;
        part.life -= dt;
        part.v.y -= 7 * dt;
        part.p.addScaledVector(part.v, dt);
        part.rot += dt * 8;
        if (part.life <= 0 || part.p.y < BASE_Y) {
          part.life = 0;
          mesh.setMatrixAt(k, hidden);
          return;
        }
        q.setFromEuler(new THREE.Euler(part.rot, part.rot * 0.7, 0));
        s.setScalar(part.size * Math.min(1, part.life * 2.5));
        mesh.setMatrixAt(k, m.compose(part.p, q, s));
      });
      if (any) mesh.instanceMatrix.needsUpdate = true;
    }
  };
}

export { glowTexture, groundY };
