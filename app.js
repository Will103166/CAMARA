const FONTS = {
  sans: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
  serif: '"Noto Serif TC", "PMingLiU", serif',
  system: '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif',
};

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const FIELD_IDS = ["time", "place", "coords", "weather"];
const FIELD_LABEL = { time: "時間", place: "地點", coords: "座標", weather: "天氣" };
const ANCHORS = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
const STORAGE_KEY = "timecam-settings-v1";

const WEATHER = {
  0: "晴",
  1: "大致晴",
  2: "多雲",
  3: "陰",
  45: "霧",
  48: "霧",
  51: "小毛雨",
  53: "毛雨",
  55: "大毛雨",
  56: "凍毛雨",
  57: "強凍毛雨",
  61: "小雨",
  63: "雨",
  65: "大雨",
  66: "凍雨",
  67: "強凍雨",
  71: "小雪",
  73: "雪",
  75: "大雪",
  77: "雪粒",
  80: "陣雨",
  81: "陣雨",
  82: "強陣雨",
  85: "陣雪",
  86: "強陣雪",
  95: "雷雨",
  96: "雷雨夾冰雹",
  99: "強雷雨夾冰雹",
};

const DEFAULT_FIELDS = FIELD_IDS.map((id) => ({ id, enabled: true, anchor: "bl" }));

const $ = (id) => document.getElementById(id);

const ui = {
  gate: $("gate"),
  camera: $("camera"),
  result: $("result"),
  settings: $("settings"),
  start: $("start"),
  install: $("install"),
  gateNote: $("gate-note"),
  preview: $("preview"),
  status: $("status"),
  hudClock: $("hud-clock"),
  hudMeta: $("hud-meta"),
  toast: $("toast"),
  pick: $("pick"),
  shutter: $("shutter"),
  flip: $("flip"),
  file: $("file"),
  shot: $("shot"),
  meta: $("meta"),
  retake: $("retake"),
  save: $("save"),
  share: $("share"),
  openSettings: $("open-settings"),
  settingsClose: $("settings-close"),
  font: $("font"),
  textScale: $("text-scale"),
  textScaleLabel: $("text-scale-label"),
  gridToggle: $("grid-toggle"),
  weatherSource: $("weather-source"),
  hour24: $("hour-24"),
  hour12: $("hour-12"),
  soundToggle: $("sound-toggle"),
  fieldList: $("field-list"),
  sample: $("stamp-sample"),
  grid: $("grid"),
  level: $("level"),
  levelLine: $("level-line"),
  levelMark: $("level-mark"),
  levelReadout: $("level-readout"),
  zoom: $("zoom"),
  zoomLabel: $("zoom-label"),
};

const state = {
  stream: null,
  facing: "environment",
  coords: null,
  place: "",
  weather: "",
  locationError: "",
  watchId: null,
  busy: false,
  blob: null,
  filename: "",
  objectUrl: "",
  lastFetchAt: null,
  contextToken: 0,
  toastTimer: 0,
  clockTimer: 0,
  zoom: 1,
  zoomMode: "digital",
  zoomMin: 1,
  zoomMax: 4,
  pendingZoom: 1,
  zoomFrame: 0,
  pinch: null,
  audio: null,
  sawOrientation: false,
};

let deferredInstall = null;
let settings = loadSettings();

function pad(value) {
  return String(value).padStart(2, "0");
}

function fontFamily() {
  return FONTS[settings.font] || FONTS.sans;
}

function formatClock(date) {
  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  if (settings.hour12) {
    const suffix = hours < 12 ? "上午" : "下午";
    hours = hours % 12 || 12;
    return `${suffix} ${hours}:${minutes}:${seconds}`;
  }
  return `${pad(hours)}:${minutes}:${seconds}`;
}

function formatWhen(date) {
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}  ${WEEKDAYS[date.getDay()]}  ${formatClock(date)}`;
}

function formatCoords(lat, lon) {
  const latHem = lat >= 0 ? "N" : "S";
  const lonHem = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(6)}°${latHem}  ${Math.abs(lon).toFixed(6)}°${lonHem}`;
}

function filenameFor(date) {
  return `時間相機_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.jpg`;
}

function fieldEnabled(id) {
  return settings.fields.some((field) => field.id === id && field.enabled);
}

function normalizeFields(fields) {
  const incoming = Array.isArray(fields) ? fields : [];
  const seen = new Set();
  const result = [];
  for (const field of incoming) {
    if (!FIELD_IDS.includes(field?.id) || seen.has(field.id)) continue;
    seen.add(field.id);
    result.push({
      id: field.id,
      enabled: field.enabled !== false,
      anchor: ANCHORS.includes(field.anchor) ? field.anchor : "bl",
    });
  }
  for (const id of FIELD_IDS) {
    if (!seen.has(id)) result.push({ id, enabled: true, anchor: "bl" });
  }
  return result;
}

function loadSettings() {
  const base = {
    font: "sans",
    textScale: 1,
    grid: false,
    weatherSource: "open-meteo",
    hour12: false,
    shutterSound: true,
    fields: DEFAULT_FIELDS.map((field) => ({ ...field })),
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const font = FONTS[saved.font] ? saved.font : base.font;
    const textScale = Number(saved.textScale);
    const weatherSource = saved.weatherSource === "wttr" ? "wttr" : "open-meteo";
    return {
      font,
      textScale: Number.isFinite(textScale) ? Math.min(1.6, Math.max(0.7, textScale)) : 1,
      grid: Boolean(saved.grid),
      weatherSource,
      hour12: Boolean(saved.hour12),
      shutterSound: saved.shutterSound !== false,
      fields: normalizeFields(saved.fields || base.fields),
    };
  } catch {
    return base;
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function show(name) {
  ui.gate.hidden = name !== "gate";
  ui.camera.hidden = name !== "camera";
  ui.result.hidden = name !== "result";
}

function showToast(message) {
  ui.toast.textContent = message;
  ui.toast.hidden = false;
  clearTimeout(state.toastTimer);
  state.toastTimer = setTimeout(() => {
    ui.toast.hidden = true;
  }, 4200);
}

function renderStatus() {
  if (state.locationError) {
    ui.status.textContent = state.locationError;
  } else if (!state.coords) {
    ui.status.textContent = "定位中…";
  } else if (!state.place && !state.weather) {
    ui.status.textContent = "已定位，正在查地點與天氣";
  } else {
    ui.status.textContent = [state.place, state.weather].filter(Boolean).join(" · ");
  }

  const bits = [];
  for (const field of settings.fields) {
    if (!field.enabled || field.id === "time") continue;
    if (field.id === "coords" && state.coords) {
      bits.push(formatCoords(state.coords.lat, state.coords.lon));
      if (Number.isFinite(state.coords.accuracy)) {
        bits.push(`約 ±${Math.round(state.coords.accuracy)} 公尺`);
      }
    }
    if (field.id === "place" && state.place) bits.push(state.place);
    if (field.id === "weather" && state.weather) bits.push(state.weather);
  }
  ui.hudMeta.textContent = bits.length
    ? bits.join("\n")
    : "預覽，按下快門後才寫入照片";
}

function tickClock() {
  ui.hudClock.textContent = formatClock(new Date());
}

function updateSample() {
  ui.sample.textContent = formatWhen(new Date());
  ui.sample.style.fontFamily = fontFamily();
  ui.sample.style.fontSize = `${Math.round(16 * settings.textScale)}px`;
}

function applyGrid() {
  ui.grid.hidden = !settings.grid;
}

function setSwitch(button, on) {
  button.classList.toggle("is-on", on);
  button.setAttribute("aria-pressed", String(on));
}

function syncSettingsForm() {
  ui.font.value = settings.font;
  ui.textScale.value = String(settings.textScale);
  ui.textScaleLabel.textContent = `${Math.round(settings.textScale * 100)}%`;
  setSwitch(ui.gridToggle, settings.grid);
  ui.weatherSource.value = settings.weatherSource;
  ui.hour24.classList.toggle("is-on", !settings.hour12);
  ui.hour12.classList.toggle("is-on", settings.hour12);
  ui.hour24.setAttribute("aria-pressed", String(!settings.hour12));
  ui.hour12.setAttribute("aria-pressed", String(settings.hour12));
  setSwitch(ui.soundToggle, settings.shutterSound);
  updateSample();
  renderFields();
  applyGrid();
  tickClock();
}

function renderFields() {
  ui.fieldList.replaceChildren();
  settings.fields.forEach((field, index) => {
    const row = document.createElement("div");
    row.className = "field";
    row.dataset.id = field.id;

    const label = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = field.enabled;
    label.append(checkbox, document.createTextNode(FIELD_LABEL[field.id]));

    const tools = document.createElement("div");
    tools.className = "field-tools";
    const up = document.createElement("button");
    up.type = "button";
    up.dataset.dir = "-1";
    up.textContent = "上移";
    up.disabled = index === 0;
    const down = document.createElement("button");
    down.type = "button";
    down.dataset.dir = "1";
    down.textContent = "下移";
    down.disabled = index === settings.fields.length - 1;
    tools.append(up, down);

    const grid = document.createElement("div");
    grid.className = "mini-grid";
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", `${FIELD_LABEL[field.id]}的位置`);
    for (const anchor of ANCHORS) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.anchor = anchor;
      button.classList.toggle("is-on", field.anchor === anchor);
      button.setAttribute("aria-label", anchorLabel(anchor));
      button.setAttribute("aria-pressed", String(field.anchor === anchor));
      grid.append(button);
    }

    row.append(label, tools, grid);
    ui.fieldList.append(row);
  });
}

function anchorLabel(anchor) {
  const names = {
    tl: "左上", tc: "中上", tr: "右上",
    ml: "左中", mc: "正中", mr: "右中",
    bl: "左下", bc: "中下", br: "右下",
  };
  return names[anchor] || anchor;
}

function moveField(id, direction) {
  const index = settings.fields.findIndex((field) => field.id === id);
  const next = index + direction;
  if (index < 0 || next < 0 || next >= settings.fields.length) return;
  const [item] = settings.fields.splice(index, 1);
  settings.fields.splice(next, 0, item);
  saveSettings();
  renderFields();
  renderStatus();
}

function distanceMeters(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function joinPlace(parts) {
  const unique = [];
  for (const part of parts) {
    const text = cleanPlace(part);
    if (!text) continue;
    if (unique.some((item) => item === text || item.includes(text))) continue;
    const broader = unique.findIndex((item) => text.includes(item) && text !== item);
    if (broader >= 0) unique[broader] = text;
    else unique.push(text);
  }
  const cjk = (text) => /[\u3400-\u9fff]/.test(text);
  if (unique.every(cjk)) return unique.join("");
  if (unique.every((text) => !cjk(text))) return unique.join(", ");
  return unique.join(" ");
}

function cleanPlace(text) {
  return String(text || "")
    .replace(/中華民國|中华民国/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function readJson(url) {
  const response = await fetch(url, { referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

function preferLocal(country, parts) {
  const local = joinPlace(parts);
  if (!local) return cleanPlace(country);
  if (/中華民國|中华民国|台灣|臺灣|^taiwan$/i.test(String(country || "").trim())) return local;
  return joinPlace([country, ...parts]);
}

async function reverseGeocode(lat, lon) {
  try {
    const data = await readJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`
    );
    const place = cleanPlace(preferLocal(data.countryName, [
      data.principalSubdivision,
      data.city,
      data.locality,
    ]));
    if (place) return place;
  } catch {
    /* try the next geocoder */
  }

  try {
    const data = await readJson(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh-TW`
    );
    const address = data.address || {};
    return cleanPlace(preferLocal(address.country, [
      address.state,
      address.city || address.county || address.town,
      address.city_district || address.suburb || address.neighbourhood,
      address.road,
    ]));
  } catch {
    return "";
  }
}

async function fetchOpenMeteo(lat, lon) {
  const data = await readJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
  );
  const current = data.current || {};
  const label = WEATHER[current.weather_code] || "天氣";
  if (!Number.isFinite(current.temperature_2m)) return "";
  return `${label}  ${Math.round(current.temperature_2m)}°C`;
}

async function fetchWttr(lat, lon) {
  const data = await readJson(`https://wttr.in/${lat},${lon}?format=j1&lang=zh-tw`);
  const current = data.current_condition?.[0];
  if (!current) return "";
  const translated = current.lang_zh?.[0]?.value
    || current["lang_zh-tw"]?.[0]?.value
    || current.weatherDesc?.[0]?.value
    || "天氣";
  if (!Number.isFinite(Number(current.temp_C))) return "";
  return `${translated}  ${Math.round(Number(current.temp_C))}°C`;
}

async function fetchWeather(lat, lon) {
  if (settings.weatherSource === "wttr") {
    try {
      const weather = await fetchWttr(lat, lon);
      if (weather) return weather;
    } catch {
      showToast("wttr.in 讀不到，已改查 Open-Meteo");
    }
  }
  try {
    return await fetchOpenMeteo(lat, lon);
  } catch {
    return "";
  }
}

async function refreshContext(lat, lon, force) {
  const here = { lat, lon };
  if (!force && state.lastFetchAt && distanceMeters(state.lastFetchAt, here) < 80 && (state.place || state.weather)) {
    return;
  }
  const token = ++state.contextToken;
  state.lastFetchAt = here;
  const [place, weather] = await Promise.all([reverseGeocode(lat, lon), fetchWeather(lat, lon)]);
  if (token !== state.contextToken) return;
  state.place = cleanPlace(place);
  state.weather = weather;
  renderStatus();
}

function applyPosition(position) {
  const coords = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    accuracy: position.coords.accuracy,
  };
  state.coords = coords;
  state.locationError = "";
  renderStatus();
  refreshContext(coords.lat, coords.lon, false);
}

function startLocation() {
  if (!navigator.geolocation) {
    state.locationError = "這台裝置沒有定位功能";
    renderStatus();
    return;
  }
  if (state.watchId != null) return;
  state.watchId = navigator.geolocation.watchPosition(applyPosition, (error) => {
    if (error.code === 1) state.locationError = "未授權定位，照片仍會寫入時間";
    else if (error.code === 3) state.locationError = "定位逾時，可再拍一張重試";
    else state.locationError = "暫時找不到位置";
    renderStatus();
  }, {
    enableHighAccuracy: true,
    timeout: 12000,
    maximumAge: 15000,
  });
}

function stopStream() {
  if (!state.stream) return;
  for (const track of state.stream.getTracks()) track.stop();
  state.stream = null;
  ui.preview.srcObject = null;
}

function updatePreviewTransform() {
  const zoom = state.zoomMode === "digital" ? state.zoom : 1;
  const x = state.facing === "user" ? -zoom : zoom;
  ui.preview.style.transform = `scale(${x}, ${zoom})`;
}

function readZoomRange() {
  let caps = {};
  try {
    caps = state.stream?.getVideoTracks?.()[0]?.getCapabilities?.() || {};
  } catch {
    caps = {};
  }
  if (Number.isFinite(caps.zoom?.min) && Number.isFinite(caps.zoom?.max) && caps.zoom.max > caps.zoom.min) {
    state.zoomMode = "hardware";
    state.zoomMin = caps.zoom.min;
    state.zoomMax = caps.zoom.max;
    ui.zoom.step = String(caps.zoom.step || 0.1);
  } else {
    state.zoomMode = "digital";
    state.zoomMin = 1;
    state.zoomMax = 4;
    ui.zoom.step = "0.1";
  }
  ui.zoom.min = String(state.zoomMin);
  ui.zoom.max = String(state.zoomMax);
  state.zoom = state.zoomMin;
  ui.zoom.value = String(state.zoom);
  ui.zoomLabel.textContent = `${state.zoom.toFixed(1)}×`;
  updatePreviewTransform();
}

async function applyZoom(value) {
  const zoom = Math.min(state.zoomMax, Math.max(state.zoomMin, value));
  state.zoom = zoom;
  ui.zoom.value = String(zoom);
  ui.zoomLabel.textContent = `${zoom.toFixed(1)}×`;
  if (state.zoomMode === "hardware" && state.stream) {
    try {
      await state.stream.getVideoTracks()[0].applyConstraints({ advanced: [{ zoom }] });
      updatePreviewTransform();
      return;
    } catch {
      state.zoomMode = "digital";
      state.zoomMin = 1;
      state.zoomMax = 4;
      ui.zoom.min = "1";
      ui.zoom.max = "4";
    }
  }
  updatePreviewTransform();
}

function queueZoom(value) {
  state.pendingZoom = value;
  if (state.zoomFrame) return;
  state.zoomFrame = requestAnimationFrame(() => {
    state.zoomFrame = 0;
    applyZoom(state.pendingZoom);
  });
}

function touchDistance(touches) {
  const [a, b] = touches;
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

async function openCamera(facing) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("no-camera");
  }
  const attempts = [
    { video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false },
    { video: { facingMode: facing }, audio: false },
    { video: true, audio: false },
  ];
  let lastError = null;
  for (const constraints of attempts) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stopStream();
      state.stream = stream;
      state.facing = facing;
      ui.preview.srcObject = stream;
      await ui.preview.play();
      ui.shutter.disabled = false;
      readZoomRange();
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("camera");
}

function rollFromEvent(event) {
  const angle = screen.orientation?.angle ?? window.orientation ?? 0;
  if (angle === 90 || angle === -270) return event.beta;
  if (angle === -90 || angle === 270) return event.beta == null ? null : -event.beta;
  if (angle === 180) return event.gamma == null ? null : -event.gamma;
  return event.gamma;
}

function onOrientation(event) {
  const roll = rollFromEvent(event);
  if (!Number.isFinite(roll)) return;
  state.sawOrientation = true;
  const level = Math.abs(roll) < 1.5;
  ui.level.hidden = false;
  ui.levelMark.hidden = false;
  ui.levelReadout.hidden = false;
  ui.level.classList.toggle("is-level", level);
  ui.levelMark.classList.toggle("is-level", level);
  ui.levelReadout.classList.toggle("is-level", level);
  ui.levelLine.style.transform = `rotate(${level ? 0 : -roll}deg)`;
  ui.levelReadout.textContent = level ? "水平" : `${Math.abs(roll).toFixed(0)}°`;
}

async function enableLevel() {
  const Orientation = window.DeviceOrientationEvent;
  if (!Orientation) return;
  if (typeof Orientation.requestPermission === "function") {
    try {
      const result = await Promise.race([
        Orientation.requestPermission(),
        new Promise((resolve) => setTimeout(() => resolve("timeout"), 1200)),
      ]);
      if (result === "denied") return;
    } catch {
      /* 不是 iOS 時，這個請求可能會失敗，仍繼續聽感應器 */
    }
  }
  window.removeEventListener("deviceorientation", onOrientation);
  window.addEventListener("deviceorientation", onOrientation);
  window.addEventListener("deviceorientationabsolute", onOrientation);
}

function coverSource(srcW, srcH, dstW, dstH) {
  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;
  if (srcAspect > dstAspect) {
    const sw = srcH * dstAspect;
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH };
  }
  const sh = srcW / dstAspect;
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh };
}

function makeViewCanvas() {
  const rect = ui.preview.getBoundingClientRect();
  const aspect = rect.width / Math.max(1, rect.height);
  const maxEdge = 2048;
  const canvas = document.createElement("canvas");
  if (aspect >= 1) {
    canvas.width = maxEdge;
    canvas.height = Math.max(1, Math.round(maxEdge / aspect));
  } else {
    canvas.height = maxEdge;
    canvas.width = Math.max(1, Math.round(maxEdge * aspect));
  }
  return canvas;
}

function drawViewfinder(ctx, video, canvasW, canvasH) {
  const zoom = state.zoomMode === "digital" ? Math.max(1, state.zoom) : 1;
  const base = coverSource(video.videoWidth, video.videoHeight, canvasW, canvasH);
  const sw = base.sw / zoom;
  const sh = base.sh / zoom;
  const sx = base.sx + (base.sw - sw) / 2;
  const sy = base.sy + (base.sh - sh) / 2;
  ctx.save();
  if (state.facing === "user") {
    ctx.translate(canvasW, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
  ctx.restore();
}

function fittedSize(width, height) {
  const maxEdge = 2048;
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  const size = fittedSize(width, height);
  canvas.width = size.width;
  canvas.height = size.height;
  return canvas;
}

function drawContain(ctx, source, sourceWidth, sourceHeight, width, height) {
  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
}

function fitFontSize(ctx, text, maxWidth, weight, size, font) {
  let current = size;
  const min = Math.max(12, size * 0.55);
  ctx.font = `${weight} ${current}px ${font}`;
  if (ctx.measureText(text).width <= maxWidth) return current;
  while (current > min) {
    current = Math.max(min, current * 0.94);
    ctx.font = `${weight} ${current}px ${font}`;
    if (ctx.measureText(text).width <= maxWidth || current === min) return current;
  }
  return current;
}

function lineThatFits(ctx, text, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let kept = text;
  while (kept && ctx.measureText(`${kept}…`).width > maxWidth) {
    kept = [...kept].slice(0, -1).join("");
  }
  return kept ? `${kept}…` : "";
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const chars = [...text];
  const lines = [];
  let line = "";
  for (const char of chars) {
    const next = line + char;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = lineThatFits(ctx, kept[maxLines - 1], maxWidth);
  return kept;
}

async function ensureFonts() {
  try {
    await document.fonts.load(`700 48px ${fontFamily()}`);
  } catch {
    /* system font still draws */
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function lineFor(field, info) {
  if (field.id === "time") return { text: info.when, size: 46, weight: 700, color: "#fff8e8", maxLines: 1 };
  if (field.id === "place" && info.place) return { text: info.place, size: 34, weight: 500, color: "#ffffff", maxLines: 2 };
  if (field.id === "coords" && info.coords) return { text: info.coords, size: 28, weight: 500, color: "#f4ecdc", maxLines: 2 };
  if (field.id === "weather" && info.weather) return { text: info.weather, size: 32, weight: 700, color: "#ffe08a", maxLines: 1 };
  return null;
}

function placeCard(anchor, width, height, cardW, cardH, margin) {
  const col = anchor[1];
  const row = anchor[0];
  let x = col === "l" ? margin : col === "r" ? width - cardW - margin : (width - cardW) / 2;
  let y = row === "t" ? margin : row === "b" ? height - cardH - margin : (height - cardH) / 2;
  x = Math.max(8, Math.min(x, width - cardW - 8));
  y = Math.max(8, Math.min(y, height - cardH - 8));
  return { x, y };
}

function drawStamp(canvas, info) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const scale = (Math.min(width, height) / 1080) * settings.textScale;
  const font = fontFamily();
  const groups = new Map();
  const push = (anchor, line) => {
    const key = ANCHORS.includes(anchor) ? anchor : "bl";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(line);
  };

  for (const field of settings.fields) {
    if (!field.enabled) continue;
    const line = lineFor(field, info);
    if (line) push(field.anchor, line);
  }
  if (info.note) {
    const host = settings.fields.find((field) => field.enabled && field.id !== "time") || settings.fields.find((field) => field.enabled);
    push(host?.anchor || "bl", { text: info.note, size: 28, weight: 500, color: "#ffd7cc", maxLines: 2 });
  }

  for (const [anchor, lines] of groups) {
    const prepared = [];
    const maxText = Math.max(140, width - 72 * scale);
    for (const line of lines) {
      let size = line.size * scale;
      if (line.maxLines === 1) {
        size = fitFontSize(ctx, line.text, maxText, line.weight, size, font);
      }
      ctx.font = `${line.weight} ${size}px ${font}`;
      for (const text of wrapText(ctx, line.text, maxText, line.maxLines || 2)) {
        prepared.push({ ...line, text, size });
      }
    }
    if (!prepared.length) continue;
    let textWidth = 0;
    for (const line of prepared) {
      ctx.font = `${line.weight} ${line.size}px ${font}`;
      textWidth = Math.max(textWidth, ctx.measureText(line.text).width);
    }
    const gap = 8 * scale;
    const pad = 16 * scale;
    const bar = 5 * scale;
    const textHeight = prepared.reduce((sum, line) => sum + line.size, 0) + gap * (prepared.length - 1);
    const cardW = Math.min(width - 16, textWidth + pad * 2 + bar + 10 * scale);
    const cardH = textHeight + pad * 2;
    const pos = placeCard(anchor, width, height, cardW, cardH, 28 * scale);
    roundRect(ctx, pos.x, pos.y, cardW, cardH, 14 * scale);
    ctx.fillStyle = "rgba(8, 7, 5, 0.62)";
    ctx.fill();
    ctx.fillStyle = "#e7a322";
    ctx.fillRect(pos.x + pad * 0.55, pos.y + pad * 0.75, bar, Math.max(bar, cardH - pad * 1.5));
    let y = pos.y + pad;
    for (const line of prepared) {
      y += line.size;
      ctx.font = `${line.weight} ${line.size}px ${font}`;
      ctx.fillStyle = line.color;
      ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
      ctx.shadowBlur = 4 * scale;
      ctx.fillText(line.text, pos.x + pad + bar + 8 * scale, y);
      ctx.shadowBlur = 0;
      y += gap;
    }
  }
}

function stampInfo(when) {
  const info = { when: formatWhen(when) };
  if (state.coords) {
    info.coords = formatCoords(state.coords.lat, state.coords.lon);
    if (state.place) info.place = state.place;
    if (state.weather) info.weather = state.weather;
    if (!state.place && !state.weather && (fieldEnabled("place") || fieldEnabled("weather"))) {
      info.note = "地點與天氣暫時查不到";
    }
  } else if (fieldEnabled("coords") || fieldEnabled("place") || fieldEnabled("weather")) {
    info.note = state.locationError || "尚未取得定位";
  }
  return info;
}

function waitForFix(timeoutMs) {
  if (state.coords || state.locationError) return Promise.resolve();
  return new Promise((resolve) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (state.coords || state.locationError || Date.now() - started > timeoutMs) {
        clearInterval(timer);
        resolve();
      }
    }, 200);
  });
}

async function stampCanvas(canvas, when) {
  ui.status.textContent = "寫入時間與地點…";
  await waitForFix(4500);
  if (state.coords && !state.place && !state.weather) {
    await Promise.race([
      refreshContext(state.coords.lat, state.coords.lon, true),
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);
  }
  await ensureFonts();
  drawStamp(canvas, stampInfo(when));
}

function blobFromCanvas(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("blob"));
    }, "image/jpeg", 0.92);
  });
}

function renderMeta(when, source) {
  const rows = [
    ["時間", formatWhen(when)],
    ["來源", source],
    ["座標", state.coords ? formatCoords(state.coords.lat, state.coords.lon) : "沒有"],
    ["地點", state.place || "沒有"],
    ["天氣", state.weather || "沒有"],
  ];
  ui.meta.replaceChildren();
  for (const [label, value] of rows) {
    const row = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = label;
    row.append(name, document.createTextNode(value));
    ui.meta.append(row);
  }
}

async function present(canvas, when, source) {
  state.blob = await blobFromCanvas(canvas);
  state.filename = filenameFor(when);
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state.objectUrl = URL.createObjectURL(state.blob);
  ui.shot.src = state.objectUrl;
  renderMeta(when, source);
  show("result");
}

function playShutter() {
  if (!settings.shutterSound) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;
  const audio = state.audio || (state.audio = new AudioCtx());
  audio.resume?.();
  const now = audio.currentTime;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(1400, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.09);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.18, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  osc.connect(gain).connect(audio.destination);
  osc.start(now);
  osc.stop(now + 0.13);
}

async function captureVideo() {
  if (state.busy) return;
  const width = ui.preview.videoWidth;
  const height = ui.preview.videoHeight;
  if (!width || !height) {
    showToast("相機畫面還沒準備好");
    return;
  }
  state.busy = true;
  ui.shutter.disabled = true;
  playShutter();
  const when = new Date();
  try {
    const canvas = makeViewCanvas();
    drawViewfinder(canvas.getContext("2d"), ui.preview, canvas.width, canvas.height);
    await stampCanvas(canvas, when);
    await present(canvas, when, "相機");
  } catch {
    showToast("這張沒寫成功，請再拍一次");
    ui.shutter.disabled = !state.stream;
  } finally {
    state.busy = false;
  }
}

async function captureBitmap(bitmap, source) {
  if (state.busy) return;
  state.busy = true;
  const when = new Date();
  try {
    const canvas = makeCanvas(bitmap.width, bitmap.height);
    drawContain(canvas.getContext("2d"), bitmap, bitmap.width, bitmap.height, canvas.width, canvas.height);
    bitmap.close?.();
    await stampCanvas(canvas, when);
    await present(canvas, when, source);
  } catch {
    showToast("這張照片沒寫成功");
  } finally {
    state.busy = false;
    ui.shutter.disabled = !state.stream;
  }
}

function downloadBlob() {
  if (!state.blob) return;
  const link = document.createElement("a");
  link.href = state.objectUrl;
  link.download = state.filename;
  link.click();
}

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.maxTouchPoints > 1 && /Macintosh/i.test(navigator.userAgent));
}

async function saveToAlbum() {
  if (!state.blob) return;
  const file = new File([state.blob], state.filename, { type: "image/jpeg" });
  if (isMobile() && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "時間相機" });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  downloadBlob();
}

async function shareBlob() {
  if (!state.blob) return;
  const file = new File([state.blob], state.filename, { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: "時間相機" });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  downloadBlob();
}

async function onStart() {
  if (!window.isSecureContext) {
    ui.gateNote.textContent = "請用 http://127.0.0.1 開啟，直接點開檔案時瀏覽器不會給相機和定位。";
    return;
  }
  show("camera");
  applyGrid();
  tickClock();
  clearInterval(state.clockTimer);
  state.clockTimer = setInterval(tickClock, 250);
  startLocation();
  await enableLevel();
  renderStatus();
  try {
    await openCamera(state.facing);
  } catch {
    ui.shutter.disabled = true;
    showToast("無法開啟相機。可以改按「相簿」選一張照片，仍會寫入時間與定位。");
  }
}

function openSettings() {
  syncSettingsForm();
  ui.settings.hidden = false;
}

function closeSettings() {
  ui.settings.hidden = true;
}

ui.start.addEventListener("click", onStart);
ui.shutter.addEventListener("click", captureVideo);
ui.pick.addEventListener("click", () => ui.file.click());
ui.flip.addEventListener("click", async () => {
  const next = state.facing === "environment" ? "user" : "environment";
  try {
    await openCamera(next);
  } catch {
    showToast("無法切換鏡頭");
    if (!state.stream) ui.shutter.disabled = true;
  }
});
ui.openSettings.addEventListener("click", openSettings);
ui.settingsClose.addEventListener("click", closeSettings);

ui.font.addEventListener("change", () => {
  settings.font = FONTS[ui.font.value] ? ui.font.value : "sans";
  saveSettings();
  updateSample();
});

ui.textScale.addEventListener("input", () => {
  settings.textScale = Number(ui.textScale.value);
  ui.textScaleLabel.textContent = `${Math.round(settings.textScale * 100)}%`;
  saveSettings();
  updateSample();
});

ui.gridToggle.addEventListener("click", () => {
  settings.grid = !settings.grid;
  setSwitch(ui.gridToggle, settings.grid);
  saveSettings();
  applyGrid();
});

ui.weatherSource.addEventListener("change", () => {
  settings.weatherSource = ui.weatherSource.value === "wttr" ? "wttr" : "open-meteo";
  saveSettings();
  if (state.coords) refreshContext(state.coords.lat, state.coords.lon, true);
});

function setHour12(hour12) {
  settings.hour12 = hour12;
  ui.hour24.classList.toggle("is-on", !hour12);
  ui.hour12.classList.toggle("is-on", hour12);
  ui.hour24.setAttribute("aria-pressed", String(!hour12));
  ui.hour12.setAttribute("aria-pressed", String(hour12));
  saveSettings();
  tickClock();
  updateSample();
}

ui.hour24.addEventListener("click", () => setHour12(false));
ui.hour12.addEventListener("click", () => setHour12(true));

ui.soundToggle.addEventListener("click", () => {
  settings.shutterSound = !settings.shutterSound;
  setSwitch(ui.soundToggle, settings.shutterSound);
  saveSettings();
  if (settings.shutterSound) playShutter();
});

ui.fieldList.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const id = button.closest("[data-id]")?.dataset.id;
  if (!id) return;
  if (button.dataset.dir) moveField(id, Number(button.dataset.dir));
  if (button.dataset.anchor) {
    const field = settings.fields.find((item) => item.id === id);
    field.anchor = button.dataset.anchor;
    saveSettings();
    renderFields();
  }
});

ui.fieldList.addEventListener("change", (event) => {
  const input = event.target;
  if (input.type !== "checkbox") return;
  const id = input.closest("[data-id]")?.dataset.id;
  const field = settings.fields.find((item) => item.id === id);
  if (!field) return;
  field.enabled = input.checked;
  saveSettings();
  renderStatus();
});

ui.zoom.addEventListener("input", () => applyZoom(Number(ui.zoom.value)));

ui.camera.addEventListener("touchstart", (event) => {
  if (event.touches.length === 2) {
    state.pinch = { dist: touchDistance(event.touches), zoom: state.zoom };
  }
}, { passive: true });

ui.camera.addEventListener("touchmove", (event) => {
  if (!state.pinch || event.touches.length !== 2) return;
  event.preventDefault();
  const dist = touchDistance(event.touches);
  queueZoom(state.pinch.zoom * (dist / state.pinch.dist));
}, { passive: false });

ui.camera.addEventListener("touchend", (event) => {
  if (event.touches.length < 2) state.pinch = null;
});

ui.camera.addEventListener("wheel", (event) => {
  if (ui.camera.hidden || !ui.settings.hidden) return;
  event.preventDefault();
  queueZoom(state.zoom + (event.deltaY < 0 ? 0.1 : -0.1));
}, { passive: false });

ui.file.addEventListener("change", async () => {
  const file = ui.file.files?.[0];
  ui.file.value = "";
  if (!file) return;
  if (!ui.camera.hidden) startLocation();
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    await captureBitmap(bitmap, "相簿");
  } catch {
    showToast("這張圖片讀取失敗");
  }
});

ui.retake.addEventListener("click", async () => {
  show("camera");
  if (state.stream) {
    ui.shutter.disabled = false;
    renderStatus();
    return;
  }
  await onStart();
});

ui.save.addEventListener("click", saveToAlbum);
ui.share.addEventListener("click", shareBlob);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !ui.settings.hidden) {
    closeSettings();
    return;
  }
  if (event.code === "Space" && !ui.camera.hidden && ui.settings.hidden) {
    event.preventDefault();
    captureVideo();
  }
});

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstall = event;
  ui.install.hidden = false;
});

ui.install.addEventListener("click", async () => {
  if (!deferredInstall) return;
  deferredInstall.prompt();
  await deferredInstall.userChoice;
  deferredInstall = null;
  ui.install.hidden = true;
});

if (!window.isSecureContext) {
  ui.gateNote.textContent = "請用本機網址開啟（例如 http://127.0.0.1:8765/）。直接點開檔案時，瀏覽器不會給相機和定位。";
}

if ("serviceWorker" in navigator && window.isSecureContext) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

applyGrid();
renderStatus();
tickClock();
