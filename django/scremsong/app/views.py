import glob
import os
from copy import deepcopy
from time import sleep

import tweepy
from django.contrib.auth import logout
from django.contrib.auth.models import User
from django.db import transaction
from django.http import HttpResponseNotFound
from django.http.response import HttpResponse, HttpResponseRedirect
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAdminUser, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from scremsong.app import websockets
from scremsong.app.enums import (NotificationVariants, ProfileOfflineReason,
                                 SocialAssignmentCloseReason,
                                 SocialAssignmentState, SocialPlatformChoice,
                                 TweetState, TweetStatus)
from scremsong.app.exceptions import ScremsongException
from scremsong.app.models import (Profile, SocialAssignments, SocialColumns,
                                  SocialPlatforms, Tweets,
                                  TwitterRateLimitInfo)
from scremsong.app.reviewers import getCreationDateOfNewestTweetInAssignment
from scremsong.app.serializers import (
    SocialAssignmentSerializer,
    SocialColumnsSerializerWithTweetCountSerializer, UserSerializer)
from scremsong.app.social.assignments import \
    get_social_assignment_stats_for_user
from scremsong.app.social.columns import (get_social_columns,
                                          get_stats_for_column)
from scremsong.app.twitter import (favourite_tweet, fetch_tweets,
                                   get_latest_tweet_id_for_streaming,
                                   get_status_from_db, get_tweepy_api_auth,
                                   get_twitter_app, notify_of_saved_tweet,
                                   reply_to_tweet, resolve_tweet_parents,
                                   resolve_tweet_thread_for_parent,
                                   retweet_tweet,
                                   set_tweet_object_state_en_masse,
                                   twitter_user_api_auth_stage_1,
                                   twitter_user_api_auth_stage_2,
                                   unfavourite_tweet, unretweet_tweet)
from scremsong.rq.jobs import (task_cancel_and_restart_tweet_streaming,
                               task_collect_twitter_rate_limit_info,
                               task_fill_missing_tweets)
from scremsong.rq.rq_utils import (get_queued_tasks, get_redis_connection,
                                   get_started_tasks)
from scremsong.util import get_or_none, make_logger
from tweepy import TweepyException

logger = make_logger(__name__)


def api_not_found(request):
    return HttpResponseNotFound()


class CurrentUserView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        if request.user.is_authenticated:
            serializer = UserSerializer(
                request.user, context={'request': request}
            )

            return Response({
                "is_logged_in": True,
                "user": serializer.data
            })
        else:
            return Response({
                "is_logged_in": False,
                "user": None
            })


class LogoutUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        logout(request)
        return Response({})


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    permission_classes = (IsAdminUser,)
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer


class ProfileViewSet(viewsets.ViewSet):
    """
    API endpoint that allows user profiles to be viewed and edited.
    """
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['post'])
    def update_settings(self, request):
        with transaction.atomic():
            user = User.objects.select_for_update().get(id=request.user.id)
            user.profile.merge_settings(request.data)
            user.profile.save()
            return Response({"settings": user.profile.settings})

    @action(detail=False, methods=['get'])
    def get_column_position(self, request, format=None):
        qp = request.query_params
        columnId = str(qp["id"]) if "id" in qp else None

        if "column_positions" in request.user.profile.settings and columnId in request.user.profile.settings["column_positions"]:
            return Response({"position": request.user.profile.settings["column_positions"][columnId]})
        else:
            return Response({"position": None})


class TweetsViewset(viewsets.ViewSet):
    """
    API endpoint that deals with tweets.
    """
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['get'])
    def fetch(self, request, format=None):
        qp = request.query_params

        sinceId = qp["sinceId"] if "sinceId" in qp else None
        sinceId = qp["sinceId"] if "sinceId" in qp else None
        maxId = qp["maxId"] if "maxId" in qp else None
        startIndex = qp["startIndex"] if "startIndex" in qp else None
        stopIndex = qp["stopIndex"] if "stopIndex" in qp else None
        # Allow for limiting our response to specific columns
        columnIds = qp["columns"].split(",") if "columns" in qp and qp["columns"] != "" else []

        if sinceId is None and (startIndex is None or stopIndex is None):
            return Response({"error": "Missing 'startIndex' or 'stopIndex'."}, status=status.HTTP_400_BAD_REQUEST)

        return Response(fetch_tweets(startIndex, stopIndex, sinceId, maxId, columnIds))

    @action(detail=False, methods=['get'])
    def set_state(self, request, format=None):
        qp = request.query_params
        tweetId = qp["tweetId"] if "tweetId" in qp else None
        tweetState = qp["tweetState"] if "tweetState" in qp else None

        if TweetState.has_value(tweetState):
            tweet = Tweets.objects.get(tweet_id=tweetId)
            tweet.state = tweetState
            tweet.save()

            websockets.send_channel_message("tweets.set_state", {
                "tweetStates": [{
                    "tweetId": tweetId,
                    "tweetState": tweetState,
                }]
            })

        return Response({})

    @action(detail=False, methods=['get'])
    def favourite(self, request, format=None):
        qp = request.query_params
        tweetId = qp["tweetId"] if "tweetId" in qp else None

        favourite_tweet(tweetId)

        return Response({})

    @action(detail=False, methods=['get'])
    def unfavourite(self, request, format=None):
        qp = request.query_params
        tweetId = qp["tweetId"] if "tweetId" in qp else None

        unfavourite_tweet(tweetId)

        return Response({})

    @action(detail=False, methods=['get'])
    def retweet(self, request, format=None):
        qp = request.query_params
        tweetId = qp["tweetId"] if "tweetId" in qp else None

        retweet_tweet(tweetId)

        return Response({})

    @action(detail=False, methods=['get'])
    def unretweet(self, request, format=None):
        qp = request.query_params
        tweetId = qp["tweetId"] if "tweetId" in qp else None

        unretweet_tweet(tweetId)

        return Response({})

    @action(detail=False, methods=['get'])
    def reply(self, request, format=None):
        qp = request.query_params
        inReplyToTweetId = qp["inReplyToTweetId"] if "inReplyToTweetId" in qp else None
        replyText = qp["replyText"] if "replyText" in qp else None

        try:
            reply_to_tweet(inReplyToTweetId, replyText)
            return Response({})

        except tweepy.TooManyRequests:
            return Response({"error": "Error sending reply. It looks like we've been rate limited for replying to / favouriting tweets. Try again in a little while."}, status=status.HTTP_403_FORBIDDEN)

        except TweepyException as e:
            if 403 in e.api_codes:
                return Response({"error": "Error sending reply. It looks like that exactly reply recently got sent. Change the reply text and try again."}, status=status.HTTP_403_FORBIDDEN)
            else:
                # Uh oh, some other error code was returned
                # NB: tweepy.api can return certain errors via retry_errors
                return Response({"error": "Error {} while sending reply.".format(e.api_code)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": "Unknown error while sending reply: {}".format(str(e))}, status=status.HTTP_400_BAD_REQUEST)


class SocialColumnsViewset(viewsets.ViewSet):
    """
    API endpoints for handling columns on the triage screen (e.g. assigning columns)
    """
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['get'])
    def assign_triager(self, request, format=None):
        qp = request.query_params
        columnId = qp["columnId"] if "columnId" in qp else None
        userId = qp["userId"] if "userId" in qp else None

        column = SocialColumns.objects.get(id=columnId)

        if column.assigned_to_id is not None and column.assigned_to_id != userId:
            websockets.send_user_channel_message("notifications.send", {
                "message": "You have been unassigned from triaging the column \"{}\"".format(" ".join(column.search_phrases)),
                "options": {
                    "variant": NotificationVariants.INFO
                }
            }, column.assigned_to.username)

        column.assigned_to_id = userId
        column.save()

        if userId is not None:
            column = SocialColumns.objects.get(id=columnId)
            websockets.send_user_channel_message("notifications.send", {
                "message": "You have been assigned to triage the column \"{}\"".format(" ".join(column.search_phrases)),
                "options": {
                    "variant": NotificationVariants.INFO
                }
            }, column.assigned_to.username)

        websockets.send_channel_message("columns.update", {
            "columns": [SocialColumnsSerializerWithTweetCountSerializer(column).data],
        })

        return Response({"OK": True})

    @action(detail=False, methods=['get'])
    def unassign_triager(self, request, format=None):
        qp = request.query_params
        columnId = qp["columnId"] if "columnId" in qp else None

        column = SocialColumns.objects.get(id=columnId)

        if column.assigned_to_id is not None:
            websockets.send_user_channel_message("notifications.send", {
                "message": "You have been unassigned from triaging the column \"{}\"".format(" ".join(column.search_phrases)),
                "options": {
                    "variant": NotificationVariants.INFO
                }
            }, column.assigned_to.username)

            column.assigned_to_id = None
            column.save()

            websockets.send_channel_message("columns.update", {
                "columns": [SocialColumnsSerializerWithTweetCountSerializer(column).data],
            })

        return Response({"OK": True})


class SocialAssignmentsViewset(viewsets.ViewSet):
    """
    API endpoints for handling assigning things (like tweets) to reviewers.
    """
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['get'])
    def assign_reviewer(self, request, format=None):
        qp = request.query_params
        tweetId = qp["tweetId"] if "tweetId" in qp else None
        reviewerId = qp["reviewerId"] if "reviewerId" in qp else None

        try:
            status = get_status_from_db(tweetId)
            if status is None:
                raise ScremsongException("Could not find tweet {} in local db".format(tweetId))

            parents, parent = resolve_tweet_parents(status)
            parent, tweets, relationships = resolve_tweet_thread_for_parent(parent)
            replyTweetIds = [tweetId for tweetId in list(tweets.keys()) if tweetId != parent["data"]["id_str"]]

            assignment, created = SocialAssignments.objects.update_or_create(
                platform=SocialPlatformChoice.TWITTER, social_id=parent["data"]["id_str"], defaults={"user_id": reviewerId, "assigned_by": request.user, "thread_relationships": relationships, "thread_tweets": replyTweetIds}
            )

            websockets.send_channel_message("reviewers.assign", {
                "assignment": SocialAssignmentSerializer(assignment).data,
                "tweets": set_tweet_object_state_en_masse(tweets, TweetState.ASSIGNED),
            })

            return Response({"OK": True})

        except ScremsongException as e:
            return Response({"error": "Could not assign tweet {}. Failed to resolve and update tweet thread. Message: {}".format(tweetId, str(e))}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def reassign_reviewer(self, request, format=None):
        qp = request.query_params
        assignmentId = int(qp["assignmentId"]) if "assignmentId" in qp else None
        newReviewerId = int(qp["newReviewerId"]) if "newReviewerId" in qp else None

        if assignmentId is not None and newReviewerId is not None:
            try:
                assignment = get_or_none(SocialAssignments, id=assignmentId)
                assignment.user_id = newReviewerId
                assignment.assigned_by = request.user
                assignment.save()

                parent = get_status_from_db(assignment.social_id)
                parent, tweets, relationships = resolve_tweet_thread_for_parent(parent)

                websockets.send_channel_message("reviewers.assign", {
                    "assignment": SocialAssignmentSerializer(assignment).data,
                    "tweets": set_tweet_object_state_en_masse(tweets, TweetState.ASSIGNED),
                })

                return Response({"OK": True})

            except ScremsongException as e:
                return Response({"error": "Could not reassign assignment {}. Failed to resolve and update tweet thread. Message: {}".format(assignmentId, str(e))}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def bulk_reassign_reviewer(self, request, format=None):
        qp = request.query_params
        currentReviewerId = int(qp["currentReviewerId"]) if "currentReviewerId" in qp else None
        newReviewerId = int(qp["newReviewerId"]) if "newReviewerId" in qp else None

        if currentReviewerId is not None and newReviewerId is not None:
            try:
                assignmentsUpdated = []
                tweetsUpdated = {}

                assignments = SocialAssignments.objects.filter(user_id=currentReviewerId).filter(state=SocialAssignmentState.PENDING)
                with transaction.atomic():
                    for assignment in assignments:
                        assignment.user_id = newReviewerId
                        assignment.assigned_by = request.user
                        assignment.save()

                        assignmentsUpdated.append(SocialAssignmentSerializer(assignment).data)
                        parent = get_status_from_db(assignment.social_id)
                        parent, tweets, relationships = resolve_tweet_thread_for_parent(parent)
                        tweetsUpdated = {**tweetsUpdated, **set_tweet_object_state_en_masse(tweets, TweetState.ASSIGNED)}

                websockets.send_channel_message("reviewers.bulk_assign", {
                    "assignments": assignmentsUpdated,
                    "tweets": tweetsUpdated,
                })

                return Response({"OK": True})

            except ScremsongException as e:
                return Response({"error": "Could not bulk reassign assignments for {} to {}. Failed to resolve and update tweet thread. Message: {}".format(currentReviewerId, newReviewerId, str(e))}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def unassign_reviewer(self, request, format=None):
        qp = request.query_params
        assignmentId = int(qp["assignmentId"]) if "assignmentId" in qp else None

        assignment = SocialAssignments.objects.get(id=assignmentId)
        assignment.delete()

        websockets.send_channel_message("reviewers.unassign", {
            "assignmentId": assignmentId,
        })

        return Response({"OK": True})

    @action(detail=False, methods=['get'])
    def close(self, request, format=None):
        qp = request.query_params
        assignmentId = int(qp["assignmentId"]) if "assignmentId" in qp else None
        reason = str(qp["reason"]) if "reason" in qp else None

        if SocialAssignmentCloseReason.has_value(reason) is True:
            assignment = SocialAssignments.objects.get(id=assignmentId)
            assignment.close_reason = reason
            assignment.state = SocialAssignmentState.CLOSED
            assignment.last_read_on = getCreationDateOfNewestTweetInAssignment(assignment)
            assignment.save()

            websockets.send_channel_message("reviewers.assignment_metdata_changed", {
                "assignment": SocialAssignmentSerializer(assignment).data,
            })

            all_tweets_in_thread = [assignment.social_id] + assignment.thread_tweets
            Tweets.objects.filter(tweet_id__in=all_tweets_in_thread).update(state=TweetState.DEALT_WITH)

            websockets.send_channel_message("tweets.set_state", {
                "tweetStates": [{
                    "tweetId": t,
                    "tweetState": TweetState.DEALT_WITH,
                } for t in all_tweets_in_thread]
            })

        return Response({"OK": True})

    @action(detail=False, methods=['get'])
    def restore(self, request, format=None):
        qp = request.query_params
        assignmentId = int(qp["assignmentId"]) if "assignmentId" in qp else None

        assignment = SocialAssignments.objects.get(id=assignmentId)
        assignment.close_reason = None
        assignment.state = SocialAssignmentState.PENDING
        assignment.save()

        websockets.send_channel_message("reviewers.assignment_metdata_changed", {
            "assignment": SocialAssignmentSerializer(assignment).data,
        })

        all_tweets_in_thread = [assignment.social_id] + assignment.thread_tweets
        Tweets.objects.filter(tweet_id__in=all_tweets_in_thread).update(state=TweetState.ASSIGNED)

        websockets.send_channel_message("tweets.set_state", {
            "tweetStates": [{
                "tweetId": t,
                "tweetState": TweetState.ASSIGNED,
            } for t in all_tweets_in_thread]
        })

        return Response({"OK": True})

    @action(detail=False, methods=['get'])
    def mark_read(self, request, format=None):
        qp = request.query_params
        assignmentId = int(qp["assignmentId"]) if "assignmentId" in qp else None

        assignment = SocialAssignments.objects.get(id=assignmentId)
        assignment.last_read_on = getCreationDateOfNewestTweetInAssignment(assignment)
        assignment.save()

        websockets.send_channel_message("reviewers.assignment_metdata_changed", {
            "assignment": SocialAssignmentSerializer(assignment).data,
        })

        return Response({"OK": True})

    @action(detail=False, methods=['get'])
    def set_user_accepting_assignments(self, request, format=None):
        qp = request.query_params
        user_id = int(qp["user_id"]) if "user_id" in qp else None
        is_accepting_assignments = True if "is_accepting_assignments" in qp and qp["is_accepting_assignments"] == "true" else False

        profile = Profile.objects.get(user_id=user_id)
        profile.is_accepting_assignments = is_accepting_assignments
        if is_accepting_assignments is True:
            profile.offline_reason = None
        else:
            profile.offline_reason = ProfileOfflineReason.USER_CHOICE
        profile.save()

        websockets.send_channel_message("reviewers.set_status", {
            "user_id": user_id,
            "is_accepting_assignments": is_accepting_assignments
        })

        if is_accepting_assignments is True:
            message = "{} has come online and is ready to receive assignments!".format(UserSerializer(profile.user).data["name"])
        else:
            message = "{} has gone offline".format(UserSerializer(profile.user).data["name"])

        websockets.send_channel_message("notifications.send", {
            "message": message,
            "options": {
                "variant": NotificationVariants.INFO
            }
        })

        return Response({"OK": True})


class SocialPlatformsAuthViewset(viewsets.ViewSet):
    """
    API endpoints for handling authenticating against social platforms.
    """
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['get'])
    def toggle_muzzled_mode(self, request):
        qp = request.query_params
        muzzled = True if "muzzled" in qp and qp["muzzled"] == "1" else False

        with transaction.atomic():
            t = get_twitter_app()
            if t is None:
                raise ScremsongException("We haven't authenticated against Twitter yet.")

            muzzled = True if t.settings["muzzled"] is False else False
            t.settings = {**t.settings, "muzzled": muzzled}
            t.save()

            # Update settings for connected clients
            websockets.send_channel_message("socialplatforms.settings", {
                "settings": {
                    str(SocialPlatformChoice.TWITTER): t.settings
                }
            })

            # Send a notification to all connected clients
            if muzzled is True:
                message = "We've been muzzled by Twitter! Replying, favouriting, and retweeting will now open tweets in a new tab. See WhatsApp for more information. ⚠️ **Please reload Scremsong! now**"
                notificationVariant = NotificationVariants.WARNING
            else:
                message = "It's all good. We've been unmuzzled by Twitter. Scremsong is returning to normal operations 🎉 **Please reload Scremsong!**"
                notificationVariant = NotificationVariants.SUCCESS

            websockets.send_channel_message("notifications.send", {
                "message": message,
                "options": {
                    "variant": notificationVariant
                }
            })

            return Response({"settings": t.settings})

    @action(detail=False, methods=['get'])
    def twitter_auth_step1(self, request, format=None):
        # 1. Login to https://developer.twitter.com/en/apps as @DemSausage
        # 2. Register an app and set these callback URLs:
        #   - https://scremsong.test.democracysausage.org/api/0.1/social_auth/twitter_auth_step2/
        #   - https://scremsong.democracysausage.org/api/0.1/social_auth/twitter_auth_step2/
        # 3. In a new tab, go to Twitter and login as @DemSausage
        # 4. Go to https://scremsong.[test.]democracysausage.org and login
        # 5. Navigate to https://scremsong.[test.]democracysausage.org/api/0.1/social_auth/twitter_auth_step1/?format=json
        # 6. It will send you to Twitter and prompt you to Authorize Scremsong to use your account. (Important: Make sure you're logged in as @DemSausage before continuing!)
        # 7. You'll be returned to a page called "Social Platforms Auth Viewset" that says '"OK": true'
        try:
            redirect_url = twitter_user_api_auth_stage_1()
            return HttpResponseRedirect(redirect_to=redirect_url)
        except TweepyException:
            return Response({"error": "Error! Failed to get request token."}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def twitter_auth_step2(self, request, format=None):
        try:
            if twitter_user_api_auth_stage_2(request.query_params) is True:
                return Response({"OK": True})
        except TweepyException:
            return Response({"error": "Error! Failed to get access token. TweepyError."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Error! Failed to get access token. {}".format(str(e))}, status=status.HTTP_400_BAD_REQUEST)


class DashboardViewset(viewsets.ViewSet):
    """
    API endpoints to power the dashboard view.
    """
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['get'])
    def get_stats(self, request, format=None):
        stats = {
            "assignments": {
                # "all_time": {},
                "past_week": {},
            },
            "triage": {
                # "all_time": {},
                "past_week": {},
            }
        }

        for user in User.objects.filter(is_active=True):
            # stats["assignments"]["all_time"][user.id] = get_social_assignment_stats_for_user(user)
            stats["assignments"]["past_week"][user.id] = get_social_assignment_stats_for_user(user, sincePastNDays=7)

        for social_column in get_social_columns(SocialPlatformChoice.TWITTER).order_by("priority").all():
            # stats["triage"]["all_time"][social_column.id] = get_stats_for_column(social_column)
            stats["triage"]["past_week"][social_column.id] = get_stats_for_column(social_column, sincePastNDays=7)

        return Response(stats)


class TaskAdminViewset(viewsets.ViewSet):
    """
    API endpoint that lets us manage our task queue.
    """
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['get'])
    def tasks(self, request, format=None):
        import collections

        from rq import Queue

        tasks_by_queue = {}
        redis = get_redis_connection()
        for queue in Queue.all(connection=redis):
            tasks_by_queue[queue.name] = {
                "running": get_started_tasks(queue.name),
                "scheduled": get_queued_tasks(queue.name),
            }

        return Response(
            collections.OrderedDict(sorted(tasks_by_queue.items()))
        )

    @action(detail=False, methods=['get'])
    def restart_rate_limit_collection_task(self, request, format=None):
        task_collect_twitter_rate_limit_info.delay()
        return Response({"OK": True})

    @action(detail=False, methods=['get'])
    def kill_and_restart_streaming_tasks(self, request, format=None):
        task_cancel_and_restart_tweet_streaming.delay()
        return Response({"OK": True})

    @action(detail=False, methods=['get'])
    def launch_task_fill_missing_tweets_task(self, request, format=None):
        sinceId = get_latest_tweet_id_for_streaming()
        logger.info("Manually launching fill in missing tweets task for tweets since {}.".format(sinceId))
        if sinceId is not None:
            task_fill_missing_tweets.delay(sinceId=sinceId)
        else:
            logger.warning("Got sinceId of None when trying to manually start task_fill_missing_tweets")
        return Response({"OK": True})

    @action(detail=False, methods=['get'])
    def analyse_rate_limit_data(self, request, format=None):
        import csv
        import json

        used_rate_limits = []
        # for row in TwitterRateLimitInfo.objects.filter(collected_on__range=["2022-03-18", "2022-03-20"]):
        # for row in TwitterRateLimitInfo.objects.filter(collected_on__range=["2010-01-01", "2022-03-31"]):
        for row in TwitterRateLimitInfo.objects.all():
            for rate_limit_category, rate_limits in row.data.items():
                for rate_limit_name, rate_limit_data in rate_limits.items():
                    if rate_limit_data["remaining"] != rate_limit_data["limit"]:
                        pct_diff = rate_limit_data["remaining"] / rate_limit_data["limit"]
                        # if pct_diff <= 0.8:
                        #     pass
                        used_rate_limits.append({
                            "collected_on": row.collected_on,
                            "rate_limit_category": rate_limit_category,
                            "rate_limit_name": rate_limit_name,
                            "remaining": rate_limit_data["remaining"],
                            "limit": rate_limit_data["limit"],
                        })

        with open("/app/rate-limit-data-all.json", "w") as f:
            json.dump(used_rate_limits, f, indent=4, sort_keys=True, default=str)

        with open("/app/rate-limit-data-all.csv", "w", newline="") as f:
            dict_writer = csv.DictWriter(f, used_rate_limits[0].keys())
            dict_writer.writeheader()
            dict_writer.writerows(used_rate_limits)

        print("len = ", len(used_rate_limits))

        return Response(

        )


class LogsAdminViewset(viewsets.ViewSet):
    """
    API endpoint that lets us do stuff with log files.
    """
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['get'])
    def available_logs(self, request, format=None):
        filenames = []
        for filename in glob.iglob("/app/logs/*.log", recursive=True):
            filenames.append(os.path.basename(filename))

        return Response(filenames)

    @action(detail=False, methods=['get'])
    def get_log(self, request, format=None):
        def tail(file_path, num_lines=20000):
            if os.path.exists(file_path) is False:
                return "File does not exist."
            else:
                try:
                    if os.path.getsize(file_path) == 0:
                        return "File is empty."
                    else:
                        from sh import tail
                        return tail("-n", int(num_lines), file_path)
                except OSError as err:
                    return "Failed getting file size: {}".format(err)

        qp = request.query_params
        log_filename = str(qp["log_filename"]) if "log_filename" in qp else None
        download = True if "download" in qp else False

        file_path = os.path.join("/app/logs", os.path.basename(log_filename))
        response = HttpResponse(tail(file_path), content_type="text/plain")

        if download is True:
            response["Content-Disposition"] = "attachment; filename=\"{}\"".format(log_filename)
            response["Cache-Control"] = "no-cache"

        return response


class TwitterRateLimitAdminViewset(viewsets.ViewSet):
    """
    API endpoint that lets us see our consumption of the Twitter APIs.
    """
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['get'])
    def rate_limit_status(self, request, format=None):
        api = get_tweepy_api_auth()
        # status = api.rate_limit_status(resources="tweets,statuses,search,application,favorites")
        status = api.rate_limit_status()
        return Response({"resources": status["resources"]})  # Don't pass the access taken back


class ScremsongDebugViewset(viewsets.ViewSet):
    """
    API endpoint that lets us debug things.
    """
    permission_classes = (IsAuthenticated,)

    @action(detail=False, methods=['get'])
    def test(self, request, format=None):
        # from scremsong.app.twitter import get_tweet_from_db, process_new_tweet_reply
        # tweet = get_tweet_from_db("1076752336591118336")
        # process_new_tweet_reply(tweet.data, TweetSource.STREAMING, False)

        # from scremsong.util import get_or_none
        # assgignment = get_or_none(SocialAssignments, id=178)
        # logger.info(assgignment)
        # logger.info(assgignment.user.username)

        return Response({"OK": True})

    @action(detail=False, methods=['get'])
    def find_wot_was_rate_limited(self, request, format=None):
        from scremsong.app.models import TwitterRateLimitInfo

        rateLimited = {}

        for info in TwitterRateLimitInfo.objects.filter(collected_on__gte="2022-03-18 16:00:00+00").filter(collected_on__lte="2022-03-20 16:00:00+00").all():
            for group_name, group_info in info.data.items():
                for item_name, item_info in group_info.items():
                    if item_info["remaining"] < item_info["limit"]:
                        if group_name not in rateLimited:
                            rateLimited[group_name] = []

                        if item_name not in rateLimited[group_name]:
                            rateLimited[group_name].append(item_name)

        print(rateLimited)
        return Response({"OK": True})

    @action(detail=False, methods=['get'])
    def send_dummy_tweets(self, request, format=None):
        qp = request.query_params
        number_of_tweets = int(qp["number_of_tweets"]) if "number_of_tweets" in qp else None
        time_limit = int(qp["time_limit"]) if "time_limit" in qp else None

        sleepTime = time_limit / number_of_tweets

        if sleepTime < 0.1:
            return Response({"error": "Woah there sonny! {} is a bit too fast!".format(sleepTime)})

        if number_of_tweets is not None and time_limit is not None:
            for i in list(range(1, number_of_tweets + 1)):
                # Create dummy tweet id
                latestTweet = deepcopy(Tweets.objects.filter(data__retweeted_status__isnull=True).filter(status=TweetStatus.OK).last())
                latestTweet.data["id_str"] = "{}-{}".format(latestTweet.data["id_str"], i)
                latestTweet.tweet_id = latestTweet.data["id_str"]

                # Create dummy tweet mesage
                tweetText = "@DemSausage Dummy Tweet [{}/{}]".format(i, number_of_tweets)

                if "extended_tweet" in latestTweet.data:
                    latestTweet.data["extended_tweet"]["full_text"] = tweetText

                if "text" in latestTweet.data:
                    latestTweet.data["text"] = tweetText

                if "full_text" in latestTweet.data:
                    latestTweet.data["full_text"] = tweetText

                # Set the right dummy entities
                if "entities" in latestTweet.data:
                    latestTweet.data["entities"] = {
                        "urls": [],
                        "symbols": [],
                        "hashtags": [],
                        "user_mentions": [
                            {"id": 1256120371, "name": "Democracy Sausage", "id_str": "1256120371", "indices": [0, 11], "screen_name": "DemSausage"}
                        ]
                    }

                # Send our web socket message
                notify_of_saved_tweet(latestTweet)

                if i < number_of_tweets:
                    sleep(sleepTime)

        return Response({"OK": True})
