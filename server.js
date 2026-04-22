const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ImgBB API Key
const IMGBB_API_KEY = "f9bb791d0681c7cf81b6a7cd1456e4aa";

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Multer setup for file uploads
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data file if not exists
function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const defaultData = {
            payments: [
                { id: 'p1', payer: 'רונית כהן (דירה 4)', month: '2025-04', amount: 500 },
                { id: 'p2', payer: 'דוד לוי (דירה 9)', month: '2025-04', amount: 70 },
                { id: 'p3', payer: 'רונית כהן (דירה 4)', month: '2025-03', amount: 70 },
                { id: 'p4', payer: 'דוד לוי (דירה 9)', month: '2025-03', amount: 70 }
            ],
            expenses: [
                { id: 'e1', desc: 'תיקון מעלית', amount: 300, month: '2025-04', cloudUrl: '', fileName: '' },
                { id: 'e2', desc: 'חשמל חדר מדרגות', amount: 100, month: '2025-04', cloudUrl: '', fileName: '' }
            ],
            forum: [
                { id: 'f1', author: 'מיכל (דירה 12)', text: 'השקיפות פה מדהימה! תודה על הניהול 🙏', timestamp: new Date().toISOString() }
            ],
            suggestions: [
                { id: 's1', author: 'דירה 3', title: 'גינה קהילתית עם נדנדות', up: 9, down: 2 }
            ],
            monthlyDue: 70,
            adminPassword: "bafy2020"
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    }
}

// Read data from file
function readData() {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
}

// Write data to file
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Upload to ImgBB
async function uploadToImgBB(fileBuffer, fileName) {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', fileBuffer.toString('base64'));
    formData.append('name', fileName || 'receipt');
    
    const response = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        body: formData
    });
    
    const result = await response.json();
    if (result.success && result.data && result.data.url) {
        return { url: result.data.url, fileName: fileName };
    } else {
        throw new Error(result.error?.message || 'Upload failed');
    }
}

// Routes

// Get all data
app.get('/api/data', (req, res) => {
    try {
        const data = readData();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update entire data
app.post('/api/data', (req, res) => {
    try {
        const newData = req.body;
        writeData(newData);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Upload receipt to ImgBB
app.post('/api/upload-receipt', upload.single('receipt'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const result = await uploadToImgBB(req.file.buffer, req.file.originalname);
        res.json({ 
            success: true, 
            url: result.url, 
            fileName: result.fileName 
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Add payment
app.post('/api/payments', (req, res) => {
    try {
        const data = readData();
        const newPayment = { ...req.body, id: 'p' + Date.now() };
        data.payments.push(newPayment);
        writeData(data);
        res.json(newPayment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete payment
app.delete('/api/payments/:id', (req, res) => {
    try {
        const data = readData();
        data.payments = data.payments.filter(p => p.id !== req.params.id);
        writeData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add expense
app.post('/api/expenses', async (req, res) => {
    try {
        const data = readData();
        const newExpense = { ...req.body, id: 'e' + Date.now() };
        data.expenses.push(newExpense);
        writeData(data);
        res.json(newExpense);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete expense
app.delete('/api/expenses/:id', (req, res) => {
    try {
        const data = readData();
        data.expenses = data.expenses.filter(e => e.id !== req.params.id);
        writeData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add forum message
app.post('/api/forum', (req, res) => {
    try {
        const data = readData();
        const newMessage = { ...req.body, id: 'f' + Date.now(), timestamp: new Date().toISOString() };
        data.forum.push(newMessage);
        writeData(data);
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add suggestion
app.post('/api/suggestions', (req, res) => {
    try {
        const data = readData();
        const newSuggestion = { ...req.body, id: 's' + Date.now(), up: 0, down: 0 };
        data.suggestions.push(newSuggestion);
        writeData(data);
        res.json(newSuggestion);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update suggestion votes
app.put('/api/suggestions/:id', (req, res) => {
    try {
        const data = readData();
        const index = data.suggestions.findIndex(s => s.id === req.params.id);
        if (index !== -1) {
            data.suggestions[index] = { ...data.suggestions[index], ...req.body };
            writeData(data);
            res.json(data.suggestions[index]);
        } else {
            res.status(404).json({ error: 'Suggestion not found' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete suggestion
app.delete('/api/suggestions/:id', (req, res) => {
    try {
        const data = readData();
        data.suggestions = data.suggestions.filter(s => s.id !== req.params.id);
        writeData(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update monthly due
app.put('/api/settings/monthly-due', (req, res) => {
    try {
        const data = readData();
        data.monthlyDue = req.body.monthlyDue;
        writeData(data);
        res.json({ success: true, monthlyDue: data.monthlyDue });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify admin password
app.post('/api/verify-admin', (req, res) => {
    try {
        const data = readData();
        const isValid = req.body.password === data.adminPassword;
        res.json({ isValid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
initDataFile();
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
