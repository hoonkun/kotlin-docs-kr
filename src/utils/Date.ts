export const formatLastModified = (_date: Date): string => {
  const [year, month, date] = _date.toLocaleDateString("ko-KR").split(".").map(it => it.trim())
  return `${year}년 ${month}월 ${date}일`
}