
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Initial Data Fallback
// Default password "666333" hashed
const DEFAULT_HASH = bcrypt.hashSync("666333", 8);

const INITIAL_DATA = {
  adminPassword: DEFAULT_HASH,
  categories: [
    {
      id: 'c1',
      title: '日常办公',
      iconName: 'Coffee',
      items: [
        { id: 'l1', title: 'Gmail', url: 'https://mail.google.com', icon: 'https://favicon.yandex.net/favicon/mail.google.com' },
        { id: 'l2', title: 'Bilibili', url: 'https://www.bilibili.com', icon: 'https://favicon.yandex.net/favicon/www.bilibili.com' },
      ]
    }
  ]
};

app.use(cors());
// Increase limit for large HTML bookmark imports
app.use(bodyParser.json({ limit: '10mb' }));

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Helper to get current password
async function getCurrentPassword() {
    try {
        const dataStr = await fs.readFile(DATA_FILE, 'utf-8');
        const data = JSON.parse(dataStr);
        return data.adminPassword || DEFAULT_HASH;
    } catch {
        return DEFAULT_HASH;
    }
}

// API: Proxy IP Request
app.get('/api/ip', async (req, res) => {
  try {
    const response = await fetch('http://ip-api.com/json/?lang=zh-CN');
    if (!response.ok) throw new Error('IP API failed');
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('IP Proxy error:', error);
    res.status(500).json({ status: 'fail', message: 'Server failed to fetch IP' });
  }
});

// API: Get Data
app.get('/api/data', async (req, res) => {
  try {
    let dataStr;
    try {
      await fs.access(DATA_FILE);
      dataStr = await fs.readFile(DATA_FILE, 'utf-8');
    } catch {
      console.log("Data file not found, creating new one.");
      dataStr = JSON.stringify(INITIAL_DATA, null, 2);
      await fs.writeFile(DATA_FILE, dataStr);
    }
    
    let parsedData;
    try {
        parsedData = JSON.parse(dataStr);
    } catch (e) {
        console.error("Data file corrupt, using initial data.");
        parsedData = INITIAL_DATA;
    }

    if (!parsedData || !parsedData.categories) {
        parsedData = INITIAL_DATA;
        await fs.writeFile(DATA_FILE, JSON.stringify(INITIAL_DATA, null, 2));
    }

    // Send data including password hash so client can verify locally
    res.json(parsedData);
  } catch (error) {
    console.error('Read error:', error);
    res.status(500).json({ error: 'Failed to read data' });
  }
});

// API: Save Data
app.post('/api/data', async (req, res) => {
  try {
    const newData = req.body;
    const providedPassword = req.headers['x-admin-password'];
    
    // 1. Verify Permission
    const storedPassword = await getCurrentPassword();
    let isAuthenticated = false;
    
    if (storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$')) {
        isAuthenticated = bcrypt.compareSync(providedPassword, storedPassword);
    } else {
        isAuthenticated = providedPassword === storedPassword;
    }

    if (!isAuthenticated) {
        return res.status(403).json({ error: 'Unauthorized: Password incorrect' });
    }

    // 2. Validate New Data
    if (!newData || !newData.categories) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }

    // 3. Handle Password Change
    let passwordToSave = storedPassword;
    
    if (newData.adminPassword) {
        // Only re-hash if it looks like a new plain text password (not starting with bcrypt prefix)
        if (!newData.adminPassword.startsWith('$2a$') && !newData.adminPassword.startsWith('$2b$')) {
             passwordToSave = bcrypt.hashSync(newData.adminPassword, 8);
        } else {
             // If client sent the existing hash back, keep it
             passwordToSave = newData.adminPassword;
        }
    } 
    
    const dataToWrite = {
        ...newData,
        adminPassword: passwordToSave
    };

    // 4. Write Data
    await fs.writeFile(DATA_FILE, JSON.stringify(dataToWrite, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Write error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Serve Static Files
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
