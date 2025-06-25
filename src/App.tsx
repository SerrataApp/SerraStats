import { useState, useEffect } from "react";
import "./App.css";

interface StatData {
  temps?: number;
  nom?: string;
  drapeau?: string;
  temps_actuel?: string;
}

interface Stat {
  data: StatData;
  id: string;
  type: string;
  user_id: number;
}

interface CountryCount {
  name: string;
  count: number;
  percentage: string;
}

interface ApiResponse {
  data: Stat[];
}

function App() {
  const [userId, setUserId] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [drapeau, setDrapeau] = useState<string>("");
  const [filteredStats, setFilteredStats] = useState<Stat[]>([]);
  const [allStats, setAllStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour récupérer les données depuis l'API
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "https://serrata-stats.super-sympa.fr/api/events/list"
      );

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      setAllStats(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      console.error("Erreur lors du chargement des données:", err);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    let filtered = allStats;

    if (userId) {
      filtered = filtered.filter((stat) => stat.user_id === parseInt(userId));
    }

    if (type) {
      filtered = filtered.filter((stat) => stat.type === type);
    }

    if (drapeau) {
      filtered = filtered.filter((stat) => stat.data.drapeau === drapeau);
    }

    setFilteredStats(filtered);
  };

  const handleReset = () => {
    setUserId("");
    setType("");
    setDrapeau("");
    setFilteredStats([]);
  };

  const handleRefresh = () => {
    fetchData();
    setFilteredStats([]);
  };

  // Fonction pour grouper les statistiques par drapeau
  const getStatsByFlag = () => {
    const grouped = filteredStats.reduce((acc, stat) => {
      const flagName = stat.data.drapeau || "Tous drapeaux";
      if (!acc[flagName]) {
        acc[flagName] = [];
      }
      acc[flagName].push(stat);
      return acc;
    }, {} as Record<string, Stat[]>);

    return grouped;
  };

  // Fonction pour obtenir la liste des pays triés par nombre de résultats
  const getCountriesByCount = (): CountryCount[] => {
    const flagCounts = getStatsByFlag();
    const total = filteredStats.length;

    return Object.entries(flagCounts)
      .map(([flagName, stats]) => ({
        name: flagName,
        count: stats.length,
        percentage:
          total > 0 ? ((stats.length / total) * 100).toFixed(1) + "%" : "0%",
      }))
      .sort((a, b) => b.count - a.count); // Trier par nombre décroissant
  };

  const countriesByCount = getCountriesByCount();

  // Affichage de l'état de chargement
  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <h2>⏳ Chargement des données...</h2>
          <p>Récupération des statistiques depuis l'API</p>
        </div>
      </div>
    );
  }

  // Affichage de l'erreur
  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>❌ Erreur de chargement</h2>
          <p>{error}</p>
          <button onClick={handleRefresh} className="refresh-btn">
            🔄 Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <div className="header">
          <h1>Recherche de Statistiques par Drapeau</h1>
          <div className="header-info">
            <span className="total-stats">
              📊 {allStats.length} événements chargés
            </span>
            <button
              onClick={handleRefresh}
              className="refresh-btn"
              title="Actualiser les données"
            >
              🔄 Actualiser
            </button>
          </div>
        </div>

        <div className="search-form">
          <div className="form-group">
            <label htmlFor="userId">User ID:</label>
            <input
              type="number"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Entrez l'ID utilisateur"
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type:</label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="erreur">Erreur</option>
              <option value="passer">Passer</option>
              <option value="indice">Indice</option>
            </select>
          </div>

          <div className="buttons">
            <button onClick={handleSearch} className="search-btn">
              🔍 Rechercher
            </button>
            <button onClick={handleReset} className="reset-btn">
              🗑️ Réinitialiser
            </button>
          </div>
        </div>

        <div className="results">
          <h2>Résultats ({filteredStats.length})</h2>

          {filteredStats.length > 0 && (
            <div className="countries-ranking">
              <h3>🏆 Classement des pays par nombre de résultats</h3>
              <div className="ranking-list">
                {countriesByCount.map((country, index) => (
                  <div key={country.name} className="ranking-item">
                    <div className="ranking-position">{index + 1}</div>
                    <div className="ranking-flag">🏁</div>
                    <div className="ranking-details">
                      <div className="ranking-name">{country.name}</div>
                      <div className="ranking-stats">
                        {country.count} résultat{country.count > 1 ? "s" : ""} (
                        {country.percentage})
                      </div>
                    </div>
                    <div className="ranking-bar">
                      <div
                        className="ranking-bar-fill"
                        style={{
                          width: country.percentage,
                          backgroundColor:
                            index === 0
                              ? "#FFD700"
                              : index === 1
                              ? "#C0C0C0"
                              : index === 2
                              ? "#CD7F32"
                              : "#007bff",
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
