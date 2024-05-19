"use client"

import styled from "styled-components";
import React, { PropsWithChildren } from "react";

import BlockquoteIcon from "@/resources/blockquote-icon.svg"

export const DocumentPageRoot = styled.div`
  display: flex;
  width: 100vw;
  flex: 1;
  min-height: 0;
`

export const NotYetTranslated = styled.p`
  font-weight: 300;
  text-align: center;
  margin-top: 120px !important;
  font-size: 28px;
  width: unset !important;
  align-self: stretch;

  & > span {
    display: block;
    font-size: 14px;
    opacity: 0.6;
    margin-top: 16px;
  }
`

export const DocumentEndPadding = styled.div`
  min-height: 128px;
`

export const InlineCode = styled.code`
  padding: 2px 6px;
  background-color: #19191C0D;
  border-radius: 3px;
  font-size: 15px;
`

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
