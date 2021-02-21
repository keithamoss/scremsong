# Scremsong

![Alex the parrot](https://github.com/keithamoss/scremsong/raw/master/frontend/public/alex.jpg)

# Development

[TypeScript-React-Starter](https://github.com/Microsoft/TypeScript-React-Starter)

# Installation

Scremsong is intended to be run within docker.

To get started:

> docker-compose up

## First time setup

1. Run `docker-compose up db` and run `CREATE SCHEMA "scremsong";`
2. Load CSVs from the `initial-data` folder
   2.1 Load `columns.csv` into `app_socialcolumns`
   2.2 Load `emails.csv` into `app_allowedusers`
   2.3 Load `tweet_replies.csv` into `app_tweetreplies`
3. `yarn install` in `frontend/`
4. Add `127.0.0.1 scremsong.test.democracysausage.org` to `/etc/hosts`
5. Create your self-signed SSL cert (see below)
6. Run `db/scripts/replace-dev-with-prod.sh` to initialise your database with the latest state in PROD and then empty the `app_socialplatforms` table to clear our stored credentials
7. Create a new set of Twitter credentials per the steps in `twitter_auth_step1()` in `views.py`

You're good to go! Navigate to https://scremsong.test.democracysausage.org

### SSL Cert

```
brew install mkcert
mkcert -install
```

```
mkdir keys && cd $_
mkcert wildcard.democracysausage.org
```

# Django Setup

Add a [Python Social Auth](http://python-social-auth.readthedocs.io/en/latest) backend of your choice. e.g. [Social backends](http://python-social-auth.readthedocs.io/en/latest/backends/index.html#social-backends).

Assuming you're configuring Google as a backend for auth:

Refer to [PySocialAuth Google](http://python-social-auth.readthedocs.io/en/latest/backends/google.html) and [Google - Using OAuth 2.0 to Access Google APIs](https://developers.google.com/identity/protocols/OAuth2?csw=1#Registering).

- Create a Web application OAuth 2 Client in the Google API's Console
  - Add `https://localhost:8001` as an **Authorised JavaScript origin**
  - Add `https://localhost:8001/complete/google-oauth2/` as an **Authorised redirect URI**
  - Enable the Google+ API
- Copy `django/web-variables.env.tmpl` to `django/web-varibles.env`
- Add the resulting Client Id and Secret to `django/web-variables.env`
- Nuke and restart your Docker containers
- Navigate to `https://localhost`, choose Google as your signon option, and you should be sent through the Google OAuth flow and end up back at `https://localhost` with your username displayed on the app.

Now you're up and running!

# Becoming An Admin

Making yourself an admin:

Hop into your running `django` Docker container:

`docker exec -i -t scremsong_django_1 sh`

And enter the Django Admin shell:

```
django-admin shell
from django.contrib.auth.models import User
User.objects.all()
user=_[0]
user.is_staff = True
user.is_superuser = True
user.save()
user.profile.is_approved = True
user.profile.save()
```

# DevOps

## Deployment (Actual!)

Choose the next `VERSION` number.

1. `./prodbuild.sh all`
2. `./prodbuild-dockerpush.sh VERSION all`

## Deployment

- AWS S3 hosts the `Public` and `Admin` sites.
- CloudFlare sits in front and handles caching and gives us HTTPS.
- Travis CI handles automatic deploys from GitHub for us.
- Duck CLI to ftp sync the legacy PHP API.

1.  S3 bucket setup for static website hosting, bucket policy set to public, and error document set to `index.html` to let React Router work.
    1.1 A second www.democracysausage.org bucket is setup to redirect requests to https://democracysausage.org
2.  CloudFlare just has default settings except for these Page Rules:
    2.2 api.democracysausage.org/\* Cache Level: Bypass
    2.3 democracysausage.org/static/\* Cache Level: Standard, Edge Cache TTL: A Month (Because S3 sends No Cache headers by default.)
    2.3 democracysausage.org/icons/\* Cache Level: Standard, Edge Cache TTL: A Month (Because S3 sends No Cache headers by default.)
3.  Travis CI setup with default settings to pull from `.travis.yml` with environment variables AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_DEFAULT_REGION, CF_ZONE_ID, CF_EMAIL, CF_API_KEY, FTP_USERNAME, FTP_PASSWORD, FTP_PATH, REACT_APP_MAPBOX_API_KEY_PROD

```json
{
  "Version": "2012-10-17",
  "Id": "PublicBucketPolicy",
  "Statement": [
    {
      "Sid": "Stmt1482880670019",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME_HERE/*"
    }
  ]
}
```

### Continuous Delivery

We've rolled our own CD system using Travis-CI and Digital Ocean's API.

- [Docker Whale in Digital Ocean [or] Automated Continuous Delivery Flow For Simple Projects](https://medium.com/@trekhleb/docker-whale-in-digital-ocean-or-automated-continuous-delivery-flow-for-simple-projects-fbfb2c26bf14) (Ultimately we didn't take this approach because of (a) the Docker Cloud dependency [the fewer third party deps the better] and (b) it wasn't clear if we could do a 100% rock solid CD with Docker Cloud [i.e. Wait until whole stack is up, exfiltrate log files])
- [How To Use Floating IPs on DigitalOcean](https://www.digitalocean.com/community/tutorials/how-to-use-floating-ips-on-digitalocean) (Includes discussion of using Floating IPs for high availability - which we're not doing [yet!])

#### Encrypting Secrets for Travis

Per Travis-CI's documentation on [encrypting multiple files containing secrets](https://docs.travis-ci.com/user/encrypting-files#Encrypting-multiple-files).

```
tar cvf secrets.tar secrets/travis.env secrets/scremsong-frontend.prod.env
travis encrypt-file --force secrets.tar
```

### How to Encrypt/Decrypt SSH Keys for Deployment

As part of deployment of a new droplet we also shutdown and cleanup the old droplet - **but** a key requirement there was archiving the nginx log files in S3. To do that we 'just' need our Python-based deploy script in Travis to be able to SSH into our Droplet and get to the files created by the Dockerised nginx container.

Sounds easy? Yes and no. To cut a long story short - we're using `scp` and Docker volume mapping.

The tricky bit was dealing with the SSH keys. Ultimately we found this comprehensive and well written guide: [How to Encrypt/Decrypt SSH Keys for Deployment on Travis-CI](https://github.com/dwyl/learn-travis/blob/master/encrypted-ssh-keys-deployment.md).

In short, we have:

1.  Created a new passwordless SSH key **only** for use by Travis and our Droplets (aka `deploy_key`)
2.  [Added the public key to our Digital Ocean account](https://www.digitalocean.com/community/tutorials/how-to-use-ssh-keys-with-digitalocean-droplets)
3.  The public keys in our Digital Ocean account are added to the `authorized_keys` file on all droplets we create via `deploy.py`
4.  Used the Travis-CI CLI's `encrypt-file` command to encrypt our private key and embed it in our `.travis.yml` using our [Travis-CI public key](https://docs.travis-ci.com/user/encryption-keys#Encryption-scheme)
5.  Strung a few more commands together (per the aforementioned guide) in `.travis.yml's` `before_install` section that decrypt the key, start the SSH agent, and add the key as our preferred SSH key.
6.  In `docker-compose-prod.yml` we've simply mapped `./logs:/var/log` so we can more easily get at the nginx logs (and others in the future?)
7.  In `deploy.py` when we're shutting down a Droplet we use `subprocess` to call `scp` to SSH into the Droplet and copy the relevant logs out to our Travis-CI server.
8.  Lastly, we rename and datestamp the logs and pop them up into S3.

Phew!

Lessons learned?

Paying for Travis-CI would have let us [just add SSH keys directly via the Web UI](https://docs.travis-ci.com/user/private-dependencies) (at the cost of USD$69/month!)

#### Related Resources

In working out how to do this we ran across quite a few hiccups and "WTF" moments. Here's a collection of useful resources for our own record, and for any brave future explorers how happen upon this readme in search of the same solution.

- [How to Encrypt/Decrypt SSH Keys for Deployment](https://github.com/dwyl/learn-travis/blob/master/encrypted-ssh-keys-deployment.md) (The guide we followed - its GitHub issue is [here](https://github.com/dwyl/learn-travis/issues/42).)
- Related, a [Gist demonstrating how to encrypt keys and secrets in `.travis.yml` files](https://gist.github.com/kzap/5819745)
- Another Gist showing how to [squeeze private SSH key into `.travis.yml` file](https://gist.github.com/lukewpatterson/4242707)
- [Using `subprocess` to run commands and await output](https://stackoverflow.com/a/2502883)

### Hardening Servers

- [Best practices for hardening new sever in 2017](https://www.digitalocean.com/community/questions/best-practices-for-hardening-new-sever-in-2017)
- [7 Security Measures to Protect Your Servers](https://www.digitalocean.com/community/tutorials/7-security-measures-to-protect-your-servers)
- [What do you do with your first five minutes on a new server?](https://www.digitalocean.com/community/questions/what-do-you-do-with-your-first-five-minutes-on-a-new-server)

## SSL and CloudFlare

We're using CloudFlare's neat Origin CA service to secure traffic between our Droplet and CloudFlare. We used [this guide](https://blog.cloudflare.com/cloudflare-ca-encryption-origin/) to implement it. Steps in brief:

1.  Configure `cloud-config-yaml` to install the `cfca` package - CloudFlare's CLI for issuing certificates.
2.  Just before we `docker-compose up` in `cloud-config-yaml` we run `cfca getcert` to grab our cert and key from CloudFlare and deploy it to `/scremsong/app/`.
3.  Nginx is configured per [these instructions](https://support.cloudflare.com/hc/en-us/articles/217471977).
4.  Updated our DigitalOcean Firewall to disallow all traffic on port 80.
5.  Changed our CloudFlare SSL mode from "Flexible" to "Full" to force CF to talk to our droplet over HTTPs.

## Building Docker images

We build and push our Docker images to Docker Hub to speed up our deploy time. If make a change to one of the Dockerfiles you'll need to:

1.  Build, tag, and push a new image to Docker Hub at `version`.

```
docker build -t keithmoss/scremsong-app ./app/
docker tag keithmoss/scremsong-app keithmoss/scremsong-app:`version`
docker push keithmoss/scremsong-app
```

```
docker build -t keithmoss/scremsong-django ./django/
docker tag keithmoss/scremsong-django keithmoss/scremsong-django:`version`
docker push keithmoss/scremsong-django
```

2.  Update `docker-compose-prod.yml` with the new `version` and commit.

3.  Allow the normal deploy process to do its thing - it'll grab the new Docker image from Docker Hub.

(Remember to `docker login` to Docker Hub first.)

## Maintenance

- yarn outdated
- yarn upgrade --latest
- depcheck

**Note::** babel-loader@8.1.0 because CRA needs at least 8.1.0 and react-tweet has (mistakenly) probably got the older version declared as a regular dependency

## Resources

- [Moving a static website to AWS S3 + CloudFront with HTTPS](https://medium.com/@willmorgan/moving-a-static-website-to-aws-s3-cloudfront-with-https-1fdd95563106)
- [Host a Static Site on AWS, using S3 and CloudFront](https://www.davidbaumgold.com/tutorials/host-static-site-aws-s3-cloudfront/)
- [S3 Deployment with Travis](https://renzo.lucioni.xyz/s3-deployment-with-travis/)
- [Setting up a continuously deployed static website with SSL](https://blog.kolibri.is/setting-up-a-continuously-deployed-static-website-with-ssl-39670b37b5c6)
- [Deploying a static site to Github Pages using Travis and Cloudflare](https://jmsbrdy.com/2017/07/deploying-a-static-site-to-github-pages-using-travis-and-cloudflare/)
- [Secure and fast GitHub Pages with CloudFlare](https://blog.cloudflare.com/secure-and-fast-github-pages-with-cloudflare/)
- [How to get your SSL for free on a Shared Azure website with CloudFlare](https://www.troyhunt.com/how-to-get-your-ssl-for-free-on-shared/)
