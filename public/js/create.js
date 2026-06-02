// ─────────────────────────────────────────
// Field configuration — drives validation
// ─────────────────────────────────────────
const FIELDS = [
  {
    id: "customer_name",
    errorId: "err-customer_name",
    validate: (v) => v.trim().length >= 2,
  },
  {
    id: "customer_email",
    errorId: "err-customer_email",
    validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  },
  {
    id: "subject",
    errorId: "err-subject",
    validate: (v) => v.trim().length >= 3,
  },
  {
    id: "description",
    errorId: "err-description",
    validate: (v) => v.trim().length >= 10,
  },
];

// ─────────────────────────────────────────
// Clear error on input — live feedback
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  FIELDS.forEach(({ id, errorId }) => {
    const input = document.getElementById(id);
    const errEl = document.getElementById(errorId);
    input.addEventListener("input", () => {
      input.classList.remove("error");
      errEl.classList.remove("visible");
      document.getElementById("api-error").classList.add("hidden");
    });
  });
});

// ─────────────────────────────────────────
// Validate all fields — returns true if OK
// ─────────────────────────────────────────
function validateForm() {
  let valid = true;

  FIELDS.forEach(({ id, errorId, validate }) => {
    const input = document.getElementById(id);
    const errEl = document.getElementById(errorId);
    const value = input.value;

    if (!validate(value)) {
      input.classList.add("error");
      errEl.classList.add("visible");
      if (valid) input.focus(); // focus first invalid field
      valid = false;
    } else {
      input.classList.remove("error");
      errEl.classList.remove("visible");
    }
  });

  return valid;
}

// ─────────────────────────────────────────
// Submit ticket to API
// ─────────────────────────────────────────
async function submitTicket() {
  // Clear any previous API error
  const apiError = document.getElementById("api-error");
  apiError.classList.add("hidden");
  apiError.textContent = "";

  // Run validation first
  if (!validateForm()) return;

  // Collect values
  const payload = {
    customer_name: document.getElementById("customer_name").value.trim(),
    customer_email: document.getElementById("customer_email").value.trim(),
    subject: document.getElementById("subject").value.trim(),
    description: document.getElementById("description").value.trim(),
  };

  // Set loading state
  setLoading(true);

  try {
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to create ticket. Please try again.");
    }

    // Show success banner
    const banner = document.getElementById("success-banner");
    document.getElementById("success-msg").textContent =
      `Ticket ${data.ticket_id} created! Redirecting...`;
    banner.classList.add("visible");

    // Redirect to homepage after 1.5 seconds
    setTimeout(() => {
      window.location.href = "/";
    }, 1500);

  } catch (err) {
    apiError.textContent = err.message;
    apiError.classList.remove("hidden");
    setLoading(false);
  }
}

// ─────────────────────────────────────────
// Loading state helper
// ─────────────────────────────────────────
function setLoading(isLoading) {
  const btn = document.getElementById("submit-btn");
  const label = document.getElementById("btn-label");

  if (isLoading) {
    btn.disabled = true;
    label.textContent = "Submitting...";
    btn.querySelector("i").className = "fas fa-spinner fa-spin";
  } else {
    btn.disabled = false;
    label.textContent = "Submit Ticket";
    btn.querySelector("i").className = "fas fa-paper-plane";
  }
}