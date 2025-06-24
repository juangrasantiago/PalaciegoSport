const express = require("express");
const router = express.Router();
const puppeteer = require("puppeteer");

const CLASSIFICATION_URLS = {
  "palacios-senior": "https://es.besoccer.com/equipo/clasificacion/palacios-senior",
  "la-liara-balompie-senior": "https://es.besoccer.com/equipo/clasificacion/la-liara-balompie-senior",
  "mosqueo": "https://es.besoccer.com/equipo/clasificacion/mosqueo",
};

router.get("/", async (req, res) => {
  const teamParam = req.query.team;
  const url = CLASSIFICATION_URLS[teamParam];

  if (!url) {
    return res.status(400).json({ error: "Equipo no válido" });
  }

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("table");

    const tabla = await page.evaluate(() => {
      const primeraTabla = document.querySelector("table");
      if (!primeraTabla) return [];

      const filas = Array.from(primeraTabla.querySelectorAll("tbody tr"));
      return filas.map((fila) => {
        const celdas = fila.querySelectorAll("td");
        return {
          pos: celdas[0]?.innerText.trim(),
          equipo: celdas[2]?.innerText.trim(),
          jugados: celdas[4]?.innerText.trim(),
          puntos: celdas[celdas.length - 8]?.innerText.trim(),
          PG: celdas[celdas.length - 6]?.innerText.trim(),
          PE: celdas[celdas.length - 5]?.innerText.trim(),
          PP: celdas[celdas.length - 4]?.innerText.trim(),
          GF: celdas[celdas.length - 3]?.innerText.trim(),
          GC: celdas[celdas.length - 2]?.innerText.trim(),
        };
      });
    });

    await browser.close();
    res.json(tabla);
  } catch (err) {
    console.error("❌ Error al extraer la clasificación:", err.message);
    res.status(500).json({ error: "No se pudo obtener la clasificación" });
  }
});

module.exports = router;
