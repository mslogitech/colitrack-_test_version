var TARIFS = { Douala: 4500, Bafoussam: 3000, Bamenda: 6200, Ebolowa: 2500 };

function updateTarif() {
  var dest = document.getElementById("f-dest").value;
  var base = TARIFS[dest] || 0;
  var weight = parseFloat(document.getElementById("f-weight").value || "0");
  var extra = weight > 2 ? Math.round((weight - 2) * 500) : 0;
  var total = base + extra;
  document.getElementById("s-base").textContent = base ? base.toLocaleString("fr-FR") + " FCFA" : "— FCFA";
  document.getElementById("s-weight").textContent = extra.toLocaleString("fr-FR") + " FCFA";
  document.getElementById("s-total").textContent = total ? total.toLocaleString("fr-FR") + " FCFA" : "— FCFA";
}

function resetRegisterForm() {
  document.getElementById("f-sender-name").value = "";
  document.getElementById("f-sender-phone").value = "";
  document.getElementById("f-recipient-name").value = "";
  document.getElementById("f-recipient-phone").value = "";
  document.getElementById("f-description").value = "";
  document.getElementById("f-dest").value = "";
  document.getElementById("f-weight").value = "1.0";
  document.getElementById("register-error").style.display = "none";
  document.getElementById("register-success").style.display = "none";
  updateTarif();
}

async function submitRegisterForm() {
  var errorEl = document.getElementById("register-error");
  errorEl.style.display = "none";

  var payload = {
    expNom: document.getElementById("f-sender-name").value.trim(),
    expTel: document.getElementById("f-sender-phone").value.trim(),
    destNom: document.getElementById("f-recipient-name").value.trim(),
    destTel: document.getElementById("f-recipient-phone").value.trim(),
    villeArrivee: document.getElementById("f-dest").value,
    // La ville de départ est celle de l'agence de l'agent connecté (affichée en lecture seule)
    villeDepart: document.getElementById("f-depart-display").textContent,
    description: document.getElementById("f-description").value.trim(),
    poids: document.getElementById("f-weight").value || null,
  };

  if (!payload.expNom || !payload.expTel || !payload.destNom || !payload.destTel || !payload.villeArrivee) {
    errorEl.textContent = "Merci de remplir tous les champs obligatoires (expéditeur, destinataire, destination).";
    errorEl.style.display = "block";
    return;
  }
  if (payload.villeDepart === payload.villeArrivee) {
    errorEl.textContent = "La ville de départ et d'arrivée doivent être différentes.";
    errorEl.style.display = "block";
    return;
  }
  if (payload.villeDepart === "—" || !payload.villeDepart) {
    errorEl.textContent = "Aucune agence n'est associée à ton compte. Contacte un administrateur.";
    errorEl.style.display = "block";
    return;
  }

  var btn = document.getElementById("f-submit");
  btn.disabled = true;
  btn.textContent = "Enregistrement…";

  try {
    var colis = await Api.creerColis(payload);
    document.getElementById("success-id").textContent = colis.id;
    document.getElementById("success-qr").src = colis.qrCode || "";
    document.getElementById("register-success").style.display = "block";
    document.querySelector(".form-card").style.display = "none";
  } catch (e) {
    errorEl.textContent = "Erreur lors de l'enregistrement : " + e.message;
    errorEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Enregistrer le colis";
  }
}

function initRegisterForm() {
  if (window.__registerWired) {
    resetRegisterForm();
    document.querySelector(".form-card").style.display = "";
    return;
  }
  window.__registerWired = true;

  document.getElementById("f-dest").addEventListener("change", updateTarif);
  document.getElementById("f-weight").addEventListener("input", updateTarif);
  document.getElementById("f-cancel").addEventListener("click", function () {
    resetRegisterForm();
    setActiveView("dashboard");
  });
  document.getElementById("f-submit").addEventListener("click", submitRegisterForm);
  document.getElementById("success-new").addEventListener("click", function () {
    resetRegisterForm();
    document.querySelector(".form-card").style.display = "";
  });
  document.getElementById("success-view").addEventListener("click", function () {
    resetRegisterForm();
    document.querySelector(".form-card").style.display = "";
    setActiveView("colis");
  });

  updateTarif();
}
