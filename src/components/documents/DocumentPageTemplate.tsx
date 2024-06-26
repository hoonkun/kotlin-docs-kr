"use client"

import React, { createContext, PropsWithChildren, useContext } from "react"
import { DocumentNavigator } from "@/components/documents/DocumentNavigator"
import { DocumentMain } from "@/components/documents/DocumentMain"
import { DocumentData, DocumentSection } from "@/app/docs/[document_key]/page"
import styled from "styled-components"
import GithubIcon from "@/resources/github-icon.svg"
import { keyOf, titleOf } from "@/utils/Documentation"
import { GitRepository } from "@/config"

export type DocumentPageTemplateProps = {
  document: DocumentData
  documents: DocumentData[]
  sections: DocumentSection[]
  withoutAside?: boolean
}

const DocumentContext = createContext<{ document: DocumentData }>({ document: null! })
const useDocument = () => useContext(DocumentContext)

export const DocumentPageTemplate: React.FC<PropsWithChildren<DocumentPageTemplateProps>> = props =>
  <DocumentContext.Provider value={{ document: props.document }}>
    <Root>
      <DocumentNavigator
        items={props.documents}
        documentKey={keyOf(props.document)}
      />
      <DocumentMain
        sections={props.sections}
        withoutAside={props.withoutAside}
      >
        {props.children}
        <EndPadding/>
      </DocumentMain>
    </Root>
  </DocumentContext.Provider>


type DocumentContentProps = {
  breadcrumbs: DocumentData[]
}

const DocumentContent: React.FC<PropsWithChildren<DocumentContentProps>> = props => {
  const { document } = useDocument()
  return (
    <>
      <Breadcrumbs className={"breadcrumb"}>
        {props.breadcrumbs.length > 2 ?
          props.breadcrumbs.slice(1).map(it => <li key={`${titleOf(it)}_${it.href}`}>{titleOf(it)}</li>) :
          <></>
        }
      </Breadcrumbs>
      <h1 id={titleOf(document).replaceAll(" ", "_")}>{titleOf(document)}</h1>
      {props.children}
    </>
  )
}

type NotYetTranslatedDocumentContentProps = DocumentContentProps

export const NotYetTranslatedContent: React.FC<NotYetTranslatedDocumentContentProps> = props => {
  const { document } = useDocument()
  return (
    <DocumentContent breadcrumbs={props.breadcrumbs}>
      <NotYetTranslatedRoot>
        아직 번역되지 않았어요...
        <span><a href={GitRepository}>GitHub</a> 에 방문하여 번역에 <a href={`${GitRepository}/new/main?filename=docs/${keyOf(document)}`}>기여</a>해보세요!</span>
      </NotYetTranslatedRoot>
    </DocumentContent>
  )
}

type ExistingDocumentContentProps = DocumentContentProps & {
  lastModified: string
}

export const TranslatedContent: React.FC<PropsWithChildren<ExistingDocumentContentProps>> = props => {
  const { document } = useDocument()
  return (
    <DocumentContent breadcrumbs={props.breadcrumbs}>
      <DocumentDescriptionRow className={"document-description"}>
        <GithubIcon/>
        <GithubEditPage href={`${GitRepository}/edit/main/docs/${keyOf(document)}`}>편집하기</GithubEditPage>
        <LastModifiedDate>
          &nbsp;마지막 수정: {props.lastModified}
        </LastModifiedDate>
      </DocumentDescriptionRow>
      {props.children}
    </DocumentContent>
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
  height: 24px;

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

const DocumentDescriptionRow = styled.div`
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

const LastModifiedDate = styled.p`
  margin: 0 0 0 4px !important;
  font-size: 13px;
  color: #19191cb3;
`

const EndPadding = styled.div`
  min-height: 64px;
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

