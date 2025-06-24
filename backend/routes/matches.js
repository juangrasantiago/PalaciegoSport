const express = require("express");
const router = express.Router();
const db = require("../db");

// Obtener todos los partidos de un equipo desde las tres tablas

router.get("/:id", async (req, res) => {
  const teamId = req.params.id;

  try {
    // Consultar las tres tablas en paralelo
    const [result1, result2, result3] = await Promise.all([
      db.query(`SELECT * FROM matches WHERE teams_id = $1 ORDER BY fecha DESC`, [teamId]),
      db.query(`SELECT * FROM matches2 WHERE teams_id = $1 ORDER BY fecha DESC`, [teamId]),
      db.query(`SELECT * FROM matches3 WHERE teams_id = $1 ORDER BY fecha DESC`, [teamId])
    ]);

    // Combinar los resultados y ordenarlos por fecha
    const combinedResults = [
      ...result1.rows,
      ...result2.rows,
      ...result3.rows
    ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    res.json(combinedResults);
  } catch (err) {
    console.error("ERROR en GET /matches/:id", err);
    res.status(500).json({ error: "Error al obtener los partidos" });
  }
});

module.exports = router;