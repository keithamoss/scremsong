import { responsiveDrawer } from "material-ui-responsive-drawer"
import { routerReducer } from "react-router-redux"
import * as Redux from "redux"
import { reducer as formReducer } from "redux-form"
import { responsiveStateReducer } from "redux-responsive"
import { default as app, IModule as IAppModule } from "./app"
import { default as user, IModule as IUserModule } from "./user"

// const formReducer: any = form // Silencing TypeScript errors due to older @types/redux-form package

export interface IStore {
    app: IAppModule
    user: IUserModule
    form: any
    browser: any
    responsiveDrawer: any
}

const rootReducer: Redux.Reducer<IStore> = Redux.combineReducers<IStore>({
    app,
    user,
    routing: routerReducer,
    form: formReducer.plugin({}),
    browser: responsiveStateReducer,
    responsiveDrawer,
} as any)

export default rootReducer
