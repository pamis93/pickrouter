import getDb from "./getDb.js";
import bcrypt from "bcryptjs";

const db = getDb();

const users = [
    { nombre: "Ale", role: "admin" },
    { nombre: "Paco", role: "supervisor" },
    { nombre: "Manu", role: "operario" },
    { nombre: "Edu", role: "operario" },
    { nombre: "Fran", role: "operario" },
];

db.serialize(() => {
    // Borra primero todos los usuarios
    db.run("DELETE FROM usuarios", (err) => {
        if (err) {
            console.error("❌ Error borrando usuarios:", err);
            db.close();
            return;
        }

        const stmt = db.prepare(
            `INSERT INTO usuarios (nombre, password, role) VALUES (?, ?, ?)`
        );

        users.forEach(({ nombre, role }) => {
            const password = `${nombre}123`;
            const hash = bcrypt.hashSync(password, 10);
            stmt.run(nombre, hash, role);
            console.log(`Inserted ${nombre}/${password} as ${role}`);
        });

        stmt.finalize((err) => {
            if (err) console.error("Error finalizando seed:", err);
            else console.log("✅ Seed completado.");
            db.close();
        });
    });
});
