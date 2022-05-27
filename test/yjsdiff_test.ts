import assert, { deepStrictEqual } from "assert"
import * as Y from "yjs"
import yjsdiff from "../../src/session/plugin/yjsdiff"

describe("yjsdiff", () => {
    
    it("Applies basic additions on Y.Map", () => {
        const target = {
            name: "two"
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        yjsdiff(root, target)
        
        assert(root.get("name") == "two")
    })

    it("Applies nested patches on Y.Map", () => {
        const target = {
            inner: {
                foo: "bar"
            }
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        yjsdiff(root, target)
        
        // @ts-ignore
        assert(root.get("inner").get("foo") == "bar")
    })

    it("Detects removed keys on Y.Map", () => {
        const first = {
            inner: {
                foo: "bar"
            },
            second: 123
        }
        const target = {
            second: 123
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        yjsdiff(root, first)
        yjsdiff(root, target)
        
        // @ts-ignore
        assert(!root.has("inner"))
        assert(root.has("second"))
        assert(root.get("second") == 123)
    })

    it("Does not change YJS doc when no changes in target", () => {
        const target = {
            inner: {
                foo: "bar"
            },
            second: 123
        }
        const doc = new Y.Doc()
        const root = doc.getMap("root")

        yjsdiff(root, target)
        let sv1 = Y.encodeStateVector(doc)

        yjsdiff(root, target)
        let sv2 = Y.encodeStateVector(doc)

        deepStrictEqual(sv1, sv2)

    })

    it ("detects added items to Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        yjsdiff(root, {
            val: ["a", "b", "c"]
        })

        yjsdiff(root, {
            val: ["b", "c"]
        })

        let arr = root.get("val") as Y.Array<string>
        assert(arr.length == 2 && arr.get(0) == "b" && arr.get(1) == "c")
    })

    it ("detects deleted items to Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        yjsdiff(root, {
            val: ["a", "b", "c"]
        })

        yjsdiff(root, {
            val: ["d", "a", "b", "c"]
        })

        let arr = root.get("val") as Y.Array<string>
        assert(arr.length == 4 && arr.get(0) == "d" && arr.get(1) == "a" && arr.get(2) == "b" && arr.get(3) == "c")
    })

    it ("detects changed items to Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        yjsdiff(root, {
            val: ["a", "b", "c"]
        })

        yjsdiff(root, {
            val: ["a", "x", "c"]
        })

        let arr = root.get("val") as Y.Array<string>
        assert(arr.length == 3 && arr.get(0) == "a" && arr.get(1) == "x" && arr.get(2) == "c")
    })

    it ("detects changed items at end of Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        yjsdiff(root, {
            val: ["a", "b", "c"]
        })

        yjsdiff(root, {
            val: ["a", "b", "x"]
        })

        let arr = root.get("val") as Y.Array<string>
        assert(arr.length == 3 && arr.get(0) == "a" && arr.get(1) == "b" && arr.get(2) == "x")
    })

    it ("detects added items at end of Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        yjsdiff(root, {
            val: ["a", "b", "c"]
        })

        yjsdiff(root, {
            val: ["a", "b", "c", "c"]
        })

        let arr = root.get("val") as Y.Array<string>
        assert(arr.length == 4 && arr.get(0) == "a" && arr.get(1) == "b" && arr.get(2) == "c" && arr.get(3) == "c")
    })

    it("Does not change YJS doc when no changes in target", () => {
        const target = {
            inner: [1, 2, 3],
            second: 123
        }
        const doc = new Y.Doc()
        const root = doc.getMap("root")

        yjsdiff(root, target)
        let sv1 = Y.encodeStateVector(doc)

        yjsdiff(root, target)
        let sv2 = Y.encodeStateVector(doc)

        deepStrictEqual(sv1, sv2)

    })
})