// @ts-nocheck
(function () {
  'use strict';

  const cfg = window.cabinetConfig || {
    widths: [], depths: [], colors: [], variants: [], textureUrls: {},
  };

  const state = {
    width: null,
    widthLabel: null,
    depth: null,
    colorId: null,
    colorLabel: null,
    colorHex: null,
  };

  const FINISH_PROFILES = {
    // White is solid paint, not grained — render it clean off the scene lighting
    // plus a baked light-to-shadow gradient (mattePanelTexture) so each panel
    // reads as lit instead of a flat sticker.
    'white': {
      color: '#ece8e1', roughness: 0.62, clearcoat: 0, wood: false, matte: true,
      caseBrightness: 0.95,
      frontTint: [1, 1, 1],
      caseTint: [0.93, 0.93, 0.93],
    },
    // Gloss: same baked gradient, but clearcoat + env reflections give it the sheen.
    'white-gloss': {
      color: '#f3ece4', roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06, wood: false, matte: true,
      caseBrightness: 1,
      frontTint: [1, 1, 1],
      caseTint: [0.93, 0.93, 0.93],
    },
    // Matte charcoal — solid paint, lit by a baked gradient (see mattePanelTexture).
    // Base lifted off pure black so the finish reads as soft charcoal, not a void.
    'black-matte': {
      color: '#242424', roughness: 0.82, clearcoat: 0, wood: false, matte: true,
      caseBrightness: 0.9,
      frontTint: [1, 1, 1],
      caseTint: [0.9, 0.9, 0.9],
    },
    'black': {
      color: '#11100f', roughness: 0.055, clearcoat: 1, clearcoatRoughness: 0.022, wood: false,
      caseBrightness: 0.92,
      referenceCase: true,
      referenceFront: true,
      frontTint: [1.02, 1.02, 1.02],
      caseTint: [1.01, 1.01, 1.01],
      textureContrast: 1.14,
      referenceCrop: [0.579, 0.412, 0.218, 0.077],
      referenceSideCrop: [0.814, 0.402, 0.083, 0.42],
      sideTextureContrast: 1.04,
    },
    'mdf': {
      color: '#d2aa82', roughness: 0.86, clearcoat: 0, wood: false, fiber: true,
      frontTint: [0.88, 0.81, 0.8],
      caseTint: [0.88, 0.81, 0.8],
      textureContrast: 1.35,
      referenceCrop: [0.574, 0.416, 0.22, 0.074],
      referenceSideCrop: [0.82, 0.403, 0.065, 0.42],
      sideTextureContrast: 0.7,
    },
    'acquedotti': {
      color: '#aa8b70', roughness: 0.52, clearcoat: 0.06, clearcoatRoughness: 0.46,
      wood: true, woodTone: '#aa8b70', grainContrast: 0.72,
      frontTint: [0.95, 0.92, 0.87],
      caseTint: [0.95, 0.92, 0.87],
      textureContrast: 1.7,
      referenceCrop: [0.58, 0.415, 0.22, 0.075],
      referenceSideCrop: [0.82, 0.403, 0.07, 0.42],
      sideTextureContrast: 0.86,
    },
    'lakeshore-oak': {
      color: '#d8cfbd', roughness: 0.6, clearcoat: 0.04, clearcoatRoughness: 0.52,
      wood: true, woodTone: '#d8cfbd', grainContrast: 0.46,
      frontTint: [0.92, 0.89, 0.86],
      caseTint: [0.92, 0.89, 0.86],
      textureContrast: 1.9,
      referenceCrop: [0.58, 0.415, 0.22, 0.075],
      referenceSideCrop: [0.82, 0.403, 0.07, 0.42],
      sideTextureContrast: 0.92,
    },
  };

  let widthSelect, depthSelect, colorSelect, atcBtn, priceEl, atcErrorEl;
  let scene, camera, renderer, cabinetGroup;
  let contactShadowTexture;
  const finishTextures = { color: null, normal: null, roughness: null };
  const tintedWoodTextures = {};
  const glossTextures = {};
  const matteTextures = {};
  const referenceTextures = {};
  const pendingReferenceTextures = {};

  function initScene(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.86;

    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace;
    } else if ('outputEncoding' in renderer && THREE.sRGBEncoding) {
      renderer.outputEncoding = THREE.sRGBEncoding;
    }

    scene = new THREE.Scene();
    scene.environment = buildRoomEnvironment();
    contactShadowTexture = buildContactShadowTexture();

    const width = canvas.clientWidth || 540;
    const height = canvas.clientHeight || 680;
    camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    setCameraComposition();

    const windowLight = new THREE.DirectionalLight(0xfff6ec, 1.05);
    windowLight.position.set(-32, 48, 44);
    windowLight.castShadow = true;
    windowLight.shadow.mapSize.set(2048, 2048);
    windowLight.shadow.camera.left = -45;
    windowLight.shadow.camera.right = 45;
    windowLight.shadow.camera.top = 55;
    windowLight.shadow.camera.bottom = -20;
    windowLight.shadow.bias = -0.0008;
    scene.add(windowLight);

    const roomFill = new THREE.DirectionalLight(0xc7d5e2, 0.32);
    roomFill.position.set(24, 30, 20);
    scene.add(roomFill);
    scene.add(new THREE.HemisphereLight(0xe5dfd5, 0x3a2d27, 0.58));

    const floorShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(160, 160),
      new THREE.ShadowMaterial({ color: 0x160f0b, opacity: 0.36 })
    );
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.position.y = -0.03;
    floorShadow.receiveShadow = true;
    scene.add(floorShadow);

    const wallShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(120, 90),
      new THREE.ShadowMaterial({ color: 0x17100c, opacity: 0.08 })
    );
    wallShadow.position.set(0, 43, -11.05);
    wallShadow.receiveShadow = true;
    scene.add(wallShadow);

    function resize() {
      const canvasWidth = canvas.clientWidth;
      const canvasHeight = canvas.clientHeight;
      if (!canvasWidth || !canvasHeight) return;
      renderer.setSize(canvasWidth, canvasHeight, false);
      camera.aspect = canvasWidth / canvasHeight;
      camera.updateProjectionMatrix();
    }

    window.addEventListener('resize', resize);
    resize();

    (function render() {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    }());
  }

  function buildRoomEnvironment() {
    const faceColors = [
      ['#e8e7e3', '#303030'], ['#1c1c1c', '#777773'],
      ['#f2f0eb', '#77756f'], ['#3b3b3a', '#171717'],
      ['#deddd8', '#343433'], ['#686761', '#181818'],
    ];

    const faces = faceColors.map(function (colors) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const context = canvas.getContext('2d');
      const gradient = context.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(0.28, colors[0]);
      gradient.addColorStop(0.5, colors[1]);
      gradient.addColorStop(1, colors[1]);
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      return canvas;
    });

    const environment = new THREE.CubeTexture(faces);
    if ('colorSpace' in environment && THREE.SRGBColorSpace) {
      environment.colorSpace = THREE.SRGBColorSpace;
    } else if ('encoding' in environment && THREE.sRGBEncoding) {
      environment.encoding = THREE.sRGBEncoding;
    }
    environment.needsUpdate = true;
    return environment;
  }

  function buildContactShadowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(128, 128, 18, 128, 128, 126);
    gradient.addColorStop(0, 'rgba(18, 12, 9, 0.52)');
    gradient.addColorStop(0.5, 'rgba(18, 12, 9, 0.25)');
    gradient.addColorStop(1, 'rgba(18, 12, 9, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  function setCameraComposition() {
    camera.position.set(55, 47.8, 125);
    camera.lookAt(-10.5, 31, 0);
  }

  function configureFinishTexture(texture, isColorTexture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.center.set(0.5, 0.5);
      texture.rotation = Math.PI / 2;
      texture.repeat.set(1.45, 2.1);
      texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);

      if (isColorTexture && 'colorSpace' in texture && THREE.SRGBColorSpace) {
        texture.colorSpace = THREE.SRGBColorSpace;
      } else if (isColorTexture && 'encoding' in texture && THREE.sRGBEncoding) {
        texture.encoding = THREE.sRGBEncoding;
      }

      return texture;
  }

  function loadFinishTextures(onLoad) {
    if (!cfg.textureUrls) return;

    const sources = [
      { key: 'color', url: cfg.textureUrls.mapleColor, isColor: true },
      { key: 'normal', url: cfg.textureUrls.mapleNormal, isColor: false },
      { key: 'roughness', url: cfg.textureUrls.mapleRoughness, isColor: false },
    ].filter(function (source) { return source.url; });

    if (!sources.length) return;

    let remaining = sources.length;
    const loader = new THREE.TextureLoader();

    function completeOne() {
      remaining -= 1;
      if (remaining === 0 && onLoad) onLoad();
    }

    sources.forEach(function (source) {
      loader.load(source.url, function (texture) {
        finishTextures[source.key] = configureFinishTexture(texture, source.isColor);
        completeOne();
      }, undefined, completeOne);
    });
  }

  function selectedFinishProfile() {
    const id = String(state.colorId || '').toLowerCase();
    if (FINISH_PROFILES[id]) {
      return Object.assign({ id: id }, FINISH_PROFILES[id]);
    }

    return {
      color: state.colorHex || '#d5b798',
      roughness: 0.55,
      clearcoat: 0.05,
      clearcoatRoughness: 0.45,
      wood: true,
      woodTone: state.colorHex || '#b88f68',
      grainContrast: 0.6,
    };
  }

  function referenceTexture(profile, surface, referenceIndex) {
    if (!profile.id || !referenceTextures[profile.id]) return null;
    const textures = referenceTextures[profile.id];
    if (surface === 'side') return textures.side || null;
    return textures.fronts[Math.min(Math.max(referenceIndex || 0, 0), textures.fronts.length - 1)];
  }

  function loadReferenceTexture(finishId, onLoad) {
    if (!finishId || referenceTextures[finishId]) {
      if (onLoad) onLoad();
      return;
    }
    if (pendingReferenceTextures[finishId]) return;

    const profile = FINISH_PROFILES[finishId];
    const url = cfg.finishReferenceUrls && cfg.finishReferenceUrls[finishId];
    if (!profile || !profile.referenceCrop || !url) return;

    pendingReferenceTextures[finishId] = true;
    const loader = new THREE.ImageLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(url, function (image) {
      const crop = profile.referenceCrop;
      const drawerOffsets = [
        { x: 0, y: 0 },
        { x: 0, y: 0.105 },
        { x: 0, y: 0.21 },
        { x: 0.006, y: 0.21 },
      ];

      function cropCanvas(sourceCrop, width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.drawImage(
          image,
          Math.round(image.width * sourceCrop[0]),
          Math.round(image.height * sourceCrop[1]),
          Math.round(image.width * sourceCrop[2]),
          Math.round(image.height * sourceCrop[3]),
          0,
          0,
          canvas.width,
          canvas.height
        );
        return canvas;
      }

      function averageColor(canvas) {
        const context = canvas.getContext('2d');
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
        const total = { r: 0, g: 0, b: 0 };
        for (let index = 0; index < pixels.length; index += 4) {
          total.r += pixels[index];
          total.g += pixels[index + 1];
          total.b += pixels[index + 2];
        }
        const count = pixels.length / 4;
        return { r: total.r / count, g: total.g / count, b: total.b / count };
      }

      function matchAverageColor(canvas, targetCanvas) {
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const source = averageColor(canvas);
        const target = averageColor(targetCanvas);
        const scale = {
          r: Math.min(2.4, Math.max(0.7, target.r / Math.max(source.r, 1))),
          g: Math.min(2.4, Math.max(0.7, target.g / Math.max(source.g, 1))),
          b: Math.min(2.4, Math.max(0.7, target.b / Math.max(source.b, 1))),
        };
        for (let index = 0; index < pixels.length; index += 4) {
          pixels[index] = Math.min(255, pixels[index] * scale.r);
          pixels[index + 1] = Math.min(255, pixels[index + 1] * scale.g);
          pixels[index + 2] = Math.min(255, pixels[index + 2] * scale.b);
        }
        context.putImageData(imageData, 0, 0);
      }

      function adjustContrast(canvas, amount) {
        if (!amount || amount === 1) return;
        const context = canvas.getContext('2d');
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const average = averageColor(canvas);
        for (let index = 0; index < pixels.length; index += 4) {
          pixels[index] = Math.max(0, Math.min(255, average.r + (pixels[index] - average.r) * amount));
          pixels[index + 1] = Math.max(0, Math.min(255, average.g + (pixels[index + 1] - average.g) * amount));
          pixels[index + 2] = Math.max(0, Math.min(255, average.b + (pixels[index + 2] - average.b) * amount));
        }
        context.putImageData(imageData, 0, 0);
      }

      function textureFromCanvas(canvas) {

        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
        if ('colorSpace' in texture && THREE.SRGBColorSpace) {
          texture.colorSpace = THREE.SRGBColorSpace;
        } else if ('encoding' in texture && THREE.sRGBEncoding) {
          texture.encoding = THREE.sRGBEncoding;
        }
        texture.needsUpdate = true;
        return texture;
      }

      const frontCanvases = drawerOffsets.map(function (offset) {
        return cropCanvas([
          crop[0] + offset.x,
          crop[1] + offset.y,
          crop[2],
          crop[3],
        ], 768, 256);
      });
      frontCanvases.forEach(function (canvas) {
        adjustContrast(canvas, profile.textureContrast || 1);
      });
      const sideCanvas = profile.referenceSideCrop
        ? cropCanvas(profile.referenceSideCrop, 256, 768)
        : frontCanvases[0];
      if (sideCanvas !== frontCanvases[0]) {
        matchAverageColor(sideCanvas, frontCanvases[0]);
        adjustContrast(sideCanvas, profile.sideTextureContrast || 1);
      }
      referenceTextures[finishId] = {
        fronts: frontCanvases.map(textureFromCanvas),
        side: textureFromCanvas(sideCanvas),
      };
      delete pendingReferenceTextures[finishId];

      if (onLoad && state.colorId === finishId) onLoad();
    }, undefined, function () {
      delete pendingReferenceTextures[finishId];
    });
  }

  function tintedWoodTexture(profile) {
    if (!finishTextures.color || !finishTextures.color.image || !profile.woodTone) {
      return finishTextures.color;
    }

    const cacheKey = profile.woodTone + ':' + profile.grainContrast;
    if (tintedWoodTextures[cacheKey]) return tintedWoodTextures[cacheKey];

    const source = finishTextures.color.image;
    const canvas = document.createElement('canvas');
    canvas.width = source.naturalWidth || source.width;
    canvas.height = source.naturalHeight || source.height;

    const context = canvas.getContext('2d');
    context.drawImage(source, 0, 0, canvas.width, canvas.height);

    try {
      const image = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = image.data;
      const tone = new THREE.Color(profile.woodTone);
      const toSrgb = function (value) {
        return value <= 0.0031308
          ? value * 12.92
          : 1.055 * Math.pow(value, 1 / 2.4) - 0.055;
      };
      const target = {
        r: Math.round(toSrgb(tone.r) * 255),
        g: Math.round(toSrgb(tone.g) * 255),
        b: Math.round(toSrgb(tone.b) * 255),
      };
      const contrast = profile.grainContrast || 0.6;

      for (let index = 0; index < pixels.length; index += 4) {
        const luminance = (pixels[index] * 0.2126 + pixels[index + 1] * 0.7152 + pixels[index + 2] * 0.0722) / 255;
        const grain = 1 + (luminance - 0.62) * contrast;
        pixels[index] = Math.max(0, Math.min(255, target.r * grain));
        pixels[index + 1] = Math.max(0, Math.min(255, target.g * grain));
        pixels[index + 2] = Math.max(0, Math.min(255, target.b * grain));
      }

      context.putImageData(image, 0, 0);
    } catch (error) {
      return finishTextures.color;
    }

    const texture = configureFinishTexture(new THREE.CanvasTexture(canvas), true);
    tintedWoodTextures[cacheKey] = texture;
    return texture;
  }

  function glossTexture(profile, referenceIndex) {
    const key = profile.color + ':' + referenceIndex;
    if (glossTextures[key]) return glossTextures[key];

    const canvas = document.createElement('canvas');
    canvas.width = 768;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    context.fillStyle = profile.color;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const shift = (referenceIndex || 0) * 0.018;
    const isLight = profile.id === 'white-gloss';
    const band = '255,255,255';
    const strong = isLight ? 0.34 : 0.16;
    const soft = isLight ? 0.12 : 0.045;
    const reflection = context.createLinearGradient(0, 0, canvas.width, 0);
    reflection.addColorStop(0, 'rgba(' + band + ',' + (isLight ? 0.04 : 0) + ')');
    reflection.addColorStop(0.1 + shift, 'rgba(' + band + ',' + soft + ')');
    reflection.addColorStop(0.25 + shift, 'rgba(' + band + ',' + strong + ')');
    reflection.addColorStop(0.42 + shift, 'rgba(' + band + ',' + (strong * 0.42) + ')');
    reflection.addColorStop(0.57 + shift, 'rgba(' + band + ',' + soft + ')');
    reflection.addColorStop(0.7 + shift, 'rgba(' + band + ',' + (strong * 0.82) + ')');
    reflection.addColorStop(0.84 + shift, 'rgba(' + band + ',' + soft + ')');
    reflection.addColorStop(1, 'rgba(' + band + ',0)');
    context.fillStyle = reflection;
    context.fillRect(0, 0, canvas.width, canvas.height);

    if (isLight) {
      const reflectedShade = context.createLinearGradient(0, 0, canvas.width, 0);
      reflectedShade.addColorStop(0, 'rgba(118,112,106,0)');
      reflectedShade.addColorStop(0.12 + shift, 'rgba(118,112,106,0)');
      reflectedShade.addColorStop(0.23 + shift, 'rgba(118,112,106,0.43)');
      reflectedShade.addColorStop(0.38 + shift, 'rgba(118,112,106,0.1)');
      reflectedShade.addColorStop(0.54 + shift, 'rgba(118,112,106,0)');
      reflectedShade.addColorStop(0.67 + shift, 'rgba(118,112,106,0.29)');
      reflectedShade.addColorStop(0.8 + shift, 'rgba(118,112,106,0.08)');
      reflectedShade.addColorStop(1, 'rgba(118,112,106,0)');
      context.fillStyle = reflectedShade;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    if ('colorSpace' in texture && THREE.SRGBColorSpace) {
      texture.colorSpace = THREE.SRGBColorSpace;
    } else if ('encoding' in texture && THREE.sRGBEncoding) {
      texture.encoding = THREE.sRGBEncoding;
    }
    texture.needsUpdate = true;
    glossTextures[key] = texture;
    return texture;
  }

  // Solid matte finishes render dead-flat under a directional light (a flat face
  // has no falloff), which reads as a pasted-on cutout. This bakes a soft
  // top-lit / bottom-shaded gradient so every drawer panel looks lit by the room,
  // and the light/dark seam between stacked panels reads as a real drawer reveal.
  function mattePanelTexture(profile) {
    const key = 'matte:' + profile.color;
    if (matteTextures[key]) return matteTextures[key];

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');
    context.fillStyle = profile.color;
    context.fillRect(0, 0, 512, 512);

    const vertical = context.createLinearGradient(0, 0, 0, 512);
    vertical.addColorStop(0, 'rgba(255,255,255,0.12)');
    vertical.addColorStop(0.4, 'rgba(255,255,255,0.02)');
    vertical.addColorStop(0.68, 'rgba(0,0,0,0.05)');
    vertical.addColorStop(1, 'rgba(0,0,0,0.15)');
    context.fillStyle = vertical;
    context.fillRect(0, 0, 512, 512);

    // Gentle window-side (left) lift toward the room's key light.
    const horizontal = context.createLinearGradient(0, 0, 512, 0);
    horizontal.addColorStop(0, 'rgba(255,255,255,0.05)');
    horizontal.addColorStop(0.5, 'rgba(255,255,255,0)');
    horizontal.addColorStop(1, 'rgba(0,0,0,0.05)');
    context.fillStyle = horizontal;
    context.fillRect(0, 0, 512, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    if ('colorSpace' in texture && THREE.SRGBColorSpace) {
      texture.colorSpace = THREE.SRGBColorSpace;
    } else if ('encoding' in texture && THREE.sRGBEncoding) {
      texture.encoding = THREE.sRGBEncoding;
    }
    texture.needsUpdate = true;
    matteTextures[key] = texture;
    return texture;
  }

  function finishMaterial(profile, brightness, referenceIndex, allowTexture, surface) {
    const tint = Array.isArray(brightness)
      ? new THREE.Color().setRGB(brightness[0], brightness[1], brightness[2])
      : new THREE.Color(brightness || 1, brightness || 1, brightness || 1);
    const surfaceColor = new THREE.Color(profile.color).multiply(tint);
    const options = {
      color: surfaceColor,
      roughness: profile.roughness,
      metalness: 0,
      envMap: scene.environment,
      envMapIntensity: profile.clearcoat ? 2.1 : 0.16,
    };

    const useTexture = allowTexture !== false;
    const useReference = useTexture && (
      profile.wood || profile.fiber || profile.referenceFront || profile.referenceCase
    );
    const sampledReference = useReference && referenceIndex >= 0
      ? referenceTexture(profile, surface || 'front', referenceIndex)
      : null;
    if (sampledReference) {
      const sampledOptions = {
        map: sampledReference,
        color: tint,
        roughness: profile.roughness,
        metalness: 0,
        envMap: scene.environment,
        envMapIntensity: profile.clearcoat > 0.8 ? 0.88 : 0.14,
        emissiveMap: sampledReference,
        emissive: new THREE.Color(0xffffff),
        emissiveIntensity: profile.clearcoat > 0.8 ? 0.018 : 0.035,
      };
      if (profile.wood || profile.fiber) {
        sampledOptions.bumpMap = sampledReference;
        sampledOptions.bumpScale = profile.fiber ? 0.012 : 0.05;
      }
      if (profile.clearcoat) {
        sampledOptions.clearcoat = profile.clearcoat;
        sampledOptions.clearcoatRoughness = profile.clearcoatRoughness;
        sampledOptions.reflectivity = profile.clearcoat > 0.8 ? 0.72 : 0.52;
        return new THREE.MeshPhysicalMaterial(sampledOptions);
      }
      return new THREE.MeshStandardMaterial(sampledOptions);
    } else if (useTexture && profile.matte && referenceIndex >= 0) {
      // Baked gradient carries the base color; tint stays in `color` so the
      // case sides render a touch darker than the lit fronts.
      options.map = mattePanelTexture(profile);
      options.color = tint;
    } else if (useTexture && profile.clearcoat > 0.8 && referenceIndex >= 0) {
      options.map = glossTexture(profile, referenceIndex);
      options.color = new THREE.Color(0xffffff);
    } else if (useTexture && profile.wood && finishTextures.color) {
      options.map = tintedWoodTexture(profile);
      options.color = new THREE.Color(0xffffff);
      options.normalMap = finishTextures.normal;
      options.roughnessMap = finishTextures.roughness;
      options.normalScale = new THREE.Vector2(0.2, 0.2);
    } else if (useTexture && profile.fiber && finishTextures.roughness) {
      options.roughnessMap = finishTextures.roughness;
      options.normalMap = finishTextures.normal;
      options.normalScale = new THREE.Vector2(0.04, 0.04);
    }

    if (profile.clearcoat) {
      options.clearcoat = profile.clearcoat;
      options.clearcoatRoughness = profile.clearcoatRoughness;
      options.reflectivity = 0.6;
      return new THREE.MeshPhysicalMaterial(options);
    }

    return new THREE.MeshStandardMaterial(options);
  }

  function disposeCabinet() {
    if (!cabinetGroup) return;

    scene.remove(cabinetGroup);
    cabinetGroup.traverse(function (object) {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(function (item) { item.dispose(); });
      }
    });
  }

  function buildCabinet(widthIn, depthIn, colorHex) {
    disposeCabinet();
    cabinetGroup = new THREE.Group();

    const W = widthIn;
    const H = 36;
    const D = depthIn;
    const T = 0.75;
    const toeHeight = 4.5;
    const frontThickness = 0.62;
    const frontZ = D / 2 + frontThickness / 2 - 0.02;
    const gap = 0.18;
    const profile = selectedFinishProfile();

    const texturedCase = profile.wood || profile.fiber || profile.referenceCase || profile.matte;
    const referenceCase = texturedCase;
    const caseFrontMaterial = finishMaterial(
      profile,
      profile.caseTint || profile.caseBrightness || 0.8,
      referenceCase ? 0 : -1,
      referenceCase,
      'front'
    );
    const caseSideMaterial = finishMaterial(
      profile,
      profile.caseTint || profile.caseBrightness || 0.8,
      referenceCase ? 0 : -1,
      referenceCase,
      'side'
    );
    const caseMaterials = [
      caseSideMaterial,
      caseSideMaterial,
      caseSideMaterial,
      caseSideMaterial,
      caseFrontMaterial,
      caseSideMaterial,
    ];
    const frontMaterials = [2, 1, 0, 3].map(function (referenceIndex) {
      const textureIndex = profile.lockFrontReference ? 0 : referenceIndex;
      return finishMaterial(profile, profile.frontTint || 1, textureIndex, true, 'front');
    });

    function box(w, h, d, x, y, z, boxMaterial, parent) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), boxMaterial);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      (parent || cabinetGroup).add(mesh);
      return mesh;
    }

    // Full-height finished end panels ground the cabinet visually.
    box(T, H, D, -W / 2 + T / 2, H / 2, 0, caseMaterials);
    box(T, H, D, W / 2 - T / 2, H / 2, 0, caseMaterials);
    box(W - 2 * T, T, D, 0, H - T / 2, 0, caseMaterials);
    box(W - 2 * T, T, D, 0, toeHeight + T / 2, 0, caseMaterials);
    box(W - 2 * T, H - 2 * T, T, 0, H / 2, -D / 2 + T / 2, caseMaterials);

    // Finished toe panel aligned with the drawer-front plane.
    box(
      W - 0.12,
      toeHeight,
      frontThickness,
      0,
      toeHeight / 2,
      frontZ,
      frontMaterials[3]
    );

    // Three equal, handle-free upper fronts with narrow shadow gaps.
    const closedBottom = 13.45;
    const closedTop = H - 0.28;
    const closedFrontHeight = (closedTop - closedBottom - gap * 2) / 3;

    for (let index = 0; index < 3; index += 1) {
      const y = closedBottom + closedFrontHeight / 2 + index * (closedFrontHeight + gap);
      box(W - 0.12, closedFrontHeight, frontThickness, 0, y, frontZ, frontMaterials[index]);
    }

    // Closed lower drawer. Keeping this front flush removes the exposed box
    // geometry while preserving a clear recessed toe kick below it.
    const lowerFrontBottom = toeHeight + 0.28;
    const lowerFrontTop = closedBottom - gap;
    const lowerFrontHeight = lowerFrontTop - lowerFrontBottom;
    box(
      W - 0.12,
      lowerFrontHeight,
      frontThickness,
      0,
      lowerFrontBottom + lowerFrontHeight / 2,
      frontZ,
      frontMaterials[3]
    );

    const contactShadow = new THREE.Mesh(
      new THREE.PlaneGeometry(W * 1.24, D * 1.18),
      new THREE.MeshBasicMaterial({
        map: contactShadowTexture,
        transparent: true,
        opacity: 0.72,
        depthWrite: false,
      })
    );
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.set(0, 0.035, 0);
    cabinetGroup.add(contactShadow);

    // Keep the back fixed against the photographed wall. Increasing depth now
    // moves only the cabinet front and open drawer farther into the room.
    const rightEdgeAnchor = 18.8;
    cabinetGroup.position.set(rightEdgeAnchor - W / 2, 0, D / 2 - 11);
    cabinetGroup.rotation.y = THREE.MathUtils.degToRad(-7);
    scene.add(cabinetGroup);
    setCameraComposition();
  }

  function populateDropdowns() {
    (Array.isArray(cfg.widths) ? cfg.widths : []).forEach(function (item) {
      const option = document.createElement('option');
      option.value = String(item.value);
      option.textContent = item.label;
      widthSelect.appendChild(option);
    });

    (Array.isArray(cfg.depths) ? cfg.depths : []).forEach(function (item) {
      const option = document.createElement('option');
      option.value = String(item.value);
      option.textContent = item.label;
      depthSelect.appendChild(option);
    });

    (Array.isArray(cfg.colors) ? cfg.colors : []).forEach(function (item) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.label;
      option.dataset.hex = item.hex;
      colorSelect.appendChild(option);
    });
  }

  function findVariant() {
    if (!state.width || !state.depth || !state.colorId) return null;
    const colorId = state.colorId;

    return (cfg.variants || []).find(function (variant) {
      return String(variant.option1) === String(state.width) &&
        String(variant.option2) === String(state.depth) &&
        String(variant.option3).toLowerCase() === colorId.toLowerCase();
    }) || null;
  }

  function calculatePrice() {
    const variant = findVariant();
    return variant ? variant.price / 100 : null;
  }

  function updateSpec() {
    document.getElementById('spec-width').textContent = state.widthLabel || '—';
    document.getElementById('spec-depth').textContent = state.depth ? state.depth + '″' : '—';
    document.getElementById('spec-color').textContent = state.colorLabel || '—';
  }

  function updatePrice() {
    const price = calculatePrice();
    priceEl.textContent = price !== null
      ? '$' + price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
      : '—';
  }

  function selectedDimensions() {
    const defaultWidth = cfg.widths[Math.floor(cfg.widths.length / 2)];
    const defaultDepth = cfg.depths[Math.floor(cfg.depths.length / 2)];

    return {
      width: parseFloat(state.width || (defaultWidth && defaultWidth.value) || 24),
      depth: parseFloat(state.depth || (defaultDepth && defaultDepth.value) || 18),
    };
  }

  function rebuildCabinet() {
    const dimensions = selectedDimensions();
    buildCabinet(dimensions.width, dimensions.depth, state.colorHex || '#b88f68');
  }

  function onSelectChange() {
    const widthOption = widthSelect.options[widthSelect.selectedIndex];
    const colorOption = colorSelect.options[colorSelect.selectedIndex];

    state.width = widthSelect.value || null;
    state.widthLabel = widthOption && widthOption.value ? widthOption.textContent : null;
    state.depth = depthSelect.value || null;
    state.colorId = colorSelect.value || null;
    state.colorLabel = colorOption && colorOption.value ? colorOption.textContent : null;
    state.colorHex = colorOption && colorOption.value ? colorOption.dataset.hex || null : null;

    rebuildCabinet();
    loadReferenceTexture(state.colorId, rebuildCabinet);
    updateSpec();
    updatePrice();
    atcBtn.disabled = !findVariant();
  }

  function addToCart() {
    const variant = findVariant();
    const price = variant ? variant.price / 100 : null;
    if (!variant || price === null) return;

    atcBtn.disabled = true;
    atcBtn.textContent = 'Adding…';
    atcErrorEl.hidden = true;

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: variant.id,
        quantity: 1,
        properties: {
          '_cabinet_width': state.width,
          '_cabinet_depth': state.depth,
          '_cabinet_height': 36,
          '_cabinet_color': state.colorId,
          '_cabinet_color_label': state.colorLabel,
          '_cabinet_drawer_count': 4,
          '_cabinet_price': price.toFixed(2),
        },
      }),
    })
      .then(function (response) {
        if (!response.ok) {
          return response.json().then(function (error) { throw error; });
        }
        return response.json();
      })
      .then(function () {
        window.location.href = '/cart';
      })
      .catch(function (error) {
        atcErrorEl.textContent = error.description || error.message || 'Could not add to cart. Please try again.';
        atcErrorEl.hidden = false;
        atcBtn.disabled = false;
        atcBtn.textContent = 'Add to Cart';
      });
  }

  function init() {
    const section = document.getElementById('cabinet-configurator');
    if (!section) return;

    if (!cfg.variants || cfg.variants.length === 0) {
      section.innerHTML = '<p style="padding:40px;color:#888;text-align:center">No cabinet product assigned to this section, or product has no variants.</p>';
      return;
    }

    widthSelect = document.getElementById('cab-select-width');
    depthSelect = document.getElementById('cab-select-depth');
    colorSelect = document.getElementById('cab-select-color');
    atcBtn = document.getElementById('cab-atc');
    priceEl = document.getElementById('cab-price');
    atcErrorEl = document.getElementById('cab-atc-error');

    const canvas = document.getElementById('cc-canvas');
    if (!canvas) return;

    initScene(canvas);
    populateDropdowns();
    rebuildCabinet();
    loadFinishTextures(rebuildCabinet);

    [widthSelect, depthSelect, colorSelect].forEach(function (element) {
      element.addEventListener('change', onSelectChange);
    });
    atcBtn.addEventListener('click', addToCart);
  }

  document.addEventListener('DOMContentLoaded', init);
}());
