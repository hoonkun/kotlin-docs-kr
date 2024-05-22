import fs from "fs"

import {
  DevelopedBy,
  GetStartedButton,
  HeroImage,
  HeroImagePositioner,
  HomeArranger,
  HomeContent,
  HomeGlobalStyle,
  HomeReadMe,
  HomeReadMeHeading,
  HomeRoot,
  HomeSubtitle,
  HomeTitle,
  HomeTitleFooterDivider,
  HomeTitleFooterRow
} from "@/components/intro/_styled"

import JetbrainsLogo from "@/resources/jetbrains-logo.svg"
import KotlinHero from "@/resources/hero-cover.png"
import { MarkdownToReact } from "@/utils/MarkdownProcessor"

export default async function Home() {

  const readme = await MarkdownToReact(fs.readFileSync("./README.md", { encoding: "utf8" }))

  return (
    <HomeRoot>
      <HomeGlobalStyle/>
      <HomeArranger>
        <HomeContent>
          <HomeTitle>Kotlin</HomeTitle>
          <HomeSubtitle>간결하다. 멀티플랫폼. 재미있다.</HomeSubtitle>
          <HomeTitleFooterRow>
            <GetStartedButton href="/docs/getting-started.md">시작하기</GetStartedButton>
            <HomeTitleFooterDivider/>
            <JetbrainsLogo/>
            <DevelopedBy>Developed by <a>Jetbrains</a></DevelopedBy>
          </HomeTitleFooterRow>
        </HomeContent>
        <HomeReadMe>
          <HomeReadMeHeading>README.md</HomeReadMeHeading>
          {readme}
        </HomeReadMe>
        <HeroImagePositioner>
          <HeroImage alt={"Kotlin"} src={KotlinHero}/>
        </HeroImagePositioner>
      </HomeArranger>
    </HomeRoot>
  )
}

export const metadata= {
  title: "Kotlin 문서 비공식 한국어 번역 프로젝트",
  icons: {
    icon: { url: "/favicon.svg", type: "image/svg+xml" }
  }
}

export const viewport = {
  themeColor: "#19191C"
}
