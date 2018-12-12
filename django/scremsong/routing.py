from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
import scremsong.app.routing

application = ProtocolTypeRouter({
    # (http->django views is added by default)
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(
                scremsong.app.routing.websocket_urlpatterns
            )
        ),
    ),
})
