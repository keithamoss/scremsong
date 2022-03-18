from django.urls import include, path
from rest_framework import routers

from .views import (CeleryAdminViewset, CurrentUserView, DashboardViewset,
                    LogoutUserView, LogsAdminViewset, ProfileViewSet,
                    ScremsongDebugViewset, SocialAssignmentsViewset,
                    SocialColumnsViewset, SocialPlatformsAuthViewset,
                    TweetsViewset, TwitterRateLimitAdminViewset, UserViewSet,
                    api_not_found)

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'tweets', TweetsViewset, 'Tweets')
router.register(r'social_columns', SocialColumnsViewset, 'SocialColumns')
router.register(r'social_assignments', SocialAssignmentsViewset, 'SocialAssignments')
router.register(r'social_auth', SocialPlatformsAuthViewset, 'SocialPlatformsAuth')
router.register(r'dashboard', DashboardViewset, 'Dashboard')
router.register(r'celery_admin', CeleryAdminViewset, 'CeleryAdmin')
router.register(r'logs_admin', LogsAdminViewset, 'LogsAdmin')
router.register(r'twitter_api_admin', TwitterRateLimitAdminViewset, 'TwitterRateLimitAdmin')
router.register(r'debug', ScremsongDebugViewset, 'ScremsongDebugViewset')
router.register(r'profile', ProfileViewSet, 'ProfileViewSet')

urlpatterns = [
    path('api/0.1/', include(router.urls)),
    path('api/0.1/self', CurrentUserView.as_view(), name='api-self'),
    path('api/0.1/logout', LogoutUserView.as_view(), name='api-logout'),
    # make sure that the API never serves up the react app
    path('api/0.1/.*', api_not_found),
]
