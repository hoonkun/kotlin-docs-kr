"use client"

import { Prism, SyntaxHighlighterProps } from "react-syntax-highlighter"
import React, { Fragment, PropsWithChildren } from "react"
import styled from "styled-components"

const ImportedHighlighter = Prism as typeof React.Component<SyntaxHighlighterProps>

export const CodeBlock: React.FC<PropsWithChildren<{ className: string }>> = props =>
  <ImportedHighlighter
    language={props.className.replace("language-", "")}
    useInlineStyles={false}
    PreTag={Pre}
    CodeTag={Code}
  >
    {props.children as any}
  </ImportedHighlighter>

export const InlineCode = styled.code`
  padding: 1px 6px 0 6px;
  background-color: #19191C0D;
  border-radius: 3px;
  font-size: calc(100% * 15 / 16);
  font-family: "JetBrains Mono", monospace;
  font-weight: 300;
  box-sizing: border-box;
`

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
  min-width: 0;
  display: flex;

  flex-shrink: 0;

  overflow-x: auto;

  margin: 32px 0 0 0;
  
  background-color: rgba(25, 25, 28, 0.05);
  border-radius: 8px;
  padding: 16px 32px;

  & > code {
    padding: 0;
    background-color: transparent;
    border-radius: 0;
    white-space: pre;
    font-size: 15px;

    font-family: "JetBrains Mono", monospace;
    font-weight: 300;
  }

  .comment { color: #8c8c8c }
  .prolog { color: #708090 }
  .cdata { color: #708090 }
  .delimiter { color: #CF8E6D }
  .boolean { color: #871094 }
  .keyword { color: #0033b3; }
  .selector { color: #CF8E6D }
  .important { color: #CF8E6D }
  .atrule { color: #CF8E6D }
  .operator { color: #9a6e3a }
  .punctuation { color: #999999 }
  .tag { color: #e8bf6a }
  .tag.punctuation { color: #e8bf6a }
  .tag.script { color: #999999 }
  .attr-name { color: #999999 }
  .tag.class-name { color: #2FBAA3 }
  .doctype { color: #e8bf6a }
  .builtin { color: #CF8E6D }
  .entity { color: #6897bb }
  .number { color: #871094 }
  .symbol { color: #6897bb }
  .property { color: #c77dbb }
  .property-access { color: #c77dbb }
  .constant { color: #c77dbb }
  .variable { color: #c77dbb }
  .string { color: #067d17 }
  .char { color: #6AAB73 }
  .attr-value { color: #a5c261 }
  .attr-value.punctuation { color: #a5c261 }
  .attr-value.punctuation:first-of-type { color: #999999 }
  .url { color: #287bde; text-decoration: underline; }
  .function { color: #00627a }
  .method { color: #27282c }
  .regex { background: #364135 }
  .bold { font-weight: bold }
  .italic { font-style: italic }
  .inserted { background: #294436 }
  .deleted { background: #484a4a }
  .code.language-css .token.property { color: #999999 }
  .code.language-css .token.property + .token.punctuation { color: #999999 }
  .code.language-css .token.id { color: #ffc66d }
  .code.language-css .token.selector > .token.class { color: #ffc66d }
  .code.language-css .token.selector > .token.attribute { color: #ffc66d }
  .code.language-css .token.selector > .token.pseudo-class { color: #ffc66d }
  .code.language-css .token.selector > .token.pseudo-element { color: #ffc66d }
  .maybe-class-name { color: #bcbec4 }`