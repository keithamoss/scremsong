# Generated by Django 2.1.7 on 2019-03-31 09:25

from django.conf import settings
import django.contrib.postgres.fields.jsonb
import django.core.validators
from django.db import migrations, models
import django.db.models.deletion
import scremsong.app.enums
import scremsong.app.models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='AllowedUsers',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.EmailField(max_length=254, unique=True)),
            ],
        ),
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('profile_image_url', models.URLField()),
                ('is_approved', models.BooleanField(default=False)),
                ('is_accepting_assignments', models.BooleanField(default=False)),
                ('offline_reason', models.TextField(choices=[(scremsong.app.enums.ProfileOfflineReason('Disconnected'), 'Disconnected'), (scremsong.app.enums.ProfileOfflineReason('User Choice'), 'User Choice')], null=True)),
                ('settings', scremsong.app.models.ProfileJSONField(blank=True, default=scremsong.app.models.default_profile_settings)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='SocialAssignments',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('platform', models.TextField(choices=[(scremsong.app.enums.SocialPlatformChoice('Twitter'), 'Twitter')])),
                ('social_id', models.TextField(editable=False)),
                ('state', models.TextField(choices=[(scremsong.app.enums.SocialAssignmentState('Pending'), 'Pending'), (scremsong.app.enums.SocialAssignmentState('Closed'), 'Closed')], default=scremsong.app.enums.SocialAssignmentState('Pending'))),
                ('close_reason', models.TextField(choices=[(scremsong.app.enums.SocialAssignmentCloseReason('Awaiting Reply'), 'Awaiting Reply'), (scremsong.app.enums.SocialAssignmentCloseReason('Map Updated'), 'Map Updated'), (scremsong.app.enums.SocialAssignmentCloseReason('No Change Required'), 'No Change Required'), (scremsong.app.enums.SocialAssignmentCloseReason('Not Relevant'), 'Not Relevant'), (scremsong.app.enums.SocialAssignmentCloseReason('Not Actioned'), 'Not Actioned')], default=None, null=True)),
                ('thread_relationships', django.contrib.postgres.fields.jsonb.JSONField(blank=True, default=None, null=True)),
                ('thread_tweets', django.contrib.postgres.fields.jsonb.JSONField(blank=True, default=None, null=True)),
                ('created_on', models.DateTimeField(auto_now_add=True)),
                ('last_updated_on', models.DateTimeField(auto_now_add=True)),
                ('last_read_on', models.DateTimeField(blank=True, null=True)),
                ('assigned_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assigned_by', to=settings.AUTH_USER_MODEL)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='SocialColumns',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('platform', models.TextField(choices=[(scremsong.app.enums.SocialPlatformChoice('Twitter'), 'Twitter')])),
                ('priority', models.IntegerField(null=True, validators=[django.core.validators.MinValueValidator(1)])),
                ('disabled', models.BooleanField(default=False)),
                ('search_phrases', django.contrib.postgres.fields.jsonb.JSONField(blank=True, default=None)),
                ('assigned_to', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='SocialPlatforms',
            fields=[
                ('platform', models.TextField(choices=[(scremsong.app.enums.SocialPlatformChoice('Twitter'), 'Twitter')], primary_key=True, serialize=False)),
                ('credentials', django.contrib.postgres.fields.jsonb.JSONField(blank=True, default=None, null=True)),
            ],
        ),
        migrations.CreateModel(
            name='TweetReplies',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reply_text', models.TextField()),
                ('category', models.TextField(choices=[(scremsong.app.enums.TweetReplyCategories('Positive Report'), 'Positive Report'), (scremsong.app.enums.TweetReplyCategories('Negative Report'), 'Negative Report'), (scremsong.app.enums.TweetReplyCategories('Thank Yous'), 'Thank Yous')], null=True)),
            ],
        ),
        migrations.CreateModel(
            name='Tweets',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('tweet_id', models.TextField(editable=False, unique=True)),
                ('data', django.contrib.postgres.fields.jsonb.JSONField()),
                ('state', models.TextField(choices=[(scremsong.app.enums.TweetState('Active'), 'Active'), (scremsong.app.enums.TweetState('Dealt With'), 'Dealt With'), (scremsong.app.enums.TweetState('Dismissed'), 'Dismissed'), (scremsong.app.enums.TweetState('Assigned'), 'Assigned'), (scremsong.app.enums.TweetState('Not Actioned'), 'Not Actioned')], default=scremsong.app.enums.TweetState('Active'))),
                ('status', models.TextField(choices=[(scremsong.app.enums.TweetStatus('Ok'), 'Ok'), (scremsong.app.enums.TweetStatus('Dirty'), 'Dirty')])),
                ('source', django.contrib.postgres.fields.jsonb.JSONField(blank=True, default=list)),
                ('column', models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, to='app.SocialColumns')),
            ],
        ),
        migrations.CreateModel(
            name='TwitterRateLimitInfo',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('collected_on', models.DateTimeField(auto_now_add=True)),
                ('data', django.contrib.postgres.fields.jsonb.JSONField()),
            ],
        ),
        migrations.AddIndex(
            model_name='tweets',
            index=models.Index(fields=['source'], name='app_tweets_source_02bee1_idx'),
        ),
        migrations.AddIndex(
            model_name='tweets',
            index=models.Index(fields=['status'], name='app_tweets_status_67c963_idx'),
        ),
        migrations.AlterUniqueTogether(
            name='socialcolumns',
            unique_together={('platform', 'priority')},
        ),
        migrations.AlterUniqueTogether(
            name='socialassignments',
            unique_together={('platform', 'social_id')},
        ),
    ]
