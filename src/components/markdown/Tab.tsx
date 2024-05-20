"use client"

import React, { createContext, PropsWithChildren, ReactElement, useContext, useMemo, useState } from "react"
import styled from "styled-components"
import { EmptyFunction } from "@/utils/Any"

type TabSibling = { title: string, identifier: string }
type TabContext = { siblings: TabSibling[], selected: string, select: (identifier: string) => unknown }
const TabContext = createContext<TabContext>({ siblings: [], selected: "", select: EmptyFunction })

export const TabHost: React.FC<{ children: ReactElement[], initialSelectedIdentifier?: string }> = props => {
  const { children, initialSelectedIdentifier } = props

  const tabs = useMemo(
    () => children
      .filter(it => typeof it === "object")
      .map(it => ({ title: it.props?.title as string, identifier: it.props?.identifier as string })),
    [children]
  )

  const [selected, setSelected] = useState(initialSelectedIdentifier ?? tabs[0]?.identifier ?? "")

  const ContextValue: TabContext = { siblings: tabs, selected, select: setSelected }

  return (
    <TabContext.Provider value={ContextValue}>
      <TabSelector tabs={tabs}/>
      {props.children}
    </TabContext.Provider>
  )
}

export const TabSelector: React.FC<{ tabs: TabSibling[] }> = props => {
  const { tabs } = props
  const { selected, select } = useContext(TabContext)

  return (
    <TabSelectorRoot>
      {tabs.map(it =>
        <TabSelectorItem
          key={it.identifier}
          onClick={() => select(it.identifier)}
          $selected={selected === it.identifier}
        >
          {it.title}
        </TabSelectorItem>
      )}
    </TabSelectorRoot>
  )
}

type TabItemProps = TabSibling

export const TabItem: React.FC<PropsWithChildren<TabItemProps>> = props => {
  const { identifier, children } = props
  const { selected } = useContext(TabContext)

  if (selected === identifier)
    return <>{children}</>

  return <></>
}

const TabSelectorRoot = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-top: 32px;
  margin-bottom: 8px;
  max-width: 100vw;
  overflow: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`

const TabSelectorItem = styled.button<{ $selected: boolean }>`
  flex-shrink: 0;
  font: inherit;
  background: none;
  border: none;
  box-shadow: inset 0 ${({ $selected }) => $selected ? "-2px 0 rgb(127, 82, 255)" : "-1px 0 rgba(25, 25, 28, 0.3)"};
  color: ${({ $selected }) => $selected ? "rgb(127, 82, 255)" : "rgba(25, 25, 28, 0.7)"};
  margin-right: 24px;
  padding: 8px 0;
  
  &:hover {
    color: ${({ $selected }) => $selected ? "rgb(127, 82, 255)" : "#19191c"};
    box-shadow: inset 0 ${({ $selected }) => $selected ? "-2px 0 rgb(127, 82, 255)" : "-1px 0 rgba(25, 25, 28, 0.7)"};
  }
`
