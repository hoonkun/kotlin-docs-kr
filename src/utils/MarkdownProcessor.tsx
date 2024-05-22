import React, { ReactNode } from "react"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import rehypeReact, { Components as RehypeReactComponents, Options as RehypeReactOptions } from "rehype-react"
import Link from "next/link"
import Image from "next/image"
import { CodeBlock, InlineCode, PreTag, PreTagSpacer } from "@/components/markdown/CodeBlock"
import { BlockQuote } from "@/components/markdown/BlockQuote"
import * as ProductionReact from "react/jsx-runtime"
import { HeadingAnchor } from "@/components/markdown/HeadingAnchor"
import { TabHost, TabHostProps, TabItem, TabItemProps } from "@/components/markdown/Tab"
import { Component } from "@/libs/rehype/types"
import rehypeParse from "rehype-parse"

const { jsx, jsxs, Fragment } = ProductionReact

const MarkdownToHtmlProcessor = () => unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)

export const MarkdownToHtml = (markdown: string): Promise<string> => MarkdownToHtmlProcessor()
  .process(markdown)
  .then(it => it.value.toString())

export const MarkdownToReact = (markdown: string, documentKey?: string) => MarkdownToHtmlProcessor()
  .use(rehypeReact, GlobalRehypeReactOptions(documentKey))
  .process(markdown)
  .then(it => it.result)

export const HtmlToReact = (html: string, documentKey?: string): Promise<JSX.Element> => unified()
  .use(rehypeParse, { fragment: true })
  .use(rehypeReact, GlobalRehypeReactOptions(documentKey))
  .process(html)
  .then(it => it.result)

type KotlinDocsKrElements = { tabs: TabHostProps, tab: TabItemProps }
type KotlinDocsKrComponents = { [TagName in keyof KotlinDocsKrElements]: Component<KotlinDocsKrElements[TagName]> | keyof KotlinDocsKrElements }

export const GlobalRehypeReactOptions = (documentKey?: string): RehypeReactOptions => ({
  jsx: jsx as any,
  jsxs: jsxs as any,
  Fragment,
  development: false,
  components: GlobalMarkdownComponents(documentKey)
})

export const GlobalMarkdownComponents = (documentKey?: string): Partial<RehypeReactComponents & KotlinDocsKrComponents> => ({
  pre: props => <PreTag {...props}>{props.children}<PreTagSpacer/></PreTag>,

  code: props => props.className ?
    <CodeBlock className={props.className}>{props.children}</CodeBlock> :
    <InlineCode {...props}/>,

  a: props => props.href!.startsWith("/") || props.href!.startsWith("#") ?
    <Link {...props} href={props.href!} className={`local-link ${props.className ?? ""}`}/> :
    <a {...props} className={props.href?.startsWith("https://kotlinlang.org/") ? "api-doc" : "external-link"}/>,

  blockquote: props => <BlockQuote {...props}/>,

  h1: props => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h1>{props.children}</h1></HeadingAnchor>,
  h2: props => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h2>{props.children}</h2></HeadingAnchor>,
  h3: props => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h3>{props.children}</h3></HeadingAnchor>,
  h4: props => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h4>{props.children}</h4></HeadingAnchor>,
  h5: props => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h5>{props.children}</h5></HeadingAnchor>,
  h6: props => <HeadingAnchor id={replaceSpaces(retrieveNodeText(props.children))}><h6>{props.children}</h6></HeadingAnchor>,

  // eslint-disable-next-line @next/next/no-img-element
  img: props => documentKey ? <ContentImage {...props} documentKey={documentKey}/> : <img alt={props.alt} src={props.src}/>,

  tabs: props => <TabHost {...props}>{props.children}</TabHost>,
  tab: props => <TabItem {...props}/>,
})

const ContentImage: React.FC<{ alt?: string, documentKey: string, src?: string }> = async (props) => {
  if (!props.src) return <></>

  const Source = await import(`$/docs/images/${props.documentKey}${props.src}`)
  if (typeof Source.default === "function") return <Source.default/>

  return <Image src={Source.default} alt={props.alt ?? ""} style={{ width: "100%", height: "auto", marginTop: 15 }} />
}

type ClientReactElement = Exclude<ReactNode, string | number | bigint | boolean | null | undefined | Iterable<ReactNode> | Promise<React.AwaitedReactNode>>
const retrieveNodeText = (node: React.ReactNode): string => {
  if (typeof node === "string") return node
  if (typeof node === "number") return `${node}`
  if (typeof node === "bigint") return ""
  if (typeof node === "boolean") return `${node}`

  if (!node) return ""

  if (typeof node !== "object") return ""

  if (node.hasOwnProperty(Symbol.iterator))
    return Array.from(node as Iterable<ReactNode>).map(retrieveNodeText).join('')

  return retrieveNodeText((node as ClientReactElement).props.children)
}

const replaceSpaces = (input: string): string => input.replaceAll(" ", "-")

