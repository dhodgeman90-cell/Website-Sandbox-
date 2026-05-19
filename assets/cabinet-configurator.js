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

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  let widthSelect, depthSelect, colorSelect, atcBtn, priceEl, atcErrorEl;

  // ─── Three.js refs ────────────────────────────────────────────────────────
  let scene, camera, renderer, cabinetGroup;

  // ─── Texture refs (loaded once, reused by every buildCabinet call) ────────
  let woodColorMap    = null;
  let woodNormalMap   = null;
  let woodRoughnessMap = null;

  // ─── Scene setup (runs once) ──────────────────────────────────────────────
  function initScene(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x8b6355); // brick-brown fallback colour

    var w = canvas.clientWidth  || 480;
    var h = canvas.clientHeight || 560;
    camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 2000);
    camera.position.set(38, 48, 62);
    camera.lookAt(0, 17, 0);

    // Key light — overhead front-right, soft shadows
    var keyLight = new THREE.DirectionalLight(0xfff5e0, 1.4);
    keyLight.position.set(20, 60, 40);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width  = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.001;
    scene.add(keyLight);

    // Fill light — left side, weak, keeps left face readable
    var fillLight = new THREE.DirectionalLight(0xd0e8ff, 0.35);
    fillLight.position.set(-30, 30, 20);
    scene.add(fillLight);

    // Ambient — no face is completely dark
    scene.add(new THREE.AmbientLight(0xfff8f0, 0.4));

    // Floor — warm tan, receives shadows
    var floor = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshLambertMaterial({ color: 0xc4a878 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Back wall — brick-brown, large enough to fill background at all sizes
    var backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 300),
      new THREE.MeshBasicMaterial({ color: 0x8b6355 })
    );
    backWall.position.set(0, 150, -25);
    scene.add(backWall);

    // Left wall — light grey, visible to the left of the cabinet
    var leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 300),
      new THREE.MeshBasicMaterial({ color: 0xc8c4be })
    );
    leftWall.position.set(-32, 150, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    // Resize handler
    function onResize() {
      var cw = canvas.clientWidth;
      var ch = canvas.clientHeight;
      if (cw === 0 || ch === 0) return;
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize);
    onResize();

    // Render loop — simple direct render, no composer
    (function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }());
  }

  // ─── Material factory ─────────────────────────────────────────────────────
  // Creates a MeshStandardMaterial with optional wood texture maps.
  // repeatX/Y scale the UV tiling to match real cabinet proportions.
  function makeWoodMat(baseColor, roughness, repeatX, repeatY, isMaple) {
    const mat = new THREE.MeshStandardMaterial({
      color:     baseColor,
      roughness: roughness,
      metalness: 0.0,
    });

    if (isMaple && woodColorMap) {
      const colTex = woodColorMap.clone();
      colTex.needsUpdate = true;
      colTex.rotation = Math.PI / 2;
      colTex.center.set(0.5, 0.5);
      colTex.repeat.set(repeatY, repeatX);
      mat.map = colTex;
    }

    if (isMaple && woodNormalMap) {
      const normTex = woodNormalMap.clone();
      normTex.needsUpdate = true;
      normTex.rotation = Math.PI / 2;
      normTex.center.set(0.5, 0.5);
      normTex.repeat.set(repeatY, repeatX);
      mat.normalMap   = normTex;
      mat.normalScale = new THREE.Vector2(0.8, 0.8);
    }

    if (isMaple && woodRoughnessMap) {
      const roughTex = woodRoughnessMap.clone();
      roughTex.needsUpdate = true;
      roughTex.rotation = Math.PI / 2;
      roughTex.center.set(0.5, 0.5);
      roughTex.repeat.set(repeatY, repeatX);
      mat.roughnessMap = roughTex;
    }

    return mat;
  }

  // ─── Cabinet builder ──────────────────────────────────────────────────────
  function buildCabinet(widthIn, depthIn, colorHex, colorId) {
    if (cabinetGroup) {
      cabinetGroup.traverse(function (obj) {
        if (obj.isMesh) {
          obj.geometry.dispose();
          if (obj.material.map)          obj.material.map.dispose();
          if (obj.material.normalMap)    obj.material.normalMap.dispose();
          if (obj.material.roughnessMap) obj.material.roughnessMap.dispose();
          obj.material.dispose();
        }
      });
      scene.remove(cabinetGroup);
    }
    cabinetGroup = new THREE.Group();

    var W = widthIn;
    var H = 34.5;
    var D = depthIn;

    // All measurements in inches; 1 Three.js unit = 1 inch
    var WALL_T     = 0.75;   // carcass wall / shelf thickness
    var PLINTH_H   = 3.0;    // base plinth height
    var PLINTH_EXT = 0.75;   // plinth extends this far beyond body on each side
    var TOP_H      = 0.75;   // top cap thickness
    var TOP_EXT    = 0.5;    // top cap overhang beyond body on each side
    var DRAWERS    = 4;
    var DRAWER_GAP = 0.2;    // reveal gap between drawer faces
    var RAIL_W     = 1.0;    // drawer frame rail height
    var STILE_W    = 1.0;    // drawer frame stile width
    var RECESS     = 0.12;   // recessed panel depth behind frame
    var HANDLE_LEN = 4.5;    // bar handle length
    var HANDLE_T   = 0.35;   // bar handle cross-section (square)

    // Drawer height: divide usable interior height equally
    var drawerAreaH = H - PLINTH_H - TOP_H - WALL_T;
    var drawerH     = (drawerAreaH - (DRAWERS - 1) * DRAWER_GAP) / DRAWERS;

    var isMaple   = !!(colorId && colorId.toLowerCase() === 'maple');
    var baseColor = new THREE.Color(colorHex);
    var repeatX   = W / 24;
    var repeatY   = H / 34.5;

    var faceColorVal  = isMaple ? new THREE.Color(1.00, 1.00, 1.00) : baseColor;
    var bodyColorVal  = isMaple ? new THREE.Color(0.92, 0.90, 0.88) : baseColor.clone().multiplyScalar(0.70);
    var panelColorVal = isMaple ? new THREE.Color(0.86, 0.84, 0.82) : baseColor.clone().multiplyScalar(0.88);

    var bodyMat  = makeWoodMat(bodyColorVal,  0.60, repeatX, repeatY, isMaple);
    var faceMat  = makeWoodMat(faceColorVal,  0.42, repeatX, repeatY, isMaple);
    var panelMat = makeWoodMat(panelColorVal, 0.55, repeatX, repeatY, isMaple);
    var handleMat = new THREE.MeshStandardMaterial({
      color: 0x909090, roughness: 0.20, metalness: 0.90,
    });

    function box(w, h, d, x, y, z, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      m.castShadow    = true;
      m.receiveShadow = true;
      cabinetGroup.add(m);
    }

    // ── Base plinth — wider and deeper than body ────────────────────────────
    box(W + 2*PLINTH_EXT, PLINTH_H, D + 2*PLINTH_EXT,
        0, PLINTH_H / 2, 0,
        bodyMat);

    // ── Carcass shell ────────────────────────────────────────────────────────
    var bodyY0 = PLINTH_H;
    var bodyY1 = H - TOP_H;
    var bodyH  = bodyY1 - bodyY0;
    var bodyCY = bodyY0 + bodyH / 2;

    box(W, WALL_T, D, 0, bodyY0 + WALL_T / 2,  0, bodyMat); // bottom shelf
    box(W, WALL_T, D, 0, bodyY1 - WALL_T / 2,  0, bodyMat); // top shelf
    box(WALL_T, bodyH, D, -W/2 + WALL_T/2, bodyCY, 0, bodyMat); // left side
    box(WALL_T, bodyH, D,  W/2 - WALL_T/2, bodyCY, 0, bodyMat); // right side
    box(W, bodyH, WALL_T, 0, bodyCY, -D/2 + WALL_T/2, bodyMat); // back panel

    // ── Top cap — thin slab, slight overhang on all sides ───────────────────
    box(W + 2*TOP_EXT, TOP_H, D + 2*TOP_EXT,
        0, H - TOP_H / 2, 0,
        bodyMat);

    // ── Drawer faces ─────────────────────────────────────────────────────────
    var faceW = W - 2*WALL_T;
    var faceT = WALL_T * 0.5;
    var faceZ = D / 2 + faceT / 2;

    for (var i = 0; i < DRAWERS; i++) {
      var baseY  = bodyY0 + WALL_T + i * (drawerH + DRAWER_GAP);
      var cy     = baseY + drawerH / 2;
      var innerH = drawerH - 2 * RAIL_W;
      var innerW = faceW   - 2 * STILE_W;

      box(faceW, RAIL_W, faceT, 0, baseY + drawerH - RAIL_W/2, faceZ, faceMat); // top rail
      box(faceW, RAIL_W, faceT, 0, baseY + RAIL_W/2,           faceZ, faceMat); // bottom rail
      box(STILE_W, innerH, faceT, -faceW/2 + STILE_W/2, cy, faceZ, faceMat);    // left stile
      box(STILE_W, innerH, faceT,  faceW/2 - STILE_W/2, cy, faceZ, faceMat);    // right stile

      // Recessed centre panel
      box(innerW, innerH, faceT * 0.5, 0, cy, faceZ - RECESS, panelMat);

      // Bar handle — rectangular bar, centred on drawer, protrudes from face
      var handleZ = faceZ + faceT/2 + 0.25 + HANDLE_T/2;
      box(HANDLE_LEN, HANDLE_T, HANDLE_T, 0, cy, handleZ, handleMat);
    }

    scene.add(cabinetGroup);
    // Camera stays fixed — set once in initScene(), never repositioned here
  }

  // ─── Populate dropdowns ───────────────────────────────────────────────────
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
      opt.value       = item.id;
      opt.textContent = item.label;
      opt.dataset.hex = item.hex;
      colorSelect.appendChild(opt);
    });
  }

  // ─── Find matching Shopify variant ───────────────────────────────────────
  function findVariant() {
    if (!state.width || !state.depth || !state.colorId) return null;
    var colorId = state.colorId;
    return (cfg.variants || []).find(function (v) {
      return String(v.option1) == String(state.width)  &&
             String(v.option2) == String(state.depth)  &&
             v.option3.toLowerCase() === colorId.toLowerCase();
    }) || null;
  }

  // ─── Price ────────────────────────────────────────────────────────────────
  function calculatePrice() {
    var v = findVariant();
    return v ? v.price / 100 : null;
  }

  // ─── Spec display ─────────────────────────────────────────────────────────
  function updateSpec() {
    document.getElementById('spec-width').textContent = state.width  ? state.width  + '″' : '—';
    document.getElementById('spec-depth').textContent = state.depth  ? state.depth  + '″' : '—';
    document.getElementById('spec-color').textContent = state.colorLabel || '—';
  }

  // ─── Price display ────────────────────────────────────────────────────────
  function updatePrice() {
    const price = calculatePrice();
    priceEl.textContent = price !== null
      ? '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : '—';
  }

  // ─── Dropdown change ──────────────────────────────────────────────────────
  function onSelectChange() {
    const rawW     = parseInt(widthSelect.value, 10);
    const rawD     = parseInt(depthSelect.value, 10);
    const colorOpt = colorSelect.options[colorSelect.selectedIndex];

    state.width      = isNaN(rawW)             ? null : rawW;
    state.depth      = isNaN(rawD)             ? null : rawD;
    state.colorId    = colorSelect.value       || null;
    state.colorLabel = (colorOpt && colorOpt.value) ? colorOpt.textContent         : null;
    state.colorHex   = (colorOpt && colorOpt.value) ? colorOpt.dataset.hex || null : null;

    var fallbackW = (cfg.widths[0] && cfg.widths[0].value) ? cfg.widths[0].value : 24;
    var fallbackD = (cfg.depths[0] && cfg.depths[0].value) ? cfg.depths[0].value : 18;
    buildCabinet(
      state.width  || fallbackW,
      state.depth  || fallbackD,
      state.colorHex || '#888888',
      state.colorId  || ''
    );

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

    populateDropdowns();

    const canvas = document.getElementById('cc-canvas');
    if (!canvas) return;

    initScene(canvas);

    // Build the cabinet immediately with flat colour so the canvas is never blank.
    // When textures finish loading the cabinet is rebuilt with full detail.
    var defaultW = (cfg.widths[0] && cfg.widths[0].value) ? cfg.widths[0].value : 24;
    var defaultD = (cfg.depths[0] && cfg.depths[0].value) ? cfg.depths[0].value : 18;
    buildCabinet(defaultW, defaultD, '#888888', '');

    // Load all three textures; rebuild once all are ready
    var texturesPending = 3;
    function tryRebuild() {
      if (--texturesPending <= 0) {
        buildCabinet(
          state.width  || defaultW,
          state.depth  || defaultD,
          state.colorHex || '#888888',
          state.colorId  || ''
        );
      }
    }

    if (window.cabinetAssets) {
      var loader = new THREE.TextureLoader();

      woodColorMap = loader.load(window.cabinetAssets.woodMaple, function (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tryRebuild();
      }, undefined, function () {
        tryRebuild();
      });

      woodNormalMap = loader.load(window.cabinetAssets.woodMapleNormal, function (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tryRebuild();
      }, undefined, function () {
        tryRebuild();
      });

      woodRoughnessMap = loader.load(window.cabinetAssets.woodMapleRoughness, function (tex) {
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tryRebuild();
      }, undefined, function () {
        tryRebuild();
      });
    } else {
      // No assets object — degrade all three gracefully
      texturesPending = 0;
    }

    [widthSelect, depthSelect, colorSelect].forEach(function (el) {
      el.addEventListener('change', onSelectChange);
    });
    atcBtn.addEventListener('click', addToCart);
  }

  document.addEventListener('DOMContentLoaded', init);
}());
