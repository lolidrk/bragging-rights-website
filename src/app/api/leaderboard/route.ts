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
    const debugInfo: any[] = []; // Just add this line
    
    console.log(`Found ${commits.length} total commits`);
    
    commits.forEach((commit, index) => {
      const gitHubLogin = commit.author?.login;
      const commitAuthorName = commit.commit.author.name;
      const commitAuthorEmail = commit.commit.author.email;
      const message = commit.commit.message;
      const sha = commit.sha;
      const date = commit.commit.author.date;
      
      // Add debug info - just add this block
      debugInfo.push({
        sha: sha.substring(0, 7),
        gitHubLogin: gitHubLogin,
        commitAuthorName: commitAuthorName,
        commitAuthorEmail: commitAuthorEmail,
        message: message.split('\n')[0],
        hasAuthorObject: !!commit.author,
        fullAuthorObject: commit.author,
        date: date
      });
      
      // Use GitHub login if available, otherwise use commit author name
      const authorKey = gitHubLogin || commitAuthorName;
      
      if (!authorKey) {
        console.log(`❌ Skipping commit ${sha.substring(0, 7)} - no author info at all`);
        return;
      }
      
      console.log(`✅ Using author: "${authorKey}" for commit ${sha.substring(0, 7)}`);
      
      let points = 0;
      if (/\[Easy\]/i.test(message)) points = 1;
      else if (/\[Medium\]/i.test(message)) points = 2;
      else if (/\[Hard\]/i.test(message)) points = 3;
      else {
        console.log(`📝 Non-scoring commit by ${authorKey}: ${message.split('\n')[0]}`);
        processedCommits.push({
          sha: sha.substring(0, 7),
          author: authorKey,
          message: message.split('\n')[0],
          points: 0,
          date,
        });
        return;
      }
      
      if (!scores[authorKey]) {
        scores[authorKey] = 0;
        details[authorKey] = [];
      }
      
      scores[authorKey] += points;
      details[authorKey].push({ message, sha, points, date });
      
      console.log(`✅ Scoring commit by ${authorKey}: +${points} points for "${message.split('\n')[0]}"`);
      
      processedCommits.push({
        sha: sha.substring(0, 7),
        author: authorKey,
        message: message.split('\n')[0],
        points,
        date,
      });
    });
    
    console.log('🏆 Final scores:', scores);
    console.log('📊 Users with details:', Object.keys(details));
    
    return NextResponse.json({ 
      scores, 
      details, 
      processedCommits,
      debugInfo: debugInfo.slice(0, 20) // Just add this line
    });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}