import React from "react"
import type { Metadata } from "next"
import localFont from "next/font/local"
import "./globals.css"
import StyledComponentsRegistry from "@/libs/styled-components/styled-components-registry"
import { AppGlobalHeader } from "@/components/AppGlobalHeader"

const Pretendard = localFont({
  src: [
    { path: "./../resources/fonts/Pretendard-Black.woff2", weight: "900" },
    { path: "./../resources/fonts/Pretendard-ExtraBold.woff2", weight: "800" },
    { path: "./../resources/fonts/Pretendard-Bold.woff2", weight: "700" },
    { path: "./../resources/fonts/Pretendard-SemiBold.woff2", weight: "600" },
    { path: "./../resources/fonts/Pretendard-Medium.woff2", weight: "500" },
    { path: "./../resources/fonts/Pretendard-Regular.woff2", weight: "400" },
    { path: "./../resources/fonts/Pretendard-Light.woff2", weight: "300" },
    { path: "./../resources/fonts/Pretendard-ExtraLight.woff2", weight: "200" },
    { path: "./../resources/fonts/Pretendard-Thin.woff2", weight: "100" },
  ],
  display: "swap"
})

export const metadata: Metadata = {
  title: "Kotlin 문서",
  description: "Kotlin 문서 비공식 번역",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
    <body className={`${Pretendard.className} initial-loading`}>
    <StyledComponentsRegistry>
      <AppGlobalHeader/>
      {children}
    </StyledComponentsRegistry>
    </body>
    </html>
  )
}
