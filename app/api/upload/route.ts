import { NextRequest, NextResponse } from 'next/server';
import { parseWinamaxHandHistory, calculateStats } from '@/lib/winamaxParser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Lire le contenu du fichier
    const content = await file.text();

    // Parser le fichier
    const parsed = parseWinamaxHandHistory(content, file.name);

    // Calculer les stats
    const stats = calculateStats(parsed.games);

    // TODO: Sauvegarder dans la base de données avec Prisma
    // Pour l'instant, on retourne juste les données parsées
    // Une fois que Prisma sera correctement configuré, on pourra faire :
    /*
    await prisma.handHistory.create({
      data: {
        fileName: file.name,
        content: content,
        parsed: true
      }
    });

    for (const game of parsed.games) {
      await prisma.game.create({
        data: game
      });
    }
    */

    return NextResponse.json({
      success: true,
      fileName: file.name,
      gamesCount: parsed.games.length,
      games: parsed.games,
      stats
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du fichier' },
      { status: 500 }
    );
  }
}
