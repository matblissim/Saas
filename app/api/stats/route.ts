import { NextResponse } from 'next/server';

// Pour l'instant, retourne des stats vides
// TODO: Récupérer les vraies stats depuis la DB quand Prisma sera configuré
export async function GET() {
  try {
    // const games = await prisma.game.findMany();
    // return NextResponse.json(calculateStats(games));

    return NextResponse.json({
      totalGames: 0,
      totalBuyIn: '0.00',
      totalRake: '0.00',
      totalPrize: '0.00',
      profit: '0.00',
      roi: '0.00',
      averageMultiplier: '0.00',
      maxMultiplier: 0,
      gamesWithMultiplier: 0
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des stats' },
      { status: 500 }
    );
  }
}
