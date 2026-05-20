// @ts-nocheck
(function () {
  'use strict';

  // ─── Config (injected by Liquid into window.cabinetConfig) ────────────────
  const cfg = window.cabinetConfig || {
    widths: [], depths: [], colors: [], variants: [],
  };


  // ─── State ────────────────────────────────────────────────────────────────
  const state = {
    width:      null,
    depth:      null,
    colorId:    null,
    colorLabel: null,
    colorHex:   null,
  };

  // ─── DOM refs (assigned in init) ──────────────────────────────────────────
  let widthSelect, depthSelect, colorSelect, atcBtn, priceEl, atcErrorEl;

  // ─── Three.js refs ────────────────────────────────────────────────────────
  let scene, camera, renderer, cabinetGroup, controls;

  // ─── PBR texture cache ────────────────────────────────────────────────────
  const textures = { mapleColor: null, mapleNormal: null, mapleRoughness: null };

  // ─── PBR texture loader ───────────────────────────────────────────────────
  function loadTextures() {
    const urls = (cfg.textureUrls) || {};
    const loader = new THREE.TextureLoader();
    if (urls.mapleColor)     loader.load(urls.mapleColor,     function(t) { textures.mapleColor = t; });
    if (urls.mapleNormal)    loader.load(urls.mapleNormal,    function(t) { textures.mapleNormal = t; });
    if (urls.mapleRoughness) loader.load(urls.mapleRoughness, function(t) { textures.mapleRoughness = t; });
  }

  // ─── Scene setup (runs once) ──────────────────────────────────────────────
  function initScene(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1c1c);

    const w = canvas.clientWidth  || 480;
    const h = canvas.clientHeight || 560;
    camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 2000);
    camera.position.set(40, 32, 55);
    camera.lookAt(0, 17, 0);

    // Key light — warm, upper front-right, casts soft shadows
    const keyLight = new THREE.DirectionalLight(0xfff5e0, 1.1);
    keyLight.position.set(30, 50, 40);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width  = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Fill light — cooler, upper front-left, no shadows (lifts shadow side)
    const fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.4);
    fillLight.position.set(-30, 40, 30);
    scene.add(fillLight);

    // Ambient base fill
    scene.add(new THREE.AmbientLight(0x505060, 0.6));

    // Ground plane — receives the cabinet's shadow
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshLambertMaterial({ color: 0x141414, transparent: true, opacity: 0.75 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // OrbitControls — lets customer drag to rotate cabinet
    controls = new THREE.OrbitControls(camera, canvas);
    controls.enableDamping  = true;
    controls.dampingFactor  = 0.08;
    controls.enablePan      = false;
    controls.minDistance    = 25;
    controls.maxDistance    = 180;

    // Resize handler
    function onResize() {
      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;
      if (cw === 0 || ch === 0) return;
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);
    onResize();

    // Render loop
    (function animate() {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    }());
  }

  // ─── Cabinet builder ──────────────────────────────────────────────────────
  // Called every time a dropdown changes. Rebuilds all cabinet meshes from
  // scratch to reflect the new width, depth, or colour selection.
  function buildCabinet(widthIn, depthIn, colorHex) {
    if (cabinetGroup) scene.remove(cabinetGroup);
    cabinetGroup = new THREE.Group();

    // Real-world dimensions (inches, 1 unit = 1 inch in Three.js world)
    const W       = widthIn;
    const H       = 34.5;   // fixed overall height
    const D       = depthIn;
    const T       = 0.75;   // wall thickness — 3/4" MDF
    const toeH    = 4.5;    // toe kick height
    const toeRec  = 3.5;    // how far toe kick face is recessed from front

    // Drawer spec (fixed)
    const DRAWER_H = 7.25;
    const GAP      = 0.25;
    const DRAWERS  = 4;

    // Materials — PBR (MeshStandardMaterial)
    const baseColor = new THREE.Color(colorHex);
    const bodyColor = baseColor.clone().multiplyScalar(0.65);

    const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.55, metalness: 0.0 });
    const faceMat = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.25, metalness: 0.0 });
    const pullMat = new THREE.MeshStandardMaterial({ color: 0xc9a96e, roughness: 0.35, metalness: 0.6 });

    // Apply PBR textures for maple finish
    if (state.colorId && state.colorId.toLowerCase() === 'maple') {
      if (textures.mapleColor && textures.mapleNormal && textures.mapleRoughness) {
        [textures.mapleColor, textures.mapleNormal, textures.mapleRoughness].forEach(function(t) {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(W / 12, H / 12);
          t.needsUpdate = true;
        });
        bodyMat.map          = textures.mapleColor;
        bodyMat.normalMap    = textures.mapleNormal;
        bodyMat.roughnessMap = textures.mapleRoughness;
        bodyMat.color.set(0xffffff);
        faceMat.map          = textures.mapleColor;
        faceMat.normalMap    = textures.mapleNormal;
        faceMat.roughnessMap = textures.mapleRoughness;
        faceMat.color.set(0xffffff);
      }
    }

    function box(w, h, d, x, y, z, mat) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow    = true;
      m.receiveShadow = true;
      cabinetGroup.add(m);
    }

    // ── Shell panels ──────────────────────────────────────────────────────
    box(W, T, D,  0,           H - T / 2,   0,           bodyMat); // top
    box(W, T, D,  0,           toeH + T/2,  0,           bodyMat); // bottom (sits above toe kick)
    box(T, H, D, -W/2 + T/2,  H / 2,       0,           bodyMat); // left side
    box(T, H, D,  W/2 - T/2,  H / 2,       0,           bodyMat); // right side
    box(W, H, T,  0,           H / 2,      -D/2 + T/2,  bodyMat); // back

    // ── Toe kick face (recessed from front) ───────────────────────────────
    const toeZ = D / 2 - toeRec + T / 2;
    box(W - 2*T, toeH, T, 0, toeH / 2, toeZ, bodyMat);

    // ── 4 drawer faces + pull handles ─────────────────────────────────────
    const faceDepth = T * 0.5;
    const faceZ     = D / 2;

    for (let i = 0; i < DRAWERS; i++) {
      const y = toeH + i * (DRAWER_H + GAP) + DRAWER_H / 2;

      // Drawer face — sits flush with cabinet front
      box(W - 2*T - 0.125, DRAWER_H - 0.125, faceDepth, 0, y, faceZ, faceMat);

      // Bar handle — horizontal cylinder, gold, protrudes forward
      const handleLen = W * 0.22;
      const handleMesh = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, handleLen, 12),
        pullMat
      );
      handleMesh.rotation.z  = Math.PI / 2;
      handleMesh.position.set(0, y, faceZ + faceDepth / 2 + 0.55);
      handleMesh.castShadow    = true;
      handleMesh.receiveShadow = true;
      cabinetGroup.add(handleMesh);
    }

    scene.add(cabinetGroup);

    // 3/4 product-photography angle — always far enough back to show full cabinet height
    const camZ = Math.max(H * 2.4, D * 3.5);
    camera.position.set(W * 1.3, H * 0.75, camZ);
    if (controls) {
      controls.target.set(0, H * 0.45, 0);
      controls.update();
    } else {
      camera.lookAt(0, H * 0.45, 0);
    }
  }

  // ─── Populate dropdowns from metafield config ─────────────────────────────
  function populateDropdowns() {
    (Array.isArray(cfg.widths) ? cfg.widths : []).forEach(function (item) {
      const opt = document.createElement('option');
      opt.value       = String(item.value);
      opt.textContent = item.label;
      widthSelect.appendChild(opt);
    });

    (Array.isArray(cfg.depths) ? cfg.depths : []).forEach(function (item) {
      const opt = document.createElement('option');
      opt.value       = String(item.value);
      opt.textContent = item.label;
      depthSelect.appendChild(opt);
    });

    (Array.isArray(cfg.colors) ? cfg.colors : []).forEach(function (item) {
      const opt = document.createElement('option');
      opt.value        = item.id;
      opt.textContent  = item.label;
      opt.dataset.hex  = item.hex;
      colorSelect.appendChild(opt);
    });
  }

  // ─── Find the Shopify variant matching current selections ─────────────────
  // Shopify option1/option2 are strings; state.width/depth are numbers — use ==
  function findVariant() {
    if (!state.width || !state.depth || !state.colorId) return null;
    var colorId = state.colorId; // capture before callback so null-check holds
    return (cfg.variants || []).find(/** @param {{ option1: string, option2: string, option3: string, price: number, id: number }} v */ function (v) {
      return String(v.option1) == String(state.width)  &&
             String(v.option2) == String(state.depth)  &&
             v.option3.toLowerCase() === colorId.toLowerCase();
    }) || null;
  }

  // ─── Price from variant (Shopify stores cents as integers) ────────────────
  function calculatePrice() {
    var v = findVariant();
    return v ? v.price / 100 : null;
  }

  // ─── Update right-panel spec display ──────────────────────────────────────
  function updateSpec() {
    document.getElementById('spec-width').textContent = state.width  ? state.width  + '″' : '—';
    document.getElementById('spec-depth').textContent = state.depth  ? state.depth  + '″' : '—';
    document.getElementById('spec-color').textContent = state.colorLabel || '—';
  }

  // ─── Update price display ─────────────────────────────────────────────────
  function updatePrice() {
    const price = calculatePrice();
    priceEl.textContent = price !== null
      ? '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : '—';
  }

  // ─── Dropdown change handler ──────────────────────────────────────────────
  function onSelectChange() {
    const rawW     = parseInt(widthSelect.value, 10);
    const rawD     = parseInt(depthSelect.value, 10);
    const colorOpt = colorSelect.options[colorSelect.selectedIndex];

    state.width      = isNaN(rawW)            ? null : rawW;
    state.depth      = isNaN(rawD)            ? null : rawD;
    state.colorId    = colorSelect.value      || null;
    state.colorLabel = (colorOpt && colorOpt.value) ? colorOpt.textContent        : null;
    state.colorHex   = (colorOpt && colorOpt.value) ? colorOpt.dataset.hex || null : null;

    var w = state.width  || (cfg.widths[0]  && cfg.widths[0].value)  || 24;
    var d = state.depth  || (cfg.depths[0]  && cfg.depths[0].value)  || 12;
    buildCabinet(w, d, state.colorHex || '#888888');

    updateSpec();
    updatePrice();
    atcBtn.disabled = !findVariant();
  }

  // ─── Add to Cart ──────────────────────────────────────────────────────────
  function addToCart() {
    var v     = findVariant();
    var price = v ? v.price / 100 : null;
    if (!v || price === null) return;

    atcBtn.disabled    = true;
    atcBtn.textContent = 'Adding…';
    atcErrorEl.hidden  = true;

    fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:       v.id,
        quantity: 1,
        properties: {
          '_cabinet_width':        state.width,
          '_cabinet_depth':        state.depth,
          '_cabinet_height':       34.5,
          '_cabinet_color':        state.colorId,
          '_cabinet_color_label':  state.colorLabel,
          '_cabinet_drawer_count': 4,
          '_cabinet_price':        price.toFixed(2),
        },
      }),
    })
      .then(function (res) {
        if (!res.ok) return res.json().then(function (err) { throw err; });
        return res.json();
      })
      .then(function () {
        window.location.href = '/cart';
      })
      .catch(function (err) {
        atcErrorEl.textContent = err.description || err.message || 'Could not add to cart. Please try again.';
        atcErrorEl.hidden      = false;
        atcBtn.disabled        = false;
        atcBtn.textContent     = 'Add to Cart';
      });
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    const section = document.getElementById('cabinet-configurator');
    if (!cfg.variants || cfg.variants.length === 0) {
      section.innerHTML = '<p style="padding:40px;color:#888;text-align:center">No cabinet product assigned to this section, or product has no variants.</p>';
      return;
    }

    widthSelect  = document.getElementById('cab-select-width');
    depthSelect  = document.getElementById('cab-select-depth');
    colorSelect  = document.getElementById('cab-select-color');
    atcBtn       = document.getElementById('cab-atc');
    priceEl      = document.getElementById('cab-price');
    atcErrorEl   = document.getElementById('cab-atc-error');

    const canvas = document.getElementById('cc-canvas');
    if (!canvas) return;

    initScene(canvas);
    loadTextures();
    populateDropdowns();

    // Render a neutral grey cabinet immediately so the canvas is never blank
    var defaultW = (cfg.widths[0] && cfg.widths[0].value) ? cfg.widths[0].value : 24;
    var defaultD = (cfg.depths[0] && cfg.depths[0].value) ? cfg.depths[0].value : 18;
    buildCabinet(defaultW, defaultD, '#888888');

    [widthSelect, depthSelect, colorSelect].forEach(function (el) {
      el.addEventListener('change', onSelectChange);
    });
    atcBtn.addEventListener('click', addToCart);
  }

  document.addEventListener('DOMContentLoaded', init);
}());
