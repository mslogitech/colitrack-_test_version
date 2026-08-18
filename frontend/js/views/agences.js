// NOTE : données d'exemple — module Réseau d'agences à connecter (phase 2).
  var agencesData = [
    { nom: 'Yaoundé Centre', chef: 'R. Etoa', colis: 1234, otd: 94, litiges: 4, volume: 100 },
    { nom: 'Douala Akwa', chef: 'C. Ebogo', colis: 980, otd: 91, litiges: 6, volume: 79 },
    { nom: 'Bafoussam', chef: 'H. Nguetsop', colis: 512, otd: 96, litiges: 1, volume: 41 },
    { nom: 'Bamenda', chef: 'T. Fonkou', colis: 340, otd: 88, litiges: 3, volume: 28 }
  ];

  function renderAgences(){
    var tbody = document.getElementById('agences-tbody');
    tbody.innerHTML = agencesData.map(function(a){
      return '<tr>'
        + '<td>' + a.nom + '</td>'
        + '<td class="muted">' + a.chef + '</td>'
        + '<td class="right">' + a.colis.toLocaleString('fr-FR') + '</td>'
        + '<td class="right">' + a.otd + '%</td>'
        + '<td class="right">' + a.litiges + '</td>'
        + '<td><div class="vol-bar-track"><div class="vol-bar-fill" style="width:' + a.volume + '%;"></div></div></td>'
        + '</tr>';
    }).join('');
  }