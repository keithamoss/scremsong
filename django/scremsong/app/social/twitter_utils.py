from django.db.models import Q


def column_search_phrase_to_twitter_search_query(social_column):
    return " OR ".join(social_column.search_phrases)


# c.f. is_tweet_in_column() in twitter.py
def apply_tweet_filter_criteria(social_column, queryset):
    for phrase in social_column.search_phrases:
        for phrase_part in phrase.split(" "):
            queryset = queryset.filter(Q(data__extended_tweet__full_text__icontains=phrase_part) | Q(data__text__icontains=phrase_part) | Q(data__full_text__icontains=phrase_part))
    return queryset.filter(data__retweeted_status__isnull=True)
