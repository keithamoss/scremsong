# Generated by Django 2.0.6 on 2018-07-15 07:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('app', '0005_auto_20180715_0501'),
    ]

    operations = [
        migrations.AddField(
            model_name='socialplatforms',
            name='pid',
            field=models.IntegerField(null=True),
        ),
        migrations.AlterField(
            model_name='socialplatforms',
            name='active_app_uuid',
            field=models.CharField(editable=False, max_length=36, null=True),
        ),
    ]
