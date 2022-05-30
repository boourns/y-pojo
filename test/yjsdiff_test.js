import assert, { deepStrictEqual, strictEqual } from "assert"
import * as Y from "yjs"
import {deepEquals, syncronize} from "../dist/y-pojo.js"

describe("syncronize", () => {
    
    it("Applies basic additions on Y.Map", () => {
        const target = {
            name: "two"
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        const changed = syncronize(root, target)
        
        assert(root.get("name") == "two")
        assert(changed)
    })

    it("Applies nested patches on Y.Map", () => {
        const target = {
            inner: {
                foo: "bar"
            }
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        const changed = syncronize(root, target)
        assert(changed)

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

        let changed = syncronize(root, first)
        assert(changed)

        changed = syncronize(root, target)
        assert(changed)

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

        let changed = syncronize(root, target)
        let sv1 = Y.encodeStateVector(doc)
        assert(changed)

        changed = syncronize(root, target)
        let sv2 = Y.encodeStateVector(doc)
        assert(!changed)

        deepStrictEqual(sv1, sv2)

    })

    it ("syncronizes deleted items to Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        let changed = syncronize(root, {
            val: ["a", "b", "c"]
        })
        assert(changed)

        changed = syncronize(root, {
            val: ["b", "c"]
        })
        assert(changed)

        let arr = root.get("val")
        assert(arr.length == 2 && arr.get(0) == "b" && arr.get(1) == "c")
    })

    it ("syncronizes added items to Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        let changed = syncronize(root, {
            val: ["a", "b", "c"]
        })
        assert(changed)

        changed = syncronize(root, {
            val: ["d", "a", "b", "c"]
        })
        assert(changed)

        let arr = root.get("val")
        assert(arr.length == 4 && arr.get(0) == "d" && arr.get(1) == "a" && arr.get(2) == "b" && arr.get(3) == "c")
    })

    it ("detects changed items to Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        let changed = syncronize(root, {
            val: ["a", "b", "c"]
        })
        assert(changed)

        changed = syncronize(root, {
            val: ["a", "x", "c"]
        })
        assert(changed)

        let arr = root.get("val")
        assert(arr.length == 3 && arr.get(0) == "a" && arr.get(1) == "x" && arr.get(2) == "c")
    })

    it ("detects changed items at end of Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        let changed = syncronize(root, {
            val: ["a", "b", "c"]
        })
        assert(changed)

        changed = syncronize(root, {
            val: ["a", "b", "x"]
        })
        assert(changed)

        let arr = root.get("val")
        assert(arr.length == 3 && arr.get(0) == "a" && arr.get(1) == "b" && arr.get(2) == "x")
    })

    it ("detects added items at end of Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        let changed = syncronize(root, {
            val: ["a", "b", "c"]
        })
        assert(changed)

        changed = syncronize(root, {
            val: ["a", "b", "c", "c"]
        })
        assert(changed)

        let arr = root.get("val")
        assert(arr.length == 4 && arr.get(0) == "a" && arr.get(1) == "b" && arr.get(2) == "c" && arr.get(3) == "c")
    })

    it ("detects removed complex items at end of Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        let changed = syncronize(root, {
            clips: [
                { length: 96, notes: [], id: "fuxgvenru" },
                { length: 96, notes: [], id: "znrwtur" },
                { length: 96, notes: [], id: "znrwtur" }
            ]
        })
        assert(changed)

        changed = syncronize(root, {
            clips: [
                { length: 96, notes: [], id: "fuxgvenru" },
                { length: 96, notes: [], id: "znrwtur" },
            ]
        })
        assert(changed)

        let arr = root.get("clips")
        assert(arr.length == 2)
    })

    it ("does not append extra copies of complex items at end of Y.Array",  () => {
        const target = {
            val: ["a", "b", "c"]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        let changed = syncronize(root, {
            clips: [
                { length: 96, notes: [], id: "fuxgvenru" },
                { length: 96, notes: [], id: "znrwtur" },
            ]
        })
        let arr = root.get("clips")
        assert(arr.length == 2)
        assert(changed)

        changed = syncronize(root, {
            clips: [
                { length: 96, notes: [], id: "fuxgvenru" },
                { length: 96, notes: [], id: "znrwtur" },
            ]
        })
        assert(!changed)

        arr = root.get("clips")
        assert(arr.length == 2)
    })

    it("Does not change YJS doc when no changes in target", () => {
        const target = {
            inner: [1, 2, 3],
            second: 123
        }
        const doc = new Y.Doc()
        const root = doc.getMap("root")

        let changed = syncronize(root, target)
        let sv1 = Y.encodeStateVector(doc)
        assert(changed)

        changed = syncronize(root, target)
        let sv2 = Y.encodeStateVector(doc)
        assert(!changed)

        deepStrictEqual(sv1, sv2)

    })

    it("Does not recreate complex nested object when a child has changed", () => {
        const target = {
            inner: [
                {
                    "name": "tom",
                    "count": 52
                },
                {
                    "name": "jerry",
                    "count": 43
                }
            ]
        }

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        let changed = syncronize(root, target)
        assert(changed)

        let el = root.get("inner").get(0)

        changed = syncronize(root, {
            inner: [
                {
                    "name": "tom",
                    "count": 590
                },
                {
                    "name": "jerry",
                    "count": 43
                }
            ]
        })
        assert(changed)

        assert(el.get("count") == 590)
    })

    it("Works even when managed class name changes", () => {
        class Blah extends Y.Map {}

        const target = {
            inner: [1, 2, 3],
            second: 123
        }
        const doc = new Y.Doc()

        const root = doc.get("root", Blah)

        let changed = syncronize(root, target)
        let sv1 = Y.encodeStateVector(doc)
        assert(changed)

        changed = syncronize(root, target)
        let sv2 = Y.encodeStateVector(doc)
        assert(!changed)

        deepStrictEqual(sv1, sv2)
    })

    it("does not remove last item from long complex arrays", () => {
        const start =  {"clips":[{"length":96,"notes":[],"id":"cacsslnhq"},{"length":96,"notes":[{"tick":6,"number":58,"duration":6,"velocity":100},{"tick":12,"number":58,"duration":6,"velocity":100},{"tick":18,"number":58,"duration":6,"velocity":100},{"tick":24,"number":58,"duration":6,"velocity":100},{"tick":30,"number":58,"duration":6,"velocity":100},{"tick":36,"number":59,"duration":6,"velocity":100},{"tick":42,"number":55,"duration":6,"velocity":100},{"tick":42,"number":58,"duration":6,"velocity":100},{"tick":48,"number":53,"duration":6,"velocity":100},{"tick":48,"number":59,"duration":6,"velocity":100}],"id":"poutonrzg"}]}
        const target = {"clips":[{"length":96,"notes":[],"id":"cacsslnhq"},{"length":96,"notes":[{"tick":12,"number":58,"duration":6,"velocity":100},{"tick":18,"number":58,"duration":6,"velocity":100},{"tick":24,"number":58,"duration":6,"velocity":100},{"tick":30,"number":58,"duration":6,"velocity":100},{"tick":36,"number":59,"duration":6,"velocity":100},{"tick":42,"number":55,"duration":6,"velocity":100},{"tick":42,"number":58,"duration":6,"velocity":100},{"tick":48,"number":53,"duration":6,"velocity":100},{"tick":48,"number":59,"duration":6,"velocity":100}],"id":"poutonrzg"}]}

        const doc = new Y.Doc()
        const root = doc.getMap("root")

        syncronize(root, start)
        deepStrictEqual(root.toJSON(), start)

        syncronize(root, target)

        const result = root.toJSON()

        deepStrictEqual(result, target)
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