from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

# group-name_room-name
WS_GROUP_NAME = "scremsong_scremsong"


def send_channel_message(msg_type, payload):
    if msg_type is not None:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(WS_GROUP_NAME, {
            **{"type": msg_type}, **payload
        })
