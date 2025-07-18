// initdb.js

import sqlite3 from "sqlite3";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Usa DB_PATH de .env si existe, si no apunta a ../../db.sqlite (raíz del proyecto)
const dbPath = process.env.DB_PATH
    ? resolve(process.env.DB_PATH)
    : resolve(__dirname, "..", "..", "db.sqlite");

// Verificación de existencia
if (!fs.existsSync(dbPath)) {
    console.error("🛑 initdb: no existe la base de datos en:", dbPath);
    // Se crea de todas formas, sqlite crea el archivo al abrir conexión
} else {
    console.log("✅ initdb: usando base de datos en:", dbPath);
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 🔄 Borra todas las tablas existentes para reiniciar
    db.run(`DROP TABLE IF EXISTS stock_altura`);
    db.run(`DROP TABLE IF EXISTS reapro_selecciones`);
    db.run(`DROP TABLE IF EXISTS reapro_descartes`);
    db.run(`DROP TABLE IF EXISTS reapro_asignado`);
    db.run(`DROP TABLE IF EXISTS reapro_total`);
    db.run(`DROP TABLE IF EXISTS usuarios`);
    db.run(`DROP TABLE IF EXISTS reapro`);
    db.run(`DROP TABLE IF EXISTS ubicaciones_qr`);
    db.run(`DROP TABLE IF EXISTS productos_descartados`);
    db.run(`DROP TABLE IF EXISTS asignaciones`);
    db.run(`DROP TABLE IF EXISTS trabajadores`);
    db.run(`DROP TABLE IF EXISTS maestro`);
    db.run(`DROP TABLE IF EXISTS productos_combinados`);

    // 🔄 Creación de tablas
    db.run(`CREATE TABLE IF NOT EXISTS productos_combinados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_concreto TEXT,
        ean TEXT,
        modelo TEXT,
        color TEXT,
        talla TEXT,
        cantidad INTEGER,
        ubicacion TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS maestro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        id_concreto TEXT UNIQUE,
        ean TEXT UNIQUE,
        modelo TEXT,
        color TEXT,
        talla TEXT,
        pasillo TEXT,
        modulo TEXT,
        seccion TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS trabajadores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS asignaciones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_trabajador TEXT,
        id_concreto TEXT,
        ean TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS productos_descartados (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ean TEXT,
        id_concreto TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ubicaciones_qr (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo_qr TEXT UNIQUE,
        ubicacion TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reapro (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT,
        ean TEXT,
        modelo TEXT,
        color TEXT,
        talla TEXT,
        cantidad INTEGER DEFAULT 1,
        ubicacion TEXT,
        fecha DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'operario'
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reapro_total (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ean TEXT,
        modelo TEXT,
        color TEXT,
        talla TEXT,
        cantidad INTEGER,
        id_concreto TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reapro_asignado (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_trabajador TEXT,
        id_reapro_total INTEGER,
        FOREIGN KEY(id_reapro_total) REFERENCES reapro_total(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reapro_descartes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_trabajador TEXT,
        id_reapro_total INTEGER,
        FOREIGN KEY(id_reapro_total) REFERENCES reapro_total(id)
    )`);

    db.run(`
      CREATE TABLE IF NOT EXISTS reapro_selecciones (
        id                INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre_trabajador TEXT    NOT NULL,
        id_reapro_total   INTEGER NOT NULL,
        created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(id_reapro_total)
          REFERENCES reapro_total(id)
          ON DELETE CASCADE
      )
    `);

    // Limpiar duplicados en reapro_selecciones
    db.run(`
      DELETE FROM reapro_selecciones
      WHERE rowid NOT IN (
        SELECT MIN(rowid)
        FROM reapro_selecciones
        GROUP BY nombre_trabajador, id_reapro_total
      )
    `);

    // Índice único para reapro_selecciones
    db.run(
        `
      CREATE UNIQUE INDEX IF NOT EXISTS
        ux_selecciones_trabajador_producto
      ON reapro_selecciones(nombre_trabajador, id_reapro_total)
      `,
        (err) => {
            if (err) {
                console.warn(
                    "⚠️ No se pudo crear índice único (puede que ya existan duplicados):",
                    err.message
                );
            }
        }
    );

    // Tabla para stock de reposición en altura
    db.run(`CREATE TABLE IF NOT EXISTS stock_altura (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ean         TEXT NOT NULL,
      ubicacion   TEXT NOT NULL
    )`);

    console.log("✅ Verificadas/creadas todas las tablas en", dbPath);
});

db.close();
