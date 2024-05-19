import { Processor, unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import Link from "next/link"
import { CodeBlock, InlineCode, PreTag, PreTagSpacer } from "@/components/markdown/CodeBlock"
import { BlockQuote } from "@/components/markdown/BlockQuote"

import * as ProductionReact from "react/jsx-runtime"

const { jsx, jsxs, Fragment } = ProductionReact

export const BaseProcessor: () => Processor<any, any, any, any, string> = () => unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: true })
  .use(rehypeRaw)
  .use(rehypeStringify)

const retrieveNodeText = (node: any): string => {
  if (['string', 'number'].includes(typeof node)) return node
  if (node instanceof Array) return node.map(retrieveNodeText).join('')
  if (typeof node === 'object' && node) return retrieveNodeText(node.props.children)

  return ""
}

const replaceSpaces = (input: string): string => input.replaceAll(" ", "_")

export const GlobalMarkdownComponents = {
  pre: (props: any) => <PreTag {...props}>{props.children}<PreTagSpacer/></PreTag>,
  code: (props: any) => props.className ?
    <CodeBlock className={props.className}>{props.children}</CodeBlock> :
    <InlineCode {...props}/>,
  a: (props: any) => props.href.startsWith("/") ?
    <Link href={props.href} className={"local-link"}>{props.children}</Link> :
    <a {...props}
       className={props.href?.startsWith("https://kotlinlang.org/") ? "api-doc" : "external-link"}>{props.children}</a>,
  blockquote: (props: any) => <BlockQuote {...props}/>,
  h1: (props: any) => <h1 id={replaceSpaces(retrieveNodeText(props.children))}>{props.children}</h1>,
  h2: (props: any) => <h2 id={replaceSpaces(retrieveNodeText(props.children))}>{props.children}</h2>,
  h3: (props: any) => <h3 id={replaceSpaces(retrieveNodeText(props.children))}>{props.children}</h3>,
  h4: (props: any) => <h4 id={replaceSpaces(retrieveNodeText(props.children))}>{props.children}</h4>,
  h5: (props: any) => <h5 id={replaceSpaces(retrieveNodeText(props.children))}>{props.children}</h5>,
  h6: (props: any) => <h6 id={replaceSpaces(retrieveNodeText(props.children))}>{props.children}</h6>
}

export const GlobalRehypeReactOptions: any = { jsx, jsxs, Fragment }

