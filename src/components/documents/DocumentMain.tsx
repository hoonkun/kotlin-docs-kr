"use client"

import React, { PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import styled, { css } from "styled-components"
import Link from "next/link"
import { DocumentSection } from "@/app/docs/[document_key]/page"
import { LessThen, LessThen1000, LessThen640 } from "@/utils/ReactiveStyles"
import { EmptyFunction } from "@/utils/Any"

type DocumentMainProps = { sections: DocumentSection[], withoutAside?: boolean, disableWidthLimiting?: boolean }

export const DocumentMain: React.FC<PropsWithChildren<DocumentMainProps>> = props => {
  const {
    children,
    sections,
    withoutAside,
    disableWidthLimiting
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
    const newHeadings = Array.from(document.querySelectorAll(".article > .anchor-container"))
      .map(it => ({ top: (it as HTMLDivElement).offsetTop, text: (it as HTMLHeadingElement).innerText }))
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
      <Arranger $adjustPaddings={disableWidthLimiting}>
        <Article
          className={"article"}
          $disableWidthLimiting={disableWidthLimiting}
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
  max-width: calc(calc(1520px - 22px * 2) - 310px);
  flex: 1;
  display: flex;
  align-items: flex-start;
  padding: 0 ${({ $adjustPaddings }) => $adjustPaddings ? "32px" : "22px"} 0 32px;
  margin: 0 auto;
  
  ${LessThen1000} {
    padding: 0 22px;
  }
  
  ${LessThen640} {
    padding: 0 16px;
  }
`

const Article = styled.article<{ $disableWidthLimiting?: boolean }>`
  line-height: 24px;
  font-size: 16px;
  font-weight: 300;
  word-break: keep-all;

  display: flex;
  flex-direction: column;
  align-items: flex-start;

  flex: 1;

  & > * {
    width: ${({ $disableWidthLimiting }) => $disableWidthLimiting ? "auto" : css`min(706px, 100vw - 300px - 209px - 32px - 32px - 22px)`};
    min-width: 0;
  }
  
  ${LessThen(1276)} {
    & > * {
      width: ${({ $disableWidthLimiting }) => $disableWidthLimiting ? "auto" : css`min(706px, 100vw - 300px - 209px - 32px - 32px - 22px + 28px)`};
    }
  }

  ${LessThen1000} {
    & > * {
      width: ${({ $disableWidthLimiting }) => $disableWidthLimiting ? "auto" : css`min(706px, 100vw - 44px)`};
    }
  }
  
  ${LessThen640} {
    & > * {
      width: ${({ $disableWidthLimiting }) => $disableWidthLimiting ? "auto" : css`min(706px, 100vw - 32px)`};
    }
  }
  
  & p {
    margin-top: 16px;
    margin-bottom: 0;
  }
  
  & h1 + p, h2 + p, h3 + p, h4 + p, h5 + p, h6 + p, p + p, ul + p, ol + p, pre + p, blockquote + p {
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

  & a:not(:has(svg, img)) {
    border-bottom: 1px solid #d1d1d2;
    transition: border-color 0.1s linear;
  }

  & a:not(:has(svg, img)).external-link:after, a:not(:has(svg, img)).api-doc:after {
    content: "\\2197";
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
  
  & table {
    border-collapse: collapse;
    margin-top: 8px;
    width: 100%;
  }
  & table thead th {
    background-color: #f4f4f4;
  }
  & table td, th {
    border: 1px solid #d1d1d2;
    padding: 16px;
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
    content: "\\2190";
    margin-right: 8px;
  }
  
  & > .document-pager > .next {
    grid-column: 2;
    grid-row: 1;
    justify-self: end;
  }

  & > .document-pager > .next:after {
    content: "\\2192";
    margin-left: 8px;
  }
`

const Aside = styled.aside`
  width: 241px;
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
