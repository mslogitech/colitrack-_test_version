// NOTE : données d'exemple — module Flotte à connecter à une vraie table 'bus'/'chauffeurs' (phase 2).
  var fleetData = [
    { bus: 'VIP 03', plaque: 'CE 4521 AB', modele: 'Toyota Hiace 2021', capaciteColis: '20 colis', capacitePax: '18 places', controleTechnique: 'Valide — 03/2027', ligne: 'Yaoundé → Douala', depart: '14h30', statut: 'En route',
      chauffeur: { nom: 'Étienne Mvondo', tel: '677 45 12 89', permis: 'PL-2018-3342', anciennete: '6 ans', note: '4,8 / 5' } },
    { bus: 'Standard 07', plaque: 'CE 1187 BK', modele: 'Toyota Coaster 2019', capaciteColis: '15 colis', capacitePax: '25 places', controleTechnique: 'Valide — 11/2026', ligne: 'Yaoundé → Bafoussam', depart: '16h00', statut: 'Au dépôt',
      chauffeur: { nom: 'Samuel Biya', tel: '699 30 44 21', permis: 'PL-2015-1187', anciennete: '9 ans', note: '4,6 / 5' } },
    { bus: 'VIP 05', plaque: 'CE 3390 CD', modele: 'Toyota Hiace 2022', capaciteColis: '20 colis', capacitePax: '18 places', controleTechnique: 'Valide — 07/2027', ligne: 'Yaoundé → Bamenda', depart: '08h00', statut: 'En route',
      chauffeur: { nom: 'Joseph Talla', tel: '655 78 90 12', permis: 'PL-2020-5521', anciennete: '4 ans', note: '4,9 / 5' } },
    { bus: 'Standard 02', plaque: 'CE 0824 EF', modele: 'Toyota Coaster 2017', capaciteColis: '15 colis', capacitePax: '25 places', controleTechnique: 'Expire — 08/2026', ligne: 'Yaoundé → Ebolowa', depart: '09h30', statut: 'Maintenance',
      chauffeur: { nom: 'Paul Ondoa', tel: '691 22 65 40', permis: 'PL-2012-0824', anciennete: '12 ans', note: '4,5 / 5' } }
  ];

  function statusClass(s){
    if (s === 'En route') return 'transit';
    if (s === 'Maintenance') return 'retard';
    return 'livre';
  }

  function renderFleet(){
    var tbody = document.getElementById('fleet-tbody');
    tbody.innerHTML = fleetData.map(function(b, i){
      return '<tr data-idx="' + i + '">' +
        '<td>' + b.bus + '</td>' +
        '<td class="muted">' + b.ligne + '</td>' +
        '<td class="muted">' + b.chauffeur.nom + '</td>' +
        '<td><span class="status ' + statusClass(b.statut) + '">' + b.statut + '</span></td>' +
        '<td class="right"><span class="fleet-row-link" data-idx="' + i + '">Voir / modifier</span></td>' +
        '</tr>';
    }).join('');

    document.querySelectorAll('#fleet-tbody tr, .fleet-row-link').forEach(function(el){
      el.addEventListener('click', function(){
        var idx = this.getAttribute('data-idx');
        showBusDetail(parseInt(idx, 10));
      });
    });
  }

  var tripHistory = [
    { date: '25/07', departPrevu: '14h30', departReel: '14h32', colis: 18, ponctualite: 'À l\'heure' },
    { date: '24/07', departPrevu: '14h30', departReel: '14h51', colis: 20, ponctualite: 'Retard 21 min' },
    { date: '23/07', departPrevu: '14h30', departReel: '14h29', colis: 16, ponctualite: 'À l\'heure' },
    { date: '22/07', departPrevu: '14h30', departReel: '14h33', colis: 19, ponctualite: 'À l\'heure' },
    { date: '21/07', departPrevu: '14h30', departReel: '15h04', colis: 20, ponctualite: 'Retard 34 min' }
  ];

  function showBusDetail(idx){
    var b = fleetData[idx];
    var initials = b.chauffeur.nom.split(' ').map(function(w){ return w[0]; }).join('');
    var html = ''
      + '<div class="driver-head">'
      + '  <div class="driver-avatar">' + initials + '</div>'
      + '  <div><h3>' + b.chauffeur.nom + '</h3><p>Chauffeur — ' + b.bus + '</p></div>'
      + '</div>'
      + '<div class="detail-group"><p class="section-label">Chauffeur</p>'
      + detailField('Téléphone', b.chauffeur.tel)
      + detailField('N° permis', b.chauffeur.permis)
      + detailField('Ancienneté', b.chauffeur.anciennete)
      + detailField('Évaluation', b.chauffeur.note)
      + '</div>'
      + '<div class="detail-group"><p class="section-label">Bus</p>'
      + detailField('Immatriculation', b.plaque)
      + detailField('Modèle', b.modele)
      + detailField('Capacité colis', b.capaciteColis)
      + detailField('Capacité passagers', b.capacitePax)
      + detailField('Contrôle technique', b.controleTechnique)
      + '</div>'
      + '<div class="detail-group"><p class="section-label">Affectation actuelle</p>'
      + detailField('Ligne', b.ligne)
      + detailField('Départ', b.depart)
      + detailField('Statut', b.statut)
      + '</div>'
      + '<div class="fleet-actions"><button class="btn" id="btn-history">Historique des trajets</button><button class="btn primary">Enregistrer</button></div>'
      + '<div id="history-panel"></div>';
    document.getElementById('fleet-detail').innerHTML = html;
    document.getElementById('btn-history').addEventListener('click', function(){
      var panel = document.getElementById('history-panel');
      if (panel.dataset.open === 'true') {
        panel.innerHTML = '';
        panel.dataset.open = 'false';
        return;
      }
      panel.dataset.open = 'true';
      panel.innerHTML = '<p class="section-label" style="margin-top:16px;">5 derniers trajets — ' + b.bus + '</p>'
        + '<table class="mini-table"><thead><tr><th>Date</th><th>Départ prévu</th><th>Départ réel</th><th class="right">Colis</th><th class="right">Ponctualité</th></tr></thead><tbody>'
        + tripHistory.map(function(t){
            var cls = t.ponctualite.indexOf('Retard') === 0 ? 'retard' : 'livre';
            return '<tr><td class="muted">' + t.date + '</td><td class="muted">' + t.departPrevu + '</td><td class="muted">' + t.departReel + '</td><td class="right">' + t.colis + '</td><td class="right"><span class="status ' + cls + '">' + t.ponctualite + '</span></td></tr>';
          }).join('')
        + '</tbody></table>';
    });
  }

  function detailField(label, value){
    return '<div class="detail-field"><label>' + label + '</label><input value="' + value + '" /></div>';
  }
