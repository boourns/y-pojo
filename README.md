y-pojo

Syncronize a YJS document to/from a plain old javascript object

This library enables multiple users to share state in the form of a Plain ol' Javascript object (POJO), by mapping changes on the POJO into a Y.Map, and mapping Y.Map changes back into a new copy of the POJO (via `yMap.toJSON`).

It contains two methods, `syncronize` and `deepEquals`.  Call syncronize(yMap, pojo) to compare the current state of a YJS map to the state of the POJO, and apply the required changes to the YJS map to make it equal to the same value as the pojo.  It assumes your network layer is registered with the YJS document to capture and communicate these updates to the other users.

When a remote user has updated the YJS document, simple call `yMap.toJSON()` to get the new copy of the POJO on the other clients.


