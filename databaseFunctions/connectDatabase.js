/* const { Client} = require('pg');
require('dotenv').config();

const db = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_DATABASE_1,
});
module.exports = () => {
    db.connect()
        .then(() => console.log(`Pripojené k databáze "${process.env.DB_DATABASE_1}" 🟢`))
        .catch(err => console.log(`Nepodarilo sa pripojiť k databáze "${process.env.DB_DATABASE_1}", chyba: ${err.stack}. 🔴`));
}; */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_1,
});

// Otvorenie poolu pripojení
pool.on('connect', () => {
    console.log(`Pool pripojení k databáze "${process.env.DB_DATABASE_1}" otvorený. 🟢`);
});

// Po chybe pri pripájaní k databáze
pool.on('error', (err) => {
    console.error('Chyba pri pripájaní k databáze:', err.stack);
    process.exit(1); // Ukončiť aplikáciu s chybou pri neúspešnom pripojení
});

module.exports = pool;
