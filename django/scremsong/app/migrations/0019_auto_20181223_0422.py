# Generated by Django 2.1.4 on 2018-12-23 04:22

import django.contrib.postgres.fields.jsonb
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0018_auto_20181223_0420'),
    ]

    operations = [
        migrations.AlterField(
            model_name='tweets',
            name='source',
            field=django.contrib.postgres.fields.jsonb.JSONField(default=list),
        ),
    ]
