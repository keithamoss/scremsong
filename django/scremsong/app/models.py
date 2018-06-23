import json
from django.db import models
from django.contrib.postgres.fields import JSONField
from django.contrib.auth.models import User
from django.apps import apps
from model_utils import FieldTracker
from scremsong.util import make_logger
import hashlib
import copy

logger = make_logger(__name__)


# Create your models here.
class CompilationError(Exception):
    pass


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    is_approved = models.BooleanField(default=False)

    tracker = FieldTracker()

    def __str__(self):
        return self.user.username
