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

  // Chercher d'abord le Tournament summary
  const summaryMatch = content.match(/Winamax Poker - Tournament summary[\s\S]*?(?=\n\n|$)/);

  if (summaryMatch) {
    // Si on trouve un summary, parser le tournoi complet
    const game = parseTournamentSummary(summaryMatch[0], content);
    if (game) {
      games.push(game);
    }
  } else {
    // Sinon, parser les mains individuellement (ancien format)
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
  }

  return {
    fileName,
    content,
    games
  };
}

/**
 * Parse un Tournament summary complet
 */
function parseTournamentSummary(summary: string, fullContent: string): ParsedGame | null {
  try {
    // Extraire le nom du tournoi
    // Winamax Poker - Tournament summary : Expresso Nitro(1009246096)
    const tournamentMatch = summary.match(/Tournament summary\s*:\s*([^(]+)\((\d+)\)/);
    const tableName = tournamentMatch ? tournamentMatch[1].trim() : 'Unknown';
    const tournamentId = tournamentMatch ? tournamentMatch[2] : 'unknown';

    // Extraire Buy-In : 0.93€ + 0.07€
    const buyInMatch = summary.match(/Buy-In\s*:\s*([\d.]+)€\s*\+\s*([\d.]+)€/);
    const buyIn = buyInMatch ? parseFloat(buyInMatch[1]) : 0;
    const rake = buyInMatch ? parseFloat(buyInMatch[2]) : 0;

    // Extraire le nombre de joueurs
    const playersMatch = summary.match(/Registered players\s*:\s*(\d+)/);
    const playersCount = playersMatch ? parseInt(playersMatch[1]) : 0;

    // Extraire le prizepool
    const prizepoolMatch = summary.match(/Prizepool\s*:\s*([\d.]+)€/);
    const prizepool = prizepoolMatch ? parseFloat(prizepoolMatch[1]) : 0;

    // Calculer le multiplicateur potentiel
    // Multiplicateur = prizepool total / (buy-in sans rake × nombre de joueurs)
    let multiplier: number | undefined;
    if (buyIn > 0 && playersCount > 0) {
      const totalBuyIn = buyIn * playersCount;
      if (totalBuyIn > 0 && prizepool > 0) {
        multiplier = Math.round((prizepool / totalBuyIn) * 10) / 10; // Arrondi à 1 décimale
      }
    }

    // Extraire la position finale
    const positionMatch = summary.match(/You finished in (\d+)(?:st|nd|rd|th) place/);
    const position = positionMatch ? parseInt(positionMatch[1]) : undefined;

    // Calculer le gain en fonction de la position (pour l'instant on ne l'a pas dans le summary)
    // On pourrait chercher dans les dernières mains pour voir le stack final
    let prize: number | undefined;

    // Pour un Expresso 3-max standard :
    if (position === 1 && prizepool > 0) {
      prize = prizepool; // Le gagnant prend tout
    }

    // Extraire les dates
    const startMatch = summary.match(/Tournament started (\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
    let startTime = new Date();
    if (startMatch) {
      const [, year, month, day, hour, minute, second] = startMatch;
      startTime = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
    }

    // Chercher la première main pour avoir le HandId et le game type
    const firstHandMatch = fullContent.match(/HandId:\s*#([\d\-]+).*?(Holdem|Omaha)\s+(no limit|pot limit|limit)/i);
    const gameId = firstHandMatch ? firstHandMatch[1] : tournamentId;
    const gameType = firstHandMatch ? `${firstHandMatch[2]} ${firstHandMatch[3]}` : 'Holdem no limit';

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
    };
  } catch (error) {
    console.error('Erreur lors du parsing du tournament summary:', error);
    return null;
  }
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
