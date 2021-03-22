import { Action } from 'redux'

export const SET_CURRENT_REVIEWER = 'scremsong/reviewers/SET_CURRENT_REVIEWER'

export enum ESocialPlatformChoice {
  TWITTER = 'SocialPlatformChoice.TWITTER',
}

export enum ESocialAssignmentState {
  PENDING = 'Pending',
  CLOSED = 'Closed',
}

export enum ESocialAssignmentCloseReason {
  AWAITING_REPLY = 'Awaiting Reply',
  MAP_UPDATED = 'Map Updated',
  NO_CHANGE_REQUIRED = 'No Change Required',
  NOT_RELEVANT = 'Not Relevant',
  NOT_ACTIONED = 'Not Actioned',
}

export interface IReviewerAssignmentThreadRelationships {
  [key: string]: string
}

export interface IReviewerAssignmentCounts {
  [key: string]: number
}
export interface IActionReviewersSetCurrentReviewer extends Action<typeof SET_CURRENT_REVIEWER> {
  reviewerId: number
}

export interface IReviewerAssignment {
  id: number
  platform: ESocialPlatformChoice
  social_id: string
  state: ESocialAssignmentState
  close_reason: ESocialAssignmentCloseReason | null
  user_id: number
  thread_relationships: IReviewerAssignmentThreadRelationships[]
  thread_tweets: string[]
  created_on: string // datetime
  last_updated_on: string // datetime
  last_read_on: string | null // datetime
}

export interface IReviewerUser {
  id: number
  initials: string
  is_active: boolean
  profile_image_url: string
  is_accepting_assignments: boolean
  name: string
  username: string
}
