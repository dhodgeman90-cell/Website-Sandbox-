(function () {
  'use strict';

  // ─── Config (injected by Liquid into window.cabinetConfig) ────────────────
  const cfg = window.cabinetConfig || {
    widths: [], depths: [], colors: [], basePrice: 0, variantId: 0,
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
  let scene, camera, renderer, cabinetGroup;

  // ─── Scene setup (runs once) ──────────────────────────────────────────────
  function initScene(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1c1c1c);

    const w = canvas.clientWidth  || 480;
    const h = canvas.clientHeight || 560;
    camera = new THREE.PerspectiveCamera(35, w / h, 0.1, 2000);
    camera.position.set(20, 28, 50);
    camera.lookAt(0, 17, 0);

    // Warm directional light — casts shadows, positioned upper-front-right
    const dirLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    dirLight.position.set(30, 50, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width  = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Soft ambient fill
    scene.add(new THREE.AmbientLight(0x606060, 0.8));

    // Ground plane — receives the cabinet's shadow
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(600, 600),
      new THREE.MeshLambertMaterial({ color: 0x141414, transparent: true, opacity: 0.75 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

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

    // Materials
    const baseColor  = new THREE.Color(colorHex);
    const bodyColor  = baseColor.clone().multiplyScalar(0.70);

    const bodyMat = new THREE.MeshPhongMaterial({ color: bodyColor, shininess: 30 });
    const faceMat = new THREE.MeshPhongMaterial({ color: baseColor, shininess: 70 });
    const pullMat = new THREE.MeshPhongMaterial({ color: 0xc9a96e,  shininess: 120 });

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

      // Pull handle — centred on drawer, protrudes forward
      box(W * 0.15, 0.45, 0.45, 0, y, faceZ + faceDepth / 2 + 0.35, pullMat);
    }

    scene.add(cabinetGroup);

    // Reposition camera so the cabinet fills the canvas at this size
    camera.position.set(W * 0.78, H * 0.88, D * 2.9);
    camera.lookAt(0, H / 2, 0);
  }

  // ─── Populate dropdowns from metafield config ─────────────────────────────
  function populateDropdowns() {
    cfg.widths.forEach(function (item) {
      const opt = document.createElement('option');
      opt.value       = item.value;
      opt.textContent = item.label;
      widthSelect.appendChild(opt);
    });

    cfg.depths.forEach(function (item) {
      const opt = document.createElement('option');
      opt.value       = item.value;
      opt.textContent = item.label;
      depthSelect.appendChild(opt);
    });

    cfg.colors.forEach(function (item) {
      const opt = document.createElement('option');
      opt.value        = item.id;
      opt.textContent  = item.label;
      opt.dataset.hex  = item.hex;
      colorSelect.appendChild(opt);
    });
  }

  // ─── Price calculation ────────────────────────────────────────────────────
  function calculatePrice() {
    if (!state.width || !state.depth || !state.colorId) return null;
    const wObj = cfg.widths.find(function (o) { return o.value === state.width; });
    const dObj = cfg.depths.find(function (o) { return o.value === state.depth; });
    const cObj = cfg.colors.find(function (o) { return o.id    === state.colorId; });
    return cfg.basePrice
      + (wObj ? (wObj.price_add || 0) : 0)
      + (dObj ? (dObj.price_add || 0) : 0)
      + (cObj ? (cObj.price_add || 0) : 0);
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

    if (state.width && state.depth && state.colorHex) {
      buildCabinet(state.width, state.depth, state.colorHex);
    }

    updateSpec();
    updatePrice();
    atcBtn.disabled = !(state.width && state.depth && state.colorId);
  }

  // ─── Add to Cart ──────────────────────────────────────────────────────────
  function addToCart() {
    const price = calculatePrice();
    if (price === null || !cfg.variantId) return;

    atcBtn.disabled    = true;
    atcBtn.textContent = 'Adding…';
    atcErrorEl.hidden  = true;

    fetch('/cart/add.js', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id:       cfg.variantId,
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
    if (!cfg.variantId) {
      section.innerHTML = '<p style="padding:40px;color:#888;text-align:center">No cabinet product assigned to this section.</p>';
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
