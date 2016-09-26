
var Player = {
    currentSong: {
        obj: null,
        //artworkSet: false,
        fromSearch: false,
        id: null
    },
    lastId: null,
    setSong: function(options) {
        this.currentSong = options;
    },
    setVolume: function(val) {
        this.currentSong.obj.volume = val;
    },
    paused: function() {
        return this.currentSong.obj.paused;
    },
    play: function(callback) {
        this.stopAll();
        this.currentSong.obj.play();
        if (callback !== null) {
            callback();
        }
    },
    pause: function(callback) {
        this.currentSong.obj.pause();
        if (callback !== null) {
            callback();
        }
    },
    next: function() {
        this.lastId = this.currentSong.id;
        //this.currentSong.artworkSet = false;

        var self = this;

        if (!$($(this.currentSong.obj).parent().next().find('audio')[0]).length) {
            loadMore(function() {
                self.currentSong.obj = $(self.currentSong.obj).parent().next().find('audio')[0];
                self.currentSong.id = $(self.currentSong.obj).attr('id');
                self.play(null);
            });
        } else {
            this.currentSong.obj = $(this.currentSong.obj).parent().next().find('audio')[0];
            this.currentSong.id = $(this.currentSong.obj).attr('id');
            this.play(null);
        }


    },
    prev: function() {
        this.lastId = this.currentSong.id;
        this.currentSong.artworkSet = false;
        this.currentSong.obj = $(this.currentSong.obj).parent().prev().find('audio')[0];
        this.currentSong.id = $(this.currentSong.obj).attr('id');
        this.play(null);
    },
    stopAll: function() {
        $('audio').not($(this.currentSong.obj)).each(function(index, audio) { //
            audio.pause();
            audio.currentTime = 0;
        });
    }
};

function getAssetExtension() {
    return svgeezy.supportsSvg() ? '.svg' : '.png';
}

function switchToPauseState(parent) {
    $(parent).find('.play-button .icon').attr('src', 'assets/pause_glyph' + getAssetExtension());
}

function switchToPlayState(parent) {
    $(parent).find('.play-button .icon').attr('src', 'assets/play_glyph' + getAssetExtension());
}

function changeVolume(volume) {
    if (Player.currentSong.obj !== null) {
        Player.setVolume(volume);
    }
}

var sideMenu = $('.side-menu');

function resetArtwork() {
    sideMenu.find('.artwork').first().attr('src', 'assets/artwork_thumb.png');
    Player.currentSong.artworkSet = false;
}

function toggleCurrentAudio() {
    if (Player.paused()) {
        Player.play(function() {});
        Player.setVolume(slider.value());
    } else {
        Player.pause(function() {});
    }
}

$(document)

    .on('click', '.song-container .play-button', function() {

        var obj = $(this).parent().find('audio')[0];
        var id = $(obj).attr('id');
        var searchResult = $(this).parent().hasClass('search-result');

        Player.setSong({
            obj: obj,
            id: id,
            fromSearch: searchResult
        });

        toggleCurrentAudio();

    })

    .on('click', '.side-menu .play-button', function() {
        toggleCurrentAudio();
    })

    .on('click', '.side-menu .prev-button, .side-menu .next-button', function() {

        if ($(this).attr('class') === 'prev-button') {
            Player.prev();
        } else {
            Player.next();
        }

    })

    .on('click', '.cookies-warning .close-button', function() {
        $(this).parent().hide(200);
    })

    .ready(function() {

        svgeezy.init();

        setTimeout(function() {
            $('.cookies-warning').show(200);
        }, 1000);

        bindEvents();
        $('.search-field').val('');
        $('.menu-switcher').prop('checked', false);

        setTimeout(function() {
            $('.cookies-warning').hide(200);
        }, 15000);

        slider.onchange(changeVolume);
        slider.value(0.6);

    });

function bindEvents() {

    $('audio')
        .on('pause', function() {
            switchToPlayState($(this).parent());
            switchToPlayState(sideMenu);
        })

        .on('play', function() {

            this.volume = slider.value();

            switchToPauseState($(Player.currentSong.obj).parent());
            switchToPauseState(sideMenu);

            var trackObj = [
                $(this).parent().find('.info-wrapper .artist').first().text(),
                $(this).parent().find('.info-wrapper .title').first().text()
            ];

            $('title').text(trackObj.join(' - ') + ' ');

            sideMenu.find('.title').first().text(trackObj[1]);
            sideMenu.find('.artist').first().text(trackObj[0]);

            if (!Player.currentSong.artworkSet) {
                setArtworkURL(trackObj.join(' '));
                Player.currentSong.artworkSet = true;
            }

        })

        .on('timeupdate', function() {
            var self = $(this);
            var parent = self.parent();

            var playProgressCont = parent.find('.play-progress');
            var playedPercentage = (this.currentTime / this.duration) * 100;

            playProgressCont.css('width', playedPercentage + '%');

            if (this.currentTime >= this.duration) {
                resetArtwork();
                Player.next();
            }

        })

        .on('progress', function() {

            if (this.readyState === 4) {
                var self = $(this);
                var parent = self.parent();
                var cacheProgressCont = parent.find('.cache-progress');
                var loadedPercentage = (this.buffered.end(0) / this.duration) * 100;

                cacheProgressCont.css('width', loadedPercentage + '%');
            }

        });

}

function AJAXRequestPOST(URL, data, callback) {
    $.ajax({
        type: 'POST',
        url: URL,
        data: data,
        success: callback
    });
}

function setArtworkURL(term) {
    resetArtwork();
    return AJAXRequestPOST('ajax_artwork.php', 'term=' + term, function(URL) {
        $('.artwork').attr('src', URL);
    });
}

var canLoadMore = true;

$('.search-field')
    .on('input', function(e) {

        if (this.value === '') {
            $('.search-result').remove();
            $('.song-container').show();
            canLoadMore =  true;
        } else {
            canLoadMore = false;
            $('.search-result').remove();
            $('.song-container').hide();
            $('.loader').hide();

            setTimeout(AJAXRequestPOST('ajax_search.php', 'query=' + this.value, function(html) {
                $('.playlist').append(html);
                bindEvents();
            }), 2000);

        }

    })

    .on('keyup keypress', function(e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
            e.preventDefault();
            return false;
        }
    });

// var offset = 0;
//
// $(window).scroll(function() {
//     if ($(document).height() <= $(window).scrollTop() + $(window).height() && canLoadMore) {
//         loadMore(null);
//     }
// });
//
// function loadMore(callback) {
//     $('.loader').show();
//     offset += 30;
//
//     AJAXRequestPOST('ajax_more.php', 'offset=' + offset, function(html) {
//         $('.loader').hide().remove();
//         $('.playlist').append(html);
//         bindEvents();
//         if (callback !== null) {
//             callback();
//         }
//     });
//
// }







//# sourceMappingURL=maps/player.js.map
