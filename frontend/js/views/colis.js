var ETAPES_ORDRE = ["enregistre", "charge", "depart", "arrive"];
var colisCourant = null;

async function renderColis() {
  var tbody = document.getElementById("colis-tbody");
  var searchEl = document.getElementById("colis-search");
  var filterEl = document.getElementById("colis-filter-statut");

  async function load() {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">Chargement…</td></tr>';
    try {
      var params = {};
      if (searchEl.value.trim()) params.q = searchEl.value.trim();
      if (filterEl.value) params.statut = filterEl.value;
      var res = await Api.listerColis(params);
      var colis = res.colis || [];

      document.getElementById("colis-count").textContent = res.total + " résultat" + (res.total > 1 ? "s" : "");

      if (!colis.length) {
        tbody.innerHTML = '<tr><td colspan="4" class="muted">Aucun résultat.</td></tr>';
        return;
      }

      tbody.innerHTML = colis.map(function (c) {
        return '<tr data-id="' + c.id + '" class="colis-row">' +
          '<td class="mono">' + c.id + "</td>" +
          "<td>" + c.expNom + "</td>" +
          "<td>" + c.villeArrivee + "</td>" +
          "<td>" + statutBadge(c.statut) + "</td>" +
          "</tr>";
      }).join("");

      document.querySelectorAll(".colis-row").forEach(function (r) {
        r.addEventListener("click", function () { showColisDetail(this.getAttribute("data-id")); });
      });
    } catch (e) {
      tbody.innerHTML = '<tr><td colspan="4" style="color:#B42318;">Erreur : ' + e.message + "</td></tr>";
    }
  }

  if (!window.__colisWired) {
    searchEl.addEventListener("input", debounce(load, 300));
    filterEl.addEventListener("change", load);
    window.__colisWired = true;
  }

  load();
}

async function showColisDetail(id) {
  var panel = document.getElementById("colis-detail");
  panel.innerHTML = '<p class="s-hint">Chargement…</p>';
  try {
    var c = await Api.obtenirColis(id);
    colisCourant = c;
    var idxActuel = ETAPES_ORDRE.indexOf(c.statut);
    var prochaine = ETAPES_ORDRE[idxActuel + 1];

    var timelineHtml = ETAPES_ORDRE.map(function (etape, i) {
      var cls = i < idxActuel ? "done" : i === idxActuel ? "current" : "";
      return '<div class="tl-step ' + cls + '"><div class="tl-label">' + STATUT_LABELS[etape] + "</div></div>";
    }).join("");

    var canScan = ["chef", "quai"].indexOf(currentRole) > -1 && prochaine;

    panel.innerHTML =
      '<p class="section-label">' + c.id + " — " + c.expNom + " → " + c.destNom + "</p>" +
      '<p class="s-hint" style="margin-top:2px;">' + c.villeDepart + " → " + c.villeArrivee +
        (c.poids ? " · " + c.poids + " kg" : "") + "</p>" +
      '<div class="timeline" style="margin-top:14px;">' + timelineHtml + "</div>" +
      (canScan
        ? '<div class="fleet-actions"><button class="btn primary" id="btn-scan-next">Faire avancer : ' + STATUT_LABELS[prochaine] + "</button></div>"
        : !prochaine
        ? '<p style="color:#16794F;font-size:12.5px;font-weight:600;margin-top:14px;">Colis livré ✓</p>'
        : "") +
      '<p id="scan-error" style="display:none;color:#B42318;font-size:11.5px;margin-top:8px;"></p>';

    var scanBtn = document.getElementById("btn-scan-next");
    if (scanBtn) {
      scanBtn.addEventListener("click", async function () {
        scanBtn.disabled = true;
        scanBtn.textContent = "Envoi…";
        try {
          await Api.scannerColis(c.id, prochaine);
          showColisDetail(c.id); // recharge avec le nouveau statut
          renderColis(); // rafraîchit la liste
        } catch (e) {
          scanBtn.disabled = false;
          scanBtn.textContent = "Faire avancer : " + STATUT_LABELS[prochaine];
          var err = document.getElementById("scan-error");
          err.textContent = e.message;
          err.style.display = "block";
        }
      });
    }
  } catch (e) {
    panel.innerHTML = '<p class="s-hint" style="color:#B42318;">Erreur : ' + e.message + "</p>";
  }
}
