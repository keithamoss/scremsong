from django.db.models import Count

from scremsong.app.models import SocialColumns, Tweets
from scremsong.app.enums import TweetState
from scremsong.app.social.twitter_utils import apply_tweet_filter_criteria


def get_social_columns(platform=None, columnsIds=[]):
    if platform is not None:
        queryset = SocialColumns.objects.filter(platform=platform).filter(disabled=False)

        if len(columnsIds) > 0:
            queryset = queryset.filter(id__in=columnsIds)
        return queryset
    else:
        return SocialColumns.objects.filter(disabled=False).all()


def get_stats_for_column(social_column, sincePastNDays=None):
    baseStats = {str(d): 0 for d in TweetState}

    for state in TweetState:
        baseStats[str(state)] = social_column.total_tweets_for_state(state, sincePastNDays)

    return baseStats
