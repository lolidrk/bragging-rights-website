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
    console.log(`🔍 Fetching commits from: ${url}`);
    console.log(`📅 Current time: ${new Date().toISOString()}`);
    console.log(`🔑 Using token: ${GITHUB_TOKEN ? 'Yes' : 'No'}`);
    
    const response = await fetch(url, { 
      headers,
      cache: 'no-store' // Force fresh data
    });
    
    console.log(`📡 GitHub API Response Status: ${response.status}`);
    console.log(`📦 Rate limit remaining: ${response.headers.get('x-ratelimit-remaining')}`);
    console.log(`🔄 Rate limit reset: ${response.headers.get('x-ratelimit-reset')}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ GitHub API Error: ${response.status} - ${errorText}`);
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const commits = await response.json();
    console.log(`📊 Total commits received: ${commits.length}`);
    
    // Log the first few commits to see what we're getting
    commits.slice(0, 5).forEach((commit, i) => {
      console.log(`Commit ${i + 1}:`, {
        sha: commit.sha.substring(0, 7),
        author_login: commit.author?.login,
        author_name: commit.commit.author.name,
        date: commit.commit.author.date,
        message: commit.commit.message.split('\n')[0]
      });
    });
    const scores: Record<string, number> = {};
    const details: Record<string, any[]> = {};
    const processedCommits: any[] = [];
    const debugInfo: any[] = []; // Add debug info array
    
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
      
      if (!scores[authorKey]) {
        scores[authorKey] = 0;
        details[authorKey] = [];
        console.log(`🆕 Created new entry for: ${authorKey}`);
      }
      
      scores[authorKey] += points;
      details[authorKey].push({ message, sha, points, date });
      
      console.log(`🏆 Added ${points} points to ${authorKey} for: "${message.split('\n')[0]}"`);
      
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
      debugInfo: debugInfo.slice(0, 20) // Include debug info (first 20 commits)
    });
  } catch (error) {
    console.error('💥 FULL ERROR:', error);
    console.error('💥 ERROR MESSAGE:', error instanceof Error ? error.message : 'Unknown error');
    console.error('💥 ERROR STACK:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch leaderboard data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}