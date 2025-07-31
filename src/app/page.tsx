'use client';
import { useEffect, useState } from 'react';

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
  processedCommits?: any[];
};

type DebugCommit = {
  sha: string;
  gitHubLogin: string | null;
  commitAuthorName: string;
  message: string;
  points: number;
  skipped: boolean;
  reason?: string;
};

export default function Home() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [debugData, setDebugData] = useState<DebugCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

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
        
        // Create debug data from the API response
        if (data.processedCommits) {
          const debug = data.processedCommits.map((commit: any) => ({
            sha: commit.sha,
            gitHubLogin: commit.author,
            commitAuthorName: commit.author,
            message: commit.message,
            points: commit.points,
            skipped: false
          }));
          setDebugData(debug);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
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

      {/* Debug Toggle Button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="mb-6 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-black font-semibold"
      >
        {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
      </button>

      {/* Debug Section */}
      {showDebug && (
        <div className="w-full max-w-6xl mb-8 bg-gray-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-yellow-400">🐛 Debug Information</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Raw Scores Data:</h3>
            <pre className="bg-gray-900 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(scores, null, 2)}
            </pre>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">All Participants Found:</h3>
            <div className="bg-gray-900 p-3 rounded">
              {allParticipants.length === 0 ? (
                <span className="text-red-400">No participants found!</span>
              ) : (
                allParticipants.map(p => (
                  <div key={p} className="text-green-400">✓ {p} (Score: {scores[p]})</div>
                ))
              )}
            </div>
          </div>

          {debugData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Recent Commits Processed:</h3>
              <div className="bg-gray-900 p-3 rounded max-h-64 overflow-y-auto">
                {debugData.slice(0, 10).map((commit, i) => (
                  <div key={i} className="mb-2 p-2 bg-gray-800 rounded text-sm">
                    <div><strong>SHA:</strong> {commit.sha}</div>
                    <div><strong>Author:</strong> {commit.gitHubLogin || 'Unknown'}</div>
                    <div><strong>Message:</strong> {commit.message}</div>
                    <div><strong>Points:</strong> <span className={commit.points > 0 ? 'text-green-400' : 'text-gray-400'}>{commit.points}</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Scorecards */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center mb-10">
        {allParticipants.map((name, index) => (
          <div
            key={name}
            className={`p-6 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 shadow-xl flex flex-col items-center justify-center`}
          >
            <div className="w-20 h-20 bg-white rounded-full border-4 border-white mb-4 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
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
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="py-2 px-4">Rank</th>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Score</th>
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
                  <td className="py-2 px-4 font-bold text-green-400">{scores[participant]}</td>
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