const { Pool } = require('pg');
require('dotenv').config();

// Создание подключения к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  // Отключаем нативные модули для совместимости с Vercel
  native: false,
});

// Инициализация базы данных
async function initializeDatabase() {
  try {
    const client = await pool.connect();
    const sql = `
      CREATE TABLE IF NOT EXISTS urls (
        id SERIAL PRIMARY KEY,
        short_code TEXT UNIQUE NOT NULL,
        original_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await client.query(sql);
    console.log('Таблица urls создана или уже существует.');
    client.release();
  } catch (err) {
    console.error('Ошибка создания таблицы:', err.message);
  }
}

// Вызываем инициализацию
initializeDatabase();

// Функции для работы с базой данных
const databaseOperations = {
  // Создание короткого URL
  createShortUrl: async (shortCode, originalUrl) => {
    try {
      const client = await pool.connect();
      const sql = 'INSERT INTO urls (short_code, original_url) VALUES ($1, $2) RETURNING id';
      const result = await client.query(sql, [shortCode, originalUrl]);
      client.release();
      return { id: result.rows[0].id, shortCode, originalUrl };
    } catch (err) {
      throw err;
    }
  },

  // Получение оригинального URL по короткому коду
  getOriginalUrl: async (shortCode) => {
    try {
      const client = await pool.connect();
      const sql = 'SELECT original_url FROM urls WHERE short_code = $1';
      const result = await client.query(sql, [shortCode]);
      client.release();
      return result.rows.length > 0 ? result.rows[0].original_url : null;
    } catch (err) {
      throw err;
    }
  },

  // Получение всех URL (для отладки)
  getAllUrls: async () => {
    try {
      const client = await pool.connect();
      const sql = 'SELECT * FROM urls ORDER BY created_at DESC';
      const result = await client.query(sql);
      client.release();
      return result.rows;
    } catch (err) {
      throw err;
    }
  }
};

module.exports = { ...databaseOperations };
