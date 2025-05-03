import { NextResponse } from 'next/server';

const REPO_OWNER = process.env.REPO_OWNER || 'lolidrk';
const REPO_NAME = process.env.REPO_NAME || 'bragging-rights-log';


const nameMapping = {
  'lolidrk': 'kalyani',
  'Tanmay-Kulkarni101': 'tanmay'
};

export async function GET() {
  try {
    const headers = GITHUB_TOKEN
      ? { Authorization: `token ${GITHUB_TOKEN}` }
      : {};
    
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const commits = await response.json();
    const scores = {};
    const details = {};
    
    commits.forEach(commit => {
      const githubAuthor = commit.commit.author.name;
      const displayAuthor = nameMapping[githubAuthor] || githubAuthor;
      
      const message = commit.commit.message;
      const sha = commit.sha;
      const date = commit.commit.author.date;
      
      let points = 0;
      if (/\[Easy\]/i.test(message)) points = 1;
      else if (/\[Medium\]/i.test(message)) points = 2;
      else if (/\[Hard\]/i.test(message)) points = 3;
      else return; // Skip this commit if no valid tag
      
      if (!scores[displayAuthor]) {
        scores[displayAuthor] = 0;
        details[displayAuthor] = [];
      }
      
      scores[displayAuthor] += points;
      details[displayAuthor].push({ message, sha, points, date });
    });
    
    console.log('🏆 Bragging Rights Leaderboard:', scores);
    return NextResponse.json({ scores, details });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}