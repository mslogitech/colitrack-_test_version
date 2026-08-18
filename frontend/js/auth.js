// Gère la connexion/déconnexion des agents via Supabase Auth, et récupère
// leur profil métier (rôle, agence) depuis le backend une fois authentifiés.

async function afterLogin(supabaseUser) {
  var profil = await Api.monProfil(); // { id, nom_complet, ville_agence, role, actif, email }
  currentRole = profil.role;

  document.getElementById("login-screen").style.display = "none";
  document.getElementById("app-root").style.display = "";

  var badge = document.getElementById("session-badge");
  badge.textContent = roleLabels[currentRole] || currentRole;
  badge.className = "session-badge badge-" + currentRole;
  document.getElementById("agent-name-badge").textContent = profil.nom_complet;

  var departDisplay = document.getElementById("f-depart-display");
  if (departDisplay) departDisplay.textContent = profil.ville_agence || "Agence non renseignée";

  applyRoleMenu();
  checkApiStatus();
}

async function checkApiStatus() {
  var ok = await Api.health();
  var dot = document.getElementById("api-status-dot");
  if (dot) dot.style.background = ok ? "#16794F" : "#B42318";
}

document.getElementById("login-submit").addEventListener("click", async function () {
  var email = document.getElementById("login-email").value.trim();
  var pass = document.getElementById("login-pass").value.trim();
  var errorEl = document.getElementById("login-error");
  errorEl.classList.remove("visible");

  if (!email || !pass) {
    errorEl.textContent = "Merci de renseigner ton email et ton mot de passe.";
    errorEl.classList.add("visible");
    return;
  }

  var submitBtn = document.getElementById("login-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Connexion…";

  try {
    var { data, error } = await supabaseClient.auth.signInWithPassword({ email: email, password: pass });
    if (error) throw error;
    await afterLogin(data.user);
  } catch (e) {
    errorEl.textContent = e.message === "Invalid login credentials"
      ? "Email ou mot de passe incorrect."
      : "Connexion impossible : " + e.message;
    errorEl.classList.add("visible");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Se connecter";
  }
});

document.getElementById("login-pass").addEventListener("keydown", function (e) {
  if (e.key === "Enter") document.getElementById("login-submit").click();
});

document.getElementById("logout-btn").addEventListener("click", async function () {
  await supabaseClient.auth.signOut();
  currentRole = null;
  document.getElementById("app-root").style.display = "none";
  document.getElementById("login-screen").style.display = "flex";
  document.getElementById("login-email").value = "";
  document.getElementById("login-pass").value = "";
  document.getElementById("login-error").classList.remove("visible");
});

// Au chargement de la page : si une session Supabase valide existe déjà
// (rechargement de page), on saute directement l'écran de connexion.
(async function restoreSession() {
  var { data } = await supabaseClient.auth.getSession();
  if (data && data.session) {
    try {
      await afterLogin(data.session.user);
    } catch (e) {
      console.error("Session restaurée mais profil introuvable :", e);
      await supabaseClient.auth.signOut();
    }
  }
})();
