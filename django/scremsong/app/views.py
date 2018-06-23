from django.contrib.auth.models import User, AnonymousUser
from django.contrib.auth import logout
from django.db.models import Q
from django.http.response import HttpResponse
from django.core.cache import cache
# from .models import MapDefinition

from rest_framework import viewsets, mixins, status
from rest_framework.views import APIView
from rest_framework.decorators import detail_route, list_route
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
# from .permissions import AllowAnyIfPublicSite, IsAuthenticatedAndApproved, IsMapOwnerOrReadOnly, IsMapOwner, CanViewOrCloneMap

from .serializers import UserSerializer, ProfileSerializer

import time
import copy
import urllib.parse
import json
import csv
from django.http import HttpResponseNotFound
# from ealgis_common.db import broker
# from ealgis.mvt import TileGenerator
# from ealgis.ealauth.admin import is_private_site


def api_not_found(request):
    return HttpResponseNotFound()


class CurrentUserView(APIView):
    def get(self, request):
        if request.user.is_authenticated:
            serializer = UserSerializer(
                request.user, context={'request': request}
            )

            return Response({
                "is_logged_in": True,
                "user": serializer.data
            })
        else:
            return Response({
                "is_logged_in": False,
                "user": None
            })


class LogoutUserView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        logout(request)
        return Response({})


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    permission_classes = (IsAdminUser,)
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer


class ProfileViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows user profiles to be viewed or edited.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = ProfileSerializer

    def get_queryset(self):
        return self.request.user.profile


# class ColoursViewset(viewsets.ViewSet):
#     """
#     API endpoint that returns available colours scale for styling.
#     """
#     permission_classes = (IsAuthenticated,)

#     def list(self, request, format=None):
#         with open('/app/contrib/colorbrewer/ColorBrewer_all_schemes_RGBonly3.csv') as f:
#             reader = csv.reader(f)
#             header = next(reader)

#             colours = []
#             for row in reader:
#                 # Break out before we get to the license embedded in the CSV file
#                 if row[0] == "" and row[4] == "":
#                     break
#                 colours.append(row)

#             response = Response({"header": header, "colours": colours})
#             return response
