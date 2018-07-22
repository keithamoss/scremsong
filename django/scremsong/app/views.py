from django.contrib.auth.models import User, AnonymousUser
from django.contrib.auth import logout
from django.db.models import Q
from django.http.response import HttpResponse
from django.http import HttpResponseNotFound
from django.core.cache import cache
# from .models import MapDefinition

from rest_framework import viewsets, mixins, status
from rest_framework.views import APIView
from rest_framework.decorators import detail_route, list_route
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
# from .permissions import AllowAnyIfPublicSite, IsAuthenticatedAndApproved, IsMapOwnerOrReadOnly, IsMapOwner, CanViewOrCloneMap

from .serializers import UserSerializer, ProfileSerializer

import time
import copy
import urllib.parse
import json
import csv
# from ealgis_common.db import broker
# from ealgis.mvt import TileGenerator
from tweepy import TweepError
from scremsong.util import get_env, make_logger
from scremsong.app.twitter import twitter_user_api_auth_stage_1, twitter_user_api_auth_stage_2, open_tweet_stream, get_twitter_app, get_uuid

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


class ProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows user profiles to be viewed or edited.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = ProfileSerializer

    def get_queryset(self):
        return self.request.user.profile


class TweetsViewset(viewsets.ViewSet):
    """
    API endpoint that returns ...
    """
    permission_classes = (IsAuthenticated,)

    def list(self, request, format=None):
        return Response({"foo": "bar"})
        # import tweepy

        # auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))
        # auth.set_access_token(get_env("TWITTER_ACCESS_TOKEN"), get_env("TWITTER_ACCESS_TOKEN_SECRET"))

        # api = tweepy.API(auth)

        # public_tweets = api.search(q="#democracysausage", rpp=10, result_type="recent", tweet_mode="extended")
        # tweets = []
        # for tweet in public_tweets:
        #     tweets.append(tweet.full_text)

        # response = Response(tweets)
        # return response

    @list_route(methods=['get'])
    def celery(self, request, format=None):
        from scremsong.celery import task_open_tweet_stream
        task_id = task_open_tweet_stream.delay()
        print(task_id)
        return Response({})

    @list_route(methods=['get'])
    def celery_kill(self, request, format=None):
        from celery.task.control import revoke
        f = revoke("07fa8a7c-9baf-427d-ba9e-772469fa7c48", terminate=True)
        print(f)
        return Response({})
        # return response

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
    def auth1(self, request, format=None):
        try:
            redirect_url = twitter_user_api_auth_stage_1()
            return Response({"url": redirect_url})
        except TweepError:
            return Response({"error": "Error! Failed to get request token."}, status=status.HTTP_400_BAD_REQUEST)

    @list_route(methods=['get'])
    def auth2(self, request, format=None):
        try:
            if twitter_user_api_auth_stage_2(request.query_params) is True:
                return Response({"OK": True})
        except TweepError:
            return Response({"error": "Error! Failed to get access token. TweepyError."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Error! Failed to get access token. {}".format(str(e))}, status=status.HTTP_400_BAD_REQUEST)

    @list_route(methods=['get'])
    def start_stream(self, request, format=None):
        try:
            t = get_twitter_app()
            if t.active_app_uuid is not None:
                return Response({"error": "Please stop the tweet stream first."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                open_tweet_stream()
                logger.warn("Stream started for {}.".format(get_uuid()))
                return Response({"OK": True})
        except Exception as e:
            return Response({"error": "Error! Failed to start tweet stream. {}".format(str(e))}, status=status.HTTP_400_BAD_REQUEST)

    @list_route(methods=['get'])
    def stop_stream(self, request, format=None):
        try:
            t = get_twitter_app()
            app_uuid = t.active_app_uuid
            t.active_app_uuid = None
            t.pid = None
            t.save()
            logger.warn("Stream stopped for {}.".format(app_uuid))
            return Response({"OK": True})
        except Exception as e:
            return Response({"error": "Error! Failed to stop tweet stream. {}".format(str(e))}, status=status.HTTP_400_BAD_REQUEST)
