/**
 * ticket.js — Phase 5: Ticket Detail Page
 * Handles: load ticket, render, update status/priority, add notes, toast, close
 */

// ── State ─────────────────────────────────────────────────────────────────────
let currentTicket = null;
let ticketId      = null;

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ticketId = getTicketIdFromURL();

  if (!ticketId) {
    showError('No ticket ID provided in the URL.');
    return;
  }

  loadTicket();

  // char counter for note textarea
  const noteText = document.getElementById('note-text');
  const noteChars = document.getElementById('note-chars');
  if (noteText && noteChars) {
    noteText.addEventListener('input', () => {
      noteChars.textContent = noteText.value.length;
    });
  }

  // style the author input on focus (same as select/textarea)
  const authorInput = document.getElementById('note-author');
  if (authorInput) {
    authorInput.addEventListener('focus', () => {
      authorInput.style.borderColor = 'var(--border-focus)';
      authorInput.style.boxShadow   = '0 0 0 3px rgba(79,110,247,.12)';
      authorInput.style.outline     = 'none';
    });
    authorInput.addEventListener('blur', () => {
      authorInput.style.borderColor = '';
      authorInput.style.boxShadow   = '';
    });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTicketIdFromURL() {
  // Supports: /ticket.html?id=123  or  /ticket/123
  const params = new URLSearchParams(window.location.search);
  if (params.get('id')) return params.get('id');

  // path-based: /ticket/123
  const match = window.location.pathname.match(/\/ticket\/([^/]+)/);
  return match ? match[1] : null;
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  });
}

function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

// ── Status / Priority badge HTML ───────────────────────────────────────────────
function statusBadge(status) {
  const label = capitalize(status);
  return `<span class="badge badge-${status}">
    <span class="badge-dot"></span>${label}
  </span>`;
}

function priorityBadge(priority) {
  const icons = { low: '▼', medium: '●', high: '▲', critical: '!!', };
  return `<span class="badge badge-prio-${priority}">
    ${icons[priority] || '●'} ${capitalize(priority)}
  </span>`;
}

// ── API Calls ─────────────────────────────────────────────────────────────────
async function loadTicket() {
  showLoading();
  try {
    const res = await fetch(`/api/tickets/${ticketId}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    // Support both { ticket } wrapper and bare ticket object
    currentTicket = data.ticket || data;
    renderTicket(currentTicket);
    showContent();
  } catch (err) {
    showError(err.message || 'Failed to load ticket.');
  }
}

async function saveTicket() {
  if (!currentTicket) return;

  const status   = document.getElementById('edit-status').value;
  const priority = document.getElementById('edit-priority').value;

  const btn = document.getElementById('save-btn');
  btn.disabled = true;
  btn.textContent = 'Saving…';

  try {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status, priority }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    currentTicket = data.ticket || data;

    // Re-render live badges
    document.getElementById('detail-status-badge').innerHTML   = statusBadge(currentTicket.status);
    document.getElementById('detail-priority-badge').innerHTML = priorityBadge(currentTicket.priority);
    document.getElementById('detail-updated').textContent      = formatDate(currentTicket.updated_at);

    showFeedback('ok', '✓ Saved successfully');
    showToast('Ticket updated', 'success');
  } catch (err) {
    showFeedback('err', '✗ ' + (err.message || 'Save failed'));
    showToast(err.message || 'Failed to save', 'error');
  } finally {
    btn.disabled    = false;
    btn.innerHTML   = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Changes`;
  }
}

async function addNote() {
  const author  = document.getElementById('note-author').value.trim();
  const text    = document.getElementById('note-text').value.trim();

  if (!text) {
    showToast('Note text cannot be empty.', 'error');
    document.getElementById('note-text').focus();
    return;
  }

  const btn = document.getElementById('add-note-btn');
  btn.disabled    = true;
  btn.textContent = 'Adding…';

  try {
    // Build the updated notes array
    const existingNotes = currentTicket.notes || [];
    const newNote = {
      id:        Date.now(),
      author:    author || 'Agent',
      text,
      created_at: new Date().toISOString(),
    };
    const updatedNotes = [...existingNotes, newNote];

    const res = await fetch(`/api/tickets/${ticketId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ notes: updatedNotes }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    const data    = await res.json();
    currentTicket = data.ticket || data;

    renderNotes(currentTicket.notes || []);

    // Clear form
    document.getElementById('note-text').value  = '';
    document.getElementById('note-chars').textContent = '0';
    showToast('Note added', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to add note', 'error');
  } finally {
    btn.disabled  = false;
    btn.innerHTML = `<svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg> Add Note`;
  }
}

async function closeTicket() {
  if (!confirm('Close this ticket? You can reopen it by changing the status.')) return;

  try {
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status: 'closed' }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data    = await res.json();
    currentTicket = data.ticket || data;

    document.getElementById('edit-status').value             = 'closed';
    document.getElementById('detail-status-badge').innerHTML = statusBadge('closed');
    document.getElementById('detail-updated').textContent    = formatDate(currentTicket.updated_at);

    showToast('Ticket closed', 'success');
    showFeedback('ok', '✓ Status set to Closed');
  } catch (err) {
    showToast(err.message || 'Failed to close ticket', 'error');
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function renderTicket(ticket) {
  // Nav breadcrumb
  document.getElementById('nav-ticket-id').textContent = `#${ticket.ticket_id || ticket.id}`;
  document.title = `#${ticket.ticket_id || ticket.id} — ${ticket.title || ticket.subject || 'Ticket'} | SupportDesk`;

  // Header card
  document.getElementById('detail-id').textContent              = `#${ticket.ticket_id || ticket.id}`;
  document.getElementById('detail-title').textContent           = ticket.title || ticket.subject || '(No title)';
  document.getElementById('detail-status-badge').innerHTML      = statusBadge(ticket.status);
  document.getElementById('detail-priority-badge').innerHTML    = priorityBadge(ticket.priority);
  document.getElementById('detail-customer').textContent        = ticket.customer_name || ticket.name || '—';
  document.getElementById('detail-email').textContent           = ticket.customer_email || ticket.email || '—';
  document.getElementById('detail-category').textContent        = capitalize(ticket.category) || '—';
  document.getElementById('detail-created').textContent         = formatDate(ticket.created_at);
  document.getElementById('detail-updated').textContent         = formatDate(ticket.updated_at);
  document.getElementById('detail-description').textContent     = ticket.description || '(No description provided)';

  // Pre-fill selects
  document.getElementById('edit-status').value   = ticket.status   || 'open';
  document.getElementById('edit-priority').value = ticket.priority || 'medium';

  // Notes
  renderNotes(ticket.notes || []);
}

function renderNotes(notes) {
  const list  = document.getElementById('notes-list');
  const badge = document.getElementById('note-count-badge');

  badge.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;

  if (!notes.length) {
    list.innerHTML = `<div class="note-empty">No notes yet — add the first one below.</div>`;
    return;
  }

  list.innerHTML = notes.map(n => `
    <div class="note-item">
      <div class="note-meta">
        <span class="note-author">${escapeHTML(n.author || 'Agent')}</span>
        <span class="note-date">${formatDate(n.created_at)}</span>
      </div>
      <p class="note-text">${escapeHTML(n.text)}</p>
    </div>
  `).join('');
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── UI State helpers ──────────────────────────────────────────────────────────
function showLoading() {
  document.getElementById('loading-state').style.display = '';
  document.getElementById('error-state').style.display   = 'none';
  document.getElementById('ticket-content').style.display = 'none';
}

function showError(msg) {
  document.getElementById('loading-state').style.display  = 'none';
  document.getElementById('error-state').style.display    = '';
  document.getElementById('ticket-content').style.display = 'none';
  document.getElementById('error-msg').textContent = msg;
}

function showContent() {
  document.getElementById('loading-state').style.display  = 'none';
  document.getElementById('error-state').style.display    = 'none';
  document.getElementById('ticket-content').style.display = '';
}

function showFeedback(type, msg) {
  const el = document.getElementById('save-feedback');
  el.textContent = msg;
  el.className   = `save-feedback ${type} show`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

// ── Toast ─────────────────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  clearTimeout(toastTimer);

  const icon = type === 'success'
    ? `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>`;

  toast.innerHTML   = icon + escapeHTML(msg);
  toast.className   = `show ${type}`;

  toastTimer = setTimeout(() => {
    toast.className = type;
  }, 3000);
}
