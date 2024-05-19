import {DocumentData} from "@/app/docs/[document_key]/page";

export const findDocumentation = (
    item: DocumentData,
    key: string,
    parents: DocumentData[] = []
): [DocumentData, DocumentData[]] | null => {
    if (item.href === key) return [item, [...parents, item]]
    if (item.children) {
        for (const child of item.children) {
            const found = findDocumentation(child, key, [...parents, item])
            if (found) return found
        }
    }

    return null
}
