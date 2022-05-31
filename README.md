# y-pojo

Syncronize a YJS document to/from a plain old javascript object

This library enables multiple users to share state in the form of a Plain ol' Javascript object (POJO), by mapping changes on the POJO into a Y.Map, and mapping Y.Map changes back into a new copy of the POJO (via `yMap.toJSON`).

It supports regular, simple, javascript objects (called a `Record` in Typescript).  It supports objects, arrays, and other simple types that can be JSON marshalled. 

It contains two methods, `syncronize` and `deepEquals`.  Call `syncronize(yMap, pojo)` to compare the current state of a YJS map to the state of the POJO, and apply the required changes to the YJS map to make it equal to the same value as the pojo.  It assumes your network layer is registered with the YJS document to capture and communicate these updates to the other users.

When a remote user has updated the YJS document, simple call `yMap.toJSON()` to get the new copy of the POJO on the other clients.

# Example

```javascript
import {syncronize} from "y-pojo"
import * as Y from 'yjs'

let doc1 = new Y.Doc()
let root = doc1.getMap("r")
let targetObject = {
   name: "Tom",
   count: 42,
   pets: [{"name": "Jerry"}, {"name": "Bob"}]
}
syncronize(root, targetObject)
console.log(JSON.stringify(root.toJSON())) // {"name":"Tom","count":42,"pets":[{"name":"Jerry"},{"name":"Bob"}]}

let updatedTargetObject = {
   name: "Tom",
   count: 42,
   pets: [{"name": "Jerry"}, {"name": "Bob"},  {"name": "Carol"}]
}

syncronize(root, updatedTargetObject)
console.log(JSON.stringify(root.toJSON())) // {"name":"Tom","count":42,"pets":[{"name":"Jerry"},{"name":"Bob"},{"name":"Carol"}]}
```

# Limitations
-  It won't work with Regex, or Date, or other classes.
-  strings within the javascript object are not represented as Y.Text and deep compared - they are static strings that get replaced when edited.  So it would be better to use Y.Text directly for text document editing.
-  
