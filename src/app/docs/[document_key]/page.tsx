import fs from "fs"

import React from "react"
import { BaseProcessor, GlobalMarkdownComponents, GlobalRehypeReactOptions } from "@/utils/MarkdownProcessor"
import rehypeReact from "rehype-react"
import { notFound } from "next/navigation"
import { findDocumentation } from "@/utils/Documentation"
import {
  DocumentPageTemplate,
  DocumentPageTemplateProps,
  NotYetTranslated
} from "@/components/documents/DocumentPageTemplate"

import Documents from "@/../docs/registry.json"
import { DocumentHome } from "@/components/documents/DocumentHome"

export default async function DocumentPage(props: { params: { document_key: string } }) {
  const { params: { document_key: key } } = props

  if (key !== "home" && !key.endsWith(".md"))
    notFound()

  const documents = (Documents as RawDocumentData[]).map(documentItemMapper)
  const foundDocumentation = findDocumentation(documents, key)
  if (!foundDocumentation)
    notFound()

  const [document, breadcrumbs] = foundDocumentation
  const sections: DocumentSection[] = [{ type: "h1", text: document.title }]

  const DocumentPageTemplateProps: Omit<DocumentPageTemplateProps, "hasContent"> = {
    document, documents, documentKey: key, sections, breadcrumbs
  }

  if (key === "home") {
    return <DocumentPageTemplate {...DocumentPageTemplateProps} withoutAdditionalUi><DocumentHome/></DocumentPageTemplate>
  }

  if (!fs.existsSync(`./docs/${key}`)) {
    return <DocumentPageTemplate {...DocumentPageTemplateProps}><NotYetTranslated/></DocumentPageTemplate>
  }

  let markdown: string = fs.readFileSync(`./docs/${key}`, { encoding: "utf8" })

  const footnoteRefs = Array.from(markdown.matchAll(/\{\^\[(?<number>[0-9]+)]}/gi))
  const footnoteContents = Array.from(markdown.matchAll(/\{&\[(?<number>[0-9]+)]}/gi))

  const survey = markdown.match(/\{&\?(?<doc_url>.+?)}/)

  markdown = replaceFootnotes(markdown, footnoteRefs, { documentKey: key, type: "ref" }, buildFootnoteRefDOM)
  markdown = replaceFootnotes(markdown, footnoteContents, { documentKey: key, type: "content" }, buildFootnoteContentDOM)

  markdown = replaceSurvey(markdown, survey)

  markdown = replaceAuthorQuote(markdown)

  const html = await BaseProcessor()
    .process(markdown)

  const content = await BaseProcessor()
    .use(rehypeReact, { ...GlobalRehypeReactOptions, components: { ...GlobalMarkdownComponents } })
    .process(markdown)
    .then(it => it.result)

  sections.push(
    ...Array.from(html.value.toString().matchAll(/<(?<opening>h1|h2|h3|h4|h5|h6)>(?<text>.+?)<\/(?<closing>h1|h2|h3|h4|h5|h6)>/gi))
      .map(it => ({ type: it.groups?.["opening"] ?? "h6", text: replaceTag(it.groups?.["text"] ?? "") }))
  )

  return <DocumentPageTemplate {...DocumentPageTemplateProps} hasContent>{content}</DocumentPageTemplate>
}

export async function generateMetadata({ params }: { params: { document_key: string } }) {
  const { document_key: key } = params

  if (key !== "home" && !key.endsWith(".md"))
    return { title: "404 | Kotlin 문서" }

  const documents = (Documents as RawDocumentData[]).map(documentItemMapper)
  const document = findDocumentation(documents, key)

  if (!document)
    return { title: "404 | Kotlin 문서" }

  const title = key === "home" ? "Kotlin 문서" : `${document[0].title} | Kotlin 문서`

  return {
    title,
    icons: {
      icon: { url: "/favicon.svg", type: "image/svg+xml" }
    },
    openGraph: {
      title,
      description: "",
      images: {
        url: "https://kotlinlang.org/assets/images/open-graph/docs.png"
      },
      siteName: "Kotlin Help",
      locale: "ko_KR",
      type: "website"
    },
    twitter: {
      title,
      description: "",
      card: "summary_large_image",
      site: "@kotlin",
      creator: "@kotlin",
      images: ["https://kotlinlang.org/assets/images/open-graph/docs.png"]
    }
  }
}

export const viewport = {
  themeColor: "#27282c"
}

type RawDocumentData = { title: string, href?: string, children?: RawDocumentData[] }
export type DocumentData = Omit<RawDocumentData, "children"> & { enabled: boolean, children?: DocumentData[] }
export type DocumentSection = { type: string, text: string }

const documentItemMapper: (it: RawDocumentData) => DocumentData = it => it.children ?
  { ...it, enabled: true, children: it.children.map(documentItemMapper) } :
  { ...it, enabled: it.href === "home" || fs.existsSync(`./docs/${it.href}`), children: undefined }

const replaceTag = (input: string): string => input
  .replaceAll(/<([0-z]+)>/g, "")
  .replaceAll(/<\/([0-z]+)>/g, "")

const buildSurveyDOM = (url: string): string =>
  `<p class="survey">이 페이지가 도움이 되셨다면, <a href="${url}">원문 페이지</a>에 방문해 엄지척을 해주세요!</p>`

const buildFootnoteRefDOM = (heading: string, number: string): string =>
  `<sup id="${heading}-ref-${number}" class="footnote-ref">${number}</sup>`

const buildFootnoteContentDOM = (heading: string, number: string) =>
  `<span id="${heading}-content-${number}" class="footnote-content">[${number}]&nbsp;</span>`

const replaceSurvey = (markdown: string, survey: RegExpMatchArray | null) => {
  if (!survey) return markdown

  const replaceTarget = survey[0]
  const url = survey.groups?.["doc_url"]
  if (replaceTarget && url)
    return markdown.replace(replaceTarget, buildSurveyDOM(url))

  return markdown
}

const replaceAuthorQuote = (markdown: string) =>
  markdown.replaceAll("{>author}", `<div class="quote-author"></div>\n`)

const findNearestHeading = (content: string, position: number) =>
  content
    .slice(0, position)
    .split("\n")
    .findLast(it => it.startsWith("# ") || it.startsWith("## "))
    ?.slice(2)
    ?.trim()

const replaceFootnotes = (
  markdown: string,
  items: RegExpExecArray[],
  debugging: { documentKey: string, type: "ref" | "content" },
  transform: (normalizedHeading: string, number: string) => string
) => {
  const { documentKey, type } = debugging

  let content = markdown
  let indexShifted = 0
  items.forEach(it => {
    const number = it.groups?.["number"]
    if (!number)
      throw Error(`Assertion Failure: Cannot parse number for ${documentKey}'s footnote ${type} with position ${it.index}`)

    const heading = findNearestHeading(content, it.index + indexShifted) ?? "root"

    const replaceWith = transform(heading.replaceAll(" ", "-"), number)
    content = content.replace(it[0], replaceWith)
    indexShifted += (replaceWith.length - it.length)
  })

  return content
}
