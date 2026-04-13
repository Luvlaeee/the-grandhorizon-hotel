require('dotenv').config();
console.log('API KEY:', process.env.ANTHROPIC_API_KEY ? 'LOADED ✅' : 'MISSING ❌');  // ← add this
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory "database" (replace with real DB in production) ───
let reservations = [];
let inquiries = [];
let reservationCounter = 1000;

// ─── ROOMS DATA ───
const rooms = [
  { id: 'deluxe', name: 'Deluxe Room', type: 'Garden Retreat', price: 8500, sqm: 55, bed: 'Queen', view: 'Garden', maxGuests: 2, available: 12 },
  { id: 'superior', name: 'Superior Room', type: 'City View', price: 11000, sqm: 65, bed: 'King', view: 'City', maxGuests: 2, available: 8 },
  { id: 'junior', name: 'Junior Suite', type: 'Capiz Penthouse', price: 18500, sqm: 90, bed: 'King', view: 'Bay', maxGuests: 3, available: 5 },
  { id: 'grand', name: 'Grand Suite', type: 'Manila Bay', price: 32000, sqm: 135, bed: 'King', view: 'Panoramic Bay', maxGuests: 4, available: 3 },
  { id: 'presidential', name: 'Presidential Suite', type: 'The Manila Bay Suite', price: 48000, sqm: 180, bed: 'Super King', view: 'Full Panoramic', maxGuests: 6, available: 1 },
];

// ─── API: Get all rooms ───
app.get('/api/rooms', (req, res) => {
  res.json({ success: true, rooms });
});

// ─── API: Check availability ───
app.post('/api/availability', (req, res) => {
  const { checkIn, checkOut, guests } = req.body;
  if (!checkIn || !checkOut) return res.status(400).json({ success: false, message: 'Check-in and check-out dates are required.' });

  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (co <= ci) return res.status(400).json({ success: false, message: 'Check-out must be after check-in.' });

  const nights = Math.ceil((co - ci) / (1000 * 60 * 60 * 24));
  const available = rooms.filter(r => !guests || r.maxGuests >= parseInt(guests));

  res.json({
    success: true,
    checkIn, checkOut, nights,
    rooms: available.map(r => ({ ...r, totalPrice: r.price * nights }))
  });
});

// ─── API: Create reservation ───
app.post('/api/reservations', (req, res) => {
  const { firstName, lastName, email, phone, roomId, checkIn, checkOut, guests, specialRequests } = req.body;

  if (!firstName || !lastName || !email || !roomId || !checkIn || !checkOut) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  const room = rooms.find(r => r.id === roomId);
  if (!room) return res.status(404).json({ success: false, message: 'Room not found.' });

  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  const nights = Math.ceil((co - ci) / (1000 * 60 * 60 * 24));
  const totalPrice = room.price * nights;

  const reservation = {
    id: `TGH-${++reservationCounter}`,
    firstName, lastName, email, phone,
    room: { id: room.id, name: room.name, type: room.type },
    checkIn, checkOut, nights, guests: guests || 1,
    totalPrice, specialRequests: specialRequests || '',
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  reservations.push(reservation);

  res.json({
    success: true,
    message: `Reservation confirmed! Your booking reference is ${reservation.id}.`,
    reservation
  });
});

// ─── API: Get reservation by ID ───
app.get('/api/reservations/:id', (req, res) => {
  const r = reservations.find(r => r.id === req.params.id);
  if (!r) return res.status(404).json({ success: false, message: 'Reservation not found.' });
  res.json({ success: true, reservation: r });
});

// ─── API: Get all reservations (admin) ───
app.get('/api/admin/reservations', (req, res) => {
  res.json({ success: true, total: reservations.length, reservations });
});

// ─── API: Submit inquiry ───
app.post('/api/inquiries', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });

  const inquiry = { id: Date.now(), name, email, subject, message, createdAt: new Date().toISOString() };
  inquiries.push(inquiry);
  res.json({ success: true, message: 'Thank you for your inquiry! Our concierge team will respond within 2 hours.', inquiry });
});

// ─── API: AI Chat Proxy ───
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ success: false, message: 'Messages array required.' });

  const SYSTEM_PROMPT = `You are Gabriela, the AI concierge for The Grand Horizon — a 5-star luxury hotel in Manila, Philippines. Be warm, elegant, and concise (2-4 sentences). Occasionally use Filipino greetings like "Mabuhay!", "Salamat", "Magandang araw!".

Hotel info:
- Address: 1 Roxas Boulevard, Ermita, Manila, Philippines 1000
- Phone: +63 (2) 8888-7000
- Email: reservations@thegrandhorizon.ph
- Rooms: Deluxe ₱8,500/night, Superior ₱11,000, Junior Suite ₱18,500, Grand Suite ₱32,000, Presidential ₱48,000
- Amenities: 80m infinity pool, Pamana Spa, 7 restaurants, 24hr gym, Japanese garden, private marina, Kids Sanctuary
- Dining: Bahay Kubo (Filipino fine dining), Langit Bar (rooftop cocktails, 38F)
- Check-in: 3PM | Check-out: 12PM
For reservations, direct guests to fill the booking form on the website or call +63 (2) 8888-7000.`;

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'anthropic-version': '2023-06-01', 'x-api-key': process.env.ANTHROPIC_API_KEY || '' },
      body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 500, system: SYSTEM_PROMPT, messages })
    });
    const data = await response.json();
    const reply = data.content?.[0]?.text || 'Please call us at +63 (2) 8888-7000 for immediate assistance.';
    res.json({ success: true, reply });
  } catch (e) {
    res.json({ success: true, reply: 'Apologies for the inconvenience. Please contact us directly at +63 (2) 8888-7000 or reservations@thegrandhorizon.ph — our team is available 24/7.' });
  }
});

// ─── Fallback: serve index.html ───
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🏨 The Grand Horizon Hotel Server running at http://localhost:${PORT}\n`);
});
