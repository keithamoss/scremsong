from django.urls import path

from . import consumers

websocket_urlpatterns = [
    path('api/ws/scremsong/<str:group_name>/', consumers.ScremsongConsumer.as_asgi()),
]
