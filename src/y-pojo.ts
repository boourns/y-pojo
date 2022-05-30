import * as Y from "yjs";

type managedType = Y.Map<any> | Y.Array<any> | string | number
type supportedType = object | string | number

export function deepEquals(managed: managedType, target: supportedType | supportedType[]): boolean {
    const managedType = detectManagedType(managed)
   
    try {
        var targetType = target.constructor.name
    } catch (e) {
        targetType = "undefined"
    }

    if (managedType == "YArray" && targetType == "Array") {
        const targetArray = (target as Array<any>)
        const managedArray = (managed as Y.Array<any>)

        const result = managedArray.length == targetArray.length && targetArray.every((t, i) => deepEquals(managedArray.get(i), targetArray[i]))
        return result
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
	): boolean {

    let changed = false

    const managedType = detectManagedType(managedObj)

    switch (managedType) {
        case "YArray":
            if (!Array.isArray(targetObj)) {
                throw new Error(`Sync failed, ${targetObj} was not array`)
            }

            const managedArray = managedObj as Y.Array<any>
            const targetArray = targetObj as any[]
            const outOfRange = Symbol()

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
                            changed = true
                            managedArray.delete(x)
                        }
                        const deletedCount = j - cursor
                        cursor = j+1 - deletedCount
                        match = true
                    }
                }
                if (!match) {  
                    try {
                        var childType = targetValue.constructor.name
                    } catch (e) {
                        childType = "undefined"
                    }
                    const managedChild = (cursor < managedArray.length) ? managedArray.get(cursor) : "undefined"
                    const managedType = detectManagedType(managedChild)

                    // but if they're compatible types we should go deeper
                    // there was no exact match in the list, so assume the immediately next object should be the match
                    if ((managedType == "YMap" && childType == "Object") ||
                     (managedType == "YArray" && childType == "Array")) {
                        syncronize(managedChild, targetValue)
                     } else {
                        managedArray.insert(cursor, [syncChild(targetValue)])
                    }

                    cursor++
                    changed = true
                }
            }
            for (let i = targetArray.length; i < managedArray.length; i++) {
                changed = true
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
                    changed = true
                    continue
                }
                const managedChild = managedMap.get(key)
                const targetChild = targetMap[key]

                const managedType = detectManagedType(managedChild)

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
                        changed = true
                } else if (managedType == "YMap" || managedType == "YArray") {
                    // they match in types, so go deeper
                    changed ||= syncronize(managedChild, targetChild)
                } else {
                    // they are not complex types so just assign it into the map
                    if (managedChild !== targetChild) {
                        managedMap.set(key, targetChild)
                        changed = true
                    }
                }
            }

            for (const key in targetMap) {
                if (!managedMap.has(key)) {
                    const child = syncChild(targetMap[key])

                    managedMap.set(key, child)
                    changed = true
                }
            }
            break
        default:
            throw new Error(`can only iterate over Y.Map and Y.Array, got ${managedObj}`)
    }
    return changed
}

function syncChild(child: any): any {
    try {
        var childType = child.constructor.name
    } catch (e) {
        childType = "undefined"
    }

    if (childType == "Array") {
        const arr = new Y.Array()

        syncronize(arr,child)
        return arr
    } else if (childType == "Object") {
        const map = new Y.Map()

        syncronize(map, child)
        return map
    } else {
        return child
    }
}

function detectManagedType(managed: any): string {
    try {
        if (managed.length !== undefined && managed.get !== undefined) {
            return "YArray"
        } else if (managed.keys !== undefined && managed.get !== undefined) {
            return "YMap"
        } else {
            return managed.constructor.name
        }
    } catch (e) {
        return "undefined"
    }
}