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
const LOG_HEADERS = ["時間", "地點", "坐標", "天氣", "方位角", "相機", "照片名稱", "地圖", "超連結"];
const SPHERE_LABEL = { front: "前", right: "右", back: "後", left: "左", up: "天頂", down: "地面", x: "補拍" };
const DEG = Math.PI / 180;
const SPHERE_ROWS = [
  { pitch: 0, count: 9, name: "水平" },
  { pitch: 45, count: 6, name: "抬頭45°" },
  { pitch: -45, count: 6, name: "低頭45°" },
];

function buildSphereTargets() {
  const list = [];
  const ring = (index) => {
    const row = SPHERE_ROWS[index];
    for (let i = 0; i < row.count; i += 1) {
      const az = Math.round((360 / row.count) * i);
      list.push({ id: `r${index}-${i}`, az, pitch: row.pitch, label: `${row.name} 轉${az}°` });
    }
  };
  ring(0);
  ring(1);
  list.push({ id: "up", az: 0, pitch: 90, label: "天頂（朝天空）" });
  ring(2);
  list.push({ id: "down", az: 0, pitch: -90, label: "地面（朝腳下）" });
  return list;
}

const SPHERE_TARGETS = buildSphereTargets();
const ANCHORS = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
const STORAGE_KEY = "timecam-settings-v1";
const DEFAULT_GOOGLE_CLIENT_ID = "96826332482-p3r4ico20m3ki9bttp7ff0rt2qk0317f.apps.googleusercontent.com";
const GOOGLE_EMAIL_KEY = "timecam-google-email";
const DELETED_KEY = "timecam-deleted-v1";
const DRIVE_INDEX = "timecam-index.json";

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
  logMap: $("log-map"),
  resultHint: $("result-hint"),
  sphereToggle: $("sphere-toggle"),
  sphere: $("sphere"),
  sphereHint: $("sphere-hint"),
  sphereCount: $("sphere-count"),
  sphereProgress: $("sphere-progress"),
  sphereFinish: $("sphere-finish"),
  sphereCanvas: $("sphere-canvas"),
  sphereRing: $("sphere-ring"),
  flash: $("flash"),
  cameraFov: $("camera-fov"),
  cameraFovLabel: $("camera-fov-label"),
  mapPano: $("map-pano"),
  mapScreen: $("map-screen"),
  mapClose: $("map-close"),
  mapNote: $("map-note"),
  leaflet: $("leaflet"),
  mapPhotos: $("map-photos"),
  googleStatus: $("google-status"),
  googleClient: $("google-client"),
  googleBind: $("google-bind"),
  googleSync: $("google-sync"),
  googleUnbind: $("google-unbind"),
  googleOrigin: $("google-origin"),
  googleGate: $("google-gate"),
  logSync: $("log-sync"),
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
  pitch: null,
  logTodayOnly: true,
  logRows: [],
  logObjectUrl: "",
  capturedHeading: null,
  capturedPitch: null,
  capturedCamera: null,
  capturedDirection: "",
  capturedExtra: null,
  rot: null,
  yawFix: 0,
  yawKnown: false,
  sawAbsolute: false,
  sphere: null,
  sphereText: "",
  leafletMap: null,
  mapUrls: [],
};

let deferredInstall = null;
let settings = loadSettings();
const googleAuth = {
  token: "",
  expiresAt: 0,
  email: localStorage.getItem("timecam-google-email") || "",
  syncing: false,
};

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
    googleClientId: DEFAULT_GOOGLE_CLIENT_ID,
    cameraFov: 66,
    fields: DEFAULT_FIELDS.map((field) => ({ ...field })),
  };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const font = FONTS[saved.font] ? saved.font : base.font;
    const textScale = Number(saved.textScale);
    const weatherSource = saved.weatherSource === "wttr" ? "wttr" : "open-meteo";
    const googleClientId = typeof saved.googleClientId === "string" ? saved.googleClientId.trim().slice(0, 200) : "";
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
      googleClientId: googleClientId || DEFAULT_GOOGLE_CLIENT_ID,
      cameraFov: Number.isFinite(Number(saved.cameraFov)) ? Math.min(95, Math.max(45, Number(saved.cameraFov))) : 66,
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
  ui.googleClient.value = settings.googleClientId;
  ui.cameraFov.value = String(settings.cameraFov);
  ui.cameraFovLabel.textContent = `${Math.round(settings.cameraFov)}°`;
  renderGoogleStatus();
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
    altitude: position.coords.altitude,
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

function pitchFromEvent(event) {
  if (!Number.isFinite(event.beta)) return null;
  const angle = Number(screen.orientation?.angle ?? window.orientation ?? 0) || 0;
  let pitch;
  if (angle === 90 || angle === -270) {
    if (!Number.isFinite(event.gamma)) return null;
    pitch = event.gamma;
  } else if (angle === -90 || angle === 270) {
    if (!Number.isFinite(event.gamma)) return null;
    pitch = -event.gamma;
  } else if (angle === 180) {
    pitch = -(event.beta + 90);
  } else {
    pitch = event.beta - 90;
  }
  if (state.facing === "user") pitch = -pitch;
  return Math.max(-90, Math.min(90, pitch));
}

function paintLevel() {
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

function paintOrientation() {
  state.orientFrame = 0;
  if (Number.isFinite(state.pendingRoll)) paintLevel();
  if (state.sphere && !ui.camera.hidden) renderSphere();
}

function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross3(a, b) {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function neg3(a) {
  return [-a[0], -a[1], -a[2]];
}

function dirVector(azDeg, pitchDeg) {
  const az = azDeg * DEG;
  const pitch = pitchDeg * DEG;
  return [Math.sin(az) * Math.cos(pitch), Math.cos(az) * Math.cos(pitch), Math.sin(pitch)];
}

function wrap180(angle) {
  return ((((angle + 180) % 360) + 360) % 360) - 180;
}

function angleBetween(a, b) {
  return Math.acos(Math.max(-1, Math.min(1, dot3(a, b)))) / DEG;
}

function cameraBasisFromEvent(event) {
  const { alpha, beta, gamma } = event;
  if (!Number.isFinite(alpha) || !Number.isFinite(beta) || !Number.isFinite(gamma)) return null;
  const ca = Math.cos(alpha * DEG);
  const sa = Math.sin(alpha * DEG);
  const cb = Math.cos(beta * DEG);
  const sb = Math.sin(beta * DEG);
  const cg = Math.cos(gamma * DEG);
  const sg = Math.sin(gamma * DEG);
  const devX = [ca * cg - sa * sb * sg, cg * sa + ca * sb * sg, -cb * sg];
  const devY = [-cb * sa, ca * cb, sb];
  const devZ = [ca * sg + cg * sa * sb, sa * sg - ca * cg * sb, cb * cg];
  const angle = (((Number(screen.orientation?.angle ?? window.orientation ?? 0) || 0) % 360) + 360) % 360;
  let up = devY;
  if (angle === 90) up = devX;
  else if (angle === 180) up = neg3(devY);
  else if (angle === 270) up = neg3(devX);
  return { f: neg3(devZ), u: up };
}

function onOrientation(event) {
  const roll = rollFromEvent(event);
  if (Number.isFinite(roll)) {
    state.sawOrientation = true;
    state.pendingRoll = roll;
  }
  const heading = headingFromEvent(event);
  if (Number.isFinite(heading)) state.heading = heading;
  const pitch = pitchFromEvent(event);
  if (Number.isFinite(pitch)) state.pitch = pitch;
  const absoluteEvent = event.absolute === true || event.type === "deviceorientationabsolute";
  if (absoluteEvent) state.sawAbsolute = true;
  if (absoluteEvent || !state.sawAbsolute) {
    const basis = cameraBasisFromEvent(event);
    if (basis) {
      state.rot = basis;
      if (Number.isFinite(heading) && Math.abs(basis.f[2]) < 0.85) {
        state.yawFix = wrap180(heading - Math.atan2(basis.f[0], basis.f[1]) / DEG);
        state.yawKnown = true;
      }
    }
  }
  if ((Number.isFinite(roll) || state.sphere) && !state.orientFrame) {
    state.orientFrame = requestAnimationFrame(paintOrientation);
  }
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

function readCameraInfo() {
  const track = state.stream?.getVideoTracks?.()[0];
  let settings = {};
  try {
    settings = track?.getSettings?.() || {};
  } catch {
    settings = {};
  }
  return {
    label: track?.label || "",
    facing: settings.facingMode || state.facing || "",
    width: settings.width || ui.preview.videoWidth || 0,
    height: settings.height || ui.preview.videoHeight || 0,
    zoom: state.zoom,
  };
}

function formatCamera(info, direction) {
  if (!info && !direction) return "";
  const facing = info?.facing === "user" ? "前鏡頭" : info?.facing === "environment" ? "後鏡頭" : "";
  const size = info?.width && info?.height ? `${info.width}×${info.height}` : "";
  const zoom = Number.isFinite(info?.zoom) ? `${Number(info.zoom).toFixed(1)}×` : "";
  const label = info?.label && info.label.length <= 32 ? info.label : "";
  return [direction ? targetLabel(direction) || direction : "", facing, size, zoom, label].filter(Boolean).join(" · ");
}

function targetById(id) {
  return SPHERE_TARGETS.find((target) => target.id === id) || null;
}

function targetLabel(id) {
  return targetById(id)?.label || SPHERE_LABEL[id] || "";
}

function targetDir(target) {
  return dirVector((state.sphere?.origin ?? 0) + target.az, target.pitch);
}

function sphereDoneCount() {
  if (!state.sphere) return 0;
  return SPHERE_TARGETS.filter((target) => state.sphere.counts[target.id] > 0).length;
}

function sphereNext() {
  const session = state.sphere;
  if (!session) return null;
  const undone = SPHERE_TARGETS.filter((target) => !(session.counts[target.id] > 0));
  if (!undone.length) return null;
  if (!state.rot || session.origin == null) return undone[0];
  let best = undone[0];
  let bestAngle = 999;
  for (const target of undone) {
    const angle = angleBetween(state.rot.f, targetDir(target));
    if (angle < bestAngle) {
      bestAngle = angle;
      best = target;
    }
  }
  return best;
}

function sphereAssign() {
  const session = state.sphere;
  if (!session) return "";
  if (!state.rot || session.origin == null) return sphereNext()?.id || "x";
  let best = null;
  let bestScore = 999;
  for (const target of SPHERE_TARGETS) {
    const angle = angleBetween(state.rot.f, targetDir(target));
    const score = angle + (session.counts[target.id] > 0 ? 4 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = target;
    }
  }
  return best && bestScore < 24 ? best.id : "x";
}

function sphereFocalPx(rect) {
  const vw = ui.preview.videoWidth;
  const vh = ui.preview.videoHeight;
  const zoom = Math.max(1, state.zoom);
  if (!vw || !vh) return (rect.height / (2 * Math.tan(30 * DEG))) * zoom;
  const base = Math.max(vw, vh) / 2 / Math.tan((settings.cameraFov * DEG) / 2);
  return base * Math.max(rect.width / vw, rect.height / vh) * zoom;
}

function sizeSphereCanvas(rect) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (ui.sphereCanvas.width !== width || ui.sphereCanvas.height !== height) {
    ui.sphereCanvas.width = width;
    ui.sphereCanvas.height = height;
  }
  return dpr;
}

function drawSphereGuide() {
  const session = state.sphere;
  const rect = ui.camera.getBoundingClientRect();
  const dpr = sizeSphereCanvas(rect);
  const ctx = ui.sphereCanvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);
  if (!session || !state.rot || session.origin == null) return 999;
  const { f, u } = state.rot;
  const r = cross3(f, u);
  const focal = sphereFocalPx(rect);
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const next = sphereNext();
  const pulse = (Math.sin(performance.now() / 260) + 1) / 2;
  let nearestUndone = 999;
  let nextVisible = false;
  for (const target of SPHERE_TARGETS) {
    const v = targetDir(target);
    const cz = dot3(v, f);
    const done = session.counts[target.id] > 0;
    if (!done) nearestUndone = Math.min(nearestUndone, angleBetween(f, v));
    const isNext = next && next.id === target.id;
    if (cz <= 0.05) continue;
    const sx = cx + (focal * dot3(v, r)) / cz;
    const sy = cy - (focal * dot3(v, u)) / cz;
    if (sx < -20 || sy < -20 || sx > rect.width + 20 || sy > rect.height + 20) continue;
    if (isNext) nextVisible = true;
    ctx.beginPath();
    if (done) {
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(111, 207, 151, 0.85)";
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
      ctx.stroke();
    } else if (isNext) {
      ctx.arc(sx, sy, 15 + pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(231, 163, 34, 0.38)";
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#fff";
      ctx.stroke();
    } else {
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(231, 163, 34, 0.2)";
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#e7a322";
      ctx.stroke();
    }
    if (isNext) {
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.moveTo(cx, cy);
      ctx.lineTo(sx, sy);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  if (next && !nextVisible) {
    const v = targetDir(next);
    let dx = dot3(v, r);
    const dy = -dot3(v, u);
    if (Math.hypot(dx, dy) < 0.001) dx = 1;
    const angle = Math.atan2(dy, dx);
    const radius = Math.min(rect.width, rect.height) * 0.36;
    ctx.save();
    ctx.translate(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(18, 0);
    ctx.lineTo(-10, -13);
    ctx.lineTo(-10, 13);
    ctx.closePath();
    ctx.fillStyle = "#e7a322";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#fff";
    ctx.stroke();
    ctx.restore();
  }
  return nearestUndone;
}

function sphereHint() {
  const session = state.sphere;
  if (!session) return "";
  const total = SPHERE_TARGETS.length;
  const done = sphereDoneCount();
  const next = sphereNext();
  if (!next) return `${total} 個角度都拍完了，按「組合全景」。也可以再補拍。`;
  if (!state.rot || session.origin == null) {
    return `沒有方向感應器，依序拍：${next.label}（第 ${done + 1}/${total}），拍完點中間圓圈。`;
  }
  const f = state.rot.f;
  const curAz = Math.atan2(f[0], f[1]) / DEG;
  const curPitch = Math.asin(Math.max(-1, Math.min(1, f[2]))) / DEG;
  const angle = angleBetween(f, targetDir(next));
  if (angle < 7) return `對準了：${next.label}。點中間圓圈拍照。（${done}/${total}）`;
  const dAz = wrap180(session.origin + next.az - curAz);
  const dPitch = next.pitch - curPitch;
  const poleTarget = Math.abs(next.pitch) >= 80 || Math.abs(curPitch) > 70;
  if (poleTarget || Math.abs(dPitch) > Math.abs(dAz) * Math.cos(curPitch * DEG)) {
    return `${dPitch > 0 ? "把手機抬高" : "把手機壓低"} ${Math.round(Math.abs(dPitch))}°，找「${next.label}」的圓點。（${done}/${total}）`;
  }
  return `${dAz > 0 ? "向右轉" : "向左轉"} ${Math.round(Math.abs(dAz))}°，找「${next.label}」的圓點。（${done}/${total}）`;
}

function renderSphere() {
  const session = state.sphere;
  const on = Boolean(session);
  const visible = on && !ui.camera.hidden;
  ui.sphere.hidden = !on;
  ui.sphereCanvas.hidden = !visible;
  ui.sphereRing.hidden = !visible;
  ui.sphereToggle.classList.toggle("is-on", on);
  ui.sphereToggle.setAttribute("aria-pressed", String(on));
  if (!visible) {
    state.sphereText = "";
    return;
  }
  if (session.origin == null && state.rot && Math.abs(state.rot.f[2]) < 0.7) {
    session.origin = Math.atan2(state.rot.f[0], state.rot.f[1]) / DEG;
  }
  const nearest = drawSphereGuide();
  ui.sphereRing.classList.toggle("is-aim", nearest < 7);
  const text = sphereHint();
  if (text !== state.sphereText) {
    state.sphereText = text;
    ui.sphereHint.textContent = text;
  }
  const done = sphereDoneCount();
  const total = SPHERE_TARGETS.length;
  const countText = `${done}/${total}`;
  if (ui.sphereCount.textContent !== countText) {
    ui.sphereCount.textContent = countText;
    ui.sphereProgress.style.width = `${Math.round((done / total) * 100)}%`;
  }
  ui.sphereFinish.disabled = session.shots < 2;
}

function toggleSphere() {
  if (state.sphere) {
    state.sphere = null;
    renderSphere();
    showToast("已結束環景拍攝。照片留在紀錄，到紀錄頁按「環景」可再組合");
    return;
  }
  if (state.facing === "user") {
    showToast("環景請用後鏡頭，先按翻轉");
    return;
  }
  const f = state.rot?.f;
  state.sphere = {
    id: crypto.randomUUID?.() || `spot-${Date.now()}`,
    origin: f && Math.abs(f[2]) < 0.7 ? Math.atan2(f[0], f[1]) / DEG : null,
    counts: {},
    shots: 0,
    extra: 0,
  };
  state.sphereText = "";
  renderSphere();
  showToast(f
    ? "原地不動，照畫面上的圓點轉動手機。圓點進到中間圓圈就點它拍照，建議用 1× 不縮放"
    : "這台沒有方向感應器，依提示順序拍，拍完點中間圓圈");
}

function commitSphereShot(targetId) {
  const session = state.sphere;
  if (!session) return;
  if (targetById(targetId)) session.counts[targetId] = (session.counts[targetId] || 0) + 1;
  else session.extra += 1;
  session.shots += 1;
  state.sphereText = "";
}

function flashScreen() {
  ui.flash.classList.remove("go");
  void ui.flash.offsetWidth;
  ui.flash.classList.add("go");
}

async function captureSphereShot() {
  if (state.busy) return;
  const vw = ui.preview.videoWidth;
  const vh = ui.preview.videoHeight;
  if (!vw || !vh) {
    showToast("相機畫面還沒準備好");
    return;
  }
  state.busy = true;
  ui.shutter.disabled = true;
  ui.sphereRing.disabled = true;
  playShutter();
  flashScreen();
  const when = new Date();
  snapshotShot();
  const rot = state.rot;
  const yawFix = Number.isFinite(state.yawFix) ? state.yawFix : 0;
  const targetId = sphereAssign();
  state.capturedDirection = targetId;
  try {
    const zoom = state.zoomMode === "hardware"
      ? Math.max(1, state.zoom / (state.hwZoom > 0 ? state.hwZoom : 1))
      : Math.max(1, state.zoom);
    const sw = vw / zoom;
    const sh = vh / zoom;
    const size = fittedSize(sw, sh);
    const canvas = document.createElement("canvas");
    canvas.width = size.width;
    canvas.height = size.height;
    canvas.getContext("2d").drawImage(ui.preview, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, canvas.width, canvas.height);
    const hardware = state.zoomMode === "hardware" && state.hwZoom > 0 ? state.hwZoom : 1;
    const focalPx = (Math.max(vw, vh) / 2 / Math.tan((settings.cameraFov * DEG) / 2)) * hardware;
    const target = targetById(targetId);
    const round = (value) => Math.round(value * 10000) / 10000;
    state.capturedExtra = {
      fovH: Math.round(((2 * Math.atan(sw / 2 / focalPx)) / DEG) * 100) / 100,
      fovV: Math.round(((2 * Math.atan(sh / 2 / focalPx)) / DEG) * 100) / 100,
      rot: rot ? [...rot.f, ...rot.u].map(round) : null,
      yawFix: Math.round(yawFix * 100) / 100,
      nomAz: target ? target.az : null,
      nomPitch: target ? target.pitch : null,
    };
    let blob = await blobFromCanvas(canvas);
    try {
      blob = await withExif(blob, exifMeta(when, canvas));
    } catch {
      /* 位置寫不進檔案時，仍保留這張照片 */
    }
    state.blob = blob;
    state.filename = filenameFor(when).replace(/\.jpg$/, `_${pad((state.sphere?.shots || 0) + 1)}.jpg`);
    await saveRecord(when, "環景");
    commitSphereShot(targetId);
    const left = SPHERE_TARGETS.length - sphereDoneCount();
    showToast(left
      ? `已拍「${targetLabel(targetId) || "補拍"}」。還剩 ${left} 個角度`
      : "全部角度都拍完了，按「組合全景」");
  } catch {
    showToast("這張沒寫成功，請再拍一次");
  } finally {
    state.capturedExtra = null;
    state.busy = false;
    ui.shutter.disabled = !state.stream;
    ui.sphereRing.disabled = false;
    renderSphere();
  }
}

function finishSphere() {
  const session = state.sphere;
  if (!session) return;
  if (session.shots < 2) {
    showToast("至少拍 2 張才能組合");
    return;
  }
  const id = session.id;
  state.sphere = null;
  renderSphere();
  if (typeof openPano === "function") openPano(id);
}

function exifDate(date) {
  return `${date.getFullYear()}:${pad(date.getMonth() + 1)}:${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function asciiExif(text) {
  const clean = String(text || "").replace(/[^\x20-\x7e]/g, "").slice(0, 48) || "TimeCam";
  const bytes = new Uint8Array(clean.length + 1);
  for (let i = 0; i < clean.length; i += 1) bytes[i] = clean.charCodeAt(i);
  return bytes;
}

function exifRationals(pairs) {
  const bytes = new Uint8Array(pairs.length * 8);
  const view = new DataView(bytes.buffer);
  pairs.forEach(([num, den], index) => {
    view.setUint32(index * 8, num, true);
    view.setUint32(index * 8 + 4, den, true);
  });
  return bytes;
}

function dmsPairs(value) {
  const abs = Math.abs(value);
  let degrees = Math.floor(abs);
  let minutes = Math.floor((abs - degrees) * 60);
  let seconds = Math.round(((abs - degrees) * 60 - minutes) * 60 * 10000);
  if (seconds >= 600000) {
    seconds = 0;
    minutes += 1;
  }
  if (minutes >= 60) {
    minutes = 0;
    degrees += 1;
  }
  return [[degrees, 1], [minutes, 1], [seconds, 10000]];
}

function buildTiff(meta) {
  const when = asciiExif(meta.when);
  const make = asciiExif("TimeCam");
  const model = asciiExif(meta.model || "TimeCam");
  const entries0 = [
    { tag: 0x010f, type: 2, count: make.length, value: make },
    { tag: 0x0110, type: 2, count: model.length, value: model },
    { tag: 0x0112, type: 3, count: 1, value: 1 },
    { tag: 0x0132, type: 2, count: when.length, value: when },
  ];
  const exifPtr = { tag: 0x8769, type: 4, count: 1, value: 0 };
  entries0.push(exifPtr);
  const exifEntries = [
    { tag: 0x9003, type: 2, count: when.length, value: when },
    { tag: 0x9004, type: 2, count: when.length, value: when },
  ];
  if (meta.width) exifEntries.push({ tag: 0xa002, type: 4, count: 1, value: meta.width });
  if (meta.height) exifEntries.push({ tag: 0xa003, type: 4, count: 1, value: meta.height });
  const ifds = [entries0, exifEntries];
  let gpsPtr = null;
  if (Number.isFinite(meta.lat) && Number.isFinite(meta.lon)) {
    gpsPtr = { tag: 0x8825, type: 4, count: 1, value: 0 };
    entries0.push(gpsPtr);
    const latRef = asciiExif(meta.lat >= 0 ? "N" : "S");
    const lonRef = asciiExif(meta.lon >= 0 ? "E" : "W");
    const gps = [
      { tag: 0x0000, type: 1, count: 4, value: new Uint8Array([2, 3, 0, 0]) },
      { tag: 0x0001, type: 2, count: latRef.length, value: latRef },
      { tag: 0x0002, type: 5, count: 3, value: exifRationals(dmsPairs(meta.lat)) },
      { tag: 0x0003, type: 2, count: lonRef.length, value: lonRef },
      { tag: 0x0004, type: 5, count: 3, value: exifRationals(dmsPairs(meta.lon)) },
    ];
    if (Number.isFinite(meta.altitude)) {
      const alt = Math.abs(meta.altitude);
      gps.push({ tag: 0x0005, type: 1, count: 1, value: meta.altitude < 0 ? 1 : 0 });
      gps.push({ tag: 0x0006, type: 5, count: 1, value: exifRationals([[Math.round(alt * 100), 100]]) });
    }
    if (Number.isFinite(meta.heading)) {
      const ref = asciiExif("T");
      gps.push({ tag: 0x0010, type: 2, count: ref.length, value: ref });
      gps.push({ tag: 0x0011, type: 5, count: 1, value: exifRationals([[Math.round(meta.heading * 100), 100]]) });
    }
    ifds.push(gps);
  }
  for (const entries of ifds) entries.sort((a, b) => a.tag - b.tag);
  let cursor = 8;
  const ifdOffsets = ifds.map((entries) => {
    const offset = cursor;
    cursor += 2 + entries.length * 12 + 4;
    return offset;
  });
  exifPtr.value = ifdOffsets[1];
  if (gpsPtr) gpsPtr.value = ifdOffsets[2];
  const blobs = [];
  for (const entries of ifds) {
    for (const entry of entries) {
      if (entry.value instanceof Uint8Array && entry.value.length > 4 && !blobs.includes(entry.value)) blobs.push(entry.value);
    }
  }
  const blobOffset = new Map();
  for (const blob of blobs) {
    blobOffset.set(blob, cursor);
    cursor += blob.length;
  }
  const bytes = new Uint8Array(cursor);
  const view = new DataView(bytes.buffer);
  bytes[0] = 0x49;
  bytes[1] = 0x49;
  view.setUint16(2, 42, true);
  view.setUint32(4, ifdOffsets[0], true);
  ifds.forEach((entries, index) => {
    let pointer = ifdOffsets[index];
    view.setUint16(pointer, entries.length, true);
    pointer += 2;
    for (const entry of entries) {
      view.setUint16(pointer, entry.tag, true);
      view.setUint16(pointer + 2, entry.type, true);
      view.setUint32(pointer + 4, entry.count, true);
      if (entry.value instanceof Uint8Array && entry.value.length > 4) {
        view.setUint32(pointer + 8, blobOffset.get(entry.value), true);
      } else if (entry.value instanceof Uint8Array) {
        bytes.set(entry.value, pointer + 8);
      } else if (entry.type === 3) {
        view.setUint16(pointer + 8, entry.value, true);
      } else {
        view.setUint32(pointer + 8, entry.value, true);
      }
      pointer += 12;
    }
    view.setUint32(pointer, 0, true);
  });
  for (const blob of blobs) bytes.set(blob, blobOffset.get(blob));
  return bytes;
}

async function withExif(blob, meta) {
  const input = new Uint8Array(await blob.arrayBuffer());
  if (input[0] !== 0xff || input[1] !== 0xd8) return blob;
  const tiff = buildTiff(meta);
  const content = 6 + tiff.length;
  const segment = new Uint8Array(4 + content);
  segment[0] = 0xff;
  segment[1] = 0xe1;
  segment[2] = (content + 2) >> 8;
  segment[3] = (content + 2) & 255;
  segment[4] = 69;
  segment[5] = 120;
  segment[6] = 105;
  segment[7] = 102;
  segment.set(tiff, 10);
  const out = new Uint8Array(input.length + segment.length);
  out[0] = 0xff;
  out[1] = 0xd8;
  out.set(segment, 2);
  out.set(input.subarray(2), 2 + segment.length);
  return new Blob([out], { type: "image/jpeg" });
}

function exifMeta(when, canvas) {
  const camera = state.capturedCamera || {};
  const model = [
    camera.facing === "user" ? "Front" : "Back",
    camera.width && camera.height ? `${camera.width}x${camera.height}` : "",
    Number.isFinite(camera.zoom) ? `${Number(camera.zoom).toFixed(1)}x` : "",
  ].filter(Boolean).join(" ");
  return {
    when: exifDate(when),
    model,
    width: camera.width || canvas.width,
    height: camera.height || canvas.height,
    lat: state.coords?.lat,
    lon: state.coords?.lon,
    altitude: state.coords?.altitude,
    heading: state.capturedHeading,
  };
}

function renderMeta(when, source) {
  const direction = state.capturedDirection ? targetLabel(state.capturedDirection) : "";
  const rows = [
    ["時間", formatWhen(when)],
    ["來源", source],
    ["坐標", state.coords ? formatCoords(state.coords.lat, state.coords.lon) : "沒有"],
    ["地點", state.place || "沒有"],
    ["天氣", state.weather || "沒有"],
    ["方位角", formatHeading(state.capturedHeading) || "沒有"],
    ["相機", formatCamera(state.capturedCamera) || (source === "相簿" ? "相簿" : "沒有")],
  ];
  if (direction) rows.splice(6, 0, ["方向", direction]);
  ui.meta.replaceChildren();
  for (const [label, value] of rows) {
    const row = document.createElement("div");
    const name = document.createElement("span");
    name.textContent = label;
    row.append(name, document.createTextNode(value));
    ui.meta.append(row);
  }
}

function snapshotShot(fromCamera = true) {
  state.capturedHeading = state.heading;
  state.capturedPitch = state.pitch;
  state.capturedCamera = fromCamera ? readCameraInfo() : null;
  state.capturedDirection = "";
  state.capturedExtra = null;
}

async function present(canvas, when, source) {
  let blob = await blobFromCanvas(canvas);
  try {
    blob = await withExif(blob, exifMeta(when, canvas));
  } catch {
    /* 位置寫不進檔案時，仍保留這張照片 */
  }
  state.blob = blob;
  state.filename = filenameFor(when);
  if (state.objectUrl) URL.revokeObjectURL(state.objectUrl);
  state.objectUrl = URL.createObjectURL(state.blob);
  ui.shot.src = state.objectUrl;
  renderMeta(when, source);
  ui.resultHint.textContent = "這張已留在紀錄。繼續拍會回到即時畫面，拍下一張。";
  show("result");
  saveRecord(when, source).catch(() => showToast("這張沒有寫進拍攝紀錄"));
}

function streamIsLive() {
  return Boolean(state.stream?.getVideoTracks?.().some((track) => track.readyState === "live"));
}

async function continueShooting() {
  ui.settings.hidden = true;
  ui.log.hidden = true;
  ui.mapScreen.hidden = true;
  show("camera");
  state.busy = false;
  ensureClock();
  renderSphere();
  if (!streamIsLive()) {
    try {
      await openCamera(state.facing);
    } catch {
      ui.shutter.disabled = true;
      showToast("相機沒有重新打開，請再按一次繼續拍");
    }
    return;
  }
  if (ui.preview.srcObject !== state.stream) ui.preview.srcObject = state.stream;
  try {
    await ui.preview.play();
  } catch {
    try {
      await openCamera(state.facing);
    } catch {
      ui.shutter.disabled = true;
      showToast("相機沒有重新打開，請再按一次繼續拍");
      return;
    }
  }
  ui.shutter.disabled = false;
  renderStatus();
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
  if (state.sphere) return captureSphereShot();
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
  snapshotShot();
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
  snapshotShot(false);
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

ui.retake.addEventListener("click", () => {
  continueShooting();
});

ui.save.addEventListener("click", saveToAlbum);
ui.share.addEventListener("click", shareBlob);

window.addEventListener("keydown", (event) => {
  if (typeof isPanoOpen === "function" && isPanoOpen()) {
    if (event.key === "Escape") closePano();
    return;
  }
  if (event.key === "Escape" && !ui.mapScreen.hidden) {
    closeMap();
    return;
  }
  if (event.key === "Escape" && !ui.log.hidden) {
    closeLog();
    return;
  }
  if (event.key === "Escape" && !ui.settings.hidden) {
    closeSettings();
    return;
  }
  if (!ui.result.hidden && ui.settings.hidden && ui.log.hidden && ui.mapScreen.hidden && (event.key === "Enter" || event.code === "Space")) {
    event.preventDefault();
    continueShooting();
    return;
  }
  if (event.code === "Space" && !ui.camera.hidden && ui.settings.hidden && ui.log.hidden && ui.mapScreen.hidden) {
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
  rememberDeleted(id);
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
    pitch: Number.isFinite(state.capturedPitch) ? state.capturedPitch : null,
    altitude: Number.isFinite(state.coords?.altitude) ? state.coords.altitude : null,
    camera: formatCamera(state.capturedCamera, state.capturedDirection) || (source === "相簿" ? "相簿" : ""),
    direction: state.capturedDirection || "",
    spotId: state.sphere && state.capturedDirection ? state.sphere.id : "",
    filename: state.filename,
    source,
    blob: state.blob,
    ...(state.capturedExtra || {}),
  });
  maybeSync();
}

function loadDeleted() {
  try {
    const list = JSON.parse(localStorage.getItem(DELETED_KEY) || "[]");
    return Array.isArray(list) ? list.filter((id) => typeof id === "string" && id) : [];
  } catch {
    return [];
  }
}

function saveDeleted(ids) {
  localStorage.setItem(DELETED_KEY, JSON.stringify([...new Set(ids)].slice(-800)));
}

function rememberDeleted(id) {
  if (!id) return;
  const ids = loadDeleted();
  if (!ids.includes(id)) ids.push(id);
  saveDeleted(ids);
}

function recordMeta(record) {
  return {
    id: record.id,
    takenAt: record.takenAt,
    place: record.place || "",
    lat: Number.isFinite(record.lat) ? record.lat : null,
    lon: Number.isFinite(record.lon) ? record.lon : null,
    weather: record.weather || "",
    heading: Number.isFinite(record.heading) ? record.heading : null,
    pitch: Number.isFinite(record.pitch) ? record.pitch : null,
    altitude: Number.isFinite(record.altitude) ? record.altitude : null,
    camera: record.camera || "",
    direction: record.direction || "",
    spotId: record.spotId || "",
    filename: record.filename || "",
    source: record.source || "",
    kind: record.kind || "",
    panoOf: record.panoOf || "",
    shots: Number.isFinite(record.shots) ? record.shots : null,
    fovH: Number.isFinite(record.fovH) ? record.fovH : null,
    fovV: Number.isFinite(record.fovV) ? record.fovV : null,
    rot: Array.isArray(record.rot) && record.rot.length === 6 ? record.rot : null,
    yawFix: Number.isFinite(record.yawFix) ? record.yawFix : 0,
    nomAz: Number.isFinite(record.nomAz) ? record.nomAz : null,
    nomPitch: Number.isFinite(record.nomPitch) ? record.nomPitch : null,
  };
}

function shotFileName(id) {
  return `shot-${id}.jpg`;
}

function renderGoogleStatus(message) {
  const email = googleAuth.email;
  if (ui.googleStatus) {
    ui.googleStatus.textContent = message || (email
      ? `已綁定 ${email}。拍攝紀錄會跟這個帳號同步。`
      : "尚未綁定。按綁定 Google 即可同步拍攝紀錄。");
  }
  if (ui.googleGate) {
    ui.googleGate.hidden = !email;
    ui.googleGate.textContent = email ? `已綁定 ${email}` : "";
  }
  if (ui.googleOrigin) {
    const origin = location.origin && location.origin !== "null" ? location.origin : location.href;
    ui.googleOrigin.textContent = origin;
  }
}

function setGoogleBusy(busy) {
  for (const button of [ui.googleBind, ui.googleSync, ui.googleUnbind, ui.logSync]) {
    if (button) button.disabled = busy;
  }
}

function googleMessage(error) {
  const code = String(error?.message || "");
  if (code === "no-client") return "請先貼上 OAuth 用戶端 ID。";
  if (code === "gis") return "Google 登入元件沒有載入，請確認網路。";
  if (code === "expired") return "登入已過期，請再按一次同步。";
  if (code === "access_denied" || code.startsWith("popup_")) return "沒有完成 Google 登入。";
  if (code === "403" || code === "401" || /insufficient|authError|ACCESS_TOKEN/i.test(code)) {
    return "請確認已啟用 Google Drive API，兩台都登入同一個 Google 帳號，並重新按綁定 Google。";
  }
  if (code === "interaction_required") return "請按綁定 Google 完成登入。";
  if (code === "upload" || code === "no-blob") return "照片沒有上傳完成，請再同步一次。";
  if (code === "404" || /notFound/i.test(code)) return "雲端資料讀取失敗，請再同步一次。";
  if (/dailyLimit|rateLimit|userRateLimit/i.test(code)) return "同步次數暫時太多，請稍後再試。";
  return `同步沒有完成（${code || "未知錯誤"}），請再試一次。`;
}

let gisPromise = null;
function loadGis() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      gisPromise = null;
      reject(new Error("gis"));
    };
    document.head.append(script);
  });
  return gisPromise;
}

function requestAccessToken(interactive) {
  const clientId = settings.googleClientId.trim();
  if (!clientId) return Promise.reject(new Error("no-client"));
  return loadGis().then(() => new Promise((resolve, reject) => {
    let settled = false;
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email https://www.googleapis.com/auth/drive.appdata",
      callback: (tokenResponse) => {
        if (settled) return;
        settled = true;
        if (tokenResponse.error) reject(new Error(tokenResponse.error));
        else resolve(tokenResponse);
      },
      error_callback: (error) => {
        if (settled) return;
        settled = true;
        reject(new Error(error?.type || error?.message || "auth"));
      },
    });
    client.requestAccessToken({ prompt: interactive ? "consent" : "" });
  }));
}

async function driveFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${googleAuth.token}`);
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    googleAuth.token = "";
    googleAuth.expiresAt = 0;
    throw new Error("expired");
  }
  if (!response.ok) {
    let detail = String(response.status);
    try {
      const payload = await response.json();
      detail = payload?.error?.errors?.[0]?.reason
        || payload?.error?.status
        || payload?.error?.message
        || detail;
    } catch {
      // keep status code
    }
    throw new Error(detail);
  }
  return response;
}

async function driveList() {
  const files = [];
  let pageToken = "";
  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("spaces", "appDataFolder");
    url.searchParams.set("pageSize", "1000");
    url.searchParams.set("fields", "nextPageToken,files(id,name,modifiedTime,size)");
    url.searchParams.set("q", "trashed = false");
    url.searchParams.set("corpora", "user");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const data = await (await driveFetch(url)).json();
    files.push(...(data.files || []));
    pageToken = data.nextPageToken || "";
  } while (pageToken);
  return files;
}

async function materializeBlob(body, mime) {
  if (body instanceof Blob) {
    const buffer = await body.arrayBuffer();
    return new Blob([buffer], { type: mime || body.type || "application/octet-stream" });
  }
  return new Blob([body], { type: mime || "application/octet-stream" });
}

async function driveUpload({ name, mime, body, fileId }) {
  const blob = await materializeBlob(body, mime);
  let id = fileId;
  if (!id) {
    const created = await (await driveFetch("https://www.googleapis.com/drive/v3/files?fields=id,name,modifiedTime", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({
        name,
        mimeType: mime,
        parents: ["appDataFolder"],
      }),
    })).json();
    id = created.id;
  }
  return (await driveFetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(id)}?uploadType=media&fields=id,name,modifiedTime`,
    {
      method: "PATCH",
      headers: { "Content-Type": mime || "application/octet-stream" },
      body: blob,
    }
  )).json();
}

function driveDownload(fileId) {
  return driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`)
    .then((response) => response.blob());
}

async function driveRemove(fileId) {
  const response = await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
  });
  return response;
}

async function ensureGoogleToken(interactive) {
  if (googleAuth.token && googleAuth.expiresAt > Date.now() + 60000) return;
  const token = await requestAccessToken(interactive);
  googleAuth.token = token.access_token;
  googleAuth.expiresAt = Date.now() + (Number(token.expires_in) || 3500) * 1000;
  const profile = await (await driveFetch("https://www.googleapis.com/oauth2/v3/userinfo")).json();
  googleAuth.email = profile.email || googleAuth.email || "";
  if (googleAuth.email) localStorage.setItem(GOOGLE_EMAIL_KEY, googleAuth.email);
}

async function readRemoteIndex(files) {
  const indexes = files
    .filter((file) => file?.name === DRIVE_INDEX && file.id)
    .sort((a, b) => String(b.modifiedTime || "").localeCompare(String(a.modifiedTime || "")));
  const remote = { records: [], deleted: [], primary: indexes[0] || null, extras: indexes.slice(1) };
  const byId = new Map();
  const deleted = new Set();
  for (const file of indexes) {
    try {
      const parsed = await (await driveFetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`)).json();
      if (Array.isArray(parsed.deleted)) {
        for (const id of parsed.deleted) {
          if (typeof id === "string" && id) deleted.add(id);
        }
      }
      if (Array.isArray(parsed.records)) {
        for (const record of parsed.records) {
          if (!record?.id || byId.has(record.id)) continue;
          byId.set(record.id, record);
        }
      }
    } catch {
      // keep reading other index copies
    }
  }
  remote.records = [...byId.values()];
  remote.deleted = [...deleted];
  return remote;
}

function asImageBlob(blob) {
  return blob && typeof blob.type === "string" && blob.type.startsWith("image/")
    ? blob
    : new Blob([blob], { type: "image/jpeg" });
}

async function pushPull() {
  const files = await driveList();
  const byName = new Map();
  for (const file of files) {
    if (!file?.name || file.name === DRIVE_INDEX) continue;
    if (!byName.has(file.name)) byName.set(file.name, file);
  }
  const remote = await readRemoteIndex(files);
  const deleted = new Set([...loadDeleted(), ...remote.deleted]);
  const localById = new Map((await idbAll()).map((record) => [record.id, record]));
  const remoteById = new Map(remote.records.filter((record) => record?.id).map((record) => [record.id, record]));
  let uploaded = 0;
  let downloaded = 0;
  let removed = 0;
  let missingBlob = 0;

  for (const id of deleted) {
    if (localById.has(id)) {
      await idbDelete(id);
      localById.delete(id);
      removed += 1;
    }
    const remoteFile = byName.get(shotFileName(id));
    if (remoteFile) {
      await driveRemove(remoteFile.id);
      byName.delete(shotFileName(id));
    }
  }

  for (const [id, record] of localById) {
    if (deleted.has(id)) continue;
    const name = shotFileName(id);
    const remoteFile = byName.get(name);
    const remoteEmpty = remoteFile && Number(remoteFile.size) === 0;
    if (!record.blob) {
      missingBlob += 1;
      continue;
    }
    if (!remoteFile || remoteEmpty) {
      const file = await driveUpload({
        name,
        mime: "image/jpeg",
        body: record.blob,
        fileId: remoteFile?.id || "",
      });
      byName.set(name, file);
      uploaded += 1;
    }
  }

  for (const [id, meta] of remoteById) {
    if (deleted.has(id) || localById.has(id)) continue;
    const remoteFile = byName.get(shotFileName(id));
    if (!remoteFile) continue;
    const blob = asImageBlob(await driveDownload(remoteFile.id));
    const record = recordMeta(meta);
    record.blob = blob;
    await idbPut(record);
    localById.set(id, record);
    downloaded += 1;
  }

  for (const record of localById.values()) {
    if (record.blob || deleted.has(record.id)) continue;
    const remoteFile = byName.get(shotFileName(record.id));
    if (!remoteFile) continue;
    record.blob = asImageBlob(await driveDownload(remoteFile.id));
    await idbPut(record);
    downloaded += 1;
  }

  const records = [...localById.values()]
    .filter((record) => record.id && !deleted.has(record.id))
    .map(recordMeta)
    .sort((a, b) => String(a.takenAt).localeCompare(String(b.takenAt)));
  await driveUpload({
    name: DRIVE_INDEX,
    mime: "application/json",
    body: JSON.stringify({
      version: 1,
      updatedAt: new Date().toISOString(),
      deleted: [...deleted].slice(-800),
      records,
    }),
    fileId: remote.primary?.id || "",
  });
  for (const extra of remote.extras) {
    try { await driveRemove(extra.id); } catch { /* ignore */ }
  }
  saveDeleted([...deleted]);
  return { uploaded, downloaded, removed, missingBlob, total: records.length, cloud: records.length };
}

let syncAgain = false;

async function syncGoogle({ interactive = false, announce = false } = {}) {
  if (googleAuth.syncing) {
    syncAgain = true;
    return;
  }
  googleAuth.syncing = true;
  setGoogleBusy(true);
  renderGoogleStatus("同步中…");
  let retry = false;
  try {
    await ensureGoogleToken(interactive);
    if (!googleAuth.email) throw new Error("interaction_required");
    const result = await pushPull();
    const when = formatClock(new Date()) || formatWhen(new Date());
    let status = `已同步（${when}）：上傳 ${result.uploaded}、下載 ${result.downloaded}，雲端 ${result.cloud} 筆，這台 ${result.total} 筆。`;
    if (result.missingBlob) status += ` 有 ${result.missingBlob} 筆本機缺照片檔，無法上傳。`;
    renderGoogleStatus(status);
    if (announce) {
      if (result.uploaded || result.downloaded) {
        showToast(`同步完成：上傳 ${result.uploaded}、下載 ${result.downloaded}`);
      } else if (result.missingBlob) {
        showToast(`登入成功，但有 ${result.missingBlob} 筆缺照片檔，無法上傳`);
      } else {
        showToast(`雲端已是最新，共 ${result.cloud} 筆。請確認兩台是同一個 Google 帳號`);
      }
    }
    if (!ui.log.hidden) {
      await renderLog();
      if (result.downloaded && state.logTodayOnly) {
        const visible = visibleRecords(await idbAll()).length;
        if (visible < result.total) {
          setLogNote(`已從雲端下載 ${result.downloaded} 筆。若列表較少，關掉「只看今天」可看到全部 ${result.total} 筆。`);
        }
      }
    }
  } catch (error) {
    retry = !interactive && announce && /^(interaction_required|popup_)/.test(String(error?.message || ""));
    if (!retry) {
      const silent = !interactive && /^(interaction_required|popup_)/.test(String(error?.message || ""));
      if (silent) renderGoogleStatus();
      else {
        const message = googleMessage(error);
        renderGoogleStatus(message);
        if (announce || interactive) showToast(message);
      }
    }
  } finally {
    googleAuth.syncing = false;
    setGoogleBusy(false);
  }
  if (retry) return syncGoogle({ interactive: true, announce });
  if (syncAgain) {
    syncAgain = false;
    maybeSync();
  }
}

function maybeSync() {
  if (!settings.googleClientId || !googleAuth.email) return;
  if (!googleAuth.token || googleAuth.expiresAt <= Date.now() + 60000) return;
  syncGoogle();
}

function unbindGoogle() {
  const token = googleAuth.token;
  googleAuth.token = "";
  googleAuth.expiresAt = 0;
  googleAuth.email = "";
  localStorage.removeItem(GOOGLE_EMAIL_KEY);
  if (token && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(token, () => {});
  }
  renderGoogleStatus("已解除綁定。雲端紀錄還在，重新綁定後可以再同步下來。");
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
    record.camera || "—",
    record.filename || "—",
    mapLink(record) || "—",
    recordLink(record.id),
  ];
}

function mapLink(record) {
  if (!Number.isFinite(record?.lat) || !Number.isFinite(record?.lon)) return "";
  const url = new URL(location.href);
  if (record.kind === "pano") url.hash = `pano=${encodeURIComponent(record.panoOf || "")}`;
  else {
    url.hash = record.spotId
      ? `spot=${encodeURIComponent(record.spotId)}`
      : `map=${encodeURIComponent(record.id)}`;
  }
  return url.href;
}

function panoLink(spotId) {
  const url = new URL(location.href);
  url.hash = `pano=${encodeURIComponent(spotId)}`;
  return url.href;
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
    const syncNote = googleAuth.email ? `已綁定 ${googleAuth.email}。` : "可在設定綁定 Google 後同步。";
    setLogNote(state.logTodayOnly
    ? `今天 ${records.length} 張。${syncNote}`
    : `全部 ${records.length} 張。${syncNote}`);
  for (const record of records) {
    const tr = document.createElement("tr");
    const values = rowValues(record);
    values.forEach((value, index) => {
      const td = document.createElement("td");
      const isLink = typeof value === "string" && /^https?:|^file:/i.test(value);
      if (isLink) {
        const link = document.createElement("a");
        link.href = value;
        link.textContent = index === values.length - 1 ? "開啟" : record.kind === "pano" ? "環景" : "地圖";
        td.append(link);
        if (index !== values.length - 1 && record.spotId && record.kind !== "pano") {
          const panoAnchor = document.createElement("a");
          panoAnchor.href = panoLink(record.spotId);
          panoAnchor.textContent = "環景";
          td.append(document.createTextNode(" "), panoAnchor);
        }
        if (index === values.length - 1) {
          const del = document.createElement("button");
          del.type = "button";
          del.className = "linkish";
          del.dataset.delete = record.id;
          del.textContent = "刪除";
          td.append(del);
        }
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
    maybeSync();
    if (recordIdFromHash() === id) history.replaceState(null, "", `${location.pathname}${location.search}`);
    ui.logPreview.hidden = true;
    await renderLog();
  } catch {
    setLogNote("這筆沒有刪掉。");
  }
});

let mapFromLog = false;
let leafletPromise = null;

function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.append(css);
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve();
    script.onerror = () => {
      leafletPromise = null;
      reject(new Error("leaflet"));
    };
    document.head.append(script);
  });
  return leafletPromise;
}

function clearMapThumbs() {
  for (const url of state.mapUrls) URL.revokeObjectURL(url);
  state.mapUrls = [];
}

function destinationPoint(lat, lon, bearingDeg, distanceM) {
  const radius = 6378137;
  const distance = distanceM / radius;
  const bearing = (bearingDeg * Math.PI) / 180;
  const lat1 = (lat * Math.PI) / 180;
  const lon1 = (lon * Math.PI) / 180;
  const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distance) + Math.cos(lat1) * Math.sin(distance) * Math.cos(bearing));
  const lon2 = lon1 + Math.atan2(
    Math.sin(bearing) * Math.sin(distance) * Math.cos(lat1),
    Math.cos(distance) - Math.sin(lat1) * Math.sin(lat2)
  );
  return [(lat2 * 180) / Math.PI, ((lon2 * 180) / Math.PI + 540) % 360 - 180];
}

function viewCone(lat, lon, heading, fov = 70, meters = 36) {
  const points = [[lat, lon]];
  for (let step = 0; step <= 10; step += 1) {
    points.push(destinationPoint(lat, lon, heading - fov / 2 + (fov * step) / 10, meters));
  }
  return points;
}

function mapRecords(records, focus) {
  const located = records.filter((record) => record.kind !== "pano" && Number.isFinite(record.lat) && Number.isFinite(record.lon));
  if (focus.spotId) return located.filter((record) => record.spotId === focus.spotId);
  if (focus.photoId) {
    const one = located.find((record) => record.id === focus.photoId);
    if (one?.spotId) return located.filter((record) => record.spotId === one.spotId);
    return one ? [one] : [];
  }
  return located;
}

function closeMap() {
  ui.mapScreen.hidden = true;
  clearMapThumbs();
  if (state.leafletMap) {
    state.leafletMap.remove();
    state.leafletMap = null;
  }
  if (/^#(map|spot=)/.test(location.hash)) {
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  }
  if (mapFromLog) {
    mapFromLog = false;
    ui.log.hidden = false;
  }
}

async function openMap(focus = {}, fromHash = false) {
  mapFromLog = !ui.log.hidden || mapFromLog;
  ui.log.hidden = true;
  ui.settings.hidden = true;
  ui.mapScreen.hidden = false;
  if (!fromHash) {
    let hash = "#map";
    if (focus.spotId) hash = `#spot=${encodeURIComponent(focus.spotId)}`;
    else if (focus.photoId) hash = `#map=${encodeURIComponent(focus.photoId)}`;
    if (location.hash !== hash) history.pushState(null, "", hash);
  }
  try {
    await loadLeaflet();
  } catch {
    ui.mapNote.textContent = "地圖需要連線才能載入。";
    return;
  }
  const records = mapRecords(await idbAll(), focus);
  drawMap(records, focus.photoId || "");
}

function drawMap(records, highlightId) {
  clearMapThumbs();
  ui.mapPhotos.replaceChildren();
  const mapSpot = records.find((record) => record.spotId)?.spotId || "";
  ui.mapPano.hidden = !mapSpot;
  ui.mapPano.dataset.spot = mapSpot;
  if (state.leafletMap) {
    state.leafletMap.remove();
    state.leafletMap = null;
  }
  const map = L.map(ui.leaflet, { zoomControl: true });
  state.leafletMap = map;
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);
  if (!records.length) {
    map.setView([23.7, 121], 7);
    ui.mapNote.textContent = "這些照片還沒有坐標，地圖上不會出現。";
    requestAnimationFrame(() => map.invalidateSize());
    return;
  }
  const bounds = [];
  for (const record of records) {
    const selected = record.id === highlightId;
    const heading = Number.isFinite(record.heading) ? record.heading : null;
    const upward = record.direction === "up" || (Number.isFinite(record.pitch) && record.pitch >= 50);
    const downward = record.direction === "down" || (Number.isFinite(record.pitch) && record.pitch <= -50);
    if (heading != null && !upward && !downward) {
      L.polygon(viewCone(record.lat, record.lon, heading, Number.isFinite(record.fovH) ? record.fovH : 70), {
        color: "#e7a322",
        weight: selected ? 3 : 1,
        fillColor: "#e7a322",
        fillOpacity: selected ? 0.45 : 0.28,
      }).addTo(map).bindPopup(`${targetLabel(record.direction) || "視角"} ${formatHeading(heading)}`);
    } else {
      L.circle([record.lat, record.lon], {
        radius: upward ? 18 : 8,
        color: "#e7a322",
        weight: selected ? 3 : 1,
        fillColor: "#e7a322",
        fillOpacity: upward ? 0.18 : 0.35,
      }).addTo(map).bindPopup(upward ? "朝上" : downward ? "朝下" : "沒有方位角");
    }
    bounds.push([record.lat, record.lon]);
    if (record.blob) {
      const url = URL.createObjectURL(record.blob);
      state.mapUrls.push(url);
      const button = document.createElement("button");
      button.type = "button";
      button.classList.toggle("is-on", selected);
      button.title = targetLabel(record.direction) || record.filename || "照片";
      const image = document.createElement("img");
      image.alt = button.title;
      image.src = url;
      button.append(image);
      button.addEventListener("click", () => {
        map.setView([record.lat, record.lon], 18);
      });
      ui.mapPhotos.append(button);
    }
  }
  if (bounds.length === 1) map.setView(bounds[0], 18);
  else map.fitBounds(bounds, { padding: [28, 28], maxZoom: 18 });
  ui.mapNote.textContent = `${records.length} 張有位置。扇形是水平視角，圓形是朝上或朝下。`;
  requestAnimationFrame(() => map.invalidateSize());
}

function handleHash() {
  const hash = location.hash;
  if (/^#record=/.test(hash)) {
    showRecord(recordIdFromHash());
    return;
  }
  if (hash === "#map") {
    openMap({}, true);
    return;
  }
  if (hash.startsWith("#map=")) {
    openMap({ photoId: decodeURIComponent(hash.slice(5)) }, true);
    return;
  }
  if (hash.startsWith("#spot=")) {
    openMap({ spotId: decodeURIComponent(hash.slice(6)) }, true);
    return;
  }
  if (hash.startsWith("#pano=") && typeof openPano === "function") {
    openPano(decodeURIComponent(hash.slice(6)), true);
  }
}

ui.sphereToggle.addEventListener("click", toggleSphere);
ui.sphereRing.addEventListener("click", captureVideo);
ui.sphereFinish.addEventListener("click", finishSphere);
ui.mapPano.addEventListener("click", () => {
  const spot = ui.mapPano.dataset.spot;
  if (spot && typeof openPano === "function") openPano(spot);
});
ui.cameraFov.addEventListener("input", () => {
  settings.cameraFov = Number(ui.cameraFov.value);
  ui.cameraFovLabel.textContent = `${Math.round(settings.cameraFov)}°`;
  saveSettings();
});
ui.logMap.addEventListener("click", () => openMap({}));
ui.googleClient.addEventListener("change", () => {
  settings.googleClientId = ui.googleClient.value.trim();
  saveSettings();
});
ui.googleBind.addEventListener("click", () => {
  settings.googleClientId = ui.googleClient.value.trim();
  saveSettings();
  syncGoogle({ interactive: true, announce: true });
});
ui.googleSync.addEventListener("click", () => {
  settings.googleClientId = ui.googleClient.value.trim();
  saveSettings();
  syncGoogle({ interactive: !googleAuth.token, announce: true });
});
ui.googleUnbind.addEventListener("click", unbindGoogle);
ui.logSync.addEventListener("click", () => {
  if (!settings.googleClientId.trim()) {
    showToast("請先到設定貼上 OAuth 用戶端 ID");
    return;
  }
  syncGoogle({ interactive: !googleAuth.token, announce: true });
});
ui.mapClose.addEventListener("click", closeMap);

window.addEventListener("hashchange", handleHash);

applyGrid();
renderStatus();
renderGoogleStatus();
tickClock();
handleHash();
