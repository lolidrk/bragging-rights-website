import { NextResponse } from 'next/server';

const REPO_OWNER = process.env.REPO_OWNER || 'lolidrk';
const REPO_NAME = process.env.REPO_NAME || 'bragging-rights-log';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

export async function GET() {
  try {
    const headers = GITHUB_TOKEN
      ? { Authorization: `token ${GITHUB_TOKEN}` }
      : {};
    
    // First, get the current file tree
    const treeUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/trees/main?recursive=1`;
    const treeResponse = await fetch(treeUrl, { headers });
    
    if (!treeResponse.ok) {
      throw new Error(`GitHub API error: ${treeResponse.status}`);
    }
    
    const tree = await treeResponse.json();
    const scores: Record<string, number> = {};
    const details: Record<string, any[]> = {};
    const processedFiles: any[] = [];
    const debugInfo: any[] = [];
    
    console.log(`Found ${tree.tree.length} total items in repository`);
    
    // Get all files in user folders
    const userFiles = tree.tree.filter((item) => {
      if (item.type !== 'blob') return false;
      const pathParts = item.path.split('/');
      return pathParts.length >= 2; // Must be in a user folder
    });
    
    console.log(`Found ${userFiles.length} files in user folders`);
    
    // For each file, get its latest commit
    for (const file of userFiles) {
      try {
        const pathParts = file.path.split('/');
        const userName = pathParts[0];
        const fileName = pathParts[pathParts.length - 1];
        
        // Skip common non-code files
        const skipExtensions = ['.md', '.txt', '.gitignore', '.yml', '.yaml'];
        const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
        
        if (skipExtensions.includes(fileExtension.toLowerCase())) {
          debugInfo.push({
            path: file.path,
            reason: `Skipped file type: ${fileExtension}`,
            type: 'skipped'
          });
          continue;
        }
        
        // Get commits for this specific file (latest first)
        const commitsUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?path=${encodeURIComponent(file.path)}&per_page=1`;
        const commitResponse = await fetch(commitsUrl, { headers });
        
        if (!commitResponse.ok) {
          console.log(`⚠️ Could not get commits for ${file.path}`);
          continue;
        }
        
        const commits = await commitResponse.json();
        
        if (commits.length === 0) {
          debugInfo.push({
            path: file.path,
            reason: 'No commits found',
            type: 'error'
          });
          continue;
        }
        
        // Get the latest commit for this file
        const latestCommit = commits[0];
        const message = latestCommit.commit.message;
        const sha = latestCommit.sha;
        const date = latestCommit.commit.author.date;
        const gitHubLogin = latestCommit.author?.login;
        const commitAuthorName = latestCommit.commit.author.name;
        
        // Use GitHub login if available, otherwise use commit author name
        const commitAuthor = gitHubLogin || commitAuthorName;
        
        // Determine points from commit message
        let points = 0;
        let difficulty = '';
        
        if (/\[Easy\]/i.test(message)) {
          points = 1;
          difficulty = 'Easy';
        } else if (/\[Medium\]/i.test(message)) {
          points = 2;
          difficulty = 'Medium';
        } else if (/\[Hard\]/i.test(message)) {
          points = 3;
          difficulty = 'Hard';
        }
        
        // Initialize user if not exists
        if (!scores[userName]) {
          scores[userName] = 0;
          details[userName] = [];
        }
        
        // Add debug info
        debugInfo.push({
          path: file.path,
          userName: userName,
          commitAuthor: commitAuthor,
          fileName: fileName,
          points: points,
          difficulty: difficulty || 'No difficulty tag',
          message: message.split('\n')[0],
          sha: sha.substring(0, 7),
          date: date,
          type: points > 0 ? 'scored' : 'unscored'
        });
        
        // Add to processed files
        processedFiles.push({
          path: file.path,
          folderOwner: userName,
          commitAuthor: commitAuthor,
          fileName: fileName,
          points: points,
          difficulty: difficulty || 'Unscored',
          message: message.split('\n')[0],
          sha: sha.substring(0, 7),
          date: date
        });
        
        if (points > 0) {
          scores[userName] += points;
          details[userName].push({
            path: file.path,
            fileName: fileName,
            points: points,
            difficulty: difficulty,
            message: message.split('\n')[0],
            sha: sha,
            date: date,
            commitAuthor: commitAuthor
          });
          
          console.log(`✅ Scoring file by ${userName}: +${points} points for "${fileName}" (${difficulty}) - commit by ${commitAuthor}`);
        } else {
          console.log(`📝 Non-scoring file by ${userName}: "${fileName}" - no difficulty tag in latest commit`);
        }
        
        // Small delay to avoid hitting rate limits
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error);
        debugInfo.push({
          path: file.path,
          reason: `Error: ${error.message}`,
          type: 'error'
        });
      }
    }
    
    console.log('🏆 Final scores:', scores);
    console.log('📊 Users with details:', Object.keys(details));
    console.log(`📁 Processed ${processedFiles.length} files total`);
    
    return NextResponse.json({ 
      scores, 
      details, 
      processedFiles,
      debugInfo: debugInfo.slice(0, 30),
      totalFiles: userFiles.length,
      scoredFiles: processedFiles.filter(f => f.points > 0).length
    });
  } catch (error) {
    console.error('Error fetching leaderboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard data' },
      { status: 500 }
    );
  }
}