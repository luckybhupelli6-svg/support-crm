# Support CRM

A full-stack customer support ticketing system built with Node.js, Express, and SQLite. Create and manage support tickets, search and filter by status, update ticket details, and add internal notes.

**Live Demo:** Coming Soon
**GitHub:** [github.com/luckybhupelli6-svg/support-crm](https://github.com/luckybhupelli6-svg/support-crm)
---

## Features

- **Create Tickets** — Capture customer name, email, subject, and description with auto-generated ticket IDs (TKT-001, TKT-002, …)
- **List All Tickets** — Dashboard view with ticket ID, customer name, subject, status badge, and date
- **Live Search** — Real-time search across customer names, emails, ticket IDs, and descriptions (300ms debounce)
- **Filter by Status** — Instantly filter tickets by Open, In Progress, or Closed
- **Ticket Detail & Updates** — View full ticket details, update status, and add internal notes with timestamps

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Backend  | Node.js + Express                 |
| Database | SQLite via better-sqlite3         |
| Frontend | HTML + Tailwind CSS + Vanilla JS  |
| Deploy   | Render.com                        |

---

## Project Structure

```
support-crm/
├── server/
│   ├── index.js          # Express app entry point
│   ├── database.js       # SQLite connection + table setup
│   └── routes/
│       └── tickets.js    # All API endpoints
├── public/
│   ├── index.html        # Homepage — ticket list, search, filter
│   ├── create.html       # Create new ticket form
│   ├── ticket.html       # Ticket detail + update + notes
│   └── js/
│       ├── main.js       # Homepage logic
│       ├── create.js     # Create form logic
│       └── ticket.js     # Ticket detail logic
├── .env.example
├── .gitignore
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/support-crm.git
cd support-crm

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env

# 4. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env` file in the root directory:

```
PORT=3000
```

See `.env.example` for reference.

---

## API Reference

Base URL: `http://localhost:3000`

### Create a Ticket
```
POST /api/tickets
```
**Body:**
```json
{
  "customer_name": "Rahul Sharma",
  "customer_email": "rahul@example.com",
  "subject": "Cannot login to account",
  "description": "I get a 401 error every time I try to log in."
}
```
**Response:**
```json
{
  "success": true,
  "ticket_id": "TKT-001",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

### List All Tickets
```
GET /api/tickets
GET /api/tickets?status=Open
GET /api/tickets?search=rahul
GET /api/tickets?status=Open&search=rahul
```
**Response:**
```json
{
  "success": true,
  "count": 2,
  "tickets": [
    {
      "ticket_id": "TKT-001",
      "customer_name": "Rahul Sharma",
      "subject": "Cannot login to account",
      "status": "Open",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### Get Single Ticket
```
GET /api/tickets/:ticket_id
```
**Response:**
```json
{
  "success": true,
  "ticket": {
    "ticket_id": "TKT-001",
    "customer_name": "Rahul Sharma",
    "customer_email": "rahul@example.com",
    "subject": "Cannot login to account",
    "description": "I get a 401 error every time I try to log in.",
    "status": "Open",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "notes": []
  }
}
```

### Update Ticket
```
PUT /api/tickets/:ticket_id
```
**Body:**
```json
{
  "status": "In Progress",
  "note": "Investigating the authentication issue."
}
```
**Response:**
```json
{
  "success": true,
  "updated_at": "2024-01-15T11:00:00.000Z"
}
```

---

## Database Schema

### tickets
| Column         | Type     | Description                        |
|----------------|----------|------------------------------------|
| id             | INTEGER  | Primary key, autoincrement         |
| ticket_id      | TEXT     | Unique ID — TKT-001, TKT-002, …   |
| customer_name  | TEXT     | Customer's full name               |
| customer_email | TEXT     | Customer's email address           |
| subject        | TEXT     | Issue title                        |
| description    | TEXT     | Full issue description             |
| status         | TEXT     | Open / In Progress / Closed        |
| created_at     | DATETIME | Auto-set on creation               |
| updated_at     | DATETIME | Auto-updated on every PUT          |

### notes
| Column     | Type     | Description                    |
|------------|----------|--------------------------------|
| id         | INTEGER  | Primary key, autoincrement     |
| ticket_id  | TEXT     | Foreign key → tickets.ticket_id|
| note_text  | TEXT     | Note content                   |
| created_at | DATETIME | Auto-set on creation           |

---

## Deployment

This app is deployed on [Render.com](https://render.com).

**Build Command:** `npm install`  
**Start Command:** `node server/index.js`  
**Environment Variable:** `PORT` (set automatically by Render)

> **Note:** Render's free tier uses an ephemeral file system. The SQLite database resets on each redeploy. This is acceptable for demonstration purposes. A production version would use a persistent database like PostgreSQL.

---

## Known Limitations

- Ticket ID generation uses `COUNT(*) + 1` — IDs could collide if tickets are deleted. Acceptable for this scope.
- No user authentication — intentionally skipped per assessment requirements.
- SQLite resets on Render redeploy — acceptable for demo purposes.

---

## Author

Built by Lakitha Bhupelli as part of the Datastraw Technologies internship assessment.
