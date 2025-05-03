// src/app/page.tsx
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
  
  // Customize these values - use the exact names as they appear in commit authors
  const me = 'kalyani'; // Your GitHub username/name as it appears in commits
  const bro = 'tanmay'; // Your competitor's name as it appears in commits
  
  // You can also add alternative names/spellings if needed
  const myAliases = ['kalyani', 'Kalyani Kulkarni'];
  const broAliases = ['tanmay', 'Tanmay'];

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        // Use relative URL for API route - works in both dev and production
        const res = await fetch('/api/leaderboard');
        
        if (!res.ok) {
          throw new Error(`Error fetching data: ${res.status}`);
        }
        
        const data = await res.json();
        console.log('Fetched data:', data);
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
  
  // Calculate combined scores for aliases
  const combinedScores = { ...scores };
  
  // Combine scores for all my aliases
  let myScore = 0;
  myAliases.forEach(alias => {
    if (scores[alias]) {
      myScore += scores[alias];
    }
  });
  
  // Combine scores for all bro aliases
  let broScore = 0;
  broAliases.forEach(alias => {
    if (scores[alias]) {
      broScore += scores[alias];
    }
  });
  
  // Create a cleaned up version of scores for display
  const displayScores = { ...scores };
  myAliases.forEach(alias => {
    if (alias !== me && displayScores[alias]) {
      delete displayScores[alias];
    }
  });
  broAliases.forEach(alias => {
    if (alias !== bro && displayScores[alias]) {
      delete displayScores[alias];
    }
  });
  if (myScore > 0) displayScores[me] = myScore;
  if (broScore > 0) displayScores[bro] = broScore;
  
  const allParticipants = Object.keys(displayScores).sort((a, b) => displayScores[b] - displayScores[a]);
  const total = myScore + broScore || 1; // Avoid division by zero
  const myPercent = (myScore / total) * 100;
  const broPercent = (broScore / total) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col justify-center items-center px-4 py-12">
      <h1 className="text-4xl sm:text-5xl font-extrabold mb-12 text-center tracking-tight drop-shadow-md">
        🏆 Braggin' Rights Log
      </h1>
      
      {/* Scoreboard */}
      <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 gap-4 text-center mb-10">
        {/* You */}
        <div className="p-6 rounded-xl bg-blue-600/90 shadow-xl flex flex-col items-center justify-center transition-all">
          <Image
            src="/me-avatar.png"
            alt="Me Avatar"
            width={80}
            height={80}
            className="rounded-full border-4 border-white mb-4"
          />
          <div className="text-2xl font-bold">{me}</div>
          <div className="text-5xl font-extrabold mt-2">{myScore}</div>
        </div>
        
        {/* Brother/Competitor */}
        <div className={`p-6 rounded-xl ${bro && scores[bro] ? 'bg-red-600/90' : 'bg-gray-700/50'} shadow-xl flex flex-col items-center justify-center`}>
          <Image
            src="/bro-avatar.png"
            alt="Competitor Avatar"
            width={80}
            height={80}
            className="rounded-full border-4 border-white mb-4"
          />
          <div className="text-2xl font-bold">{bro || "Challenger"}</div>
          <div className="text-5xl font-extrabold mt-2">{broScore}</div>
        </div>
      </div>
      
      {/* Tug of war bar */}
      <div className="w-full max-w-5xl h-10 flex rounded-full overflow-hidden bg-gray-700 shadow-inner border border-white/10 mb-8">
        <div
          className="bg-blue-500 transition-all duration-700"
          style={{ width: `${myPercent}%` }}
        />
        <div
          className="bg-red-500 transition-all duration-700"
          style={{ width: `${broPercent}%` }}
        />
      </div>
      
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
                  className={`border-b border-gray-700 ${
                    participant === me 
                      ? 'bg-blue-900/30' 
                      : participant === bro 
                        ? 'bg-red-900/30' 
                        : ''
                  }`}
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
