"use client"

import React, { useEffect, useMemo, useState } from "react"
import styled from "styled-components"
import Link from "next/link"
import { DocumentData } from "@/app/docs/[document_key]/page"
import { findDocumentation, titleOf } from "@/utils/Documentation"
import { LessThen1000 } from "@/utils/ReactiveStyles"
import { DocumentNavigatorExpandEvents } from "@/components/AppGlobalHeader"

type DocumentNavigatorProps = {
  items: DocumentData[]
  documentKey: string
}

export const DocumentNavigator: React.FC<DocumentNavigatorProps> = props => {
  const { items, documentKey } = props

  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const handler = () => setExpanded(prev => !prev)

    DocumentNavigatorExpandEvents.addEventListener("navigator_toggle", handler)
    return () => DocumentNavigatorExpandEvents.removeEventListener("navigator_toggle", handler)
  }, [])

  useEffect(() => {
    DocumentNavigatorExpandedEvents.expandStateChanged(expanded)
  }, [expanded])

  useEffect(() => {
    if (!expanded) return
    requestAnimationFrame(() => document.getElementById(documentKey)?.scrollIntoView({ behavior: "smooth", block: "center" }))
  }, [expanded, documentKey])

  return (
    <DocumentNavigatorRoot
      $narrowOnlyExpanded={expanded}
    >
      {items
        .map(it => ({ ...it, selected: documentKey === it.href }))
        .map(it =>
          <DocumentNavigatorItem
            key={`${titleOf(it)}_${it.href}`}
            item={it}
            depth={0}
            documentKey={documentKey}
          />
        )
      }
    </DocumentNavigatorRoot>
  )
}

export class DocumentNavigatorExpandedEvent extends Event {
  constructor(public newState: boolean) { super("state_changed") }
}
export const DocumentNavigatorExpandedEvents = new class extends EventTarget {
  expandStateChanged = (newState: boolean) => this.dispatchEvent(new DocumentNavigatorExpandedEvent(newState))
}

type DocumentNavigatorItemProps = {
  item: DocumentData & { selected: boolean }
  depth: number
  documentKey: string
}

const DocumentNavigatorItem: React.FC<DocumentNavigatorItemProps> = props => {
  const { item, depth, documentKey } = props

  const isRootNode = depth === 0
  const isLeafNode = useMemo(() => !!item.children?.every(it => !it.children), [item.children])

  const hasSelectedTopic = useMemo(() => !!findDocumentation(item, documentKey), [item, documentKey])
  const hasGrayBackground = useMemo(() => (isRootNode || isLeafNode) && hasSelectedTopic, [hasSelectedTopic, isRootNode, isLeafNode])

  const [expanded, setExpanded] = useState(hasSelectedTopic)

  if (item.children) {
    return (
      <DocumentNavigatorChildrenContainer
        $hasGrayBackground={hasGrayBackground}
        $isRootNode={isRootNode}
      >
        <DocumentNavigatorExpanderItem
          id={item.href}
          onClick={() => setExpanded(prev => !prev)}
          $depth={depth}
          $expanded={expanded}
        >
          <svg viewBox="-5 -3 24 24" data-test="toc-expander"><path fill="currentColor" d="M11 9l-6 5.25V3.75z"></path></svg>
          {titleOf(item)}
        </DocumentNavigatorExpanderItem>
        {expanded && item.children
          .map(it => ({ ...it, selected: it.href === documentKey }))
          .map(it =>
            <DocumentNavigatorItem
              key={`${titleOf(it)}_${it.href}`}
              item={it}
              depth={depth + 1}
              documentKey={documentKey}
            />
          )
        }
      </DocumentNavigatorChildrenContainer>
    )
  } else if (item.href) {
    return (
      <DocumentNavigatorLinkItem
        id={item.href}
        href={item.href}
        $depth={depth}
        $selected={item.selected}
        $disabled={!item.enabled}
      >
        {titleOf(item)}
      </DocumentNavigatorLinkItem>
    )
  }

  throw Error("Assertion Failure(from DocumentNavigatorItem): one of children or href must be provided from DocumentData, but both are undefined or null")
}

const DocumentNavigatorRoot = styled.nav<{ $narrowOnlyExpanded: boolean }>`
  position: sticky;
  top: 64px;
  z-index: 4;
  
  width: 311px;
  border-right: 1px solid #d1d1d2;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 8px 0;
  background-color: white;

  max-height: 100vh;
  overflow: auto;
    
  & a, button {
    font-size: 13px;
    line-height: 20px;
    font-weight: 300;
    
    ${LessThen1000} {
      font-size: 19px;
      line-height: 28px;
    }
  }

  & a:hover, button:hover {
    background-color: rgba(25, 25, 28, 0.05);
    
    ${LessThen1000} {
      background-color: hsla(0,0%,100%,0.05);
    }
  }

  @media only screen and (max-width: 1540px) {
    width: 301px;
  }

  @media only screen and (max-width: 1276px) {
    width: 273px;
  }

  ${LessThen1000} {
    background-color: #27282c;
    display: ${({ $narrowOnlyExpanded }) => $narrowOnlyExpanded ? "flex" : "none"};
    z-index: 5;
    position: fixed;
    left: 0;
    bottom: 0;
    top: 52px;
    width: 100vw;
    border-right: none;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
  }
`

const DocumentNavigatorChildrenContainer = styled.div<{ $hasGrayBackground: boolean, $isRootNode: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: stretch;

  background-color: ${({ $hasGrayBackground }) => $hasGrayBackground ? "rgba(25, 25, 28, 0.025)" : "transparent"};
  
  ${LessThen1000} {
    background-color: ${({ $hasGrayBackground, $isRootNode }) => $hasGrayBackground && $isRootNode ? "#1f1f21" : "transparent"};
  }
`

const DocumentNavigatorExpanderItem = styled.button<{ $depth: number, $expanded: boolean }>`
  padding: 8px 0 8px ${({ $depth }) => `${22 + ($depth + 1) * 16}px`};

  text-align: left;
  background: none;
  border: none;
  font-family: inherit;
  
  display: flex;
  align-items: center;

  & > svg {
    width: 14px;
    height: 14px;
    margin-left: -20px;
    margin-right: 8px;
    transform: rotateZ(${({ $expanded }) => $expanded ? "90deg" : "0"});
    transition: transform 0.1s linear;
    color: #19191C;
  }
  
  ${LessThen1000} {
    padding: 12px 0 12px ${({ $depth }) => `${44 + ($depth + 1) * 16}px`};
    color: white;
    
    & > svg {
      width: 28px;
      height: 28px;
      margin-left: -40px;
      color: hsla(0,0%,100%,0.5);
    }
  }
`

const DocumentNavigatorLinkItem = styled(Link)<{ $selected: boolean, $depth: number, $disabled: boolean }>`
  padding: 8px 0 8px ${({ $depth }) => `${22 + ($depth + 1) * 16}px`};

  background: ${({ $selected }) => $selected ? "#7f52ff !important" : "transparent"};
  color: ${({ $selected }) => $selected ? "white" : "#19191c"};

  opacity: ${({ $disabled }) => $disabled ? 0.4 : 1};
  cursor: ${({ $disabled }) => $disabled ? "auto" : "pointer"};

  ${LessThen1000} {
    padding: 12px 0 12px ${({ $depth }) => `${44 + ($depth + 1) * 16}px`};
    background: ${({ $selected }) => $selected ? "white !important" : "transparent"};
    color: ${({ $selected }) => $selected ? "#19191c" : "white"};
  }
`
