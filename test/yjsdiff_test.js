import assert, { deepStrictEqual } from "assert"
import * as Y from "yjs"
import {deepEquals, syncronize} from "../dist/y-pojo.js"

describe("syncronize", () => {
    
    it("Applies basic additions on Y.Map", () => {
        const target = {
            name: "two"
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        syncronize(root, target)
        
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

        syncronize(root, target)
        
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

        syncronize(root, first)
        syncronize(root, target)
        
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

        syncronize(root, target)
        let sv1 = Y.encodeStateVector(doc)

        syncronize(root, target)
        let sv2 = Y.encodeStateVector(doc)

        deepStrictEqual(sv1, sv2)

    })

    it ("detects added items to Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        syncronize(root, {
            val: ["a", "b", "c"]
        })

        syncronize(root, {
            val: ["b", "c"]
        })

        let arr = root.get("val")
        assert(arr.length == 2 && arr.get(0) == "b" && arr.get(1) == "c")
    })

    it ("detects deleted items to Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        syncronize(root, {
            val: ["a", "b", "c"]
        })

        syncronize(root, {
            val: ["d", "a", "b", "c"]
        })

        let arr = root.get("val")
        assert(arr.length == 4 && arr.get(0) == "d" && arr.get(1) == "a" && arr.get(2) == "b" && arr.get(3) == "c")
    })

    it ("detects changed items to Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        syncronize(root, {
            val: ["a", "b", "c"]
        })

        syncronize(root, {
            val: ["a", "x", "c"]
        })

        let arr = root.get("val")
        assert(arr.length == 3 && arr.get(0) == "a" && arr.get(1) == "x" && arr.get(2) == "c")
    })

    it ("detects changed items at end of Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        syncronize(root, {
            val: ["a", "b", "c"]
        })

        syncronize(root, {
            val: ["a", "b", "x"]
        })

        let arr = root.get("val")
        assert(arr.length == 3 && arr.get(0) == "a" && arr.get(1) == "b" && arr.get(2) == "x")
    })

    it ("detects added items at end of Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        syncronize(root, {
            val: ["a", "b", "c"]
        })

        syncronize(root, {
            val: ["a", "b", "c", "c"]
        })

        let arr = root.get("val")
        assert(arr.length == 4 && arr.get(0) == "a" && arr.get(1) == "b" && arr.get(2) == "c" && arr.get(3) == "c")
    })

    it("Does not change YJS doc when no changes in target", () => {
        const target = {
            inner: [1, 2, 3],
            second: 123
        }
        const doc = new Y.Doc()
        const root = doc.getMap("root")

        syncronize(root, target)
        let sv1 = Y.encodeStateVector(doc)

        syncronize(root, target)
        let sv2 = Y.encodeStateVector(doc)

        deepStrictEqual(sv1, sv2)

    })
})

describe("deepEquals", () => {
    it("returns true when Y.Map matches object", () => {
        const target = {
            "foo": "bar",
            "a": "b",
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")
        root.set("foo", "bar")
        root.set("a", "b")

        assert(deepEquals(root, target))
    })

    it("returns false when Y.Map does not match object", () => {
        const target = {
            "foo": "zoo",
            "a": "b",
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")
        root.set("foo", "bar")
        root.set("a", "b")

        assert(!deepEquals(root, target))
    })

    it("returns false when Y.Map missing key in target", () => {
        const target = {
            "foo": "bar",
            "a": "b",
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")
        root.set("foo", "bar")

        assert(!deepEquals(root, target))
    })

    it("returns false when target missing key in Y.Map", () => {
        const target = {
            "foo": "bar",
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")
        root.set("foo", "bar")
        root.set("a", "b")

        assert(!deepEquals(root, target))
    })

    it("returns false when target undefined", () => {
        const doc = new Y.Doc()
        const root = doc.getMap("root")
        root.set("foo", "bar")

        assert(!deepEquals(root, undefined))
    })

    it("returns false when Y.Map undefined", () => {
        assert(!deepEquals(undefined, {"foo": "bar"}))
    })

    it("returns true when Y.Array matches input array", () => {
        const target = ["a", "b", {"foo": "bar"}]

        const doc = new Y.Doc()
        const root = doc.getArray("root")

        const m = new Y.Map()
        m.set("foo", "bar")
        root.insert(0, ["a", "b", m])

        assert(deepEquals(root, target))
    })

    it("returns false when Y.Array does not match input array", () => {
        const target = ["a", {"foo": "bar"}]

        const doc = new Y.Doc()
        const root = doc.getArray("root")

        const m = new Y.Map()
        m.set("foo", "bar")
        root.insert(0, ["a", "b", m])

        assert(!deepEquals(root, target))
    })
})