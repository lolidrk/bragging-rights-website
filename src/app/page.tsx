'use client';
import { useEffect, useState } from 'react';

type FileDetail = {
  path: string;
  fileName: string;
  points: number;
  difficulty: string;
  message: string;
  sha: string;
  date: string;
  commitAuthor?: string;
};

type LeaderboardData = {
  scores: {
    [folderOwner: string]: number;
  };
  details: {
    [folderOwner: string]: FileDetail[];
  };
  processedFiles?: any[];
  debugInfo?: any[];
  totalFiles?: number;
  scoredFiles?: number;
};

export default function Home() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/leaderboard?ts=${Date.now()}&nocache=${Math.random()}`);

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Error fetching data: ${res.status} - ${errorData.error || 'Unknown error'} - ${errorData.details || ''}`);
        }

        const data = await res.json();
        setLeaderboardData(data);
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

  // Use folder names as participant names (sorted by score)
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
          
          {/* Summary Stats */}
          <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Total Files</div>
              <div className="text-2xl font-bold text-blue-400">{leaderboardData?.totalFiles || 0}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Scored Files</div>
              <div className="text-2xl font-bold text-green-400">{leaderboardData?.scoredFiles || 0}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Participants</div>
              <div className="text-2xl font-bold text-purple-400">{allParticipants.length}</div>
            </div>
            <div className="bg-gray-900 p-3 rounded">
              <div className="text-sm text-gray-400">Total Points</div>
              <div className="text-2xl font-bold text-yellow-400">{Object.values(scores).reduce((a, b) => a + b, 0)}</div>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-2">Folder Scores:</h3>
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
                  <div key={p} className="text-green-400 mb-1">
                    ✓ {p} (Score: {scores[p]}, Files: {details[p]?.length || 0})
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Processed Files Debug */}
          {leaderboardData?.processedFiles && leaderboardData.processedFiles.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">📁 Processed Files (First 10):</h3>
              <div className="bg-gray-900 p-3 rounded max-h-96 overflow-y-auto">
                {leaderboardData.processedFiles.slice(0, 10).map((file, i) => (
                  <div key={i} className="mb-3 p-3 bg-gray-800 rounded text-sm border-l-4 border-blue-500">
                    <div className="grid grid-cols-2 gap-2">
                      <div><strong>Path:</strong> <span className="text-blue-400">{file.path}</span></div>
                      <div><strong>Points:</strong> <span className={file.points > 0 ? 'text-green-400' : 'text-gray-400'}>{file.points}</span></div>
                      <div><strong>Folder Owner:</strong> <span className="text-yellow-400">{file.folderOwner}</span></div>
                      <div><strong>Commit Author:</strong> <span className="text-purple-400">{file.commitAuthor}</span></div>
                      <div><strong>Difficulty:</strong> <span className="text-cyan-400">{file.difficulty}</span></div>
                      <div><strong>SHA:</strong> <span className="text-gray-400">{file.sha}</span></div>
                    </div>
                    <div className="mt-2"><strong>Latest Commit Message:</strong> {file.message}</div>
                    <div className="mt-1 text-xs text-gray-400">Date: {new Date(file.date).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Debug Info from API */}
          {leaderboardData?.debugInfo && leaderboardData.debugInfo.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">🔍 Raw Debug Info:</h3>
              <div className="bg-gray-900 p-3 rounded max-h-96 overflow-y-auto">
                {leaderboardData.debugInfo.slice(0, 15).map((item, i) => (
                  <div key={i} className="mb-2 p-2 bg-gray-800 rounded text-xs">
                    <div className={`font-mono ${item.type === 'scored' ? 'text-green-400' : 
                                                  item.type === 'error' ? 'text-red-400' : 'text-gray-400'}`}>
                      [{item.type?.toUpperCase()}] {item.path}
                    </div>
                    {item.reason && <div className="text-yellow-400">Reason: {item.reason}</div>}
                    {item.points > 0 && <div className="text-green-400">Points: {item.points} ({item.difficulty})</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dynamic Scorecards */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center mb-10">
        {allParticipants.map((folderName, index) => {
          // Map folder names to proper image sources
          let imageSrc = '/default-avatar.png';
          if (folderName === 'lolidrk' || folderName === 'kalyani') {
            imageSrc = '/me-avatar.png';
          } else if (folderName === 'tanmay' || folderName === 'Tanmay-Kulkarni101' || folderName === 'tanmay-kulkarni') {
            imageSrc = '/bro-avatar.png';
          }

          return (
            <div
              key={folderName}
              className={`p-6 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 shadow-xl flex flex-col items-center justify-center`}
            >
              <img
                src={imageSrc}
                alt={`${folderName} Avatar`}
                width={80}
                height={80}
                className="rounded-full border-4 border-white mb-4"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/default-avatar.png';
                }}
              />
              <div className="text-2xl font-bold">{folderName}</div>
              <div className="text-5xl font-extrabold mt-2">{scores[folderName]}</div>
              <div className="text-sm text-white/70 mt-1">
                {details[folderName]?.length || 0} files
              </div>
            </div>
          );
        })}
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
                <th className="py-2 px-4">Folder Name</th>
                <th className="py-2 px-4">Score</th>
                <th className="py-2 px-4">Files</th>
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
                  <td className="py-2 px-4 text-blue-400">{details[participant]?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* File Details Section */}
      {allParticipants.length > 0 && (
        <div className="w-full max-w-5xl mt-8 bg-gray-800/70 rounded-xl p-6 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-center">File Breakdown</h2>
          {allParticipants.map((participant) => {
            const userFiles = details[participant] || [];
            if (userFiles.length === 0) return null;
            
            return (
              <div key={participant} className="mb-6">
                <h3 className="text-xl font-semibold mb-2 text-blue-400">{participant}</h3>
                <div className="space-y-2">
                  {userFiles.map((file, idx) => (
                    <div key={idx} className="bg-gray-900 p-3 rounded flex justify-between items-center">
                      <div>
                        <div className="font-mono text-sm text-gray-300">{file.fileName}</div>
                        <div className="text-xs text-gray-500">{file.path}</div>
                        {file.commitAuthor && file.commitAuthor !== participant && (
                          <div className="text-xs text-yellow-400">Committed by: {file.commitAuthor}</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${file.points > 0 ? 'text-green-400' : 'text-gray-500'}`}>
                          {file.points} pts
                        </div>
                        <div className="text-xs text-gray-400">{file.difficulty}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-white/60 text-sm italic">
        Last updated: {new Date().toLocaleString()}
      </p>
    </div>
  );
}