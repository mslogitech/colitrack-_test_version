// currentRole est mis à jour par auth.js une fois l'agent authentifié via Supabase
// (valeur réelle venant de la colonne agents.role : "chef" | "guichet" | "quai")
var currentRole = null;

var roleLabels = { chef: "Administrateur", guichet: "Guichetier", quai: "Agent de quai" };

// Vues autorisées par rôle — c'est ici que "Finance" est réservé au chef d'agence
var viewRoles = {
  dashboard: ["chef"],
  register: ["chef", "guichet"],
  colis: ["chef", "guichet", "quai"],
  manifests: ["chef", "quai"],
  agences: ["chef"],
  fleet: ["chef"],
  stats: ["chef"],
  finance: ["chef"],
  settings: ["chef"],
};

var viewTitles = {
  dashboard: ["Tableau de bord", "Vue d'ensemble des colis en cours"],
  register: ["Enregistrer un colis", "Nouvel enregistrement au guichet"],
  colis: ["Colis", "Suivi et recherche de tous les colis"],
  manifests: ["Manifestes", "Chargements par ligne de bus"],
  agences: ["Réseau d'agences", "Vue d'ensemble du réseau"],
  fleet: ["Bus et chauffeurs", "Gestion de la flotte"],
  stats: ["Statistiques", "Vue d'ensemble des performances"],
  finance: ["Finance", "Encaissements, clôtures de caisse et créances — accès administrateur"],
  settings: ["Paramètres", "Configuration de l'agence et du compte"],
};

function setActiveView(view) {
  if (!viewRoles[view] || viewRoles[view].indexOf(currentRole) === -1) {
    var allowed = Object.keys(viewRoles).filter(function (v) {
      return viewRoles[v].indexOf(currentRole) > -1;
    });
    view = allowed[0];
  }
  document.querySelectorAll('[id^="view-"]').forEach(function (v) {
    v.style.display = "none";
  });
  document.getElementById("view-" + view).style.display = "";
  document.querySelectorAll(".nav-link").forEach(function (l) {
    l.classList.toggle("active", l.getAttribute("data-view") === view);
  });
  document.getElementById("page-title").textContent = viewTitles[view][0];
  document.getElementById("page-breadcrumb").textContent = viewTitles[view][1];

  if (view === "dashboard") renderDashboard();
  if (view === "colis") renderColis();
  if (view === "register") initRegisterForm();
  if (view === "stats" && !window.__statsRendered) { renderStats(); window.__statsRendered = true; }
  if (view === "finance") renderFinance();
  if (view === "fleet" && !window.__fleetRendered) { renderFleet(); window.__fleetRendered = true; }
  if (view === "manifests" && !window.__manifestsRendered) { renderManifests(); window.__manifestsRendered = true; }
  if (view === "agences" && !window.__agencesRendered) { renderAgences(); window.__agencesRendered = true; }
}

function applyRoleMenu() {
  document.querySelectorAll(".nav-link").forEach(function (link) {
    var roles = (link.getAttribute("data-roles") || "").split(",");
    link.style.display = roles.indexOf(currentRole) > -1 ? "" : "none";
  });
  var visibleLinks = Array.prototype.filter.call(document.querySelectorAll(".nav-link"), function (l) {
    return l.style.display !== "none";
  });
  if (visibleLinks.length) setActiveView(visibleLinks[0].getAttribute("data-view"));
}

document.querySelectorAll(".nav-link").forEach(function (link) {
  link.addEventListener("click", function (e) {
    e.preventDefault();
    setActiveView(this.getAttribute("data-view"));
  });
});
