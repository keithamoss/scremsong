# Release Process

## Scremsong

1. Bump versions in package.json, Django VERSIONS file and commit to GitHub
2. Run prodbuild.sh to create new Django container and new frontend+django static assets
3. Run prodbuild-release.sh to tag and push the Django container to Docker Hub and version (rename) and stash the frontend assets

## DigitalOcean Stack

4. Run prodbuild.sh 'version' to create a new Django container using the given set of static assets
5. Run prodbuild-release.sh to tag and push the NGINX container to Docker Hub
6. Bump the container versions in docker-compose.yml and commit to GitHub
7. Login to the server and run redeploy.sh to git pull, docker-compose pull, et cetera (Steal from EALGIS. Bounce the stack.)
