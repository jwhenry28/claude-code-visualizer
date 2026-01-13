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

  const [copied, setCopied] = useState(false)

  const timelineRef = useRef(null)

  useEffect(() => {
    if (!projectName || !sessionId) return

    setLoading(true)
    setError(null)

    fetch(`/api/session/${projectName}/${sessionId}`)
      .then(res => {
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Session file not found. It may have been deleted.')
          }
          throw new Error(`Failed to fetch session (${res.status})`)
        }
        return res.text()
      })
      .then(jsonlText => {
        const parsed = parseJSONL(jsonlText)
        if (parsed.length === 0) {
          setError('Session file is empty or contains no valid messages')
          setLoading(false)
          return
        }
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

  const handleCopySessionId = async () => {
    try {
      await navigator.clipboard.writeText(sessionId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const extractAgentId = (toolUseId) => {
    // Find the tool result for this tool use and extract agentId
    for (const message of messages) {
      const content = message.message?.content
      if (!Array.isArray(content)) continue

      for (const block of content) {
        if (block.type === 'tool_result' && block.tool_use_id === toolUseId) {
          // Look for agentId in toolUseResult
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

  const displayedMessages = messages.filter((msg) => {
    return msg.type !== 'file-history-snapshot'
  })

  return (
    <div className="session-viewer">
      <div className="session-header">
        <div className="session-uuid-container" onClick={handleCopySessionId} title="Click to copy">
          <span className="session-uuid-label">Session:</span>
          <span className="session-uuid">{sessionId}</span>
          {copied && <span className="copied-indicator">Copied!</span>}
        </div>
      </div>

      <SearchBar
        onSearch={handleSearch}
        matchCount={matches.length}
        currentMatch={currentMatchIndex}
        onNext={handleNext}
        onPrev={handlePrev}
      />

      <div className="timeline" ref={timelineRef}>
        {displayedMessages.map(message => {
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
