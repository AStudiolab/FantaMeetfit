// --- IMPORT FIREBASE SDK (Versione 13.0.0 Modulare tramite CDN) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-analytics.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc } from "https://www.gstatic.com/firebasejs/13.0.0/firebase-firestore.js";

// La tua configurazione Firebase ufficiale
const firebaseConfig = {
  apiKey: "AIzaSyC-xtWdU7HZLX0xMX5Qvund-53elHL23Lo",
  authDomain: "fantameetfit.firebaseapp.com",
  projectId: "fantameetfit",
  storageBucket: "fantameetfit.firebasestorage.app",
  messagingSenderId: "172770604191",
  appId: "1:172770604191:web:8bad657a2fd3f920ba9eaa",
  measurementId: "G-T4QXG7F6ED"
};

// Inizializzazione Firebase, Analytics & Firestore
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const COLLECTION_NAME = "athletes";

// Stato dell'applicazione (sincronizzato con Firestore)
let athletes = [];

// Elementi DOM
const fantaForm = document.getElementById('fantaForm');
const actionCheckboxes = document.querySelectorAll('input[name="action"]');
const currentSelectionTotal = document.getElementById('currentSelectionTotal');
const leaderboardBody = document.getElementById('leaderboardBody');
const searchInput = document.getElementById('searchInput');
const btnResetData = document.getElementById('btnResetData');

// Inizializzazione all'avvio della pagina
document.addEventListener('DOMContentLoaded', async () => {
  await loadAthletesFromFirebase();
  calculateSelectionTotal();
});

// Calcolo totale parziale checkbox in tempo reale
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

// Carica i dati da Firestore
async function loadAthletesFromFirebase() {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    athletes = [];
    querySnapshot.forEach((document) => {
      athletes.push({
        id: document.id,
        ...document.data()
      });
    });
    renderLeaderboard();
  } catch (error) {
    console.error("Errore nel caricamento dei dati da Firebase:", error);
    leaderboardBody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--primary-red);">Errore di connessione al database.</td></tr>`;
  }
}

// Gestione invio modulo e aggiornamento punti su Firebase
fantaForm.addEventListener('submit', async (e) => {
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

  // Cerca se l'atleta esiste già per Nickname o Email nel database
  let existingAthlete = athletes.find(a => 
    a.nickname.toLowerCase() === nickname.toLowerCase() || 
    a.email.toLowerCase() === email.toLowerCase()
  );

  try {
    if (existingAthlete) {
      // AGGIORNA DOCUMENTO ESISTENTE SU FIRESTORE
      const newPoints = existingAthlete.points + addedPoints;
      const newCount = existingAthlete.count + selectedCount;

      const athleteRef = doc(db, COLLECTION_NAME, existingAthlete.id);
      await updateDoc(athleteRef, {
        points: newPoints,
        count: newCount,
        fullName: fullName,
        nickname: nickname,
        email: email
      });

      alert(`Punti aggiornati con successo per ${nickname}!\n\n+${addedPoints.toFixed(1)} pt aggiunti.\nPunteggio totale attuale: ${newPoints.toFixed(1)} pt 🎄🏋️‍♂️`);
    } else {
      // CREA NUOVO DOCUMENTO SU FIRESTORE
      const newAthleteData = {
        fullName: fullName,
        nickname: nickname,
        email: email,
        points: addedPoints,
        count: selectedCount
      };

      await addDoc(collection(db, COLLECTION_NAME), newAthleteData);
      alert(`Benvenuto al FantaMeetFit, ${nickname}!\n\nIl tuo profilo è stato creato con ${addedPoints.toFixed(1)} punti! 🎄🏋️‍♂️`);
    }

    // Ricarica i dati aggiornati da Firebase e resetta il form
    await loadAthletesFromFirebase();
    fantaForm.reset();
    calculateSelectionTotal();

  } catch (error) {
    console.error("Errore durante il salvataggio su Firebase:", error);
    alert("Si è verificato un errore durante il salvataggio. Riprova.");
  }
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

    tr.innerHTML = `
      <td>${rankBadge}</td>
      <td><span class="user-nickname">${escapeHtml(athlete.nickname)}</span><br>${prizeTag}</td>
      <td>${athlete.count} az.</td>
      <td class="points-cell">+${athlete.points.toFixed(1)} pt</td>
    `;

    leaderboardBody.appendChild(tr);
  });
}

// Filtro ricerca per Nickname
searchInput.addEventListener('input', (e) => {
  renderLeaderboard(e.target.value);
});

// Reset dati per i gestori
btnResetData.addEventListener('click', () => {
  alert("Per azzerare o eliminare i dati in modo sicuro, puoi gestire la collezione 'athletes' direttamente dalla tua console Firebase.");
});

// Helper XSS Security
function escapeHtml(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}