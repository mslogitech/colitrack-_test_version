function apiBaseClient() {
  return (window.COLITRACK_CONFIG && window.COLITRACK_CONFIG.apiBase) || "http://localhost:3001";
}

async function clientAuthHeaders() {
  var { data } = await supabaseClient.auth.getSession();
  var token = data && data.session ? data.session.access_token : null;
  return token ? { Authorization: "Bearer " + token } : {};
}

async function clientRequest(path, options) {
  options = options || {};
  var headers = Object.assign({ "Content-Type": "application/json" }, await clientAuthHeaders(), options.headers || {});
  var res = await fetch(apiBaseClient() + path, Object.assign({}, options, { headers: headers }));
  var data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error((data && data.erreur) || "Erreur serveur (" + res.status + ")");
  return data;
}

function showCard(id) {
  ["login-card", "register-card", "app-area"].forEach(function (cid) {
    document.getElementById(cid).style.display = cid === id ? (id === "app-area" ? "block" : "block") : "none";
  });
}

document.getElementById("show-register").addEventListener("click", function () { showCard("register-card"); });
document.getElementById("show-login").addEventListener("click", function () { showCard("login-card"); });

document.getElementById("login-btn").addEventListener("click", async function () {
  var email = document.getElementById("login-email").value.trim();
  var pass = document.getElementById("login-pass").value.trim();
  var errorEl = document.getElementById("login-error");
  errorEl.classList.remove("visible");

  if (!email || !pass) {
    errorEl.textContent = "Renseigne ton email et ton mot de passe.";
    errorEl.classList.add("visible");
    return;
  }

  var btn = document.getElementById("login-btn");
  btn.disabled = true;
  btn.textContent = "Connexion…";
  try {
    var { error } = await supabaseClient.auth.signInWithPassword({ email: email, password: pass });
    if (error) throw error;
    await afterClientLogin();
  } catch (e) {
    errorEl.textContent = e.message === "Invalid login credentials" ? "Email ou mot de passe incorrect." : e.message;
    errorEl.classList.add("visible");
  } finally {
    btn.disabled = false;
    btn.textContent = "Se connecter";
  }
});

document.getElementById("register-btn").addEventListener("click", async function () {
  var nomComplet = document.getElementById("register-name").value.trim();
  var telephone = document.getElementById("register-phone").value.trim();
  var email = document.getElementById("register-email").value.trim();
  var motDePasse = document.getElementById("register-pass").value.trim();
  var errorEl = document.getElementById("register-error");
  errorEl.classList.remove("visible");

  if (!nomComplet || !email || !motDePasse) {
    errorEl.textContent = "Nom, email et mot de passe sont obligatoires.";
    errorEl.classList.add("visible");
    return;
  }

  var btn = document.getElementById("register-btn");
  btn.disabled = true;
  btn.textContent = "Création du compte…";
  try {
    await clientRequest("/api/clients/register", {
      method: "POST",
      body: JSON.stringify({ nomComplet: nomComplet, telephone: telephone, email: email, motDePasse: motDePasse }),
    });
    // Auto-connexion juste après l'inscription
    var { error } = await supabaseClient.auth.signInWithPassword({ email: email, password: motDePasse });
    if (error) throw error;
    await afterClientLogin();
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.classList.add("visible");
  } finally {
    btn.disabled = false;
    btn.textContent = "Créer mon compte";
  }
});

document.getElementById("logout-btn").addEventListener("click", async function () {
  await supabaseClient.auth.signOut();
  showCard("login-card");
  document.getElementById("login-email").value = "";
  document.getElementById("login-pass").value = "";
});

async function afterClientLogin() {
  var profil = await clientRequest("/api/clients/me");
  document.getElementById("welcome-name").textContent = profil.nom_complet;
  document.getElementById("welcome-email").textContent = profil.email;
  showCard("app-area");
  chargerMesColis();
}

document.getElementById("send-btn").addEventListener("click", async function () {
  var errorEl = document.getElementById("send-error");
  errorEl.classList.remove("visible");

  var payload = {
    villeDepart: document.getElementById("send-depart").value,
    villeArrivee: document.getElementById("send-arrivee").value,
    destNom: document.getElementById("send-dest-name").value.trim(),
    destTel: document.getElementById("send-dest-phone").value.trim(),
    destEmail: document.getElementById("send-dest-email").value.trim() || null,
    description: document.getElementById("send-description").value.trim(),
    poids: document.getElementById("send-weight").value || null,
  };

  if (!payload.destNom || !payload.destTel) {
    errorEl.textContent = "Le nom et le téléphone du destinataire sont obligatoires.";
    errorEl.classList.add("visible");
    return;
  }
  if (payload.villeDepart === payload.villeArrivee) {
    errorEl.textContent = "La ville de départ et d'arrivée doivent être différentes.";
    errorEl.classList.add("visible");
    return;
  }

  var btn = document.getElementById("send-btn");
  btn.disabled = true;
  btn.textContent = "Enregistrement…";
  try {
    var colis = await clientRequest("/api/clients/colis", { method: "POST", body: JSON.stringify(payload) });
    document.getElementById("success-id").textContent = colis.id;
    document.getElementById("success-qr").src = colis.qrCode || "";
    document.getElementById("send-success").style.display = "block";
    document.getElementById("send-dest-name").value = "";
    document.getElementById("send-dest-phone").value = "";
    document.getElementById("send-dest-email").value = "";
    document.getElementById("send-description").value = "";
    document.getElementById("send-weight").value = "1.0";
    chargerMesColis();
  } catch (e) {
    errorEl.textContent = e.message;
    errorEl.classList.add("visible");
  } finally {
    btn.disabled = false;
    btn.textContent = "Enregistrer le colis";
  }
});

var STATUT_LABELS_CLIENT = { enregistre: "Enregistré", charge: "Chargé", depart: "En route", arrive: "Livré" };

async function chargerMesColis() {
  var container = document.getElementById("my-colis-list");
  try {
    var colis = await clientRequest("/api/clients/colis");
    if (!colis.length) {
      container.innerHTML = '<p class="sub">Tu n\'as encore envoyé aucun colis.</p>';
      return;
    }
    container.innerHTML = colis.map(function (c) {
      return '<div class="colis-list-item" data-id="' + c.id + '">' +
        '<div><div class="cli-id">' + c.id + '</div><div class="cli-route">' + c.villeDepart + " → " + c.villeArrivee + "</div></div>" +
        '<span class="status-pill' + (c.statut === "arrive" ? " done" : "") + '" style="margin:0;">' + STATUT_LABELS_CLIENT[c.statut] + "</span>" +
        "</div>";
    }).join("");
    container.querySelectorAll(".colis-list-item").forEach(function (el) {
      el.addEventListener("click", function () {
        window.location.href = "track.html?id=" + encodeURIComponent(this.getAttribute("data-id"));
      });
    });
  } catch (e) {
    container.innerHTML = '<p class="error-msg visible">' + e.message + "</p>";
  }
}

// Restauration de session au chargement de la page
(async function () {
  var { data } = await supabaseClient.auth.getSession();
  if (data && data.session) {
    try {
      await afterClientLogin();
    } catch (e) {
      await supabaseClient.auth.signOut();
    }
  }
})();
