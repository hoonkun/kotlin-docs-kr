import { MetadataRoute } from "next"
import ExceptionalDocuments from "@/../docs/exceptions.json"
import Documents from "$/docs/registry.json"
import { flatDocumentation } from "@/utils/Documentation"
import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const base = `https://kdocs-kr.hoonkun.kiwi`

export default function sitemap(): MetadataRoute.Sitemap {

  const documents: MetadataRoute.Sitemap = flatDocumentation([...Documents, ...ExceptionalDocuments])
    .filter(it => !!it.href)
    .filter(it => fs.existsSync(path.join("docs", it.href!)))
    .map(it => ({
      url: `${base}/docs/${it.href}`,
      lastModified: new Date(execSync(`git log -1 --pretty="format:%ci" ./docs/${it.href}`).toString().trim())
    }))

  const rootChangedAt = documents.map(it => it.lastModified).sort().reverse()[0]

  return [
    { url: `${base}/`, lastModified: rootChangedAt },
    { url: `${base}/docs/home`, lastModified: rootChangedAt },
    ...documents
  ]
}
