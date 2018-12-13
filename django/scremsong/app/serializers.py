from django.contrib.auth.models import User
from .models import Profile, SocialColumns, Tweets, SocialAssignments
from rest_framework import serializers


class ProfileSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Profile
        fields = ('is_approved')


class UserSerializer(serializers.HyperlinkedModelSerializer):
    is_approved = serializers.BooleanField(source='profile.is_approved')

    class Meta:
        model = User
        fields = (
            'id',
            # 'url',
            'username',
            'first_name',
            'last_name',
            'email',
            'is_staff',
            'is_active',
            'date_joined',
            'groups',
            'is_approved')


class ReviewerUserSerializer(UserSerializer):
    is_accepting_assignments = serializers.BooleanField(source='profile.is_accepting_assignments')

    name = serializers.SerializerMethodField()
    initials = serializers.SerializerMethodField()

    def get_name(self, obj):
        return "{} {}".format(obj.first_name, obj.last_name)

    def get_initials(self, obj):
        return "{}{}".format(obj.first_name[:1], obj.last_name[:1])

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'name',
            'initials',
            'is_accepting_assignments')


class SocialColumnsSerializer(serializers.ModelSerializer):
    platform = serializers.CharField()

    class Meta:
        model = SocialColumns
        fields = (
            'id',
            'platform',
            'search_phrases')


class SocialColumnsSerializerWithTweetCountSerializer(SocialColumnsSerializer):
    total_tweets = serializers.IntegerField(read_only=True)

    class Meta:
        model = SocialColumns
        fields = (
            'id',
            'platform',
            'search_phrases',
            'total_tweets')


class SocialAssignmentSerializer(serializers.ModelSerializer):
    platform = serializers.CharField()
    status = serializers.CharField()

    class Meta:
        model = SocialAssignments
        fields = (
            'id',
            'platform',
            'social_id',
            'status',
            'user_id')


class TweetsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tweets
        fields = (
            'id',
            'data',
            'is_dismissed')
