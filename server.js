const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 4000;
const publicDir = path.join(__dirname, 'public');
const usersFile = path.join(__dirname, 'data', 'users.json');

async function ensureUsersFile() {
  await fsp.mkdir(path.dirname(usersFile), { recursive: true });
  if (!fs.existsSync(usersFile)) await fsp.writeFile(usersFile, '[]');
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function readUsers() {
  await ensureUsersFile();
  const raw = await fsp.readFile(usersFile, 'utf-8');
  return JSON.parse(raw);
}

async function writeUsers(users) {
  await fsp.writeFile(usersFile, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString('hex');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString('hex')}`);
    });
  });
}

function verifyPassword(password, hash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = hash.split(':');
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key, 'hex'), derivedKey));
    });
  });
}

function getMimeType(filePath) {
  if (filePath.endsWith('.html')) return 'text/html';
  if (filePath.endsWith('.css')) return 'text/css';
  if (filePath.endsWith('.js')) return 'text/javascript';
  if (filePath.endsWith('.json')) return 'application/json';
  return 'text/plain';
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.url === '/api/auth/signup' && req.method === 'POST') {
    try {
      const { organization, email, password } = await parseBody(req);
      if (!organization || !email || !password) return sendJson(res, 400, { message: 'Organization, email, and password are required.' });

      const users = await readUsers();
      const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return sendJson(res, 409, { message: 'Email already registered.' });

      const passwordHash = await hashPassword(password);
      users.push({ id: Date.now().toString(), organization, email, passwordHash, createdAt: new Date().toISOString() });
      await writeUsers(users);
      return sendJson(res, 201, { message: 'User registered successfully.' });
    } catch {
      return sendJson(res, 500, { message: 'Server error during signup.' });
    }
  }

  if (req.url === '/api/auth/login' && req.method === 'POST') {
    try {
      const { email, password } = await parseBody(req);
      if (!email || !password) return sendJson(res, 400, { message: 'Email and password are required.' });

      const users = await readUsers();
      const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (!user) return sendJson(res, 401, { message: 'Invalid credentials.' });

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return sendJson(res, 401, { message: 'Invalid credentials.' });

      return sendJson(res, 200, {
        message: 'Login successful.',
        user: { id: user.id, organization: user.organization, email: user.email }
      });
    } catch {
      return sendJson(res, 500, { message: 'Server error during login.' });
    }
  }

  if (req.url === '/api/users' && req.method === 'GET') {
    try {
      const users = await readUsers();
      return sendJson(res, 200, {
        totalUsers: users.length,
        users: users.map(({ id, organization, email, createdAt }) => ({ id, organization, email, createdAt }))
      });
    } catch {
      return sendJson(res, 500, { message: 'Could not load users.' });
    }
  }

  let filePath = req.url === '/' ? '/index.html' : req.url;
  filePath = path.join(publicDir, filePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not Found');
    }
    res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
