import AddAssistantOrAgentPopup from '@renderer/components/Popups/AddAssistantOrAgentPopup'
import AgentModalPopup from '@renderer/components/Popups/agent/AgentModal'
import PromptPopup from '@renderer/components/Popups/PromptPopup'
import Scrollbar from '@renderer/components/Scrollbar'
import { useAgents } from '@renderer/hooks/agents/useAgents'
import { useApiServer } from '@renderer/hooks/useApiServer'
import { useAssistants } from '@renderer/hooks/useAssistant'
import { useAssistantPresets } from '@renderer/hooks/useAssistantPresets'
import { useFolders } from '@renderer/hooks/useFolders'
import { useRuntime } from '@renderer/hooks/useRuntime'
import { useAssistantsTabSortType } from '@renderer/hooks/useStore'
import { useTags } from '@renderer/hooks/useTags'
import { useAppDispatch } from '@renderer/store'
import { setActiveTopicOrSessionAction } from '@renderer/store/runtime'
import type { Assistant, AssistantsSortType, Topic } from '@renderer/types'
import { FolderPlus, SmilePlus } from 'lucide-react'
import type { FC } from 'react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'

import { AssistantFolderTree } from './components/AssistantFolderTree'
import { SidebarBottomBar, SidebarBottomBarIconButton } from './components/SidebarBottomBar'
import { UnifiedList } from './components/UnifiedList'
import { UnifiedTagGroups } from './components/UnifiedTagGroups'
import { useActiveAgent } from './hooks/useActiveAgent'
import { useUnifiedGrouping } from './hooks/useUnifiedGrouping'
import { useUnifiedItems } from './hooks/useUnifiedItems'
import { useUnifiedSorting } from './hooks/useUnifiedSorting'

interface AssistantsTabProps {
  activeAssistant: Assistant | null | undefined
  setActiveAssistant: (assistant: Assistant) => void
  onCreateAssistant: () => void
  onCreateDefaultAssistant: () => void
}

const AssistantsTab: FC<AssistantsTabProps> = (props) => {
  const { activeAssistant, setActiveAssistant, onCreateAssistant, onCreateDefaultAssistant } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const { apiServerConfig, apiServerRunning, startApiServer } = useApiServer()
  const apiServerEnabled = apiServerConfig.enabled
  const { chat } = useRuntime()
  const { t } = useTranslation()

  // Agent related hooks
  const { agents, deleteAgent, isLoading: agentsLoading, error: agentsError } = useAgents()
  const { activeAgentId } = chat
  const { setActiveAgentId } = useActiveAgent()

  // Assistant related hooks
  const { assistants, removeAssistant, copyAssistant, updateAssistants } = useAssistants()
  const { addAssistantPreset } = useAssistantPresets()
  const { collapsedTags, toggleTagCollapse } = useTags()
  const { assistantsTabSortType = 'list', setAssistantsTabSortType } = useAssistantsTabSortType()
  const [dragging, setDragging] = useState(false)

  // Unified items management
  const { unifiedItems, handleUnifiedListReorder } = useUnifiedItems({
    agents,
    assistants,
    apiServerEnabled,
    agentsLoading,
    agentsError,
    updateAssistants
  })

  // Sorting
  const { sortByPinyinAsc, sortByPinyinDesc } = useUnifiedSorting({
    unifiedItems,
    updateAssistants
  })

  // Grouping
  const { groupedUnifiedItems, handleUnifiedGroupReorder } = useUnifiedGrouping({
    unifiedItems,
    assistants,
    agents,
    apiServerEnabled,
    agentsLoading,
    agentsError,
    updateAssistants
  })

  const onDeleteAssistant = useCallback(
    (assistant: Assistant) => {
      const remaining = assistants.filter((a) => a.id !== assistant.id)
      if (remaining.length === 0) {
        window.toast.error(t('assistants.delete.error.remain_one'))
        return
      }

      if (assistant.id === activeAssistant?.id) {
        const newActive = remaining[remaining.length - 1]
        setActiveAssistant(newActive)
      }
      removeAssistant(assistant.id)
    },
    [assistants, activeAssistant?.id, removeAssistant, t, setActiveAssistant]
  )

  const handleSortByChange = useCallback(
    (sortType: AssistantsSortType) => {
      setAssistantsTabSortType(sortType)
    },
    [setAssistantsTabSortType]
  )

  const handleAgentPress = useCallback(
    (agentId: string) => {
      setActiveAgentId(agentId)
      // TODO: should allow it to be null
      setActiveAssistant({
        id: 'fake',
        name: '',
        prompt: '',
        topics: [
          {
            id: 'fake',
            assistantId: 'fake',
            name: 'fake',
            createdAt: '',
            updatedAt: '',
            messages: []
          } as unknown as Topic
        ],
        type: 'chat'
      })
    },
    [setActiveAgentId, setActiveAssistant]
  )

  const dispatch = useAppDispatch()
  const { addAssistantFolder } = useFolders()

  const handleAddAssistantClick = useCallback(() => {
    AddAssistantOrAgentPopup.show({
      onSelect: (type) => {
        if (type === 'assistant') {
          onCreateAssistant()
        }
        if (type === 'agent') {
          if (!apiServerRunning) startApiServer()
          AgentModalPopup.show({
            afterSubmit: (a) => {
              setActiveAssistant({
                id: 'fake',
                name: '',
                prompt: '',
                topics: [
                  {
                    id: 'fake',
                    assistantId: 'fake',
                    name: 'fake',
                    createdAt: '',
                    updatedAt: '',
                    messages: []
                  } as unknown as Topic
                ],
                type: 'chat'
              })
              setActiveAgentId(a.id)
              dispatch(setActiveTopicOrSessionAction('session'))
            }
          })
        }
      }
    })
  }, [onCreateAssistant, apiServerRunning, startApiServer, setActiveAssistant, setActiveAgentId, dispatch])

  const handleAddFolderClick = useCallback(async () => {
    if (assistantsTabSortType !== 'folders') {
      setAssistantsTabSortType('folders')
    }
    const name = await PromptPopup.show({
      title: t('folders.add_assistant_folder'),
      message: '',
      defaultValue: t('folders.new_folder_name')
    })
    if (name?.trim()) addAssistantFolder(name.trim())
  }, [assistantsTabSortType, setAssistantsTabSortType, addAssistantFolder, t])

  if (!activeAssistant) {
    return (
      <Container className="assistants-tab" ref={containerRef}>
        <ScrollableList />
        <SidebarBottomBar>
          <SidebarBottomBarIconButton onClick={handleAddAssistantClick} title={t('chat.add.assistant.title')}>
            <SmilePlus size={20} />
          </SidebarBottomBarIconButton>
          <SidebarBottomBarIconButton onClick={handleAddFolderClick} title={t('folders.add_assistant_folder')}>
            <FolderPlus size={20} />
          </SidebarBottomBarIconButton>
        </SidebarBottomBar>
      </Container>
    )
  }

  return (
    <Container className="assistants-tab" ref={containerRef}>
      <ScrollableList>
        {assistantsTabSortType === 'folders' ? (
          <AssistantFolderTree
            activeAssistantId={activeAssistant.id}
            onAssistantSwitch={setActiveAssistant}
            onAssistantDelete={onDeleteAssistant}
            onCreateDefaultAssistant={onCreateDefaultAssistant}
            addPreset={addAssistantPreset}
            copyAssistant={copyAssistant}
            handleSortByChange={handleSortByChange}
            sortByPinyinAsc={sortByPinyinAsc}
            sortByPinyinDesc={sortByPinyinDesc}
          />
        ) : assistantsTabSortType === 'tags' ? (
          <UnifiedTagGroups
            groupedItems={groupedUnifiedItems}
            activeAssistantId={activeAssistant.id}
            activeAgentId={activeAgentId}
            sortBy={assistantsTabSortType}
            collapsedTags={collapsedTags}
            onGroupReorder={handleUnifiedGroupReorder}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
            onToggleTagCollapse={toggleTagCollapse}
            onAssistantSwitch={setActiveAssistant}
            onAssistantDelete={onDeleteAssistant}
            onAgentDelete={deleteAgent}
            onAgentPress={handleAgentPress}
            addPreset={addAssistantPreset}
            copyAssistant={copyAssistant}
            onCreateDefaultAssistant={onCreateDefaultAssistant}
            handleSortByChange={handleSortByChange}
            sortByPinyinAsc={sortByPinyinAsc}
            sortByPinyinDesc={sortByPinyinDesc}
          />
        ) : (
          <UnifiedList
            items={unifiedItems}
            activeAssistantId={activeAssistant.id}
            activeAgentId={activeAgentId}
            sortBy={assistantsTabSortType}
            onReorder={handleUnifiedListReorder}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
            onAssistantSwitch={setActiveAssistant}
            onAssistantDelete={onDeleteAssistant}
            onAgentDelete={deleteAgent}
            onAgentPress={handleAgentPress}
            addPreset={addAssistantPreset}
            copyAssistant={copyAssistant}
            onCreateDefaultAssistant={onCreateDefaultAssistant}
            handleSortByChange={handleSortByChange}
            sortByPinyinAsc={sortByPinyinAsc}
            sortByPinyinDesc={sortByPinyinDesc}
          />
        )}

        {!dragging && <div style={{ minHeight: 10 }} />}
      </ScrollableList>

      <SidebarBottomBar>
        <SidebarBottomBarIconButton onClick={handleAddAssistantClick} title={t('chat.add.assistant.title')}>
          <SmilePlus size={20} />
        </SidebarBottomBarIconButton>
        <SidebarBottomBarIconButton onClick={handleAddFolderClick} title={t('folders.add_assistant_folder')}>
          <FolderPlus size={20} />
        </SidebarBottomBarIconButton>
      </SidebarBottomBar>
    </Container>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px 10px 0;
`

const ScrollableList = styled(Scrollbar)`
  flex: 1;
  min-height: 0;
  padding-bottom: 8px;
`

export default AssistantsTab
