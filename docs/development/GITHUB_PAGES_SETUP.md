# GitHub Pages Auto-Deployment Setup

## Overview

The repository includes a GitHub Actions workflow that automatically deploys the application to GitHub Pages whenever code is pushed to the `main` branch.

## Workflow File

The deployment workflow is located at: `.github/workflows/deploy.yml`

## How It Works

1. **Trigger**: Automatically runs on every push to `main` branch
2. **Build**: Installs dependencies, runs linter, and builds the production bundle
3. **Deploy**: Uploads the `build/` directory to GitHub Pages

## Initial Setup (One-Time)

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Pages**
3. Under **Source**, select **GitHub Actions** (not "Deploy from a branch")
4. Save the settings

### Step 2: Verify Workflow Permissions

The workflow requires these permissions (already configured):
- `contents: read` - Read repository contents
- `pages: write` - Deploy to GitHub Pages
- `id-token: write` - Required for GitHub Pages deployment

These are set in the workflow file, but you may need to verify in:
**Settings** → **Actions** → **General** → **Workflow permissions**

Make sure "Read and write permissions" is selected, or that the workflow has the specific permissions listed above.

## Manual Deployment

You can also trigger deployment manually:

1. Go to **Actions** tab in your repository
2. Select **Deploy to GitHub Pages** workflow
3. Click **Run workflow** → **Run workflow**

## Deployment Process

The workflow:
1. ✅ Checks out the code
2. ✅ Sets up Node.js 18
3. ✅ Installs dependencies (`npm ci`)
4. ✅ Runs linter (`npm run lint`)
5. ✅ Builds the app (`npm run build`)
6. ✅ Uploads build artifacts
7. ✅ Deploys to GitHub Pages

## Troubleshooting

### Deployment Not Working

1. **Check Actions Tab**: Go to **Actions** → Check if workflow is running/failing
2. **Check Permissions**: Ensure GitHub Pages is enabled and workflow has correct permissions
3. **Check Build**: Verify `npm run build` works locally
4. **Check Logs**: Click on the failed workflow run to see error details

### Build Fails

- Check if all dependencies are in `package.json`
- Verify `npm run lint` passes locally
- Ensure `npm run build` completes successfully

### Pages Not Updating

- Wait a few minutes (deployment can take 1-5 minutes)
- Check the Actions tab for deployment status
- Clear browser cache and hard refresh (Ctrl+Shift+R / Cmd+Shift+R)

## URL Structure

Your app will be available at:
- `https://[your-username].github.io/Code-review-simulator/`

The workflow automatically handles the `homepage` field in `package.json` which is set to:
```json
"homepage": "https://keamarg.github.io/Code-review-simulator"
```

## CI vs Deploy Workflows

- **CI Workflow** (`.github/workflows/ci.yml`): Runs on push/PR, tests and builds (doesn't deploy)
- **Deploy Workflow** (`.github/workflows/deploy.yml`): Runs on push to main, builds and deploys to GitHub Pages

Both workflows run independently and can run simultaneously.

## Notes

- The workflow uses `npm ci` for faster, reliable installs
- Build artifacts are cached for faster subsequent builds
- Only one deployment runs at a time (concurrency control)
- The workflow copies `index.html` to `404.html` automatically (via `predeploy` script) for SPA routing


