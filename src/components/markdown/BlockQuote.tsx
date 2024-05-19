"use client"

import React, { PropsWithChildren } from "react"
import styled from "styled-components"
import BlockquoteIcon from "@/resources/blockquote-icon.svg"

export const BlockQuote: React.FC<PropsWithChildren> = props =>
  <BlockQuoteTag>
    <BlockquoteIcon/>
    {props.children}
  </BlockQuoteTag>

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
`