'use strict';
const $ = document.querySelector.bind(document);
const $$ = document.querySelectorAll.bind(document);

const player = $('.player');
const audio = $('#audio');
const MainView = $('.main_view');
//Buttons
const btnStop = $('.btn_stop');
const btnPlay = $('.btn_play');
const btnPause = $('.btn_pause');
const btnPauseIco = $('.btn_pause p');
const btnNext = $('.btn_next');
const btnPrev = $('.btn_prev');
const btnRandom = $('.btn_random');
//Playlist
const playlistHeader = $('.playlist thead');
const playlist = $('.playlist tbody');
//Left panel
const LeftPanel = $('.left_panel');
const ThumbImg = $('.thumbnail');
const playlistSelector = $('.playlist_selector');
const playlistSelectorHeader = $('.playlist_selector_header');
//Control panel
const ControlPWrapper = $('.control_wrapper');
const ControlP = $('.controls');
const CPCurrentPlay = $('.cur_play');
const CPTimeStr = $('.track_time');
const CPplayOrderWrapper = $('.play_order_wrapper');
const CPplayOrder = $('.play_order');
const CPprogress = $('.progress');
const CPVolumeWrapper = $('.volume_wrapper');
const CPVolume = $('.volume');
const CPVolumeStr = $('.volume_caption');
//Status bar
const statusBar = $('.status_bar');
//Right click context menu
const rMenu = $('.rmenu');
const rMenuShareBtn = $('.rmenu_sharebtn');
const tooltip = $('.tooltip');
//Waiting spinner
const WaitSpinner = $('.sWait');

//Links for AJAX
const urlPlaylists = 'https://localhost/music/playlist/';
const urlTranscode = 'https://localhost/music/transcode.php';
const urlMain = 'https://localhost/music/';

//Mobile part
const bMobileAgent = /iPhone|iPod|Android|Mobile/i.test(navigator.userAgent);
let touchStartX = 0

let touchEndX = 0
let viewport = 0; // 0 - Playlist selector, 1 - Playlist, 2 - Current track

const musicplayer = {
bPlaying: false,
bStopped: true,
bRandom: false,
bRepeat: false,
bWait: false,
bMobile: false,
playlist_limit: 120,
playlist_offset: 0,
playlist_max: 0,
currentIndex: 0,
currentSongId: 0,
currentPlaylist: 0,
rMenuSelection: 0,
songs: 0,
//Draw playlist
playlistRender() {
    playlist.innerHTML = "";
    this.songs.forEach((song, index) => {
        //album information
        if (song.tracknumber == 1) {
            let rowAlbum = playlist.insertRow();

            rowAlbum.classList.add('album_start');

            let image = document.createElement("img");

            image.src = fixedEncodeURIComponent(song.directoryname) + '/cover.jpg';

            image.onerror = function () { this.src =  'images/cover_min.svg'} ;

            let imgCell = rowAlbum.insertCell();

            imgCell.appendChild(image);

            let descCell = rowAlbum.insertCell() 

            let ul = document.createElement("ul");

            //descDiv.innerHTML = song.album;

            let artistInfo = document.createElement("li");

            artistInfo.innerHTML = song.artist;

            artistInfo.classList.add('album_artistInfo');

            let albumInfo = document.createElement("li");

            albumInfo.innerHTML = song.album;

            albumInfo.classList.add('album_albumInfo');

            let dateInfo = document.createElement("li");

            dateInfo.innerHTML = song.date;

            dateInfo.classList.add('album_dateInfo');

            ul.appendChild(artistInfo)

            ul.appendChild(albumInfo);

            ul.appendChild(dateInfo)

            descCell.appendChild(ul);

        }
        //songs
        var row = playlist.insertRow();
        row.setAttribute("data-index", index);
        row.setAttribute("data-id", song.playlist_item);
        row.setAttribute("data-cuesheet", song.cuesheet)
        if (this.currentSongId == song.playlist_item)
            row.classList.add('active');
               
        row.insertCell().innerHTML = song.length;
        row.insertCell().innerHTML = song.artist + ' - ' + song.album;
        let trackCell = row.insertCell();
        trackCell.innerHTML = song.tracknumber;
        if (song.cuesheet == 1)
            trackCell.classList.add('cuesheet');
        if (song.album_artist)
            if (this.bMobile == 1)
                row.insertCell().innerHTML = song.title + ' </br> ' + song.album_artist;
            else
                row.insertCell().innerHTML = song.title + ' // ' + song.album_artist;
        else
            row.insertCell().innerHTML = song.title;
        row.insertCell().innerHTML = song.bitrate + 'kbps';
        row.insertCell().innerHTML = song.codec;
        row.insertCell().innerHTML = song.date;
    });
},

handleEvents() {
    const _this = this;
    // Stop current song
    btnStop.onclick = function () {
          audio.pause();  
          audio.currentTime = 0;
          CPprogress.value = 0;
        _this.bStopped = true;
    };
    // Play current song
    btnPlay.onclick = function () {
        if (_this.bPlaying == false) {
            _this.loadCurrentSong();
                _this.bStopped = false;    
      }
    };
    // Pause current song (on mobile it's work as Play/Pause)
    btnPause.onclick = function () {
        if (_this.bPlaying == true && _this.bStopped == false) {
            _this.bPlaying = false;
            audio.pause();

        }
        else if (_this.bPlaying == false && _this.bStopped == false) {
            audio.play();

            _this.bPlaying = true;

        }
        else if (_this.bPlaying == false && _this.bStopped == true) {
            _this.loadCurrentSong();

            _this.bStopped = false;

        }
        //Mobile behavior
        if (_this.bMobile)
            if (_this.bPlaying == true) {
                btnPauseIco.classList.add('icon-pause');

                btnPauseIco.classList.remove('icon-play');

            }
            else {
                btnPauseIco.classList.remove('icon-pause');

                btnPauseIco.classList.add('icon-play');

            }
    
    };
    // Play random song
    btnRandom.onclick = function () {
        _this.playRandomSong(); 
        _this.playlistRender();
        _this.bPlaying = true;
        _this.bStopped = false;
        audio.play();
    };
    // Check current mode
    CPplayOrder.onchange = function () {
        let dropDown_sel = this.options[this.selectedIndex].text;
        _this.bRandom = false;
        _this.bRepeat = false;
        if (dropDown_sel == 'Random')
            _this.bRandom = true;
        if (dropDown_sel == 'Repeat (playlist)')
            _this.bRepeat = true;
    }
    // When next song
    btnNext.onclick = function () {
        if (_this.bRandom) {
            _this.playRandomSong();
        } else {
            _this.nextSong();
        }
        _this.bPlaying = true;
        _this.bStopped = false;
    };
    // When prev song
    btnPrev.onclick = function () {
        if (_this.bRandom) {
            _this.playRandomSong();
        } else {
            _this.prevSong();
        }
        _this.bPlaying = true;
        _this.bStopped = false;
    };

    // Handle next song when audio ended
    audio.onended = function () {
        if (_this.bRepeat) {
            audio.play();
        } else {
            audio.pause();
            btnNext.click();
        }
    };
    // When the song is played
    audio.onplay = function () {
      _this.bPlaying = true;
        player.classList.add('playing');

    };
    // When the song is pause
    audio.onpause = function () {
      _this.bPlaying = false;
      player.classList.remove('playing');
    };
    // When the song progress changes
    audio.ontimeupdate = function () {
      if (audio.duration) {
        const progressPercent = Math.floor(
          (audio.currentTime / audio.duration) * 100
        );
        CPprogress.value = progressPercent;
          document.title = _this.songs[_this.currentIndex].album_artist + ' - ' + _this.songs[_this.currentIndex].title;
          CPTimeStr.textContent = Math.floor(audio.currentTime / 60) + ":";
          CPTimeStr.textContent += Math.floor(audio.currentTime % 60) + "/";
          CPTimeStr.textContent += _this.songs[_this.currentIndex].length.substring(3);
          // TODO: need better view for this (format should include zeroing for example 00:xx/00:xx)
      }
    };
   // Handling when seek
    CPprogress.oninput = function (e) {
      const seekTime = (audio.duration / 100) * e.target.value;
      audio.currentTime = seekTime;
    };
    // Volume control
    CPVolume.oninput = function (e) {
        audio.volume = e.target.value;
        CPVolumeStr.textContent = parseFloat((e.target.value * 100).toPrecision(2));
        _this.setCookie("volume", audio.volume, 7);
    };
    // Listen to playlist clicks
    playlist.onclick = function (e) {
        const songNode = e.target.closest('tr:not(.active)');
        if (songNode) {
            // Handle when clicking on the song
                if (songNode.classList.contains('album_start')) //ignore album row
                    return;
                _this.currentIndex = Number(songNode.dataset.index);
                _this.currentSongId = Number(songNode.dataset.id);
                if (_this.songs[_this.currentIndex].cuesheet == 0) {
                    _this.loadCurrentSong();
                    _this.playlistRender();
                    _this.bPlaying = true;
                    _this.bStopped = false;
                    audio.play();

               }
                else // need transcoding
                {
                    _this.bPlaying = true;
                    _this.bStopped = false;
                    _this.loadCurrentSong();
                    _this.playlistRender();

                }
            // Mobile behavior
            if (_this.bMobile)
                if (_this.bPlaying == true) {
                    btnPauseIco.classList.add('icon-pause');

                    btnPauseIco.classList.remove('icon-play');

                }
                else {
                    btnPauseIco.classList.remove('icon-pause');

                    btnPauseIco.classList.add('icon-play');

                }
            
        }
    };
    // Right click handler
    playlist.oncontextmenu = function (e) {
        rMenu.classList.add("rmenu_show");

        rMenu.style.top = e.pageY + 'px';

        rMenu.style.left = e.pageX + 'px';

        e.preventDefault();
        const songNode = e.target.closest('tr');
        if (songNode)
            _this.rMenuSelection = Number(songNode.dataset.id);
    };
    // Context menu share button
    rMenuShareBtn.onclick = function (e) {
        if (_this.rMenuSelection != 0) {
            var shareLink = document.createElement('input');
            document.body.appendChild(shareLink);
            shareLink.value = urlMain + '?song=' + _this.rMenuSelection + '&playlist=' + _this.currentPlaylist;
            shareLink.select();
            shareLink.setSelectionRange(0, 99999);
            navigator.clipboard.writeText(shareLink.value);

            document.body.removeChild(shareLink);

            tooltip.style.top = e.pageY + 'px';

            tooltip.style.left = e.pageX + 'px';

            tooltip.classList.add('tooltip_show');

            tooltip.innerHTML = 'Link successfully copied to clipboard';

            

            if(timer)

            clearTimeout(timer);

            var timer = setTimeout(function () {

                tooltip.classList.remove('tooltip_show');

            }, 3e3);        

        }
    };
    },
    // Focus on current song (can be buggy, because of refresh of playlist table)
      focusToActiveSong() {
        setTimeout(() => {
          $('tr.active').scrollIntoView({
            behavior: 'smooth',
              block: 'center',
          });
        }, 300);
      },
    loadCurrentSong() {
        CPCurrentPlay.textContent = this.songs[this.currentIndex].album_artist + ' - ' + this.songs[this.currentIndex].title;
        // TODO: for thumbnail need to check other format of files and names like folder.jpg or cover.png.
        ThumbImg.style.backgroundImage = `url('${fixedEncodeURIComponent(this.songs[this.currentIndex].directoryname) + '/cover.jpg'}')`;
        // Check if it's browser compatable format
        if (this.songs[this.currentIndex].cuesheet == 0)
            audio.src = this.songs[this.currentIndex].path;
        else // Send to transcoding function
            TranscodeAudio(this.currentPlaylist, this.songs[this.currentIndex].playlist_item);
        // Allow OS handle audio in browser

        if ('mediaSession' in navigator) {

            navigator.mediaSession.metadata = new MediaMetadata({

                title: musicplayer.songs[musicplayer.currentIndex].title,

                artist: musicplayer.songs[musicplayer.currentIndex].artist,

                album: musicplayer.songs[musicplayer.currentIndex].album_artist,

                artwork: [

                    { src: musicplayer.songs[musicplayer.currentIndex].directoryname + '/cover.jpg' },

                ]

            });
        }
        this.setCookie("currentloc", this.currentSongId, 7);
        this.focusToActiveSong();
        // Check mobile view
        if (this.bMobile) {
            viewport = 2; //current track

            this.mobileViewRefresh(viewport)

        }
    },
    // TODO: need smooth animation or full rework of this
    mobileViewRefresh(in_viewport) {

        if (in_viewport == 0) { // playlist selector
            ControlP.classList.add('hide');
            LeftPanel.classList.remove('hide');
            playlist.classList.remove('mobile');
            playlist.classList.add('hide');

            ThumbImg.classList.remove('mobile');

            ThumbImg.classList.add('hide');

            playlistSelector.classList.add('mobile');

            playlistSelector.classList.remove('hide');
            playlistSelectorHeader.classList.add('mobile');

            playlistSelectorHeader.classList.remove('hide');

        }
        else if (in_viewport == 1) //playlist
        {
            ControlP.classList.add('hide');
            LeftPanel.classList.add('hide');
            playlist.classList.remove('hide');
            playlist.classList.add('mobile');

            ThumbImg.classList.remove('mobile');

            ThumbImg.classList.add('hide');

            playlistSelector.classList.add('hide');

            playlistSelector.classList.remove('mobile');

        }
        else // current song
        {
            ControlP.classList.remove('hide');
            LeftPanel.classList.remove('hide');
            playlist.classList.remove('mobile');
            playlist.classList.add('hide');

            ThumbImg.classList.remove('hide');

            ThumbImg.classList.add('mobile');

            playlistSelector.classList.add('hide');

            playlistSelector.classList.remove('mobile');

            playlistSelectorHeader.classList.add('hide');

            playlistSelectorHeader.classList.remove('mobile');

        }
        
    },
    // Play previous song
      prevSong() {
          this.currentIndex--;
          this.currentSongId--;
          if (this.currentIndex <= 0) {
            // Get new part of playlist
              musicplayer.playlist_offset -= (musicplayer.playlist_limit / 4);
              this.currentIndex = (musicplayer.playlist_limit / 4);
              if (musicplayer.playlist_offset < 0)
                  musicplayer.playlist_offset = 0;
              GetSongsFromPlaylist(musicplayer.currentPlaylist, 'play');

              musicplayer.playlistRender();
        }
          if (this.currentSongId < 0) {
              this.currentSongId = this.playlist_max - 1;
          }
          this.loadCurrentSong();
          this.playlistRender();
        },
    // Play next song
    nextSong() {
        this.currentIndex++;
        this.currentSongId++;
    if (this.currentIndex >= this.songs.length-1) {
        this.currentIndex = (musicplayer.playlist_limit / 4)*3;
        musicplayer.playlist_offset += (musicplayer.playlist_limit / 4);
        if (musicplayer.playlist_offset > musicplayer.playlist_limit) 

            musicplayer.playlist_offset -= (musicplayer.playlist_limit / 4);
        GetSongsFromPlaylist(musicplayer.currentPlaylist, 'play');

        musicplayer.playlistRender();
    }
        // Get current SongId
        if (this.currentSongId > (this.playlist_limit)) {
            this.currentIndex = this.playlist_limit / 2; //60
            musicplayer.playlist_offset = this.currentSongId - ((this.playlist_limit / 2) + 1); //-61
            GetSongsFromPlaylist(musicplayer.currentPlaylist, 'play');

        } else {
        this.loadCurrentSong();
        this.playlistRender();

        }
        if (this.currentSongId >= this.playlist_max) {
            this.currentSongId = 0;
        }     
    },
    // Playing random song
    playRandomSong() {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * this.playlist_max);
        } while (newIndex === this.currentSongId);

        this.currentSongId = newIndex;
        if (newIndex >= 1)
            this.playlist_offset = newIndex - 1; // wrong can offset can be not line up with index
        else
            this.playlist_offset = 0;
        this.currentIndex = 0;
        GetSongsFromPlaylist(this.currentPlaylist, 'play');
    },
    // Saving cookies
    setCookie(name, value, days) {

        var expires = "";

        if (days) {

            var date = new Date();

            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));

            expires = "; expires=" + date.toUTCString();

        }

        document.cookie = name + "=" + (value || "") + expires + "; path=/";

    },
    // Loading cookies
    getCookie(name) {

        var nameEQ = name + "=";

        var ca = document.cookie.split(';');

        for (var i = 0; i < ca.length; i++) {

            var c = ca[i];

            while (c.charAt(0) == ' ') c = c.substring(1, c.length);

            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);

        }

        return null;

    },
// Initialization function
start() {
    // Handling events (DOM events)
    this.handleEvents();
    // Load playlist selector
    GetPlaylist();
    // Load cookies
    var volumeValue = this.getCookie("volume");
    var curPlaylist = this.getCookie("currentplaylist");
    var curOffset = this.getCookie("currentloc");
    if (curOffset)
        this.playlist_offset = curOffset - 1;
    if (curPlaylist)
        this.currentPlaylist = curPlaylist;
    else
        this.currentPlaylist = 1;
    if (volumeValue) {
        audio.volume = volumeValue;
        CPVolume.value = volumeValue;
        CPVolumeStr.textContent = parseFloat((volumeValue * 100).toPrecision(2));
    }
    // Check GET params (sharing tracks)
    const urlParams = new URLSearchParams(window.location.search);

    const urlplaylist = urlParams.get('playlist');
    let urlsong = null;
    if (urlplaylist)
        urlsong = urlParams.get('song');
    if (urlplaylist && urlsong) {
        this.currentSongId = urlsong;
        this.currentPlaylist = urlplaylist;
        this.playlist_offset = urlsong - 1;
        this.currentIndex = 0;
        window.history.pushState(null, null, window.location.pathname);
        GetMaxTracks(this.currentPlaylist);
        this.setCookie("currentplaylist", this.currentPlaylist, 7);
        GetSongsFromPlaylist(urlplaylist, 'play');

    }
    else {
        this.currentIndex = 1;
        if (curOffset)
            this.currentSongId = curOffset;
        else
            this.currentSongId = 0;
        GetMaxTracks(this.currentPlaylist);
        GetSongsFromPlaylist(this.currentPlaylist); //default



    }
    //Check if mobile device
    if (navigator.maxTouchPoints >= 1 && bMobileAgent == 1)
        this.bMobile = true;
    if (this.bMobile) {

        ControlP.classList.add('mobile');

        btnStop.style.display = "none";

        btnPlay.style.display = "none";

        CPplayOrderWrapper.style.display = "none";

        //Change pause button icon to play on start

        btnPauseIco.classList.remove('icon-pause');

        btnPauseIco.classList.add('icon-play');

        playlistHeader.classList.add('hide');//hide by default if it's mobile

        statusBar.classList.add('hide');

        MainView.classList.add('mobile');

        ControlPWrapper.classList.add('mobile');
        this.bStopped = false;

        if (this.currentPlaylist == '0')

            viewport = 0; //  select playlist

        else

            viewport = 1; // playlist

        this.mobileViewRefresh(viewport);

    }
       
},
};

musicplayer.start();

function SwitchPlaylist(id) {
    let index;
    try { //click on element

        index = this.dataset.index;
        musicplayer.currentSongId = 1;
        musicplayer.setCookie("currentplaylist", index, 7);
    }
    catch (err) { // scroll
        index = id;
    }
    musicplayer.playlist_offset = 0;
    GetMaxTracks(index);

    GetSongsFromPlaylist(index);

}
//Get available playlists
async function GetPlaylist() {
    WaitSpinner.classList.add('spinner');
    let data = [
        {
            getplaylists: '1'
        }];
    let Response = await fetch(urlPlaylists, {

        method: 'POST',

        headers: {

            'Content-Type': 'application/json',

        },

        body: JSON.stringify(data),

    });

    let Result = await Response.json();
    let ResultArray = Result.map(name => name);

    ResultArray.forEach((arr) => {
        var li = document.createElement("li");

        li.appendChild(document.createTextNode(arr.name));

        li.setAttribute("data-index", arr.id);

        li.classList.add('playlist_selector_line');

        li.addEventListener("click", SwitchPlaylist);

        playlistSelector.appendChild(li);
    });
    WaitSpinner.classList.remove('spinner');
}
//Get songs list from playlist
async function GetSongsFromPlaylist(id, type) {
    WaitSpinner.classList.add('spinner');
    let index;
    try { //click on element

        index = this.dataset.index;
        musicplayer.currentSongId = 1;
        musicplayer.setCookie("currentplaylist", index, 7);
    }
    catch (err) { // scroll
        index = id;
    }
    let data = [
        {
            getplaylist: index,
            limit: musicplayer.playlist_limit,
            offset: musicplayer.playlist_offset,
        }];
    let Response = await fetch(urlPlaylists, {

        method: 'POST',

        headers: {

            'Content-Type': 'application/json',

        },

        body: JSON.stringify(data),

    });

    musicplayer.songs = await Response.json();
    musicplayer.currentPlaylist = index;
    musicplayer.playlistRender();
    if (type == 'play') {
        musicplayer.loadCurrentSong();

        musicplayer.focusToActiveSong();

    }
    if ('mediaSession' in navigator) {
        navigator.mediaSession.setActionHandler('nexttrack', () => btnNext.click());

        navigator.mediaSession.setActionHandler('previoustrack', () => btnPrev.click());
    }

    statusBar.innerHTML = 'Items in playlist : ' + musicplayer.playlist_max;

    WaitSpinner.classList.remove('spinner');

}

//Get max amount of tracks
async function GetMaxTracks(playlistId) {
    let data = [
        {
            getplaylistSongsCount: playlistId,
        }];

    let Response = await fetch(urlPlaylists, {

        method: 'POST',

        headers: {

            'Content-Type': 'application/json',

        },

        body: JSON.stringify(data),

    });

    let jsonRes = await Response.json();

    musicplayer.playlist_max = jsonRes[0].count;
}
//Track transcoding
async function TranscodeAudio(playlistId, songId) {
    musicplayer.bWait = true;
    WaitSpinner.classList.add('spinner');
    let data = [
        {
            playlist_id: playlistId,
            song_id: songId,
        }];
    let Response = await fetch(urlTranscode, {

        method: 'POST',

        headers: {

            'Content-Type': 'application/json',

        },

        body: JSON.stringify(data),

    });

    let Result = await Response.json();
    audio.src = Result.path;
    musicplayer.bPlaying = true;
    musicplayer.bStopped = false;
    audio.play();
    WaitSpinner.classList.remove('spinner');
    musicplayer.bWait = false;
}

var lastTime = 0;
playlist.onscroll = function (e) {
    
    const timeFrame = 100;
    var now = new Date();
    if (now - lastTime >= timeFrame) {
        //Check if scroll down
        if (e.target.scrollHeight - (e.target.scrollTop + e.target.offsetHeight) <= 300) {
            musicplayer.playlist_offset += (musicplayer.playlist_limit / 4);
            if (musicplayer.playlist_offset > musicplayer.playlist_max)
                musicplayer.playlist_offset = musicplayer.playlist_max - musicplayer.playlist_limit;
            GetSongsFromPlaylist(musicplayer.currentPlaylist);    

            musicplayer.playlistRender();

            e.target.scrollTop -= 500;

        }
        //Check if scroll up
        if (e.target.scrollTop <= 300 && (musicplayer.playlist_offset != 0)) {
            if (musicplayer.playlist_offset > musicplayer.playlist_limit) {

                musicplayer.playlist_offset -= (musicplayer.playlist_limit / 4);

                if (musicplayer.playlist_offset < 0)
                    musicplayer.playlist_offset = 0;

                e.target.scrollTop += 500;

            }          
            else
                musicplayer.playlist_offset = 0;

            GetSongsFromPlaylist(musicplayer.currentPlaylist);

            musicplayer.playlistRender();

        }
        lastTime = now;
    }
};
//Helper function
function fixedEncodeURIComponent(str) {

    return encodeURIComponent(str).replace(

        /[!'()*]/g,

        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,

    );

}


//Right click context menu
document.onclick = hideMenu;

function hideMenu() {

    rMenu.classList.remove("rmenu_show");

    musicplayer.rMenuSelection = 0;

}
//correct playlist height size
function ResizePlaylist() {
    playlist.style.height = (document.documentElement.clientHeight - (ControlP.clientHeight + statusBar.clientHeight + playlistHeader.clientHeight + 1)) + 'px';

};
window.onresize = function () {
    ResizePlaylist();

};
window.onload = function(){

    ResizePlaylist();

};

//Swipe detect

function checkDirection() {

    if (musicplayer.bMobile) {

        if (touchEndX + 200 < touchStartX) { //swipe to right       

            viewport++;

            if (viewport >= 2)

                viewport = 2;

            musicplayer.mobileViewRefresh(viewport);

        }

        if (touchEndX - 200 > touchStartX) { //swipe to lefyt

            viewport--;

            if (viewport <= 0)

                viewport = 0;

            musicplayer.mobileViewRefresh(viewport);

        }

    }

}

document.addEventListener('touchstart', e => {

    touchStartX = e.changedTouches[0].screenX;

})

document.addEventListener('touchend', e => { 

    touchEndX = e.changedTouches[0].screenX;

    checkDirection();

})

