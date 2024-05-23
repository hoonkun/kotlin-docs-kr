"use client"

import React, { Fragment, PropsWithChildren, useEffect, useRef, useState } from "react"
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

  const Icon = quoteType ? QuoteIcons[quoteType] : <></>

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
  padding: 16px;
  background-color: rgba(77, 187, 95, 0.2);
  color: rgba(25, 25, 28, 0.7);
  border-radius: 6px;

  & > svg {
    flex-shrink: 0;
    margin-right: 16px;
    width: 24px;
    height: 24px;
    color: #4dbb5f;
    fill: currentColor;
  }

  & p {
    margin-top: 0 !important;
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
  & > ul + p {
    margin-top: 12px !important;
  }
  
  & > p + p {
    margin-top: 12px !important;
  }
`
