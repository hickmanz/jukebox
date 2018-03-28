var playlistShown = true;
var currentResults = {}; 

$(function () {

    var socket = io();

    $('form').submit(function(){
      socket.emit('search', $('#query').val());
      $('#query').blur();
      return false;
    });

    $('#track-list').on('click', 'div.add i', function() {
        var req = {};
        req.type = "addSong";
        req.data = currentResults.tracks[this.getAttribute('data-index')];
        socket.emit('editQueue', req);
    });
    socket.on('test',function(data){
        console.dir(data);
    });
    socket.on('updateQueue', function(queue){
        $(".queue").empty();
        for (var i=0; i < queue.length; i++) {
            var li = $("<li />");
            li.html(getPlaylistDiv(queue[i]));
            li.attr("data-trackid", queue[i].id);
            $(".queue").append(li);
        }
    });
    socket.on('artistSrchResp',function(data){
        var i;
        var artists = data.body.artists.items;

        currentResults.artists = artists;

        if(artists.length < 5){
            i = artists.length;
        } else {
            i = 9;
        }

        for (var k=0; k < i; k++) {
            var div = $("<div />");
            div.html(getArtistDiv(artists[k]));
            $("#artist-holder-inner").append(div);
        }
    });
    socket.on('trackSrchResp',function(data){
        var tracks = data.body.tracks.items;

        currentResults.tracks = tracks;

        var div = $("<li />");
        div.html('<li class="track-row top-row"><div class="add"></div><div class="preview"></div><div class="title">TITLE</div><div class="artist">ARTIST</div><div class="album">ALBUM</div><div class="duration"><i class="icon-clock"></i></div><div class="popularity"><i class="icon-heart"></i></div></li>');
        $("#track-list").append(div);

        for (var i=0; i < tracks.length; i++) {
            var li = $("<li />");
            li.html(getTrackDiv(tracks[i], i));
            $("#track-list").append(li);
        }
        console.dir(data);
    });
    socket.on('albumSrchResp',function(data){
        var i;
        var albums = data.body.albums.items;

        currentResults.albums = albums;

        if(albums.length < 5){
            i = albums.length;
        } else {
            i = 9;
        }

        for (var k=0; k < i; k++) {
            var div = $("<div />");
            div.html(getAlbumDiv(albums[k]));
            $("#album-holder-inner").append(div);
        }
        console.dir(data);
    });
    $('#search').click(function () { // When arrow is clicked
        showSearch();
    });
    $('.current-song-content').click(function () { // When arrow is clicked
        if(playlistShown == false){
            showPlaylist();
        }
    });
    $( "#sortable" ).sortable({
        start: function(e, ui) {
            // creates a temporary attribute on the element with the old index
            $(this).attr('data-previndex', ui.item.index());
        },
        update: function(e, ui) {
            // gets the new and old index then removes the temporary attribute
            var newIndex = ui.item.index();
            var oldIndex = $(this).attr('data-previndex');
            var req = {};
            req.type = "moveSong";
            req.data = {};
            req.data.newIndex = newIndex;
            req.data.oldIndex = oldIndex;
            req.data.trackId = ui.item.data('trackid');
            socket.emit('editQueue', req);
            $(this).removeAttr('data-previndex');

        }
    });
    $( "#sortable" ).disableSelection();
});

function showSearch() {
    $(".menu-expand-holder").addClass("expand");
    $(".current-song-holder").addClass("collapse");
    playlistShown = false;
}

function showPlaylist() {
    $(".menu-expand-holder").removeClass("expand");
    $(".current-song-holder").removeClass("collapse");
    playlistShown = true;
}

function getArtistDiv(data){
    var i = data.images.length - 2;
    var imageUrl
    if (i < 0){
        imageUrl = "";
    } else {
        imageUrl = data.images[i].url;
    }
    return `<div class="artist-holder"><div class="picture" style="background-image: url('` + imageUrl + `')"></div>` + data.name + `</div>`;
}
function getAlbumDiv(data){
    var i = data.images.length - 2;
    var imageUrl
    var artists = "";
    if (i < 0){
        imageUrl = "";
    } else {
        imageUrl = data.images[i].url;
    }
    for (i=0; i < data.artists.length; i++){
        if (i < data.artists.length - 1){
            artists += data.artists[i].name + ", "; 
        } else {
            artists += data.artists[i].name
        }
    }
    return `<div class="album-holder"><div class="picture" style="background-image: url('` + imageUrl + `')"></div><div class="album">` + data.name + `</div><div class="artist">` + artists + `</div></div>`;
}
function getTrackDiv(data, index){
    var artists = "";
    for (i=0; i < data.artists.length; i++){
        if (i < data.artists.length - 1){
            artists += data.artists[i].name + ", "; 
        } else {
            artists += data.artists[i].name
        }
    }

    var min = Math.floor((data.duration_ms/1000/60) << 0);
    var sec = Math.floor((data.duration_ms/1000) % 60);
    var duration = min + ':' + sec;

    return '<li class="track-row"><div class="add"><i class="icon-plus" data-type="track" data-index=' + index + '></i></div><div class="preview"><i class="icon-headphones"></i></div><div class="title">' + data.name + '</div><div class="artist">' + artists + '</div><div class="album">' + data.album.name + '</div><div class="duration">' + duration + '</div><div class="popularity">' + data.popularity + '</div></li>';
}
function getPlaylistDiv(data){
    var imageUrl
    var artists = "";
    if (data.album.images.length < 0){
        imageUrl = "";
    } else {
        imageUrl = data.album.images[0].url;
    }
    for (i=0; i < data.artists.length; i++){
        if (i < data.artists.length - 1){
            artists += data.artists[i].name + ", "; 
        } else {
            artists += data.artists[i].name
        }
    }

    return `<img class="artwork" src="` + imageUrl + `"/>
                <div class="details">
                    <div class="description">
                        <div class="song-name">
                            ` + data.name + `
                        </div>
                        <div class="song-artist">
                            ` + artists + `
                        </div>
                    </div>
                </div>`;
}