const express = require('express')
const app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);
var SpotifyWebApi = require('spotify-web-api-node');

var currentQueue = [];

app.use('/', express.static('public'));

io.on('connection', function(socket){
  console.log('a user connected');

    socket.on('search', function(data){
        console.log('search term: ' + data);

        spotifyApi.searchArtists(data)
            .then(function(response) {
                socket.emit('artistSrchResp', response);
            }, function(err) {
                console.error(err);
            });
        spotifyApi.searchAlbums(data)
            .then(function(response2) {
                socket.emit('albumSrchResp', response2);
            }, function(err) {
                console.error(err);
            });
        spotifyApi.searchTracks(data)
            .then(function(response3) {
                socket.emit('trackSrchResp', response3);
            }, function(err) {
                console.error(err);
            });      

    });
    socket.on('editQueue', function(req){
        if(req.type == "addSong"){
            currentQueue.push(req.data);
            sendQueue();
        } else if(req.type == "removeSong") {

        } else if(req.type == "moveSong"){
                
        }
    });

    function sendQueue(){
        io.emit('updateQueue', currentQueue);
    }
});

var authorizationCode = 'AQCjbfmpSDfUA8remT2ukDbVFAeVTWhln4aOwSObE8CLrcBPgLiWqif6Xi7qE7d5nBkhUzi_nZh2w20sO7MxtQrYpz0BF8FjxD0cA1mcjeaVhYzkXhFsEu17PldOS2rfFURDIGtGLXscg2vSpmuzTqrAoNXD6FQEKNV0xE6hoiQwy7qU-hmn1UIfIxMBMn0fZwCvL4UnS2sIcrnqaOj-H-wxHwq7BhuCg6EmeFdSvDvtI8YwAaLoF_DuXJ_SJHQh9HaKu_tLp7Zo9bAVWxHSsL_X5qoc84KvuV5tB_d2h0veayNqeEInftXjkpAcemYNbPwxGq6XXg';
var spotifyApi = new SpotifyWebApi({
  clientId : 'fd4b30f8ddd544ba8fcedd8d99e80e50',
  clientSecret : 'c935d0a44207400d994571277722a095',
  redirectUri : 'http://westworld:3000/'
});

clientCodeGrant();

function clientCodeGrant(){
    // Retrieve an access token
    spotifyApi.clientCredentialsGrant()
    .then(function(data) {
        console.log('The access token expires in ' + data.body['expires_in']);
        console.log('The access token is ' + data.body['access_token']);

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
    }, function(err) {
        console.log('Something went wrong when retrieving an access token', err.message);
    });
}

function authCodeGrant(){

    var spotifyTokenExpirationEpoch;

    spotifyApi.authorizationCodeGrant(authorizationCode)
    .then(function(data) {

        // Set the access token and refresh token
        spotifyApi.setAccessToken(data.body['access_token']);
        spotifyApi.setRefreshToken(data.body['refresh_token']);

        // Save the amount of seconds until the access token expired
        spotifyTokenExpirationEpoch = (new Date().getTime() / 1000) + data.body['expires_in'];
        console.log('Retrieved token. It expires in ' + Math.floor(spotifyTokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!');
    }, function(err) {
        console.log('Something went wrong when retrieving the access token!', err.message);
    });

    var numberOfTimesUpdated = 0;

    setInterval(function() {
    console.log('Time left: ' + Math.floor((spotifyTokenExpirationEpoch - new Date().getTime() / 1000)) + ' seconds left!');

    // OK, we need to refresh the token. Stop printing and refresh.
    if (++numberOfTimesUpdated > 5) {
        clearInterval(this);

        // Refresh token and print the new time to expiration.
        spotifyApi.refreshAccessToken()
        .then(function(data) {
            spotifyTokenExpirationEpoch = (new Date().getTime() / 1000) + data.body['expires_in'];
            console.log('Refreshed token. It now expires in ' + Math.floor(spotifyTokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!');
        }, function(err) {
            console.log('Could not refresh the token!', err.message);
        });
    }
    }, 1000);
}


http.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})