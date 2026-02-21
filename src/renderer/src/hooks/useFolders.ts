/**
 * Hooks for folder state (assistant folders and topic folders).
 * Risk-free: all folder data lives in the folders slice; no changes to assistant/topic types.
 */
import { useAppDispatch, useAppSelector } from '@renderer/store'
import {
  addAssistantFolder,
  addTopicFolder,
  removeAssistantFolder,
  removeTopicFolder,
  setAssistantFolder,
  setAssistantFolderOrder,
  setTopicFolder,
  setTopicFolderOrder,
  toggleAssistantFolderCollapse,
  toggleTopicFolderCollapse,
  updateAssistantFolder,
  updateTopicFolder
} from '@renderer/store/folders'
import type { AssistantFolder, TopicFolder } from '@renderer/types/folders'
import { uuid } from '@renderer/utils'
import { useCallback } from 'react'

export function useFolders() {
  const dispatch = useAppDispatch()
  const state = useAppSelector((s) => s.folders)

  return {
    // Assistant folders
    assistantFolders: state.assistantFolders,
    assistantToFolder: state.assistantToFolder,
    assistantFolderOrder: state.assistantFolderOrder,
    collapsedAssistantFolders: state.collapsedAssistantFolders,
    addAssistantFolder: useCallback(
      (name: string, parentId?: string) => {
        const folder: AssistantFolder = { id: uuid(), name, parentId }
        dispatch(addAssistantFolder(folder))
        return folder.id
      },
      [dispatch]
    ),
    removeAssistantFolder: useCallback((folderId: string) => dispatch(removeAssistantFolder(folderId)), [dispatch]),
    updateAssistantFolder: useCallback(
      (id: string, name: string) => dispatch(updateAssistantFolder({ id, name })),
      [dispatch]
    ),
    setAssistantFolder: useCallback(
      (assistantId: string, folderId: string) => dispatch(setAssistantFolder({ assistantId, folderId })),
      [dispatch]
    ),
    setAssistantFolderOrder: useCallback((order: string[]) => dispatch(setAssistantFolderOrder(order)), [dispatch]),
    toggleAssistantFolderCollapse: useCallback(
      (folderId: string) => dispatch(toggleAssistantFolderCollapse(folderId)),
      [dispatch]
    ),

    // Topic folders
    topicFolders: state.topicFolders,
    topicToFolder: state.topicToFolder,
    topicFolderOrderByAssistant: state.topicFolderOrderByAssistant,
    collapsedTopicFolders: state.collapsedTopicFolders,
    addTopicFolder: useCallback(
      (assistantId: string, name: string, parentId?: string) => {
        const folder: TopicFolder = { id: uuid(), name, assistantId, parentId }
        dispatch(addTopicFolder(folder))
        return folder.id
      },
      [dispatch]
    ),
    removeTopicFolder: useCallback(
      (folderId: string, assistantId: string) => dispatch(removeTopicFolder({ folderId, assistantId })),
      [dispatch]
    ),
    updateTopicFolder: useCallback((id: string, name: string) => dispatch(updateTopicFolder({ id, name })), [dispatch]),
    setTopicFolder: useCallback(
      (topicId: string, folderId: string) => dispatch(setTopicFolder({ topicId, folderId })),
      [dispatch]
    ),
    setTopicFolderOrder: useCallback(
      (assistantId: string, folderIds: string[]) => dispatch(setTopicFolderOrder({ assistantId, folderIds })),
      [dispatch]
    ),
    toggleTopicFolderCollapse: useCallback(
      (folderId: string) => dispatch(toggleTopicFolderCollapse(folderId)),
      [dispatch]
    )
  }
}
