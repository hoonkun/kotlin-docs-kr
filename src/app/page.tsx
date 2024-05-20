import { HomeRoot } from "@/components/intro/_styled"

export default async function Home() {
  return (
    <HomeRoot>
      Hello, World!
    </HomeRoot>
  )
}

export const generateMetadata = async () => ({
  title: "Kotlin 문서 비공식 한국어 번역 프로젝트",
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" }
  }
})
