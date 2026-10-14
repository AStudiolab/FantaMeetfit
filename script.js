// Dati iniziali di esempio se il LocalStorage è vuoto
const initialData = [
  { id: 1, fullName: "Sara Arosio", nickname: "GridMaster", email: "sara@example.com", points: 28.5, count: 6 },
  { id: 2, fullName: "Marco Rossi", nickname: "IronBeast", email: "marco@example.com", points: 22.0, count: 4 },
  { id: 3, fullName: "Elena Bianchi", nickname: "FitSanta", email: "elena@example.com", points: 15.5, count: 3 },
  { id: 4, fullName: "Luca Verdi", nickname: "GymPro", email: "luca@example.com", points: 8.0, count: 2 }
];

// Stato dell'applicazione
let athletes = JSON.parse(localStorage.getItem('fantaMeetFitData')) || initialData;

// Elementi DOM
const fantaForm = document.getElementById('fantaForm');
const actionCheckboxes = document.querySelectorAll('input[name="action"]');
const currentSelectionTotal = document.getElementById('currentSelectionTotal');
const leaderboardBody = document.getElementById('leaderboardBody');
const searchInput = document.getElementById('searchInput');
const btnResetData = document.getElementById('btnResetData');

// Inizializzazione
document.addEventListener('DOMContentLoaded', () => {
  renderLeaderboard();
  calculateSelectionTotal();
});

// Calcola il totale parziale delle checkbox selezionate in tempo reale
actionCheckboxes.forEach(checkbox => {
  checkbox.addEventListener('change', calculateSelectionTotal);
});

function calculateSelectionTotal() {
  let total = 0;
  actionCheckboxes.forEach(cb => {
    if (cb.checked) {
      total += parseFloat(cb.value);
    }
  });
  currentSelectionTotal.textContent = total.toFixed(1);
}

// Gestione dell'invio e aggiornamento punti
fantaForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const fullName = document.getElementById('userName').value.trim();
  const nickname = document.getElementById('userNickname').value.trim();
  const email = document.getElementById('userEmail').value.trim();
  
  // Calcolo punti aggiuntivi selezionati
  let addedPoints = 0;
  let selectedCount = 0;

  actionCheckboxes.forEach(cb => {
    if (cb.checked) {
      addedPoints += parseFloat(cb.value);
      selectedCount++;
    }
  });

  if (selectedCount === 0) {
    alert("Seleziona almeno un'azione per aggiornare il tuo punteggio!");
    return;
  }

  // Cerca se l'atleta esiste già per Nickname o Email
  let athlete = athletes.find(a => 
    a.nickname.toLowerCase() === nickname.toLowerCase() || 
    a.email.toLowerCase() === email.toLowerCase()
  );

  if (athlete) {
    // AGGIORNA I PUNTI DEL PROFILO ESISTENTE
    athlete.points += addedPoints;
    athlete.count += selectedCount;
    athlete.fullName = fullName;
    athlete.nickname = nickname;
    athlete.email = email;
    alert(`Punti aggiornati con successo per ${nickname}!\n\n+${addedPoints.toFixed(1)} pt aggiunti.\nPunteggio totale attuale: ${athlete.points.toFixed(1)} pt 🎄🏋️‍♂️`);
  } else {
    // CREA NUOVO PROFILO IN CLASSIFICA
    athlete = {
      id: Date.now(),
      fullName: fullName,
      nickname: nickname,
      email: email,
      points: addedPoints,
      count: selectedCount
    };
    athletes.push(athlete);
    alert(`Benvenuto al FantaMeetFit, ${nickname}!\n\nIl tuo profilo è stato creato con ${addedPoints.toFixed(1)} punti! 🎄🏋️‍♂️`);
  }

  // Salvataggio dati nel browser e aggiornamento grafica
  saveData();
  renderLeaderboard();

  // Reset del modulo per una nuova operazione
  fantaForm.reset();
  calculateSelectionTotal();
});

// Render della tabella Classifica (Mostra SOLO il Nickname)
function renderLeaderboard(filterText = '') {
  // Ordina atleti per punteggio decrescente
  athletes.sort((a, b) => b.points - a.points);

  leaderboardBody.innerHTML = '';

  const filteredAthletes = athletes.filter(a => 
    a.nickname.toLowerCase().includes(filterText.toLowerCase())
  );

  if (filteredAthletes.length === 0) {
    leaderboardBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Nessun nickname trovato.</td></tr>`;
    return;
  }

  filteredAthletes.forEach((athlete, index) => {
    const tr = document.createElement('tr');

    // Badge posizione
    let rankBadge = `<span class="rank-badge">${index + 1}</span>`;
    if (index === 0) rankBadge = `<span class="rank-badge rank-1">1 🥇</span>`;
    if (index === 1) rankBadge = `<span class="rank-badge rank-2">2 🥈</span>`;
    if (index === 2) rankBadge = `<span class="rank-badge rank-3">3 🥉</span>`;

    // Tag soglia raggiunta
    let prizeTag = '';
    if (athlete.points >= 100) {
      prizeTag = `<span class="user-badge-tag" style="color:#f59e0b;">🏆 Oro</span>`;
    } else if (athlete.points >= 50) {
      prizeTag = `<span class="user-badge-tag" style="color:#94a3b8;">🥈 Argento</span>`;
    } else if (athlete.points >= 20) {
      prizeTag = `<span class="user-badge-tag" style="color:#d97706;">🥉 Bronzo</span>`;
    }

    // Mostra SOLO NICKNAME nella colonna atleta
    tr.innerHTML = `
      <td>${rankBadge}</td>
      <td><span class="user-nickname">${escapeHtml(athlete.nickname)}</span> ${prizeTag}</td>
      <td>${athlete.count} azioni</td>
      <td class="points-cell">+${athlete.points.toFixed(1)} pt</td>
    `;

    leaderboardBody.appendChild(tr);
  });
}

// Filtro ricerca per Nickname
searchInput.addEventListener('input', (e) => {
  renderLeaderboard(e.target.value);
});

// Funzione salvataggio LocalStorage
function saveData() {
  localStorage.setItem('fantaMeetFitData', JSON.stringify(athletes));
}

// Reset dati per i gestori
btnResetData.addEventListener('click', () => {
  if (confirm("Vuoi davvero azzerare la classifica del FantaMeetFit? (Questa azione non può essere annullata)")) {
    athletes = [];
    saveData();
    renderLeaderboard();
  }
});

// Helper XSS Security
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}