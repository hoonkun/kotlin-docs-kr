"use client"

import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import styled, { css } from "styled-components"
import Link from "next/link"
import { DocumentSection } from "@/app/docs/[document_key]/page"
import { LessThen1000, LessThen640, withDisableWidthLimiting } from "@/utils/ReactiveStyles"
import { EmptyFunction } from "@/utils/Any"

type DocumentMainProps = { sections: DocumentSection[], withoutAside?: boolean }

export const DocumentMain: React.FC<PropsWithChildren<DocumentMainProps>> = props => {
  const {
    children,
    sections,
    withoutAside
  } = props

  const defaultViewing = sections[0]?.text ?? ""

  const aside = useRef<HTMLDivElement>(null)
  const asideScrollRequestDelay = useRef<NodeJS.Timeout | null>(null )
  const pendingAsideScrollRequest = useRef<() => void>(EmptyFunction)

  const [viewing, setViewing] = useState<string | null>(defaultViewing)
  const [headings, setHeadings] = useState<DocumentHeading[]>([])

  const onScroll = useCallback((fromHeadings: DocumentHeading[], scrollTop: number) => {
    const found = fromHeadings.findLast(it => it.top <= scrollTop + 10)
    setViewing(found ? found.text : defaultViewing)
    if (asideScrollRequestDelay.current) clearTimeout(asideScrollRequestDelay.current)
    if (pendingAsideScrollRequest.current) {
      const delayMillis = scrollTop === 0 || Math.abs(scrollTop - document.scrollingElement!.scrollHeight + window.innerHeight) < 5 ? 1250 : 50
      asideScrollRequestDelay.current = setTimeout(pendingAsideScrollRequest.current, delayMillis)
    }
  }, [defaultViewing])

  const initializeHeadings = useCallback(() => {
    const newHeadings = Array.from(document.querySelectorAll(".article > .anchor-container:has(h1,h2,h3)"))
      .map(it => ({ top: (it as HTMLDivElement).offsetTop, text: (it as HTMLDivElement).innerText }))
    setHeadings(newHeadings)

    onScroll(newHeadings, document.scrollingElement!.scrollTop)
  }, [onScroll])

  useEffect(() => {
    const handler = () => onScroll(headings, document.scrollingElement!.scrollTop)

    document.addEventListener("scroll", handler)
    return () => document.removeEventListener("scroll", handler)
  }, [headings, onScroll])

  useEffect(() => {
    initializeHeadings()

    window.addEventListener("resize", initializeHeadings)
    return () => window.removeEventListener("resize", initializeHeadings)
  }, [initializeHeadings])

  useEffect(() => {
    const selectedItem = document.querySelector<HTMLAnchorElement>("a.aside-item.selected")
    if (!selectedItem) return

    pendingAsideScrollRequest.current = () => selectedItem.parentElement!.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [viewing])

  return (
    <Root>
      <Arranger $adjustPaddings={withoutAside}>
        <Article
          className={"article"}
          $disableWidthLimiting={withoutAside}
        >
          {children}
        </Article>
        {!withoutAside &&
          <Aside ref={aside}>
            {sections.map(it =>
              <DocumentSectionItemScrollPositioner key={`${it.type}_${it.text}`}>
                <DocumentSectionItem
                  href={`#${it.text.replaceAll(" ", "-")}`}
                  className={it.text === viewing ? "aside-item selected" : "aside-item"}
                  $indent={Math.max(parseInt(it.type.slice(1)) - 2, 0)}
                  $selected={it.text === viewing}
                >
                  {it.text}
                </DocumentSectionItem>
              </DocumentSectionItemScrollPositioner>
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

const Arranger = styled.div<{ $adjustPaddings?: boolean }>`
  max-width: var(--arranger-max-width);
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding: 
    0 ${({ $adjustPaddings }) => $adjustPaddings ? css`var(--arranger-left-padding)` : css`var(--arranger-right-padding)`} 
    0 var(--arranger-left-padding);
  margin: 0 auto;
`

const Article = styled.article<{ $disableWidthLimiting?: boolean }>`
  line-height: 24px;
  font-size: 16px;
  font-weight: 300;
  word-break: keep-all;
  
  /* 이게 없으면 테이블 너비가 망가지는데 어째서인지 모르겠다 CSS 너모 어렵다^^ */
  width: 0;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  flex: 1;

  & > * {
    width: ${withDisableWidthLimiting(`var(--article-width)`)};
    min-width: 0;
  }
  
  & > blockquote > div > pre {
    width: ${withDisableWidthLimiting(`var(--article-quote-code-block-width)`)};
    min-width: 0;
  }
  
  & p {
    margin-top: 16px;
    margin-bottom: 0;
  }
  
  & strong {
    font-weight: 600;
  }
  
  & .document-description + div {
    & > h1, & > h2, & > h3, & > h4, & > h5, & > h6 {
      margin-top: 32px;
    }
  }
  
  & h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p, p + p, ul + p, ol + p, pre + p, blockquote + p, .table-wrapper + p {
    margin-top: 32px;
    margin-bottom: 0;
  }

  & hr {
    border-top: 1px solid #19191c0D;
    border-bottom: none;
    border-left: none;
    border-right: none;
    margin-top: 24px;
    align-self: stretch;
    margin-left: 0;
    margin-right: 0;
  }

  & hr + p, & hr + div {
    opacity: 0.75;
    font-size: 14px;
    margin-top: 0;
    
    & > p:first-of-type {
      margin-top: 0;
    }
    
    & > p:nth-of-type(n+2) {
      margin-top: 8px;
    }
    
    & pre {
      margin: 8px 0 0 0 !important;
      padding: 8px 16px !important;
      line-height: 18px;
      & * {
        font-size: 12px !important;
      }
    }
  }

  & a:not(:has(svg, img)) {
    border-bottom: 1px solid #d1d1d2;
    transition: border-color 0.1s linear;
  }

  & a.external-link {
    color: #124f8a;
  }

  & a:not(:has(svg, img)).external-link:after, a:not(:has(svg, img)).api-doc:after {
    content: "↗";
    transform: translateY(2px);
    display: inline-block;
  }

  & a:not(:has(svg, img)):hover {
    border-bottom: 1px solid #19191c;
  }
  
  & ol p, ul p {
    margin-top: 0;
  }

  & .survey a.api-doc {
    color: #7f52ff;
  }

  & sup {
    font-size: 11px;
    line-height: 0;
  }

  & ol {
    margin-top: 16px;
    margin-bottom: 0;
    padding-inline-start: 22px;
  }
  & ol > li {
    margin-bottom: 0;
  }
  & ol > li:nth-of-type(n+2) {
    margin-top: 16px;
  }

  & ul:not(.breadcrumb) {
    margin-top: 12px;
    margin-bottom: 0;
    padding-inline-start: 0;
    list-style-type: none;
  }
  & > ul:not(.breadcrumb) {
    margin-top: 32px;
  }
  & ul:not(.breadcrumb) > li {
    margin-bottom: 0;
    padding-left: 22px;
    position: relative;
  }
  & ul:not(.breadcrumb) > li:before {
    content: "•";
    position: absolute;
    left: 0;
    top: -2px;
    font-size: 20px;
  }
  & ul:not(.breadcrumb) > li:nth-of-type(n+2) {
    margin-top: 8px;
  }
  & > ol > li > ul:not(.breadcrumb) {
    margin-top: 8px;
  }
  & :not(.compact) + ul li:nth-of-type(n+2) {
    margin-top: 16px;
  }
  & :not(.compact) + ul > li:nth-of-type(n) {
    margin-top: 24px;
  }
  & :not(.compact) + ul > li:nth-of-type(1) {
    margin-top: 0;
  }
  
  & li > pre {
    margin-top: 24px;
  }
  
  & .table-wrapper {
    margin-top: 32px;
    overflow-x: auto;
    
    width: ${({ $disableWidthLimiting }) => $disableWidthLimiting ? "auto" : css`var(--article-table-width)`};
  }
  & table {
    width: 100%;
    border-collapse: collapse;
  }
  & table thead th {
    background-color: #f4f4f4;
    font-weight: 300;
    text-align: left;
  }
  & table td, th {
    border: 1px solid #d1d1d2;
    padding: 16px;
    vertical-align: top;
  }

  & h1, h2, h3, h4, h5, h6 {
    margin-bottom: 0;
    line-height: initial;
  }

  & h1 {
    margin-top: 1em;
    padding-top: 0.6em;
    font-weight: 500;
    font-size: 43px;
    line-height: 49px;
    
    ${LessThen640} {
      font-size: 35px;
    }
  }

  & h2 {
    margin-top: 64px;
    font-weight: 500;
    font-size: 35px;
    
    ${LessThen640} {
      font-size: 28px;
    }
  }

  & h3 {
    margin-top: 48px;
    font-weight: 500;
    font-size: 20px;
    
    ${LessThen640} {
      font-size: 20px;
    }
  }
  
  & h4 {
    font-weight: 500;
    font-size: 20px;
  }
  
  & h5 {
    font-weight: 500;
    font-size: 17px;
  }

  & > .survey {
    background-color: #f4f4f4;
    border-radius: 4px;
    padding: 16px 32px;
    margin-top: 64px;
  }
  
  & > .document-pager {
    margin-top: 96px;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  
  & > .document-pager > .previous {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
  }

  & > .document-pager > .previous:before {
    content: "←";
    margin-right: 8px;
  }
  
  & > .document-pager > .next {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }

  & > .document-pager > .next:after {
    content: "→";
    margin-left: 8px;
  }
`

const Aside = styled.aside`
  width: var(--article-summary-width);
  position: sticky;
  top: 64px;
  flex-shrink: 0;

  max-height: calc(100dvh - 64px);
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

const DocumentSectionItemScrollPositioner = styled.div`
  margin-top: -96px;
  padding: 48px 0;
  pointer-events: none;
  position: relative;
  
  &:first-of-type {
    margin-top: -48px;
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
  pointer-events: auto;

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
