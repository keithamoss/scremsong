11-03-2021

Unable to get Flower working after hours of trying and hitting many breaking bugs.

- Workers weren't able to be listed (until I fixed an extraneous % that was appearing in my worker names)
- Tasks weren't listed (until I manually pinged the API with an `?offset=0` request)
- Running tasks were unable to be inspected at all ('Unknown task' error - wasn't able to resolve it)
- Quite a few issues on the GitHub page with more bugs related to the recently released Celery 5.x series and just plain "Stuff doesn't work" reports

tl;dr It appears to be a somewhat unstable project. We're going to write our own APIs in Scremsong as we need them and use that to control tasks.
