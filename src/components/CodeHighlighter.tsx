'use client'

import { Prism, SyntaxHighlighterProps } from "react-syntax-highlighter"
import React, { Fragment, PropsWithChildren } from "react"
import styled from "styled-components"

const ImportedHighlighter = Prism as typeof React.Component<SyntaxHighlighterProps>

export const CodeHighlighter: React.FC<PropsWithChildren<{ className: string }>> = props =>
  <ImportedHighlighter
    language={props.className.replace("language-", "")}
    useInlineStyles={false}
    PreTag={Pre}
    CodeTag={Code}
  >
    {props.children as any}
  </ImportedHighlighter>

const Pre: React.FC<PropsWithChildren> = props => <Fragment>{props.children}</Fragment>
const Code: React.FC<PropsWithChildren> = props => <CodeTag>{props.children}</CodeTag>

const CodeTag = styled.code`
  display: block;
  white-space: pre;
`

export const PreTagSpacer = styled.div`
  width: 32px;
`

export const PreTag = styled.pre`
  font-size: 15px;
  min-width: 0;
  display: flex;

  flex-shrink: 0;

  overflow-x: auto;

  margin: 32px 0 0 0;

  word-break: break-all;
  white-space: pre-wrap;
  background-color: rgba(25, 25, 28, 0.05);
  border-radius: 8px;
  padding: 16px 32px;

  & > code {
    padding: 0;
    background-color: transparent;
    border-radius: 0;
  }

  & > pre {
    min-width: 0;
  }

  & > pre > code {
    min-width: 0;
  }

  .comment {
    color: #708090
  }

  .prolog {
    color: #708090
  }

  .cdata {
    color: #708090
  }

  .delimiter {
    color: #CF8E6D
  }

  .boolean {
    color: #CF8E6D
  }

  .keyword {
    color: #0077aa;
    font-weight: bold;
  }

  .selector {
    color: #CF8E6D
  }

  .important {
    color: #CF8E6D
  }

  .atrule {
    color: #CF8E6D
  }

  .operator {
    color: #9a6e3a
  }

  .punctuation {
    color: #bcbec4
  }

  .tag {
    color: #e8bf6a
  }

  .tag.punctuation {
    color: #e8bf6a
  }

  .tag.script {
    color: #bcbec4
  }

  .attr-name {
    color: #bcbec4
  }

  .tag.class-name {
    color: #2FBAA3
  }

  .doctype {
    color: #e8bf6a
  }

  .builtin {
    color: #CF8E6D
  }

  .entity {
    color: #6897bb
  }

  .number {
    color: #990055
  }

  .symbol {
    color: #6897bb
  }

  .property {
    color: #c77dbb
  }

  .property-access {
    color: #c77dbb
  }

  .constant {
    color: #c77dbb
  }

  .variable {
    color: #c77dbb
  }

  .string {
    color: #669900;
    font-weight: bold;
  }

  .char {
    color: #6AAB73
  }

  .attr-value {
    color: #a5c261
  }

  .attr-value.punctuation {
    color: #a5c261
  }

  .attr-value.punctuation:first-of-type {
    color: #bcbec4
  }

  .url {
    color: #287bde;
    text-decoration: underline;
  }

  .function {
    color: #27282c
  }

  .method {
    color: #27282c
  }

  .regex {
    background: #364135
  }

  .bold {
    font-weight: bold
  }

  .italic {
    font-style: italic
  }

  .inserted {
    background: #294436
  }

  .deleted {
    background: #484a4a
  }

  .code.language-css .token.property {
    color: #bcbec4
  }

  .code.language-css .token.property + .token.punctuation {
    color: #999999
  }

  .code.language-css .token.id {
    color: #ffc66d
  }

  .code.language-css .token.selector > .token.class {
    color: #ffc66d
  }

  .code.language-css .token.selector > .token.attribute {
    color: #ffc66d
  }

  .code.language-css .token.selector > .token.pseudo-class {
    color: #ffc66d
  }

  .code.language-css .token.selector > .token.pseudo-element {
    color: #ffc66d
  }

  .maybe-class-name {
    color: #bcbec4
  }
`