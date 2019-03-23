# Generated by Django 2.1.7 on 2019-03-23 07:21

from django.db import migrations, models
import scremsong.app.enums


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0037_auto_20190317_1108'),
    ]

    operations = [
        migrations.AddField(
            model_name='socialassignments',
            name='close_reason',
            field=models.TextField(choices=[(scremsong.app.enums.SocialAssignmentCloseReason('Awaiting Reply'), 'Awaiting Reply'), (scremsong.app.enums.SocialAssignmentCloseReason('Map Updated'), 'Map Updated'), (scremsong.app.enums.SocialAssignmentCloseReason('No Change Required'), 'No Change Required'), (scremsong.app.enums.SocialAssignmentCloseReason('Not Relevant'), 'Not Relevant')], default=None, null=True),
        ),
    ]
