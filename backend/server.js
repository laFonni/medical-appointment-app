const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const db = require('./database'); // Załadowanie konfiguracji bazy danych SQLite

console.log("Server is starting...");

const app = express();
dotenv.config();  // Załadowanie zmiennych środowiskowych z pliku .env

app.use(cors());
app.use(express.json());

// Trasy
app.use('/api/auth', authRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
