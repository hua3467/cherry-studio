/**
 * Folders slice: assistant folders and topic folders.
 * All folder state lives here so we do not modify Assistant or Topic types (risk-free for upstream merge).
 */
import type { PayloadAction } from '@reduxjs/toolkit'
import { createSlice } from '@reduxjs/toolkit'
import type { AssistantFolder, TopicFolder } from '@renderer/types/folders'

export interface FoldersState {
  assistantFolders: AssistantFolder[]
  /** assistantId -> folderId (empty string = uncategorized) */
  assistantToFolder: Record<string, string>
  /** Order of assistant folder ids for display */
  assistantFolderOrder: string[]
  /** Collapsed state by folder id */
  collapsedAssistantFolders: Record<string, boolean>
  topicFolders: TopicFolder[]
  /** topicId -> folderId */
  topicToFolder: Record<string, string>
  /** assistantId -> ordered folder ids for that assistant */
  topicFolderOrderByAssistant: Record<string, string[]>
  collapsedTopicFolders: Record<string, boolean>
}

const initialState: FoldersState = {
  assistantFolders: [],
  assistantToFolder: {},
  assistantFolderOrder: [],
  collapsedAssistantFolders: {},
  topicFolders: [],
  topicToFolder: {},
  topicFolderOrderByAssistant: {},
  collapsedTopicFolders: {}
}

const foldersSlice = createSlice({
  name: 'folders',
  initialState,
  reducers: {
    // Assistant folders
    addAssistantFolder: (state, action: PayloadAction<AssistantFolder>) => {
      if (state.assistantFolders.some((f) => f.id === action.payload.id)) return
      state.assistantFolders.push(action.payload)
      const { id, parentId } = action.payload
      if (parentId) {
        const idx = state.assistantFolderOrder.indexOf(parentId)
        if (idx !== -1) state.assistantFolderOrder.splice(idx + 1, 0, id)
        else state.assistantFolderOrder.push(id)
      } else {
        state.assistantFolderOrder.push(id)
      }
    },
    removeAssistantFolder: (state, action: PayloadAction<string>) => {
      const folderId = action.payload
      const toRemove = new Set<string>([folderId])
      let changed = true
      while (changed) {
        changed = false
        state.assistantFolders.forEach((f) => {
          if (f.parentId && toRemove.has(f.parentId) && !toRemove.has(f.id)) {
            toRemove.add(f.id)
            changed = true
          }
        })
      }
      state.assistantFolders = state.assistantFolders.filter((f) => !toRemove.has(f.id))
      state.assistantFolderOrder = state.assistantFolderOrder.filter((id) => !toRemove.has(id))
      toRemove.forEach((id) => {
        Object.keys(state.assistantToFolder).forEach((aid) => {
          if (state.assistantToFolder[aid] === id) delete state.assistantToFolder[aid]
        })
        delete state.collapsedAssistantFolders[id]
      })
    },
    updateAssistantFolder: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const folder = state.assistantFolders.find((f) => f.id === action.payload.id)
      if (folder) folder.name = action.payload.name
    },
    setAssistantFolder: (state, action: PayloadAction<{ assistantId: string; folderId: string }>) => {
      const { assistantId, folderId } = action.payload
      if (folderId === '') {
        delete state.assistantToFolder[assistantId]
      } else {
        state.assistantToFolder[assistantId] = folderId
      }
    },
    setAssistantFolderOrder: (state, action: PayloadAction<string[]>) => {
      state.assistantFolderOrder = action.payload
    },
    toggleAssistantFolderCollapse: (state, action: PayloadAction<string>) => {
      const id = action.payload
      state.collapsedAssistantFolders[id] = !state.collapsedAssistantFolders[id]
    },

    // Topic folders
    addTopicFolder: (state, action: PayloadAction<TopicFolder>) => {
      if (state.topicFolders.some((f) => f.id === action.payload.id)) return
      state.topicFolders.push(action.payload)
      const { id, assistantId: aid, parentId } = action.payload
      if (!state.topicFolderOrderByAssistant[aid]) state.topicFolderOrderByAssistant[aid] = []
      const order = state.topicFolderOrderByAssistant[aid]
      if (parentId) {
        const idx = order.indexOf(parentId)
        if (idx !== -1) order.splice(idx + 1, 0, id)
        else order.push(id)
      } else {
        order.push(id)
      }
    },
    removeTopicFolder: (state, action: PayloadAction<{ folderId: string; assistantId: string }>) => {
      const { folderId, assistantId } = action.payload
      const toRemove = new Set<string>([folderId])
      let changed = true
      while (changed) {
        changed = false
        state.topicFolders.forEach((f) => {
          if (f.assistantId === assistantId && f.parentId && toRemove.has(f.parentId) && !toRemove.has(f.id)) {
            toRemove.add(f.id)
            changed = true
          }
        })
      }
      state.topicFolders = state.topicFolders.filter((f) => !toRemove.has(f.id))
      if (state.topicFolderOrderByAssistant[assistantId]) {
        state.topicFolderOrderByAssistant[assistantId] = state.topicFolderOrderByAssistant[assistantId].filter(
          (id) => !toRemove.has(id)
        )
      }
      toRemove.forEach((id) => {
        Object.keys(state.topicToFolder).forEach((tid) => {
          if (state.topicToFolder[tid] === id) delete state.topicToFolder[tid]
        })
        delete state.collapsedTopicFolders[id]
      })
    },
    updateTopicFolder: (state, action: PayloadAction<{ id: string; name: string }>) => {
      const folder = state.topicFolders.find((f) => f.id === action.payload.id)
      if (folder) folder.name = action.payload.name
    },
    setTopicFolder: (state, action: PayloadAction<{ topicId: string; folderId: string }>) => {
      const { topicId, folderId } = action.payload
      if (folderId === '') {
        delete state.topicToFolder[topicId]
      } else {
        state.topicToFolder[topicId] = folderId
      }
    },
    setTopicFolderOrder: (state, action: PayloadAction<{ assistantId: string; folderIds: string[] }>) => {
      const { assistantId, folderIds } = action.payload
      state.topicFolderOrderByAssistant[assistantId] = folderIds
    },
    toggleTopicFolderCollapse: (state, action: PayloadAction<string>) => {
      const id = action.payload
      state.collapsedTopicFolders[id] = !state.collapsedTopicFolders[id]
    }
  }
})

export const {
  addAssistantFolder,
  removeAssistantFolder,
  updateAssistantFolder,
  setAssistantFolder,
  setAssistantFolderOrder,
  toggleAssistantFolderCollapse,
  addTopicFolder,
  removeTopicFolder,
  updateTopicFolder,
  setTopicFolder,
  setTopicFolderOrder,
  toggleTopicFolderCollapse
} = foldersSlice.actions

export default foldersSlice.reducer
