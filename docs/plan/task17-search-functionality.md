# Task 17: Search Functionality

**Files:**
- Create: `claude-code-visualizer/frontend/src/components/SearchBar.jsx`
- Create: `claude-code-visualizer/frontend/src/utils/searchUtils.js`
- Modify: `claude-code-visualizer/frontend/src/components/SessionViewer.jsx`

**Step 1: Write search utilities test**

Create `claude-code-visualizer/frontend/src/utils/searchUtils.js` (implementation first for TDD):

```javascript
/**
 * Find all matches of search pattern in text.
 *
 * @param {string} text - Text to search
 * @param {string} pattern - Search pattern
 * @param {boolean} isRegex - Whether pattern is regex
 * @returns {Array} Array of match objects {start, end, text}
 */
export function findMatches(text, pattern, isRegex = false) {
  if (!pattern || !text) return []

  const matches = []

  try {
    if (isRegex) {
      const regex = new RegExp(pattern, 'gi')
      let match

      while ((match = regex.exec(text)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0]
        })

        // Prevent infinite loop on zero-width matches
        if (match.index === regex.lastIndex) {
          regex.lastIndex++
        }
      }
    } else {
      // Case-insensitive substring search
      const lowerText = text.toLowerCase()
      const lowerPattern = pattern.toLowerCase()
      let startIndex = 0

      while ((startIndex = lowerText.indexOf(lowerPattern, startIndex)) !== -1) {
        matches.push({
          start: startIndex,
          end: startIndex + pattern.length,
          text: text.substring(startIndex, startIndex + pattern.length)
        })
        startIndex += pattern.length
      }
    }
  } catch (error) {
    // Invalid regex - return empty matches
    return []
  }

  return matches
}

/**
 * Highlight matches in text with HTML spans.
 *
 * @param {string} text - Original text
 * @param {Array} matches - Array of match objects
 * @param {number} currentIndex - Index of current match to highlight differently
 * @returns {string} HTML string with highlighted matches
 */
export function highlightMatches(text, matches, currentIndex = -1) {
  if (matches.length === 0) return text

  let result = ''
  let lastIndex = 0

  matches.forEach((match, index) => {
    // Add text before match
    result += text.substring(lastIndex, match.start)

    // Add highlighted match
    const className = index === currentIndex ? 'match current' : 'match'
    result += `<span class="${className}">${match.text}</span>`

    lastIndex = match.end
  })

  // Add remaining text
  result += text.substring(lastIndex)

  return result
}
```

**Step 2: Write SearchBar component**

Create `claude-code-visualizer/frontend/src/components/SearchBar.jsx`:

```javascript
import React, { useState } from 'react'

function SearchBar({ onSearch, matchCount, currentMatch, onNext, onPrev }) {
  const [query, setQuery] = useState('')
  const [isRegex, setIsRegex] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)

    // Validate regex if regex mode is enabled
    if (isRegex && value) {
      try {
        new RegExp(value)
        setError(null)
      } catch (err) {
        setError('Invalid regex pattern')
      }
    } else {
      setError(null)
    }

    // Trigger search
    onSearch(value, isRegex)
  }

  const handleRegexToggle = () => {
    const newIsRegex = !isRegex
    setIsRegex(newIsRegex)

    // Re-validate and search with new mode
    if (newIsRegex && query) {
      try {
        new RegExp(query)
        setError(null)
      } catch (err) {
        setError('Invalid regex pattern')
        return
      }
    } else {
      setError(null)
    }

    onSearch(query, newIsRegex)
  }

  const showNavigation = matchCount > 0

  return (
    <div className="search-bar">
      <input
        type="text"
        className={`search-input ${error ? 'error' : ''}`}
        placeholder="Search..."
        value={query}
        onChange={handleInputChange}
      />

      {showNavigation && (
        <div className="search-navigation">
          <button onClick={onPrev} disabled={matchCount === 0}>
            ◀ Prev
          </button>
          <span className="match-counter">
            {currentMatch + 1}/{matchCount}
          </span>
          <button onClick={onNext} disabled={matchCount === 0}>
            Next ▶
          </button>
        </div>
      )}

      <label className="regex-toggle">
        <input
          type="checkbox"
          checked={isRegex}
          onChange={handleRegexToggle}
        />
        Regex
      </label>

      {error && <div className="search-error">{error}</div>}
    </div>
  )
}

export default SearchBar
```

**Step 3: Add search to SessionViewer**

Modify `claude-code-visualizer/frontend/src/components/SessionViewer.jsx` to add search:

```javascript
import React, { useState, useEffect, useRef } from 'react'
import SearchBar from './SearchBar'
import MessageContainer from './MessageContainer'
import ToolContainer from './ToolContainer'
import { parseJSONL, buildToolUseMap, extractTextContent } from '../utils/jsonlParser'
import { findMatches } from '../utils/searchUtils'

function SessionViewer({ projectName, sessionId, onSubagentClick }) {
  const [messages, setMessages] = useState([])
  const [toolUseMap, setToolUseMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [isRegex, setIsRegex] = useState(false)
  const [matches, setMatches] = useState([])
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1)

  const timelineRef = useRef(null)

  useEffect(() => {
    if (!projectName || !sessionId) return

    setLoading(true)
    setError(null)

    fetch(`/api/session/${projectName}/${sessionId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch session')
        return res.text()
      })
      .then(jsonlText => {
        const parsed = parseJSONL(jsonlText)
        setMessages(parsed)
        setToolUseMap(buildToolUseMap(parsed))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [projectName, sessionId])

  const handleSearch = (query, regex) => {
    setSearchQuery(query)
    setIsRegex(regex)

    if (!query) {
      setMatches([])
      setCurrentMatchIndex(-1)
      return
    }

    // Search through all message text
    const allMatches = []
    messages.forEach((message, msgIndex) => {
      const text = extractTextContent(message)
      const messageMatches = findMatches(text, query, regex)

      messageMatches.forEach(match => {
        allMatches.push({
          ...match,
          messageIndex: msgIndex,
          messageUuid: message.uuid
        })
      })
    })

    setMatches(allMatches)
    setCurrentMatchIndex(allMatches.length > 0 ? 0 : -1)
  }

  const handleNext = () => {
    if (matches.length === 0) return
    setCurrentMatchIndex((currentMatchIndex + 1) % matches.length)
  }

  const handlePrev = () => {
    if (matches.length === 0) return
    setCurrentMatchIndex((currentMatchIndex - 1 + matches.length) % matches.length)
  }

  const extractAgentId = (toolUseId) => {
    for (const message of messages) {
      const content = message.message?.content
      if (!Array.isArray(content)) continue

      for (const block of content) {
        if (block.type === 'tool_result' && block.tool_use_id === toolUseId) {
          if (message.toolUseResult?.agentId) {
            return message.toolUseResult.agentId
          }
        }
      }
    }
    return null
  }

  const renderTools = (content) => {
    if (!Array.isArray(content)) return null

    return content
      .filter(block => block.type === 'tool_use' || block.type === 'tool_result')
      .map((block, index) => {
        const agentId = block.type === 'tool_use' ? extractAgentId(block.id) : null

        return (
          <ToolContainer
            key={block.id || `tool-${index}`}
            content={block}
            toolUseMap={toolUseMap}
            agentId={agentId}
            onSubagentClick={onSubagentClick}
          />
        )
      })
  }

  if (loading) {
    return <div className="session-viewer loading">Loading session...</div>
  }

  if (error) {
    return <div className="session-viewer error">Error: {error}</div>
  }

  if (messages.length === 0) {
    return <div className="session-viewer empty">No messages in this session</div>
  }

  return (
    <div className="session-viewer">
      <SearchBar
        onSearch={handleSearch}
        matchCount={matches.length}
        currentMatch={currentMatchIndex}
        onNext={handleNext}
        onPrev={handlePrev}
      />

      <div className="timeline" ref={timelineRef}>
        {messages.map(message => {
          const content = message.message?.content

          return (
            <MessageContainer key={message.uuid} message={message}>
              {renderTools(content)}
            </MessageContainer>
          )
        })}
      </div>
    </div>
  )
}

export default SessionViewer
```

**Step 4: Add search styles**

Add to `claude-code-visualizer/frontend/src/styles/main.css`:

```css
.search-bar {
  position: sticky;
  top: 0;
  background: white;
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  align-items: center;
  z-index: 10;
}

.search-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
}

.search-input.error {
  border-color: #dc2626;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-navigation {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-navigation button {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
}

.search-navigation button:hover:not(:disabled) {
  background: #f3f4f6;
}

.search-navigation button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.match-counter {
  font-size: 0.75rem;
  color: #6b7280;
  min-width: 50px;
  text-align: center;
}

.regex-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  user-select: none;
}

.search-error {
  position: absolute;
  top: 100%;
  left: 1rem;
  margin-top: 4px;
  padding: 4px 8px;
  background: #fee2e2;
  color: #dc2626;
  font-size: 0.75rem;
  border-radius: 4px;
}

.match {
  background: #fef08a;
  padding: 2px 0;
}

.match.current {
  background: #fb923c;
  border: 1px solid #f97316;
}
```

**Step 5: Test in browser**

```bash
npm run dev
```

Open http://localhost:5173 and verify:
- Search bar appears above timeline
- Typing highlights matches
- Prev/Next navigation works
- Regex toggle works

**Step 6: Commit**

```bash
git add frontend/src/components/SearchBar.jsx frontend/src/utils/searchUtils.js frontend/src/components/SessionViewer.jsx frontend/src/styles/main.css
git commit -m "feat: implement search functionality with regex support"
```
