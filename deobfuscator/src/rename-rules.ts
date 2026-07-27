import type { RenameRule } from "./steps/rename-identifiers.js";

export const defaultRenameRules: RenameRule[] = [
  { name: 'FINGERPRINT_KEY_ORDER', keywords: ['dg', 'dO4', 'b-I2rx-E', 'YdFB', 'YtFF'], optional: true },
  { name: 'GAME1_URL', keywords: ['"https://gameforge.com/tra/game1.js";'], optional: true },

  // { name: 'fetchServerTime', keywords: ['XMLHttpRequest', 'getResponseHeader'], allowOverwrite: true },
  { name: 'getAudioFingerprint', keywords: ['OfflineAudioContext', 'createDynamicsCompressor'] },
  { name: 'renderAudioPromise', keywords: ['startRendering', 'oncomplete'] },
  { name: 'createError', keywords: ['new Error(', '.name ='] },
  // { name: 'sumAudioChannelData', keywords: ['Math.abs'] }, // too generic — Math.abs appears in many functions
  { name: 'hashSHA256', keywords: ['unescape(encodeURI(', '0x100000000'] },
  { name: 'collectFingerprint', keywords: ['Intl.DateTimeFormat', 'deviceMemory'] },
  { name: 'getWebglCanvasFingerprint', keywords: ['VERTEX_SHADER', 'FRAGMENT_SHADER', 'drawArrays', 'readPixels'] },
  { name: 'getCanvas2dFingerprint', keywords: ['toDataURL', 'fillText', 'shadowBlur'] },
  { name: 'detectFonts', keywords: ['offsetWidth', 'offsetHeight', 'fontFamily', 'monospace'] },
  { name: 'detectAutomation', keywords: ['navigator.webdriver', '$cdc_', '__playwright'], optional: true },
  { name: 'detectOS', keywords: ['navigator.userAgent', 'Windows', 'Linux', 'Android', 'iOS'] },
  { name: 'detectBrowser', keywords: ['navigator.userAgent', 'Chrome', 'Firefox', 'Safari', 'Opera'] },
  { name: 'getWebglInfo', keywords: ['WEBGL_debug_renderer_info', 'UNMASKED_VENDOR_WEBGL', 'UNMASKED_RENDERER_WEBGL'] },
  { name: 'getAudioContextProps', keywords: ['new AudioContext', 'sampleRate', 'channelCount'] },
  { name: 'enumerateMediaDevices', keywords: ['enumerateDevices', 'mediaDevices', 'kind'], optional: true },
  { name: 'getBrowserPlugins', keywords: ['navigator.plugins', '.name'] },
  { name: 'detectVideoCodecs', keywords: ['canPlayType', "video/webm", "video/ogg"] },
  { name: 'detectAudioCodecs', keywords: ['canPlayType', "audio/ogg", "audio/webm"] },
  { name: 'checkPermissions', keywords: ['permissions.query', 'accelerometer', 'camera'] },
  { name: 'generateRandomString', keywords: ['Math.random', 'toString(36)', 'substr'] },
  { name: 'orderFingerprintKeys', keywords: ['FINGERPRINT_KEY_ORDER.forEach'], optional: true },
  { name: 'encodeFingerprintHash', keywords: ['encodeURIComponent', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_='] },

  { name: 'detectedOS', keywords: ["detectOS()"]},
  { name: 'detectedBrowser', keywords: ["detectBrowser()"]},
  { name: 'detectedWebglInfo', keywords: ["getWebglInfo()"]},
  { name: 'timeNowUnixMs', keywords: ["new Date().getTime()"], optional: true },
  { name: 'xGame', keywords: ['localStorage.getItem("x-game")'], optional: true },
  { name: 'xVec', keywords: ['localStorage.getItem("x-vec")'], optional: true },

  { name: 'getServerTime', keywords: ['XMLHttpRequest', 'getResponseHeader("date")', 'toISOString', 'game1.js'], optional: true },
];
