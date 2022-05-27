import * as Y from "yjs";

type managedType = Y.Map<any> | Y.Array<any> | string | number
type supportedType = object | string | number

export function deepEquals(managed: managedType, target: supportedType | supportedType[]): boolean {
    try {
        var managedType = managed.constructor.name
    } catch (e) {
        managedType = "undefined"
    }

    try {
        var targetType = target.constructor.name
    } catch (e) {
        targetType = "undefined"
    }

    if (managedType == "YArray" && targetType == "Array") {
        const targetArray = (target as Array<any>)
        const managedArray = (managed as Y.Array<any>)
        return managedArray.length == targetArray.length && targetArray.every((t, i) => deepEquals(managedArray.get(i), targetArray[i]))
    } else if (managedType == "YMap" && targetType == "Object") {
        const targetMap = (target as Record<string, any>)
        const managedMap = (managed as Y.Map<any>)
        let targetKeyCount = 0
        for (let targetKey in targetMap) {
            targetKeyCount++
            if (!deepEquals(managedMap.get(targetKey), targetMap[targetKey])) {
                return false
            }
        }
        return targetKeyCount == Array.from(managedMap.keys()).length
    } else {
        return target === managed
    }
}

export function syncronize(
	managedObj: Y.Map<any> | Y.Array<any>,
	targetObj: Record<string, any> | any[],
	) {

    switch (managedObj.constructor.name) {
        case "YArray":
            let defer: (() => void)[] = []

            if (!Array.isArray(targetObj)) {
                throw new Error(`Sync failed, ${targetObj} was not array`)
            }

            const managedArray = managedObj as Y.Array<any>
            const targetArray = targetObj as any[]
            const outOfRange = Symbol()

            // iterate through existing array, and find the new array position for the existing elements.
            let targetPositions: Map<number, number> = new Map()
            let sourcePositions: Map<number, number> = new Map()

            let cursor = 0
            for (let i = 0; i < targetArray.length; i++) {
                let match = false
                const targetValue = targetArray[i]
                const len = (managedArray.length > targetArray.length) ?  managedArray.length : targetArray.length
                for (let j = cursor; !match && j < len; j++) {
                    const managedValue = (j < managedArray.length) ? managedArray.get(j) : outOfRange
                    const targetValue = (i < targetArray.length) ? targetArray[i] : outOfRange

                    if (deepEquals(managedValue, targetValue)) {
                        for (let x = j-1; x >= cursor; x--) {
                            managedArray.delete(x)
                        }

                        cursor = j+1
                        match = true
                    }
                }
                if (!match) {
                    managedArray.insert(cursor, [targetValue])
                    cursor++
                }
            }
            for (let i = targetArray.length; i < managedArray.length; i++) {
                managedArray.delete(i)
            }

            break
        case "YMap":
            if (targetObj.constructor.name !== "Object") {
                throw new Error(`Sync failed, ${targetObj} was not object`)
            }

            const managedMap = managedObj as Y.Map<any>
            const targetMap = targetObj as Record<string, any>

            for (const key of managedMap.keys()) {
                if (!(key in targetObj)) {
                    // item's been removed from target
                    managedMap.delete(key)
                    continue
                }
                const managedChild = managedMap.get(key)
                const targetChild = targetMap[key]

                const managedType = (managedChild !== "undefined") ? managedChild.constructor.name : "undefined"

                try {
                    var childType = targetChild.constructor.name
                } catch (e) {
                    childType = "undefined"
                }

                if ((managedType == "YMap" && childType !== "Object") ||
                    (managedType == "YArray" && childType !== "Array") || 
                    (!["YMap", "YArray"].includes(managedType) && managedType !== childType)) {
                        // this item has fundamentally changed, delete the existing record and recreate it in second pass
                        managedMap.delete(key)
                } else if (managedType == "YMap" || managedType == "YArray") {
                    // they match in types, so go deeper
                    syncronize(managedChild, targetChild)
                } else {
                    // they are not complex types so just assign it into the map
                    if (managedChild !== targetChild) {
                        managedMap.set(key, targetChild)
                    }
                }
            }

            for (const key in targetMap) {
                if (!managedMap.has(key)) {
                    const child = targetMap[key]
                    try {
                        var childType = child.constructor.name
                    } catch (e) {
                        childType = "undefined"
                    }

                    if (childType == "Array") {
                        const arr = new Y.Array()

                        managedMap.set(key, arr)
                        syncronize(arr,child)
                    } else if (childType == "Object") {
                        const map = new Y.Map()

                        managedMap.set(key, map)
                        syncronize(map, child)
                    } else {
                        managedMap.set(key, child)
                    }
                }
            }
            break
        default:
            throw new Error(`can only iterate over Y.Map and Y.Array, got ${managedObj}`)
    }
}