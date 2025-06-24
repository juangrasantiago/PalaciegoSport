import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [teams, setTeams] = useState({});
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("senior");
  const [clasificacion, setClasificacion] = useState([]);
  const [resultados, setResultados] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3001/teams")
      .then((res) => {
        const teamMap = {};
        res.data.forEach((team) => {
          teamMap[team.id] = team;
        });
        setTeams(teamMap);
      })
      .catch((err) => console.error("Error cargando equipos", err));
  }, []);

  useEffect(() => {
    if (selectedTeam && activeSection === "equipo") {
      axios.get(`http://localhost:3001/teams/${selectedTeam}/players?category=senior`)
        .then((res) => {
          setTeams(prev => ({
            ...prev,
            [selectedTeam]: {
              ...prev[selectedTeam],
              players: res.data,
            }
          }));
        })
        .catch((err) => console.error("Error cargando jugadores", err));
    }
  }, [selectedTeam, activeSection]);

  useEffect(() => {
    if (activeSection === "clasificacion" && selectedTeam) {
      const team = teams[selectedTeam];
      if (!team?.classification_id) return;

      axios.get(`http://localhost:3001/classification?team=${team.classification_id}`)
        .then((res) => setClasificacion(res.data))
        .catch((err) => console.error("Error cargando clasificación:", err));
    }
  }, [activeSection, selectedTeam, teams]);

  useEffect(() => {
    if (activeSection === "resultados" && selectedTeam) {
      axios.get(`http://localhost:3001/matches/${selectedTeam}`)
        .then((res) => setResultados(res.data))
        .catch((err) => console.error("Error cargando resultados:", err));
    }
  }, [activeSection, selectedTeam]);

  useEffect(() => {
    if (activeSection === "info" && selectedTeam) {
      axios.get(`http://localhost:3001/teams/${selectedTeam}`)
        .then((res) => {
          setTeams(prev => ({
            ...prev,
            [selectedTeam]: {
              ...prev[selectedTeam],
              ...res.data
            }
          }));
        })
        .catch((err) => console.error("Error cargando información del equipo:", err));
    }
  }, [activeSection, selectedTeam]);

  const teamData = selectedTeam ? teams[selectedTeam] : null;

  return (
    <div className="App">
      <header className="team-header">
        {Object.entries(teams).map(([key, team]) => (
          <img
            key={key}
            src={team.img_url}
            alt={team.name}
            onClick={() => {
              setSelectedTeam(key);
              setActiveSection(null);
            }}
            className="team-logo"
          />
        ))}
      </header>

      {teamData && (
        <main className="team-info" key={selectedTeam}>
          <div
            className="info-box"
            style={{
              backgroundColor: teamData.color,
              color: teamData.text_color || "#000000",
            }}
          >
            <h2 className="team-name">{teamData.name}</h2>
            <p className="team-description">{teamData.description}</p>

            <nav className="info-nav">
              <ul>
                <li><a onClick={() => setActiveSection("info")}>Info</a></li>
                <li>
                  <a
                    onClick={() => {
                      setSelectedCategory("senior");
                      setActiveSection("equipo");
                    }}
                  >
                    Equipo
                  </a>
                </li>
                {/* 
                CATEGORÍAS COMENTADAS PARA USAR EN EL FUTURO
                <li
                  className="category-container"
                  onMouseEnter={() => setHoveredTeam(true)}
                  onMouseLeave={() => setHoveredTeam(false)}
                >
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <a>Equipo</a>
                    {hoveredTeam && (
                      <ul className="category-dropdown">
                        {["alevin", "infantil", "cadete", "juvenil", "senior"].map((category) => (
                          <li
                            key={category}
                            onClick={() => {
                              setSelectedCategory(category);
                              setActiveSection("equipo");
                            }}
                            className={category === selectedCategory ? "active-category" : ""}
                          >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
                */}
                <li><a onClick={() => setActiveSection("resultados")}>Resultados</a></li>
                <li><a onClick={() => setActiveSection("clasificacion")}>Clasificación</a></li>
              </ul>
            </nav>

            {activeSection === "equipo" && (
              <div className="slide-container">
                <h3 className="category-title">Senior</h3>
                <table className="team-table">
                  <thead>
                    <tr style={{ backgroundColor: teamData.color, color: teamData.text_color || "#000" }}>
                      <th>Posición</th>
                      <th>Nombre</th>
                      <th>Edad</th>
                      <th>Tarjetas</th>
                      <th>Goles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const grouped = {
                        portero: [],
                        defensa: [],
                        centrocampista: [],
                        delantero: [],
                        otros: [],
                      };

                      (teamData.players || []).forEach((player) => {
                        const pos = player.position?.toLowerCase();
                        if (grouped[pos]) {
                          grouped[pos].push(player);
                        } else {
                          grouped.otros.push(player);
                        }
                      });

                      const getPositionIcon = (position) => {
                        const pos = position?.toLowerCase();
                        if (pos === "portero") return "🧤";
                        if (pos === "defensa") return "🛡️";
                        if (pos === "centrocampista") return "⚙️";
                        if (pos === "delantero") return "🎯";
                        return `🌀 ${position}`;
                      };

                      const renderGroup = (label, icon, list) => (
                        <>
                          {list.length > 0 && (
                            <>
                              <tr>
                                <td colSpan="5" className="group-header">
                                  {icon} <strong>{label}</strong>
                                </td>
                              </tr>
                              {list.map((player, idx) => (
                                <tr key={idx}>
                                  <td>{getPositionIcon(player.position)}</td>
                                  <td>{player.name}</td>
                                  <td>{player.age}</td>
                                  <td>
                                    <span className="card-yellow">🟨 {player.yellow_cards || 0}</span>{" "}
                                    <span className="card-red">🟥 {player.red_cards || 0}</span>
                                  </td>
                                  <td>{player.goals}</td>
                                </tr>
                              ))}
                            </>
                          )}
                        </>
                      );

                      return (
                        <>
                          {renderGroup("Porteros", "🧤", grouped.portero)}
                          {renderGroup("Defensas", "🛡️", grouped.defensa)}
                          {renderGroup("Centrocampistas", "⚙️", grouped.centrocampista)}
                          {renderGroup("Delanteros", "🎯", grouped.delantero)}
                          {renderGroup("Otros", "🌀", grouped.otros)}
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === "clasificacion" && (
              <div className="slide-container">
                <h3 className="category-title">3º Andaluza Sevilla</h3>
                <table className="team-table">
                  <thead>
                    <tr>
                      <th>Pos</th>
                      <th>Equipo</th>
                      <th>PJ</th>
                      <th>Puntos</th>
                      <th>PG</th>
                      <th>PE</th>
                      <th>PP</th>
                      <th>GF</th>
                      <th>GC</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clasificacion.map((fila, idx) => (
                      <tr key={idx}>
                        <td>{fila.pos}</td>
                        <td>{fila.equipo}</td>
                        <td>{fila.jugados}</td>
                        <td>{fila.puntos}</td>
                        <td>{fila.PG}</td>
                        <td>{fila.PE}</td>
                        <td>{fila.PP}</td>
                        <td>{fila.GF}</td>
                        <td>{fila.GC}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === "resultados" && (
              <div className="slide-container">
                <table className="team-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Local</th>
                      <th>Visitante</th>
                      <th>Resultado</th>
                      <th>Torneo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultados.map((match, idx) => (
                      <tr key={idx}>
                        <td>{new Date(match.fecha).toLocaleDateString()}</td>
                        <td>{match.local}</td>
                        <td>{match.visitante}</td>
                        <td>{match.resultado}</td>
                        <td>{match.torneo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeSection === "info" && teamData.info && (
              <div className={`slide-container ${teamData.style_class || ""} ${activeSection === "info" ? "info-style" : ""}`}>
                <div className="info-box-content">
                  <h3>Información del club</h3>
                  <p>{teamData.info}</p>
                </div>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
