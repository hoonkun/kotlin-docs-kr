import { DocumentData } from "@/app/docs/[document_key]/page"

export const findDocumentation = (
  from: DocumentData | DocumentData[],
  key: string,
  parents: DocumentData[] = []
): [DocumentData, DocumentData[]] | null => {
  from = Array.isArray(from) ? { title: "_unused_", children: from, enabled: true } : from

  if (from.href === key) return [from, [...parents, from]]
  if (from.children) {
    for (const child of from.children) {
      const found = findDocumentation(child, key, [...parents, from])
      if (found) return found
    }
  }

  return null
}

export const flatDocumentation = (root: DocumentData[]): DocumentData[] => {
  const result: DocumentData[] = []
  for (const item of root) {
    if (item.children)
      result.push(...flatDocumentation(item.children))
    else
      result.push(item)
  }
  return result
}

export const titleOf = (from: DocumentData) => from.page_title ?? from.title
