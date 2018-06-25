#!/bin/bash
echo $TRAVIS_COMMIT
echo $TRAVIS_COMMIT_MESSAGE
echo $NOT_TRAVIS_API_KEY
curl -s -X POST -H "Content-Type: application/json" -H "Accept: application/json" -H "Travis-API-Version: 3" -H "Authorization: token $NOT_TRAVIS_API_KEY" -d '{"request": {"branch": "master", "message": "From Scremsong: $TRAVIS_COMMIT - $TRAVIS_COMMIT_MESSAGE"}}' https://api.travis-ci.org/repo/keithamoss%2Fdigitalocean-stack/requests