const FONT = '"Noto Sans TC", "Microsoft JhengHei", sans-serif';
const WEEKDAYS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];

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

const $ = (id) => document.getElementById(id);

const ui = {
  gate: $("gate"),
  camera: $("camera"),
  result: $("result"),
  start: $("start"),
  demo: $("demo"),
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
};

let deferredInstall = null;

function pad(value) {
  return String(value).padStart(2, "0");
}

function formatWhen(date) {
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}  ${WEEKDAYS[date.getDay()]}  ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatClock(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatCoords(lat, lon) {
  const latHem = lat >= 0 ? "N" : "S";
  const lonHem = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(6)}°${latHem}  ${Math.abs(lon).toFixed(6)}°${lonHem}`;
}

function filenameFor(date) {
  return `時間相機_${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}.jpg`;
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
  if (state.coords) {
    bits.push(formatCoords(state.coords.lat, state.coords.lon));
    if (Number.isFinite(state.coords.accuracy)) {
      bits.push(`約 ±${Math.round(state.coords.accuracy)} 公尺`);
    }
  }
  if (state.place) bits.push(state.place);
  if (state.weather) bits.push(state.weather);
  ui.hudMeta.textContent = bits.length
    ? bits.join("\n")
    : "預覽，按下快門後才寫入照片";
}

function tickClock() {
  ui.hudClock.textContent = formatClock(new Date());
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
    const text = String(part || "").trim();
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

async function readJson(url) {
  const response = await fetch(url, { referrerPolicy: "no-referrer" });
  if (!response.ok) throw new Error(String(response.status));
  return response.json();
}

function preferLocal(country, parts) {
  const local = joinPlace(parts);
  if (!local) return String(country || "").trim();
  if (/中華民國|台灣|臺灣|^taiwan$/i.test(String(country || "").trim())) return local;
  return joinPlace([country, ...parts]);
}

async function reverseGeocode(lat, lon) {
  try {
    const data = await readJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=zh`
    );
    const place = preferLocal(data.countryName, [
      data.principalSubdivision,
      data.city,
      data.locality,
    ]);
    if (place) return place;
  } catch {
    /* try the next geocoder */
  }

  try {
    const data = await readJson(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=zh-TW`
    );
    const address = data.address || {};
    return preferLocal(address.country, [
      address.state,
      address.city || address.county || address.town,
      address.city_district || address.suburb || address.neighbourhood,
      address.road,
    ]);
  } catch {
    return "";
  }
}

async function fetchWeather(lat, lon) {
  try {
    const data = await readJson(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    );
    const current = data.current || {};
    const label = WEATHER[current.weather_code] || "天氣";
    if (!Number.isFinite(current.temperature_2m)) return "";
    return `${label}  ${Math.round(current.temperature_2m)}°C`;
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
  state.place = place;
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
      ui.preview.classList.toggle("mirror", facing === "user");
      await ui.preview.play();
      ui.shutter.disabled = false;
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("camera");
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

function drawCover(ctx, source, sourceWidth, sourceHeight, width, height, mirror) {
  ctx.save();
  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, 0, 0, sourceWidth, sourceHeight, 0, 0, width, height);
  ctx.restore();
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
    await document.fonts.load(`700 48px ${FONT}`);
  } catch {
    /* system font still draws */
  }
}

function drawStamp(canvas, info) {
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const scale = Math.min(width, height) / 1080;
  const padX = 36 * scale;
  const maxWidth = width - padX * 2 - 28 * scale;
  const prepared = [];

  const pushLine = (text, size, weight, color, maxLines) => {
    ctx.font = `${weight} ${size}px ${FONT}`;
    for (const line of wrapText(ctx, text, maxWidth, maxLines)) {
      prepared.push({ text: line, size, weight, color });
    }
  };

  pushLine(info.when, 46 * scale, 700, "#fff8e8", 2);
  if (info.place) pushLine(info.place, 34 * scale, 500, "#ffffff", 2);
  if (info.coords) pushLine(info.coords, 28 * scale, 500, "#f4ecdc", 1);
  if (info.weather) pushLine(info.weather, 32 * scale, 700, "#ffe08a", 1);
  if (info.note) pushLine(info.note, 28 * scale, 500, "#ffd7cc", 2);

  const gap = 10 * scale;
  const textHeight = prepared.reduce((sum, line) => sum + line.size + gap, 0);
  const blockTop = height - textHeight - 42 * scale;
  const fadeHeight = textHeight + 150 * scale;
  const fade = ctx.createLinearGradient(0, height - fadeHeight, 0, height);
  fade.addColorStop(0, "rgba(8, 7, 5, 0)");
  fade.addColorStop(0.42, "rgba(8, 7, 5, 0.55)");
  fade.addColorStop(1, "rgba(8, 7, 5, 0.84)");
  ctx.fillStyle = fade;
  ctx.fillRect(0, height - fadeHeight, width, fadeHeight);

  ctx.fillStyle = "#e7a322";
  ctx.fillRect(padX, blockTop, 5 * scale, Math.max(24 * scale, textHeight - 16 * scale));

  let y = blockTop;
  for (const line of prepared) {
    y += line.size;
    ctx.font = `${line.weight} ${line.size}px ${FONT}`;
    ctx.fillStyle = line.color;
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 8 * scale;
    ctx.fillText(line.text, padX + 18 * scale, y);
    ctx.shadowBlur = 0;
    y += gap;
  }
}

function stampInfo(when) {
  const info = { when: formatWhen(when) };
  if (state.coords) {
    info.coords = formatCoords(state.coords.lat, state.coords.lon);
    if (state.place) info.place = state.place;
    if (state.weather) info.weather = state.weather;
    if (!state.place && !state.weather) info.note = "地點與天氣暫時查不到";
  } else {
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
  const when = new Date();
  try {
    const canvas = makeCanvas(width, height);
    drawCover(
      canvas.getContext("2d"),
      ui.preview,
      width,
      height,
      canvas.width,
      canvas.height,
      state.facing === "user"
    );
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
    drawCover(canvas.getContext("2d"), bitmap, bitmap.width, bitmap.height, canvas.width, canvas.height, false);
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

function drawDemoScene() {
  const canvas = makeCanvas(1080, 1440);
  const ctx = canvas.getContext("2d");
  const { width, height } = canvas;
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#7eafc4");
  sky.addColorStop(0.42, "#e4c59a");
  sky.addColorStop(0.58, "#c56b45");
  sky.addColorStop(1, "#241c18");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#f3d48a";
  ctx.beginPath();
  ctx.arc(width * 0.74, height * 0.24, width * 0.07, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#1a1613";
  ctx.fillRect(0, height * 0.7, width, height * 0.3);
  ctx.fillStyle = "#2c2723";
  const towerX = width * 0.46;
  const towerW = width * 0.1;
  ctx.fillRect(towerX, height * 0.36, towerW, height * 0.34);
  ctx.beginPath();
  ctx.moveTo(towerX, height * 0.4);
  ctx.lineTo(towerX + towerW / 2, height * 0.3);
  ctx.lineTo(towerX + towerW, height * 0.4);
  ctx.fill();
  return canvas;
}

async function runDemo() {
  if (state.busy) return;
  state.busy = true;
  ui.demo.disabled = true;
  ui.demo.textContent = "查詢台北101的天氣與地址…";
  try {
    state.coords = { lat: 25.033964, lon: 121.564472, accuracy: null };
    state.locationError = "";
    state.place = "";
    state.weather = "";
    await refreshContext(state.coords.lat, state.coords.lon, true);
    const when = new Date();
    const canvas = drawDemoScene();
    await ensureFonts();
    drawStamp(canvas, stampInfo(when));
    await present(canvas, when, "台北101示範圖");
  } catch {
    show("gate");
    ui.gateNote.textContent = "示範沒有完成。請確認可以連線後再試一次。";
  } finally {
    state.busy = false;
    ui.demo.disabled = false;
    ui.demo.textContent = "看台北101示範";
  }
}

function downloadBlob() {
  if (!state.blob) return;
  const link = document.createElement("a");
  link.href = state.objectUrl;
  link.download = state.filename;
  link.click();
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
  tickClock();
  clearInterval(state.clockTimer);
  state.clockTimer = setInterval(tickClock, 250);
  startLocation();
  renderStatus();
  try {
    await openCamera(state.facing);
  } catch {
    ui.shutter.disabled = true;
    showToast("無法開啟相機。可以改按「相簿」選一張照片，仍會寫入時間與定位。");
  }
}

ui.start.addEventListener("click", onStart);
ui.demo.addEventListener("click", runDemo);
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

ui.save.addEventListener("click", downloadBlob);
ui.share.addEventListener("click", shareBlob);

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" && !ui.camera.hidden) {
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

renderStatus();
