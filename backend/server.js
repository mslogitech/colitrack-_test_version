require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors({ origin: process.env.ALLOWED_ORIGIN || "*" }));
app.use(express.json());
app.use(morgan("dev"));

// Route de santé — utilisée par le frontend pour afficher "Backend connecté"
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "colitrack-api", time: new Date().toISOString() });
});

// Charge les routes seulement si la config Supabase est présente,
// pour donner un message d'erreur clair plutôt qu'un crash silencieux.
try {
  const colisRoutes = require("./src/routes/colis");
  const agentsRoutes = require("./src/routes/agents");
  const financeRoutes = require("./src/routes/finance");
  app.use("/api/colis", colisRoutes);
  app.use("/api/agents", agentsRoutes);
  app.use("/api/finance", financeRoutes);
} catch (e) {
  console.error("\n✖ Impossible de démarrer les routes API :", e.message);
  console.error("  → Vérifie ton fichier .env (voir .env.example)\n");
  process.exit(1);
}

// Sert le frontend statique — pratique pour le déploiement en une seule app sur Contabo
app.use(express.static(path.join(__dirname, "..", "frontend")));

// Gestion d'erreurs générique
app.use((err, req, res, next) => {
  console.error("Erreur non gérée:", err);
  res.status(500).json({ erreur: "Erreur interne du serveur." });
});

app.listen(PORT, () => {
  console.log(`\n🚚 COLITRACK API démarrée sur http://localhost:${PORT}`);
  console.log(`   Frontend statique servi depuis /public (si présent)\n`);
});
