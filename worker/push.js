// Web Push without any outside package (RFC 8291 message encryption "aes128gcm" + RFC 8292 VAPID), using only the
// standard WebCrypto that Cloudflare Workers and browsers have. Used by worker/index.js to send phone reminders.
const enc = new TextEncoder();

export function b64uToBytes(s) {
  s = String(s).replace(/-/g, "+").replace(/_/g, "/"); while (s.length % 4) s += "=";
  const b = atob(s), o = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) o[i] = b.charCodeAt(i); return o;
}
export function bytesToB64u(buf) {
  let s = ""; new Uint8Array(buf).forEach((x) => { s += String.fromCharCode(x); });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function concat(...a) { const n = a.reduce((t, x) => t + x.length, 0), o = new Uint8Array(n); let p = 0; for (const x of a) { o.set(x, p); p += x.length; } return o; }

async function hkdf(salt, ikm, info, len) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info }, k, len * 8));
}

// Encrypts `text` for one subscription. `fixed` ({ asPrivateJwk, asPublic, salt }) exists only so the RFC test vector can be checked.
export async function encryptPayload(uaPublicB64u, authB64u, text, fixed) {
  const uaPublic = b64uToBytes(uaPublicB64u), authSecret = b64uToBytes(authB64u);
  let asPublic, asPrivate;
  if (fixed) { asPublic = fixed.asPublic; asPrivate = await crypto.subtle.importKey("jwk", fixed.asPrivateJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveBits"]); }
  else {
    const kp = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
    asPublic = new Uint8Array(await crypto.subtle.exportKey("raw", kp.publicKey)); asPrivate = kp.privateKey;
  }
  const uaKey = await crypto.subtle.importKey("raw", uaPublic, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const shared = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaKey }, asPrivate, 256));
  const salt = fixed ? fixed.salt : crypto.getRandomValues(new Uint8Array(16));
  const ikm = await hkdf(authSecret, shared, concat(enc.encode("WebPush: info\0"), uaPublic, asPublic), 32);
  const cek = await hkdf(salt, ikm, enc.encode("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(salt, ikm, enc.encode("Content-Encoding: nonce\0"), 12);
  const plain = concat(enc.encode(text), new Uint8Array([2]));        // 0x02 = last (only) record
  const aes = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aes, plain));
  const rs = new Uint8Array([0, 0, 0x10, 0]);                           // record size 4096
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, cipher);
}

// VAPID: proves to the push service (Google, Mozilla, Apple) that the message comes from us.
export async function vapidHeader(endpoint, publicB64u, privateD, subject, now) {
  const pub = b64uToBytes(publicB64u);
  const jwk = { kty: "EC", crv: "P-256", d: privateD, x: bytesToB64u(pub.slice(1, 33)), y: bytesToB64u(pub.slice(33, 65)), ext: true };
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = bytesToB64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = bytesToB64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor((now || Date.now()) / 1000) + 12 * 3600, sub: subject })));
  const sig = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(head + "." + claims)));   // raw r||s, as JWT wants
  return "vapid t=" + head + "." + claims + "." + bytesToB64u(sig) + ", k=" + publicB64u;
}

// Sends one notification. Returns the HTTP status (201 = accepted; 404/410 = this phone is gone; 400/403 = key no longer matches).
export async function sendPush(sub, payloadObj, vapid, fetchFn) {
  const body = await encryptPayload(sub.p256dh, sub.auth, JSON.stringify(payloadObj));
  const res = await (fetchFn || fetch)(sub.endpoint, {
    method: "POST",
    headers: { Authorization: await vapidHeader(sub.endpoint, vapid.publicKey, vapid.privateD, vapid.subject), "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", TTL: "10800", Urgency: "normal" },
    body
  });
  return res.status;
}
