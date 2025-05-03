# Bragging Rights Leaderboard

A web app to track and compare your progress against others in coding challenges, based on commits to a GitHub repository.

## How It Works

1. The app reads commit messages from your GitHub repository
2. It assigns points based on challenge difficulty tags in the commit messages:
   - `[Easy]` = 1 point
   - `[Medium]` = 2 points
   - `[Hard]` = 3 points
3. It displays your points vs. your competitor's points with a visual leaderboard

## Setup Instructions

### 1. Fork/Clone this Repository

```bash
git clone https://github.com/yourusername/bragging-rights-website.git
cd bragging-rights-website
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file and edit it:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your GitHub repository details:

```
REPO_OWNER=yourusername
REPO_NAME=your-repo-name
# Optional: Add a GitHub personal access token for higher API rate limits
# GITHUB_TOKEN=your_github_token
```

### 4. Update Avatars and User Details

1. Replace the avatar images in the `public` folder:
   - `public/me-avatar.png` 
   - `public/bro-avatar.png`

2. Update the usernames in `src/app/page.tsx`:
   ```typescript
   const me = 'your-github-username';
   const bro = 'competitor-github-username';
   ```

### 5. Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000` to see your leaderboard.

## Deployment

### Option 1: Deploy to Vercel (Recommended)

1. Create a [Vercel](https://vercel.com) account
2. Install the Vercel CLI: `npm i -g vercel`
3. Run `vercel login` and follow the instructions
4. Deploy with: `vercel`

For automatic deployments with GitHub:
1. Push this project to your GitHub account
2. Import the repository in Vercel dashboard
3. Configure the environment variables in Vercel
4. Generate a Vercel token for GitHub Actions

### Option 2: GitHub Pages

1. In `next.config.js`, uncomment the `output: 'export'` line
2. Follow the [GitHub Pages deployment guide](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site)

## Format Your Commit Messages

For your commits to be counted, format your commit messages like this:

```
[Easy] Fixed a typo in README
[Medium] Added new sort function
[Hard] Implemented custom caching system
```

## License

MIT
