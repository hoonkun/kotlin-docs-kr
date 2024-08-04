"use client"

import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from "react"
import { DocumentNavigator } from "@/components/documents/DocumentNavigator"
import { DocumentMain } from "@/components/documents/DocumentMain"
import { DocumentData, DocumentSection } from "@/app/docs/[document_key]/page"
import styled from "styled-components"
import GithubIcon from "@/resources/github-icon.svg"
import { keyOf, titleOf } from "@/utils/Documentation"
import { GitRepository } from "@/config"
import { formatLastModified } from "@/utils/Date"

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
  const { lastModified } = props

  const { document } = useDocument()

  const originalRepository = document.repository ?? "JetBrains/kotlin-web-site"
  const originalLink = `https://github.com/${originalRepository}/tree/master/docs/topics/${keyOf(document)}`

  const [modified]
    = useState(() => new Date(toISO(lastModified)))
  const [originalModified, setOriginalModified]
    = useState<Date | null | undefined>(undefined)

  useEffect(() => {
    getOriginalDocumentLastModified(keyOf(document), document)
      .then(it => setOriginalModified(it ? new Date(it) : null))
  }, [document])

  return (
    <DocumentContent breadcrumbs={props.breadcrumbs}>
      <DocumentDescriptionRow className={"document-description"}>
        <EditRow>
          <GithubIcon/>
          <GithubEditPage href={`${GitRepository}/edit/main/docs/${keyOf(document)}`}>편집하기</GithubEditPage>
        </EditRow>
        <LastModifiedDateRow>
          <div>
            &nbsp;이 페이지의 마지막 수정:&nbsp;
            <LastModifiedText $outdated={originalModified ? modified < originalModified : false}>
              {formatLastModified(modified)}
            </LastModifiedText>
            {originalModified && ","}
            &nbsp;
          </div>
          {originalModified ?
            <div>
              &nbsp;<a href={originalLink}>Github 원문</a>의 마지막 수정: {formatLastModified(originalModified)}
            </div> :
            originalModified === undefined ?
              <div>&nbsp;...</div> :
              <></>
          }
        </LastModifiedDateRow>
      </DocumentDescriptionRow>
      {props.children}
    </DocumentContent>
  )
}

const toISO = (value: string): string => {
  const a = value.replace(" ", "T").replace(" ", "")
  let [time, zone] = a.split("+")
  zone = [zone.slice(0, 2), zone.slice(2, 4)].join(":")
  return `${time}+${zone}`
}

const getOriginalDocumentLastModified = async (key: string, documentation: DocumentData): Promise<string | null> => {
  try {
    const repository = documentation.repository ?? "JetBrains/kotlin-web-site"

    const endpoint = `https://api.github.com/repos/${repository}/commits?path=docs%2Ftopics%2F${key}&page=1&per_page=1`
    const response = await fetch(endpoint)

    if (!response.ok) return null

    const commits = await response.json()

    return commits?.[0]?.commit?.committer?.date ?? null
  } catch (e) {
    return null
  }
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
  align-items: flex-start;
  margin-top: 10px;
  margin-bottom: 32px;
  min-height: 26px;

  & + p {
    margin-top: 0 !important;
  }
`

const EditRow = styled.div`
  display: flex;
  align-items: center;

  & > svg {
    width: 24px;
    height: 24px;
    margin-right: 2px;
  }
`

const GithubEditPage = styled.a`
  font-size: 13px;
  width: unset !important;
  line-height: 16px !important;
`

const LastModifiedDateRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  margin: 0 0 0 4px !important;
  font-size: 13px;
  color: #19191cb3;
`

const LastModifiedText = styled.span<{ $outdated?: boolean }>`
  color: ${({ $outdated }) => $outdated ? "#c7562c" : "inherit"}
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

