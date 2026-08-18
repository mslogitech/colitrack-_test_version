// NOTE : données d'exemple — à remplacer par de vrais agrégats backend (phase 2).
  function renderStats(){
    var muted = '#6B7280';
    var grid = '#EEF1F4';

    new Chart(document.getElementById('volumeChart'), {
      type: 'line',
      data: {
        labels: ['J-13','J-12','J-11','J-10','J-9','J-8','J-7','J-6','J-5','J-4','J-3','J-2','J-1','Auj.'],
        datasets: [{
          data: [148,152,160,155,168,172,165,178,182,175,190,185,198,207],
          borderColor: '#344054',
          backgroundColor: 'rgba(52,64,84,0.06)',
          fill: true, tension: 0.3, borderWidth: 1.5, pointRadius: 0, pointHoverRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: muted, font: { size: 10 } } },
          y: { grid: { color: grid }, ticks: { color: muted, font: { size: 10 } } }
        }
      }
    });

    new Chart(document.getElementById('destChart'), {
      type: 'bar',
      data: {
        labels: ['Douala','Bafoussam','Bamenda','Bamenda-nord','Ebolowa'],
        datasets: [{ data: [412,268,190,95,88], backgroundColor: '#344054', borderRadius: 2, maxBarThickness: 22 }]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: grid }, ticks: { color: muted, font: { size: 10 } } },
          y: { grid: { display: false }, ticks: { color: muted, font: { size: 10.5 } } }
        }
      }
    });

    new Chart(document.getElementById('otdChart'), {
      type: 'bar',
      data: {
        labels: ['Yaoundé–Douala','Yaoundé–Bafoussam','Yaoundé–Bamenda','Yaoundé–Ebolowa'],
        datasets: [{ data: [97,92,88,95], backgroundColor: ['#344054','#344054','#B7791F','#344054'], borderRadius: 2, maxBarThickness: 22 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: muted, font: { size: 10 } } },
          y: { min: 70, max: 100, grid: { color: grid }, ticks: { color: muted, font: { size: 10 } } }
        }
      }
    });

    new Chart(document.getElementById('incidentsChart'), {
      type: 'doughnut',
      data: {
        labels: ['Retard', 'Colis endommagé', 'Erreur destinataire', 'Colis perdu'],
        datasets: [{
          data: [46, 23, 19, 12],
          backgroundColor: ['#B7791F', '#B42318', '#344054', '#9CA6B2'],
          borderColor: '#fff', borderWidth: 2
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'right', labels: { color: muted, font: { size: 10.5 }, boxWidth: 10, padding: 10 } }
        }
      }
    });
  }
