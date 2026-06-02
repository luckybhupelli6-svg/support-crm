const express = require("express");
const router = express.Router();
const db = require("../database");

// ─────────────────────────────────────────
// HELPER: Generate ticket ID like TKT-001
// ─────────────────────────────────────────
function generateTicketId() {
  // Count existing tickets and pad the number
  const row = db.prepare("SELECT COUNT(*) as count FROM tickets").get();
  const nextNumber = row.count + 1;
  return "TKT-" + String(nextNumber).padStart(3, "0");
}

// ─────────────────────────────────────────
// POST /api/tickets — Create a new ticket
// ─────────────────────────────────────────
router.post("/", (req, res) => {
  const { customer_name, customer_email, subject, description } = req.body;

  // Validate required fields
  if (!customer_name || !customer_email || !subject || !description) {
    return res.status(400).json({
      error: "All fields are required: customer_name, customer_email, subject, description",
    });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(customer_email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  const ticket_id = generateTicketId();

  const stmt = db.prepare(`
    INSERT INTO tickets (ticket_id, customer_name, customer_email, subject, description, status)
    VALUES (?, ?, ?, ?, ?, 'Open')
  `);

  try {
    const result = stmt.run(
      ticket_id,
      customer_name.trim(),
      customer_email.trim().toLowerCase(),
      subject.trim(),
      description.trim()
    );

    // Fetch the created ticket to return full data
    const ticket = db
      .prepare("SELECT * FROM tickets WHERE id = ?")
      .get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      ticket_id: ticket.ticket_id,
      created_at: ticket.created_at,
    });
  } catch (err) {
    console.error("Error creating ticket:", err);
    return res.status(500).json({ error: "Failed to create ticket" });
  }
});

// ─────────────────────────────────────────
// GET /api/tickets — List all tickets
// Optional query params: ?status=Open&search=john
// ─────────────────────────────────────────
router.get("/", (req, res) => {
  const { status, search } = req.query;

  // Start building query
  let query = "SELECT * FROM tickets WHERE 1=1";
  const params = [];

  // Filter by status if provided
  if (status && status !== "All") {
    query += " AND status = ?";
    params.push(status);
  }

  // Search across multiple fields if provided
  if (search && search.trim() !== "") {
    const searchTerm = "%" + search.trim() + "%";
    query += `
      AND (
        customer_name LIKE ?
        OR customer_email LIKE ?
        OR ticket_id LIKE ?
        OR subject LIKE ?
        OR description LIKE ?
      )
    `;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  query += " ORDER BY created_at DESC";

  try {
    const tickets = db.prepare(query).all(...params);
    return res.json({
      success: true,
      count: tickets.length,
      tickets,
    });
  } catch (err) {
    console.error("Error fetching tickets:", err);
    return res.status(500).json({ error: "Failed to fetch tickets" });
  }
});

// ─────────────────────────────────────────
// GET /api/tickets/:ticket_id — Single ticket with notes
// ─────────────────────────────────────────
router.get("/:ticket_id", (req, res) => {
  const { ticket_id } = req.params;

  try {
    // Fetch ticket
    const ticket = db
      .prepare("SELECT * FROM tickets WHERE ticket_id = ?")
      .get(ticket_id);

    if (!ticket) {
      return res.status(404).json({ error: `Ticket ${ticket_id} not found` });
    }

    // Fetch associated notes
    const notes = db
      .prepare(
        "SELECT * FROM notes WHERE ticket_id = ? ORDER BY created_at ASC"
      )
      .all(ticket_id);

    return res.json({
      success: true,
      ticket: {
        ...ticket,
        notes,
      },
    });
  } catch (err) {
    console.error("Error fetching ticket:", err);
    return res.status(500).json({ error: "Failed to fetch ticket" });
  }
});

// ─────────────────────────────────────────
// PUT /api/tickets/:ticket_id — Update status and/or add a note
// ─────────────────────────────────────────
router.put("/:ticket_id", (req, res) => {
  const { ticket_id } = req.params;
  const { status, note } = req.body;

  // Valid statuses
  const validStatuses = ["Open", "In Progress", "Closed"];

  try {
    // Check ticket exists
    const ticket = db
      .prepare("SELECT * FROM tickets WHERE ticket_id = ?")
      .get(ticket_id);

    if (!ticket) {
      return res.status(404).json({ error: `Ticket ${ticket_id} not found` });
    }

    // Update status if provided
    if (status) {
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
      }

      db.prepare(`
        UPDATE tickets
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE ticket_id = ?
      `).run(status, ticket_id);
    }

    // Add note if provided
    if (note && note.trim() !== "") {
      db.prepare(`
        INSERT INTO notes (ticket_id, note_text)
        VALUES (?, ?)
      `).run(ticket_id, note.trim());
    }

    // Return updated ticket
    const updatedTicket = db
      .prepare("SELECT * FROM tickets WHERE ticket_id = ?")
      .get(ticket_id);

    return res.json({
      success: true,
      updated_at: updatedTicket.updated_at,
      ticket: updatedTicket,
    });
  } catch (err) {
    console.error("Error updating ticket:", err);
    return res.status(500).json({ error: "Failed to update ticket" });
  }
});

module.exports = router;