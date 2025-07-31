'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';

type CommitDetail = {
  message: string;
  sha: string;
  points: number;
  date: string;
};

type LeaderboardData = {
  scores: {
    [author: string]: number;
  };
  details: {
    [author: string]: CommitDetail[];
  };
};

export default function Home() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/leaderboard?ts=${Date.now()}`);
        if (!res.ok) {
          throw new Error(`Error fetching data: ${res.status}`);
        }

        const data = await res.json();
        setLeaderboardData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError('Failed to load leaderboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col justify-center items-center">
        <div className="text-2xl">Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col justify-center items-center">
        <div className="text-2xl text-red-400">Error: {error}</div>
        <button
          className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  const scores = leaderboardData?.scores || {};
  const details = leaderboardData?.details || {};
  const allParticipants = Object.keys(scores).sort((a, b) => scores[b] - scores[a]);

  // For tug of war
  const showTugOfWar = allParticipants.length === 2;
  const [p1, p2] = allParticipants;
  const total = (scores[p1] || 0) + (scores[p2] || 0) || 1;
  const p1Percent = ((scores[p1] || 0) / total) * 100;
  const p2Percent = ((scores[p2] || 0) / total) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col justify-center items-center px-4 py-12">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-12 text-center tracking-tight drop-shadow-md">
        🏆 Braggin' Rights Log
      </h1>

      {/* Dynamic Scorecards */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center mb-10">
        {allParticipants.map((name, index) => (
          <div
            key={name}
            className={`p-6 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 shadow-xl flex flex-col items-center justify-center`}
          >
            <Image
              src={`/${name.toLowerCase().replace(/\s+/g, '-')}-avatar.png`}
              alt={`${name} Avatar`}
              width={80}
              height={80}
              className="rounded-full border-4 border-white mb-4"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/default-avatar.png';
              }}
            />
            <div className="text-2xl font-bold">{name}</div>
            <div className="text-5xl font-extrabold mt-2">{scores[name]}</div>
          </div>
        ))}
      </div>

      {/* Tug of war bar */}
      {showTugOfWar && (
        <div className="w-full max-w-5xl h-10 flex rounded-full overflow-hidden bg-gray-700 shadow-inner border border-white/10 mb-8">
          <div
            className="bg-blue-500 transition-all duration-700"
            style={{ width: `${p1Percent}%` }}
          />
          <div
            className="bg-red-500 transition-all duration-700"
            style={{ width: `${p2Percent}%` }}
          />
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="w-full max-w-5xl bg-gray-800/70 rounded-xl p-6 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Full Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-2 px-4 text-left">Rank</th>
                <th className="py-2 px-4 text-left">Name</th>
                <th className="py-2 px-4 text-right">Points</th>
                <th className="py-2 px-4 text-right">Commits</th>
              </tr>
            </thead>
            <tbody>
              {allParticipants.map((participant, index) => (
                <tr
                  key={participant}
                  className="border-b border-gray-700"
                >
                  <td className="py-2 px-4 font-mono">{index + 1}</td>
                  <td className="py-2 px-4">{participant}</td>
                  <td className="py-2 px-4 text-right font-bold">{scores[participant]}</td>
                  <td className="py-2 px-4 text-right">
                    {details[participant]?.length || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-8 text-white/60 text-sm italic">
        Last updated: {new Date().toLocaleString()}
      </p>
    </div>
  );
}
