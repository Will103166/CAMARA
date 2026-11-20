const FONTS = {
  sans: '"Noto Sans TC", "Microsoft JhengHei", sans-serif',
  serif: '"Noto Serif TC", "PMingLiU", serif',
  system: '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC", sans-serif',
};

const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const WEEKSHORT = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];
const FIELD_IDS = ["time", "place", "coords", "weather"];
const FIELD_LABEL = { time: "時間", place: "地點", coords: "坐標", weather: "天氣" };
const COORD_SYSTEMS = ["wgs84", "twd97-121", "twd97-119"];
const WEEK_MODES = ["off", "week", "zhou"];
const LOG_HEADERS = ["時間", "地點", "坐標", "天氣", "方位角", "照片名稱", "超連結"];
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
  gateLog: $("gate-log"),
  openLog: $("open-log"),
  settingsLog: $("settings-log"),
  coordSystem: $("coord-system"),
  eraAd: $("era-ad"),
  eraRoc: $("era-roc"),
  weekOff: $("week-off"),
  weekFull: $("week-full"),
  weekShort: $("week-short"),
  hourToggle: $("hour-toggle"),
  minuteToggle: $("minute-toggle"),
  secondToggle: $("second-toggle"),
  log: $("log"),
  logClose: $("log-close"),
  logToday: $("log-today"),
  logCopy: $("log-copy"),
  logExport: $("log-export"),
  logNote: $("log-note"),
  logCopybox: $("log-copybox"),
  logPreview: $("log-preview"),
  logPhoto: $("log-photo"),
  logDownload: $("log-download"),
  logBody: $("log-body"),
  logEmpty: $("log-empty"),
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
  hwZoom: 1,
  hwTimer: 0,
  hwBusy: false,
  hwPending: false,
  pinch: null,
  audio: null,
  sawOrientation: false,
  orientFrame: 0,
  pendingRoll: null,
  levelText: "",
  levelShown: null,
  heading: null,
  logTodayOnly: true,
  logRows: [],
  logObjectUrl: "",
  capturedHeading: null,
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
  const parts = [];
  if (settings.showHour) {
    let hours = date.getHours();
    if (settings.hour12) {
      const suffix = hours < 12 ? "上午" : "下午";
      hours = hours % 12 || 12;
      parts.push(`${suffix} ${hours}`);
    } else {
      parts.push(pad(hours));
    }
  }
  if (settings.showMinute) parts.push(pad(date.getMinutes()));
  if (settings.showSecond) parts.push(pad(date.getSeconds()));
  if (!parts.length) return "";
  if (!settings.showHour && settings.showMinute && !settings.showSecond) return `${parts[0]}分`;
  if (!settings.showHour && !settings.showMinute && settings.showSecond) return `${parts[0]}秒`;
  if (settings.showHour && !settings.hour12 && !settings.showMinute && !settings.showSecond) return `${parts[0]}時`;
  if (settings.showHour && settings.hour12) {
    const [first, ...rest] = parts;
    return rest.length ? `${first}:${rest.join(":")}` : first;
  }
  return parts.join(":");
}

function formatWhen(date) {
  const year = settings.era === "roc" ? date.getFullYear() - 1911 : date.getFullYear();
  const yearText = settings.era === "roc" ? `民國${year}` : String(year);
  const parts = [`${yearText}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`];
  if (settings.weekMode === "week") parts.push(WEEKDAYS[date.getDay()]);
  if (settings.weekMode === "zhou") parts.push(WEEKSHORT[date.getDay()]);
  const clock = formatClock(date);
  if (clock) parts.push(clock);
  return parts.join("  ");
}

function toTwd97(latDeg, lonDeg, lon0Deg) {
  const a = 6378.137;
  const f = 1 / 298.257222101;
  const k0 = 0.9999;
  const n = f / (2 - f);
  const rectifying = (a / (1 + n)) * (1 + (n ** 2) / 4 + (n ** 4) / 64);
  const alpha1 = n / 2 - (2 * n ** 2) / 3 + (5 * n ** 3) / 16;
  const alpha2 = (13 * n ** 2) / 48 - (3 * n ** 3) / 5;
  const alpha3 = (61 * n ** 3) / 240;
  const lat = (latDeg * Math.PI) / 180;
  const lon = ((lonDeg - lon0Deg) * Math.PI) / 180;
  const rootN = Math.sqrt(n);
  const t = Math.sinh(
    Math.atanh(Math.sin(lat)) - ((2 * rootN) / (1 + n)) * Math.atanh(((2 * rootN) / (1 + n)) * Math.sin(lat))
  );
  const xi = Math.atan(t / Math.cos(lon));
  const eta = Math.atan(Math.sin(lon) / Math.sqrt(1 + t * t));
  const east = 250 + k0 * rectifying * (
    eta
    + alpha1 * Math.cos(2 * xi) * Math.sinh(2 * eta)
    + alpha2 * Math.cos(4 * xi) * Math.sinh(4 * eta)
    + alpha3 * Math.cos(6 * xi) * Math.sinh(6 * eta)
  );
  const north = k0 * rectifying * (
    xi
    + alpha1 * Math.sin(2 * xi) * Math.cosh(2 * eta)
    + alpha2 * Math.sin(4 * xi) * Math.cosh(4 * eta)
    + alpha3 * Math.sin(6 * xi) * Math.cosh(6 * eta)
  );
  return { east: east * 1000, north: north * 1000 };
}

function formatCoords(lat, lon) {
  if (settings.coordSystem === "twd97-121" || settings.coordSystem === "twd97-119") {
    const zone = settings.coordSystem === "twd97-119" ? 119 : 121;
    const { east, north } = toTwd97(lat, lon, zone);
    return `TWD97／${zone}  E${east.toFixed(2)}  N${north.toFixed(2)}`;
  }
  const latHem = lat >= 0 ? "N" : "S";
  const lonHem = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(6)}°${latHem}  ${Math.abs(lon).toFixed(6)}°${lonHem}`;
}

function formatHeading(value) {
  if (!Number.isFinite(value)) return "";
  const deg = ((value % 360) + 360) % 360;
  return `${Math.round(deg)}°`;
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
    era: "ad",
    weekMode: "week",
    showHour: true,
    showMinute: true,
    showSecond: true,
    coordSystem: "wgs84",
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
      era: saved.era === "roc" ? "roc" : "ad",
      weekMode: WEEK_MODES.includes(saved.weekMode) ? saved.weekMode : "week",
      showHour: saved.showHour !== false,
      showMinute: saved.showMinute !== false,
      showSecond: saved.showSecond !== false,
      coordSystem: COORD_SYSTEMS.includes(saved.coordSystem) ? saved.coordSystem : "wgs84",
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
  ui.hudClock.textContent = formatWhen(new Date());
}

function ensureClock() {
  clearInterval(state.clockTimer);
  state.clockTimer = 0;
  tickClock();
  if (ui.camera.hidden) return;
  state.clockTimer = setInterval(tickClock, settings.showSecond ? 250 : 1000);
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
  ui.eraAd.classList.toggle("is-on", settings.era !== "roc");
  ui.eraRoc.classList.toggle("is-on", settings.era === "roc");
  ui.eraAd.setAttribute("aria-pressed", String(settings.era !== "roc"));
  ui.eraRoc.setAttribute("aria-pressed", String(settings.era === "roc"));
  ui.weekOff.classList.toggle("is-on", settings.weekMode === "off");
  ui.weekFull.classList.toggle("is-on", settings.weekMode === "week");
  ui.weekShort.classList.toggle("is-on", settings.weekMode === "zhou");
  ui.weekOff.setAttribute("aria-pressed", String(settings.weekMode === "off"));
  ui.weekFull.setAttribute("aria-pressed", String(settings.weekMode === "week"));
  ui.weekShort.setAttribute("aria-pressed", String(settings.weekMode === "zhou"));
  setSwitch(ui.hourToggle, settings.showHour);
  setSwitch(ui.minuteToggle, settings.showMinute);
  setSwitch(ui.secondToggle, settings.showSecond);
  ui.coordSystem.value = settings.coordSystem;
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
  let zoom = state.zoom;
  if (state.zoomMode === "hardware") {
    const base = state.hwZoom > 0 ? state.hwZoom : 1;
    zoom = state.zoom / base;
  }
  const x = state.facing === "user" ? -zoom : zoom;
  ui.preview.style.transform = `translate3d(0,0,0) scale(${x}, ${zoom})`;
}

function useDigitalZoom(min, max) {
  state.zoomMode = "digital";
  state.zoomMin = min;
  state.zoomMax = max;
  state.hwZoom = 1;
  state.zoom = Math.min(max, Math.max(min, state.zoom || min));
  ui.zoom.min = String(min);
  ui.zoom.max = String(max);
  ui.zoom.step = "0.1";
  ui.zoom.value = String(state.zoom);
  ui.zoomLabel.textContent = `${state.zoom.toFixed(1)}×`;
  updatePreviewTransform();
}

function readZoomRange() {
  let caps = {};
  try {
    caps = state.stream?.getVideoTracks?.()[0]?.getCapabilities?.() || {};
  } catch {
    caps = {};
  }
  const hardwareOk = !/Windows/i.test(navigator.userAgent)
    && Number.isFinite(caps.zoom?.min)
    && Number.isFinite(caps.zoom?.max)
    && caps.zoom.max > caps.zoom.min + 0.05;
  if (!hardwareOk) {
    useDigitalZoom(1, 4);
    return;
  }
  state.zoomMode = "hardware";
  state.zoomMin = caps.zoom.min;
  state.zoomMax = caps.zoom.max;
  state.hwZoom = Number.isFinite(caps.zoom.min) ? caps.zoom.min : 1;
  state.zoom = state.zoomMin;
  ui.zoom.min = String(state.zoomMin);
  ui.zoom.max = String(state.zoomMax);
  ui.zoom.step = String(Math.min(Math.max(caps.zoom.step || 0.1, 0.05), 0.2));
  ui.zoom.value = String(state.zoom);
  ui.zoomLabel.textContent = `${state.zoom.toFixed(1)}×`;
  updatePreviewTransform();
}

function setZoom(value, fromSlider) {
  const zoom = Math.min(state.zoomMax, Math.max(state.zoomMin, value));
  state.zoom = zoom;
  if (!fromSlider) ui.zoom.value = String(zoom);
  const label = `${zoom.toFixed(1)}×`;
  if (ui.zoomLabel.textContent !== label) ui.zoomLabel.textContent = label;
  updatePreviewTransform();
  if (state.zoomMode !== "hardware") return;
  clearTimeout(state.hwTimer);
  state.hwTimer = setTimeout(() => {
    state.hwTimer = 0;
    commitHardwareZoom();
  }, 280);
}

async function commitHardwareZoom() {
  if (state.zoomMode !== "hardware" || !state.stream) return;
  if (state.hwBusy) {
    state.hwPending = true;
    return;
  }
  const zoom = state.zoom;
  if (Math.abs(zoom - state.hwZoom) < 0.03) {
    updatePreviewTransform();
    return;
  }
  state.hwBusy = true;
  try {
    await state.stream.getVideoTracks()[0].applyConstraints({ advanced: [{ zoom }] });
    state.hwZoom = zoom;
  } catch {
    useDigitalZoom(1, 4);
  } finally {
    state.hwBusy = false;
    updatePreviewTransform();
    if (state.hwPending) {
      state.hwPending = false;
      commitHardwareZoom();
    }
  }
}

function queueZoom(value, fromSlider) {
  state.pendingZoom = value;
  state.pendingFromSlider = Boolean(fromSlider);
  if (state.zoomFrame) return;
  state.zoomFrame = requestAnimationFrame(() => {
    state.zoomFrame = 0;
    setZoom(state.pendingZoom, state.pendingFromSlider);
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

function headingFromEvent(event) {
  if (Number.isFinite(event.webkitCompassHeading)) return event.webkitCompassHeading;
  if (event.absolute !== true && event.type !== "deviceorientationabsolute") return null;
  if (!Number.isFinite(event.alpha) || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return null;
  const rad = Math.PI / 180;
  const cX = Math.cos(event.beta * rad);
  const cY = Math.cos(event.gamma * rad);
  const cZ = Math.cos(event.alpha * rad);
  const sX = Math.sin(event.beta * rad);
  const sY = Math.sin(event.gamma * rad);
  const sZ = Math.sin(event.alpha * rad);
  const vx = -cZ * sY - sZ * sX * cY;
  const vy = -sZ * sY + cZ * sX * cY;
  let heading = Math.atan2(vx, vy) * (180 / Math.PI);
  if (heading < 0) heading += 360;
  return heading;
}

function paintLevel() {
  state.orientFrame = 0;
  const roll = state.pendingRoll;
  if (!Number.isFinite(roll) || ui.camera.hidden) return;
  const level = Math.abs(roll) < 1.5;
  const text = level ? "水平" : `${Math.abs(roll).toFixed(0)}°`;
  const shown = level ? 0 : -roll;
  if (ui.level.hidden) {
    ui.level.hidden = false;
    ui.levelMark.hidden = false;
    ui.levelReadout.hidden = false;
  }
  if (ui.level.classList.contains("is-level") !== level) {
    ui.level.classList.toggle("is-level", level);
    ui.levelMark.classList.toggle("is-level", level);
    ui.levelReadout.classList.toggle("is-level", level);
  }
  if (state.levelText !== text) {
    state.levelText = text;
    ui.levelReadout.textContent = text;
  }
  if (state.levelShown == null || Math.abs(state.levelShown - shown) > 0.35) {
    state.levelShown = shown;
    ui.levelLine.style.transform = `rotate(${shown}deg)`;
  }
}

function onOrientation(event) {
  const roll = rollFromEvent(event);
  if (Number.isFinite(roll)) {
    state.sawOrientation = true;
    state.pendingRoll = roll;
    if (!state.orientFrame) state.orientFrame = requestAnimationFrame(paintLevel);
  }
  const heading = headingFromEvent(event);
  if (Number.isFinite(heading)) state.heading = heading;
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
  const zoom = state.zoomMode === "hardware"
    ? Math.max(1, state.zoom / (state.hwZoom > 0 ? state.hwZoom : 1))
    : Math.max(1, state.zoom);
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
    ["坐標", state.coords ? formatCoords(state.coords.lat, state.coords.lon) : "沒有"],
    ["地點", state.place || "沒有"],
    ["天氣", state.weather || "沒有"],
    ["方位角", formatHeading(state.capturedHeading) || "沒有"],
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
  saveRecord(when, source).catch(() => showToast("這張沒有寫進拍攝紀錄"));
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
  state.capturedHeading = state.heading;
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
  state.capturedHeading = state.heading;
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
  ensureClock();
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
  applyTimeChange();
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

ui.zoom.addEventListener("input", () => queueZoom(Number(ui.zoom.value), true));

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
  if (event.key === "Escape" && !ui.log.hidden) {
    closeLog();
    return;
  }
  if (event.key === "Escape" && !ui.settings.hidden) {
    closeSettings();
    return;
  }
  if (event.code === "Space" && !ui.camera.hidden && ui.settings.hidden && ui.log.hidden) {
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

let logFromSettings = false;
let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open("timecam-log", 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains("shots")) {
        database.createObjectStore("shots", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

function idbPut(record) {
  return openDb().then((database) => new Promise((resolve, reject) => {
    const tx = database.transaction("shots", "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore("shots").put(record);
  }));
}

function idbAll() {
  return openDb().then((database) => new Promise((resolve, reject) => {
    const request = database.transaction("shots", "readonly").objectStore("shots").getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  }));
}

function idbGet(id) {
  return openDb().then((database) => new Promise((resolve, reject) => {
    const request = database.transaction("shots", "readonly").objectStore("shots").get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  }));
}

function idbDelete(id) {
  return openDb().then((database) => new Promise((resolve, reject) => {
    const tx = database.transaction("shots", "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore("shots").delete(id);
  }));
}

async function saveRecord(when, source) {
  if (!state.blob) return;
  const id = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  await idbPut({
    id,
    takenAt: when.toISOString(),
    place: state.place || "",
    lat: Number.isFinite(state.coords?.lat) ? state.coords.lat : null,
    lon: Number.isFinite(state.coords?.lon) ? state.coords.lon : null,
    weather: state.weather || "",
    heading: Number.isFinite(state.capturedHeading) ? state.capturedHeading : null,
    filename: state.filename,
    source,
    blob: state.blob,
  });
}

function sameLocalDay(iso, now = new Date()) {
  const date = new Date(iso);
  return date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate();
}

function recordLink(id) {
  const url = new URL(location.href);
  url.hash = `record=${encodeURIComponent(id)}`;
  return url.href;
}

function recordIdFromHash() {
  const match = location.hash.match(/^#record=(.+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function rowValues(record) {
  const when = new Date(record.takenAt);
  const coords = Number.isFinite(record.lat) && Number.isFinite(record.lon)
    ? formatCoords(record.lat, record.lon)
    : "";
  return [
    Number.isNaN(when.getTime()) ? "—" : formatWhen(when),
    record.place || "—",
    coords || "—",
    record.weather || "—",
    formatHeading(record.heading) || "—",
    record.filename || "—",
    recordLink(record.id),
  ];
}

function visibleRecords(records) {
  const list = records
    .filter((record) => record?.takenAt)
    .sort((a, b) => String(b.takenAt).localeCompare(String(a.takenAt)));
  return state.logTodayOnly ? list.filter((record) => sameLocalDay(record.takenAt)) : list;
}

function setLogNote(message) {
  ui.logNote.textContent = message;
}

async function renderLog() {
  ui.logCopybox.hidden = true;
  let records = [];
  try {
    records = visibleRecords(await idbAll());
  } catch {
    state.logRows = [];
    ui.logBody.replaceChildren();
    ui.logEmpty.hidden = false;
    ui.logEmpty.textContent = "紀錄讀取失敗。";
    setLogNote("這台瀏覽器沒有打開本機紀錄。");
    return;
  }
  state.logRows = records;
  ui.logBody.replaceChildren();
  ui.logEmpty.hidden = records.length > 0;
  ui.logEmpty.textContent = state.logTodayOnly ? "今天還沒有拍攝紀錄。" : "還沒有拍攝紀錄。";
  setLogNote(state.logTodayOnly
    ? `今天 ${records.length} 張。時間、地點、坐標、天氣和方位角可複製或匯出。`
    : `全部 ${records.length} 張。`);
  for (const record of records) {
    const tr = document.createElement("tr");
    const values = rowValues(record);
    values.forEach((value, index) => {
      const td = document.createElement("td");
      if (index === values.length - 1) {
        const link = document.createElement("a");
        link.href = value;
        link.textContent = "開啟";
        const del = document.createElement("button");
        del.type = "button";
        del.className = "linkish";
        del.dataset.delete = record.id;
        del.textContent = "刪除";
        td.append(link, del);
      } else {
        td.textContent = value;
      }
      tr.append(td);
    });
    ui.logBody.append(tr);
  }
}

function openLog() {
  logFromSettings = !ui.settings.hidden;
  ui.settings.hidden = true;
  ui.log.hidden = false;
  setSwitch(ui.logToday, state.logTodayOnly);
  return renderLog();
}

function closeLog() {
  ui.log.hidden = true;
  ui.logPreview.hidden = true;
  if (state.logObjectUrl) {
    URL.revokeObjectURL(state.logObjectUrl);
    state.logObjectUrl = "";
  }
  if (logFromSettings) {
    logFromSettings = false;
    ui.settings.hidden = false;
  }
}

async function showRecord(id) {
  if (!id) return;
  let record = null;
  try {
    record = await idbGet(id);
  } catch {
    record = null;
  }
  if (!record?.blob) {
    if (ui.log.hidden) await openLog();
    setLogNote("找不到這張照片，可能已刪除。");
    return;
  }
  if (ui.log.hidden) openLog();
  if (state.logObjectUrl) URL.revokeObjectURL(state.logObjectUrl);
  state.logObjectUrl = URL.createObjectURL(record.blob);
  ui.logPhoto.src = state.logObjectUrl;
  ui.logDownload.href = state.logObjectUrl;
  ui.logDownload.download = record.filename || "photo.jpg";
  ui.logPreview.hidden = false;
}

function tableText(records) {
  const lines = [LOG_HEADERS.join("\t")];
  for (const record of records) lines.push(rowValues(record).join("\t"));
  return lines.join("\n");
}

function csvCell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, "\"\"")}"`;
  return text;
}

function csvText(records) {
  const lines = [LOG_HEADERS.map(csvCell).join(",")];
  for (const record of records) lines.push(rowValues(record).map(csvCell).join(","));
  return `\uFEFF${lines.join("\r\n")}`;
}

function selectCopybox() {
  const range = document.createRange();
  range.selectNodeContents(ui.logCopybox);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

async function copyLog() {
  const text = tableText(state.logRows);
  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.focus();
    area.select();
    try {
      copied = document.execCommand("copy");
    } catch {
      copied = false;
    }
    area.remove();
  }
  if (copied) {
    ui.logCopybox.hidden = true;
    setLogNote(`已複製 ${state.logRows.length} 列，可直接貼到試算表。`);
    return;
  }
  ui.logCopybox.hidden = false;
  ui.logCopybox.textContent = text;
  selectCopybox();
  setLogNote("瀏覽器沒有允許自動複製，下面這段已選取，可再複製一次。");
}

function exportLog() {
  const blob = new Blob([csvText(state.logRows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const now = new Date();
  const link = document.createElement("a");
  link.href = url;
  link.download = `時間相機紀錄_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
  setLogNote(`已匯出 ${state.logRows.length} 列。`);
}

function applyTimeChange() {
  syncSettingsForm();
  saveSettings();
  ensureClock();
  renderStatus();
  if (!ui.log.hidden) renderLog();
}

ui.coordSystem.addEventListener("change", () => {
  settings.coordSystem = COORD_SYSTEMS.includes(ui.coordSystem.value) ? ui.coordSystem.value : "wgs84";
  applyTimeChange();
});

ui.eraAd.addEventListener("click", () => {
  settings.era = "ad";
  applyTimeChange();
});

ui.eraRoc.addEventListener("click", () => {
  settings.era = "roc";
  applyTimeChange();
});

ui.weekOff.addEventListener("click", () => {
  settings.weekMode = "off";
  applyTimeChange();
});

ui.weekFull.addEventListener("click", () => {
  settings.weekMode = "week";
  applyTimeChange();
});

ui.weekShort.addEventListener("click", () => {
  settings.weekMode = "zhou";
  applyTimeChange();
});

ui.hourToggle.addEventListener("click", () => {
  settings.showHour = !settings.showHour;
  applyTimeChange();
});

ui.minuteToggle.addEventListener("click", () => {
  settings.showMinute = !settings.showMinute;
  applyTimeChange();
});

ui.secondToggle.addEventListener("click", () => {
  settings.showSecond = !settings.showSecond;
  applyTimeChange();
});

ui.gateLog.addEventListener("click", openLog);
ui.openLog.addEventListener("click", openLog);
ui.settingsLog.addEventListener("click", openLog);
ui.logClose.addEventListener("click", closeLog);
ui.logToday.addEventListener("click", () => {
  state.logTodayOnly = !state.logTodayOnly;
  setSwitch(ui.logToday, state.logTodayOnly);
  renderLog();
});
ui.logCopy.addEventListener("click", copyLog);
ui.logExport.addEventListener("click", exportLog);
ui.logBody.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  const id = button.dataset.delete;
  try {
    await idbDelete(id);
    if (recordIdFromHash() === id) history.replaceState(null, "", `${location.pathname}${location.search}`);
    ui.logPreview.hidden = true;
    await renderLog();
  } catch {
    setLogNote("這筆沒有刪掉。");
  }
});

window.addEventListener("hashchange", () => {
  const id = recordIdFromHash();
  if (id) showRecord(id);
});

applyGrid();
renderStatus();
tickClock();

const initialRecord = recordIdFromHash();
if (initialRecord) showRecord(initialRecord);
