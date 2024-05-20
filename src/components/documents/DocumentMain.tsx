"use client"

import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import styled from "styled-components"
import Link from "next/link"
import { DocumentSection } from "@/app/docs/[document_key]/page"
import { LessThen1000, LessThen640 } from "@/utils/ReactiveStyles"

type DocumentMainProps = { sections: DocumentSection[], withoutAside?: boolean }

export const DocumentMain: React.FC<PropsWithChildren<DocumentMainProps>> = props => {
  const {
    children,
    sections,
    withoutAside
  } = props

  const defaultViewing = sections[0].text

  const scroller = useRef<Element | null>(null)

  const [viewing, setViewing] = useState<string | null>(defaultViewing)
  const [headings, setHeadings] = useState<DocumentHeading[]>([])

  const onScroll = useCallback((fromHeadings: DocumentHeading[], scrollTop: number) => {
    const found = fromHeadings.findLast(it => it.top < scrollTop)
    setViewing(found ? found.text : defaultViewing)
  }, [defaultViewing])

  useEffect(() => {
    scroller.current = document.scrollingElement
  }, [])

  useEffect(() => {
    const currentScroller = scroller.current
    if (!currentScroller) return

    const handler = () => onScroll(headings, currentScroller.scrollTop)

    document.addEventListener("scroll", handler)
    return () => document.removeEventListener("scroll", handler)
  }, [headings, onScroll])

  useEffect(() => {
    const newHeadings = Array.from(document.querySelectorAll(".article > .anchor-container"))
      .map(it => ({ top: (it as HTMLDivElement).offsetTop, text: (it as HTMLHeadingElement).innerText }))
    setHeadings(newHeadings)

    onScroll(newHeadings, scroller.current!.scrollTop)
  }, [onScroll])

  return (
    <Root>
      <Arranger>
        <Article className={"article"}>
          {children}
        </Article>
        {!withoutAside &&
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
        }
      </Arranger>
    </Root>
  )
}

type DocumentHeading = { top: number, text: string }

const Root = styled.main`
  flex: 1;
  display: flex;
  position: relative;
  align-items: flex-start;
`

const Arranger = styled.div`
  max-width: calc(calc(1520px - 22px * 2) - 310px);
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding: 0 22px 0 32px;
  margin: 0 auto;
  
  ${LessThen1000} {
    padding: 0 22px;
  }
  
  ${LessThen640} {
    padding: 0 16px;
  }
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
    width: min(706px, 100vw - 300px - 209px - 32px - 32px - 22px);
    min-width: 0;
  }

  ${LessThen1000} {
    & > * {
      width: min(706px, 100vw - 44px);
    }
  }
  
  ${LessThen640} {
    & > * {
      width: min(706px, 100vw - 32px);
    }
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
    font-weight: 600;
    font-size: 43px;
    line-height: 49px;
    
    ${LessThen640} {
      font-size: 35px;
    }
  }

  & h2 {
    font-weight: 600;
    font-size: 35px;
    
    ${LessThen640} {
      font-size: 28px;
    }
  }

  & h3 {
    font-weight: 600;
    font-size: 20px;
    
    ${LessThen640} {
      font-size: 20px;
    }
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
  top: 64px;
  flex-shrink: 0;

  max-height: calc(100dvh - 64px - 22px);
  overflow: auto;
  padding: 22px 0 22px 32px;

  &::-webkit-scrollbar {
    display: none;
  }
  
  ${LessThen1000} {
    display: none;
  }

  ${LessThen640} {
    top: 52px;
    max-height: calc(100dvh - 52px - 22px);
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
