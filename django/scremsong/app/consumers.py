from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
import json
from scremsong.app.models import SocialPlatformChoice, Tweets, SocialAssignments, SocialAssignmentStatus, Profile
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from scremsong.util import get_env, make_logger

logger = make_logger(__name__)


class ScremsongConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.group_name = 'scremsong_%s' % self.scope['url_route']['kwargs']['group_name']
        self.user = self.scope["user"]

        if self.user.is_anonymous == False and self.user.is_authenticated():
            # Join room group
            async_to_sync(self.channel_layer.group_add)(
                self.group_name,
                self.channel_name
            )

            self.accept()

            # Send a message back to the client on a successful connection
            # self.send_json({"type": "connected", "channel_name": self.channel_name})

            logger.debug('scremsong connect channel=%s group=%s user=%s', self.channel_name, self.group_name, self.user)

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
