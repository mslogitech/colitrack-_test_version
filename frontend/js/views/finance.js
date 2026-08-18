function formatFcfa(n) {
  return Math.round(n).toLocaleString("fr-FR") + " FCFA";
}

async function renderFinance() {
  try {
    var resume = await Api.resumeFinance();
    document.getElementById("fin-revenu-mois").textContent = formatFcfa(resume.revenuMois);
    document.getElementById("fin-encaisse-jour").textContent = formatFcfa(resume.encaisseJour);
    document.getElementById("fin-transactions-jour").textContent = resume.transactionsJour + " transaction" + (resume.transactionsJour > 1 ? "s" : "");
  } catch (e) {
    document.getElementById("fin-revenu-mois").textContent = "Erreur";
    document.getElementById("fin-encaisse-jour").textContent = "—";
    console.error("Erreur résumé finance:", e);
  }

  // Les deux graphiques ci-dessous et les tableaux de clôture de caisse / créances
  // restent illustratifs (données d'exemple) tant que la saisie des encaissements
  // au guichet n'est pas branchée sur POST /api/finance/encaissements.
  if (window.__financeChartsRendered) return;
  window.__financeChartsRendered = true;

  var muted = "#6B7280";
  var grid = "#EEF1F4";

  new Chart(document.getElementById("revenueChart"), {
    type: "bar",
    data: {
      labels: ["J-13","J-12","J-11","J-10","J-9","J-8","J-7","J-6","J-5","J-4","J-3","J-2","J-1","Auj."],
      datasets: [{
        data: [720,680,810,760,890,850,790,920,880,860,950,910,980,940].map(function (v) { return v * 1000; }),
        backgroundColor: "#E8952E", borderRadius: 2, maxBarThickness: 18,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: function (ctx) { return ctx.parsed.y.toLocaleString("fr-FR") + " FCFA"; } } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: muted, font: { size: 10 } } },
        y: { grid: { color: grid }, ticks: { color: muted, font: { size: 10 }, callback: function (v) { return v / 1000 + "k"; } } },
      },
    },
  });

  new Chart(document.getElementById("paymentMixChart"), {
    type: "doughnut",
    data: {
      labels: ["Espèces", "Orange Money", "MTN MoMo", "Virement"],
      datasets: [{ data: [52, 28, 18, 2], backgroundColor: ["#1F2937", "#E8952E", "#344054", "#9CA6B2"], borderColor: "#fff", borderWidth: 2 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: "62%",
      plugins: { legend: { position: "right", labels: { color: muted, font: { size: 10.5 }, boxWidth: 10, padding: 10 } } },
    },
  });
}
