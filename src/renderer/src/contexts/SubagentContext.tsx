import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { SessionMessage } from '../types'

interface SubagentPanelState {
  agentId: string
  subagentType: string
  description: string
  messages: SessionMessage[]
}

interface SubagentContextValue {
  agentIdMap: Map<string, string>
  subagentAvailability: Map<string, boolean>
  subagentPanel: SubagentPanelState | null
  setAgentIdMap: (map: Map<string, string>) => void
  setSubagentAvailability: (map: Map<string, boolean>) => void
  openSubagent: (agentId: string, subagentType: string, description: string, messages: SessionMessage[]) => void
  closeSubagent: () => void
}

const SubagentContext = createContext<SubagentContextValue | null>(null)

interface SubagentProviderProps {
  children: ReactNode
}

export function SubagentProvider({ children }: SubagentProviderProps) {
  const [agentIdMap, setAgentIdMap] = useState<Map<string, string>>(new Map())
  const [subagentAvailability, setSubagentAvailability] = useState<Map<string, boolean>>(new Map())
  const [subagentPanel, setSubagentPanel] = useState<SubagentPanelState | null>(null)

  const openSubagent = useCallback((
    agentId: string,
    subagentType: string,
    description: string,
    messages: SessionMessage[]
  ) => {
    setSubagentPanel({ agentId, subagentType, description, messages })
  }, [])

  const closeSubagent = useCallback(() => {
    setSubagentPanel(null)
  }, [])

  return (
    <SubagentContext.Provider
      value={{
        agentIdMap,
        subagentAvailability,
        subagentPanel,
        setAgentIdMap,
        setSubagentAvailability,
        openSubagent,
        closeSubagent
      }}
    >
      {children}
    </SubagentContext.Provider>
  )
}

export function useSubagent(): SubagentContextValue {
  const context = useContext(SubagentContext)
  if (!context) {
    throw new Error('useSubagent must be used within a SubagentProvider')
  }
  return context
}
