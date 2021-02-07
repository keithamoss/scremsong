export interface IResourceRateLimit {
  limit: number
  remaining: number
  reset: number
}

export interface IRateLimitResourcesSet {
  [key: string]: IResourceRateLimit
}

export interface IRateLimitResources {
  [key: string]: IRateLimitResourcesSet
}
