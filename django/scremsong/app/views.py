from django.contrib.auth.models import User, AnonymousUser
from django.contrib.auth import logout
from django.db.models import Q
from django.http.response import HttpResponse, JsonResponse
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

from .serializers import UserSerializer, ProfileSerializer, SocialColumnsSerializer

import time
import copy
import urllib.parse
import json
import csv
from tweepy import TweepError
from scremsong.util import get_env, make_logger
from scremsong.app.twitter import twitter_user_api_auth_stage_1, twitter_user_api_auth_stage_2, get_tweets_for_column, get_total_tweets_for_column
from scremsong.celery import celery_restart_streaming
from scremsong.app.social import get_social_columns
from scremsong.app.models import SocialPlatformChoice

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

    @list_route(methods=['get'])
    def get_deck_columns(self, request, format=None):
        # return JsonResponse({"columns": list(get_social_columns(SocialPlatformChoice.TWITTER).values())})

        columns = []
        for column in get_social_columns(SocialPlatformChoice.TWITTER).values():
            columns.append({
                **column,
                "total_tweets": get_total_tweets_for_column(column),
            })

        return Response({"columns": columns})

    @list_route(methods=['get'])
    def get_some_tweets(self, request, format=None):
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

        columns = []
        tweets = {}
        for social_column in get_social_columns(SocialPlatformChoice.TWITTER, columnIds):
            column_tweets = get_tweets_for_column(social_column, sinceId, maxId, startIndex, stopIndex)
            column_tweet_ids = []

            for tweet in column_tweets:
                tweets[tweet["tweet_id"]] = tweet["data"]
                column_tweet_ids.append(tweet["tweet_id"])

            columns.append({
                "id": social_column.id,
                "tweets": column_tweet_ids,
            })

        return Response({
            "columns": columns,
            "tweets": tweets,
        })

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
