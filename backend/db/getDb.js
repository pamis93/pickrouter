// backend/db/getDb.js
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Usa DB_PATH de .env si existe, si no apunta a ../../db.sqlite (raíz del proyecto)
const dbPath =
    process.env.DB_PATH || path.resolve(__dirname, "..", "..", "db.sqlite");

export default function getDb() {
    return new sqlite3.Database(dbPath);
}
