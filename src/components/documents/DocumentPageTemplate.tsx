"use client"

import React, { PropsWithChildren } from "react"
import { DocumentNavigator } from "@/components/documents/DocumentNavigator"
import { DocumentMain } from "@/components/documents/DocumentMain"
import { DocumentData, DocumentSection } from "@/app/docs/[document_key]/page"
import styled from "styled-components"
import GithubIcon from "@/resources/github-icon.svg"

export type DocumentPageTemplateProps = {
  document: DocumentData
  documents: DocumentData[]
  documentKey: string
  sections: DocumentSection[]
  breadcrumbs: DocumentData[]
  hasContent?: boolean
  withoutAdditionalUi?: boolean
}

export const DocumentPageTemplate: React.FC<PropsWithChildren<DocumentPageTemplateProps>> = props =>
  <Root>
    <DocumentNavigator items={props.documents} documentKey={props.documentKey}/>
    <DocumentMain sections={props.sections} withoutAside={props.withoutAdditionalUi}>
      {!props.withoutAdditionalUi &&
        <>
          <Breadcrumbs>
            {props.breadcrumbs.slice(1).map(it => <li key={`${it.title}_${it.href}`}>{it.title}</li>)}
          </Breadcrumbs>
          <h1 id={props.document.title.replaceAll(" ", "_")}>{props.document.title}</h1>
          {props.hasContent &&
            <GithubEditRow>
              <GithubIcon/>
              <GithubEditPage href={"https://github.com/"}>편집하기</GithubEditPage>{/* TODO! */}
            </GithubEditRow>
          }
        </>
      }
      {props.children}
      <EndPadding/>
    </DocumentMain>
  </Root>

export const NotYetTranslated: React.FC = () => {
  return (
    <NotYetTranslatedRoot>
      아직 번역되지 않았어요...
      <span>GitHub 에 방문하여 번역에 기여해보세요!</span>
    </NotYetTranslatedRoot>
  )
}

const Root = styled.div`
  display: flex;
  width: 100vw;
  flex: 1;
`

const Breadcrumbs = styled.ul`
  list-style-type: none;
  display: flex;

  font-size: 15px;
  font-weight: 300;
  letter-spacing: 0.05em;
  color: #5e5e60;

  padding-inline-start: 0;

  & > li {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  & > li:last-of-type {
    color: #19191c;
    font-weight: 400;
  }

  & > li:nth-of-type(n+2):before {
    content: "/";
    font-weight: 300;
    color: #d1d1d2;
    margin: 0 4px;
  }
`

const GithubEditRow = styled.div`
  display: flex;
  align-items: center;
  margin-top: 10px;
  margin-bottom: 32px;
  height: 26px;

  & > svg {
    width: 24px;
    height: 24px;
    margin-right: 2px;
  }

  & + p {
    margin-top: 0 !important;
  }
`

const GithubEditPage = styled.a`
  font-size: 13px;
  width: unset !important;
  line-height: 16px !important;
`

const EndPadding = styled.div`
  min-height: 128px;
`

const NotYetTranslatedRoot = styled.p`
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

