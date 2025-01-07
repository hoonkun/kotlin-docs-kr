import fs from "fs"
import { execSync } from "child_process"

import React from "react"
import { HtmlToReact, MarkdownToHtml } from "@/utils/MarkdownProcessor"
import { notFound, redirect } from "next/navigation"
import { findDocumentation, findExceptionalDocumentation, flatDocumentation, titleOf } from "@/utils/Documentation"
import {
  DocumentPageTemplate,
  DocumentPageTemplateProps,
  NotYetTranslatedContent,
  TranslatedContent
} from "@/components/documents/DocumentPageTemplate"
import Documents from "@/../docs/registry.json"
import ExceptionalDocuments from "@/../docs/exceptions.json"
import { DocumentHome } from "@/components/documents/DocumentHome"

export default async function DocumentPage(props: { params: Promise<{ document_key: string }> }) {
  const { document_key: key } = await props.params

  if (key.endsWith(".html"))
    redirect(`/docs/${key.slice(0, -5)}.md`)

  if (key !== "home" && !key.endsWith(".md"))
    notFound()

  const documents = (Documents as RawDocumentData[]).map(documentItemMapper)
  const flattenDocuments = flatDocumentation(documents)
  const foundDocumentation = findDocumentation(documents, key) ?? findExceptionalDocumentation(ExceptionalDocuments, key)
  if (!foundDocumentation)
    notFound()

  const [document, breadcrumbs] = foundDocumentation
  const sections: DocumentSection[] = [{ type: "h1", text: titleOf(document) }]

  const DocumentPageTemplateProps: DocumentPageTemplateProps = { document, documents, sections }

  if (key === "home") {
    const existingDocuments = fs.readdirSync("./docs")
      .map(it => flattenDocuments.find(document => document.href === it))
      .filter(it => !!it) as DocumentData[]
    return <DocumentPageTemplate {...DocumentPageTemplateProps} withoutAside><DocumentHome existingDocuments={existingDocuments}/></DocumentPageTemplate>
  }

  if (!fs.existsSync(`./docs/${key}`)) {
    return <DocumentPageTemplate {...DocumentPageTemplateProps}><NotYetTranslatedContent breadcrumbs={breadcrumbs}/></DocumentPageTemplate>
  }

  const gitLogResult = execSync(`git log -1 --pretty="format:%ci" ./docs/${key}`).toString().trim()
  const lastModified = gitLogResult ? gitLogResult : new Date().toISOString()

  let markdown: string = fs.readFileSync(`./docs/${key}`, { encoding: "utf8" })
  markdown = moveOriginalAnchorsToChildren(markdown)

  const footnoteRefs = Array.from(markdown.matchAll(/\{\^\[(?<number>[0-9]+)]}/gi))
  const footnoteContents = Array.from(markdown.matchAll(/\{&\[(?<number>[0-9]+)]}/gi))

  markdown = replaceFootnotes(markdown, footnoteRefs, { documentKey: key, type: "ref" }, buildFootnoteRefDOM)
  markdown = replaceFootnotes(markdown, footnoteContents, { documentKey: key, type: "content" }, buildFootnoteContentDOM)

  markdown = replaceTabHosts(markdown)
  markdown = replaceTabs(markdown)

  markdown = replaceDefaultTextAnchor(markdown, flattenDocuments)
  markdown = replaceNonExistingReferenceToOriginal(markdown)
  markdown = replaceSurvey(markdown, key)
  markdown = replaceQuoteTypes(markdown)
  markdown = replaceCompactLists(markdown)
  markdown = replaceDocumentPager(markdown, flattenDocuments)

  let html = await MarkdownToHtml(markdown)
  html = replaceFootNoteBlock(html)

  const content = await HtmlToReact(html, key)

  sections.push(
    ...Array.from(html.matchAll(/<(?<opening>h1|h2|h3)>(?<text>.+?)<\/(?<closing>h1|h2|h3)>/gi))
      .map(it => ({
        type: it.groups?.["opening"] ?? "h6",
        text: removeOriginalAnchors(removeTags(it.groups?.["text"] ?? ""))
      }))
  )

  return (
    <DocumentPageTemplate {...DocumentPageTemplateProps}>
      <TranslatedContent breadcrumbs={breadcrumbs} lastModified={lastModified}>
        {content}
      </TranslatedContent>
    </DocumentPageTemplate>
  )
}

export async function generateStaticParams() {
  return flatDocumentation((Documents as RawDocumentData[]).map(documentItemMapper))
    .map(it => ({ document_key: it.href }))
}

export async function generateMetadata({ params }: { params: Promise<{ document_key: string }> }) {
  const { document_key: key } = await params

  if (key !== "home" && !key.endsWith(".md"))
    return { title: "404 | Kotlin 문서" }

  const documents = (Documents as RawDocumentData[]).map(documentItemMapper)
  const document = findDocumentation(documents, key) ?? findExceptionalDocumentation(ExceptionalDocuments, key)

  if (!document)
    return { title: "404 | Kotlin 문서" }

  const title = key === "home" ? "Kotlin 문서" : `${titleOf(document[0])} | Kotlin 문서`

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
  themeColor: "#19191C"
}

type RawDocumentData = { title: string, page_title?: string, href?: string, children?: RawDocumentData[], repository?: string }
export type DocumentData = Omit<RawDocumentData, "children"> & { enabled: boolean, children?: DocumentData[] }
export type DocumentSection = { type: string, text: string }

const documentItemMapper: (it: RawDocumentData) => DocumentData = it => it.children ?
  { ...it, enabled: true, children: it.children.map(documentItemMapper) } :
  { ...it, enabled: it.href === "home" || fs.existsSync(`./docs/${it.href}`), children: undefined }

const buildSurveyDOM = (url: string): string =>
  `<p class="survey">이 페이지가 도움이 되셨다면, <a href="${url}">원문 페이지</a>에 방문해 엄지척을 해주세요!</p>`

const buildFootnoteRefDOM = (heading: string, number: string): string =>
  `<sup id="${heading}-ref-${number}" class="footnote-ref">${number}</sup>`

const buildFootnoteContentDOM = (heading: string, number: string) =>
  `<span id="${heading}-content-${number}" class="footnote-content">[${number}]&nbsp;</span>`

const removeTags = (input: string): string => input
  .replaceAll(/<([0-z]+)>/g, "")
  .replaceAll(/<\/([0-z]+)>/g, "")

const replaceSurvey = (markdown: string, documentKey: string) =>
  markdown.replace(
    "{&?}",
    buildSurveyDOM(ExceptionalDocuments.find(it => it.href === documentKey)?.original_page ?? `https://kotlinlang.org/docs/${documentKey.replace(".md", ".html")}`)
  )

const replaceDefaultTextAnchor = (markdown: string, flattenDocuments: DocumentData[]): string => {
  const links = Array.from(markdown.matchAll(/\[]\((?<href>.+?)\)/gi))

  for (const link of links) {
    if (!link.groups!.href!.startsWith("/docs/") && !link.groups!.href!.endsWith(".md") && link.groups!.href! !== "home")
      throw Error(`Invalid anchor tag detected: ${link[0]}`)

    const foundDocument = flattenDocuments.find(it => it.href === link.groups!.href.replace("/docs/", ""))
    if (!foundDocument)
      throw Error(`Cannot find document to replace default-text anchor: ${link}`)

    markdown = markdown.replace(link[0], `[${titleOf(foundDocument)}](${link.groups!.href})`)
  }

  return markdown
}

const replaceNonExistingReferenceToOriginal = (markdown: string) => {
  const links = Array.from(markdown.matchAll(/\[(?<text>.+?)]\((?<href>.+?)\)/g))

  for (const link of links) {
    const rawReference = link.groups!.href
    if (!rawReference.startsWith("/docs/")) continue

    const referenceName = rawReference.replace(/#(.+)$/, "")
    if (fs.existsSync(`.${referenceName}`)) continue

    const originalReference = referenceName.replace(".md", "")
    markdown = markdown.replace(rawReference, `https://kotlinlang.org${originalReference}.html`)
  }

  return markdown
}

const replaceDocumentPager = (markdown: string, flattenDocuments: DocumentData[]) => {
  markdown = markdown.replaceAll("{~}", `<div class="document-pager">`)
  markdown = markdown.replaceAll("{/~}", `</div>`)
  const previous = markdown.match(/\{<~(?<href>.+?)}/)
  if (previous) {
    const key = previous.groups!.href
    const title = titleOf(flattenDocuments.find(it => it.href === key)!)
    markdown = markdown.replaceAll(previous[0], `<a class="previous" href="/docs/${key}">${title}</a>`)
  }
  const next = markdown.match(/\{~>(?<href>.+?)}/)
  if (next) {
    const key = next.groups!.href
    const title = titleOf(flattenDocuments.find(it => it.href === key)!)
    markdown = markdown.replaceAll(next[0], `<a class="next" href="/docs/${key}">${title}</a>`)
  }

  return  markdown
}

const replaceCompactLists = (markdown: string) =>
  markdown.replaceAll("{*compact}", `<div class="compact"></div>\n`)

const replaceQuoteTypes = (markdown: string) =>
  markdown
    .replaceAll(/\{>(.+?)}/g, `<div class="quote-$1"></div>\n`)

const findNearestHeading = (content: string, position: number) =>
  content
    .slice(0, position)
    .split("\n")
    .findLast(it => it.startsWith("# ") || it.startsWith("## "))
    ?.slice(2)
    ?.trim()

const replaceTabHosts = (markdown: string) => markdown
  .replaceAll("{-}", "<tabs>")
  .replaceAll("{/-}", "</tabs>")
const replaceTabs = (markdown: string) => markdown
  .replaceAll(/\{--(.+?)--(.+?)}/g, `<tab title="$1" identifier="$2">`)
  .replaceAll(/\{\/--(.*?)}/g, `</tab>`)

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

const replaceFootNoteBlock = (html: string) => html
    .replaceAll("<p>{&#x26;^---}</p>", "<div>")
    .replaceAll("<p>{&#x26;$---}</p>", "</div>")

const removeOriginalAnchors = (text: string): string => text
  .replace(/ \{#(.+)}/, "")
  .trim()

const moveOriginalAnchorsToChildren = (markdown: string) => markdown
  .replace(/^(\{#.+})\n(#+) (.+)$/mg, "$2 $3 $1")
