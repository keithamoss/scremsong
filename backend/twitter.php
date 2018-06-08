<?php
require "../vendor/autoload.php";
require "../secrets.php";

use Abraham\TwitterOAuth\TwitterOAuth;

function getConnectionWithAccessToken($oauth_token, $oauth_token_secret) {
  $connection = new TwitterOAuth(TWITTER_CONSUMER_KEY, TWITTER_CONSUMER_SECRET, $oauth_token, $oauth_token_secret);
  return $connection;
}

$twitterConnection = getConnectionWithAccessToken(TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET);
?>