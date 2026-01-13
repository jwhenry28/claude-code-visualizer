# Task 10: React Frontend Setup

**Files:**
- Create: `claude-code-visualizer/frontend/package.json`
- Create: `claude-code-visualizer/frontend/vite.config.js`
- Create: `claude-code-visualizer/frontend/index.html`
- Create: `claude-code-visualizer/frontend/src/main.jsx`
- Create: `claude-code-visualizer/frontend/src/App.jsx`
- Create: `claude-code-visualizer/frontend/.gitignore`

**Step 1: Create frontend directory structure**

```bash
cd claude-code-visualizer
mkdir -p frontend/src/components
mkdir -p frontend/src/utils
mkdir -p frontend/src/styles
```

**Step 2: Initialize npm project**

Create `claude-code-visualizer/frontend/package.json`:

```json
{
  "name": "claude-code-visualizer-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "jest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/jest-dom": "^6.1.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

**Step 3: Create Vite config**

Create `claude-code-visualizer/frontend/vite.config.js`:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
})
```

**Step 4: Create index.html**

Create `claude-code-visualizer/frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Claude Code Visualizer</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 5: Create main.jsx entry point**

Create `claude-code-visualizer/frontend/src/main.jsx`:

```javascript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/main.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

**Step 6: Create basic App component**

Create `claude-code-visualizer/frontend/src/App.jsx`:

```javascript
import React, { useState, useEffect } from 'react'

function App() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Fetch projects on mount
    fetch('/api/projects')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch projects')
        return res.json()
      })
      .then(data => {
        setProjects(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="app">
      <h1>Claude Code Visualizer</h1>
      <p>Projects: {projects.length}</p>
      <ul>
        {projects.map(project => (
          <li key={project.name}>{project.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
```

**Step 7: Create basic CSS**

Create `claude-code-visualizer/frontend/src/styles/main.css`:

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  background-color: #f9fafb;
  color: #1f2937;
}

.app {
  padding: 2rem;
}

h1 {
  margin-bottom: 1rem;
  font-size: 2rem;
}

ul {
  list-style: none;
  margin-top: 1rem;
}

li {
  padding: 0.5rem;
  background: white;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
```

**Step 8: Create frontend .gitignore**

Create `claude-code-visualizer/frontend/.gitignore`:

```
node_modules
dist
.vite
```

**Step 9: Install dependencies**

```bash
cd frontend
npm install
```

Expected: Dependencies installed successfully

**Step 10: Start dev server**

```bash
npm run dev
```

Expected: Vite dev server starts on http://localhost:5173

**Step 11: Test in browser**

Open http://localhost:5173 in browser

Expected: Should see "Claude Code Visualizer" heading and list of projects (if backend is running)

**Step 12: Build for production**

```bash
npm run build
```

Expected: Production build created in `frontend/dist/`

**Step 13: Commit**

```bash
git add frontend/
git commit -m "feat: set up React frontend with Vite"
```
