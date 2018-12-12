from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
import json
from scremsong.app.models import SocialPlatformChoice, Tweets, SocialAssignments, SocialAssignmentStatus, Profile
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from scremsong.util import get_env, make_logger

from django.contrib.auth.models import User
from scremsong.app.twitter import twitter_user_api_auth_stage_1, twitter_user_api_auth_stage_2, get_tweets_for_column, get_total_tweets_for_column, get_tweets_by_ids
from scremsong.app.social import get_social_columns, get_social_assignments
from .serializers import UserSerializer

logger = make_logger(__name__)


class ScremsongConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.group_name = 'scremsong_%s' % self.scope['url_route']['kwargs']['group_name']
        self.user = self.scope["user"]

        if self.user.is_anonymous == False and self.user.is_authenticated:
            # Join room group
            async_to_sync(self.channel_layer.group_add)(
                self.group_name,
                self.channel_name
            )

            self.accept()

            # Send a message back to the client on a successful connection
            self.send_json({
                "msg_type": settings.MSG_TYPE_CONNECTED,
                "is_logged_in": True,
                "user": UserSerializer(self.user).data,
                "actions": [
                    {
                        "msg_type": settings.MSG_TYPE_SOCIAL_COLUMNS_LIST,
                        "columns": self.get_deck_columns()
                    },
                    {
                        "msg_type": settings.MSG_TYPE_REVIEWERS_LIST,
                        "reviewers": self.get_reviewer_users()
                    },
                    {
                        **{"msg_type": settings.MSG_TYPE_ASSIGNMENTS_FOR_USER},
                        **self.get_assignments(self.user)
                    },
                    {
                        **{"msg_type": settings.MSG_TYPE_TWEETS_FETCH_SOME},
                        **self.get_some_tweets(0, 20)
                    }
                ]
            })

            logger.debug('scremsong connect channel=%s group=%s user=%s', self.channel_name, self.group_name, self.user)
        else:
            # Setting a code doesn't actually seem to work
            # https://github.com/django/channels/issues/414
            self.close(code=4000)

    def get_deck_columns(self):
        columns = []
        for column in get_social_columns(SocialPlatformChoice.TWITTER).values():
            columns.append({
                **column,
                "total_tweets": get_total_tweets_for_column(column),
            })
        return columns

    def get_reviewer_users(self):
        reviewers = []
        for reviewer in User.objects.filter(is_staff=False, is_active=True):
            reviewers.append({
                "id": reviewer.id,
                "username": reviewer.username,
                "name": "{} {}".format(reviewer.first_name, reviewer.last_name),
                "initials": "{}{}".format(reviewer.first_name[:1], reviewer.last_name[:1]),
                "is_accepting_assignments": reviewer.profile.is_accepting_assignments,
            })
        return reviewers

    def get_assignments(self, user):
        queryset = SocialAssignments.objects.filter(status=SocialAssignmentStatus.PENDING, user=user).order_by("-id")
        assignments = [a for a in queryset]

        tweetIds = [a["social_id"] for a in assignments]
        tweets = {}
        for tweet in get_tweets_by_ids(tweetIds):
            tweets[tweet["tweet_id"]] = {"data": tweet["data"], "is_dismissed": tweet["is_dismissed"]}

        for assignment in assignments:
            tweets[assignment["social_id"]]["reviewer_id"] = assignment["user_id"]
            tweets[assignment["social_id"]]["review_status"] = assignment["status"]

        return {"user_id": user.id, "assignments": assignments, "tweets": tweets}

    def get_some_tweets(self, startIndex, stopIndex, sinceId=None, maxId=None, columnIds=[]):
        # if sinceId is None and (startIndex is None or stopIndex is None):
        #     return Response({"error": "Missing 'startIndex' or 'stopIndex'."}, status=status.HTTP_400_BAD_REQUEST)

        columns = []
        tweets = {}
        for social_column in get_social_columns(SocialPlatformChoice.TWITTER, columnIds):
            column_tweets = get_tweets_for_column(social_column, sinceId, maxId, startIndex, stopIndex)
            column_tweet_ids = []

            for tweet in column_tweets:
                tweets[tweet["tweet_id"]] = {"data": tweet["data"], "is_dismissed": tweet["is_dismissed"]}
                column_tweet_ids.append(tweet["tweet_id"])

            columns.append({
                "id": social_column.id,
                "tweets": column_tweet_ids,
            })

            social_assignments = get_social_assignments(SocialPlatformChoice.TWITTER, column_tweet_ids)
            for assignment in social_assignments:
                tweets[assignment["social_id"]]["reviewer_id"] = assignment["user_id"]
                tweets[assignment["social_id"]]["review_status"] = assignment["status"]

        return {
            "columns": columns,
            "tweets": tweets,
        }

    def disconnect(self, close_code):
        # Leave the group
        async_to_sync(self.channel_layer.group_discard)(
            self.group_name,
            self.channel_name
        )

        # @TODO Send a message to all connected clients that this used has gone offline
        # async_to_sync(self.channel_layer.group_send)(
        #     self.group_name,
        #     {
        #         "userId": self.user.id,
        #         "isAcceptingAssignments": False
        #     }
        # )

        logger.debug('scremsong disconnect channel=%s user=%s', self.channel_name, self.user)

    # Handlers for messages sent over the channel layer
    # c.f. https://github.com/andrewgodwin/channels-examples/blob/master/multichat/chat/consumers.py

    # These helper methods are named by the types we send - so chat.join becomes chat_join
    def reviewers_set_status(self, event):
        """
        Called when someone has joined our chat.
        """
        # Send a message down to the client
        self.send_json({
            "msg_type": settings.MSG_TYPE_REVIEWERS_SET_STATUS,
            "userId": event["user_id"],
            "isAcceptingAssignments": event["is_accepting_assignments"],
        })
