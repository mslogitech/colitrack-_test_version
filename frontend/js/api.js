// Petit wrapper autour de fetch() qui ajoute automatiquement le token de session
// Supabase de l'agent connecté, et centralise la gestion d'erreurs.
var Api = (function () {
  function base() {
    return window.COLITRACK_CONFIG.apiBase;
  }

  async function authHeaders() {
    var { data } = await supabaseClient.auth.getSession();
    var token = data && data.session ? data.session.access_token : null;
    return token ? { Authorization: "Bearer " + token } : {};
  }

  async function request(path, options) {
    options = options || {};
    var headers = Object.assign(
      { "Content-Type": "application/json" },
      await authHeaders(),
      options.headers || {}
    );
    var res = await fetch(base() + path, Object.assign({}, options, { headers }));
    var data = null;
    try {
      data = await res.json();
    } catch (e) {
      /* réponse vide, ok pour certains endpoints */
    }
    if (!res.ok) {
      throw new Error((data && data.erreur) || "Erreur serveur (" + res.status + ")");
    }
    return data;
  }

  return {
    // Santé du backend
    health: function () {
      return fetch(base() + "/").then(function (r) {
        return r.ok;
      }).catch(function () {
        return false;
      });
    },

    // Agents
    monProfil: function () {
      return request("/api/agents/me");
    },

    // Colis
    listerColis: function (params) {
      var qs = new URLSearchParams(params || {}).toString();
      return request("/api/colis" + (qs ? "?" + qs : ""));
    },
    obtenirColis: function (id) {
      return request("/api/colis/" + encodeURIComponent(id));
    },
    creerColis: function (payload) {
      return request("/api/colis", { method: "POST", body: JSON.stringify(payload) });
    },
    scannerColis: function (id, etape) {
      return request("/api/colis/" + encodeURIComponent(id) + "/scan", {
        method: "POST",
        body: JSON.stringify({ etape: etape }),
      });
    },
    historiqueColis: function (id) {
      return request("/api/colis/" + encodeURIComponent(id) + "/historique");
    },

    // Finance (chef uniquement — le backend revérifie aussi le rôle)
    resumeFinance: function () {
      return request("/api/finance/resume");
    },
  };
})();
