"use client"

import React, { PropsWithChildren, useEffect, useRef, useState } from "react"
import styled from "styled-components"

import BlockquoteIcon from "@/resources/blockquote-icon.svg"
import BlockquoteTipIcon from "@/resources/blockquote-tip-icon.svg"
import BlockquoteAuthorIcon from "@/resources/blockquote-author-icon.svg"
import BlockquoteCautionIcon from "@/resources/blockquote-caution-icon.svg"

export const BlockQuote: React.FC<PropsWithChildren> = props => {

  const quote = useRef<HTMLQuoteElement>(null)
  const [quoteType, setQuoteType] = useState<QuoteType | null>(null)

  useEffect(() => {
    const prevNode = quote.current!.previousElementSibling
    if (!prevNode) return

    const type = Array.from(prevNode.classList)
      .filter(it => it.includes("quote-"))
      .map(it => it.replace("quote-", ""))[0]

    if (!type)
      setQuoteType("information")
    else
      setQuoteType(type as QuoteType)
  }, [])

  const Icon = quoteType ? QuoteIcons[quoteType] : <svg/>

  return (
    <BlockQuoteTag ref={quote}>
      {Icon}
      <BlockQuoteContent>
        {props.children}
      </BlockQuoteContent>
    </BlockQuoteTag>
  )
}

const QuoteIcons: { [key in QuoteType]: JSX.Element } = {
  "information": <BlockquoteIcon/>,
  "author": <BlockquoteAuthorIcon/>,
  "tip": <BlockquoteTipIcon/>,
  "caution": <BlockquoteCautionIcon/>
}

type QuoteType = "information" | "tip" | "author" | "caution"

const BlockQuoteTag = styled.blockquote`
  display: flex;
  flex-direction: row;
  margin: 32px 0 0 0;
  padding: var(--article-quote-padding);
  background-color: rgba(77, 187, 95, 0.2);
  color: rgba(25, 25, 28, 0.7);
  border-radius: 6px;
  word-break: break-word;

  & > svg {
    flex-shrink: 0;
    margin-right: var(--article-quote-icon-margin);
    width: var(--article-quote-icon-size);
    height: var(--article-quote-icon-size);
    color: #4dbb5f;
    fill: currentColor;
  }

  & p {
    margin-top: 0 !important;
  }
  
  & pre {
    margin-top: 16px;
  }
  
  li > & {
    margin: 16px 0 0 0;
  }

  .quote-author + & {
    background-color: rgba(77, 154, 187, 0.2);
  }

  .quote-author + & > svg {
    color: #4D9ABB;
  }
  
  .quote-tip + & {
    background-color: rgba(25, 25, 28, 0.05);
  }
  
  .quote-tip + & > svg {
    color: rgba(25,25,28,0.7);
  }
  
  .quote-caution + & {
    background-color: rgba(244, 92, 74, 0.2);
  }
  
  .quote-caution + & > svg {
    color: #f45c4a;
  }
`

const BlockQuoteContent = styled.div`
  min-width: 0;
  
  & > ul + p {
    margin-top: 12px !important;
  }
  
  & > p + p {
    margin-top: 12px !important;
  }
`
