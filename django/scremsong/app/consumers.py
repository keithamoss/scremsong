from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.conf import settings
from scremsong.util import make_logger
from scremsong.app.serializers import UserSerializer
from scremsong.app.twitter import get_twitter_columns, fetch_tweets_for_columns
from scremsong.app.reviewers import get_reviewer_users, get_assignments
from scremsong.app import websockets
from random import getrandbits

logger = make_logger(__name__)


class ScremsongConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.user = self.scope["user"]
        self.group_name = 'scremsong_%s' % self.scope['url_route']['kwargs']['group_name']  # For all Scremsong users
        self.user_group_name = 'user_%s' % self.user  # Just for this user

        if self.user.is_anonymous is False and self.user.is_authenticated:
            # Join the general Scremsong group
            async_to_sync(self.channel_layer.group_add)(
                self.group_name,
                self.channel_name
            )

            # Join the specific channel for this user (lets us send user-specific messages)
            async_to_sync(self.channel_layer.group_add)(
                self.user_group_name,
                self.channel_name
            )

            self.accept()

            # Send a message back to the client on a successful connection
            self.send_json(build_on_connect_data_payload(self.user))

            logger.debug('scremsong connect channel=%s group=%s group=%s user=%s', self.channel_name, self.group_name, self.user_group_name, self.user)
        else:
            # Setting a code doesn't actually seem to work
            # https://github.com/django/channels/issues/414
            self.close(code=4000)

    def receive_json(self, content):
        if "type" not in content:
            return None

        if content["type"] == settings.MSG_TYPE_USER_CHANGE_SETTINGS:
            websockets.send_channel_message("user.change_settings", {"settings": content["settings"]})

    def disconnect(self, close_code):
        # Leave the group
        async_to_sync(self.channel_layer.group_discard)(
            self.group_name,
            self.channel_name
        )

        # @TODO Send a message to all connected clients that this user has gone offline
        # async_to_sync(self.channel_layer.group_send)(
        #     self.group_name,
        #     {
        #         "user_id": self.user.id,
        #         "is_accepting_assignments": False
        #     }
        # )

        logger.debug('scremsong disconnect channel=%s user=%s', self.channel_name, self.user)

    # Handlers for messages sent over the channel layer
    # c.f. https://github.com/andrewgodwin/channels-examples/blob/master/multichat/chat/consumers.py

    # These helper methods are named by the types we send - so chat.join becomes chat_join
    def notifications_send(self, event):
        """
        Called when we need to send a notification to connected clients.
        """
        self.send_json({
            "msg_type": settings.MSG_TYPE_NOTIFICATION,
            "message": event["message"],
            "options": event["options"],
            "key": str(getrandbits(128)),
        })

    def reviewers_assign(self, event):
        """
        Called when someone has been assigned a new item.
        """
        self.send_json({
            "msg_type": settings.MSG_TYPE_REVIEWERS_ASSIGN,
            "assignment": event["assignment"],
            "tweets": event["tweets"],
        })

    def reviewers_unassign(self, event):
        """
        Called when someone has been unassigned from an item.
        """
        self.send_json({
            "msg_type": settings.MSG_TYPE_REVIEWERS_UNASSIGN,
            "assignmentId": event["assignmentId"],
        })

    def reviewers_assignment_updated(self, event):
        """
        Called when new tweets (e.g. replies) have arrived in an assignment.
        """
        self.send_json({
            "msg_type": settings.MSG_TYPE_REVIEWERS_ASSIGNMENT_UPDATED,
            "assignment": event["assignment"],
            "tweets": event["tweets"],
        })

    def reviewers_assignment_status_changed(self, event):
        """
        Called when the status of an assignment has been changed (e.g. it's been completed).
        """
        self.send_json({
            "msg_type": settings.MSG_TYPE_REVIEWERS_ASSIGNMENT_STATUS_CHANGE,
            "assignmentId": event["assignmentId"],
            "status": event["status"],
        })

    def reviewers_set_status(self, event):
        """
        Called when someone has changed their assignment status (accepting assignments or not).
        """
        self.send_json({
            "msg_type": settings.MSG_TYPE_REVIEWERS_SET_STATUS,
            "user_id": event["user_id"],
            "is_accepting_assignments": event["is_accepting_assignments"],
        })

    def tweets_new_tweets(self, event):
        """
        Called when we receive new tweets from the Twitter stream, from backfilling, et cetera.
        """
        self.send_json({
            "msg_type": settings.MSG_TYPE_TWEETS_NEW_TWEETS,
            "tweets": event["tweets"],
            "columnIds": event["columnIds"],
        })

    def tweets_dismiss(self, event):
        """
        Called when someone has dismissed a tweet (set it to be ignored).
        """
        self.send_json({
            "msg_type": settings.MSG_TYPE_TWEETS_DISMISS,
            "tweetId": event["tweetId"],
        })

    def user_change_settings(self, event):
        """
        Called when we receive new tweets from the Twitter stream, from backfilling, et cetera.
        """
        self.user.profile.merge_settings(event["settings"])
        self.user.profile.save()


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
                **{"msg_type": settings.MSG_TYPE_TWEETS_LOAD_TWEETS},
                **fetch_tweets_for_columns(user.profile.settings["column_positions"] or None)
            }
        ]
    }
