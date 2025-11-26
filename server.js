
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Initial Data Fallback (must match constants.tsx structure)
const INITIAL_DATA = {
  adminPassword: "666333",
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
app.use(bodyParser.json());

// Request Logging Middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

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
    
    // 1. Read existing data to get the *current* password
    let currentDataStr;
    try {
        currentDataStr = await fs.readFile(DATA_FILE, 'utf-8');
    } catch(e) {
        // Fallback if file missing (edge case)
        currentDataStr = JSON.stringify(INITIAL_DATA);
    }
    
    const currentData = JSON.parse(currentDataStr);
    // Use password from file, or fallback to default if missing in file
    const storedPassword = currentData.adminPassword || "666333";

    // 2. Verify Password
    if (providedPassword !== storedPassword) {
        return res.status(403).json({ error: 'Unauthorized: Incorrect password' });
    }

    // 3. Validate New Data
    if (!newData || !newData.categories) {
      return res.status(400).json({ error: 'Invalid data structure' });
    }

    // 4. Write New Data (which might contain a NEW password)
    await fs.writeFile(DATA_FILE, JSON.stringify(newData, null, 2));
    res.json({ success: true });
  } catch (error) {
    console.error('Write error:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// Serve Static Files
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
