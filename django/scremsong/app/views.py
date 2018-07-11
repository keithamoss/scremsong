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
from scremsong.util import get_env


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
        import tweepy

        auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))
        auth.set_access_token(get_env("TWITTER_ACCESS_TOKEN"), get_env("TWITTER_ACCESS_TOKEN_SECRET"))

        api = tweepy.API(auth)

        public_tweets = api.search(q="#democracysausage", rpp=10, result_type="recent", tweet_mode="extended")
        tweets = []
        for tweet in public_tweets:
            tweets.append(tweet.full_text)

        response = Response(tweets)
        return response

    @list_route(methods=['get'])
    def stream(self, request, format=None):
        import tweepy
        # override tweepy.StreamListener to add logic to on_status

        class MyStreamListener(tweepy.StreamListener):

            def on_status(self, status):
                print(">>> ", status.text)

        auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))
        # auth.set_access_token(get_env("TWITTER_ACCESS_TOKEN"), get_env("TWITTER_ACCESS_TOKEN_SECRET"))
        auth.set_access_token(request.session["twitter_access_token"], request.session["twitter_access_token_secret"])

        api = tweepy.API(auth)

        myStreamListener = MyStreamListener()
        myStream = tweepy.Stream(auth=api.auth, listener=myStreamListener)

        myStream.filter(track=["#democracysausage"])
        return Response({})

    @list_route(methods=['get'])
    def auth1(self, request, format=None):
        import tweepy
        auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))

        try:
            redirect_url = auth.get_authorization_url()
            request.session["twitter_request_token"] = auth.request_token
            print(request.session["twitter_request_token"])
            return Response({"url": redirect_url, "request_token": auth.request_token})
        except tweepy.TweepError:
            print('Error! Failed to get request token.')

    @list_route(methods=['get'])
    def auth2(self, request, format=None):
        import tweepy
        auth = tweepy.OAuthHandler(get_env("TWITTER_CONSUMER_KEY"), get_env("TWITTER_CONSUMER_SECRET"))

        token = request.session["twitter_request_token"]
        # print(request.session["twitter_request_token"])
        auth.request_token = {'oauth_token': token["oauth_token"],
                              'oauth_token_secret': request.query_params["oauth_verifier"]}
        # request.session["twitter_request_token"] = None
        print(auth.request_token)
        try:
            print(request.query_params["oauth_verifier"])
            auth.get_access_token(request.query_params["oauth_verifier"])
            request.session["twitter_request_token"] = None
            request.session["twitter_access_token"] = auth.access_token
            request.session["twitter_access_token_secret"] = auth.access_token_secret
            return Response({"access_token": auth.access_token, "access_token_secret": auth.access_token_secret})
        except tweepy.TweepError:
            print('Error! Failed to get access token.')
        return Response({"foo"})
