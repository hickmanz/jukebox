var playlistShown = true;
var windowState
var currentResults = {};
var recentList 
var playerTimer
var player = {
    volume: 0,
    currentPlaying: null,
    position: 0,
    duration:0,
    playback: null
}

$(function () {

    var socket = io();

    var searchBox = document.getElementById('query')
    var searchTimeout = null;
    
    //init visual
    $(".artist-holder-row").hide();
    $("#search-outter").hide();
    $("#recent-outter").hide();
    $(".track-holder-row").hide();
    $(".album-holder-row").hide();
    $(".icon-pause").hide();

    $('.statusBar-holder').click(function(e) {
        var posX = e.pageX - $(this).offset().left + 1
        var percent = posX / $(this).width()
        var songPosition = player.duration * percent
        $("#statusBar-full").css('left', -100 + (percent *100) + '%');
        player.position = songPosition
        socket.emit('scrub', songPosition)
    });

    $(".icon-skip-forward").click(function(){
        socket.emit('next-song')
    })
    $(".icon-skip-back").click(function(){
        socket.emit('previous-song')
    })
    $(".icon-pause").click(function(){
        socket.emit('pause')
        $(".icon-pause").hide();
        $(".icon-play").show();
    })
    $(".icon-play").click(function(){
        socket.emit('play')
        $(".icon-pause").show();
        $(".icon-play").hide();
    })
    searchBox.onkeyup = function (e) {
        // Clear the timeout if it has already been set.
        // This will prevent the previous task from executing
        // if it has been less than <MILLISECONDS>
        clearTimeout(searchTimeout);
    
        // Make a new timeout set to go off in 800ms
        searchTimeout = setTimeout(function () {
            socket.emit('search', searchBox.value);
        }, 800);
    };

    $('form').submit(function(){
      socket.emit('search', searchBox.val());
      searchBox.blur();
      return false;
    });

    $('#track-list').on('click', 'div.add i', function() {
        var req = {};
        req.type = "addSong";
        showtoast('Song added!')
        req.data = currentResults.tracks[this.getAttribute('data-index')];
        socket.emit('editQueue', req);
    });
    $('#track-list').on('click', 'div.preview i', function(e) {
        var req = {};
        req.type = "previewSong";
        req.data = this.getAttribute('data-trackid');
        socket.emit('preview', req);
    });
    $('#recent-track-list').on('click', 'div.add i', function() {
        var req = {};
        req.type = "addSong";
        showtoast('Song added!')
        req.data = recentList[this.getAttribute('data-index')].track;
        socket.emit('editQueue', req);
    });
    $('#recent-track-list').on('click', 'div.preview i', function(e) {
        var req = {};
        req.type = "previewSong";
        req.data = this.getAttribute('data-trackid');
        socket.emit('preview', req);
    });
    socket.on('test',function(data){
        console.dir(data);
    });
    socket.on('updateQueue', function(queue){
        console.dir(queue)
        $(".queue").empty();
        for (var i=0; i < queue.length; i++) {
            var li = $("<li />");
            li.html(getPlaylistDiv(queue[i]));
            li.attr("data-trackid", queue[i].id);
            $(".queue").append(li);
        }
    });
    socket.on('update-player', function(data){
        //check if song is the same
        if(player.currentPlaying !== null){
            if(data.currentPlaying !== null){
                if(player.currentPlaying.id == data.currentPlaying.id){
                    player = data
                    updatePlayerTime()
                    //same song so dont update pics and stuff
                    //update time
                } else {
                    player = data
                    updatePlayer()
                    updatePlayerTime()
                    //uodate all
                }

            }
        } else {
            player = data
            updatePlayer()
            updatePlayerTime()
            //uodate all
            //update all
        }
        if(player.state == "playing"){
            $(".icon-pause").show();
            $(".icon-play").hide();
        } else {
            $(".icon-pause").hide();
            $(".icon-play").show();
        }
    })
    socket.on('recently-played', function(data){
        var tracks = data.body.items;
        recentList = tracks

        $("#recent-track-list").empty();

        $(".track-holder-row").show();

        var div = $("<li />");
        div.html('<li class="track-row top-row"><div class="add"></div><div class="preview"></div><div class="title">TITLE</div><div class="artist">ARTIST</div><div class="album">ALBUM</div><div class="duration"><i class="icon-clock"></i></div><div class="popularity"><i class="icon-heart"></i></div></li>');
        $("#recent-track-list").append(div);
        console.dir(tracks)
        for (var i=0; i < tracks.length; i++) {
            var li = $("<li />");
            li.html(getTrackDiv(tracks[i].track, i));
            $("#recent-track-list").append(li);
        }
    })
    socket.on('artistSrchResp',function(data){
        var i;
        var artists = data.body.artists.items;

        $("#artist-holder-inner").empty();

        currentResults.artists = artists;

        if (artists.length < 5){
            i = artists.length;
        } else {
            i = 9;
        }

        if (i > 0){
            $(".artist-holder-row").show();
        } else {
            $(".artist-holder-row").hide();
        }
        for (var k=0; k < i; k++) {
            var div = $("<div />");
            div.html(getArtistDiv(artists[k]));
            $("#artist-holder-inner").append(div);
        }
    });
    socket.on('trackSrchResp',function(data){
        var tracks = data.body.tracks.items;

        $("#track-list").empty();

        currentResults.tracks = tracks;

        $(".track-holder-row").show();

        var div = $("<li />");
        div.html('<li class="track-row top-row"><div class="add"></div><div class="preview"></div><div class="title">TITLE</div><div class="artist">ARTIST</div><div class="album">ALBUM</div><div class="duration"><i class="icon-clock"></i></div><div class="popularity"><i class="icon-heart"></i></div></li>');
        $("#track-list").append(div);

        for (var i=0; i < tracks.length; i++) {
            var li = $("<li />");
            li.html(getTrackDiv(tracks[i], i));
            $("#track-list").append(li);
        }
    });
    socket.on('albumSrchResp',function(data){
        var i;
        var albums = data.body.albums.items;

        $("#album-holder-inner").empty();

        currentResults.albums = albums;

        if(albums.length < 5){
            i = albums.length;
        } else {
            i = 9;
        }

        if (i > 0){
            $(".album-holder-row").show();
        } else {
            $(".album-holder-row").hide();
        }

        for (var k=0; k < i; k++) {
            var div = $("<div />");
            div.html(getAlbumDiv(albums[k]));
            $("#album-holder-inner").append(div);
        }
    });
    socket.on('previewData', function(trackData){
        var a = new Audio(trackData.body.tracks[0].preview_url);
        a.play();
    })
    $('#search').click(function () { // When arrow is clicked
        if (playlistShown == true){
            showSearch()
        } else if (windowState == "search"){
            showPlaylist()
        } else {
            showSearch()
        }
    });
    $('#recent').click(function () { // When arrow is clicked
        socket.emit('get-recently-played')
        if (playlistShown == true){
            showRecent()
        } else if (windowState == "recent"){
            showPlaylist()
        } else {
            showRecent()
        }
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


function updatePlayer(){
    if(player.currentPlaying == null){

    } else {
        var imageUrl
        var artists = "";
        if (player.currentPlaying.album.images.length < 0){
            imageUrl = "";
        } else {
            imageUrl = player.currentPlaying.album.images[0].url;
        }
        for (i=0; i < player.currentPlaying.artists.length; i++){
            if (i < player.currentPlaying.artists.length - 1){
                artists += player.currentPlaying.artists[i].name + ", "; 
            } else {
                artists += player.currentPlaying.artists[i].name
            }
        }
        $('.current-song-background').css('background-image', 'url(' + imageUrl + ')');
        $(".current-song-content .artwork").attr('src', imageUrl);
        $(".current-song-content .song-name").text(player.currentPlaying.name)
        $(".current-song-content .song-artist").text(artists)
        $("#endTime").text(msToTime(player.duration))
    }
}
function updatePlayerTime(){
    clearInterval(playerTimer)
    if (player.state == "playing"){
        playerTimer = setInterval(function(){  updateStatusBar() }, 500);
    }     
}
function updateStatusBar(){
    player.position += 500
    var percentFinished
    var startTime
    percentFinished = -100 + (( player.position/player.duration ) * 100)
    startTime = msToTime(player.position)
    $("#currentTime").text(startTime)
    $("#statusBar-full").css('left', percentFinished + '%');

}
function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    if(hours == 0){
        minutes = (minutes < 10) ? "" + minutes : minutes;

        return minutes + ":" + seconds

    } else {
        return hours + ":" + minutes + ":" + seconds
    }
}
function showSearch() {
    windowState = "search"
    $("#search-outter").show();
    $("#recent-outter").hide();
    $(".menu-expand-holder").addClass("expand");
    $(".current-song-holder").addClass("collapse");
    searchBox.focus()
    playlistShown = false;
}
function showRecent() {
    windowState = "recent"
    $("#search-outter").hide();
    $("#recent-outter").show();
    $(".menu-expand-holder").addClass("expand");
    $(".current-song-holder").addClass("collapse");
    playlistShown = false;
}
function showPlaylist() {
    windowState == "playlist"
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


    return '<li class="track-row"><div class="add"><i class="icon-plus" data-type="track" data-index=' + index + '></i></div><div class="preview"><i class="icon-headphones" data-type="track" data-trackid=' + data.id + '></i></div><div class="title">' + data.name + '</div><div class="artist">' + artists + '</div><div class="album">' + data.album.name + '</div><div class="duration">' + duration + '</div><div class="popularity">' + data.popularity + '</div></li>';
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

function ToastBuilder(options) {
    // options are optional
    var opts = options || {};
    
    // setup some defaults
    opts.defaultText = opts.defaultText || 'default text';
    opts.displayTime = opts.displayTime || 3000;
    opts.target = opts.target || 'body';
  
    return function (text) {
      $('<div/>')
        .addClass('toast')
        .prependTo($(opts.target))
        .text(text || opts.defaultText)
        .queue(function(next) {
          $(this).css({
            'opacity': 1
          });
          var bottomOffset = 15;
          $('.toast').each(function() {
            var $this = $(this);
            var height = $this.outerHeight();
            var offset = 8;
            $this.css('bottom', bottomOffset + 'px');
  
            bottomOffset += height + offset;
          });
          next();
        })
        .delay(opts.displayTime)
        .queue(function(next) {
          var $this = $(this);
          var width = $this.outerWidth() + 20;
          $this.css({
            'right': '-' + width + 'px',
            'opacity': 0
          });
          next();
        })
        .delay(600)
        .queue(function(next) {
          $(this).remove();
          next();
        });
    };
  }
  
  // customize it with your own options
  var myOptions = {
    defaultText: 'Toast, yo!',
    displayTime: 3000,
    target: '.content-holder'
  };
    //position: 'top right',   /* TODO: make this */
    //bgColor: 'rgba(0,0,0,0.5)', /* TODO: make this */
  
  // to get it started, instantiate a copy of
  // ToastBuilder passing our custom options
  var showtoast = new ToastBuilder(myOptions);
  
  // now you can fire off a toast just calling
  // our new instance passing a string, like this:
  // showtoast('hello, world!');
  
});