import * as SQLite from "expo-sqlite";

let db;

export function initDB() {
  try {
    db = SQLite.openDatabaseSync("antenas.db");
    db.execSync(`
      CREATE TABLE IF NOT EXISTS historico (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        operadora TEXT,
        tecnologia TEXT,
        sinal INTEGER,
        latitude REAL,
        longitude REAL,
        celular_id TEXT
      );
    `);
  } catch(e) {
    console.log("DB error:", e);
  }
}

export function salvarConexao(dados) {
  try {
    if (!db) initDB();
    db.runSync(
      `INSERT INTO historico (timestamp, operadora, tecnologia, sinal, latitude, longitude, celular_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        new Date().toISOString(),
        dados.operadora || "Desconhecido",
        dados.tecnologia || "?",
        dados.sinal || 0,
        dados.latitude || 0,
        dados.longitude || 0,
        dados.celularId || "?",
      ]
    );
  } catch(e) {
    console.log("Erro ao salvar:", e);
  }
}

export function buscarHistorico() {
  try {
    if (!db) initDB();
    return db.getAllSync("SELECT * FROM historico ORDER BY id DESC LIMIT 100");
  } catch(e) {
    console.log("Erro ao buscar:", e);
    return [];
  }
}

export function limparHistorico() {
  try {
    if (!db) initDB();
    db.runSync("DELETE FROM historico");
  } catch(e) {
    console.log("Erro ao limpar:", e);
  }
}

export default db;