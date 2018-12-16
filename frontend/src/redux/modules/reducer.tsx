import { routerReducer } from "react-router-redux"
import * as Redux from "redux"
import { reducer as formReducer } from "redux-form"
import { default as app, IModule as IAppModule } from "./app"
import { default as reviewers, IModule as IReviewersModule } from "./reviewers"
import { default as social, IModule as ISocialModule } from "./social"
import { default as triage, IModule as ITriageModule } from "./triage"
import { default as user, IModule as IUserModule } from "./user"

// const formReducer: any = form // Silencing TypeScript errors due to older @types/redux-form package

export interface IStore {
    app: IAppModule
    social: ISocialModule
    triage: ITriageModule
    reviewers: IReviewersModule
    user: IUserModule
    form: any
}

const rootReducer: Redux.Reducer<IStore> = Redux.combineReducers<IStore>({
    app,
    social,
    triage,
    reviewers,
    user,
    routing: routerReducer,
    form: formReducer.plugin({}),
} as any)

export default rootReducer
