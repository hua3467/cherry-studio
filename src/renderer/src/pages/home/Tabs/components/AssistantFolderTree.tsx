/**
 * Assistant list grouped by folders. Uses folders slice only; no changes to assistant data.
 */
import { DownOutlined, RightOutlined } from '@ant-design/icons'
import PromptPopup from '@renderer/components/Popups/PromptPopup'
import { useAssistants } from '@renderer/hooks/useAssistant'
import { useFolders } from '@renderer/hooks/useFolders'
import { useAppSelector } from '@renderer/store'
import type { Assistant, AssistantsSortType } from '@renderer/types'
import { cn } from '@renderer/utils'
import type { MenuProps } from 'antd'
import { Dropdown, Tooltip } from 'antd'
import { FolderPlus, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import React, { type FC } from 'react'
import { useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import AssistantItem from './AssistantItem'
import { TagGroup } from './TagGroup'

const FolderGroupHeader: FC<{
  label: string
  isCollapsed: boolean
  onToggle: () => void
  onRename: () => void
  onDelete: () => void
  onAddSubfolder?: () => void
}> = ({ label, isCollapsed, onToggle, onRename, onDelete, onAddSubfolder }) => {
  const { t } = useTranslation()
  const menuItems: MenuProps['items'] = [
    ...(onAddSubfolder
      ? [
          {
            key: 'add-subfolder',
            icon: <FolderPlus size={14} />,
            label: t('folders.add_subfolder'),
            onClick: onAddSubfolder
          }
        ]
      : []),
    { key: 'rename', icon: <Pencil size={14} />, label: t('folders.rename_folder'), onClick: onRename },
    { key: 'delete', icon: <Trash2 size={14} />, label: t('common.delete'), danger: true, onClick: onDelete }
  ]
  return (
    <div className="my-1 flex h-6 cursor-pointer flex-row items-center justify-between text-[var(--color-text-2)] text-xs">
      <div className="mr-1 flex max-w-[85%] flex-1 items-center truncate" onClick={onToggle}>
        {isCollapsed ? (
          <RightOutlined style={{ fontSize: '10px', marginRight: '5px' }} />
        ) : (
          <DownOutlined style={{ fontSize: '10px', marginRight: '5px' }} />
        )}
        <Tooltip title={label}>
          <span className="truncate px-1 text-[13px] text-[var(--color-text)]">{label}</span>
        </Tooltip>
      </div>
      <Dropdown menu={{ items: menuItems }} trigger={['click']}>
        <span
          className="cursor-pointer p-1 hover:rounded hover:bg-[var(--color-fill-2)]"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.key === 'Enter' && e.stopPropagation()}
          role="button"
          tabIndex={0}>
          <MoreVertical size={12} className="text-[var(--color-text-3)]" />
        </span>
      </Dropdown>
    </div>
  )
}

interface AssistantFolderTreeProps {
  activeAssistantId: string
  onAssistantSwitch: (assistant: Assistant) => void
  onAssistantDelete: (assistant: Assistant) => void
  onCreateDefaultAssistant: () => void
  addPreset: (assistant: Assistant) => void
  copyAssistant: (assistant: Assistant) => void
  handleSortByChange: (sortType: AssistantsSortType) => void
  sortByPinyinAsc: () => void
  sortByPinyinDesc: () => void
}

export const AssistantFolderTree: FC<AssistantFolderTreeProps> = (props) => {
  const {
    activeAssistantId,
    onAssistantSwitch,
    onAssistantDelete,
    onCreateDefaultAssistant,
    addPreset,
    copyAssistant,
    handleSortByChange,
    sortByPinyinAsc,
    sortByPinyinDesc
  } = props
  const { t } = useTranslation()
  const { assistants } = useAssistants()
  const {
    assistantFolders,
    assistantToFolder,
    assistantFolderOrder,
    collapsedAssistantFolders,
    setAssistantFolder,
    addAssistantFolder,
    removeAssistantFolder,
    updateAssistantFolder,
    toggleAssistantFolderCollapse
  } = useFolders()
  const unifiedListOrder = useAppSelector((s) => s.assistants.unifiedListOrder || [])

  const uncategorizedKey = 'folders.uncategorized'

  const folderOptionsForMenu = useMemo(() => {
    const list: { folderId: string; label: string }[] = [{ folderId: '', label: t(uncategorizedKey) }]
    const depthOf = new Map<string, number>()
    assistantFolderOrder.forEach((fid) => {
      const folder = assistantFolders.find((f) => f.id === fid)
      if (!folder) return
      const depth = folder.parentId ? (depthOf.get(folder.parentId) ?? 0) + 1 : 0
      depthOf.set(folder.id, depth)
      list.push({ folderId: folder.id, label: '  '.repeat(depth) + folder.name })
    })
    return list
  }, [assistantFolders, assistantFolderOrder, t])

  const onMoveToFolder = useCallback(
    (assistantId: string, folderId: string) => {
      setAssistantFolder(assistantId, folderId)
    },
    [setAssistantFolder]
  )

  type Group = { id: string; label: string; assistants: Assistant[]; isFolder: boolean; subGroups: Group[] }
  const groups = useMemo(() => {
    const orderMap = new Map<string, number>()
    unifiedListOrder.forEach((item, i) => {
      if (item.type === 'assistant') orderMap.set(item.id, i)
    })
    const byFolder = new Map<string, Assistant[]>()
    const uncategorized: Assistant[] = []
    assistants.forEach((a) => {
      const folderId = assistantToFolder[a.id] ?? ''
      if (!folderId) {
        uncategorized.push(a)
      } else {
        if (!byFolder.has(folderId)) byFolder.set(folderId, [])
        byFolder.get(folderId)!.push(a)
      }
    })
    const sortByOrder = (list: Assistant[]) =>
      list.sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999))
    sortByOrder(uncategorized)
    byFolder.forEach((list) => sortByOrder(list))

    const findGroup = (arr: Group[], id: string): Group | null => {
      for (const g of arr) {
        if (g.id === id) return g
        const found = findGroup(g.subGroups, id)
        if (found) return found
      }
      return null
    }
    const result: Group[] = [
      { id: '', label: t(uncategorizedKey), assistants: uncategorized, isFolder: false, subGroups: [] }
    ]
    assistantFolderOrder.forEach((folderId) => {
      const folder = assistantFolders.find((f) => f.id === folderId)
      if (!folder) return
      const group: Group = {
        id: folder.id,
        label: folder.name,
        assistants: byFolder.get(folder.id) ?? [],
        isFolder: true,
        subGroups: []
      }
      if (!folder.parentId) {
        result.push(group)
      } else {
        const parent = findGroup(result, folder.parentId)
        if (parent) parent.subGroups.push(group)
      }
    })
    return result
  }, [assistants, assistantToFolder, assistantFolderOrder, assistantFolders, unifiedListOrder, t])

  const handleRenameFolder = useCallback(
    async (folderId: string, currentName: string) => {
      const name = await PromptPopup.show({
        title: t('folders.rename_folder'),
        message: '',
        defaultValue: currentName
      })
      if (name?.trim()) updateAssistantFolder(folderId, name.trim())
    },
    [updateAssistantFolder, t]
  )

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      window.modal.confirm({
        title: t('folders.delete_folder_title'),
        content: t('folders.delete_folder_content'),
        centered: true,
        okButtonProps: { danger: true },
        onOk: () => removeAssistantFolder(folderId)
      })
    },
    [removeAssistantFolder, t]
  )

  const handleAddSubfolder = useCallback(
    async (parentFolderId: string) => {
      const name = await PromptPopup.show({
        title: t('folders.add_subfolder'),
        message: '',
        defaultValue: t('folders.new_folder_name')
      })
      if (name?.trim()) addAssistantFolder(name.trim(), parentFolderId)
    },
    [addAssistantFolder, t]
  )

  const renderFolderGroup = useCallback(
    (group: Group) => (
      <div key={group.id} className={cn('flex flex-col gap-2')}>
        <FolderGroupHeader
          label={group.label}
          isCollapsed={collapsedAssistantFolders[group.id]}
          onToggle={() => toggleAssistantFolderCollapse(group.id)}
          onRename={() => handleRenameFolder(group.id, group.label)}
          onDelete={() => handleDeleteFolder(group.id)}
          onAddSubfolder={() => handleAddSubfolder(group.id)}
        />
        {!collapsedAssistantFolders[group.id] && (
          <>
            <div className={cn('flex flex-col gap-0.5')}>
              {group.assistants.map((assistant) => (
                <AssistantItem
                  key={assistant.id}
                  assistant={assistant}
                  isActive={assistant.id === activeAssistantId}
                  sortBy="folders"
                  onSwitch={onAssistantSwitch}
                  onDelete={onAssistantDelete}
                  addPreset={addPreset}
                  copyAssistant={copyAssistant}
                  onCreateDefaultAssistant={onCreateDefaultAssistant}
                  handleSortByChange={handleSortByChange}
                  sortByPinyinAsc={sortByPinyinAsc}
                  sortByPinyinDesc={sortByPinyinDesc}
                  folderOptions={folderOptionsForMenu}
                  onMoveToFolder={onMoveToFolder}
                />
              ))}
            </div>
            {group.subGroups.map((sub) => (
              <div key={sub.id} style={{ marginLeft: 12 }}>
                {renderFolderGroup(sub)}
              </div>
            ))}
          </>
        )}
      </div>
    ),
    [
      collapsedAssistantFolders,
      toggleAssistantFolderCollapse,
      handleRenameFolder,
      handleDeleteFolder,
      handleAddSubfolder,
      activeAssistantId,
      onAssistantSwitch,
      onAssistantDelete,
      addPreset,
      copyAssistant,
      onCreateDefaultAssistant,
      handleSortByChange,
      sortByPinyinAsc,
      sortByPinyinDesc,
      folderOptionsForMenu,
      onMoveToFolder
    ]
  )

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group) => {
        if (group.isFolder) {
          return <React.Fragment key={group.id}>{renderFolderGroup(group)}</React.Fragment>
        }
        const showTitle = group.assistants.length > 0
        const uncategorizedCollapsed = collapsedAssistantFolders['']
        return (
          <TagGroup
            key="uncategorized"
            tag={group.label}
            isCollapsed={uncategorizedCollapsed}
            onToggle={() => toggleAssistantFolderCollapse('')}
            showTitle={showTitle}>
            {!uncategorizedCollapsed && (
              <div className={cn('flex flex-col gap-0.5')}>
                {group.assistants.map((assistant) => (
                  <AssistantItem
                    key={assistant.id}
                    assistant={assistant}
                    isActive={assistant.id === activeAssistantId}
                    sortBy="folders"
                    onSwitch={onAssistantSwitch}
                    onDelete={onAssistantDelete}
                    addPreset={addPreset}
                    copyAssistant={copyAssistant}
                    onCreateDefaultAssistant={onCreateDefaultAssistant}
                    handleSortByChange={handleSortByChange}
                    sortByPinyinAsc={sortByPinyinAsc}
                    sortByPinyinDesc={sortByPinyinDesc}
                    folderOptions={folderOptionsForMenu}
                    onMoveToFolder={onMoveToFolder}
                  />
                ))}
              </div>
            )}
          </TagGroup>
        )
      })}
    </div>
  )
}
