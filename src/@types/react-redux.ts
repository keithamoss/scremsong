// https://github.com/zalmoxisus/redux-devtools-extension/pull/493
// This is a temporary fix for redux-devtools-extension#492
import * as redux from "redux"
declare module "redux" {
    export type GenericStoreEnhancer = redux.StoreEnhancer
}
