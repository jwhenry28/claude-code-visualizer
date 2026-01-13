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
