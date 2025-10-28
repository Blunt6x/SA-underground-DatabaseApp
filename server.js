const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const DATA_FILE = path.join(__dirname, 'data', 'artists.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // serve site files

// Simple in-memory sessions (token -> expiry)
const SESSIONS = {};
const ADMIN_USER = 'blunt';
const ADMIN_PASS = '198801';
const TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}
function writeData(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = uuidv4();
    SESSIONS[token] = Date.now() + TOKEN_TTL_MS;
    return res.json({ ok: true, token });
  }
  return res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

function checkAuth(req, res) {
  const token = req.headers['x-auth-token'] || req.query.token;
  if (!token || !SESSIONS[token]) return false;
  if (Date.now() > SESSIONS[token]) { delete SESSIONS[token]; return false; }
  // refresh expiry
  SESSIONS[token] = Date.now() + TOKEN_TTL_MS;
  return true;
}

app.get('/api/artists', (req, res) => {
  res.json(readData());
});

app.post('/api/artists', (req, res) => {
  if (!checkAuth(req, res)) return res.status(401).json({ ok:false, error:'unauthorized' });
  const data = readData();
  const newArtist = req.body;
  if (!newArtist.id) newArtist.id = (newArtist.name || 'artist').toLowerCase().replace(/\\s+/g,'_').replace(/[^\\w\\-]/g,'');
  // ensure unique id
  if (data.find(a=>a.id === newArtist.id)) {
    newArtist.id = newArtist.id + '_' + Math.floor(Math.random()*1000);
  }
  data.push(newArtist);
  writeData(data);
  res.json({ ok:true, artist:newArtist });
});

app.put('/api/artists/:id', (req, res) => {
  if (!checkAuth(req, res)) return res.status(401).json({ ok:false, error:'unauthorized' });
  const id = req.params.id;
  const body = req.body;
  const data = readData();
  const idx = data.findIndex(a=>a.id === id);
  if (idx === -1) return res.status(404).json({ ok:false, error:'not found' });
  data[idx] = Object.assign({}, data[idx], body);
  writeData(data);
  res.json({ ok:true, artist:data[idx] });
});

app.delete('/api/artists/:id', (req, res) => {
  if (!checkAuth(req, res)) return res.status(401).json({ ok:false, error:'unauthorized' });
  const id = req.params.id;
  let data = readData();
  const idx = data.findIndex(a=>a.id === id);
  if (idx === -1) return res.status(404).json({ ok:false, error:'not found' });
  const removed = data.splice(idx,1);
  writeData(data);
  res.json({ ok:true, removed: removed[0] });
});

// fallback to index.html for SPA routing
app.get('*', (req, res) => {
  const file = path.join(__dirname, 'index.html');
  if (fs.existsSync(file)) return res.sendFile(file);
  res.status(404).send('Not found');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server running on port', port));
