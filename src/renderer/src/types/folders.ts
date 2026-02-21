/**
 * Folder types for grouping assistants and topics.
 * Kept in a separate module to avoid touching core Assistant/Topic types (risk-free for upstream merge).
 */

/** Folder for grouping assistants in the sidebar */
export type AssistantFolder = {
  id: string
  name: string
  parentId?: string
}

/** Folder for grouping topics under an assistant */
export type TopicFolder = {
  id: string
  name: string
  assistantId: string
  parentId?: string
}
