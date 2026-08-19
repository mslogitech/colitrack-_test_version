var STATUT_LABELS_PUB = { enregistre: "Enregistré", charge: "Chargé", depart: "En route", arrive: "Livré" };

function apiBase() {
  return (window.COLITRACK_CONFIG && window.COLITRACK_CONFIG.apiBase) || "http://localhost:3001";
}

function formatDateFrPub(iso) {
  if (!iso) return "";
  var d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " à " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

async function rechercherColis(id) {
  var errorEl = document.getElementById("track-error");
  errorEl.classList.remove("visible");

  var btn = document.getElementById("track-search-btn");
  btn.disabled = true;
  btn.textContent = "Recherche…";

  try {
    var res = await fetch(apiBase() + "/api/public/colis/" + encodeURIComponent(id));
    var data = await res.json();
    if (!res.ok) throw new Error(data.erreur || "Colis introuvable.");
    afficherResultat(data);
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.classList.add("visible");
  } finally {
    btn.disabled = false;
    btn.textContent = "Suivre";
  }
}

function afficherResultat(colis) {
  document.getElementById("search-card").style.display = "none";
  var resultCard = document.getElementById("result-card");
  resultCard.style.display = "block";

  var estLivre = colis.statut === "arrive";
  var timelineHtml = colis.etapes.map(function (e) {
    var idxCourant = colis.etapes.findIndex(function (x) { return x.etape === colis.statut; });
    var idx = colis.etapes.findIndex(function (x) { return x.etape === e.etape; });
    var cls = e.franchie && idx < idxCourant ? "done" : idx === idxCourant ? "done current" : "";
    return '<div class="tl-step ' + cls + '">' +
      '<div class="tl-label">' + e.label + "</div>" +
      (e.date ? '<div class="tl-date">' + formatDateFrPub(e.date) + "</div>" : "") +
      "</div>";
  }).join("");

  document.getElementById("result-content").innerHTML =
    '<p class="tracking-id">' + colis.id + "</p>" +
    '<div class="route-line"><span class="city">' + colis.villeDepart + '</span><span class="arrow">→</span><span class="city">' + colis.villeArrivee + "</span></div>" +
    (colis.description ? '<p class="sub" style="margin:2px 0 0;">' + colis.description + (colis.poids ? " · " + colis.poids + " kg" : "") + "</p>" : "") +
    '<div class="status-pill' + (estLivre ? " done" : "") + '">' + colis.statutLabel + "</div>" +
    '<div class="timeline">' + timelineHtml + "</div>";
}

document.getElementById("track-search-btn").addEventListener("click", function () {
  var id = document.getElementById("track-input").value.trim();
  if (!id) return;
  rechercherColis(id);
});

document.getElementById("track-input").addEventListener("keydown", function (e) {
  if (e.key === "Enter") document.getElementById("track-search-btn").click();
});

document.getElementById("track-new-search").addEventListener("click", function () {
  document.getElementById("result-card").style.display = "none";
  document.getElementById("search-card").style.display = "block";
  document.getElementById("track-input").value = "";
});

// Si la page est ouverte avec ?id=XXXX (ex: lien envoyé par email), on lance la recherche direct.
(function () {
  var params = new URLSearchParams(window.location.search);
  var idParam = params.get("id");
  if (idParam) {
    document.getElementById("track-input").value = idParam;
    rechercherColis(idParam);
  }
})();

/* ---------- Scan QR caméra (jsQR chargé dynamiquement) ---------- */
var jsQRPromise = null;
function chargerJsQR() {
  if (window.jsQR) return Promise.resolve();
  if (jsQRPromise) return jsQRPromise;
  jsQRPromise = new Promise(function (resolve, reject) {
    var s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.js";
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return jsQRPromise;
}

var scanStream = null;
var scanRaf = null;

async function ouvrirScanner() {
  document.getElementById("scanner-overlay").style.display = "flex";
  document.getElementById("scanner-status").textContent = "Chargement du lecteur QR…";
  try {
    await chargerJsQR();
  } catch (e) {
    document.getElementById("scanner-status").textContent = "Impossible de charger le lecteur QR.";
    return;
  }

  var video = document.getElementById("scanner-video");
  var canvas = document.getElementById("scanner-canvas");
  document.getElementById("scanner-status").textContent = "Recherche du QR code…";

  try {
    scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = scanStream;
    await video.play();
    tick();
  } catch (e) {
    document.getElementById("scanner-status").textContent = "Caméra inaccessible (permission refusée ou indisponible).";
  }

  function tick() {
    if (!scanStream) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      var ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      var code = window.jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: "attemptBoth" });
      if (code && code.data) {
        document.getElementById("scanner-status").textContent = "QR reconnu ✓";
        var id = code.data;
        fermerScanner();
        document.getElementById("track-input").value = id;
        rechercherColis(id);
        return;
      }
    }
    scanRaf = requestAnimationFrame(tick);
  }
}

function fermerScanner() {
  document.getElementById("scanner-overlay").style.display = "none";
  if (scanRaf) cancelAnimationFrame(scanRaf);
  if (scanStream) {
    scanStream.getTracks().forEach(function (t) { t.stop(); });
    scanStream = null;
  }
}

document.getElementById("track-scan-btn").addEventListener("click", ouvrirScanner);
document.getElementById("scanner-close").addEventListener("click", fermerScanner);
