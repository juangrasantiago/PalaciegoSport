const express = require("express");
const router = express.Router();
const db = require("../db");

// ✅ RUTA PARA OBTENER TODOS LOS EQUIPOS
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM teams ORDER BY id");
    res.json(result.rows);
  } catch (err) {
    console.error("ERROR en GET /teams:", err);
    res.status(500).json({ error: "Error al obtener equipos" });
  }
});

// ✅ RUTA PARA OBTENER INFORMACIÓN DETALLADA DE UN EQUIPO
router.get("/:id", async (req, res) => {
  const teamId = req.params.id;

  try {
    const result = await db.query("SELECT * FROM teams WHERE id = $1", [teamId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Equipo no encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("ERROR en GET /teams/:id:", err);
    res.status(500).json({ error: "Error al obtener el equipo" });
  }
});

// ✅ RUTA PARA OBTENER JUGADORES DE UN EQUIPO Y CATEGORÍA (ORDENADOS TÁCTICAMENTE)
router.get("/:id/players", async (req, res) => {
  const teamId = req.params.id;
  const category = req.query.category;

  try {
    let result;

    // 👇 SQL para orden personalizado por posición táctica
    const ORDER_BY_POSITION = `
      ORDER BY 
        CASE 
          WHEN LOWER(p.position) = 'portero' THEN 1
          WHEN LOWER(p.position) = 'defensa' THEN 2
          WHEN LOWER(p.position) = 'centrocampista' THEN 3
          WHEN LOWER(p.position) = 'delantero' THEN 4
          ELSE 5
        END,
        p.numero::int
    `;

    if (category) {
      result = await db.query(
        `SELECT p.id, p.team_id, p.numero, p.name, p.age, p.position, 
                p.yellow_cards, p.red_cards, p.goals, c.name AS category_name
         FROM players p
         JOIN categories c ON p.categories_id = c.id
         WHERE p.team_id = $1 AND c.name ILIKE $2
         ${ORDER_BY_POSITION}`,
        [teamId, category]
      );
    } else {
      result = await db.query(
        `SELECT p.id, p.team_id, p.numero, p.name, p.age, p.position, 
                p.yellow_cards, p.red_cards, p.goals, c.name AS category_name
         FROM players p
         JOIN categories c ON p.categories_id = c.id
         WHERE p.team_id = $1
         ${ORDER_BY_POSITION}`,
        [teamId]
      );
    }

    res.json(result.rows);
  } catch (err) {
    console.error("ERROR en /teams/:id/players:", err);
    res.status(500).json({ error: "Error al obtener jugadores" });
  }
});

// ✅ RUTA PARA ACTUALIZAR TARJETAS DE UN JUGADOR
router.patch("/:teamId/players/:playerId/cards", async (req, res) => {
  const { teamId, playerId } = req.params;
  const { yellow_cards, red_cards } = req.body;

  if (typeof yellow_cards !== 'number' || typeof red_cards !== 'number') {
    return res.status(400).json({ error: "Datos de tarjetas inválidos" });
  }

  try {
    const result = await db.query(
      `UPDATE players 
       SET yellow_cards = $1, red_cards = $2 
       WHERE id = $3 AND team_id = $4
       RETURNING *`,
      [yellow_cards, red_cards, playerId, teamId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Jugador no encontrado en este equipo" });
    }

    res.json({
      success: true,
      player: result.rows[0],
      message: "Tarjetas actualizadas correctamente"
    });
  } catch (err) {
    console.error("ERROR en PATCH /:teamId/players/:playerId/cards:", err);
    res.status(500).json({ error: "Error al actualizar tarjetas" });
  }
});

// ✅ RUTA PARA AÑADIR UN NUEVO JUGADOR
router.post("/:teamId/players", async (req, res) => {
  const { teamId } = req.params;
  const { numero, name, age, position, yellow_cards = 0, red_cards = 0, goals = 0, categories_id } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO players 
       (team_id, numero, name, age, position, yellow_cards, red_cards, goals, categories_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [teamId, numero, name, age, position, yellow_cards, red_cards, goals, categories_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("ERROR en POST /:teamId/players:", err);
    res.status(500).json({ error: "Error al crear jugador" });
  }
});

module.exports = router;
