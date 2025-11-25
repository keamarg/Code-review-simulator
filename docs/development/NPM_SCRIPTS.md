# NPM Scripts Reference

Simple guide to the essential npm scripts.

## 🚀 Development

### `npm start`
Start the development server (HTTP).  
**Use**: Daily development work  
- Runs on `http://localhost:3000`
- Hot reload enabled
- Opens browser automatically

### `npm run start:https`
Start the development server with HTTPS.  
**Use**: When testing audio/microphone features (requires HTTPS)  
- Runs on `https://localhost:3000`
- Browser will show security warning (click "Advanced" → "Proceed")

## 🏗️ Build & Deploy

### `npm run build`
Create optimized production build.  
**Use**: Before deploying or testing production build  
- Outputs to `build/` directory
- Minifies and optimizes code

### `npm run deploy`
Deploy to GitHub Pages.  
**Use**: When ready to publish changes  
- Automatically runs `predeploy` first (builds + copies `index.html` to `404.html` for SPA routing)
- Deploys `build/` directory to `gh-pages` branch

**Note**: `predeploy` runs automatically before `deploy` - you don't need to run it separately.

## 🧪 Testing

### `npm test`
Run tests in interactive watch mode.  
**Use**: When writing or updating tests  
- Press `a` to run all tests
- Press `f` to run failed tests
- Press `q` to quit

## 🔍 Code Quality

### `npm run lint`
Check code for linting errors.  
**Use**: Before committing code  
- Reports errors and warnings
- Does not fix automatically

### `npm run format`
Format code with Prettier.  
**Use**: Before committing code  
- Formats TypeScript, JSON, CSS, SCSS, and Markdown files
- Writes changes to files

## 📝 Common Workflows

**Daily Development:**
```bash
npm start              # Start dev server
npm run format         # Format code before committing
```

**Before Deploying:**
```bash
npm run build          # Test production build
npm run deploy         # Deploy to GitHub Pages
```

