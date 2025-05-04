import { NextResponse } from 'next/server';

const REPO_OWNER = process.env.REPO_OWNER || 'lolidrk';
const REPO_NAME = process.env.REPO_NAME || 'bragging-rights-log';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const nameMapping = {
  'lolidrk': 'kalyani',
  'Kalyani Kulkarni': 'kalyani',
  'kalyani': 'kalyani',
  'Tanmay-Kulkarni101': 'tanmay'
};

export async function GET() {
  try {
    const headers = GITHUB_TOKEN
      ? { Authorization: `token ${GITHUB_TOKEN}` }
      : {};
    
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=100`;
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const commits = await response.json();
    const scores = {};
    const details = {};
    
    const processedCommits = [];
    
    commits.forEach(commit => {
      const gitHubLogin = commit.author?.login;
      const commitAuthorName = commit.commit.author.name;
      const commitAuthorEmail = commit.commit.author.email;
      
      let displayAuthor;
      if (gitHubLogin && nameMapping[gitHubLogin]) {
        displayAuthor = nameMapping[gitHubLogin];
      } else if (nameMapping[commitAuthorName]) {
        displayAuthor = nameMapping[commitAuthorName];
      } else {
        displayAuthor = nameMapping[commitAuthorName] || commitAuthorName;
      }
      
      const message = commit.commit.message;
      const sha = commit.sha;
      const date = commit.commit.author.date;
      
      let points = 0;
      if (/\[Easy\]/i.test(message)) points = 1;
      else if (/\[Medium\]/i.test(message)) points = 2;
      else if (/\[Hard\]/i.test(message)) points = 3;
      else {
        processedCommits.push({
          sha: sha.substring(0, 7),
          author: displayAuthor,
          message: message.split('\n')[0],
          points: 0,
          date
        });
        return;
      }
      
      if (!scores[displayAuthor]) {
        scores[displayAuthor] = 0;
        details[displayAuthor] = [];
      }
      
      scores[displayAuthor] += points;
      details[displayAuthor].push({ message, sha, points, date });
      
      processedCommits.push({
        sha: sha.substring(0, 7),
        author: displayAuthor,
        message: message.split('\n')[0],
        points,
        date
      });
    });
    
    console.log('🏆 Bragging Rights Leaderboard:', scores);
    return NextResponse.json({ 
      scores, 
      details,
      processedCommits
    });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}