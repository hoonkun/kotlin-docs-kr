"use client"

import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import styled from "styled-components"
import Link from "next/link"
import { DocumentSection } from "@/app/docs/[document_key]/page"

type DocumentMainProps = { sections: DocumentSection[] }

export const DocumentMain: React.FC<PropsWithChildren<DocumentMainProps>> = props => {
  const {
    children,
    sections: sections,
  } = props

  const defaultViewing = sections[0].text

  const scroller = useRef<HTMLDivElement>(null)

  const [viewing, setViewing] = useState<string | null>(defaultViewing)
  const [headings, setHeadings] = useState<DocumentHeading[]>([])

  const onScroll = useCallback((fromHeadings: DocumentHeading[], scrollTop: number) => {
    const found = fromHeadings.findLast(it => it.top < scrollTop)
    setViewing(found ? found.text : defaultViewing)
  }, [defaultViewing])

  useEffect(() => {
    const newHeadings = Array.from(document.querySelectorAll(".article > h1, h2, h3, h4, h5, h6"))
      .map(it => ({ top: (it as HTMLHeadingElement).offsetTop, text: (it as HTMLHeadingElement).innerText }))
    setHeadings(newHeadings)

    onScroll(newHeadings, scroller.current!.scrollTop)
  }, [onScroll])

  return (
    <Root
      ref={scroller}
      onScroll={e => onScroll(headings, e.currentTarget.scrollTop)}
    >
      <Arranger>
        <Article className={"article"}>
          {children}
        </Article>
        <Aside>
          {sections.map(it =>
            <DocumentSectionItem
              key={`${it.type}_${it.text}`}
              href={`#${it.text.replaceAll(" ", "_")}`}
              $indent={Math.max(parseInt(it.type.slice(1)) - 2, 0)}
              $selected={it.text === viewing}
            >
              {it.text}
            </DocumentSectionItem>
          )}
        </Aside>
      </Arranger>
    </Root>
  )
}

type DocumentHeading = { top: number, text: string }

const Root = styled.main`
  flex: 1;
  display: flex;
  position: relative;
  max-height: 100vh;
  overflow-y: auto;
  align-items: flex-start;
`

const Arranger = styled.div`
  max-width: calc(calc(1520px - 22px * 2) - 310px);
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding: 0 22px 0 32px;
  margin: 0 auto;
`

const Article = styled.article`
  line-height: 24px;
  font-size: 16px;
  font-weight: 300;
  word-break: keep-all;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  flex: 1;

  & > * {
    width: min(706px, 100vw - 300px - 209px - 32px - 32px - 22px); /* TODO: 모바일 대응 시에 수정할 것 */
    min-width: 0;
  }

  & p {
    margin-top: 32px;
    margin-bottom: 0;
  }

  & hr {
    border-top: 1px solid #19191c0D;
    margin-top: 24px;
    align-self: stretch;
    margin-left: 0;
    margin-right: 0;
  }

  & hr + p {
    opacity: 0.75;
    font-size: 14px;
    margin-top: 0;
  }

  & a {
    border-bottom: 1px solid #d1d1d2;
    transition: border-color 0.1s linear;
  }

  & a.external-link:after, a.api-doc:after {
    content: "\\2197";
    transform: translateY(2px);
    display: inline-block;
  }

  & a:hover {
    border-bottom: 1px solid #19191c;
  }

  & a.external-link {
    color: #3083d1;
  }

  & .survey a.api-doc {
    color: #7f52ff;
  }

  & sup {
    font-size: 11px;
    line-height: 0;
  }

  & ul:nth-of-type(n+2) {
    padding-inline-start: 1em;
  }

  & ul:nth-of-type(n+2) > li {
    margin-bottom: 0;
  }

  & ul:nth-of-type(n+2) > li:nth-of-type(n+2) {
    margin-top: 24px;
  }

  & h1, h2, h3, h4, h5, h6 {
    margin-top: 1em;
    padding-top: 0.6em;
    margin-bottom: 0;
    line-height: initial;
  }

  & h1 {
    line-height: 49px;
  }

  & h1 {
    font-weight: 600;
    font-size: 43px;
  }

  & h2 {
    font-weight: 600;
    font-size: 35px;
  }

  & h3 {
    font-weight: 600;
    font-size: 20px;
  }

  & > .survey {
    background-color: #f4f4f4;
    border-radius: 4px;
    padding: 16px 32px;
    margin-top: 64px;
  }
`

const Aside = styled.aside`
  width: 241px;
  position: sticky;
  top: 0;
  flex-shrink: 0;

  max-height: calc(100dvh - 64px - 22px);
  overflow: auto;
  padding: 22px 0 22px 32px;

  &::-webkit-scrollbar {
    display: none;
  }
`

const DocumentSectionItem = styled(Link)<{ $indent: number, $selected: boolean }>`
  display: block;
  line-height: 20px;
  font-size: 13px;
  padding: 8px 12px 8px ${({ $indent }) => `${$indent * 16 + 22}px`};
  border-left: 1px solid #d1d1d2;
  font-weight: 300;
  word-break: keep-all;
  position: relative;

  transition: border-left-color 0.2s linear;

  &:after {
    position: absolute;
    z-index: 1;
    left: 0;
    top: 0;
    bottom: 0;
    background-color: #7f52ff;
    width: 3px;
    content: "";
    transform: translateX(-2px);
    transition: opacity 0.1s linear;
    opacity: ${({ $selected }) => $selected ? 1 : 0}
  }

  &:hover {
    background-color: rgba(25, 25, 28, 0.05);
  }
`
