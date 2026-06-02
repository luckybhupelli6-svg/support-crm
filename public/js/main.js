// ─────────────────────────────────────────
// State
// ─────────────────────────────────────────
let currentStatus = "All";
let searchTimeout = null;

// ─────────────────────────────────────────
// On page load
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  fetchTickets();
  setupSearch();
  setupFilters();
});

// ─────────────────────────────────────────
// Fetch tickets from API
// ─────────────────────────────────────────
async function fetchTickets() {
  const searchVal = document.getElementById("search-input").value.trim();

  // Build query string
  const params = new URLSearchParams();
  if (currentStatus !== "All") params.append("status", currentStatus);
  if (searchVal !== "") params.append("search", searchVal);

  showLoading();

  try {
    const res = await fetch(`/api/tickets?${params.toString()}`);
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || "Failed to load tickets");

    renderTickets(data.tickets);
    updateResultCount(data.count);

    // Update stats only when no filters are active
    if (currentStatus === "All" && searchVal === "") {
      updateStats(data.tickets);
    }
  } catch (err) {
    showError(err.message);
  }
}

// ─────────────────────────────────────────
// Fetch ALL tickets just for stats
// ─────────────────────────────────────────
async function fetchAllForStats() {
  try {
    const res = await fetch("/api/tickets");
    const data = await res.json();
    updateStats(data.tickets);
  } catch (_) {}
}

// ─────────────────────────────────────────
// Render ticket rows into table
// ─────────────────────────────────────────
function renderTickets(tickets) {
  const tbody = document.getElementById("ticket-tbody");
  const tableWrapper = document.getElementById("table-wrapper");
  const emptyState = document.getElementById("empty-state");
  const loadingState = document.getElementById("loading-state");

  loadingState.classList.add("hidden");

  if (tickets.length === 0) {
    tableWrapper.classList.add("hidden");
    emptyState.classList.remove("hidden");
    // Still update stats from all tickets
    fetchAllForStats();
    return;
  }

  emptyState.classList.add("hidden");
  tableWrapper.classList.remove("hidden");

  tbody.innerHTML = tickets
    .map((ticket) => {
      const statusClass = getStatusClass(ticket.status);
      const date = formatDate(ticket.created_at);

      return `
      <tr class="ticket-row fade-in" onclick="goToTicket('${ticket.ticket_id}')">
        <td class="px-6 py-4">
          <span class="font-mono font-semibold text-blue-600 text-xs">${ticket.ticket_id}</span>
        </td>
        <td class="px-6 py-4">
          <p class="font-medium text-gray-800">${escapeHtml(ticket.customer_name)}</p>
          <p class="text-xs text-gray-400">${escapeHtml(ticket.customer_email)}</p>
        </td>
        <td class="px-6 py-4 hidden sm:table-cell">
          <p class="text-gray-700 truncate max-w-xs">${escapeHtml(ticket.subject)}</p>
        </td>
        <td class="px-6 py-4">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${ticket.status}
          </span>
        </td>
        <td class="px-6 py-4 hidden md:table-cell text-gray-400 text-xs">${date}</td>
        <td class="px-6 py-4">
          <button
            onclick="event.stopPropagation(); goToTicket('${ticket.ticket_id}')"
            class="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            View →
          </button>
        </td>
      </tr>
    `;
    })
    .join("");

  // Also refresh stats with all tickets
  fetchAllForStats();
}

// ─────────────────────────────────────────
// Update stat counters
// ─────────────────────────────────────────
function updateStats(tickets) {
  const total = tickets.length;
  const open = tickets.filter((t) => t.status === "Open").length;
  const inProgress = tickets.filter((t) => t.status === "In Progress").length;
  const closed = tickets.filter((t) => t.status === "Closed").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-open").textContent = open;
  document.getElementById("stat-inprogress").textContent = inProgress;
  document.getElementById("stat-closed").textContent = closed;
}

// ─────────────────────────────────────────
// Update result count label
// ─────────────────────────────────────────
function updateResultCount(count) {
  const el = document.getElementById("result-count");
  el.textContent = count === 1 ? "1 ticket" : `${count} tickets`;
}

// ─────────────────────────────────────────
// Live search — debounced (waits 300ms after typing stops)
// ─────────────────────────────────────────
function setupSearch() {
  const input = document.getElementById("search-input");
  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchTickets();
    }, 300);
  });
}

// ─────────────────────────────────────────
// Filter buttons
// ─────────────────────────────────────────
function setupFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update active state
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      currentStatus = btn.dataset.status;
      fetchTickets();
    });
  });
}

// ─────────────────────────────────────────
// Navigate to ticket detail page
// ─────────────────────────────────────────
function goToTicket(ticketId) {
  window.location.href = `/ticket.html?id=${ticketId}`;
}

// ─────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────
function showLoading() {
  document.getElementById("loading-state").classList.remove("hidden");
  document.getElementById("table-wrapper").classList.add("hidden");
  document.getElementById("empty-state").classList.add("hidden");
}

function showError(message) {
  document.getElementById("loading-state").classList.add("hidden");
  document.getElementById("table-wrapper").classList.add("hidden");
  document.getElementById("empty-state").classList.remove("hidden");
  document.getElementById("empty-state").innerHTML = `
    <i class="fas fa-exclamation-triangle text-red-400 text-4xl"></i>
    <p class="text-red-400 text-sm mt-3">${message}</p>
    <button onclick="fetchTickets()" class="mt-4 text-blue-600 hover:underline text-sm">Try again</button>
  `;
}

function getStatusClass(status) {
  switch (status) {
    case "Open": return "status-open";
    case "In Progress": return "status-inprogress";
    case "Closed": return "status-closed";
    default: return "bg-gray-100 text-gray-600";
  }
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Prevent XSS — never insert user content without this
function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str || ""));
  return div.innerHTML;
}