# Generated by Django 2.1.4 on 2018-12-22 11:30

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0015_remove_tweets_source'),
    ]

    operations = [
        migrations.AddField(
            model_name='tweets',
            name='source',
            field=django.contrib.postgres.fields.jsonb.JSONField(default=['TweetSource.Streaming']),
            preserve_default=False,
        ),
    ]
