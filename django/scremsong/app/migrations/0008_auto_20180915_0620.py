# Generated by Django 2.0.6 on 2018-09-15 06:20

from django.db import migrations, models
import scremsong.app.models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0007_socialassignments'),
    ]

    operations = [
        migrations.AlterField(
            model_name='socialassignments',
            name='status',
            field=models.TextField(choices=[(scremsong.app.models.SocialAssignmentStatus('Pending'), 'Pending'), (scremsong.app.models.SocialAssignmentStatus('Processed'), 'Processed'), (scremsong.app.models.SocialAssignmentStatus('Done'), 'Done')], default=scremsong.app.models.SocialAssignmentStatus('Pending')),
        ),
    ]
