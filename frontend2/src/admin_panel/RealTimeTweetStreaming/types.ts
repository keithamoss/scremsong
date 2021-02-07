export interface ICeleryTaskList {
  [key: string]: ICeleryTaskInfo[]
}

export interface ICeleryTasks {
  running: ICeleryTaskList
  scheduled: ICeleryTaskList
  reserved: ICeleryTaskList
}

export interface ICeleryTaskInfo {
  id: string
  name: string
  args: string // JSON e.g. "['1086116522517557248']"
  kwargs: string // JSON e.g. "{}"
  type: string
  hostname: string
  time_start: number
  acknowledged: boolean
  delivery_info: {
    exchange: string
    routing_key: string
    priority: number
    redelivered: boolean
  }
  worker_pid: number
}
