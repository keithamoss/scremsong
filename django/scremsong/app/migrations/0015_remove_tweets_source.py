# Generated by Django 2.1.4 on 2018-12-22 11:28

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0014_auto_20181222_1127'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='tweets',
            name='source',
        ),
    ]
