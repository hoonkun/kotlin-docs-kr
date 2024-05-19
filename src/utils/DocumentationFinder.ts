import {NavigationItemData} from "@/app/docs/[topic]/page";

export const findDocumentation = (
    item: NavigationItemData,
    key: string,
    parents: NavigationItemData[] = []
): [NavigationItemData, NavigationItemData[]] | null => {
    if (item.href === key) return [item, [...parents, item]]
    if (item.children) {
        for (const child of item.children) {
            const found = findDocumentation(child, key, [...parents, item])
            if (found) return found
        }
    }

    return null
}
