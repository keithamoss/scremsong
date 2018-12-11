from django.conf.urls import url

from . import consumers

websocket_urlpatterns = [
    url(r'^ws/scremsong/(?P<group_name>[^/]+)/$', consumers.ScremsongConsumer),
]
