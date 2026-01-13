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
