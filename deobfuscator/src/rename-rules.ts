import type { RenameRule } from "./steps/rename-identifiers.js";

export const defaultRenameRules: RenameRule[] = [
  { name: 'FINGERPRINT_KEY_ORDER', keywords: ['dg', 'dO4', 'b-I2rx-E', 'YdFB', 'YtFF'], optional: true },
  { name: 'GAME1_URL', keywords: ['"https://gameforge.com/tra/game1.js";'], optional: true },

  // { name: 'fetchServerTime', keywords: ['XMLHttpRequest', 'getResponseHeader'], allowOverwrite: true },
  { name: 'getAudioFingerprint', keywords: ['OfflineAudioContext', 'createDynamicsCompressor'] },
  { name: 'renderAudioPromise', keywords: ['startRendering', 'oncomplete'] },
  // { name: 'sumAudioChannelData', keywords: ['Math.abs'] }, // too generic — Math.abs appears in many functions
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
  // { name: 'orderFingerprintKeys', keywords: ['forEach', 'delete'], optional: true }, // too generic — forEach and delete are everywhere
  { name: 'encodeFingerprintHash', keywords: ['encodeURIComponent', 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_='] },
];
