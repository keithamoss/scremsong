from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
import json
from scremsong.app.models import SocialPlatformChoice, Tweets, SocialAssignments, SocialAssignmentStatus, Profile
from django.conf import settings

# USER_ASSIGNMENT_STATUS_CHANGE = "1"


class ChatConsumer(JsonWebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name

        # Join room group
        # print("> group_add room_group_name={room_group_name} channel_name={channel_name}".format(room_group_name=self.room_group_name, channel_name=self.channel_name))
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

        # Send message back to the client on a successful connection
        # self.send_json({"type": "connected", "channel_name": self.channel_name})

    def disconnect(self, close_code):
        # Leave the group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

        # @TODO Send a message to reviewers_set_status() when they leave

    # Receive message from WebSocket
    def receive_json(self, content):
        print("> receive_json")
        print(content)
        # const payload =
        # message = content['message']

        if content["type"] in self.mappings:
            msg = self.mappings[content["type"]](content)
            # print("> msg")
            # print(msg)

        # if content["type"] == "ealgis/app/SET_IS_USER_ACCEPTING_ASSIGNMENTS":
        #     user_id = int(content["userId"]) if "userId" in content else None
        #     is_accepting_assignments = bool(content["isAcceptingAssignments"]) if "isAcceptingAssignments" in content else None

        #     if user_id is None:
        #         return

        #     profile = Profile.objects.get(user_id=user_id)
        #     profile.is_accepting_assignments = is_accepting_assignments
        #     profile.save()
        #     print("> saved")

        #     msg = {
        #         'type': 'user_assignment_status_change',
        #         'message': content
        #     }
        #     del msg["message"]["type"]

        # # Send message to room group
        # if msg != None:
        #     print("> msg")
        #     print(msg)
        #     msg["type"] = self.mappings2[msg["type"]]
        #     # msg["fromWSClientId"] = self.channel_name
        #     async_to_sync(self.channel_layer.group_send)(
        #         self.room_group_name,
        #         msg
        #     )

    def set_is_user_accepting_assignments(self, event):
        print("> set_is_user_accepting_assignments")
        print(event)

        profile = Profile.objects.get(user_id=event["userId"])
        profile.is_accepting_assignments = event["isAcceptingAssignments"]
        profile.save()

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {**event, **{"type": "user_assignment_status_change"}}
        )
        # return event

        # message = event['message']
        # e = copy.deepcopy(event)
        # del e["type"]

        # Send message to WebSocket
        # self.send_json(event)

    def broadcast(self, event):
        print("> broadcast")
        print(event)
        # event["type"] = event["action_type"]
        # message = event['message']
        # e = copy.deepcopy(event)
        # del e["type"]

        # Send message to WebSocket
        self.send_json(event)

    def ealgis_app_set_is_user_accepting_assignments(self, event):
        print("> ealgis_app_set_is_user_accepting_assignment")
        print(event)
        # message = event['message']
        # e = copy.deepcopy(event)
        # del e["type"]

        # Send message to WebSocket
        self.send_json(event)

    def user_assignment_status_change(self, event):
        print("> user_assignment_status_change")
        print(event)
        # message = event['message']
        # e = copy.deepcopy(event)
        # del e["type"]

        # Send message to WebSocket
        self.send_json(event)

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
            "userId": event["userId"],
            "isAcceptingAssignments": event["isAcceptingAssignments"],
        })
