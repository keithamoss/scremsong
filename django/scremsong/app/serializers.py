from django.contrib.auth.models import User
from rest_framework import serializers

from scremsong.app.models import Profile, SocialColumns, Tweets, SocialAssignments, TweetReplies, SocialPlatforms


class ProfileSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Profile
        fields = ('is_approved', 'settings')


class UserSerializer(serializers.HyperlinkedModelSerializer):
    is_approved = serializers.BooleanField(source='profile.is_approved')
    settings = serializers.JSONField(source='profile.settings')

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
            # 'url',
            'username',
            'first_name',
            'last_name',
            'name',
            'initials',
            'email',
            'is_staff',
            'is_active',
            'date_joined',
            'groups',
            'is_approved',
            'settings')


class SocialPlatformsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialPlatforms
        fields = ('platform', 'settings')


class ReviewerUserSerializer(UserSerializer):
    profile_image_url = serializers.CharField(source='profile.profile_image_url')
    is_accepting_assignments = serializers.BooleanField(source='profile.is_accepting_assignments')

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'name',
            'initials',
            'profile_image_url',
            'is_accepting_assignments')


class SocialColumnsSerializer(serializers.ModelSerializer):
    platform = serializers.CharField()

    class Meta:
        model = SocialColumns
        fields = (
            'id',
            'platform',
            'search_phrases',
            'assigned_to')


class SocialColumnsSerializerWithTweetCountSerializer(SocialColumnsSerializer):
    total_tweets = serializers.IntegerField(read_only=True)

    class Meta:
        model = SocialColumns
        fields = (
            'id',
            'platform',
            'search_phrases',
            'assigned_to',
            'total_tweets')


class SocialAssignmentSerializer(serializers.ModelSerializer):
    platform = serializers.CharField()
    state = serializers.CharField()
    close_reason = serializers.CharField()
    user_id = serializers.IntegerField()

    class Meta:
        model = SocialAssignments
        fields = (
            'id',
            'platform',
            'social_id',
            'state',
            'close_reason',
            'user_id',
            'thread_relationships',
            'thread_tweets',
            'created_on',
            'last_updated_on',
            'last_read_on')


class TweetsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tweets
        fields = (
            'data',
            'state',
            'column_id')


class TweetRepliesSerializer(serializers.ModelSerializer):
    class Meta:
        model = TweetReplies
        fields = (
            'reply_text',
            'category')
