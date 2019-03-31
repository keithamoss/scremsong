from django.db.models import Q
from scremsong.app.enums import TweetStatus


def column_search_phrase_to_twitter_search_query(social_column):
    return " OR ".join(social_column.search_phrases)


def apply_tweet_filter_criteria(social_column, queryset):
    return queryset.filter(column_id=social_column.id).filter(status=TweetStatus.OK).filter(data__retweeted_status__isnull=True)
