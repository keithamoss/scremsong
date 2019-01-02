# Generated by Django 2.0.6 on 2018-09-14 07:20

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import scremsong.app.models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('app', '0006_tweets_is_dismissed'),
    ]

    operations = [
        migrations.CreateModel(
            name='SocialAssignments',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('platform', models.TextField(choices=[(scremsong.app.models.SocialPlatformChoice('Twitter'), 'Twitter')])),
                ('social_id', models.TextField(editable=False)),
                ('status', models.TextField(choices=[(scremsong.app.models.SocialAssignmentStatus('Pending'), 'Pending')], default=scremsong.app.models.SocialAssignmentStatus('Pending'))),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
