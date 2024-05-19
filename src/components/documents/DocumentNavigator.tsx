"use client"

import React, { useMemo, useState } from "react"
import styled from "styled-components"
import Link from "next/link"
import { DocumentData } from "@/app/docs/[document_key]/page"
import { findDocumentation } from "@/utils/Documentation"
import { LessThen1000 } from "@/utils/ReactiveStyles"

type DocumentNavigatorProps = {
  items: DocumentData[]
  documentKey: string
}

export const DocumentNavigator: React.FC<DocumentNavigatorProps> = props => {
  const { items, documentKey } = props

  return (
    <DocumentNavigatorRoot>
      {items
        .map(it => ({ ...it, selected: documentKey === it.href }))
        .map(it =>
          <DocumentNavigatorItem
            key={`${it.title}_${it.href}`}
            item={it}
            depth={0}
            documentKey={documentKey}
          />
        )
      }
    </DocumentNavigatorRoot>
  )
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
      >
        <DocumentNavigatorExpanderItem
          onClick={() => setExpanded(prev => !prev)}
          $depth={depth}
          $expanded={expanded}
        >
          <svg viewBox="-5 -3 24 24" data-test="toc-expander"><path d="M11 9l-6 5.25V3.75z"></path></svg>
          {item.title}
        </DocumentNavigatorExpanderItem>
        {expanded && item.children
          .map(it => ({ ...it, selected: it.href === documentKey }))
          .map(it =>
            <DocumentNavigatorItem
              key={`${it.title}_${it.href}`}
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
        href={item.href}
        $depth={depth}
        $selected={item.selected}
        $disabled={!item.enabled}
      >
        {item.title}
      </DocumentNavigatorLinkItem>
    )
  }

  throw Error("Assertion Failure(from DocumentNavigatorItem): one of children or href must be provided from DocumentData, but both are undefined or null")
}

const DocumentNavigatorRoot = styled.nav`
  width: 311px;
  border-right: 1px solid #d1d1d2;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 8px 0;

  max-height: 100vw;
  overflow: auto;
    
  & a, button {
    font-size: 13px;
    line-height: 20px;
    font-weight: 300;
  }

  & a:hover, button:hover {
    background-color: rgba(25, 25, 28, 0.05);
  }

  @media only screen and (max-width: 1540px) {
    width: 301px;
  }

  @media only screen and (max-width: 1276px) {
    width: 273px;
  }

  ${LessThen1000} {
    display: none;
  }
`

const DocumentNavigatorChildrenContainer = styled.div<{ $hasGrayBackground: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: stretch;

  background-color: ${({ $hasGrayBackground }) => $hasGrayBackground ? "rgba(25, 25, 28, 0.025)" : "transparent"};
`

const DocumentNavigatorExpanderItem = styled.button<{ $depth: number, $expanded: boolean }>`
  padding: 8px 0 8px ${({ $depth }) => `${22 + ($depth + 1) * 16}px`};

  text-align: left;
  background: none;
  border: none;
  font-family: inherit;

  & > svg {
    width: 14px;
    height: 14px;
    margin-left: -20px;
    margin-right: 8px;
    transform: rotateZ(${({ $expanded }) => $expanded ? "90deg" : "0"});
    transition: transform 0.1s linear;
  }
`

const DocumentNavigatorLinkItem = styled(Link)<{ $selected: boolean, $depth: number, $disabled: boolean }>`
  padding: 8px 0 8px ${({ $depth }) => `${22 + ($depth + 1) * 16}px`};

  background: ${({ $selected }) => $selected ? "#7f52ff !important" : "transparent"};
  color: ${({ $selected }) => $selected ? "white" : "#19191c"};

  opacity: ${({ $disabled }) => $disabled ? 0.4 : 1};
  cursor: ${({ $disabled }) => $disabled ? "auto" : "pointer"}
`
