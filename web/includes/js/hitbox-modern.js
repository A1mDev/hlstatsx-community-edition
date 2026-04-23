(function (global) {
  "use strict";

  function toNumber(value) {
    var parsed = Number(value);
    return isFinite(parsed) ? parsed : 0;
  }

  function esc(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmt(value) {
    if (!value) return "0";
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function normalizeHex(hex) {
    if (!hex || typeof hex !== "string") return null;
    hex = hex.replace("#", "");
    if (hex.length === 3) {
      hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
    }
    if (hex.length !== 6 || /[^0-9a-fA-F]/.test(hex)) return null;
    return "#" + hex.toLowerCase();
  }

  function hexToRgb(hex) {
    var h = normalizeHex(hex);
    if (!h) return null;
    return {
      r: parseInt(h.substr(1, 2), 16),
      g: parseInt(h.substr(3, 2), 16),
      b: parseInt(h.substr(5, 2), 16)
    };
  }

  function rgba(hex, alpha) {
    var c = hexToRgb(hex);
    if (!c) return "rgba(255,255,255," + alpha + ")";
    return "rgba(" + c.r + "," + c.g + "," + c.b + "," + alpha + ")";
  }

  function shade(hex, delta) {
    var c = hexToRgb(hex);
    if (!c) return hex;
    function clamp(x) { return Math.max(0, Math.min(255, x)); }
    function pad(s) { return s.length === 1 ? "0" + s : s; }
    var r = clamp(c.r + delta).toString(16);
    var g = clamp(c.g + delta).toString(16);
    var b = clamp(c.b + delta).toString(16);
    return "#" + pad(r) + pad(g) + pad(b);
  }

  // Body-part definitions. Colors + label order. Anchor fractions are resolved
  // from one of two anchor sets depending on the model image aspect ratio.
  var PARTS = [
    { id: "head",     label: "Head",      color: "#F59E0B" },
    { id: "chest",    label: "Chest",     color: "#EF4444" },
    { id: "leftarm",  label: "Left Arm",  color: "#38BDF8" },
    { id: "rightarm", label: "Right Arm", color: "#06B6D4" },
    { id: "stomach",  label: "Stomach",   color: "#EAB308" },
    { id: "leftleg",  label: "Left Leg",  color: "#A78BFA" },
    { id: "rightleg", label: "Right Leg", color: "#8B5CF6" }
  ];

  // Wide / landscape models (CS, DoD, HL2MP, TFC) keep the figure in a narrow
  // vertical strip in the middle of a wide canvas. Portrait-ish models
  // (zombies, insmod, fof, ges, zps) fill most of their canvas.
  var ANCHORS_WIDE = {
    head:     { x: 0.576, y: 0.070 },
    chest:    { x: 0.576, y: 0.300 },
    leftarm:  { x: 0.734, y: 0.380 },
    rightarm: { x: 0.418, y: 0.380 },
    stomach:  { x: 0.576, y: 0.470 },
    leftleg:  { x: 0.690, y: 0.728 },
    rightleg: { x: 0.474, y: 0.722 }
  };
  var ANCHORS_TALL = {
    head:     { x: 0.500, y: 0.100 },
    chest:    { x: 0.500, y: 0.275 },
    leftarm:  { x: 0.705, y: 0.370 },
    rightarm: { x: 0.295, y: 0.370 },
    stomach:  { x: 0.500, y: 0.475 },
    leftleg:  { x: 0.570, y: 0.830 },
    rightleg: { x: 0.430, y: 0.830 }
  };

  // Global model positioning per aspect group. `modelScale` shrinks/grows the
  // image around its center (1.0 = original object-fit). `modelOffsetX/Y` move
  // the image in pixels inside its container.
  var MODEL_TUNING_WIDE = { modelScale: 0.99, modelOffsetX: -30, modelOffsetY: 0 };
  var MODEL_TUNING_TALL = { modelScale: 1.00, modelOffsetX: 0, modelOffsetY: 0 };

  var SVG_NS = "http://www.w3.org/2000/svg";

  // ============================================================================
  // DEBUG / TUNING
  // ----------------------------------------------------------------------------
  // Uncomment the `var HLXHB_DEBUG_TUNING = true;` line below to enable a
  // floating tuning panel in the bottom-right corner of the page. It shows up
  // alongside the Targets block and lets you:
  //   * move and scale the model (scale / offsetX / offsetY);
  //   * drag the per-part anchors -- the points the leader lines aim at --
  //     independently for wide and tall model aspects;
  //   * press "Copy config" to copy a ready-to-paste snippet that bakes the
  //     current values back into the ANCHORS_WIDE / ANCHORS_TALL /
  //     MODEL_TUNING_WIDE / MODEL_TUNING_TALL constants above.
  //
  // To disable tuning mode just re-comment the line with a single `//`.
  // Adjustments persist in localStorage under the key "hlxhb_tuning_v1", so
  // nothing is lost between page reloads while the panel is open.
  // ============================================================================
  // var HLXHB_DEBUG_TUNING = true;

  // Older MooTools versions on this page clobber native JSON with their own
  // implementation that doesn't expose stringify/parse as functions, so we
  // provide tiny JSON-compatible helpers for our internal localStorage usage.
  function jsonStringify(obj) {
    if (obj === null || obj === undefined) return "null";
    var t = typeof obj;
    if (t === "number") return isFinite(obj) ? String(obj) : "null";
    if (t === "boolean") return obj ? "true" : "false";
    if (t === "string") {
      return '"' + obj.replace(/\\/g, "\\\\")
                      .replace(/"/g, '\\"')
                      .replace(/\n/g, "\\n")
                      .replace(/\r/g, "\\r")
                      .replace(/\t/g, "\\t") + '"';
    }
    if (t !== "object") return "null";
    var isArray = Object.prototype.toString.call(obj) === "[object Array]";
    var parts = [];
    if (isArray) {
      for (var i = 0; i < obj.length; i++) parts.push(jsonStringify(obj[i]));
      return "[" + parts.join(",") + "]";
    }
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k)) {
        parts.push(jsonStringify(k) + ":" + jsonStringify(obj[k]));
      }
    }
    return "{" + parts.join(",") + "}";
  }

  function jsonParseSafe(str) {
    if (!str) return null;
    try {
      // Only our own data is ever passed here, so using the Function
      // constructor as a compat fallback is acceptable.
      return (new Function("return (" + str + ");"))();
    } catch (e) {
      return null;
    }
  }

  var DEBUG_TUNING = (function () {
    try {
      return typeof HLXHB_DEBUG_TUNING !== "undefined" && !!HLXHB_DEBUG_TUNING;
    } catch (e) {
      return false;
    }
  })();

  var TUNING_STORAGE_KEY = "hlxhb_tuning_v1";
  var TUNING = null;
  var ACTIVE_INSTANCES = [];
  var CURRENT_MODE = "wide";
  var TUNING_PANEL_BUILT_FOR_MODE = null;

  function cloneAnchors(src) {
    var out = {};
    for (var k in src) {
      if (Object.prototype.hasOwnProperty.call(src, k)) {
        out[k] = { x: src[k].x, y: src[k].y };
      }
    }
    return out;
  }

  function makeDefaultTuning() {
    return {
      wide: {
        model: {
          modelScale: MODEL_TUNING_WIDE.modelScale,
          modelOffsetX: MODEL_TUNING_WIDE.modelOffsetX,
          modelOffsetY: MODEL_TUNING_WIDE.modelOffsetY
        },
        anchors: cloneAnchors(ANCHORS_WIDE)
      },
      tall: {
        model: {
          modelScale: MODEL_TUNING_TALL.modelScale,
          modelOffsetX: MODEL_TUNING_TALL.modelOffsetX,
          modelOffsetY: MODEL_TUNING_TALL.modelOffsetY
        },
        anchors: cloneAnchors(ANCHORS_TALL)
      }
    };
  }

  function loadTuning() {
    var defaults = makeDefaultTuning();
    if (!DEBUG_TUNING) return defaults;
    try {
      var raw = window.localStorage && window.localStorage.getItem(TUNING_STORAGE_KEY);
      if (!raw) return defaults;
      var parsed = jsonParseSafe(raw);
      if (!parsed) return defaults;
      ["wide", "tall"].forEach(function (mode) {
        if (!parsed[mode]) return;
        if (parsed[mode].model) {
          ["modelScale", "modelOffsetX", "modelOffsetY"].forEach(function (k) {
            if (isFinite(parsed[mode].model[k])) defaults[mode].model[k] = parsed[mode].model[k];
          });
        }
        if (parsed[mode].anchors) {
          for (var id in defaults[mode].anchors) {
            if (parsed[mode].anchors[id] &&
                isFinite(parsed[mode].anchors[id].x) &&
                isFinite(parsed[mode].anchors[id].y)) {
              defaults[mode].anchors[id].x = parsed[mode].anchors[id].x;
              defaults[mode].anchors[id].y = parsed[mode].anchors[id].y;
            }
          }
        }
      });
    } catch (e) { /* ignore */ }
    return defaults;
  }

  function saveTuning() {
    if (!DEBUG_TUNING) return;
    try {
      if (window.localStorage) {
        window.localStorage.setItem(TUNING_STORAGE_KEY, jsonStringify(TUNING));
      }
    } catch (e) { /* ignore */ }
  }

  function getActiveTuning(mode) {
    if (!TUNING) TUNING = loadTuning();
    return TUNING[mode];
  }

  function triggerRefreshAll() {
    var alive = [];
    for (var i = 0; i < ACTIVE_INSTANCES.length; i++) {
      var inst = ACTIVE_INSTANCES[i];
      if (inst && inst.root && document.body && document.body.contains(inst.root)) {
        try { inst.refresh(); } catch (e) {}
        alive.push(inst);
      }
    }
    ACTIVE_INSTANCES = alive;
  }

  function registerInstance(inst) {
    for (var i = 0; i < ACTIVE_INSTANCES.length; i++) {
      if (ACTIVE_INSTANCES[i].root === inst.root) {
        ACTIVE_INSTANCES[i] = inst;
        return;
      }
    }
    ACTIVE_INSTANCES.push(inst);
  }

  // ---- Tuning panel DOM -----------------------------------------------------

  function slider(id, label, min, max, step, value, decimals) {
    return '' +
      '<div data-tune-slider="' + id + '" style="display:grid;grid-template-columns:60px 1fr 48px;gap:6px;align-items:center;margin:3px 0;">' +
        '<label style="color:#94a3b8;font-size:10px;">' + label + '</label>' +
        '<input type="range" data-tune-input="' + id + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '" style="width:100%;accent-color:#22d3ee;margin:0;" />' +
        '<span data-tune-readout="' + id + '" style="color:#e2e8f0;font-variant-numeric:tabular-nums;font-size:10px;text-align:right;">' + Number(value).toFixed(decimals) + '</span>' +
      '</div>';
  }

  var TUNING_POS_KEY = "hlxhb_tuning_pos_v1";

  function loadPanelPosition() {
    try {
      var raw = window.localStorage && window.localStorage.getItem(TUNING_POS_KEY);
      if (!raw) return null;
      var p = jsonParseSafe(raw);
      if (p && isFinite(p.left) && isFinite(p.top)) return p;
    } catch (e) { /* ignore */ }
    return null;
  }

  function savePanelPosition(left, top) {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(TUNING_POS_KEY, jsonStringify({ left: left, top: top }));
      }
    } catch (e) { /* ignore */ }
  }

  function clampPanelPosition(left, top, panel) {
    var pad = 4;
    var w = panel.offsetWidth || 340;
    var h = panel.offsetHeight || 120;
    var maxLeft = Math.max(pad, window.innerWidth - w - pad);
    var maxTop = Math.max(pad, window.innerHeight - h - pad);
    return {
      left: Math.min(Math.max(pad, left), maxLeft),
      top: Math.min(Math.max(pad, top), maxTop)
    };
  }

  function applyPanelPosition(panel) {
    var saved = loadPanelPosition();
    if (saved) {
      var c = clampPanelPosition(saved.left, saved.top, panel);
      panel.style.left = c.left + "px";
      panel.style.top = c.top + "px";
      panel.style.right = "";
      panel.style.bottom = "";
    } else {
      panel.style.right = "16px";
      panel.style.bottom = "16px";
      panel.style.left = "";
      panel.style.top = "";
    }
  }

  function makePanelDraggable(panel) {
    var header = document.getElementById("hlxhb-tune-header");
    if (!header) return;
    var dragging = false;
    var startX = 0, startY = 0, startLeft = 0, startTop = 0;
    var activePointerId = null;

    function endDrag() {
      if (!dragging) return;
      dragging = false;
      header.style.cursor = "move";
      if (activePointerId !== null && header.releasePointerCapture) {
        try { header.releasePointerCapture(activePointerId); } catch (e) {}
      }
      activePointerId = null;
      window.removeEventListener("mousemove", onMove, true);
      window.removeEventListener("mouseup", onUp, true);
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("mouseup", onUp, true);
      window.removeEventListener("blur", onUp, true);
      savePanelPosition(parseFloat(panel.style.left) || 0, parseFloat(panel.style.top) || 0);
    }

    function onDown(ev) {
      var t = ev.target;
      if (t && (t.tagName === "BUTTON" || t.tagName === "INPUT" || t.tagName === "SELECT")) return;
      var rect = panel.getBoundingClientRect();
      panel.style.left = rect.left + "px";
      panel.style.top = rect.top + "px";
      panel.style.right = "";
      panel.style.bottom = "";
      startLeft = rect.left;
      startTop = rect.top;
      startX = ev.clientX;
      startY = ev.clientY;
      dragging = true;
      header.style.cursor = "grabbing";
      if (ev.pointerId !== undefined) {
        activePointerId = ev.pointerId;
        if (header.setPointerCapture) {
          try { header.setPointerCapture(ev.pointerId); } catch (e) {}
        }
      }
      if (ev.preventDefault) ev.preventDefault();
      // Mouse fallback (some wrappers don't fire pointer events).
      window.addEventListener("mousemove", onMove, true);
      window.addEventListener("mouseup", onUp, true);
      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("mouseup", onUp, true);
      window.addEventListener("blur", onUp, true);
    }

    function onMove(ev) {
      if (!dragging) return;
      var nx = startLeft + (ev.clientX - startX);
      var ny = startTop + (ev.clientY - startY);
      var c = clampPanelPosition(nx, ny, panel);
      panel.style.left = c.left + "px";
      panel.style.top = c.top + "px";
      // Persist synchronously every move: simpler than debouncing and immune
      // to other scripts intercepting pointerup/mouseup.
      savePanelPosition(c.left, c.top);
      if (ev.preventDefault) ev.preventDefault();
    }

    function onUp() { endDrag(); }

    header.addEventListener("mousedown", onDown);
    header.addEventListener("pointerdown", onDown);
    // Pointer events are dispatched straight to the capturing element, so we
    // listen on the header itself (not just on window) for move/up.
    header.addEventListener("pointermove", onMove);
    header.addEventListener("pointerup", onUp);
    header.addEventListener("pointercancel", onUp);

    // Re-clamp on viewport resize so the panel never drifts off-screen.
    window.addEventListener("resize", function () {
      if (!panel.style.left) return; // still docked via right/bottom
      var c = clampPanelPosition(parseFloat(panel.style.left) || 0, parseFloat(panel.style.top) || 0, panel);
      panel.style.left = c.left + "px";
      panel.style.top = c.top + "px";
    });
  }

  function ensureTuningPanel() {
    if (!DEBUG_TUNING) return;
    if (!document.body) return;
    if (document.getElementById("hlxhb-tuning-panel")) return;

    var panel = document.createElement("div");
    panel.id = "hlxhb-tuning-panel";
    panel.style.cssText = [
      "position:fixed",
      "width:340px",
      "max-height:calc(100vh - 32px)",
      "overflow-y:auto",
      "background:#0f172a",
      "border:1px solid #334155",
      "border-radius:8px",
      "box-shadow:0 10px 30px rgba(0,0,0,0.55)",
      "color:#e2e8f0",
      "font-family:'Segoe UI',Tahoma,Arial,sans-serif",
      "font-size:11px",
      "z-index:2147483647",
      "padding:12px",
      "box-sizing:border-box",
      "user-select:none"
    ].join(";");

    panel.innerHTML =
      '<div id="hlxhb-tune-header" style="display:flex;align-items:center;justify-content:space-between;margin:-12px -12px 8px;padding:8px 12px;cursor:move;' +
        'background:linear-gradient(180deg,' + rgba("#22D3EE", 0.10) + ',' + rgba("#22D3EE", 0.02) + ');border-bottom:1px solid ' + rgba("#22D3EE", 0.18) + ';border-radius:8px 8px 0 0;">' +
        '<div style="display:flex;align-items:center;gap:6px;">' +
          '<span style="display:inline-flex;flex-direction:column;gap:2px;line-height:0;color:' + rgba("#22D3EE", 0.7) + ';">' +
            '<span style="width:10px;height:2px;background:currentColor;border-radius:1px;"></span>' +
            '<span style="width:10px;height:2px;background:currentColor;border-radius:1px;"></span>' +
            '<span style="width:10px;height:2px;background:currentColor;border-radius:1px;"></span>' +
          '</span>' +
          '<span style="font-size:12px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:#22d3ee;">' +
            'Hitbox Tuning ' +
            '<span id="hlxhb-tune-mode" style="color:#64748b;font-size:10px;font-weight:400;">(wide)</span>' +
          '</span>' +
        '</div>' +
        '<div>' +
          '<button id="hlxhb-tune-collapse" style="background:transparent;border:1px solid #334155;color:#94a3b8;padding:2px 8px;border-radius:3px;cursor:pointer;font-size:10px;">–</button>' +
        '</div>' +
      '</div>' +
      '<div id="hlxhb-tune-body" style="user-select:auto;">' +
        '<div style="margin:4px 0 2px;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Model</div>' +
        '<div id="hlxhb-tune-model"></div>' +
        '<div style="margin:10px 0 2px;color:#64748b;font-size:10px;text-transform:uppercase;letter-spacing:1px;">Anchors</div>' +
        '<div id="hlxhb-tune-anchors"></div>' +
        '<div style="display:flex;gap:6px;margin-top:12px;">' +
          '<button id="hlxhb-tune-copy" style="flex:1;background:#0ea5e9;border:none;color:#fff;padding:7px;border-radius:3px;cursor:pointer;font-weight:600;font-size:11px;">Copy config</button>' +
          '<button id="hlxhb-tune-reset" style="background:#1e293b;border:1px solid #334155;color:#cbd5e1;padding:7px 10px;border-radius:3px;cursor:pointer;font-size:11px;">Reset</button>' +
        '</div>' +
        '<div id="hlxhb-tune-status" style="margin-top:6px;color:#64748b;font-size:10px;min-height:14px;"></div>' +
      '</div>';

    document.body.appendChild(panel);

    // Restore saved position or dock to the bottom-right corner.
    applyPanelPosition(panel);
    makePanelDraggable(panel);

    document.getElementById("hlxhb-tune-collapse").addEventListener("click", function () {
      var body = document.getElementById("hlxhb-tune-body");
      var btn = this;
      if (body.style.display === "none") {
        body.style.display = "";
        btn.textContent = "–";
      } else {
        body.style.display = "none";
        btn.textContent = "+";
      }
    });

    document.getElementById("hlxhb-tune-copy").addEventListener("click", function () {
      copyConfigToClipboard();
    });

    document.getElementById("hlxhb-tune-reset").addEventListener("click", function () {
      if (!window.confirm("Reset tuning for the \"" + CURRENT_MODE + "\" mode to its default values?")) return;
      var defaults = makeDefaultTuning();
      TUNING[CURRENT_MODE] = defaults[CURRENT_MODE];
      saveTuning();
      TUNING_PANEL_BUILT_FOR_MODE = null;
      rebuildTuningPanelIfNeeded(CURRENT_MODE, true);
      triggerRefreshAll();
      setTuningStatus("Reset applied");
    });
  }

  function rebuildTuningPanelIfNeeded(mode, force) {
    if (!DEBUG_TUNING) return;
    if (!document.getElementById("hlxhb-tuning-panel")) return;
    if (!force && TUNING_PANEL_BUILT_FOR_MODE === mode) return;
    TUNING_PANEL_BUILT_FOR_MODE = mode;

    var modeEl = document.getElementById("hlxhb-tune-mode");
    if (modeEl) modeEl.textContent = "(" + mode + ")";

    var t = getActiveTuning(mode);

    var modelHtml = '' +
      slider("modelScale", "scale", 0.50, 1.60, 0.01, t.model.modelScale, 2) +
      slider("modelOffsetX", "offsetX", -120, 120, 1, t.model.modelOffsetX, 0) +
      slider("modelOffsetY", "offsetY", -120, 120, 1, t.model.modelOffsetY, 0);
    document.getElementById("hlxhb-tune-model").innerHTML = modelHtml;

    var anchorsHtml = "";
    for (var i = 0; i < PARTS.length; i++) {
      var p = PARTS[i];
      var a = t.anchors[p.id];
      anchorsHtml +=
        '<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px dashed ' + rgba("#94A3B8", 0.12) + ';">' +
          '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + p.color + ';box-shadow:0 0 6px ' + rgba(p.color, 0.75) + ';flex-shrink:0;"></span>' +
          '<span style="width:58px;color:#cbd5e1;font-size:10px;">' + p.label + '</span>' +
          '<div style="flex:1;display:flex;flex-direction:column;gap:2px;">' +
            '<div data-tune-slider="anchor.' + p.id + '.x" style="display:grid;grid-template-columns:14px 1fr 40px;gap:4px;align-items:center;">' +
              '<span style="color:#64748b;font-size:9px;">X</span>' +
              '<input type="range" data-tune-input="anchor.' + p.id + '.x" min="0" max="1" step="0.002" value="' + a.x + '" style="width:100%;accent-color:' + p.color + ';margin:0;" />' +
              '<span data-tune-readout="anchor.' + p.id + '.x" style="color:#e2e8f0;font-variant-numeric:tabular-nums;font-size:9px;text-align:right;">' + a.x.toFixed(3) + '</span>' +
            '</div>' +
            '<div data-tune-slider="anchor.' + p.id + '.y" style="display:grid;grid-template-columns:14px 1fr 40px;gap:4px;align-items:center;">' +
              '<span style="color:#64748b;font-size:9px;">Y</span>' +
              '<input type="range" data-tune-input="anchor.' + p.id + '.y" min="0" max="1" step="0.002" value="' + a.y + '" style="width:100%;accent-color:' + p.color + ';margin:0;" />' +
              '<span data-tune-readout="anchor.' + p.id + '.y" style="color:#e2e8f0;font-variant-numeric:tabular-nums;font-size:9px;text-align:right;">' + a.y.toFixed(3) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    }
    document.getElementById("hlxhb-tune-anchors").innerHTML = anchorsHtml;

    // Bind all range inputs
    var inputs = document.querySelectorAll("#hlxhb-tuning-panel input[data-tune-input]");
    for (var k = 0; k < inputs.length; k++) {
      inputs[k].addEventListener("input", onTuneInputChange);
    }
  }

  function onTuneInputChange(ev) {
    var input = ev.target;
    var key = input.getAttribute("data-tune-input");
    var value = Number(input.value);
    var t = getActiveTuning(CURRENT_MODE);

    if (key === "modelScale" || key === "modelOffsetX" || key === "modelOffsetY") {
      t.model[key] = value;
      setReadout(key, value, key === "modelScale" ? 2 : 0);
    } else if (key.indexOf("anchor.") === 0) {
      var rest = key.substring(7);
      var dotAt = rest.lastIndexOf(".");
      var partId = rest.substring(0, dotAt);
      var axis = rest.substring(dotAt + 1);
      if (t.anchors[partId]) {
        t.anchors[partId][axis] = value;
        setReadout(key, value, 3);
      }
    }
    saveTuning();
    triggerRefreshAll();
  }

  function setReadout(key, value, decimals) {
    var out = document.querySelector('[data-tune-readout="' + key + '"]');
    if (out) out.textContent = Number(value).toFixed(decimals);
  }

  function setTuningStatus(text) {
    var s = document.getElementById("hlxhb-tune-status");
    if (!s) return;
    s.textContent = text || "";
    if (text) {
      clearTimeout(setTuningStatus._t);
      setTuningStatus._t = setTimeout(function () {
        if (s) s.textContent = "";
      }, 2500);
    }
  }

  function formatConfigOutput() {
    function fmtNum(n, d) { return Number(n).toFixed(d); }
    var lines = [];
    lines.push("// --- paste into hitbox-modern.js ---");
    ["wide", "tall"].forEach(function (mode) {
      var t = TUNING[mode];
      var modelName = "MODEL_TUNING_" + mode.toUpperCase();
      var anchorsName = "ANCHORS_" + mode.toUpperCase();
      lines.push("var " + modelName + " = { " +
        "modelScale: " + fmtNum(t.model.modelScale, 2) + ", " +
        "modelOffsetX: " + fmtNum(t.model.modelOffsetX, 0) + ", " +
        "modelOffsetY: " + fmtNum(t.model.modelOffsetY, 0) + " };");
      lines.push("var " + anchorsName + " = {");
      for (var i = 0; i < PARTS.length; i++) {
        var p = PARTS[i];
        var a = t.anchors[p.id];
        var comma = i < PARTS.length - 1 ? "," : "";
        lines.push("  " + p.id + ": " + (p.id.length < 8 ? new Array(8 - p.id.length + 1).join(" ") : "") +
          "{ x: " + fmtNum(a.x, 3) + ", y: " + fmtNum(a.y, 3) + " }" + comma);
      }
      lines.push("};");
    });
    return lines.join("\n");
  }

  function copyConfigToClipboard() {
    var payload = formatConfigOutput();
    var done = function (ok) {
      setTuningStatus(ok ? "Copied to clipboard" : "Copy failed — see console");
      if (!ok) {
        try { console.log("[HLXHitboxModern tuning]\n" + payload); } catch (e) {}
      }
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(payload).then(function () { done(true); }, function () {
        legacyCopy(payload, done);
      });
    } else {
      legacyCopy(payload, done);
    }
  }

  function legacyCopy(text, done) {
    try {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.cssText = "position:fixed;top:-1000px;left:-1000px;opacity:0;";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      var ok = document.execCommand && document.execCommand("copy");
      document.body.removeChild(ta);
      done(!!ok);
    } catch (e) {
      done(false);
    }
  }

  // ---- Main render ----------------------------------------------------------

  function render(targetId, payload, options) {
    var root = document.getElementById(targetId);
    if (!root || !payload) return;

    var opts = options || {};
    var wname = payload.wname || "All Weapons";

    var values = {
      head: toNumber(payload.head),
      leftarm: toNumber(payload.leftarm),
      rightarm: toNumber(payload.rightarm),
      chest: toNumber(payload.chest),
      stomach: toNumber(payload.stomach),
      leftleg: toNumber(payload.leftleg),
      rightleg: toNumber(payload.rightleg)
    };
    // Flash historically swaps left/right bar widths (character vs viewer perspective).
    var graphOf = {
      head: values.head,
      chest: values.chest,
      stomach: values.stomach,
      leftarm: values.rightarm,
      rightarm: values.leftarm,
      leftleg: values.rightleg,
      rightleg: values.leftleg
    };

    var model = payload.model || "ct";
    var imageBase = opts.imageBase || "hlstatsimg";
    var modelSrc = imageBase + "/hitbox_models/" + model + ".png";

    var textColor = opts.textcolor || "#E6EDF3";
    var captionColor = opts.captioncolor || "#FFFFFF";
    var numberColor = opts.numcolor_num || "#E6EDF3";
    var percentColor = opts.numcolor_pct || "#22D3EE";
    var barEnd = normalizeHex(opts.barcolor) || "#38BDF8";
    var barStart = shade(barEnd, -30);
    var barBackground = opts.barbackground || rgba("#FFFFFF", 0.08);
    var totalColor = opts.textcolor_total || "#F8FAFC";
    var accentHex = normalizeHex(opts.linecolor) || barEnd;
    var panelBorder = rgba(accentHex, 0.18);
    var panelAccentBg = "linear-gradient(90deg," + rgba(accentHex, 0.14) + "," + rgba(accentHex, 0.02) + ")";

    // i18n: callers can override labels via opts.i18n. Falls back to English
    // defaults so the renderer works standalone without a translation layer.
    var i18n = opts.i18n || {};
    function label(id, fallback) {
      return i18n[id] ? String(i18n[id]) : fallback;
    }
    var labels = {
      head:      label("head",      "Head"),
      chest:     label("chest",     "Chest"),
      leftarm:   label("leftarm",   "Left Arm"),
      rightarm:  label("rightarm",  "Right Arm"),
      stomach:   label("stomach",   "Stomach"),
      leftleg:   label("leftleg",   "Left Leg"),
      rightleg:  label("rightleg",  "Right Leg"),
      totalHits: label("totalHits", "Total Hits"),
      targets:   label("targets",   "Targets")
    };

    var total =
      values.head + values.leftarm + values.rightarm +
      values.chest + values.stomach +
      values.leftleg + values.rightleg;

    function pct(v) {
      if (!total) return "0%";
      return Math.round((v / total) * 100) + "%";
    }

    root.style.position = "relative";
    root.style.overflow = "hidden";

    var parts = [];
    parts.push(
      '<div class="hlxhb-panel" data-hlxhb="1" ' +
        'style="position:relative;width:100%;height:100%;box-sizing:border-box;padding:10px 12px;' +
        'display:flex;flex-direction:column;gap:8px;' +
        "font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:" + esc(textColor) + ";overflow:hidden;\">"
    );

    // Header
    parts.push('<div class="hlxhb-header" style="flex:0 0 auto;display:flex;align-items:baseline;justify-content:space-between;gap:8px;padding-bottom:6px;border-bottom:1px solid ' + rgba("#FFFFFF", 0.08) + ';">');
    parts.push(
      '<div style="font-size:12px;font-weight:600;letter-spacing:0.6px;text-transform:uppercase;color:' + esc(captionColor) + ';' +
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(wname) + "</div>"
    );
    parts.push('<div style="font-size:9px;letter-spacing:2px;color:' + rgba("#FFFFFF", 0.4) + ';text-transform:uppercase;flex-shrink:0;">' + esc(labels.targets) + '</div>');
    parts.push("</div>");

    // Body row: stats on LEFT, model on RIGHT. Screen-left arm/leg markers have
    // shorter, less-crossing leader lines to the left-side stats column.
    parts.push('<div class="hlxhb-body" style="flex:1 1 auto;min-height:0;display:flex;gap:10px;position:relative;">');

    // Stats column (left)
    parts.push('<div class="hlxhb-stats" style="flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:3px;">');

    // Total row
    parts.push(
      '<div class="hlxhb-total" style="flex:0 0 auto;display:flex;align-items:center;justify-content:space-between;' +
        "padding:6px 10px;background:" + panelAccentBg + ";border:1px solid " + panelBorder + ";border-radius:4px;" +
        "margin-bottom:3px;\">"
    );
    parts.push('<span style="font-size:9px;letter-spacing:1.8px;text-transform:uppercase;color:' + rgba("#FFFFFF", 0.55) + ';">' + esc(labels.totalHits) + '</span>');
    parts.push(
      '<span style="font-size:16px;font-weight:700;color:' + esc(totalColor) + ';' +
        'font-variant-numeric:tabular-nums;letter-spacing:0.5px;">' + esc(fmt(total)) + "</span>"
    );
    parts.push("</div>");

    // Part rows. Columns: label | bar | num | pct | row-dot (anchor for leader line)
    for (var j = 0; j < PARTS.length; j++) {
      var pp = PARTS[j];
      var vv = values[pp.id];
      var bv = graphOf[pp.id];
      var barPct = total > 0 ? (bv / total) * 100 : 0;
      var rowOpacity = vv > 0 ? 1 : 0.5;
      parts.push(
        '<div class="hlxhb-row" data-part="' + pp.id + '" ' +
          'style="flex:1 1 0;min-height:0;display:grid;' +
          "grid-template-columns:1fr 34px 36px 12px;gap:6px;align-items:center;" +
          "padding:2px 4px;opacity:" + rowOpacity + ';font-size:11px;line-height:1.1;">'
      );
      parts.push('<div style="display:flex;flex-direction:column;gap:3px;min-width:0;">');
      parts.push(
        '<span style="color:' + esc(textColor) + ';font-size:10px;font-weight:500;letter-spacing:0.2px;' +
          'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(labels[pp.id] || pp.label) + "</span>"
      );
      parts.push(
        '<div style="height:4px;border-radius:2px;background:' + esc(barBackground) + ';overflow:hidden;position:relative;">'
      );
      parts.push(
        '<div class="hlxhb-bar-fill" style="height:100%;width:' + barPct.toFixed(2) + "%;" +
          "background:linear-gradient(90deg," + barStart + "," + barEnd + ");" +
          "border-radius:2px;box-shadow:0 0 6px " + rgba(barEnd, 0.45) + ';transition:width 320ms ease;"></div>'
      );
      parts.push("</div>");
      parts.push("</div>");
      parts.push(
        '<span style="color:' + esc(numberColor) + ";font-variant-numeric:tabular-nums;font-weight:600;font-size:11px;" +
          'text-align:right;">' + esc(fmt(vv)) + "</span>"
      );
      parts.push(
        '<span style="color:' + esc(percentColor) + ";font-variant-numeric:tabular-nums;font-size:10px;" +
          'text-align:right;">' + esc(pct(vv)) + "</span>"
      );
      parts.push(
        '<span class="hlxhb-row-dot" style="width:8px;height:8px;border-radius:50%;' +
          "background:" + pp.color + ";box-shadow:0 0 6px " + rgba(pp.color, 0.75) + ';justify-self:center;"></span>'
      );
      parts.push("</div>");
    }

    parts.push("</div>"); // end stats

    // Model column (right)
    parts.push(
      '<div class="hlxhb-model" style="position:relative;width:44%;max-width:200px;flex:0 0 auto;' +
        "background:radial-gradient(ellipse at center," + rgba("#FFFFFF", 0.04) + " 0%," + rgba("#000000", 0.45) + " 100%);" +
        "border:1px solid " + rgba("#FFFFFF", 0.08) + ";border-radius:6px;overflow:hidden;\">"
    );
    // Image is positioned and sized explicitly in JS via positionMarkers() so
    // that tuning (scale/offsetX/offsetY) can overflow the container without
    // leaving blank strips on the side (avoids the "stump" artifact).
    parts.push(
      '<img src="' + esc(modelSrc) + '" alt="' + esc(model) + '" ' +
        'style="position:absolute;left:0;top:0;' +
        'filter:drop-shadow(0 4px 10px rgba(0,0,0,0.6));pointer-events:none;" ' +
        "onerror=\"this.style.display='none'\" />"
    );
    // Markers are inserted but positioned via JS once we know the rendered image rect.
    for (var i = 0; i < PARTS.length; i++) {
      var p = PARTS[i];
      var v = values[p.id];
      var isActive = v > 0;
      var dotSize = isActive ? 11 : 8;
      var dotOpacity = isActive ? 1 : 0.4;
      parts.push(
        '<span class="hlxhb-marker" data-part="' + p.id + '" ' +
          'style="position:absolute;left:50%;top:50%;' +
          "width:" + dotSize + "px;height:" + dotSize + "px;" +
          "margin-left:-" + (dotSize / 2) + "px;margin-top:-" + (dotSize / 2) + "px;" +
          "border-radius:50%;background:" + p.color + ";" +
          "box-shadow:0 0 0 2px " + rgba("#000000", 0.55) + ",0 0 10px " + rgba(p.color, 0.75) + ";" +
          "opacity:" + dotOpacity + ";pointer-events:none;z-index:3;transition:left 160ms ease,top 160ms ease;\"></span>"
      );
    }
    parts.push("</div>"); // end model

    // SVG overlay for leader lines. Sits above stats/model but below markers (z-index 2).
    parts.push(
      '<svg class="hlxhb-lines" xmlns="http://www.w3.org/2000/svg" ' +
        'style="position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:2;overflow:visible;"></svg>'
    );

    parts.push("</div>"); // end body
    parts.push("</div>"); // end panel

    root.innerHTML = parts.join("");

    var panel = root.querySelector(".hlxhb-panel");
    var body = panel.querySelector(".hlxhb-body");
    var modelBox = panel.querySelector(".hlxhb-model");
    var img = modelBox.querySelector("img");
    var svg = panel.querySelector(".hlxhb-lines");

    function positionMarkers() {
      if (!img || !img.naturalWidth || !img.naturalHeight) return false;
      var cw = modelBox.clientWidth;
      var ch = modelBox.clientHeight;
      if (!cw || !ch) return false;
      var ia = img.naturalWidth / img.naturalHeight;

      // Wide models (CS/DoD/TFC: ~596x440) have their figure in a narrow
      // vertical strip -- fill container height and let width overflow
      // (cover-like) so tuning never exposes a blank right-edge strip.
      // Portrait / tall models fit inside with letterboxing as needed.
      var mode = ia > 1.0 ? "wide" : "tall";
      CURRENT_MODE = mode;

      var tuning = (DEBUG_TUNING ? getActiveTuning(mode) : null);
      var scale = tuning ? tuning.model.modelScale : (mode === "wide" ? MODEL_TUNING_WIDE : MODEL_TUNING_TALL).modelScale;
      var offX  = tuning ? tuning.model.modelOffsetX : (mode === "wide" ? MODEL_TUNING_WIDE : MODEL_TUNING_TALL).modelOffsetX;
      var offY  = tuning ? tuning.model.modelOffsetY : (mode === "wide" ? MODEL_TUNING_WIDE : MODEL_TUNING_TALL).modelOffsetY;
      var anchors = tuning ? tuning.anchors : (mode === "wide" ? ANCHORS_WIDE : ANCHORS_TALL);

      // Base fit: for wide models always fill vertically (no horizontal
      // letterbox), for tall models keep aspect and letterbox whatever side.
      var baseW, baseH;
      if (mode === "wide") {
        baseH = ch;
        baseW = ch * ia;
      } else {
        if (ia > cw / ch) {
          baseW = cw;
          baseH = cw / ia;
        } else {
          baseH = ch;
          baseW = ch * ia;
        }
      }

      var dw = baseW * scale;
      var dh = baseH * scale;
      var ox = (cw - dw) / 2 + offX;
      var oy = (ch - dh) / 2 + offY;

      // Apply directly to the img element. We use explicit width/height here
      // instead of CSS transforms so that tuning offsets never expose blank
      // strips along the container edges -- the container's overflow:hidden
      // crops anything beyond, which is exactly the desired behaviour.
      img.style.width = dw + "px";
      img.style.height = dh + "px";
      img.style.left = ox + "px";
      img.style.top = oy + "px";
      img.style.transform = ""; // legacy cleanup (earlier versions used transform)

      var markers = panel.querySelectorAll(".hlxhb-marker");
      for (var i = 0; i < markers.length; i++) {
        var m = markers[i];
        var id = m.getAttribute("data-part");
        var a = anchors[id];
        if (!a) continue;
        m.style.left = (ox + a.x * dw) + "px";
        m.style.top = (oy + a.y * dh) + "px";
      }
      return true;
    }

    function drawLines() {
      var bodyRect = body.getBoundingClientRect();
      if (!bodyRect.width || !bodyRect.height) return;
      svg.setAttribute("viewBox", "0 0 " + bodyRect.width + " " + bodyRect.height);
      while (svg.firstChild) svg.removeChild(svg.firstChild);

      for (var k = 0; k < PARTS.length; k++) {
        var part = PARTS[k];
        var marker = panel.querySelector('.hlxhb-marker[data-part="' + part.id + '"]');
        var dot = panel.querySelector('.hlxhb-row[data-part="' + part.id + '"] .hlxhb-row-dot');
        if (!marker || !dot) continue;

        var mr = marker.getBoundingClientRect();
        var dr = dot.getBoundingClientRect();
        if (!mr.width || !dr.width) continue;

        // Row dot is on the right edge of the stats column; marker sits inside
        // the model image on the right. Leader line: short stub from row dot,
        // then diagonal to marker.
        var sx = dr.left + dr.width / 2 - bodyRect.left;
        var sy = dr.top + dr.height / 2 - bodyRect.top;
        var ex = mr.left + mr.width / 2 - bodyRect.left;
        var ey = mr.top + mr.height / 2 - bodyRect.top;

        var stubLen = Math.max(10, (ex - sx) * 0.18);
        var kinkX = sx + stubLen;

        var pathStr =
          "M " + sx.toFixed(2) + " " + sy.toFixed(2) +
          " L " + kinkX.toFixed(2) + " " + sy.toFixed(2) +
          " L " + ex.toFixed(2) + " " + ey.toFixed(2);

        var active = values[part.id] > 0;

        var glow = document.createElementNS(SVG_NS, "path");
        glow.setAttribute("d", pathStr);
        glow.setAttribute("fill", "none");
        glow.setAttribute("stroke", part.color);
        glow.setAttribute("stroke-width", active ? "3" : "2");
        glow.setAttribute("stroke-opacity", active ? "0.22" : "0.08");
        glow.setAttribute("stroke-linejoin", "round");
        glow.setAttribute("stroke-linecap", "round");
        svg.appendChild(glow);

        var line = document.createElementNS(SVG_NS, "path");
        line.setAttribute("d", pathStr);
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", part.color);
        line.setAttribute("stroke-width", "1");
        line.setAttribute("stroke-opacity", active ? "0.85" : "0.3");
        line.setAttribute("stroke-linejoin", "round");
        line.setAttribute("stroke-linecap", "round");
        svg.appendChild(line);
      }
    }

    function refresh() {
      if (positionMarkers()) {
        // Mode may have changed (different model aspect): rebuild tuning panel.
        if (DEBUG_TUNING) rebuildTuningPanelIfNeeded(CURRENT_MODE, false);
      }
      drawLines();
    }

    function schedule() {
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(refresh);
      } else {
        setTimeout(refresh, 16);
      }
    }

    schedule();
    setTimeout(schedule, 80);
    setTimeout(schedule, 260);

    if (img) {
      if (img.complete && img.naturalWidth) {
        schedule();
      } else {
        img.addEventListener("load", schedule);
        img.addEventListener("error", schedule);
      }
    }

    if (root.__hlxhbResizeHandler) {
      window.removeEventListener("resize", root.__hlxhbResizeHandler);
    }
    root.__hlxhbResizeHandler = schedule;
    window.addEventListener("resize", schedule);

    // Register this instance so the debug tuning panel can push refreshes.
    if (DEBUG_TUNING) {
      ensureTuningPanel();
      registerInstance({ root: root, refresh: refresh });
    }
  }

  global.HLXHitboxModern = {
    render: render
  };
})(window);
