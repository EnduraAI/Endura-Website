(function () {
  "use strict";

  const stage = document.getElementById("assetStage");
  const canvas = document.getElementById("assetCanvas");
  const hotspotLayer = document.getElementById("assetHotspots");
  const list = document.getElementById("explorerDomainList");
  const loading = document.getElementById("assetLoading");
  const fallback = document.getElementById("assetFallback");
  const fallbackImage = document.getElementById("assetFallbackImage");
  const fallbackMessage = document.getElementById("assetFallbackMessage");
  const liveStatus = document.getElementById("explorerLiveStatus");
  const assetLabel = document.getElementById("activeAssetLabel");
  const autoRotateButton = document.getElementById("autoRotate");
  const focusDomainButton = document.getElementById("focusDomain");
  const viewModeButtons = [...document.querySelectorAll("[data-view-mode]")];
  if (!stage || !canvas || !hotspotLayer || !list) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const domains = [
    {
      key: "Structural",
      title: "Structural Data",
      score: 38,
      status: "Critical gap",
      copy: "Checks current condition, degradation, modification history and the temporary-state basis behind removal and support decisions.",
      impact: "Removal method, access, lifting, temporary support and sequence.",
      action: "Reconcile structural drawings, inspection evidence and modification records.",
    },
    {
      key: "Hazmat",
      title: "Hazardous Materials",
      score: 41,
      status: "Critical gap",
      copy: "Tests whether hazardous-material and NORM registers, surveys and sampling history support packaging and disposal planning.",
      impact: "PPE, decontamination, waste routing, programme and cost.",
      action: "Validate the register against current areas, quantities and classifications.",
    },
    {
      key: "Isolation",
      title: "Isolation and Containment",
      score: 44,
      status: "Critical gap",
      copy: "Reviews retained inventories, line status, isolation records and boundary conditions affecting safe preparation.",
      impact: "Make-safe scope, offshore exposure and execution interfaces.",
      action: "Reconcile the isolation philosophy to current P&IDs and field status.",
    },
    {
      key: "As-builts",
      title: "As-Built Drawings",
      score: 55,
      status: "Moderate",
      copy: "Locates modification drift, missing packages and configuration changes that affect the scope basis.",
      impact: "Quantities, access, interfaces and method definition.",
      action: "Prioritise drawings connected to high-consequence scope decisions.",
    },
    {
      key: "P&IDs",
      title: "P&IDs",
      score: 62,
      status: "Moderate",
      copy: "Checks revision alignment, tie-ins, process boundaries and whether the process basis reflects the current asset.",
      impact: "Isolation, residual inventory, cleaning and scope limits.",
      action: "Resolve revision conflicts and field-verify critical boundaries.",
    },
    {
      key: "Waste",
      title: "Waste Classification",
      score: 64,
      status: "Moderate",
      copy: "Reviews expected waste streams, classifications, routing assumptions and current disposal capacity.",
      impact: "Disposal route, logistics, permits, programme and recovery value.",
      action: "Connect material quantities to confirmed classifications and facilities.",
    },
    {
      key: "Well P&A",
      title: "Well P&A",
      score: 71,
      status: "Good coverage",
      copy: "Separates well-scope confidence from facility scope and exposes unresolved suspended-well information.",
      impact: "Battery limits, schedule, regulatory pathway and liability allocation.",
      action: "Confirm well status, ownership, records and scope demarcation.",
    },
    {
      key: "Weight",
      title: "Weight Control",
      score: 79,
      status: "Good coverage",
      copy: "Reconciles weight reports, modifications and allowances before lift or transport strategies harden.",
      impact: "Lift studies, transport, support design and contingency.",
      action: "Close the delta between weight reports, drawings and change records.",
    },
    {
      key: "Inspection",
      title: "Inspection Records",
      score: 84,
      status: "Good coverage",
      copy: "Connects current condition evidence to access, dismantling and temporary-state assumptions.",
      impact: "Personnel access, plant selection, sequence and risk controls.",
      action: "Confirm the inspection basis remains current for the intended method.",
    },
  ];

  const state = {
    asset: "offshore",
    selected: "Structural",
    preview: null,
    threeReady: false,
    threeFailed: false,
  };

  function qualityClass(score) {
    return score < 50 ? "critical" : score < 70 ? "moderate" : "good";
  }

  function domainByKey(key) {
    return domains.find((domain) => domain.key === key);
  }

  function renderDomainList() {
    list.innerHTML = domains
      .map((domain, index) => {
        const active = domain.key === state.selected;
        const quality = qualityClass(domain.score);
        return `<button type="button" role="tab" class="explorer-domain-btn ${active ? "active" : ""}" data-domain="${domain.key}" aria-selected="${active}" tabindex="${active ? "0" : "-1"}"><span class="domain-index">${String(index + 1).padStart(2, "0")}</span><span class="domain-name">${domain.title}</span><span class="domain-status ${quality}">${domain.status}</span><strong class="${quality}">${domain.score}</strong></button>`;
      })
      .join("");

    const buttons = [...list.querySelectorAll("button")];
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => selectDomain(button.dataset.domain, true));
      button.addEventListener("pointerenter", () => previewDomain(button.dataset.domain));
      button.addEventListener("pointerleave", clearPreview);
      button.addEventListener("focus", () => previewDomain(button.dataset.domain));
      button.addEventListener("blur", clearPreview);
      button.addEventListener("keydown", (event) => {
        if (!["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let next = index;
        if (event.key === "ArrowDown" || event.key === "ArrowRight") next = (index + 1) % buttons.length;
        if (event.key === "ArrowUp" || event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = buttons.length - 1;
        buttons[next].focus();
        selectDomain(buttons[next].dataset.domain, true);
      });
    });
  }

  function updateDetail(domain) {
    if (!domain) return;
    document.getElementById("explorerDomainK").textContent = domain.key;
    document.getElementById("explorerDomainTitle").textContent = domain.title;
    document.getElementById("explorerDomainScore").textContent = domain.score;
    document.getElementById("explorerDomainStatus").textContent = domain.status;
    document.getElementById("explorerDomainStatus").className = `domain-state ${qualityClass(domain.score)}`;
    document.getElementById("explorerDomainMeter").style.width = `${domain.score}%`;
    document.getElementById("explorerDomainCopy").textContent = domain.copy;
    document.getElementById("explorerDomainImpact").textContent = domain.impact;
    document.getElementById("explorerDomainAction").textContent = domain.action;
  }

  function selectDomain(key, announce) {
    const domain = domainByKey(key);
    if (!domain) return;
    state.selected = key;
    state.preview = null;
    updateDetail(domain);
    renderDomainList();
    renderHotspots();
    if (window.EnduraExplorer3D) window.EnduraExplorer3D.highlightDomain(key, Boolean(announce));
    if (announce && liveStatus) liveStatus.textContent = `${domain.title} selected. Illustrative score ${domain.score} out of 100.`;
  }

  function previewDomain(key) {
    state.preview = key;
    if (window.EnduraExplorer3D) window.EnduraExplorer3D.previewDomain(key);
    hotspotLayer.querySelectorAll("button").forEach((button) => button.classList.toggle("preview", button.dataset.domain === key));
  }

  function clearPreview() {
    state.preview = null;
    if (window.EnduraExplorer3D) window.EnduraExplorer3D.previewDomain(null);
    hotspotLayer.querySelectorAll("button").forEach((button) => button.classList.remove("preview"));
  }

  const fallbackAnchors = {
    offshore: {
      Structural: [24, 58], Hazmat: [67, 44], Isolation: [62, 61], "As-builts": [43, 31], "P&IDs": [52, 53], Waste: [76, 62], "Well P&A": [43, 76], Weight: [22, 35], Inspection: [56, 22],
    },
    onshore: {
      Structural: [38, 52], Hazmat: [76, 62], Isolation: [56, 66], "As-builts": [22, 58], "P&IDs": [49, 50], Waste: [82, 73], "Well P&A": [18, 75], Weight: [68, 41], Inspection: [28, 26],
    },
  };

  function renderHotspots() {
    hotspotLayer.innerHTML = domains
      .map((domain, index) => {
        const quality = qualityClass(domain.score);
        const fallbackPosition = fallbackAnchors[state.asset][domain.key];
        return `<button type="button" class="asset-hotspot ${quality} ${domain.key === state.selected ? "active" : ""}" data-domain="${domain.key}" aria-label="${domain.title}, illustrative score ${domain.score}" style="left:${fallbackPosition[0]}%;top:${fallbackPosition[1]}%"><span>${index + 1}</span></button>`;
      })
      .join("");
    hotspotLayer.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => selectDomain(button.dataset.domain, true));
      button.addEventListener("pointerenter", () => previewDomain(button.dataset.domain));
      button.addEventListener("pointerleave", clearPreview);
      button.addEventListener("focus", () => previewDomain(button.dataset.domain));
      button.addEventListener("blur", clearPreview);
    });
    if (window.EnduraExplorer3D) window.EnduraExplorer3D.registerHotspots();
  }

  function setFallbackAsset(asset) {
    if (!fallbackImage) return;
    fallbackImage.src = asset === "offshore" ? "assets/img/explorer-offshore-fallback.png" : "assets/img/explorer-onshore-fallback.png";
    fallbackImage.alt = asset === "offshore" ? "Static fallback view of the illustrative offshore platform model" : "Static fallback view of the illustrative onshore plant model";
  }

  function setAsset(asset, announce) {
    state.asset = asset;
    document.querySelectorAll("[data-asset]").forEach((button) => {
      const active = button.dataset.asset === asset;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    if (assetLabel) assetLabel.textContent = asset === "offshore" ? "Offshore platform" : "Onshore plant";
    setFallbackAsset(asset);
    renderHotspots();
    if (window.EnduraExplorer3D) window.EnduraExplorer3D.setAsset(asset);
    if (announce && liveStatus) liveStatus.textContent = `${asset === "offshore" ? "Offshore platform" : "Onshore plant"} view selected.`;
  }

  document.querySelectorAll("[data-asset]").forEach((button) => button.addEventListener("click", () => setAsset(button.dataset.asset, true)));

  renderDomainList();
  renderHotspots();
  updateDetail(domainByKey(state.selected));
  setFallbackAsset(state.asset);

  function showFallback(message) {
    state.threeFailed = true;
    loading?.setAttribute("hidden", "");
    fallback?.removeAttribute("hidden");
    canvas.setAttribute("hidden", "");
    hotspotLayer.classList.add("fallback-hotspots");
    if (fallbackMessage) fallbackMessage.textContent = message || "Interactive 3D is unavailable. The static model and domain controls remain available.";
  }

  function supportsWebGL() {
    try {
      const probe = document.createElement("canvas");
      return Boolean(window.WebGLRenderingContext && (probe.getContext("webgl2") || probe.getContext("webgl") || probe.getContext("experimental-webgl")));
    } catch (error) {
      return false;
    }
  }

  function loadThreeAndStart() {
    if (state.threeReady || state.threeFailed) return;
    if (!supportsWebGL()) {
      showFallback("WebGL is not available in this browser. The static model and domain controls remain available.");
      return;
    }
    loading?.removeAttribute("hidden");
    if (window.THREE) {
      try {
        initialiseThree();
        state.threeReady = true;
        loading?.setAttribute("hidden", "");
        fallback?.setAttribute("hidden", "");
        canvas.removeAttribute("hidden");
        hotspotLayer.classList.remove("fallback-hotspots");
      } catch (error) {
        console.error("Asset Explorer 3D initialisation failed", error);
        showFallback("The interactive model could not initialise. The static model and domain controls remain available.");
      }
      return;
    }
    const script = document.createElement("script");
    script.src = "assets/vendor/three.min.js";
    script.async = true;
    script.onload = () => {
      if (!window.THREE) {
        showFallback("The 3D engine did not initialise. The static model and domain controls remain available.");
        return;
      }
      try {
        initialiseThree();
        state.threeReady = true;
        loading?.setAttribute("hidden", "");
        fallback?.setAttribute("hidden", "");
        canvas.removeAttribute("hidden");
        hotspotLayer.classList.remove("fallback-hotspots");
      } catch (error) {
        console.error("Asset Explorer 3D initialisation failed", error);
        showFallback("The interactive model could not initialise. The static model and domain controls remain available.");
      }
    };
    script.onerror = () => showFallback("The local 3D engine could not load. The static model and domain controls remain available.");
    document.head.appendChild(script);
  }

  if ("IntersectionObserver" in window) {
    const loadObserver = new IntersectionObserver((entries, observer) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadThreeAndStart();
        observer.disconnect();
      }
    }, { rootMargin: "350px 0px" });
    loadObserver.observe(stage);
  } else {
    loadThreeAndStart();
  }

  function initialiseThree() {
    const THREE = window.THREE;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, stage.clientWidth < 600 ? 1.45 : 1.8));
    renderer.outputEncoding = THREE.sRGBEncoding;
    if (THREE.ACESFilmicToneMapping) renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = document.documentElement.dataset.theme === "dark" ? 1.02 : .94;
    renderer.setClearColor(0x000000, 0);
    const enableShadows = stage.clientWidth >= 680 && !reduceMotion;
    renderer.shadowMap.enabled = enableShadows;
    if (enableShadows) renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clock = new THREE.Clock();
    const root = new THREE.Group();
    scene.add(root);

    const qualityColours = { critical: 0xc95745, moderate: 0xd6922f, good: 0x278d82 };
    const themePalettes = {
      light: {
        steel: 0x556b75,
        steelDark: 0x293c46,
        galvanised: 0x84969e,
        weathered: 0x765d4c,
        painted: 0xb8c4c8,
        deck: 0x61757e,
        helideck: 0x34434a,
        grating: 0x74868e,
        equipment: 0x566d77,
        equipmentLight: 0x8ea1a8,
        equipmentDark: 0x425861,
        pipe: 0x8d725c,
        pipeProcess: 0x416b78,
        pipeWarm: 0x9b7652,
        building: 0xc5cccd,
        glass: 0x5b8797,
        concrete: 0xc9c5bb,
        asphalt: 0x4c5357,
        safety: 0xe69336,
        rust: 0x8d4e2f,
        ground: 0xe4dfd4,
        sea: 0x4b7d8c,
        grid: 0xa8b1b2,
        edge: 0x26343b,
        sky: 0xdce7e9,
        skyTop: 0xb7d2da,
        skyBottom: 0xf5eee3,
      },
      dark: {
        steel: 0x566b76,
        steelDark: 0x263a45,
        galvanised: 0x82949d,
        weathered: 0x684f40,
        painted: 0x9ba8ad,
        deck: 0x60747d,
        helideck: 0x26353c,
        grating: 0x70848c,
        equipment: 0x4d626d,
        equipmentLight: 0x7c8e95,
        equipmentDark: 0x344a55,
        pipe: 0x866c57,
        pipeProcess: 0x547782,
        pipeWarm: 0x94704d,
        building: 0x6e7a80,
        glass: 0x2f6374,
        concrete: 0x3a4347,
        asphalt: 0x20262a,
        safety: 0xe28a31,
        rust: 0x754127,
        ground: 0x1f282d,
        sea: 0x123b4c,
        grid: 0x42535b,
        edge: 0xa9bbc2,
        sky: 0x17242b,
        skyTop: 0x142a35,
        skyBottom: 0x37434a,
      },
    };

    const materials = new Set();
    const selectableMeshes = [];
    const domainMeshes = new Map(domains.map((domain) => [domain.key, []]));
    const anchors = { offshore: {}, onshore: {} };
    let theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    let activeModel = null;
    let offshoreModel = null;
    let onshoreModel = null;
    let grid = null;
    let seaSurface = null;
    let groundSurface = null;
    let activeDomain = state.selected;
    let previewDomainKey = null;
    let assembling = false;
    let assemblyStart = 0;
    let autoRotate = !reduceMotion;
    let stageVisible = true;
    let raf = 0;
    let dragging = false;
    let moved = false;
    let pointerId = null;
    let lastX = 0;
    let lastY = 0;
    let pinchDistance = null;
    let azimuth = 0.78;
    let elevation = 0.36;
    let distance = 39;
    let target = new THREE.Vector3(0, 3.4, 0);
    let renderedAzimuth = azimuth;
    let renderedElevation = elevation;
    let renderedDistance = distance;
    const renderedTarget = target.clone();
    let azimuthVelocity = 0;
    let elevationVelocity = 0;
    let viewerMode = "standard";
    let hotspotFrame = 0;
    const defaults = {
      offshore: { azimuth: 0.76, elevation: 0.31, distance: 39, target: new THREE.Vector3(0, 3.3, 0) },
      onshore: { azimuth: 0.8, elevation: 0.3, distance: 48.5, target: new THREE.Vector3(-0.8, 3.75, 0) },
    };

    const hemisphere = new THREE.HemisphereLight(0xdbe8ef, 0x1a242a, 0.88);
    scene.add(hemisphere);
    const key = new THREE.DirectionalLight(0xffefe2, 1.02);
    key.position.set(18, 28, 16);
    key.castShadow = enableShadows;
    if (enableShadows) {
      key.shadow.mapSize.set(1024, 1024);
      key.shadow.camera.left = -28;
      key.shadow.camera.right = 28;
      key.shadow.camera.top = 28;
      key.shadow.camera.bottom = -28;
      key.shadow.camera.near = 0.5;
      key.shadow.camera.far = 90;
    }
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xf18a3e, 0.52);
    rim.position.set(-18, 15, -12);
    scene.add(rim);
    const fill = new THREE.DirectionalLight(0x58b7aa, 0.3);
    fill.position.set(0, 10, 22);
    scene.add(fill);
    const softFill = new THREE.DirectionalLight(0xbecdd4, 0.28);
    softFill.position.set(16, 7, -22);
    scene.add(softFill);

    const skyUniforms = {
      topColor: { value: new THREE.Color(themePalettes[theme].skyTop) },
      bottomColor: { value: new THREE.Color(themePalettes[theme].skyBottom) },
      offset: { value: 20 },
      exponent: { value: 0.72 },
    };
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(105, 32, 18),
      new THREE.ShaderMaterial({
        uniforms: skyUniforms,
        vertexShader: "varying vec3 vWorldPosition; void main(){ vec4 worldPosition = modelMatrix * vec4(position,1.0); vWorldPosition = worldPosition.xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "uniform vec3 topColor; uniform vec3 bottomColor; uniform float offset; uniform float exponent; varying vec3 vWorldPosition; void main(){ float h = normalize(vWorldPosition + vec3(0.0,offset,0.0)).y; float mixValue = max(pow(max(h,0.0),exponent),0.0); gl_FragColor = vec4(mix(bottomColor,topColor,mixValue),1.0); }",
        side: THREE.BackSide,
        depthWrite: false,
      }),
    );
    skyDome.position.y = 5;
    scene.add(skyDome);

    const geometryCache = new Map();
    const materialCache = new Map();

    function palette() {
      return themePalettes[theme];
    }

    const materialPresets = {
      steel: { roughness: .56, metalness: .42 },
      steelDark: { roughness: .54, metalness: .48 },
      galvanised: { roughness: .4, metalness: .62 },
      weathered: { roughness: .78, metalness: .24 },
      painted: { roughness: .48, metalness: .3 },
      deck: { roughness: .66, metalness: .28 },
      helideck: { roughness: .58, metalness: .32 },
      grating: { roughness: .6, metalness: .52 },
      equipment: { roughness: .5, metalness: .34 },
      equipmentLight: { roughness: .44, metalness: .38 },
      equipmentDark: { roughness: .5, metalness: .32 },
      pipe: { roughness: .46, metalness: .38 },
      pipeProcess: { roughness: .4, metalness: .44 },
      pipeWarm: { roughness: .5, metalness: .32 },
      building: { roughness: .72, metalness: .08 },
      glass: { roughness: .12, metalness: .18 },
      concrete: { roughness: .96, metalness: 0 },
      asphalt: { roughness: .99, metalness: 0 },
      safety: { roughness: .46, metalness: .24 },
      rust: { roughness: .82, metalness: .12 },
    };

    function materialFor(domain, kind, options = {}) {
      const preset = materialPresets[kind] || materialPresets.steel;
      const roughness = options.roughness ?? preset.roughness;
      const metalness = options.metalness ?? preset.metalness;
      const opacity = options.opacity ?? 1;
      const keyName = `${domain || "neutral"}|${kind}|${roughness}|${metalness}|${opacity}|${options.doubleSide ? "d" : "f"}`;
      if (materialCache.has(keyName)) return materialCache.get(keyName);
      const base = palette()[kind] || palette().steel;
      const material = new THREE.MeshStandardMaterial({
        color: base,
        roughness,
        metalness,
        transparent: Boolean(options.transparent || opacity < 1),
        opacity,
        side: options.doubleSide ? THREE.DoubleSide : THREE.FrontSide,
        depthWrite: opacity >= .98,
      });
      material.userData = { domain, kind, baseOpacity: opacity, roughness, metalness };
      materialCache.set(keyName, material);
      materials.add(material);
      return material;
    }

    function geometry(keyName, factory) {
      if (!geometryCache.has(keyName)) geometryCache.set(keyName, factory());
      return geometryCache.get(keyName);
    }

    function attachEdges(mesh, opacity = 0.24) {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(mesh.geometry, 28),
        new THREE.LineBasicMaterial({ color: palette().edge, transparent: true, opacity }),
      );
      edges.userData.edge = true;
      mesh.add(edges);
      mesh.userData.edges = edges;
    }

    function register(mesh, domain, options = {}) {
      mesh.userData.domain = domain || null;
      mesh.userData.baseScale = mesh.scale.clone();
      if (domain) {
        domainMeshes.get(domain)?.push(mesh);
        if (options.selectable !== false) selectableMeshes.push(mesh);
      }
      if (options.edges) attachEdges(mesh, options.edgeOpacity ?? 0.22);
      mesh.castShadow = enableShadows && options.castShadow !== false;
      mesh.receiveShadow = enableShadows && Boolean(options.receiveShadow);
      return mesh;
    }

    function box(w, h, d, domain, kind = "steel", options = {}) {
      const mesh = new THREE.Mesh(
        geometry(`box:${w}:${h}:${d}`, () => new THREE.BoxGeometry(w, h, d)),
        materialFor(domain, kind, options),
      );
      return register(mesh, domain, options);
    }

    function cylinder(rt, rb, h, segments, domain, kind = "steel", options = {}) {
      const mesh = new THREE.Mesh(
        geometry(`cyl:${rt}:${rb}:${h}:${segments}`, () => new THREE.CylinderGeometry(rt, rb, h, segments || 12)),
        materialFor(domain, kind, options),
      );
      return register(mesh, domain, options);
    }

    function sphere(r, domain, kind = "equipment", options = {}) {
      const mesh = new THREE.Mesh(
        geometry(`sph:${r}`, () => new THREE.SphereGeometry(r, 18, 12)),
        materialFor(domain, kind, options),
      );
      return register(mesh, domain, options);
    }

    function torus(radius, tube, domain, kind = "pipe", options = {}) {
      const mesh = new THREE.Mesh(
        geometry(`torus:${radius}:${tube}`, () => new THREE.TorusGeometry(radius, tube, 8, 24)),
        materialFor(domain, kind, options),
      );
      return register(mesh, domain, options);
    }

    function beamBetween(start, end, radius, domain, kind = "steel", options = {}) {
      const a = start.clone();
      const b = end.clone();
      const direction = b.clone().sub(a);
      const length = direction.length();
      const mesh = cylinder(radius, radius, length, options.segments || 8, domain, kind, options);
      mesh.position.copy(a).lerp(b, 0.5);
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      mesh.userData.basePosition = mesh.position.clone();
      return mesh;
    }

    function pipeCurve(points, radius, domain, kind = "pipe", options = {}) {
      const curve = new THREE.CatmullRomCurve3(points);
      const mesh = new THREE.Mesh(
        new THREE.TubeGeometry(curve, Math.max(18, points.length * 10), radius, 7, false),
        materialFor(domain, kind, options),
      );
      return register(mesh, domain, options);
    }


    function captureBasePositions(group) {
      group.traverse((object) => {
        if (object.isMesh) object.userData.basePosition = object.position.clone();
      });
      return group;
    }

    function addAnchor(asset, key, position, parent) {
      const anchor = new THREE.Object3D();
      anchor.position.copy(position);
      parent.add(anchor);
      anchors[asset][key] = anchor;
    }

    function deckFrame(width, depth, y, domain, parent, options = {}) {
      const group = new THREE.Group();
      const slab = box(width, 0.34, depth, domain, "deck", { edges: true, receiveShadow: true });
      slab.position.y = y;
      group.add(slab);
      const beamRadius = options.beamRadius || 0.13;
      [-depth / 2 + 0.18, depth / 2 - 0.18].forEach((z) => {
        group.add(beamBetween(new THREE.Vector3(-width / 2, y - 0.28, z), new THREE.Vector3(width / 2, y - 0.28, z), beamRadius, domain, "steelDark"));
      });
      [-width / 2 + 0.18, width / 2 - 0.18].forEach((x) => {
        group.add(beamBetween(new THREE.Vector3(x, y - 0.28, -depth / 2), new THREE.Vector3(x, y - 0.28, depth / 2), beamRadius, domain, "steelDark"));
      });
      for (let x = -width / 2 + 1.25; x < width / 2; x += 1.8) {
        group.add(beamBetween(new THREE.Vector3(x, y - 0.25, -depth / 2), new THREE.Vector3(x, y - 0.25, depth / 2), 0.08, domain, "steelDark", { selectable: false }));
      }
      parent.add(group);
      return group;
    }

    function createContactShadow(parent, x, z, width, depth, opacity = 0.22, y = 0.01) {
      if (!createContactShadow.texture) {
        const shadowCanvas = document.createElement("canvas");
        shadowCanvas.width = 256;
        shadowCanvas.height = 256;
        const context = shadowCanvas.getContext("2d");
        const gradient = context.createRadialGradient(128, 128, 12, 128, 128, 126);
        gradient.addColorStop(0, "rgba(0,0,0,.72)");
        gradient.addColorStop(.45, "rgba(0,0,0,.28)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");
        context.fillStyle = gradient;
        context.fillRect(0, 0, 256, 256);
        createContactShadow.texture = new THREE.CanvasTexture(shadowCanvas);
        createContactShadow.texture.needsUpdate = true;
      }
      const material = new THREE.MeshBasicMaterial({
        map: createContactShadow.texture,
        transparent: true,
        opacity,
        depthWrite: false,
        color: 0x000000,
      });
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), material);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.set(x, y, z);
      shadow.renderOrder = -1;
      parent.add(shadow);
      return shadow;
    }

    function addVerticalLadder(parent, x, z, y1, y2, width = 0.46, domain = "Inspection", alongX = true) {
      const ladder = new THREE.Group();
      const offsetA = alongX ? new THREE.Vector3(-width / 2, 0, 0) : new THREE.Vector3(0, 0, -width / 2);
      const offsetB = alongX ? new THREE.Vector3(width / 2, 0, 0) : new THREE.Vector3(0, 0, width / 2);
      const base = new THREE.Vector3(x, y1, z);
      const top = new THREE.Vector3(x, y2, z);
      ladder.add(beamBetween(base.clone().add(offsetA), top.clone().add(offsetA), 0.035, domain, "galvanised", { selectable: false, castShadow: false }));
      ladder.add(beamBetween(base.clone().add(offsetB), top.clone().add(offsetB), 0.035, domain, "galvanised", { selectable: false, castShadow: false }));
      for (let y = y1 + 0.25; y < y2; y += 0.36) {
        const a = new THREE.Vector3(x, y, z).add(offsetA);
        const b = new THREE.Vector3(x, y, z).add(offsetB);
        ladder.add(beamBetween(a, b, 0.025, domain, "galvanised", { selectable: false, castShadow: false }));
      }
      parent.add(ladder);
      return ladder;
    }

    function addRectHandrail(parent, cx, cz, width, depth, deckY, domain = "Inspection", options = {}) {
      const rail = new THREE.Group();
      const yMid = deckY + 0.48;
      const yTop = deckY + 0.92;
      const x1 = cx - width / 2;
      const x2 = cx + width / 2;
      const z1 = cz - depth / 2;
      const z2 = cz + depth / 2;
      const skip = options.skip || [];
      const sideSegments = [
        { name: "front", a: new THREE.Vector3(x1, 0, z2), b: new THREE.Vector3(x2, 0, z2), length: width },
        { name: "back", a: new THREE.Vector3(x1, 0, z1), b: new THREE.Vector3(x2, 0, z1), length: width },
        { name: "left", a: new THREE.Vector3(x1, 0, z1), b: new THREE.Vector3(x1, 0, z2), length: depth },
        { name: "right", a: new THREE.Vector3(x2, 0, z1), b: new THREE.Vector3(x2, 0, z2), length: depth },
      ];
      sideSegments.forEach((side) => {
        if (skip.includes(side.name)) return;
        [yMid, yTop].forEach((y) => rail.add(beamBetween(
          new THREE.Vector3(side.a.x, y, side.a.z),
          new THREE.Vector3(side.b.x, y, side.b.z),
          0.035,
          domain,
          "galvanised",
          { selectable: false, castShadow: false },
        )));
        const count = Math.max(2, Math.ceil(side.length / 1.45));
        for (let i = 0; i <= count; i += 1) {
          const t = i / count;
          const p = side.a.clone().lerp(side.b, t);
          rail.add(beamBetween(
            new THREE.Vector3(p.x, deckY + 0.05, p.z),
            new THREE.Vector3(p.x, yTop, p.z),
            0.032,
            domain,
            "galvanised",
            { selectable: false, castShadow: false },
          ));
        }
      });
      parent.add(rail);
      return rail;
    }

    function addStairFlight(parent, start, runX, runZ, rise, width = 0.9, steps = 10, domain = "Inspection") {
      const stair = new THREE.Group();
      const direction = new THREE.Vector3(runX, 0, runZ);
      const length = direction.length();
      if (length < 0.01) return stair;
      direction.normalize();
      const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
      const angle = Math.atan2(direction.x, direction.z);
      const stepDepth = length / steps * 1.08;
      for (let i = 0; i < steps; i += 1) {
        const t = (i + 0.5) / steps;
        const step = box(width, 0.07, stepDepth, domain, "grating", { selectable: false, castShadow: false });
        step.rotation.y = angle;
        step.position.copy(start).add(direction.clone().multiplyScalar(length * t));
        step.position.y += rise * t;
        stair.add(step);
      }
      [-1, 1].forEach((side) => {
        const offset = perpendicular.clone().multiplyScalar(width * 0.48 * side);
        const a = start.clone().add(offset).add(new THREE.Vector3(0, 0.86, 0));
        const b = start.clone().add(new THREE.Vector3(runX, rise + 0.86, runZ)).add(offset);
        stair.add(beamBetween(a, b, 0.035, domain, "galvanised", { selectable: false, castShadow: false }));
        const lowerA = start.clone().add(offset).add(new THREE.Vector3(0, 0.46, 0));
        const lowerB = start.clone().add(new THREE.Vector3(runX, rise + 0.46, runZ)).add(offset);
        stair.add(beamBetween(lowerA, lowerB, 0.028, domain, "galvanised", { selectable: false, castShadow: false }));
      });
      parent.add(stair);
      return stair;
    }

    function moduleFrame(parent, cx, baseY, cz, width, height, depth, domain = "Structural", options = {}) {
      const frame = new THREE.Group();
      const x1 = cx - width / 2;
      const x2 = cx + width / 2;
      const z1 = cz - depth / 2;
      const z2 = cz + depth / 2;
      const y1 = baseY;
      const y2 = baseY + height;
      [[x1, z1], [x1, z2], [x2, z1], [x2, z2]].forEach(([x, z]) => {
        frame.add(beamBetween(new THREE.Vector3(x, y1, z), new THREE.Vector3(x, y2, z), 0.075, domain, options.kind || "steelDark", { selectable: options.selectable !== false }));
      });
      [y1, y2].forEach((y) => {
        frame.add(beamBetween(new THREE.Vector3(x1, y, z1), new THREE.Vector3(x2, y, z1), 0.07, domain, options.kind || "steelDark"));
        frame.add(beamBetween(new THREE.Vector3(x1, y, z2), new THREE.Vector3(x2, y, z2), 0.07, domain, options.kind || "steelDark"));
        frame.add(beamBetween(new THREE.Vector3(x1, y, z1), new THREE.Vector3(x1, y, z2), 0.07, domain, options.kind || "steelDark"));
        frame.add(beamBetween(new THREE.Vector3(x2, y, z1), new THREE.Vector3(x2, y, z2), 0.07, domain, options.kind || "steelDark"));
      });
      if (options.braced !== false) {
        frame.add(beamBetween(new THREE.Vector3(x1, y1, z1), new THREE.Vector3(x2, y2, z1), 0.045, domain, options.kind || "steelDark", { selectable: false }));
        frame.add(beamBetween(new THREE.Vector3(x2, y1, z2), new THREE.Vector3(x1, y2, z2), 0.045, domain, options.kind || "steelDark", { selectable: false }));
      }
      parent.add(frame);
      return frame;
    }

    function verticalVessel(parent, x, baseY, z, height, radius, domain, options = {}) {
      const bodyHeight = height - radius * 0.9;
      const kind = options.kind || "equipmentLight";
      const body = cylinder(radius, radius, bodyHeight, 22, domain, kind, { edges: true, roughness: 0.4, metalness: 0.42 });
      body.position.set(x, baseY + bodyHeight / 2 + radius * 0.25, z);
      parent.add(body);
      const top = sphere(radius, domain, kind, { selectable: false, roughness: 0.4, metalness: 0.42 });
      top.scale.y = 0.42;
      top.position.set(x, baseY + bodyHeight + radius * 0.38, z);
      parent.add(top);
      const bottom = sphere(radius, domain, kind, { selectable: false, roughness: 0.4, metalness: 0.42 });
      bottom.scale.y = 0.34;
      bottom.position.set(x, baseY + radius * 0.22, z);
      parent.add(bottom);
      [-0.55, 0.55].forEach((dx) => {
        const leg = box(0.18, 0.85, 0.18, domain, "steelDark", { selectable: false });
        leg.position.set(x + dx * radius, baseY - 0.22, z);
        parent.add(leg);
      });
      if (options.platforms !== false) {
        for (let y = baseY + 1.4; y < baseY + height - 0.8; y += 2.2) {
          const platform = torus(radius + 0.22, 0.045, "Inspection", "galvanised", { selectable: false, castShadow: false });
          platform.rotation.x = Math.PI / 2;
          platform.position.set(x, y, z);
          parent.add(platform);
        }
        addVerticalLadder(parent, x - radius - 0.22, z, baseY, baseY + height - 0.5, 0.38, "Inspection", false);
      }
      return body;
    }

    function horizontalVessel(parent, x, y, z, length, radius, domain, options = {}) {
      const kind = options.kind || "equipmentLight";
      const body = cylinder(radius, radius, length, 22, domain, kind, { edges: true, roughness: 0.42, metalness: 0.4 });
      body.rotation.z = Math.PI / 2;
      body.position.set(x, y, z);
      parent.add(body);
      [-1, 1].forEach((side) => {
        const end = sphere(radius, domain, kind, { selectable: false, roughness: 0.42, metalness: 0.4 });
        end.scale.x = 0.38;
        end.position.set(x + side * length / 2, y, z);
        parent.add(end);
        const saddle = box(0.28, 0.55, radius * 1.35, domain, "steelDark", { selectable: false });
        saddle.position.set(x + side * length * 0.28, y - radius - 0.28, z);
        parent.add(saddle);
      });
      const nozzle = cylinder(radius * 0.18, radius * 0.18, 0.7, 12, domain, "pipeProcess", { selectable: false });
      nozzle.position.set(x, y + radius + 0.32, z);
      parent.add(nozzle);
      return body;
    }

    function pumpSkid(parent, x, y, z, domain = "P&IDs", rotation = 0) {
      const group = new THREE.Group();
      group.position.set(x, y, z);
      group.rotation.y = rotation;
      const base = box(2.0, 0.12, 0.9, domain, "painted", { edges: true, selectable: false });
      base.position.y = 0.06;
      group.add(base);
      const motor = cylinder(0.32, 0.32, 0.92, 16, domain, "equipmentDark", { edges: true });
      motor.rotation.z = Math.PI / 2;
      motor.position.set(-0.4, 0.48, 0);
      group.add(motor);
      const pump = cylinder(0.38, 0.28, 0.58, 16, domain, "equipmentLight", { edges: true });
      pump.rotation.z = Math.PI / 2;
      pump.position.set(0.52, 0.42, 0);
      group.add(pump);
      const suction = cylinder(0.09, 0.09, 0.9, 10, domain, "pipeProcess", { selectable: false });
      suction.rotation.z = Math.PI / 2;
      suction.position.set(1.12, 0.42, 0);
      group.add(suction);
      parent.add(group);
      return group;
    }

    function addDeckGrating(parent, width, depth, y, x = 0, z = 0, domain = "Inspection") {
      const grating = box(width, 0.055, depth, domain, "grating", { receiveShadow: true, selectable: false, roughness: 0.72, metalness: 0.45 });
      grating.position.set(x, y, z);
      parent.add(grating);
      return grating;
    }

    function createHelideck(parent) {
      const support = new THREE.Group();
      const deckY = 11.35;
      const cx = -1.1;
      const cz = -0.85;
      [[-2.1, -1.9], [2.1, -1.9], [-2.1, 1.9], [2.1, 1.9]].forEach(([dx, dz]) => {
        support.add(beamBetween(new THREE.Vector3(cx + dx * .65, 9.55, cz + dz * .65), new THREE.Vector3(cx + dx, deckY - .2, cz + dz), 0.09, "Weight", "steelDark", { selectable: false }));
      });
      parent.add(support);
      const deck = cylinder(3.35, 3.35, 0.26, 48, "Inspection", "helideck", { edges: true, receiveShadow: true, roughness: 0.58, metalness: 0.32 });
      deck.position.set(cx, deckY, cz);
      parent.add(deck);
      const ring = torus(3.20, 0.075, "Inspection", "safety", { selectable: false, castShadow: false });
      ring.rotation.x = Math.PI / 2;
      ring.position.set(cx, deckY + 0.5, cz);
      parent.add(ring);
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
        const x = cx + Math.cos(a) * 3.28;
        const z = cz + Math.sin(a) * 3.28;
        parent.add(beamBetween(new THREE.Vector3(x, deckY + .05, z), new THREE.Vector3(x, deckY + .5, z), .028, "Inspection", "galvanised", { selectable: false, castShadow: false }));
      }
      const hLong = box(0.28, 0.055, 2.35, "Inspection", "safety", { selectable: false, castShadow: false });
      hLong.position.set(cx, deckY + .16, cz);
      parent.add(hLong);
      [-.9, .9].forEach((dz) => {
        const hCross = box(1.35, 0.055, 0.28, "Inspection", "safety", { selectable: false, castShadow: false });
        hCross.position.set(cx, deckY + .16, cz + dz);
        parent.add(hCross);
      });
    }

    function createCrane(parent) {
      const cx = -4.55;
      const cz = 2.75;
      const pedestal = cylinder(0.62, 0.78, 3.25, 18, "Weight", "painted", { edges: true, roughness: .48, metalness: .36 });
      pedestal.position.set(cx, 8.75, cz);
      parent.add(pedestal);
      const slew = cylinder(0.82, 0.82, 0.28, 20, "Weight", "steelDark", { edges: true });
      slew.position.set(cx, 10.42, cz);
      parent.add(slew);
      const cabin = box(1.25, 1.05, 1.15, "Weight", "building", { edges: true });
      cabin.position.set(cx - .12, 10.96, cz);
      parent.add(cabin);
      const glass = box(.88, .42, .035, "Weight", "glass", { selectable: false, castShadow: false, transparent: true, opacity: .72 });
      glass.position.set(cx - .1, 11.08, cz + .59);
      parent.add(glass);
      const boomStart = new THREE.Vector3(cx - .1, 11.25, cz);
      const boomEnd = new THREE.Vector3(-9.25, 15.35, 3.85);
      const side = new THREE.Vector3(.16, 0, .25);
      const chordPoints = [side, side.clone().multiplyScalar(-1)];
      chordPoints.forEach((offset) => {
        parent.add(beamBetween(boomStart.clone().add(offset), boomEnd.clone().add(offset), .075, "Weight", "steelDark", { selectable: false }));
      });
      const boomDirection = boomEnd.clone().sub(boomStart);
      for (let t = .12; t < 1; t += .12) {
        const center = boomStart.clone().lerp(boomEnd, t);
        const next = boomStart.clone().lerp(boomEnd, Math.min(1, t + .12));
        const left = center.clone().add(side);
        const right = center.clone().sub(side);
        parent.add(beamBetween(left, right, .035, "Weight", "steelDark", { selectable: false, castShadow: false }));
        const nextOffset = t % .24 < .13 ? side : side.clone().multiplyScalar(-1);
        parent.add(beamBetween(right, next.clone().add(nextOffset), .03, "Weight", "steelDark", { selectable: false, castShadow: false }));
      }
      const counterweight = box(1.3, .65, 1.1, "Weight", "equipmentDark", { edges: true });
      counterweight.position.set(cx + .9, 10.85, cz - .05);
      parent.add(counterweight);
      const cableTop = boomEnd.clone();
      const hookPoint = new THREE.Vector3(boomEnd.x, 8.7, boomEnd.z);
      parent.add(beamBetween(cableTop, hookPoint, .018, "Weight", "steelDark", { selectable: false, castShadow: false }));
      const hook = torus(.24, .055, "Weight", "safety", { selectable: false });
      hook.rotation.x = Math.PI / 2;
      hook.position.copy(hookPoint).add(new THREE.Vector3(0, -.18, 0));
      parent.add(hook);
    }

    function createFlareBoom(parent) {
      const start = new THREE.Vector3(4.0, 9.65, -2.45);
      const end = new THREE.Vector3(8.6, 14.2, -5.1);
      const offsets = [new THREE.Vector3(.18, 0, .12), new THREE.Vector3(-.18, 0, -.12)];
      offsets.forEach((offset) => parent.add(beamBetween(start.clone().add(offset), end.clone().add(offset), .07, "Inspection", "steelDark", { selectable: false })));
      for (let t = .1; t < 1; t += .12) {
        const p = start.clone().lerp(end, t);
        const q = start.clone().lerp(end, Math.min(1, t + .12));
        parent.add(beamBetween(p.clone().add(offsets[0]), p.clone().add(offsets[1]), .028, "Inspection", "steelDark", { selectable: false, castShadow: false }));
        parent.add(beamBetween(p.clone().add(offsets[t % .24 < .13 ? 0 : 1]), q.clone().add(offsets[t % .24 < .13 ? 1 : 0]), .025, "Inspection", "steelDark", { selectable: false, castShadow: false }));
      }
      const flareTip = cylinder(.17, .26, 1.45, 12, "Inspection", "rust", { edges: true });
      flareTip.position.copy(end).add(new THREE.Vector3(.24, .55, -.15));
      flareTip.rotation.z = -.69;
      parent.add(flareTip);
    }

    function createOffshore() {
      const group = new THREE.Group();
      group.name = "Offshore platform";
      const seabedY = -8.5;
      const seaGeometry = new THREE.PlaneGeometry(120, 120, 54, 54);
      seaSurface = new THREE.Mesh(seaGeometry, new THREE.MeshStandardMaterial({
        color: palette().sea,
        roughness: .25,
        metalness: .16,
        transparent: true,
        opacity: .91,
        side: THREE.DoubleSide,
      }));
      seaSurface.rotation.x = -Math.PI / 2;
      seaSurface.position.y = seabedY + 1.12;
      seaSurface.receiveShadow = enableShadows;
      group.add(seaSurface);
      const seaPositions = seaGeometry.attributes.position;
      seaSurface.userData.waveBase = new Float32Array(seaPositions.array);
      const seaGrid = new THREE.GridHelper(84, 28, palette().grid, palette().grid);
      seaGrid.position.y = seabedY + 1.16;
      seaGrid.material.opacity = .08;
      seaGrid.material.transparent = true;
      seaGrid.userData.technicalGrid = true;
      group.add(seaGrid);
      grid = seaGrid;

      const top = [
        new THREE.Vector3(-4.35, 3.25, -3.45), new THREE.Vector3(4.35, 3.25, -3.45),
        new THREE.Vector3(-4.35, 3.25, 3.45), new THREE.Vector3(4.35, 3.25, 3.45),
      ];
      const bottom = [
        new THREE.Vector3(-6.15, seabedY, -4.9), new THREE.Vector3(6.15, seabedY, -4.9),
        new THREE.Vector3(-6.15, seabedY, 4.9), new THREE.Vector3(6.15, seabedY, 4.9),
      ];
      bottom.forEach((point, index) => {
        group.add(beamBetween(point, top[index], .39, "Structural", "steelDark", { edges: true, roughness: .58, metalness: .4 }));
        const pileSleeve = cylinder(.72, .82, 1.55, 18, "Structural", "weathered", { edges: true, roughness: .72, metalness: .25 });
        pileSleeve.position.copy(point).add(new THREE.Vector3(0, .65, 0));
        group.add(pileSleeve);
        const mudmat = box(2.25, .16, 2.25, "Structural", "weathered", { edges: true, receiveShadow: true });
        mudmat.position.copy(point).add(new THREE.Vector3(0, -.68, 0));
        group.add(mudmat);
      });
      const levels = [-6.6, -3.75, -1.0, 1.25, 3.05];
      function legAt(index, y) {
        const t = (y - seabedY) / (3.25 - seabedY);
        return bottom[index].clone().lerp(top[index], t);
      }
      const faces = [[0, 1], [2, 3], [0, 2], [1, 3]];
      levels.forEach((y) => faces.forEach(([a, b]) => group.add(beamBetween(legAt(a, y), legAt(b, y), .14, "Structural", "steelDark"))));
      for (let i = 0; i < levels.length - 1; i += 1) {
        faces.forEach(([a, b]) => {
          group.add(beamBetween(legAt(a, levels[i]), legAt(b, levels[i + 1]), .105, "Structural", "steelDark"));
          group.add(beamBetween(legAt(b, levels[i]), legAt(a, levels[i + 1]), .105, "Structural", "steelDark"));
        });
      }
      bottom.forEach((point, index) => {
        for (let y = -5.9; y < 2.5; y += 1.7) {
          const p = legAt(index, y);
          const anode = box(.18, .52, .42, "Inspection", "safety", { selectable: false, roughness: .62, metalness: .32 });
          anode.position.copy(p).add(new THREE.Vector3(index < 2 ? .35 : -.35, 0, 0));
          group.add(anode);
        }
      });

      deckFrame(12.2, 9.6, 4.15, "As-builts", group);
      deckFrame(10.65, 8.35, 7.15, "As-builts", group);
      deckFrame(8.4, 6.7, 9.65, "Inspection", group, { beamRadius: .1 });
      addDeckGrating(group, 11.8, 9.2, 4.34, 0, 0, "Inspection");
      addDeckGrating(group, 10.25, 7.95, 7.34, 0, 0, "Inspection");
      addDeckGrating(group, 8.0, 6.3, 9.84, 0, 0, "Inspection");
      addRectHandrail(group, 0, 0, 12.0, 9.4, 4.34, "Inspection", { skip: ["left"] });
      addRectHandrail(group, 0, 0, 10.45, 8.15, 7.34, "Inspection", { skip: ["front"] });
      addRectHandrail(group, 0, 0, 8.2, 6.5, 9.84, "Inspection", { skip: ["right"] });
      addStairFlight(group, new THREE.Vector3(-5.2, 4.32, 3.35), 2.5, 0, 2.85, .8, 12, "Inspection");
      addStairFlight(group, new THREE.Vector3(3.65, 7.33, -2.8), -2.0, 0, 2.35, .78, 10, "Inspection");

      const quarters = box(3.65, 2.65, 3.5, "As-builts", "building", { edges: true, roughness: .55, metalness: .12 });
      quarters.position.set(-2.75, 5.66, -2.25);
      group.add(quarters);
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          const windowMesh = box(.54, .04, .38, "As-builts", "glass", { selectable: false, castShadow: false, transparent: true, opacity: .72 });
          windowMesh.position.set(-3.85 + col * .72, 5.15 + row * .78, -4.02);
          group.add(windowMesh);
        }
      }
      [-3.6, -2.7, -1.8].forEach((x) => {
        const hvac = box(.65, .5, .75, "Inspection", "equipmentDark", { edges: true, selectable: false });
        hvac.position.set(x, 7.18, -2.5);
        group.add(hvac);
      });

      moduleFrame(group, 2.45, 4.45, -2.15, 3.75, 2.2, 3.1, "Structural");
      verticalVessel(group, 2.1, 4.55, -2.15, 2.1, .48, "Hazmat", { platforms: false });
      verticalVessel(group, 3.25, 4.55, -2.15, 1.8, .38, "Hazmat", { platforms: false });
      pumpSkid(group, 1.0, 4.48, -1.0, "P&IDs", .25);
      moduleFrame(group, -2.35, 4.45, 2.3, 3.6, 2.05, 2.8, "Structural");
      horizontalVessel(group, -2.45, 5.35, 2.3, 2.65, .62, "Weight");
      pumpSkid(group, -2.45, 4.48, 3.35, "P&IDs", 0);
      horizontalVessel(group, 2.45, 5.35, 2.2, 3.1, .7, "Hazmat");

      const upperModule = moduleFrame(group, 1.15, 7.42, -1.65, 4.2, 1.75, 2.8, "As-builts");
      [-.4, .75, 1.9].forEach((x) => verticalVessel(group, x, 7.48, -1.65, 1.5, .34, "Hazmat", { platforms: false }));
      const upperSkid = box(2.2, .9, 1.3, "Waste", "equipmentDark", { edges: true });
      upperSkid.position.set(-2.6, 7.92, 1.95);
      group.add(upperSkid);

      const pipeRack = new THREE.Group();
      [-.72, -.42, -.12, .18, .48, .78].forEach((z, index) => {
        pipeRack.add(pipeCurve([
          new THREE.Vector3(-4.4, 5.1 + index * .09, z + 2.25),
          new THREE.Vector3(-1.7, 5.12 + index * .09, z + 2.25),
          new THREE.Vector3(.9, 5.38 + index * .09, z + 2.25),
          new THREE.Vector3(4.45, 5.25 + index * .09, z + 2.25),
        ], .055 + (index % 2) * .012, "P&IDs", index % 3 === 0 ? "pipeWarm" : "pipeProcess", { roughness: .38, metalness: .36 }));
      });
      for (let x = -3.8; x <= 3.8; x += 1.5) {
        const support = box(.12, 1.0, 1.9, "Structural", "steelDark", { selectable: false });
        support.position.set(x, 4.92, 2.3);
        pipeRack.add(support);
      }
      group.add(pipeRack);

      [-.8, .15, 1.1].forEach((x) => {
        const body = sphere(.32, "Isolation", "equipmentDark", { edges: true });
        body.position.set(x + 1.1, 5.1, .42);
        group.add(body);
        const handwheel = torus(.24, .05, "Isolation", "safety", { selectable: false });
        handwheel.rotation.x = Math.PI / 2;
        handwheel.position.set(x + 1.1, 5.55, .42);
        group.add(handwheel);
      });

      [[3.9, 4.78, 3.2], [3.08, 4.78, 3.2], [2.26, 4.78, 3.2]].forEach((position, index) => {
        const bin = box(.62, .75, .82, "Waste", index === 0 ? "safety" : "equipmentDark", { edges: true });
        bin.position.set(...position);
        group.add(bin);
      });

      [[-1.55, -1.05], [0, -1.05], [1.55, -1.05], [-.78, .8], [.78, .8], [2.3, .78]].forEach(([x, z]) => {
        const conductor = cylinder(.21, .24, 12.8, 12, "Well P&A", "pipeWarm", { edges: true, roughness: .52, metalness: .3 });
        conductor.position.set(x, -2.0, z);
        group.add(conductor);
      });
      [-4.2, 4.2].forEach((x) => {
        const jtube = pipeCurve([
          new THREE.Vector3(x, seabedY + .2, 4.1),
          new THREE.Vector3(x, -3.5, 4.25),
          new THREE.Vector3(x * .92, 2.9, 3.85),
          new THREE.Vector3(x * .8, 4.55, 3.25),
        ], .12, "Well P&A", "pipeProcess", { edges: true });
        group.add(jtube);
      });

      createCrane(group);
      createHelideck(group);
      createFlareBoom(group);

      const boatLanding = new THREE.Group();
      [-.55, .55].forEach((x) => boatLanding.add(beamBetween(new THREE.Vector3(x, seabedY + 1.4, 5.18), new THREE.Vector3(x, 3.1, 4.1), .075, "Inspection", "galvanised")));
      for (let y = seabedY + 1.8; y < 3.0; y += .48) {
        boatLanding.add(beamBetween(new THREE.Vector3(-.55, y, 5.02), new THREE.Vector3(.55, y, 5.02), .026, "Inspection", "galvanised", { selectable: false, castShadow: false }));
      }
      group.add(boatLanding);
      addVerticalLadder(group, -4.15, 4.15, seabedY + 1.4, 4.05, .46, "Inspection", true);

      addAnchor("offshore", "Structural", new THREE.Vector3(-4.55, -.6, 3.75), group);
      addAnchor("offshore", "Hazmat", new THREE.Vector3(2.55, 6.35, -2.05), group);
      addAnchor("offshore", "Isolation", new THREE.Vector3(1.35, 5.7, .48), group);
      addAnchor("offshore", "As-builts", new THREE.Vector3(-2.75, 7.25, -2.2), group);
      addAnchor("offshore", "P&IDs", new THREE.Vector3(.4, 6.0, 2.65), group);
      addAnchor("offshore", "Waste", new THREE.Vector3(3.25, 5.4, 3.15), group);
      addAnchor("offshore", "Well P&A", new THREE.Vector3(0, -1.8, 0), group);
      addAnchor("offshore", "Weight", new THREE.Vector3(-5.65, 12.05, 3.25), group);
      addAnchor("offshore", "Inspection", new THREE.Vector3(-1.1, 11.9, -.85), group);
      return captureBasePositions(group);
    }

    function addPipeRack(parent, startX, endX, centerZ, width, levels, domain = "Structural") {
      const rack = new THREE.Group();
      const bay = 2.6;
      for (let x = startX; x <= endX + .01; x += bay) {
        [-width / 2, width / 2].forEach((zOffset) => {
          const post = box(.2, levels[levels.length - 1] + .45, .2, domain, "steelDark", { edges: true });
          post.position.set(x, (levels[levels.length - 1] + .45) / 2, centerZ + zOffset);
          rack.add(post);
        });
        levels.forEach((y) => rack.add(beamBetween(new THREE.Vector3(x, y, centerZ - width / 2), new THREE.Vector3(x, y, centerZ + width / 2), .09, domain, "steelDark")));
      }
      levels.forEach((y) => {
        [-width / 2, width / 2].forEach((zOffset) => rack.add(beamBetween(new THREE.Vector3(startX, y, centerZ + zOffset), new THREE.Vector3(endX, y, centerZ + zOffset), .105, domain, "steelDark")));
      });
      for (let x = startX; x < endX; x += bay) {
        rack.add(beamBetween(new THREE.Vector3(x, .15, centerZ - width / 2), new THREE.Vector3(Math.min(endX, x + bay), levels[levels.length - 1] + .25, centerZ - width / 2), .055, domain, "steelDark", { selectable: false }));
        rack.add(beamBetween(new THREE.Vector3(Math.min(endX, x + bay), .15, centerZ + width / 2), new THREE.Vector3(x, levels[levels.length - 1] + .25, centerZ + width / 2), .055, domain, "steelDark", { selectable: false }));
      }
      parent.add(rack);
      return rack;
    }

    function processColumn(parent, position, height, radius, domain = "As-builts") {
      verticalVessel(parent, position.x, .25, position.z, height, radius, domain, { kind: "equipmentLight", platforms: true });
      const topNozzle = cylinder(radius * .18, radius * .18, 1.0, 12, "P&IDs", "pipeProcess", { selectable: false });
      topNozzle.position.set(position.x, height + .55, position.z);
      parent.add(topNozzle);
      const vapourLine = pipeCurve([
        new THREE.Vector3(position.x, height + 1.0, position.z),
        new THREE.Vector3(position.x + 1.2, height + 1.0, position.z),
        new THREE.Vector3(position.x + 1.7, height - .2, position.z + .6),
      ], .1, "P&IDs", "pipeProcess");
      parent.add(vapourLine);
    }

    function storageTank(parent, x, z, radius, height) {
      const tank = cylinder(radius, radius, height, 30, "Hazmat", "equipmentLight", { edges: true, roughness: .58, metalness: .24 });
      tank.position.set(x, height / 2 + .12, z);
      parent.add(tank);
      const roof = sphere(radius, "Hazmat", "equipmentLight", { selectable: false, roughness: .58, metalness: .24 });
      roof.scale.y = .25;
      roof.position.set(x, height + .12, z);
      parent.add(roof);
      [height * .36, height * .68].forEach((y) => {
        const ring = torus(radius + .045, .04, "Inspection", "galvanised", { selectable: false, castShadow: false });
        ring.rotation.x = Math.PI / 2;
        ring.position.set(x, y, z);
        parent.add(ring);
      });
      addVerticalLadder(parent, x - radius - .18, z, .15, height, .34, "Inspection", false);
    }

    function createBund(parent, cx, cz, width, depth) {
      const wallHeight = .42;
      const wall = .18;
      [[width, wall, depth / 2 + wall / 2, 0], [width, wall, -depth / 2 - wall / 2, 0]].forEach(() => {});
      const front = box(width, wallHeight, wall, "Hazmat", "concrete", { selectable: false, receiveShadow: true });
      front.position.set(cx, wallHeight / 2, cz + depth / 2);
      parent.add(front);
      const back = front.clone(); back.position.z = cz - depth / 2; parent.add(back);
      const left = box(wall, wallHeight, depth, "Hazmat", "concrete", { selectable: false, receiveShadow: true });
      left.position.set(cx - width / 2, wallHeight / 2, cz); parent.add(left);
      const right = left.clone(); right.position.x = cx + width / 2; parent.add(right);
    }

    function createFlareTower(parent, cx, cz) {
      const height = 17.5;
      const base = 2.3;
      const top = .72;
      const legs = [];
      [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
        const a = new THREE.Vector3(cx + sx * base / 2, .1, cz + sz * base / 2);
        const b = new THREE.Vector3(cx + sx * top / 2, height, cz + sz * top / 2);
        legs.push({ a, b });
        parent.add(beamBetween(a, b, .085, "Inspection", "steelDark", { selectable: false }));
      });
      for (let y = 1.2; y < height; y += 1.65) {
        const t = y / height;
        const half = (base * (1 - t) + top * t) / 2;
        const points = [
          new THREE.Vector3(cx - half, y, cz - half), new THREE.Vector3(cx + half, y, cz - half),
          new THREE.Vector3(cx - half, y, cz + half), new THREE.Vector3(cx + half, y, cz + half),
        ];
        [[0, 1], [2, 3], [0, 2], [1, 3]].forEach(([a, b]) => parent.add(beamBetween(points[a], points[b], .035, "Inspection", "steelDark", { selectable: false, castShadow: false })));
      }
      for (let y = .8; y < height - 1.7; y += 3.3) {
        const t1 = y / height;
        const t2 = (y + 1.65) / height;
        const h1 = (base * (1 - t1) + top * t1) / 2;
        const h2 = (base * (1 - t2) + top * t2) / 2;
        parent.add(beamBetween(new THREE.Vector3(cx - h1, y, cz - h1), new THREE.Vector3(cx + h2, y + 1.65, cz - h2), .035, "Inspection", "steelDark", { selectable: false, castShadow: false }));
        parent.add(beamBetween(new THREE.Vector3(cx + h1, y, cz + h1), new THREE.Vector3(cx - h2, y + 1.65, cz + h2), .035, "Inspection", "steelDark", { selectable: false, castShadow: false }));
      }
      const stack = cylinder(.18, .28, 2.2, 12, "Inspection", "rust", { edges: true });
      stack.position.set(cx, height + 1.0, cz);
      parent.add(stack);
      addVerticalLadder(parent, cx - base / 2 - .16, cz - base / 2, .2, height - .4, .34, "Inspection", true);
    }

    function createOnshore() {
      const group = new THREE.Group();
      group.name = "Onshore plant";
      groundSurface = new THREE.Mesh(new THREE.PlaneGeometry(76, 58), new THREE.MeshStandardMaterial({ color: palette().ground, roughness: .96, metalness: 0 }));
      groundSurface.rotation.x = -Math.PI / 2;
      groundSurface.position.y = -.16;
      groundSurface.receiveShadow = enableShadows;
      group.add(groundSurface);
      grid = new THREE.GridHelper(68, 32, palette().grid, palette().grid);
      grid.position.y = -.12;
      grid.material.opacity = theme === "dark" ? .12 : .08;
      grid.material.transparent = true;
      grid.userData.technicalGrid = true;
      group.add(grid);

      const road = box(52, .08, 6.2, null, "asphalt", { selectable: false, receiveShadow: true, roughness: .98, metalness: 0 });
      road.position.set(0, -.03, 15.0);
      group.add(road);
      const crossRoad = box(5.2, .08, 32, null, "asphalt", { selectable: false, receiveShadow: true, roughness: .98, metalness: 0 });
      crossRoad.position.set(-15.0, -.025, 1.2);
      group.add(crossRoad);
      [-9, -3, 3, 9].forEach((x) => {
        const marker = box(2.5, .012, .08, null, "safety", { selectable: false, castShadow: false });
        marker.position.set(x, .03, 15.0);
        group.add(marker);
      });

      const mainPad = box(29, .14, 17, null, "concrete", { selectable: false, receiveShadow: true });
      mainPad.position.set(-.5, -.02, -.2);
      group.add(mainPad);
      const tankPad = box(15.5, .14, 12.5, null, "concrete", { selectable: false, receiveShadow: true });
      tankPad.position.set(11.0, -.02, -3.6);
      group.add(tankPad);
      createContactShadow(group, 0, 0, 30, 18, .14, .02);

      addPipeRack(group, -10.0, 8.2, 0.2, 4.4, [2.35, 4.6]);
      [-1.45, -.85, -.25, .35, .95, 1.55].forEach((zOffset, index) => {
        group.add(pipeCurve([
          new THREE.Vector3(-9.5, 4.82 - index * .12, zOffset),
          new THREE.Vector3(-2.5, 4.82 - index * .12, zOffset),
          new THREE.Vector3(2.8, 4.7 - index * .1, zOffset),
          new THREE.Vector3(8.1, 4.82 - index * .12, zOffset),
        ], .07 + (index % 2) * .015, "P&IDs", index % 3 === 1 ? "pipeWarm" : "pipeProcess"));
      });
      const cableTray = box(18.0, .16, .45, "As-builts", "galvanised", { edges: true, selectable: false });
      cableTray.position.set(-.9, 5.12, 2.18);
      group.add(cableTray);

      processColumn(group, new THREE.Vector3(-6.7, 0, -5.5), 11.0, .78, "As-builts");
      processColumn(group, new THREE.Vector3(-1.2, 0, -5.7), 8.8, .66, "P&IDs");
      processColumn(group, new THREE.Vector3(4.3, 0, -5.0), 7.6, .6, "Inspection");

      createBund(group, 11.0, -3.4, 14.0, 11.2);
      storageTank(group, 9.0, -4.9, 2.25, 4.0);
      storageTank(group, 13.4, -4.8, 1.82, 3.3);
      storageTank(group, 11.3, .2, 1.5, 2.8);

      const controlBuilding = box(6.4, 3.5, 4.5, "As-builts", "building", { edges: true, roughness: .72, metalness: .08 });
      controlBuilding.position.set(-10.8, 1.75, 7.5);
      group.add(controlBuilding);
      const roof = box(6.7, .18, 4.8, "As-builts", "painted", { edges: true, selectable: false });
      roof.position.set(-10.8, 3.58, 7.5);
      group.add(roof);
      for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 4; col += 1) {
          const windowMesh = box(.62, .04, .42, "As-builts", "glass", { selectable: false, castShadow: false, transparent: true, opacity: .76 });
          windowMesh.position.set(-12.55 + col * 1.18, 1.35 + row * 1.0, 5.22);
          group.add(windowMesh);
        }
      }
      [-12.0, -10.8, -9.6].forEach((x) => {
        const hvac = box(.72, .55, .85, "Inspection", "equipmentDark", { edges: true, selectable: false });
        hvac.position.set(x, 3.93, 7.3);
        group.add(hvac);
      });

      horizontalVessel(group, 4.7, 1.55, 6.0, 4.8, .72, "Weight");
      horizontalVessel(group, -.4, 1.65, 6.8, 5.0, .82, "Waste");
      pumpSkid(group, -5.6, .18, 6.4, "P&IDs", .15);
      pumpSkid(group, -3.3, .18, 6.4, "P&IDs", -.08);
      pumpSkid(group, 7.9, .18, 5.2, "Isolation", -.25);

      const manifold = new THREE.Group();
      [-2.0, -1.0, 0, 1.0, 2.0].forEach((x) => {
        const valve = sphere(.32, "Isolation", "equipmentDark", { edges: true });
        valve.position.set(x + 1.0, .78, 10.1);
        manifold.add(valve);
        const wheel = torus(.24, .05, "Isolation", "safety", { selectable: false });
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(x + 1.0, 1.2, 10.1);
        manifold.add(wheel);
      });
      group.add(manifold);
      group.add(pipeCurve([
        new THREE.Vector3(-5.5, .6, 10.1), new THREE.Vector3(1.0, .6, 10.1), new THREE.Vector3(5.8, 1.25, 6.1),
      ], .13, "Isolation", "pipeProcess"));

      const wastePad = box(6.7, .13, 5.5, "Waste", "concrete", { selectable: false, receiveShadow: true });
      wastePad.position.set(10.7, -.02, 9.6);
      group.add(wastePad);
      [[9.2, .65, 8.8], [10.5, .65, 8.8], [11.8, .65, 8.8], [10.0, .65, 10.3], [11.4, .65, 10.3]].forEach((position, index) => {
        const bin = box(1.05, 1.28, 1.25, "Waste", index === 0 ? "safety" : "equipmentDark", { edges: true });
        bin.position.set(...position);
        group.add(bin);
      });

      [[-11.7, -8.5], [-9.8, -8.5], [-10.75, -6.7]].forEach(([x, z]) => {
        const cellar = cylinder(.82, .82, .22, 22, "Well P&A", "steelDark", { edges: true });
        cellar.position.set(x, .1, z);
        group.add(cellar);
        const wellhead = cylinder(.23, .34, 1.45, 14, "Well P&A", "pipeWarm", { edges: true });
        wellhead.position.set(x, .82, z);
        group.add(wellhead);
        const tree = moduleFrame(group, x, 1.05, z, .88, .95, .88, "Well P&A", { braced: false });
        const cap = box(.72, .26, .72, "Well P&A", "equipmentDark", { edges: true });
        cap.position.set(x, 1.92, z);
        group.add(cap);
      });

      createFlareTower(group, -14.1, -8.4);
      horizontalVessel(group, -11.2, 1.1, -3.6, 3.6, .62, "Hazmat", { kind: "equipmentDark" });
      group.add(pipeCurve([
        new THREE.Vector3(-11.2, 1.7, -3.6), new THREE.Vector3(-13.0, 2.6, -4.4), new THREE.Vector3(-14.1, 5.0, -8.4),
      ], .11, "P&IDs", "pipeWarm"));

      const liftFrame = moduleFrame(group, 7.3, .2, 5.8, 3.2, 4.7, 2.0, "Weight", { braced: true });
      const liftingBeam = beamBetween(new THREE.Vector3(6.2, 4.55, 5.8), new THREE.Vector3(8.4, 4.55, 5.8), .14, "Weight", "safety", { edges: true });
      group.add(liftingBeam);

      addAnchor("onshore", "Structural", new THREE.Vector3(-1.0, 5.15, -1.9), group);
      addAnchor("onshore", "Hazmat", new THREE.Vector3(10.3, 4.55, -4.8), group);
      addAnchor("onshore", "Isolation", new THREE.Vector3(1.1, 1.65, 10.1), group);
      addAnchor("onshore", "As-builts", new THREE.Vector3(-10.8, 3.9, 7.5), group);
      addAnchor("onshore", "P&IDs", new THREE.Vector3(1.5, 5.25, .1), group);
      addAnchor("onshore", "Waste", new THREE.Vector3(10.8, 1.8, 9.3), group);
      addAnchor("onshore", "Well P&A", new THREE.Vector3(-10.75, 2.25, -7.4), group);
      addAnchor("onshore", "Weight", new THREE.Vector3(7.3, 5.45, 5.8), group);
      addAnchor("onshore", "Inspection", new THREE.Vector3(-14.1, 15.0, -8.4), group);
      return captureBasePositions(group);
    }


    offshoreModel = createOffshore();
    onshoreModel = createOnshore();
    root.add(offshoreModel, onshoreModel);
    activeModel = offshoreModel;
    onshoreModel.visible = false;

    const structuralKinds = new Set(["steel", "steelDark", "galvanised", "weathered", "deck", "grating", "concrete"]);
    const processKinds = new Set(["equipment", "equipmentLight", "equipmentDark", "pipe", "pipeProcess", "pipeWarm", "safety", "rust"]);

    function updateTheme() {
      theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
      const p = palette();
      materialCache.forEach((material) => {
        const kind = material.userData.kind;
        material.color.setHex(p[kind] || p.steel);
      });
      renderer.toneMappingExposure = theme === "dark" ? 1.02 : .94;
      scene.fog = new THREE.FogExp2(p.sky, theme === "dark" ? .0068 : .0052);
      skyUniforms.topColor.value.setHex(p.skyTop);
      skyUniforms.bottomColor.value.setHex(p.skyBottom);
      if (seaSurface) seaSurface.material.color.setHex(p.sea);
      if (groundSurface) groundSurface.material.color.setHex(p.ground);
      root.traverse((object) => {
        if (object.userData.technicalGrid && object.material) {
          object.material.color.setHex(p.grid);
          object.material.opacity = viewerMode === "structure" ? (theme === "dark" ? .2 : .15) : (theme === "dark" ? .08 : .055);
        }
        if (object.userData.edge && object.material) object.material.color.setHex(p.edge);
      });
      hemisphere.color.setHex(theme === "dark" ? 0xbfd9e4 : 0xdbe8ef);
      hemisphere.groundColor.setHex(theme === "dark" ? 0x10191f : 0xb8c4c8);
      key.intensity = theme === "dark" ? 1.18 : 1.0;
      rim.intensity = theme === "dark" ? .68 : .48;
      fill.intensity = theme === "dark" ? .36 : .26;
      applyHighlight();
    }

    function modeOpacityFor(kind) {
      if (viewerMode === "standard") return 1;
      if (viewerMode === "structure") {
        if (structuralKinds.has(kind)) return 1;
        if (kind === "building" || kind === "glass") return .32;
        return .16;
      }
      if (viewerMode === "process") {
        if (processKinds.has(kind)) return 1;
        if (kind === "building" || kind === "glass") return .34;
        return .18;
      }
      return 1;
    }

    function applyHighlight() {
      const selectedKey = previewDomainKey || activeDomain;
      materialCache.forEach((material) => {
        const domain = material.userData.domain;
        const kind = material.userData.kind;
        const baseOpacity = material.userData.baseOpacity;
        const selected = Boolean(domain && domain === selectedKey);
        const modeOpacity = selected ? 1 : modeOpacityFor(kind);
        material.opacity = Math.max(.06, baseOpacity * modeOpacity);
        material.transparent = material.opacity < .985 || baseOpacity < 1;
        material.depthWrite = material.opacity >= .8;
        if (!domain) {
          material.emissive?.setHex(0x000000);
          material.emissiveIntensity = 0;
          return;
        }
        const domainData = domainByKey(domain);
        material.emissive.setHex(selected ? qualityColours[qualityClass(domainData.score)] : 0x000000);
        material.emissiveIntensity = selected ? .28 : 0;
      });
      [offshoreModel, onshoreModel].forEach((model) => model.traverse((object) => {
        if (object.userData.edges && object.userData.edges.material) {
          const selected = object.userData.domain === selectedKey;
          const kind = object.material?.userData?.kind;
          const modeOpacity = modeOpacityFor(kind);
          object.userData.edges.material.opacity = selected ? .88 : Math.max(.08, .27 * modeOpacity);
        }
      }));
      root.traverse((object) => {
        if (object.userData.technicalGrid && object.material) {
          object.material.opacity = viewerMode === "structure" ? (theme === "dark" ? .2 : .15) : (theme === "dark" ? .08 : .055);
        }
      });
    }

    function registerHotspots() {
      updateHotspotPositions(true);
    }

    function setModel(asset) {
      const offshore = asset === "offshore";
      offshoreModel.visible = offshore;
      onshoreModel.visible = !offshore;
      activeModel = offshore ? offshoreModel : onshoreModel;
      const preset = defaults[asset];
      azimuth = preset.azimuth;
      elevation = preset.elevation;
      distance = preset.distance;
      target.copy(preset.target);
      renderedAzimuth = azimuth;
      renderedElevation = elevation;
      renderedDistance = distance;
      renderedTarget.copy(target);
      azimuthVelocity = 0;
      elevationVelocity = 0;
      autoRotate = !reduceMotion;
      updateAutoRotateButton();
      startAssembly();
      applyHighlight();
      updateHotspotPositions(true);
    }

    function startAssembly() {
      assembling = !reduceMotion;
      assemblyStart = performance.now();
      let index = 0;
      activeModel.traverse((object) => {
        if (!object.isMesh || !object.userData.basePosition) return;
        object.position.copy(object.userData.basePosition);
        object.userData.assemblyDelay = (index % 17) * 8;
        if (!reduceMotion) object.position.y -= .42 + (index % 5) * .035;
        index += 1;
      });
      if (reduceMotion) applyHighlight();
    }

    function focusDomain(key) {
      const anchor = anchors[state.asset][key];
      if (!anchor) return;
      const world = new THREE.Vector3();
      anchor.getWorldPosition(world);
      const base = defaults[state.asset].target.clone();
      target.copy(base.lerp(world, .76));
      target.y -= state.asset === "offshore" && key === "Well P&A" ? .3 : .08;
      distance = state.asset === "offshore" ? 27.5 : 31;
      elevation = Math.max(.12, Math.min(.72, elevation));
      autoRotate = false;
      azimuthVelocity = 0;
      elevationVelocity = 0;
      updateAutoRotateButton();
    }

    function highlightDomain(key, shouldFocus) {
      activeDomain = key;
      previewDomainKey = null;
      applyHighlight();
      if (shouldFocus) focusDomain(key);
    }

    function previewDomain(key) {
      previewDomainKey = key;
      applyHighlight();
    }

    function setViewMode(mode, announce) {
      if (!["standard", "structure", "process"].includes(mode)) return;
      viewerMode = mode;
      viewModeButtons.forEach((button) => {
        const active = button.dataset.viewMode === mode;
        button.classList.toggle("active", active);
        button.setAttribute("aria-pressed", String(active));
      });
      applyHighlight();
      if (announce && liveStatus) liveStatus.textContent = `${mode[0].toUpperCase()}${mode.slice(1)} technical view selected.`;
    }

    function updateAutoRotateButton() {
      if (!autoRotateButton) return;
      autoRotateButton.setAttribute("aria-pressed", String(autoRotate));
      autoRotateButton.textContent = autoRotate ? "Pause rotation" : "Auto rotate";
    }

    function resetView() {
      const preset = defaults[state.asset];
      azimuth = preset.azimuth;
      elevation = preset.elevation;
      distance = preset.distance;
      target.copy(preset.target);
      azimuthVelocity = 0;
      elevationVelocity = 0;
      autoRotate = !reduceMotion;
      updateAutoRotateButton();
    }


    function resize() {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      updateHotspotPositions(true);
    }

    function updateCamera(delta = .016) {
      const smoothing = 1 - Math.pow(.001, Math.min(.06, delta));
      renderedAzimuth += (azimuth - renderedAzimuth) * smoothing;
      renderedElevation += (elevation - renderedElevation) * smoothing;
      renderedDistance += (distance - renderedDistance) * smoothing;
      renderedTarget.lerp(target, smoothing);
      const horizontal = Math.cos(renderedElevation) * renderedDistance;
      camera.position.set(
        renderedTarget.x + Math.sin(renderedAzimuth) * horizontal,
        renderedTarget.y + Math.sin(renderedElevation) * renderedDistance,
        renderedTarget.z + Math.cos(renderedAzimuth) * horizontal,
      );
      camera.lookAt(renderedTarget);
    }

    function updateHotspotPositions(force) {
      if (!activeModel || !camera) return;
      const rect = stage.getBoundingClientRect();
      hotspotFrame += 1;
      const checkOcclusion = force || hotspotFrame % 7 === 0;
      hotspotLayer.querySelectorAll("button").forEach((button) => {
        const anchor = anchors[state.asset][button.dataset.domain];
        if (!anchor) return;
        const world = new THREE.Vector3();
        anchor.getWorldPosition(world);
        const projected = world.clone().project(camera);
        const x = (projected.x * .5 + .5) * rect.width;
        const y = (-projected.y * .5 + .5) * rect.height;
        const visible = projected.z > -1 && projected.z < 1 && x > -45 && x < rect.width + 45 && y > -45 && y < rect.height + 45;
        button.style.left = `${x}px`;
        button.style.top = `${y}px`;
        button.hidden = !visible;
        if (!visible || !checkOcclusion) return;
        const direction = world.clone().sub(camera.position);
        const anchorDistance = direction.length();
        direction.normalize();
        raycaster.set(camera.position, direction);
        raycaster.far = anchorDistance;
        const hits = raycaster.intersectObjects(selectableMeshes.filter((mesh) => mesh.visible && isVisibleInHierarchy(mesh)), false);
        const first = hits.find((hit) => hit.distance < anchorDistance - .45);
        const occluded = Boolean(first && first.object.userData.domain !== button.dataset.domain);
        button.classList.toggle("occluded", occluded);
      });
      raycaster.far = Infinity;
    }


    function raycastAt(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(selectableMeshes.filter((mesh) => mesh.visible && isVisibleInHierarchy(mesh)), false);
      const hit = hits.find((item) => item.object.userData.domain);
      if (hit) selectDomain(hit.object.userData.domain, true);
    }

    function isVisibleInHierarchy(object) {
      let current = object;
      while (current) {
        if (!current.visible) return false;
        current = current.parent;
      }
      return true;
    }

    function pointerDown(event) {
      if (event.target.closest("button")) return;
      dragging = true;
      moved = false;
      pointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      azimuthVelocity = 0;
      elevationVelocity = 0;
      autoRotate = false;
      updateAutoRotateButton();
      stage.setPointerCapture?.(event.pointerId);
      stage.classList.add("dragging");
    }

    function pointerMove(event) {
      if (!dragging || event.pointerId !== pointerId) return;
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      const azimuthDelta = dx * .0062;
      const elevationDelta = dy * .0048;
      azimuth += azimuthDelta;
      elevation += elevationDelta;
      azimuthVelocity = azimuthDelta * .58;
      elevationVelocity = elevationDelta * .5;
      elevation = Math.max(-.01, Math.min(1.08, elevation));
      lastX = event.clientX;
      lastY = event.clientY;
    }

    function pointerUp(event) {
      if (!dragging || event.pointerId !== pointerId) return;
      dragging = false;
      stage.classList.remove("dragging");
      if (!moved) raycastAt(event.clientX, event.clientY);
      if (stage.hasPointerCapture?.(event.pointerId)) stage.releasePointerCapture(event.pointerId);
      pointerId = null;
    }

    function wheel(event) {
      event.preventDefault();
      autoRotate = false;
      updateAutoRotateButton();
      distance += event.deltaY * .024;
      const range = state.asset === "offshore" ? [23, 60] : [23, 58];
      distance = Math.max(range[0], Math.min(range[1], distance));
    }

    function touchMove(event) {
      if (event.touches.length !== 2) {
        pinchDistance = null;
        return;
      }
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      const next = Math.hypot(dx, dy);
      if (pinchDistance !== null) {
        distance += (pinchDistance - next) * .045;
        const range = state.asset === "offshore" ? [23, 60] : [23, 58];
        distance = Math.max(range[0], Math.min(range[1], distance));
      }
      pinchDistance = next;
    }

    function keydown(event) {
      let handled = true;
      if (event.key === "ArrowLeft") azimuth -= .12;
      else if (event.key === "ArrowRight") azimuth += .12;
      else if (event.key === "ArrowUp") elevation = Math.max(-.01, elevation - .08);
      else if (event.key === "ArrowDown") elevation = Math.min(1.08, elevation + .08);
      else if (event.key === "+" || event.key === "=") distance = Math.max(23, distance - 2.2);
      else if (event.key === "-") distance = Math.min(state.asset === "offshore" ? 60 : 58, distance + 2.2);
      else if (event.key.toLowerCase() === "r") resetView();
      else if (event.key.toLowerCase() === "f") focusDomain(activeDomain);
      else handled = false;
      if (handled) {
        event.preventDefault();
        autoRotate = false;
        azimuthVelocity = 0;
        elevationVelocity = 0;
        updateAutoRotateButton();
      }
    }

    stage.addEventListener("pointerdown", pointerDown);
    stage.addEventListener("pointermove", pointerMove);
    stage.addEventListener("pointerup", pointerUp);
    stage.addEventListener("pointercancel", pointerUp);
    stage.addEventListener("wheel", wheel, { passive: false });
    stage.addEventListener("touchmove", touchMove, { passive: true });
    stage.addEventListener("touchend", () => { pinchDistance = null; });
    stage.addEventListener("keydown", keydown);
    stage.addEventListener("dblclick", (event) => {
      if (event.target.closest("button")) return;
      focusDomain(activeDomain);
      if (liveStatus) liveStatus.textContent = `${domainByKey(activeDomain)?.title || "Selected domain"} focused in the 3D model.`;
    });

    document.getElementById("zoomIn")?.addEventListener("click", () => {
      distance = Math.max(23, distance - 2.2);
      autoRotate = false;
      updateAutoRotateButton();
    });
    document.getElementById("zoomOut")?.addEventListener("click", () => {
      distance = Math.min(state.asset === "offshore" ? 60 : 58, distance + 2.2);
      autoRotate = false;
      updateAutoRotateButton();
    });
    document.getElementById("resetView")?.addEventListener("click", resetView);
    focusDomainButton?.addEventListener("click", () => {
      focusDomain(activeDomain);
      if (liveStatus) liveStatus.textContent = `${domainByKey(activeDomain)?.title || "Selected domain"} focused in the 3D model.`;
    });
    viewModeButtons.forEach((button) => button.addEventListener("click", () => setViewMode(button.dataset.viewMode, true)));
    autoRotateButton?.addEventListener("click", () => {
      autoRotate = !autoRotate;
      azimuthVelocity = 0;
      elevationVelocity = 0;
      updateAutoRotateButton();
    });


    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(stage);
    if (!resizeObserver) window.addEventListener("resize", resize);

    const visibilityObserver = new IntersectionObserver((entries) => {
      stageVisible = entries.some((entry) => entry.isIntersecting) && !document.hidden;
      if (stageVisible && !raf) raf = requestAnimationFrame(animate);
    }, { threshold: 0.02 });
    visibilityObserver.observe(stage);
    document.addEventListener("visibilitychange", () => {
      stageVisible = !document.hidden && stage.getBoundingClientRect().bottom > 0 && stage.getBoundingClientRect().top < window.innerHeight;
      if (stageVisible && !raf) raf = requestAnimationFrame(animate);
    });

    function animate(now) {
      raf = 0;
      if (!stageVisible) return;
      const delta = Math.min(clock.getDelta(), .035);
      if (autoRotate && !dragging && !reduceMotion) {
        azimuth += delta * .11;
      } else if (!dragging && !reduceMotion) {
        azimuth += azimuthVelocity;
        elevation += elevationVelocity;
        elevation = Math.max(-.01, Math.min(1.08, elevation));
        const damping = Math.pow(.84, delta * 60);
        azimuthVelocity *= damping;
        elevationVelocity *= damping;
        if (Math.abs(azimuthVelocity) < .00001) azimuthVelocity = 0;
        if (Math.abs(elevationVelocity) < .00001) elevationVelocity = 0;
      }
      if (assembling) {
        let complete = true;
        activeModel.traverse((object) => {
          if (!object.isMesh || !object.userData.basePosition) return;
          const delay = object.userData.assemblyDelay || 0;
          const progress = Math.max(0, Math.min(1, (now - assemblyStart - delay) / 680));
          const ease = 1 - Math.pow(1 - progress, 3);
          object.position.copy(object.userData.basePosition);
          object.position.y -= (1 - ease) * (.42 + (delay % 40) * .004);
          if (progress < 1) complete = false;
        });
        if (complete) {
          assembling = false;
          applyHighlight();
        }
      }
      if (seaSurface && seaSurface.visible && !reduceMotion) {
        const positions = seaSurface.geometry.attributes.position;
        const base = seaSurface.userData.waveBase;
        const time = now * .00038;
        for (let i = 0; i < positions.count; i += 1) {
          const x = base[i * 3];
          const y = base[i * 3 + 1];
          positions.setZ(i,
            Math.sin(x * .18 + time) * .075 +
            Math.cos(y * .15 - time * .82) * .045 +
            Math.sin((x + y) * .08 + time * .55) * .025,
          );
        }
        positions.needsUpdate = true;
        if (now % 12 < 1) seaSurface.geometry.computeVertexNormals();
      }
      if (!reduceMotion) {
        const selectedKey = previewDomainKey || activeDomain;
        const pulse = .27 + Math.sin(now * .004) * .055;
        materialCache.forEach((material) => {
          if (material.userData.domain === selectedKey) material.emissiveIntensity = pulse;
        });
      }
      updateCamera(delta);
      renderer.render(scene, camera);
      updateHotspotPositions(false);
      raf = requestAnimationFrame(animate);
    }

    window.EnduraExplorer3D = {
      setAsset: setModel,
      highlightDomain,
      previewDomain,
      registerHotspots,
      resetView,
      focusDomain,
      setViewMode,
      getDiagnostics: () => ({
        asset: state.asset,
        viewMode: viewerMode,
        renderCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
        selectableMeshes: selectableMeshes.length,
        hotspotCount: Object.keys(anchors[state.asset] || {}).length,
      }),
    };

    updateTheme();
    resize();
    setViewMode("standard", false);
    setModel(state.asset);
    highlightDomain(state.selected, false);
    updateAutoRotateButton();
    raf = requestAnimationFrame(animate);

  }
})();
