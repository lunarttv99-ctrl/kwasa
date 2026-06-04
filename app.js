const STORAGE_KEY = 'kasa_dla_osob_entries_v1';

const state = {
  entries: [],
  search: '',
  filterStatus: 'all'
};

const els = {
  form: document.getElementById('entryForm'),
  entryId: document.getElementById('entryId'),
  person: document.getElementById('person'),
  amount: document.getElementById('amount'),
  reason: document.getElementById('reason'),
  date: document.getElementById('date'),
  status: document.getElementById('status'),
  note: document.getElementById('note'),
  entries: document.getElementById('entries'),
  template: document.getElementById('entryTemplate'),
  emptyState: document.getElementById('emptyState'),
  openTotal: document.getElementById('openTotal'),
  settledTotal: document.getElementById('settledTotal'),
  entryCount: document.getElementById('entryCount'),
  search: document.getElementById('search'),
  filterStatus: document.getElementById('filterStatus'),
  clearFormBtn: document.getElementById('clearFormBtn'),
  deleteAllBtn: document.getElementById('deleteAllBtn'),
  exportJsonBtn: document.getElementById('exportJsonBtn'),
  exportCsvBtn: document.getElementById('exportCsvBtn'),
  importJsonInput: document.getElementById('importJsonInput'),
  peopleSummary: document.getElementById('peopleSummary'),
  installBtn: document.getElementById('installBtn')
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function uid() {
  return crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function currency(value) {
  return new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(Number(value) || 0);
}

function dateLabel(dateString) {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('pl-PL').format(new Date(`${dateString}T12:00:00`));
}

function normalizeAmount(value) {
  return Math.round((Number(String(value).replace(',', '.')) || 0) * 100) / 100;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.entries = raw ? JSON.parse(raw) : [];
  } catch {
    state.entries = [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function resetForm() {
  els.entryId.value = '';
  els.form.reset();
  els.date.value = todayIso();
  els.status.value = 'open';
  els.form.querySelector('.primary').textContent = 'Zapisz wpis';
}

function sortEntries(entries) {
  return [...entries].sort((a, b) => {
    const dateDiff = new Date(b.date || 0) - new Date(a.date || 0);
    return dateDiff || String(b.createdAt).localeCompare(String(a.createdAt));
  });
}

function filteredEntries() {
  const query = state.search.trim().toLowerCase();
  return sortEntries(state.entries).filter(entry => {
    const matchesStatus = state.filterStatus === 'all' || entry.status === state.filterStatus;
    const haystack = `${entry.person} ${entry.reason} ${entry.note || ''}`.toLowerCase();
    const matchesQuery = !query || haystack.includes(query);
    return matchesStatus && matchesQuery;
  });
}

function renderStats() {
  const openTotal = state.entries
    .filter(entry => entry.status === 'open')
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const settledTotal = state.entries
    .filter(entry => entry.status === 'settled')
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  els.openTotal.textContent = currency(openTotal);
  els.settledTotal.textContent = currency(settledTotal);
  els.entryCount.textContent = String(state.entries.length);
}

function renderPeopleSummary() {
  const totals = new Map();

  state.entries
    .filter(entry => entry.status === 'open')
    .forEach(entry => {
      const name = entry.person.trim();
      totals.set(name, (totals.get(name) || 0) + Number(entry.amount || 0));
    });

  const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
  els.peopleSummary.innerHTML = '';

  rows.forEach(([person, total]) => {
    const row = document.createElement('div');
    row.className = 'person-row';
    row.innerHTML = `<div><strong></strong><br><span>Do oddania</span></div><strong></strong>`;
    row.querySelector('strong').textContent = person;
    row.querySelectorAll('strong')[1].textContent = currency(total);
    els.peopleSummary.appendChild(row);
  });
}

function renderEntries() {
  const entries = filteredEntries();
  els.entries.innerHTML = '';
  els.emptyState.classList.toggle('hidden', entries.length > 0);

  entries.forEach(entry => {
    const node = els.template.content.firstElementChild.cloneNode(true);
    node.classList.toggle('settled', entry.status === 'settled');
    node.querySelector('.entry-person').textContent = entry.person;
    node.querySelector('.entry-reason').textContent = entry.reason;
    node.querySelector('.entry-amount').textContent = currency(entry.amount);
    node.querySelector('.entry-date').textContent = dateLabel(entry.date);

    const status = node.querySelector('.entry-status');
    status.textContent = entry.status === 'open' ? 'Do oddania' : 'Rozliczone';
    status.classList.add(entry.status);

    const note = node.querySelector('.entry-note');
    note.textContent = entry.note || '';
    note.classList.toggle('hidden', !entry.note);

    const settleBtn = node.querySelector('.settle-btn');
    settleBtn.textContent = entry.status === 'open' ? 'Oznacz rozliczone' : 'Przywróć';
    settleBtn.addEventListener('click', () => toggleStatus(entry.id));

    node.querySelector('.edit-btn').addEventListener('click', () => editEntry(entry.id));
    node.querySelector('.delete-btn').addEventListener('click', () => deleteEntry(entry.id));
    els.entries.appendChild(node);
  });
}

function render() {
  renderStats();
  renderPeopleSummary();
  renderEntries();
}

function upsertEntry(event) {
  event.preventDefault();

  const amount = normalizeAmount(els.amount.value);
  if (amount <= 0) {
    alert('Wpisz kwotę większą od zera.');
    return;
  }

  const id = els.entryId.value || uid();
  const existingIndex = state.entries.findIndex(entry => entry.id === id);
  const entry = {
    id,
    person: els.person.value.trim(),
    amount,
    reason: els.reason.value.trim(),
    date: els.date.value,
    status: els.status.value,
    note: els.note.value.trim(),
    createdAt: existingIndex >= 0 ? state.entries[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (!entry.person || !entry.reason || !entry.date) {
    alert('Uzupełnij osobę, opis i datę.');
    return;
  }

  if (existingIndex >= 0) {
    state.entries[existingIndex] = entry;
  } else {
    state.entries.push(entry);
  }

  saveEntries();
  resetForm();
  render();
}

function editEntry(id) {
  const entry = state.entries.find(item => item.id === id);
  if (!entry) return;

  els.entryId.value = entry.id;
  els.person.value = entry.person;
  els.amount.value = entry.amount;
  els.reason.value = entry.reason;
  els.date.value = entry.date;
  els.status.value = entry.status;
  els.note.value = entry.note || '';
  els.form.querySelector('.primary').textContent = 'Zapisz zmiany';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteEntry(id) {
  if (!confirm('Usunąć ten wpis?')) return;
  state.entries = state.entries.filter(entry => entry.id !== id);
  saveEntries();
  render();
}

function toggleStatus(id) {
  state.entries = state.entries.map(entry => {
    if (entry.id !== id) return entry;
    return { ...entry, status: entry.status === 'open' ? 'settled' : 'open', updatedAt: new Date().toISOString() };
  });
  saveEntries();
  render();
}

function deleteAll() {
  if (!state.entries.length) return;
  if (!confirm('Usunąć wszystkie wpisy? Tej operacji nie da się cofnąć.')) return;
  state.entries = [];
  saveEntries();
  resetForm();
  render();
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportJson() {
  const payload = JSON.stringify({ exportedAt: new Date().toISOString(), entries: state.entries }, null, 2);
  downloadFile(`kasa-kopia-${todayIso()}.json`, payload, 'application/json;charset=utf-8');
}

function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function exportCsv() {
  const headers = ['Osoba', 'Kwota', 'Za co', 'Data', 'Status', 'Notatka'];
  const rows = state.entries.map(entry => [
    entry.person,
    String(entry.amount).replace('.', ','),
    entry.reason,
    entry.date,
    entry.status === 'open' ? 'Do oddania' : 'Rozliczone',
    entry.note || ''
  ]);
  const csv = [headers, ...rows].map(row => row.map(csvEscape).join(';')).join('\n');
  downloadFile(`kasa-eksport-${todayIso()}.csv`, csv, 'text/csv;charset=utf-8');
}

function importJson(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const importedEntries = Array.isArray(parsed) ? parsed : parsed.entries;
      if (!Array.isArray(importedEntries)) throw new Error('Niepoprawny format');

      const cleaned = importedEntries
        .filter(entry => entry && entry.person && entry.reason && entry.amount)
        .map(entry => ({
          id: entry.id || uid(),
          person: String(entry.person).trim(),
          amount: normalizeAmount(entry.amount),
          reason: String(entry.reason).trim(),
          date: entry.date || todayIso(),
          status: entry.status === 'settled' ? 'settled' : 'open',
          note: entry.note ? String(entry.note) : '',
          createdAt: entry.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

      state.entries = cleaned;
      saveEntries();
      resetForm();
      render();
      alert('Import zakończony.');
    } catch {
      alert('Nie udało się wczytać pliku JSON.');
    } finally {
      els.importJsonInput.value = '';
    }
  };
  reader.readAsText(file);
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  deferredPrompt = event;
  els.installBtn.classList.remove('hidden');
});

els.installBtn.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  els.installBtn.classList.add('hidden');
});

els.form.addEventListener('submit', upsertEntry);
els.clearFormBtn.addEventListener('click', resetForm);
els.deleteAllBtn.addEventListener('click', deleteAll);
els.exportJsonBtn.addEventListener('click', exportJson);
els.exportCsvBtn.addEventListener('click', exportCsv);
els.importJsonInput.addEventListener('change', event => importJson(event.target.files[0]));
els.search.addEventListener('input', event => {
  state.search = event.target.value;
  renderEntries();
});
els.filterStatus.addEventListener('change', event => {
  state.filterStatus = event.target.value;
  renderEntries();
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

loadEntries();
resetForm();
render();
