# Generated by Django 2.1.7 on 2019-03-31 04:51

from django.db import migrations
from scremsong.app.twitter import get_column_for_tweet_with_priority


def migrate_columns_with_priority(apps, schema_editor):
    SocialColumns = apps.get_model("app", "SocialColumns")

    SocialColumns.objects.filter(id=2).update(priority=1)
    SocialColumns.objects.filter(id=1).update(priority=2)
    SocialColumns.objects.filter(id=4).update(priority=3)
    SocialColumns.objects.filter(id=3).update(priority=4)
    SocialColumns.objects.filter(id=6).update(priority=5)
    SocialColumns.objects.filter(id=7).update(priority=6)
    SocialColumns.objects.filter(id=5).update(priority=7)
    SocialColumns.objects.filter(id=9).update(priority=8)
    SocialColumns.objects.filter(id=8).update(priority=9)


def migrate_nuke_column_positions(apps, schema_editor):
    Profile = apps.get_model("app", "Profile")

    for p in Profile.objects.all():
        if "column_positions" in p.settings:
            del p.settings["column_positions"]
            p.save()


def migrate_populate_tweet_column_ids(apps, schema_editor):
    Tweets = apps.get_model("app", "Tweets")

    for t in Tweets.objects.all():
        if t.column_id is None:
            columnId = get_column_for_tweet_with_priority(t)
            if columnId is not None:
                t.column_id = columnId
                t.save()


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0005_socialcolumns_disabled'),
    ]

    operations = [
        migrations.RunPython(migrate_populate_tweet_column_ids),
        migrations.RunPython(migrate_nuke_column_positions),
        migrations.RunPython(migrate_columns_with_priority)
    ]
