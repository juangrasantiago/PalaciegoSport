const express = require("express");
const cors = require("cors");
require("dotenv").config();

const teamsRouter = require("./routes/teams");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use("/teams", teamsRouter);

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en el puerto ${PORT}`);
});

const classificationRouter = require("./routes/classification");

app.use("/classification", classificationRouter);

const matchesRouter = require("./routes/matches");
app.use("/matches", matchesRouter);
