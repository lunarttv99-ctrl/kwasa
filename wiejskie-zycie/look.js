import * as THREE from './vendor/three.module.min.js';
import { RoundedBoxGeometry } from './vendor/addons/geometries/RoundedBoxGeometry.js';
import { Sky } from './vendor/addons/objects/Sky.js';
import { EffectComposer } from './vendor/addons/postprocessing/EffectComposer.js';
import { RenderPass } from './vendor/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './vendor/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from './vendor/addons/postprocessing/OutputPass.js';
import { ShaderPass } from './vendor/addons/postprocessing/ShaderPass.js';

// Rendering style shared by farm3d.js and scenery.js: physically based
// materials lit by a scattering sky, rounded geometry, procedural surface
// textures and a cinematic post-processing chain (bloom + colour grade).

let pbr = true;
let anisotropy = 4;

export function setLook(quality, renderer) {
  pbr = quality !== 'low';
  if (renderer) anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
}

export const isPBR = () => pbr;

/* ---------- Procedural textures ---------- */

function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const grey = v => {
  const c = Math.max(0, Math.min(255, Math.round(v)));
  return `rgb(${c},${c},${c})`;
};

// Draws at (x, y) and at the wrapped copies so the texture tiles seamlessly.
function wrapped(size, x, y, draw) {
  for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) draw(x + ox, y + oy);
}

const PAINTERS = {
  grass(ctx, n, r) {
    ctx.fillStyle = grey(232);
    ctx.fillRect(0, 0, n, n);
    for (let k = 0; k < 2600; k++) {
      const x = r() * n;
      const y = r() * n;
      const len = 3 + r() * 7;
      const a = -Math.PI / 2 + (r() - 0.5) * 1.2;
      ctx.strokeStyle = grey(190 + r() * 65);
      ctx.lineWidth = 1 + r() * 1.2;
      wrapped(n, x, y, (px, py) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
        ctx.stroke();
      });
    }
  },
  soil(ctx, n, r) {
    ctx.fillStyle = grey(225);
    ctx.fillRect(0, 0, n, n);
    for (let row = 0; row < 5; row++) {
      const y = (row + 0.5) * (n / 5);
      const g = ctx.createLinearGradient(0, y - n / 10, 0, y + n / 10);
      g.addColorStop(0, 'rgba(0,0,0,0.16)');
      g.addColorStop(0.5, 'rgba(255,255,255,0.12)');
      g.addColorStop(1, 'rgba(0,0,0,0.16)');
      ctx.fillStyle = g;
      ctx.fillRect(0, y - n / 10, n, n / 5);
    }
    for (let k = 0; k < 1800; k++) {
      const x = r() * n;
      const y = r() * n;
      const s = 0.6 + r() * 2.2;
      ctx.fillStyle = grey(150 + r() * 105);
      wrapped(n, x, y, (px, py) => ctx.fillRect(px, py, s, s));
    }
    for (let k = 0; k < 40; k++) {
      const x = r() * n;
      const y = r() * n;
      const s = 2 + r() * 3;
      ctx.fillStyle = grey(245);
      wrapped(n, x, y, (px, py) => {
        ctx.beginPath();
        ctx.ellipse(px, py, s, s * 0.7, r() * 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  },
  planks(ctx, n, r) {
    const boards = 6;
    const w = n / boards;
    for (let b = 0; b < boards; b++) {
      ctx.fillStyle = grey(222 + r() * 30);
      ctx.fillRect(b * w, 0, w, n);
      for (let k = 0; k < 26; k++) {
        ctx.strokeStyle = grey(185 + r() * 40);
        ctx.lineWidth = 0.6 + r();
        const x = b * w + 3 + r() * (w - 6);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.bezierCurveTo(x + (r() - 0.5) * 4, n * 0.3, x + (r() - 0.5) * 4, n * 0.7, x, n);
        ctx.stroke();
      }
      ctx.fillStyle = grey(110);
      ctx.fillRect(b * w, 0, 2, n);
      if (r() < 0.6) {
        ctx.fillStyle = grey(160);
        ctx.beginPath();
        ctx.ellipse(b * w + w / 2, r() * n, 2.5, 4, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },
  shingles(ctx, n, r) {
    const rows = 8;
    const h = n / rows;
    const w = n / 6;
    for (let row = 0; row < rows; row++) {
      for (let c = -1; c < 7; c++) {
        const x = c * w + (row % 2 ? w / 2 : 0);
        ctx.fillStyle = grey(205 + r() * 45);
        ctx.fillRect(x + 1, row * h, w - 2, h);
        ctx.fillStyle = 'rgba(0,0,0,0.28)';
        ctx.fillRect(x + 1, row * h + h - 3, w - 2, 3);
      }
    }
  },
  wood(ctx, n, r) {
    ctx.fillStyle = grey(225);
    ctx.fillRect(0, 0, n, n);
    for (let k = 0; k < 90; k++) {
      ctx.strokeStyle = grey(175 + r() * 60);
      ctx.lineWidth = 0.8 + r() * 1.5;
      const y = r() * n;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(n * 0.3, y + (r() - 0.5) * 6, n * 0.7, y + (r() - 0.5) * 6, n, y);
      ctx.stroke();
    }
  },
  noise(ctx, n, r) {
    ctx.fillStyle = grey(236);
    ctx.fillRect(0, 0, n, n);
    for (let k = 0; k < 1400; k++) {
      const x = r() * n;
      const y = r() * n;
      const s = 1 + r() * 3;
      ctx.fillStyle = grey(200 + r() * 55);
      wrapped(n, x, y, (px, py) => ctx.fillRect(px, py, s, s));
    }
  }
};

const textures = new Map();

export function surfaceTexture(name, repeat = 1) {
  const key = `${name}|${repeat}`;
  let tex = textures.get(key);
  if (tex) return tex;
  const n = name === 'grass' ? 512 : 256;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  PAINTERS[name](c.getContext('2d'), n, rng(name.length * 977 + 11));
  tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  tex.anisotropy = anisotropy;
  textures.set(key, tex);
  return tex;
}

/* ---------- Materials ---------- */

const ROUGH = { planks: 0.95, shingles: 0.85, soil: 1, grass: 1, wood: 0.92 };

// One factory for every lit surface: PBR on high quality, Lambert on low.
export function surface(color, opts = {}) {
  const { tex, repeat, bump = 0.6, ...rest } = opts;
  const params = { color, ...rest };
  if (tex) {
    params.map = surfaceTexture(tex, repeat);
    params.bumpMap = params.map;
    params.bumpScale = bump;
  }
  if (pbr) {
    return new THREE.MeshStandardMaterial({
      roughness: tex ? ROUGH[tex] ?? 0.9 : 0.9,
      metalness: 0,
      ...params
    });
  }
  delete params.roughness;
  delete params.metalness;
  return new THREE.MeshLambertMaterial(params);
}

/* ---------- Rounded geometry ---------- */

export function roundedBox(w, h, d) {
  const radius = Math.min(0.07, Math.min(w, h, d) * 0.28);
  if (radius < 0.004) return new THREE.BoxGeometry(w, h, d);
  return new RoundedBoxGeometry(w, h, d, pbr ? 3 : 2, radius);
}

/* ---------- Sky lighting (image based) ---------- */

export function createSkyLight(renderer, scene) {
  if (!pbr) return { update() {} };
  const pmrem = new THREE.PMREMGenerator(renderer);
  const skyScene = new THREE.Scene();
  const sky = new Sky();
  sky.scale.setScalar(50);
  skyScene.add(sky);
  const u = sky.material.uniforms;
  u.mieCoefficient.value = 0.005;
  u.mieDirectionalG.value = 0.8;
  const sunDir = new THREE.Vector3();
  let target = null;
  let lastKey = '';
  let lastAt = -1e9;

  return {
    // elevation: sun height above the horizon in radians (negative at night)
    update(elevation, azimuth, weather, now) {
      const key = `${Math.round(elevation * 30)}|${Math.round(azimuth * 6)}|${weather}`;
      if (key === lastKey || now - lastAt < 900) return;
      lastKey = key;
      lastAt = now;
      const overcast = weather === 'sunny' ? 0 : weather === 'cloudy' ? 0.5 : 1;
      u.turbidity.value = 3 + overcast * 12;
      u.rayleigh.value = 1.6 - overcast * 0.9;
      sunDir.setFromSphericalCoords(1, Math.PI / 2 - elevation, azimuth);
      u.sunPosition.value.copy(sunDir);
      const next = pmrem.fromScene(skyScene, 0, 0.1, 100);
      scene.environment = next.texture;
      if (target) target.dispose();
      target = next;
    }
  };
}

/* ---------- Post-processing ---------- */

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: 0.32 },
    uSaturation: { value: 1.05 },
    uContrast: { value: 1.1 },
    uWarm: { value: 0.025 }
  },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uVignette; uniform float uSaturation; uniform float uContrast; uniform float uWarm;
    varying vec2 vUv;
    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec3 c = tex.rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSaturation);
      c = (c - 0.5) * uContrast + 0.5;
      c += vec3(uWarm, uWarm * 0.4, -uWarm);
      vec2 d = vUv - 0.5;
      c *= 1.0 - uVignette * smoothstep(0.25, 0.85, length(d * vec2(1.0, 1.15)) * 1.25);
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), tex.a);
    }`
};

export function createPost(renderer, scene, camera) {
  if (!pbr) return null;
  try {
    const size = renderer.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x || 1, size.y || 1, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(renderer, target);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.3, 0.5, 0.9);
    // A single NaN/Inf pixel would be smeared across the whole screen by the
    // blur, so the bright-pass drops non-finite values and clamps the rest.
    const hp = bloom.materialHighPassFilter;
    hp.fragmentShader = hp.fragmentShader.replace(
      'vec4 texel = texture2D( tDiffuse, vUv );',
      `vec4 texel = texture2D( tDiffuse, vUv );
      if (any(isnan(texel)) || any(isinf(texel)) || !(texel.r < 1e4 && texel.g < 1e4 && texel.b < 1e4)) texel = vec4(0.0);
      texel.rgb = min(texel.rgb, vec3(12.0));`
    );
    hp.needsUpdate = true;
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const grade = new ShaderPass(GradeShader);
    composer.addPass(grade);
    return {
      render: () => composer.render(),
      bloom,
      grade,
      setSize(w, h) {
        composer.setPixelRatio(renderer.getPixelRatio());
        composer.setSize(w, h);
      },
      setMood(night, wet) {
        bloom.strength = night ? 0.6 : wet ? 0.15 : 0.2;
        bloom.threshold = night ? 0.55 : 1.05;
        grade.uniforms.uSaturation.value = wet ? 0.95 : 1.05;
        grade.uniforms.uWarm.value = night ? -0.015 : wet ? 0 : 0.025;
        grade.uniforms.uVignette.value = night ? 0.45 : 0.32;
      }
    };
  } catch (err) {
    console.warn('Post-processing unavailable', err);
    return null;
  }
}
