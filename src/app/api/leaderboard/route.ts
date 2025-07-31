import { NextResponse } from 'next/server';

const REPO_OWNER = process.env.REPO_OWNER || 'lolidrk';
const REPO_NAME = process.env.REPO_NAME || 'bragging-rights-log';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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
    const scores: Record<string, number> = {};
    const details: Record<string, any[]> = {};
    const processedCommits: any[] = [];
    
    console.log(`Found ${commits.length} total commits`);
    
    commits.forEach((commit, index) => {
      const gitHubLogin = commit.author?.login;
      const commitAuthorName = commit.commit.author.name;
      const message = commit.commit.message;
      const sha = commit.sha;
      const date = commit.commit.author.date;
      
      // Detailed logging for each commit
      console.log(`Commit ${index + 1}:`, {
        sha: sha.substring(0, 7),
        gitHubLogin: gitHubLogin,
        commitAuthorName: commitAuthorName,
        message: message.split('\n')[0],
        hasAuthor: !!commit.author,
        authorObject: commit.author
      });
      
      if (!gitHubLogin) {
        console.log(`❌ Skipping commit ${sha.substring(0, 7)} - no GitHub login`);
        return;
      }
      
      let points = 0;
      if (/\[Easy\]/i.test(message)) points = 1;
      else if (/\[Medium\]/i.test(message)) points = 2;
      else if (/\[Hard\]/i.test(message)) points = 3;
      else {
        console.log(`📝 Non-scoring commit by ${gitHubLogin}: ${message.split('\n')[0]}`);
        processedCommits.push({
          sha: sha.substring(0, 7),
          author: gitHubLogin,
          message: message.split('\n')[0],
          points: 0,
          date,
        });
        return;
      }
      
      if (!scores[gitHubLogin]) {
        scores[gitHubLogin] = 0;
        details[gitHubLogin] = [];
      }
      
      scores[gitHubLogin] += points;
      details[gitHubLogin].push({ message, sha, points, date });
      
      console.log(`✅ Scoring commit by ${gitHubLogin}: +${points} points for "${message.split('\n')[0]}"`);
      
      processedCommits.push({
        sha: sha.substring(0, 7),
        author: gitHubLogin,
        message: message.split('\n')[0],
        points,
        date,
      });
    });
    
    console.log('🏆 Final scores:', scores);
    console.log('📊 Users with details is:', Object.keys(details));
    
    return NextResponse.json({ scores, details, processedCommits });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}