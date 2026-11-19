// Owner-supplied devotional line-art (images/art/*.webp, drawn as one-colour shapes on a transparent background).
// Three colour versions of each: -g dark gold (white card, ink saving), -y light gold (dark card), -m maroon (fliers, pamphlets).
window.ART = (function () {
  var L = [
    ["krishna-flute", "Krishna with flute"], ["krishna-balarama-2", "Krishna and Balarama (1)"], ["krishna-balarama-3", "Krishna and Balarama (2)"],
    ["krishna-balarama-1", "Krishna and Balarama (3)"], ["krishna-balarama-4", "Krishna and Balarama (4)"], ["krishna-balarama-5", "Krishna and Balarama (5)"],
    ["gaura-nitai", "Gaura-Nitai dancing"], ["jagannatha", "Lord Jagannatha"], ["narasimha", "Lord Narasimha"],
    ["mridanga", "Mridanga"], ["mridanga-pair", "Two mridangas"], ["karatalas-brass", "Karatalas (brass)"], ["karatalas-rope", "Karatalas (rope)"],
    ["japa-mala", "Japa mala"], ["conch-1", "Conch"], ["conch-pair-1", "Two conches (1)"], ["conch-pair-2", "Two conches (2)"],
    ["tulasi-1", "Tulasi plant (1)"], ["tulasi-2", "Tulasi plant (2)"], ["cow-calf-black", "Cow and calf (solid)"], ["cow-calf-line", "Cow and calf (outline)"],
    ["cow-calf-spots", "Cow and calf (spotted)"], ["cow-line", "Cow"], ["tabla-pair", "Drums (pair)"], ["karatalas-tops", "Karatalas (jars)"]
  ];
  var NOT_RANDOM = { "tabla-pair": 1, "karatalas-tops": 1 };   // listed, but never picked at random
  var pool = L.map(function (x) { return x[0]; }).filter(function (i) { return !NOT_RANDOM[i]; });
  function url(id, c) { return "images/art/" + id + "-" + (c || "m") + ".webp"; }
  function pick(n, avoid) {
    var p = pool.filter(function (i) { return !avoid || avoid.indexOf(i) < 0; }), out = [];
    while (out.length < n && p.length) out.push(p.splice(Math.floor(Math.random() * p.length), 1)[0]);
    return out;
  }
  // choice: "none", "random" or a picture id. The rest are filled at random.
  function ids(choice, n) {
    if (!choice || choice === "none") return [];
    var first = choice !== "random" && pool.concat(["tabla-pair", "karatalas-tops"]).indexOf(choice) > -1 ? [choice] : [];
    return first.concat(pick(Math.max(0, n - first.length), first));
  }
  function strip(list, c, cls) {
    if (!list || !list.length) return "";
    return '<div class="' + (cls || "art-strip") + '">' + list.map(function (i) { return '<img src="' + url(i, c) + '" alt="">'; }).join("") + '</div>';
  }
  function options(first) {
    return (first || "") + L.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join("");
  }
  return { list: L, url: url, pick: pick, ids: ids, strip: strip, options: options };
})();
