var STATUT_LABELS = { enregistre: "Enregistré", charge: "Chargé", depart: "En route", arrive: "Livré" };
var STATUT_CLASS = { enregistre: "transit", charge: "transit", depart: "transit", arrive: "livre" };

function formatDateFr(iso) {
  if (!iso) return "—";
  var d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }) + " " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function statutBadge(statut) {
  return '<span class="status ' + (STATUT_CLASS[statut] || "transit") + '">' + (STATUT_LABELS[statut] || statut) + "</span>";
}

async function renderDashboard() {
  var tbody = document.getElementById("dashboard-tbody");
  var searchEl = document.getElementById("dash-search");
  var filterEl = document.getElementById("dash-filter-statut");

  async function load() {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">Chargement…</td></tr>';
    try {
      var params = {};
      if (searchEl.value.trim()) params.q = searchEl.value.trim();
      if (filterEl.value) params.statut = filterEl.value;
      var res = await Api.listerColis(params);
      var colis = res.colis || [];

      document.getElementById("dash-count").textContent = res.total + " résultat" + (res.total > 1 ? "s" : "");
      document.getElementById("kpi-total").textContent = res.total;
      document.getElementById("kpi-enregistres").textContent = colis.filter(function (c) { return c.statut === "enregistre"; }).length;
      document.getElementById("kpi-transit").textContent = colis.filter(function (c) { return c.statut === "charge" || c.statut === "depart"; }).length;
      document.getElementById("kpi-livres").textContent = colis.filter(function (c) { return c.statut === "arrive"; }).length;

      if (!colis.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="muted">Aucun colis pour l\'instant. Utilise "Enregistrer un colis" pour en créer un.</td></tr>';
        return;
      }

      tbody.innerHTML = colis.map(function (c) {
        return "<tr>" +
          '<td class="mono">' + c.id + "</td>" +
          "<td>" + c.expNom + "</td>" +
          '<td class="muted">' + c.villeDepart + "</td>" +
          "<td>" + c.villeArrivee + "</td>" +
          "<td>" + statutBadge(c.statut) + "</td>" +
          '<td class="muted">' + (c.poids ? c.poids + " kg" : "—") + "</td>" +
          '<td class="right muted">' + formatDateFr(c.createdAt) + "</td>" +
          "</tr>";
      }).join("");
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="7" style="color:#B42318;">Erreur de chargement : ' + e.message + "</td></tr>";
    }
  }

  // Évite d'empiler les listeners à chaque changement de vue
  if (!window.__dashboardWired) {
    searchEl.addEventListener("input", debounce(load, 300));
    filterEl.addEventListener("change", load);
    document.getElementById("dash-refresh").addEventListener("click", load);
    document.querySelectorAll('[data-view-link]').forEach(function (btn) {
      btn.addEventListener("click", function () { setActiveView(this.getAttribute("data-view-link")); });
    });
    window.__dashboardWired = true;
  }

  load();
}

function debounce(fn, delay) {
  var t;
  return function () {
    clearTimeout(t);
    var args = arguments;
    t = setTimeout(function () { fn.apply(null, args); }, delay);
  };
}
