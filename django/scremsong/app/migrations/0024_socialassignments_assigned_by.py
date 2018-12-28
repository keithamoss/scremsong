# Generated by Django 2.1.4 on 2018-12-28 03:48

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('app', '0023_auto_20181227_1006'),
    ]

    operations = [
        migrations.AddField(
            model_name='socialassignments',
            name='assigned_by',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.CASCADE, related_name='assigned_by', to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
    ]
