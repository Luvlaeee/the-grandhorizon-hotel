# 🏨 The Grandeur Hotel — Reservation System

A luxury hotel reservation system for The Grandeur, Manila Bay, Philippines.
Built with a Node.js/Express backend and a pure HTML/CSS/JS frontend.

---

## 📁 Project Structure

```
grandeur/
├── server.js          ← Express backend (API + static file server)
├── package.json
├── .env.example       ← Copy to .env and add your API key
├── public/
│   └── index.html     ← Full frontend (hotel website + booking system)
└── README.md
```

---

## 🚀 Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

### 3. Run the server
```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

### 4. Open in browser
```
http://localhost:3000
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | List all rooms |
| POST | `/api/availability` | Check availability by dates |
| POST | `/api/reservations` | Create a reservation |
| GET | `/api/reservations/:id` | Look up reservation by ID |
| GET | `/api/admin/reservations` | List all reservations (admin) |
| POST | `/api/inquiries` | Submit a guest inquiry |
| POST | `/api/chat` | AI concierge chat proxy |

### Example: Check Availability
```json
POST /api/availability
{
  "checkIn": "2025-12-01",
  "checkOut": "2025-12-05",
  "guests": "2"
}
```

### Example: Create Reservation
```json
POST /api/reservations
{
  "firstName": "Juan",
  "lastName": "dela Cruz",
  "email": "juan@email.com",
  "phone": "+63 912 345 6789",
  "roomId": "deluxe",
  "checkIn": "2025-12-01",
  "checkOut": "2025-12-05",
  "guests": "2",
  "specialRequests": "Anniversary setup"
}
```

---

## 💡 Features

- **Full hotel website** — Hero, Rooms, Amenities, Gallery, Dining, Philippines Explorer, Testimonials
- **Live availability search** — Filters by dates and guest count
- **Reservation system** — Full booking form with confirmation reference (e.g. TGH-1001)
- **Booking lookup** — Find reservation by reference ID
- **AI Concierge (Gabriela)** — Powered by Claude via Anthropic API
- **Scroll animations** — Elegant fade-in on scroll
- **Room detail modals** — Click any room for full details
- **Toast notifications** — Booking confirmations and errors
- **Graceful offline fallback** — Works even without the server running (client-side fallback)

---

## 🌐 Deployment

### Deploy to Railway / Render / Fly.io
1. Push to GitHub
2. Connect to Railway/Render
3. Set `ANTHROPIC_API_KEY` as an environment variable
4. Deploy!

### Deploy to VPS (Ubuntu)
```bash
npm install -g pm2
pm2 start server.js --name grandeur
pm2 save
pm2 startup
```

---

## 🇵🇭 About The Grandeur
The Grandeur is a fictional 5-star luxury hotel located at 1 Roxas Boulevard, Ermita, Manila, Philippines. This project is a demonstration reservation system.

---
Made with ❤️ for the Philippines 🌺
