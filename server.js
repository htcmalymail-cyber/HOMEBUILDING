const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Настройка загрузки файлов
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB лимит
});

// Путь к файлу данных
const dataFilePath = path.join(__dirname, 'data.json');

// Инициализация файла данных
function initDataFile() {
    if (!fs.existsSync(dataFilePath)) {
        const defaultData = {
            payments: [
                { id: 'p1', payer: 'רונית כהן (דירה 4)', month: '2025-04', amount: 500 },
                { id: 'p2', payer: 'דוד לוי (דירה 9)', month: '2025-04', amount: 70 }
            ],
            expenses: [],
            forum: [
                { id: 'f1', author: 'מיכל (דירה 12)', text: 'השקיפות פה מדהימה! תודה על הניהול 🙏', timestamp: new Date().toISOString() }
            ],
            suggestions: [
                { id: 's1', author: 'דירה 3', title: 'גינה קהילתית עם נדנדות', up: 9, down: 2 }
            ],
            residents: [
                { id: 'r1', name: 'רונית כהן (דירה 4)', phone: '972501234567' },
                { id: 'r2', name: 'דוד לוי (דירה 9)', phone: '972502345678' }
            ],
            committeeData: {
                chairman: 'ראובן כהן',
                phone: '050-1234567',
                email: 'vaad@best-neighborhood.com',
                address: 'רחוב היער 5, תל אביב'
            },
            monthlyDue: 70
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(defaultData, null, 2));
    }
}

// Чтение данных
function readData() {
    try {
        const data = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения данных:', error);
        return {};
    }
}

// Запись данных
function writeData(data) {
    try {
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Ошибка записи данных:', error);
        return false;
    }
}

// ============ API ENDPOINTS ============

// Получить все данные
app.get('/api/data', (req, res) => {
    const data = readData();
    res.json(data);
});

// Сохранить все данные
app.post('/api/data', (req, res) => {
    const newData = req.body;
    if (writeData(newData)) {
        res.json({ success: true, message: 'Данные сохранены' });
    } else {
        res.status(500).json({ success: false, message: 'Ошибка сохранения' });
    }
});

// Загрузить файл (фото квитанции)
app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Файл не загружен' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
        success: true, 
        fileUrl: fileUrl,
        fileName: req.file.originalname,
        fileId: req.file.filename
    });
});

// Получить файл
app.get('/uploads/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: 'Файл не найден' });
    }
});

// Удалить файл
app.delete('/api/upload/:filename', (req, res) => {
    const filePath = path.join(__dirname, 'uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ success: true });
    } else {
        res.json({ success: false, message: 'Файл не найден' });
    }
});

// Обновить конкретный раздел
app.post('/api/payments', (req, res) => {
    const data = readData();
    data.payments = req.body;
    writeData(data);
    res.json({ success: true });
});

app.post('/api/expenses', (req, res) => {
    const data = readData();
    data.expenses = req.body;
    writeData(data);
    res.json({ success: true });
});

app.post('/api/residents', (req, res) => {
    const data = readData();
    data.residents = req.body;
    writeData(data);
    res.json({ success: true });
});

app.post('/api/forum', (req, res) => {
    const data = readData();
    data.forum = req.body;
    writeData(data);
    res.json({ success: true });
});

app.post('/api/suggestions', (req, res) => {
    const data = readData();
    data.suggestions = req.body;
    writeData(data);
    res.json({ success: true });
});

app.post('/api/committee', (req, res) => {
    const data = readData();
    data.committeeData = req.body;
    writeData(data);
    res.json({ success: true });
});

app.post('/api/monthlydue', (req, res) => {
    const data = readData();
    data.monthlyDue = req.body.monthlyDue;
    writeData(data);
    res.json({ success: true });
});

// Запуск сервера
initDataFile();
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
    console.log(`📁 Данные сохраняются в: ${dataFilePath}`);
    console.log(`📁 Загруженные файлы: ${path.join(__dirname, 'uploads')}`);
});