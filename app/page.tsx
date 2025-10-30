'use client';

import { useState } from 'react';
import { ParsedGame } from '@/lib/winamaxParser';

interface UploadResponse {
  success: boolean;
  fileName: string;
  gamesCount: number;
  games: ParsedGame[];
  stats: {
    totalGames: number;
    totalBuyIn: string;
    totalRake: string;
    totalPrize: string;
    profit: string;
    roi: string;
    averageMultiplier: string;
    maxMultiplier: number;
    gamesWithMultiplier: number;
  };
}

export default function Home() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'upload');
      }

      const data: UploadResponse = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-white mb-4">
              Winamax Tracker
            </h1>
            <p className="text-xl text-purple-200">
              Analysez vos historiques de mains et suivez vos performances
            </p>
          </div>

          {/* Upload Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Uploader un historique
            </h2>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-purple-300 border-dashed rounded-lg cursor-pointer bg-purple-50/10 hover:bg-purple-50/20 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-12 h-12 mb-4 text-purple-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="mb-2 text-lg text-purple-200">
                    {uploading ? (
                      <span className="font-semibold">Upload en cours...</span>
                    ) : (
                      <>
                        <span className="font-semibold">Cliquez pour uploader</span> ou
                        glissez-déposez
                      </>
                    )}
                  </p>
                  <p className="text-sm text-purple-300">
                    Fichier texte d'historique Winamax
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.log"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
                {error}
              </div>
            )}
          </div>

          {/* Stats Section */}
          {result && (
            <>
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20">
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Statistiques globales
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Parties"
                    value={result.stats.totalGames}
                    color="purple"
                  />
                  <StatCard
                    label="Buy-in total"
                    value={`${result.stats.totalBuyIn}€`}
                    color="blue"
                  />
                  <StatCard
                    label="Rake total"
                    value={`${result.stats.totalRake}€`}
                    color="red"
                  />
                  <StatCard
                    label="Gains totaux"
                    value={`${result.stats.totalPrize}€`}
                    color="green"
                  />
                  <StatCard
                    label="Profit"
                    value={`${result.stats.profit}€`}
                    color={parseFloat(result.stats.profit) >= 0 ? 'green' : 'red'}
                  />
                  <StatCard
                    label="ROI"
                    value={`${result.stats.roi}%`}
                    color={parseFloat(result.stats.roi) >= 0 ? 'green' : 'red'}
                  />
                  <StatCard
                    label="Multi moyen"
                    value={`x${result.stats.averageMultiplier}`}
                    color="yellow"
                  />
                  <StatCard
                    label="Multi max"
                    value={`x${result.stats.maxMultiplier}`}
                    color="yellow"
                  />
                </div>
              </div>

              {/* Games List */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h2 className="text-2xl font-semibold text-white mb-6">
                  Parties détaillées ({result.gamesCount})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-white">
                    <thead className="text-xs uppercase bg-white/10">
                      <tr>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Tournoi</th>
                        <th className="px-6 py-3">Buy-in</th>
                        <th className="px-6 py-3">Rake</th>
                        <th className="px-6 py-3">Multi</th>
                        <th className="px-6 py-3">Position</th>
                        <th className="px-6 py-3">Gain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.games.map((game, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-white/10 hover:bg-white/5"
                        >
                          <td className="px-6 py-4 text-sm">
                            {new Date(game.startTime).toLocaleString('fr-FR')}
                          </td>
                          <td className="px-6 py-4 text-sm">{game.tableName}</td>
                          <td className="px-6 py-4 text-sm">{game.buyIn.toFixed(2)}€</td>
                          <td className="px-6 py-4 text-sm text-red-300">
                            {game.rake.toFixed(2)}€
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {game.multiplier ? (
                              <span className="text-yellow-300 font-semibold">
                                x{game.multiplier}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {game.position || '-'}
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-semibold ${
                              game.prize && game.prize > 0
                                ? 'text-green-300'
                                : 'text-gray-400'
                            }`}
                          >
                            {game.prize ? `${game.prize.toFixed(2)}€` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    red: 'from-red-500 to-red-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 shadow-lg`}
    >
      <div className="text-sm font-medium text-white/80 mb-2">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
