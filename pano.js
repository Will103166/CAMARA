/* 環景：把同一個點位的照片依方向組成球形全景，並在手機與電腦上轉動觀看。 */

const pui = {
  screen: document.getElementById("pano-screen"),
  canvas: document.getElementById("pano-canvas"),
  close: document.getElementById("pano-close"),
  info: document.getElementById("pano-info"),
  map: document.getElementById("pano-map"),
  status: document.getElementById("pano-status"),
  gyro: document.getElementById("pano-gyro"),
  mapOpen: document.getElementById("pano-map-open"),
  save: document.getElementById("pano-save"),
  rebuild: document.getElementById("pano-rebuild"),
  seam: document.getElementById("pano-fovscale"),
};

const pano = {
  open: false,
  spotId: "",
  token: 0,
  gl: null,
  program: null,
  uniforms: null,
  texture: null,
  hasTexture: false,
  yaw: 0,
  pitch: 0,
  fov: 75,
  frame: 0,
  gyro: false,
  gyroSince: 0,
  blob: null,
  filename: "時間相機_全景.jpg",
  shotCount: 0,
  lat: null,
  lon: null,
  map: null,
  cone: null,
  mapAt: 0,
  mapYaw: -999,
  mapFov: -999,
  pointers: new Map(),
  pinch: 0,
  statusTimer: 0,
  busy: false,
};

const PANO_VERT = `attribute vec2 aPos;
varying vec2 vUv;
varying vec2 vNdc;
void main() {
  vNdc = aPos;
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const PANO_STITCH_FRAG = `precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform vec3 uF;
uniform vec3 uU;
uniform vec3 uR;
uniform vec2 uTan;
uniform float uGain;
const float PI = 3.14159265358979;
void main() {
  float lon = (vUv.x - 0.5) * 2.0 * PI;
  float lat = (0.5 - vUv.y) * PI;
  vec3 d = vec3(sin(lon) * cos(lat), cos(lon) * cos(lat), sin(lat));
  float cz = dot(d, uF);
  vec2 p = vec2(dot(d, uR), dot(d, uU)) / max(cz, 0.0001) / uTan;
  vec2 uv = vec2(p.x * 0.5 + 0.5, 0.5 - p.y * 0.5);
  vec3 col = texture2D(uTex, clamp(uv, 0.002, 0.998)).rgb * uGain;
  float edge = 1.0 - max(abs(p.x), abs(p.y));
  if (cz <= 0.02 || edge <= 0.0) discard;
  gl_FragColor = vec4(col, smoothstep(0.0, 0.2, edge));
}`;

const PANO_VIEW_FRAG = `precision highp float;
varying vec2 vNdc;
uniform sampler2D uTex;
uniform vec2 uTan;
uniform float uYaw;
uniform float uPitch;
const float PI = 3.14159265358979;
void main() {
  vec3 r = normalize(vec3(vNdc.x * uTan.x, vNdc.y * uTan.y, 1.0));
  float cp = cos(uPitch);
  float sp = sin(uPitch);
  vec3 w = vec3(r.x, -r.y * sp + r.z * cp, r.y * cp + r.z * sp);
  float cy = cos(uYaw);
  float sy = sin(uYaw);
  vec3 d = vec3(w.x * cy + w.y * sy, -w.x * sy + w.y * cy, w.z);
  float lon = atan(d.x, d.y);
  float lat = asin(clamp(d.z, -1.0, 1.0));
  gl_FragColor = texture2D(uTex, vec2(lon / (2.0 * PI) + 0.5, 0.5 - lat / PI));
}`;

function isPanoOpen() {
  return pano.open;
}

function panoClamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalize3(v) {
  const length = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / length, v[1] / length, v[2] / length];
}

function rotateAz(v, deltaDeg) {
  const c = Math.cos(deltaDeg * DEG);
  const s = Math.sin(deltaDeg * DEG);
  return [v[0] * c + v[1] * s, -v[0] * s + v[1] * c, v[2]];
}

function setPanoStatus(message, hideAfter = 0) {
  clearTimeout(pano.statusTimer);
  if (!message) {
    pui.status.hidden = true;
    return;
  }
  pui.status.textContent = message;
  pui.status.hidden = false;
  if (hideAfter) pano.statusTimer = setTimeout(() => { pui.status.hidden = true; }, hideAfter);
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "shader");
  }
  return shader;
}

function buildProgram(gl, fragSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, PANO_VERT));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragSource));
  gl.bindAttribLocation(program, 0, "aPos");
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "link");
  }
  return program;
}

function bindQuad(gl) {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
}

function setupTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return texture;
}

async function loadBitmap(blob) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(blob);
    } catch {
      /* 改用 Image */
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
}

function bitmapSize(bitmap) {
  return { width: bitmap.naturalWidth || bitmap.width, height: bitmap.naturalHeight || bitmap.height };
}

function meanLuma(bitmap) {
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, 24, 24);
  const data = ctx.getImageData(0, 0, 24, 24).data;
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  return sum / (data.length / 4) / 255;
}

function basisFor(record, width, height) {
  let f = null;
  let u = null;
  const yawFix = Number.isFinite(record.yawFix) ? record.yawFix : 0;
  if (Array.isArray(record.rot) && record.rot.length === 6 && record.rot.every(Number.isFinite)) {
    f = rotateAz(record.rot.slice(0, 3), yawFix);
    u = rotateAz(record.rot.slice(3), yawFix);
  } else if (Number.isFinite(record.nomPitch) && !Number.isFinite(record.heading)) {
    const az = Number.isFinite(record.nomAz) ? record.nomAz : 0;
    f = dirVector(az, record.nomPitch);
    u = dirVector(az, record.nomPitch + 90);
  } else if (Number.isFinite(record.heading) && Number.isFinite(record.pitch)) {
    f = dirVector(record.heading, record.pitch);
    u = dirVector(record.heading, record.pitch + 90);
  }
  if (!f || !u) return null;
  f = normalize3(f);
  const along = dot3(u, f);
  u = normalize3([u[0] - f[0] * along, u[1] - f[1] * along, u[2] - f[2] * along]);
  let fovH = record.fovH;
  let fovV = record.fovV;
  if (!Number.isFinite(fovH) || !Number.isFinite(fovV)) {
    const focal = Math.max(width, height) / 2 / Math.tan((settings.cameraFov * DEG) / 2);
    fovH = (2 * Math.atan(width / 2 / focal)) / DEG;
    fovV = (2 * Math.atan(height / 2 / focal)) / DEG;
  }
  return { f, u, r: cross3(f, u), fovH, fovV };
}

function pickStitchSize(gl) {
  const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
  let width = max >= 4096 ? 4096 : max >= 2048 ? 2048 : 1024;
  if (gl.drawingBufferWidth && gl.drawingBufferWidth < width) {
    width = gl.drawingBufferWidth >= 2048 ? 2048 : 1024;
  }
  return width;
}

async function composePano(shots, scale, onProgress) {
  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const options = { preserveDrawingBuffer: true, alpha: false, antialias: false, depth: false };
  const gl = canvas.getContext("webgl", options) || canvas.getContext("experimental-webgl", options);
  if (!gl) throw new Error("webgl");
  const width = pickStitchSize(gl);
  canvas.width = width;
  canvas.height = width / 2;
  gl.viewport(0, 0, width, width / 2);
  gl.clearColor(0.11, 0.1, 0.085, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  const program = buildProgram(gl, PANO_STITCH_FRAG);
  gl.useProgram(program);
  bindQuad(gl);
  const loc = (name) => gl.getUniformLocation(program, name);
  const uTex = loc("uTex");
  const uF = loc("uF");
  const uU = loc("uU");
  const uR = loc("uR");
  const uTan = loc("uTan");
  const uGain = loc("uGain");
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  const ordered = [...shots].sort((a, b) => String(a.takenAt).localeCompare(String(b.takenAt)));
  const items = [];
  let skipped = 0;
  for (let i = 0; i < ordered.length; i += 1) {
    onProgress?.(`讀取照片 ${i + 1}/${ordered.length}`);
    const shot = ordered[i];
    let bitmap = null;
    try {
      bitmap = await loadBitmap(shot.blob);
    } catch {
      skipped += 1;
      continue;
    }
    const size = bitmapSize(bitmap);
    const basis = basisFor(shot, size.width, size.height);
    if (!basis) {
      skipped += 1;
      bitmap.close?.();
      continue;
    }
    items.push({ bitmap, size, basis, luma: meanLuma(bitmap) });
  }
  if (!items.length) throw new Error("no-basis");
  const meanAll = items.reduce((sum, item) => sum + item.luma, 0) / items.length;

  const scratch = document.createElement("canvas");
  const scratchCtx = scratch.getContext("2d");
  scratchCtx.imageSmoothingQuality = "high";
  const texture = setupTexture(gl);
  gl.activeTexture(gl.TEXTURE0);
  gl.uniform1i(uTex, 0);
  for (let i = 0; i < items.length; i += 1) {
    onProgress?.(`組合 ${i + 1}/${items.length}`);
    const { bitmap, size, basis, luma } = items[i];
    const targetW = panoClamp(Math.round(width * (basis.fovH / 360) * 1.4), 256, size.width);
    scratch.width = targetW;
    scratch.height = Math.max(1, Math.round((targetW * size.height) / size.width));
    scratchCtx.drawImage(bitmap, 0, 0, scratch.width, scratch.height);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
    gl.uniform3fv(uF, basis.f);
    gl.uniform3fv(uU, basis.u);
    gl.uniform3fv(uR, basis.r);
    gl.uniform2f(
      uTan,
      Math.tan((basis.fovH * DEG) / 2) * scale,
      Math.tan((basis.fovV * DEG) / 2) * scale
    );
    gl.uniform1f(uGain, panoClamp(meanAll / Math.max(0.02, luma), 0.85, 1.18));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    bitmap.close?.();
    if (i % 4 === 3) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  gl.finish();
  return { canvas, count: items.length, skipped, lose: () => gl.getExtension("WEBGL_lose_context")?.loseContext() };
}

async function withPanoXmp(blob, width, height) {
  const input = new Uint8Array(await blob.arrayBuffer());
  if (input[0] !== 0xff || input[1] !== 0xd8) return blob;
  const xml = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:GPano="http://ns.google.com/photos/1.0/panorama/"><GPano:UsePanoramaViewer>True</GPano:UsePanoramaViewer><GPano:ProjectionType>equirectangular</GPano:ProjectionType><GPano:FullPanoWidthPixels>${width}</GPano:FullPanoWidthPixels><GPano:FullPanoHeightPixels>${height}</GPano:FullPanoHeightPixels><GPano:CroppedAreaImageWidthPixels>${width}</GPano:CroppedAreaImageWidthPixels><GPano:CroppedAreaImageHeightPixels>${height}</GPano:CroppedAreaImageHeightPixels><GPano:CroppedAreaLeftPixels>0</GPano:CroppedAreaLeftPixels><GPano:CroppedAreaTopPixels>0</GPano:CroppedAreaTopPixels><GPano:PoseHeadingDegrees>0</GPano:PoseHeadingDegrees></rdf:Description></rdf:RDF></x:xmpmeta>`;
  const encoder = new TextEncoder();
  const header = encoder.encode("http://ns.adobe.com/xap/1.0/\0");
  const body = encoder.encode(xml);
  const length = 2 + header.length + body.length;
  if (length > 65535) return blob;
  const segment = new Uint8Array(2 + length);
  segment[0] = 0xff;
  segment[1] = 0xe1;
  segment[2] = length >> 8;
  segment[3] = length & 255;
  segment.set(header, 4);
  segment.set(body, 4 + header.length);
  const out = new Uint8Array(input.length + segment.length);
  out[0] = 0xff;
  out[1] = 0xd8;
  out.set(segment, 2);
  out.set(input.subarray(2), 2 + segment.length);
  return new Blob([out], { type: "image/jpeg" });
}

function averagePosition(records) {
  const located = records.filter((record) => Number.isFinite(record.lat) && Number.isFinite(record.lon));
  if (!located.length) return { lat: null, lon: null };
  return {
    lat: located.reduce((sum, record) => sum + record.lat, 0) / located.length,
    lon: located.reduce((sum, record) => sum + record.lon, 0) / located.length,
  };
}

async function buildPano(spotId, shots, scale) {
  setPanoStatus("組合中…");
  const result = await composePano(shots, scale, (text) => setPanoStatus(`組合中… ${text}`));
  let blob = await new Promise((resolve, reject) => {
    result.canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("blob"))), "image/jpeg", 0.9);
  });
  const pixelWidth = result.canvas.width;
  const pixelHeight = result.canvas.height;
  result.lose();
  blob = await withPanoXmp(blob, pixelWidth, pixelHeight);
  const position = averagePosition(shots);
  const built = new Date();
  try {
    blob = await withExif(blob, {
      when: exifDate(built),
      model: "TimeCam Panorama",
      width: pixelWidth,
      height: pixelHeight,
      lat: position.lat,
      lon: position.lon,
    });
  } catch {
    /* 位置寫不進檔案時，仍保留全景圖 */
  }
  const first = [...shots].sort((a, b) => String(a.takenAt).localeCompare(String(b.takenAt)))[0] || {};
  const filename = filenameFor(built).replace("時間相機_", "時間相機_全景_");
  const record = {
    id: `pano-${spotId}-${built.getTime().toString(36)}`,
    kind: "pano",
    panoOf: spotId,
    takenAt: built.toISOString(),
    place: first.place || "",
    lat: position.lat,
    lon: position.lon,
    weather: first.weather || "",
    heading: null,
    pitch: null,
    altitude: Number.isFinite(first.altitude) ? first.altitude : null,
    camera: `全景 ${result.count} 張`,
    direction: "",
    spotId: "",
    filename,
    source: "環景",
    shots: result.count,
    blob,
  };
  const all = await idbAll();
  for (const old of all.filter((item) => item.kind === "pano" && item.panoOf === spotId)) {
    await idbDelete(old.id);
  }
  await idbPut(record);
  maybeSync();
  return { record, count: result.count, skipped: result.skipped };
}

function ensureViewerGl() {
  if (pano.gl) return pano.gl;
  const options = { antialias: false, alpha: false, depth: false, preserveDrawingBuffer: false };
  const gl = pui.canvas.getContext("webgl", options) || pui.canvas.getContext("experimental-webgl", options);
  if (!gl) throw new Error("webgl");
  const program = buildProgram(gl, PANO_VIEW_FRAG);
  gl.useProgram(program);
  bindQuad(gl);
  pano.gl = gl;
  pano.program = program;
  pano.uniforms = {
    tex: gl.getUniformLocation(program, "uTex"),
    tan: gl.getUniformLocation(program, "uTan"),
    yaw: gl.getUniformLocation(program, "uYaw"),
    pitch: gl.getUniformLocation(program, "uPitch"),
  };
  pano.texture = setupTexture(gl);
  return gl;
}

async function uploadEquirect(blob) {
  const gl = ensureViewerGl();
  let source = await loadBitmap(blob);
  const size = bitmapSize(source);
  const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 2048;
  if (size.width > max) {
    const scaled = document.createElement("canvas");
    scaled.width = max;
    scaled.height = Math.round((max * size.height) / size.width);
    scaled.getContext("2d").drawImage(source, 0, 0, scaled.width, scaled.height);
    source.close?.();
    source = scaled;
  }
  gl.bindTexture(gl.TEXTURE_2D, pano.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  source.close?.();
  pano.hasTexture = true;
}

function requestPanoDraw() {
  if (!pano.frame && pano.open) pano.frame = requestAnimationFrame(drawPano);
}

function drawPano() {
  pano.frame = 0;
  if (!pano.open || !pano.gl || !pano.hasTexture) return;
  if (pano.gyro) {
    if (state.rot) {
      const f = state.rot.f;
      const targetYaw = Math.atan2(f[0], f[1]) / DEG + (Number.isFinite(state.yawFix) ? state.yawFix : 0);
      const targetPitch = Math.asin(panoClamp(f[2], -1, 1)) / DEG;
      pano.yaw += wrap180(targetYaw - pano.yaw) * 0.35;
      pano.pitch += (targetPitch - pano.pitch) * 0.35;
    } else if (performance.now() - pano.gyroSince > 1800) {
      stopPanoGyro();
      setPanoStatus("這台裝置沒有方向感應器，請改用拖曳", 2600);
    }
  }
  pano.yaw = ((pano.yaw % 360) + 360) % 360;
  pano.pitch = panoClamp(pano.pitch, -89, 89);
  const gl = pano.gl;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.round(pui.canvas.clientWidth * dpr));
  const height = Math.max(1, Math.round(pui.canvas.clientHeight * dpr));
  if (pui.canvas.width !== width || pui.canvas.height !== height) {
    pui.canvas.width = width;
    pui.canvas.height = height;
  }
  gl.viewport(0, 0, width, height);
  gl.useProgram(pano.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, pano.texture);
  gl.uniform1i(pano.uniforms.tex, 0);
  const tanV = Math.tan((pano.fov * DEG) / 2);
  gl.uniform2f(pano.uniforms.tan, tanV * (width / height), tanV);
  gl.uniform1f(pano.uniforms.yaw, pano.yaw * DEG);
  gl.uniform1f(pano.uniforms.pitch, pano.pitch * DEG);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  updatePanoInfo(width / height);
  if (pano.gyro) requestPanoDraw();
}

function updatePanoInfo(aspect) {
  const text = `${pano.shotCount} 張 · 朝向 ${Math.round(pano.yaw)}° · 拖曳轉動，滾輪或雙指縮放`;
  if (pui.info.textContent !== text) pui.info.textContent = text;
  if (!pano.cone) return;
  const hfov = (2 * Math.atan(Math.tan((pano.fov * DEG) / 2) * aspect)) / DEG;
  const now = performance.now();
  if (now - pano.mapAt < 90) return;
  if (Math.abs(wrap180(pano.yaw - pano.mapYaw)) < 1 && Math.abs(hfov - pano.mapFov) < 1) return;
  pano.mapAt = now;
  pano.mapYaw = pano.yaw;
  pano.mapFov = hfov;
  pano.cone.setLatLngs(viewCone(pano.lat, pano.lon, pano.yaw, Math.min(150, hfov), 60));
}

async function setupPanoMap() {
  if (pano.map) {
    pano.map.remove();
    pano.map = null;
    pano.cone = null;
  }
  if (!Number.isFinite(pano.lat) || !Number.isFinite(pano.lon)) {
    pui.map.hidden = true;
    return;
  }
  pui.map.hidden = false;
  try {
    await loadLeaflet();
  } catch {
    pui.map.hidden = true;
    return;
  }
  if (!pano.open) return;
  const map = L.map(pui.map, { zoomControl: false, attributionControl: false, scrollWheelZoom: false });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
  map.setView([pano.lat, pano.lon], 18);
  L.circleMarker([pano.lat, pano.lon], {
    radius: 6,
    color: "#fff",
    weight: 2,
    fillColor: "#e7a322",
    fillOpacity: 1,
  }).addTo(map);
  pano.cone = L.polygon(viewCone(pano.lat, pano.lon, pano.yaw, 60, 60), {
    color: "#e7a322",
    weight: 1,
    fillColor: "#e7a322",
    fillOpacity: 0.4,
  }).addTo(map);
  pano.map = map;
  pano.mapYaw = -999;
  requestAnimationFrame(() => map.invalidateSize());
  requestPanoDraw();
}

function stopPanoGyro() {
  pano.gyro = false;
  pui.gyro.classList.remove("is-on");
  pui.gyro.setAttribute("aria-pressed", "false");
}

function panoShots(all, spotId) {
  return all.filter((record) => record.spotId === spotId && record.kind !== "pano" && record.blob);
}

function latestPano(all, spotId) {
  return all
    .filter((record) => record.kind === "pano" && record.panoOf === spotId && record.blob)
    .sort((a, b) => String(b.takenAt).localeCompare(String(a.takenAt)))[0] || null;
}

function panoErrorText(error) {
  const code = String(error?.message || "");
  if (code === "webgl") return "這個瀏覽器不支援 WebGL，無法顯示全景。";
  if (code === "no-basis") return "這些照片沒有方向資料，無法組合。請用環景模式重拍。";
  return "全景組合失敗，請再按一次重新組合。";
}

async function openPano(spotId, fromHash = false) {
  if (!spotId) return;
  const token = pano.token + 1;
  pano.token = token;
  pano.spotId = spotId;
  pano.open = true;
  pano.hasTexture = false;
  pui.screen.hidden = false;
  pui.info.textContent = "讀取照片…";
  stopPanoGyro();
  if (!fromHash) {
    const hash = `#pano=${encodeURIComponent(spotId)}`;
    if (location.hash !== hash) history.pushState(null, "", hash);
  }
  setPanoStatus("讀取照片…");
  try {
    const all = await idbAll();
    const shots = panoShots(all, spotId);
    const cached = latestPano(all, spotId);
    const position = averagePosition(shots.length ? shots : cached ? [cached] : []);
    pano.lat = position.lat;
    pano.lon = position.lon;
    let blob = null;
    let count = shots.length;
    if (cached && cached.shots >= shots.length) {
      blob = cached.blob;
      pano.filename = cached.filename || pano.filename;
      count = cached.shots;
    } else if (shots.length) {
      const built = await buildPano(spotId, shots, Number(pui.seam.value) || 1);
      if (token !== pano.token) return;
      blob = built.record.blob;
      pano.filename = built.record.filename;
      count = built.count;
      if (built.skipped) setPanoStatus(`有 ${built.skipped} 張沒有方向資料，沒放進全景`, 3200);
    }
    if (!blob) {
      setPanoStatus("這台裝置沒有這個點位的照片。請先到設定按「立即同步」。");
      pui.info.textContent = "找不到照片";
      return;
    }
    if (token !== pano.token) return;
    pano.blob = blob;
    pano.shotCount = count;
    await uploadEquirect(blob);
    if (token !== pano.token) return;
    pano.yaw = 0;
    pano.pitch = 0;
    pano.fov = 75;
    if (!pui.status.textContent.startsWith("有 ")) setPanoStatus("");
    requestPanoDraw();
    setupPanoMap();
  } catch (error) {
    setPanoStatus(panoErrorText(error));
    pui.info.textContent = "無法顯示";
  }
}

async function rebuildPano() {
  if (!pano.open || !pano.spotId || pano.busy) return;
  pano.busy = true;
  const token = pano.token;
  try {
    const all = await idbAll();
    const shots = panoShots(all, pano.spotId);
    if (!shots.length) {
      setPanoStatus("這台裝置沒有可組合的照片", 2600);
      return;
    }
    const built = await buildPano(pano.spotId, shots, Number(pui.seam.value) || 1);
    if (token !== pano.token) return;
    pano.blob = built.record.blob;
    pano.filename = built.record.filename;
    pano.shotCount = built.count;
    await uploadEquirect(pano.blob);
    setPanoStatus(built.skipped ? `有 ${built.skipped} 張沒有方向資料，沒放進全景` : "", built.skipped ? 3200 : 0);
    requestPanoDraw();
  } catch (error) {
    setPanoStatus(panoErrorText(error), 3600);
  } finally {
    pano.busy = false;
  }
}

function closePano() {
  pano.open = false;
  pano.token += 1;
  pui.screen.hidden = true;
  if (pano.frame) cancelAnimationFrame(pano.frame);
  pano.frame = 0;
  pano.pointers.clear();
  stopPanoGyro();
  setPanoStatus("");
  if (pano.map) {
    pano.map.remove();
    pano.map = null;
    pano.cone = null;
  }
  pui.map.hidden = true;
  if (/^#pano=/.test(location.hash)) {
    history.replaceState(null, "", `${location.pathname}${location.search}`);
  }
}

function savePanoImage() {
  if (!pano.blob) return;
  const url = URL.createObjectURL(pano.blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = pano.filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function pointerDistance() {
  const [a, b] = [...pano.pointers.values()];
  return Math.hypot(a.x - b.x, a.y - b.y);
}

pui.canvas.addEventListener("pointerdown", (event) => {
  pui.canvas.setPointerCapture(event.pointerId);
  pano.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pano.pointers.size === 2) pano.pinch = pointerDistance();
  if (pano.gyro) stopPanoGyro();
});

pui.canvas.addEventListener("pointermove", (event) => {
  const last = pano.pointers.get(event.pointerId);
  if (!last) return;
  const dx = event.clientX - last.x;
  const dy = event.clientY - last.y;
  pano.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
  if (pano.pointers.size >= 2) {
    const distance = pointerDistance();
    if (pano.pinch > 0 && distance > 0) {
      pano.fov = panoClamp((pano.fov * pano.pinch) / distance, 30, 110);
    }
    pano.pinch = distance;
  } else {
    const degPerPx = pano.fov / Math.max(1, pui.canvas.clientHeight);
    pano.yaw -= dx * degPerPx;
    pano.pitch += dy * degPerPx;
  }
  requestPanoDraw();
});

function endPointer(event) {
  pano.pointers.delete(event.pointerId);
  pano.pinch = pano.pointers.size >= 2 ? pointerDistance() : 0;
}

pui.canvas.addEventListener("pointerup", endPointer);
pui.canvas.addEventListener("pointercancel", endPointer);

pui.canvas.addEventListener("wheel", (event) => {
  event.preventDefault();
  pano.fov = panoClamp(pano.fov * Math.exp(event.deltaY * 0.0012), 30, 110);
  requestPanoDraw();
}, { passive: false });

window.addEventListener("resize", () => requestPanoDraw());

pui.close.addEventListener("click", closePano);
pui.save.addEventListener("click", savePanoImage);
pui.rebuild.addEventListener("click", rebuildPano);
pui.seam.addEventListener("change", rebuildPano);
pui.mapOpen.addEventListener("click", () => {
  const spotId = pano.spotId;
  closePano();
  openMap({ spotId });
});
pui.gyro.addEventListener("click", async () => {
  if (pano.gyro) {
    stopPanoGyro();
    return;
  }
  await enableLevel();
  pano.gyro = true;
  pano.gyroSince = performance.now();
  pui.gyro.classList.add("is-on");
  pui.gyro.setAttribute("aria-pressed", "true");
  requestPanoDraw();
});

if (location.hash.startsWith("#pano=")) {
  openPano(decodeURIComponent(location.hash.slice(6)), true);
}
