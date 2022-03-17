Starting Scremsong can be a pain in the posterior. It can involve a lot of tearing out of hair because:

- one of our deps has inevitably changed something in the many months since we last ran it in PROD
- something we install in the Docker container base images has upgraded and that's broken something
- web browsers have changed something that's broken a piece of functionality.
- and so on!

# Tips to make it easier in future

The root of the issue is the highly interlinked nature of the many dependencies. It doesn't take much to break core functionality and we have plenty of time between running Scremsong for a little thing to change that breaks everything.

Well first, nuke all of the local Docker containers, rebuild, and make sure it works locally.

1. Firstly, is the DigitalOcean droplet tagged with `scremsong`? If you don't it can't get to the database.
2. Second, check the logs on the Docker containers: `docker logs --follow --details --timestamps digitalocean-stack_nginx_1` (et cetera)
3. Thirdly, try running the prod containers directly: `docker-compose -f docker-compose-prod-scremsong.yml up`
4. Next, check the logs created by the Scremsong Django (et cetera) application: `tail -f --lines=2000 logs/scremsong-django/scremsong_app_django.log` (et cetera)

# How might we avoid it at all in future?

- Have a proper CI/CD pipeline that actually checks that the API works and that the site can load and render a screen
- Have a UAT site we can deploy to on DigitalOcean instead of breaking PROD
