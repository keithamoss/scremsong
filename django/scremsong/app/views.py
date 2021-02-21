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
from rest_framework.decorators import list_route
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
                                  SocialPlatforms, Tweets)
from scremsong.app.reviewers import getCreationDateOfNewestTweetInAssignment
from scremsong.app.serializers import (
    SocialAssignmentSerializer,
    SocialColumnsSerializerWithTweetCountSerializer, UserSerializer)
from scremsong.app.social.assignments import \
    get_social_assignment_stats_for_user
from scremsong.app.social.columns import (get_social_columns,
                                          get_stats_for_column)
from scremsong.app.twitter import (favourite_tweet, fetch_tweets,
                                   get_status_from_db, get_tweepy_api_auth,
                                   get_twitter_app, notify_of_saved_tweet,
                                   reply_to_tweet, resolve_tweet_parents,
                                   resolve_tweet_thread_for_parent,
                                   retweet_tweet,
                                   set_tweet_object_state_en_masse,
                                   twitter_user_api_auth_stage_1,
                                   twitter_user_api_auth_stage_2,
                                   unfavourite_tweet, unretweet_tweet)
from scremsong.celery import celery_restart_streaming
from scremsong.util import get_or_none, make_logger
from tweepy import TweepError

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

    @list_route(methods=['post'])
    def update_settings(self, request):
        with transaction.atomic():
            user = User.objects.select_for_update().get(id=request.user.id)
            user.profile.merge_settings(request.data)
            user.profile.save()
            return Response({"settings": user.profile.settings})

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
    def favourite(self, request, format=None):
        qp = request.query_params
        tweetId = qp["tweetId"] if "tweetId" in qp else None

        favourite_tweet(tweetId)

        return Response({})

    @list_route(methods=['get'])
    def unfavourite(self, request, format=None):
        qp = request.query_params
        tweetId = qp["tweetId"] if "tweetId" in qp else None

        unfavourite_tweet(tweetId)

        return Response({})

    @list_route(methods=['get'])
    def retweet(self, request, format=None):
        qp = request.query_params
        tweetId = qp["tweetId"] if "tweetId" in qp else None

        retweet_tweet(tweetId)

        return Response({})

    @list_route(methods=['get'])
    def unretweet(self, request, format=None):
        qp = request.query_params
        tweetId = qp["tweetId"] if "tweetId" in qp else None

        unretweet_tweet(tweetId)

        return Response({})

    @list_route(methods=['get'])
    def reply(self, request, format=None):
        qp = request.query_params
        inReplyToTweetId = qp["inReplyToTweetId"] if "inReplyToTweetId" in qp else None
        replyText = qp["replyText"] if "replyText" in qp else None

        try:
            reply_to_tweet(inReplyToTweetId, replyText)
            return Response({})

        except tweepy.RateLimitError:
            return Response({"error": "Error sending reply. It looks like we've been rate limited for replying to / favouriting tweets. Try again in a little while."}, status=status.HTTP_403_FORBIDDEN)

        except tweepy.TweepError as e:
            if e.api_code == 403:
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

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
    def unassign_reviewer(self, request, format=None):
        qp = request.query_params
        assignmentId = int(qp["assignmentId"]) if "assignmentId" in qp else None

        assignment = SocialAssignments.objects.get(id=assignmentId)
        assignment.delete()

        websockets.send_channel_message("reviewers.unassign", {
            "assignmentId": assignmentId,
        })

        return Response({"OK": True})

    @list_route(methods=['get'])
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

        return Response({"OK": True})

    @list_route(methods=['get'])
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

        return Response({"OK": True})

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
    def set_muzzled(self, request):
        qp = request.query_params
        muzzled = True if "muzzled" in qp and qp["muzzled"] == "1" else False

        with transaction.atomic():
            t = get_twitter_app()
            if t is None:
                raise ScremsongException("We haven't authenticated against Twitter yet.")

            t.settings = {**t.settings, "muzzled": muzzled}
            t.save()

            # Update settings for connected clients
            websockets.send_channel_message("socialplatforms.settings", {
                "settings": {
                    str(SocialPlatformChoice.TWITTER): t.settings
                }
            })

            # Send a notification to all connected clients
            message = "We've been muzzled by Twitter! Replying, favouriting, and retweeting will now open tweets in a new tab. See WhatsApp for more information. **And please reload Scremsong!**" if muzzled is True else "It's all good. We've been unmuzzled by Twitter. Scremsong is returning to normal operations 🎉 **And please reload Scremsong!**"
            websockets.send_channel_message("notifications.send", {
                "message": message,
                "options": {
                    "variant": NotificationVariants.WARNING
                }
            })

            return Response({"settings": t.settings})

    @list_route(methods=['get'])
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
        except TweepError:
            return Response({"error": "Error! Failed to get request token."}, status=status.HTTP_400_BAD_REQUEST)

    @list_route(methods=['get'])
    def twitter_auth_step2(self, request, format=None):
        try:
            if twitter_user_api_auth_stage_2(request.query_params) is True:
                return Response({"OK": True})
        except TweepError:
            return Response({"error": "Error! Failed to get access token. TweepyError."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Error! Failed to get access token. {}".format(str(e))}, status=status.HTTP_400_BAD_REQUEST)


class DashboardViewset(viewsets.ViewSet):
    """
    API endpoints to power the dashboard view.
    """
    permission_classes = (IsAuthenticated,)

    @list_route(methods=['get'])
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

        for user in User.objects.all():
            # stats["assignments"]["all_time"][user.id] = get_social_assignment_stats_for_user(user)
            stats["assignments"]["past_week"][user.id] = get_social_assignment_stats_for_user(user, sincePastNDays=7)

        for social_column in get_social_columns(SocialPlatformChoice.TWITTER).order_by("priority").all():
            # stats["triage"]["all_time"][social_column.id] = get_stats_for_column(social_column)
            stats["triage"]["past_week"][social_column.id] = get_stats_for_column(social_column, sincePastNDays=7)

        return Response(stats)


class CeleryAdminViewset(viewsets.ViewSet):
    """
    API endpoint that lets us manage our celery instance.
    """
    permission_classes = (IsAuthenticated,)

    @list_route(methods=['get'])
    def tasks(self, request, format=None):
        from celery.task.control import inspect
        i = inspect()
        return Response({
            # These are all the tasks that are currently being executed.
            "running": i.active(),
            # These are tasks reserved by the worker when they have an eta or countdown argument set.
            "scheduled": i.scheduled(),
            # This will list all tasks that have been prefetched by the worker, and is currently waiting to be executed (doesn’t include tasks with an ETA value set).
            "reserved": i.reserved()
        })

    @list_route(methods=['get'])
    def workers(self, request, format=None):
        from celery.task.control import inspect
        i = inspect()
        return Response(i.ping())

    @list_route(methods=['get'])
    def restart_streaming(self, request, format=None):
        celery_restart_streaming()
        return Response({"OK": True})


class LogsAdminViewset(viewsets.ViewSet):
    """
    API endpoint that lets us do stuff with log files.
    """
    permission_classes = (IsAuthenticated,)

    @list_route(methods=['get'])
    def available_logs(self, request, format=None):
        filenames = []
        for filename in glob.iglob("/app/logs/*.log", recursive=True):
            filenames.append(os.path.basename(filename))

        return Response(filenames)

    @list_route(methods=['get'])
    def get_log(self, request, format=None):
        def tail(file_path, num_lines=20000):
            if os.path.exists(file_path) is False:
                return "File does not exist."
            else:
                from sh import tail
                return tail("-n", int(num_lines), file_path)

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

    @list_route(methods=['get'])
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

    @list_route(methods=['get'])
    def test(self, request, format=None):
        # from scremsong.app.twitter import get_tweet_from_db, process_new_tweet_reply
        # tweet = get_tweet_from_db("1076752336591118336")
        # process_new_tweet_reply(tweet.data, TweetSource.STREAMING, False)

        # from scremsong.util import get_or_none
        # assgignment = get_or_none(SocialAssignments, id=178)
        # logger.info(assgignment)
        # logger.info(assgignment.user.username)

        return Response({"OK": True})

    @list_route(methods=['get'])
    def find_wot_was_rate_limited(self, request, format=None):
        from scremsong.app.models import TwitterRateLimitInfo

        rateLimited = {}

        for info in TwitterRateLimitInfo.objects.filter(collected_on__gte="2019-03-22 16:00:00+00").filter(collected_on__lte="2019-03-23 16:00:00+00").all():
            for group_name, group_info in info.data.items():
                for item_name, item_info in group_info.items():
                    if item_info["remaining"] < item_info["limit"]:
                        if group_name not in rateLimited:
                            rateLimited[group_name] = []

                        if item_name not in rateLimited[group_name]:
                            rateLimited[group_name].append(item_name)

        print(rateLimited)
        return Response({"OK": True})

    @list_route(methods=['get'])
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
