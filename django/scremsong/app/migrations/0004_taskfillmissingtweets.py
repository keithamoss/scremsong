# Generated by Django 3.1.7 on 2021-03-12 00:51

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0002_socialplatforms_settings'),
    ]

    operations = [
        migrations.CreateModel(
            name='TaskFillMissingTweets',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('since_id', models.TextField(editable=False, unique=True)),
            ],
        ),
    ]
