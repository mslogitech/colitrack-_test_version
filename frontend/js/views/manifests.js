// NOTE : données d'exemple — module Manifestes à connecter à une vraie table 'manifestes' (phase 2).
  var manifestData = [
    { id: 'MF-0521', ligne: 'Yaoundé → Douala', depart: 'VIP 03 — 14h30', colis: 18, statut: 'Ouvert',
      items: ['CL-12348 — Fatima Njoya', 'CL-12350 — Alain Kamga', 'CL-12351 — Odette Mballa', '+15 autres colis'] },
    { id: 'MF-0520', ligne: 'Yaoundé → Bafoussam', depart: 'Standard 07 — 16h00', colis: 12, statut: 'Ouvert',
      items: ['CL-12346 — Marie Curie', 'CL-12352 — Georges Fotso', '+10 autres colis'] },
    { id: 'MF-0519', ligne: 'Yaoundé → Bamenda', depart: 'VIP 05 — 08h00', colis: 20, statut: 'Clôturé',
      items: ['CL-12347 — Paul Ngassa', '+19 autres colis'] }
  ];

  function renderManifests(){
    var tbody = document.getElementById('manifests-tbody');
    tbody.innerHTML = manifestData.map(function(m, i){
      var cls = m.statut === 'Ouvert' ? 'transit' : 'livre';
      return '<tr data-idx="' + i + '" class="manifest-row">'
        + '<td class="mono">' + m.id + '</td>'
        + '<td class="muted">' + m.ligne + '</td>'
        + '<td class="muted">' + m.depart + '</td>'
        + '<td class="right">' + m.colis + '</td>'
        + '<td><span class="status ' + cls + '">' + m.statut + '</span></td>'
        + '<td class="right"><span class="fleet-row-link" data-idx="' + i + '">Voir</span></td>'
        + '</tr>';
    }).join('');
    document.querySelectorAll('.manifest-row, .manifest-row .fleet-row-link').forEach(function(el){
      el.addEventListener('click', function(e){
        e.stopPropagation();
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        showManifestDetail(idx);
      });
    });
  }

  function showManifestDetail(idx){
    var m = manifestData[idx];
    var html = '<p class="section-label">' + m.id + ' — ' + m.ligne + '</p>'
      + '<p class="s-hint" style="margin-top:2px;">' + m.depart + ' · ' + m.colis + ' colis · Statut : ' + m.statut + '</p>'
      + '<div class="detail-group">'
      + m.items.map(function(it){ return '<div class="detail-field"><label>' + it + '</label></div>'; }).join('')
      + '</div>'
      + '<div class="fleet-actions">'
      + (m.statut === 'Ouvert' ? '<button class="btn primary" id="btn-close-manifest">Clôturer le manifeste</button>' : '<button class="btn" id="btn-reopen-manifest">Rouvrir le manifeste</button>')
      + '</div>';
    document.getElementById('manifests-detail').innerHTML = html;
    var closeBtn = document.getElementById('btn-close-manifest');
    if (closeBtn) closeBtn.addEventListener('click', function(){ m.statut = 'Clôturé'; renderManifests(); showManifestDetail(idx); });
    var reopenBtn = document.getElementById('btn-reopen-manifest');
    if (reopenBtn) reopenBtn.addEventListener('click', function(){ m.statut = 'Ouvert'; renderManifests(); showManifestDetail(idx); });
  }
