from django.contrib.auth.models import User
from django.contrib.auth import logout
from django.http.response import HttpResponseRedirect
from django.http import HttpResponseNotFound
from django.utils import timezone

from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import list_route
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from tweepy import TweepError
from scremsong.app.serializers import UserSerializer, SocialAssignmentSerializer
from scremsong.app.twitter import twitter_user_api_auth_stage_1, twitter_user_api_auth_stage_2, fetch_tweets, get_status_from_db, resolve_tweet_parents, resolve_tweet_thread_for_parent, notify_of_saved_tweet
from scremsong.celery import celery_restart_streaming
from scremsong.app.models import Tweets, SocialAssignments, Profile
from scremsong.app.enums import SocialPlatformChoice, SocialAssignmentStatus, NotificationVariants, TweetState, TweetStatus
from scremsong.app import websockets
from scremsong.util import make_logger
from scremsong.app.exceptions import ScremsongException

from time import sleep
from copy import deepcopy

logger = make_logger(__name__)


def api_not_found(request):
    return HttpResponseNotFound()


class CurrentUserView(APIView):
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
        request.user.profile.merge_settings(request.data)
        request.user.profile.save()
        return Response({"settings": request.user.profile.settings})

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
                "tweetId": tweetId,
                "tweetState": tweetState,
            })

        return Response({})


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
                "tweets": tweets,
            })

            return Response({"OK": True})

        except ScremsongException as e:
            return Response({"error": "Could not assign tweet {}. Failed to resolve and update tweet thread. Message: {}".format(tweetId, str(e))}, status=status.HTTP_400_BAD_REQUEST)

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
    def assignment_done(self, request, format=None):
        qp = request.query_params
        assignmentId = int(qp["assignmentId"]) if "assignmentId" in qp else None

        assignment = SocialAssignments.objects.get(id=assignmentId)
        assignment.status = SocialAssignmentStatus.DONE
        assignment.save()

        websockets.send_channel_message("reviewers.assignment_status_changed", {
            "assignmentId": assignmentId,
            "status": str(SocialAssignmentStatus.DONE),
        })

        return Response({"OK": True})

    @list_route(methods=['get'])
    def set_user_accepting_assignments(self, request, format=None):
        qp = request.query_params
        user_id = int(qp["user_id"]) if "user_id" in qp else None
        is_accepting_assignments = True if "is_accepting_assignments" in qp and qp["is_accepting_assignments"] == "true" else False

        profile = Profile.objects.get(user_id=user_id)
        profile.is_accepting_assignments = is_accepting_assignments
        profile.save()

        websockets.send_channel_message("reviewers.set_status", {
            "user_id": user_id,
            "is_accepting_assignments": is_accepting_assignments
        })

        if is_accepting_assignments is True:
            message = "{} has come online and is now ready to receive assignments!".format(UserSerializer(profile.user).data["name"])
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
    def twitter_auth_step1(self, request, format=None):
        # 1. Login to https://developer.twitter.com/en/apps as @DemSausage
        # 2. Register an app and set these callback URLs:
        #   - https://localhost:8001/api/0.1/social_auth/twitter_auth_step2/
        #   - https://scremsong-api.democracysausage.org/api/0.1/social_auth/twitter_auth_step2/
        # 3. In a new tab, go to Twitter and login as @DemSausage
        # 3. Navigate to https://localhost:8001/api/0.1/social_auth/twitter_auth_step1/?format=json
        # 4. It will send you to Twitter and prompt you to Authorize Scremsong to use your account. (Important: Make sure you're logged in as @DemSausage before continuing!)
        # 5. You'll be returned to a page called "Social Platforms Auth Viewset" that says '"OK": true'
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


class CeleryAdminViewset(viewsets.ViewSet):
    """
    API endpoint that lets us manage our celery instance.
    """
    permission_classes = (IsAuthenticated,)

    @list_route(methods=['get'])
    def celery_running_tasks(self, request, format=None):
        from celery.task.control import inspect
        i = inspect()
        return Response(i.active())

    @list_route(methods=['get'])
    def celery_workers(self, request, format=None):
        from celery.task.control import inspect
        i = inspect()
        return Response(i.ping())

    @list_route(methods=['get'])
    def restart_streaming(self, request, format=None):
        celery_restart_streaming()
        return Response({"OK": True})


class ScremsongDebugViewset(viewsets.ViewSet):
    """
    API endpoint that lets us debug things.
    """
    permission_classes = (IsAuthenticated,)

    @list_route(methods=['get'])
    def test(self, request, format=None):
        # from scremsong.app.twitter import get_tweet_from_db, process_new_tweet
        # tweet = get_tweet_from_db("1076752336591118336")
        # process_new_tweet(tweet.data, TweetSource.STREAMING, False)

        # from scremsong.util import get_or_none
        # assgignment = get_or_none(SocialAssignments, id=178)
        # logger.info(assgignment)
        # logger.info(assgignment.user.username)

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
