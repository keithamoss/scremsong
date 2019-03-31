from scremsong.app.models import SocialColumns


def get_social_columns(platform=None, columnsIds=[]):
    if platform is not None:
        queryset = SocialColumns.objects.filter(platform=platform).filter(disabled=False)

        if len(columnsIds) > 0:
            queryset = queryset.filter(id__in=columnsIds)
        return queryset
    else:
        return SocialColumns.objects.filter(disabled=False).all()
