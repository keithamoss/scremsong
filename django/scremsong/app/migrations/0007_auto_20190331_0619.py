# Generated by Django 2.1.7 on 2019-03-31 06:19

from django.db import migrations, models
import scremsong.app.enums


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0006_auto_20190331_0451'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tweets',
            name='state',
            field=models.TextField(choices=[(scremsong.app.enums.TweetState('Active'), 'Active'), (scremsong.app.enums.TweetState('Dealt With'), 'Dealt With'), (scremsong.app.enums.TweetState('Dismissed'), 'Dismissed'), (scremsong.app.enums.TweetState('Assigned'), 'Assigned'), (scremsong.app.enums.TweetState('Not Actioned'), 'Not Actioned')], default=scremsong.app.enums.TweetState('Active')),
        ),
    ]
