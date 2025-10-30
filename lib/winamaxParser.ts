export interface ParsedGame {
  gameId: string;
  tableName: string;
  gameType: string;
  buyIn: number;
  rake: number;
  multiplier?: number;
  position?: number;
  prize?: number;
  startTime: Date;
  endTime?: Date;
  playersCount: number;
  level?: string;
  blinds?: string;
}

export interface ParsedHandHistory {
  fileName: string;
  content: string;
  games: ParsedGame[];
}

/**
 * Parse un fichier d'historique Winamax
 */
export function parseWinamaxHandHistory(content: string, fileName: string): ParsedHandHistory {
  const games: ParsedGame[] = [];

  // Séparer les différentes mains
  const hands = content.split(/\n\n+/).filter(h => h.trim());

  const seenGameIds = new Set<string>();

  for (const hand of hands) {
    if (!hand.includes('Winamax Poker')) continue;

    try {
      const gameData = parseHand(hand);
      if (gameData && !seenGameIds.has(gameData.gameId)) {
        games.push(gameData);
        seenGameIds.add(gameData.gameId);
      }
    } catch (error) {
      console.error('Erreur lors du parsing d\'une main:', error);
    }
  }

  return {
    fileName,
    content,
    games
  };
}

function parseHand(hand: string): ParsedGame | null {
  const lines = hand.split('\n');
  const firstLine = lines[0];

  // Exemple de première ligne :
  // Winamax Poker - Tournament "SUNDAY SURPRISE" buyIn: 10€ + 1€ level: 0 - HandId: #123-456-789 - Holdem no limit (10/20) - 2024/01/01 20:00:00 UTC
  // Winamax Poker - Tournament "Expresso" buyIn: 1€ rake: 0.05€ level: 0 - Prize Pool: 2€ (multiplier x2) - HandId: #123

  if (!firstLine.includes('Winamax Poker')) return null;

  // Extraction de l'ID de la partie
  const gameIdMatch = firstLine.match(/HandId:\s*#([\d\-]+)/);
  if (!gameIdMatch) return null;
  const gameId = gameIdMatch[1];

  // Extraction du nom du tournoi/table
  const tableNameMatch = firstLine.match(/Tournament\s+"([^"]+)"/);
  const tableName = tableNameMatch ? tableNameMatch[1] : 'Unknown';

  // Extraction du type de jeu
  const gameTypeMatch = firstLine.match(/(Holdem|Omaha)\s+(no limit|pot limit|limit)/i);
  const gameType = gameTypeMatch ? `${gameTypeMatch[1]} ${gameTypeMatch[2]}` : 'Unknown';

  // Extraction du buy-in et rake
  let buyIn = 0;
  let rake = 0;

  const buyInMatch = firstLine.match(/buyIn:\s*([\d.]+)€?\s*\+\s*([\d.]+)€?/);
  if (buyInMatch) {
    buyIn = parseFloat(buyInMatch[1]);
    rake = parseFloat(buyInMatch[2]);
  } else {
    // Format alternatif : buyIn: 1€ rake: 0.05€
    const buyInMatch2 = firstLine.match(/buyIn:\s*([\d.]+)€?/);
    const rakeMatch2 = firstLine.match(/rake:\s*([\d.]+)€?/);
    if (buyInMatch2) buyIn = parseFloat(buyInMatch2[1]);
    if (rakeMatch2) rake = parseFloat(rakeMatch2[1]);
  }

  // Extraction du multiplicateur (pour les Expresso)
  let multiplier: number | undefined;
  const multiplierMatch = firstLine.match(/multiplier\s+x([\d.]+)/i);
  if (multiplierMatch) {
    multiplier = parseFloat(multiplierMatch[1]);
  }

  // Extraction de la date
  const dateMatch = firstLine.match(/(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  let startTime = new Date();
  if (dateMatch) {
    const [, year, month, day, hour, minute, second] = dateMatch;
    startTime = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
  }

  // Extraction du level
  const levelMatch = firstLine.match(/level:\s*(\d+)/);
  const level = levelMatch ? levelMatch[1] : undefined;

  // Extraction des blinds
  const blindsMatch = firstLine.match(/\((\d+\/\d+)\)/);
  const blinds = blindsMatch ? blindsMatch[1] : undefined;

  // Extraction du nombre de joueurs
  const secondLine = lines[1] || '';
  const playersMatch = secondLine.match(/(\d+)-max/);
  const playersCount = playersMatch ? parseInt(playersMatch[1]) : 9;

  // Chercher le résultat dans tout le texte
  let position: number | undefined;
  let prize: number | undefined;

  for (const line of lines) {
    // Exemple: "You finished in 1st place and won 2.00€"
    const resultMatch = line.match(/You finished in (\d+)(?:st|nd|rd|th) place and won ([\d.]+)€?/);
    if (resultMatch) {
      position = parseInt(resultMatch[1]);
      prize = parseFloat(resultMatch[2]);
    }

    // Autre format possible
    const resultMatch2 = line.match(/You finished the tournament in (\d+)(?:st|nd|rd|th) place/);
    if (resultMatch2) {
      position = parseInt(resultMatch2[1]);
    }
  }

  return {
    gameId,
    tableName,
    gameType,
    buyIn,
    rake,
    multiplier,
    position,
    prize,
    startTime,
    playersCount,
    level,
    blinds
  };
}

/**
 * Calcule les statistiques à partir des parties parsées
 */
export function calculateStats(games: ParsedGame[]) {
  const totalGames = games.length;
  const totalBuyIn = games.reduce((sum, g) => sum + g.buyIn, 0);
  const totalRake = games.reduce((sum, g) => sum + g.rake, 0);
  const totalPrize = games.reduce((sum, g) => sum + (g.prize || 0), 0);
  const profit = totalPrize - totalBuyIn - totalRake;

  const gamesWithMultiplier = games.filter(g => g.multiplier);
  const averageMultiplier = gamesWithMultiplier.length > 0
    ? gamesWithMultiplier.reduce((sum, g) => sum + (g.multiplier || 0), 0) / gamesWithMultiplier.length
    : 0;

  const maxMultiplier = Math.max(...games.map(g => g.multiplier || 0));

  return {
    totalGames,
    totalBuyIn: totalBuyIn.toFixed(2),
    totalRake: totalRake.toFixed(2),
    totalPrize: totalPrize.toFixed(2),
    profit: profit.toFixed(2),
    roi: totalBuyIn > 0 ? ((profit / totalBuyIn) * 100).toFixed(2) : '0.00',
    averageMultiplier: averageMultiplier.toFixed(2),
    maxMultiplier,
    gamesWithMultiplier: gamesWithMultiplier.length
  };
}
