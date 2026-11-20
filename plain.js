// Plain, familiar spellings for anything public (business card, fliers, pamphlets, the public website):
// Krishna, Rama, Prabhupada, Acharya... no diacritics. Text without diacritics passes through untouched.
window.PLAIN = function (t) {
  t = String(t == null ? "" : t);
  if (!/[^\x00-\x7f]|Krsna|Krishna?a/.test(t)) return t;
  return t
    .replace(/Śr/g, "Sr").replace(/śr/g, "sr")
    .replace(/Caitanya/g, "Chaitanya").replace(/caitanya/g, "chaitanya")
    .replace(/Ācārya/g, "Acharya").replace(/ācārya/g, "acharya").replace(/Acarya/g, "Acharya").replace(/acarya/g, "acharya")
    .replace(/Krsna/g, "Krishna").replace(/krsna/g, "krishna")
    .replace(/[ṣṢ]/g, function (c) { return c === "ṣ" ? "sh" : "Sh"; })
    .replace(/ś/g, "sh").replace(/Ś/g, "Sh")
    .replace(/ṛ/g, "ri").replace(/Ṛ/g, "Ri").replace(/ṝ/g, "ri")
    .normalize("NFD").replace(/[̀-ͯ]/g, "").normalize("NFC")
    .replace(/[ḷḹ]/g, "l").replace(/ṅ/g, "n").replace(/ṇ/g, "n").replace(/ṭ/g, "t").replace(/ḍ/g, "d");
};
