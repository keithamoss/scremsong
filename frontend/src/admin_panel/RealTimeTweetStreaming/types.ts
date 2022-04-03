export interface ITaskList {
  [key: string]: ITaskInfo[]
}

export interface ITaskQueueInfo {
  high: ITaskList
  low: ITaskList
  default: ITaskList
}

export interface ITaskInfo {
  id: string
  name: string
  queue: string
}
