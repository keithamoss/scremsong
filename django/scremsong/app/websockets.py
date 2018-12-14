from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.conf import settings
from .serializers import UserSerializer
from scremsong.app.twitter import get_twitter_columns, fetch_some_tweets
from scremsong.app.reviewers import get_reviewer_users, get_assignments

# group-name_room-name
WS_GROUP_NAME = "scremsong_scremsong"


def build_on_connect_data_payload(user):
    return {
        "msg_type": settings.MSG_TYPE_CONNECTED,
        "is_logged_in": True,
        "user": UserSerializer(user).data,
        "actions": [
            {
                "msg_type": settings.MSG_TYPE_SOCIAL_COLUMNS_LIST,
                "columns": get_twitter_columns()
            },
            {
                "msg_type": settings.MSG_TYPE_REVIEWERS_LIST_USERS,
                "users": get_reviewer_users()
            },
            {
                **{"msg_type": settings.MSG_TYPE_REVIEWERS_LIST_ASSIGNMENTS},
                **get_assignments()
            },
            {
                **{"msg_type": settings.MSG_TYPE_TWEETS_FETCH_SOME},
                **fetch_some_tweets(startIndex=0, stopIndex=20)
            }
        ]
    }


def send_channel_message(msg_type, payload):
    if msg_type is not None:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(WS_GROUP_NAME, {
            **{"type": msg_type}, **payload
        })
