import type { FC, ReactNode } from 'react'
import styled from 'styled-components'

const Bar = styled.div`
  flex-shrink: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-background);
  border-top: 1px solid var(--color-border);
`

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;
  border: none;
  border-radius: var(--list-item-border-radius);
  background: transparent;
  color: var(--color-text-2);
  cursor: pointer;

  &:hover {
    background: var(--color-list-item);
    color: var(--color-text);
  }
`

interface SidebarBottomBarProps {
  children: ReactNode
}

export const SidebarBottomBar: FC<SidebarBottomBarProps> = ({ children }) => {
  return <Bar>{children}</Bar>
}

export const SidebarBottomBarIconButton = IconButton
