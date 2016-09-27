var app = angular.module('vplayer', []);

app.controller('AppController', function($scope, $rootScope) {

    VK.Auth.getLoginStatus(function(response) {
        if (response.status === 'connected') {
            $rootScope.$emit('vkResponded', response.session.mid);
            $rootScope.$apply(function() {
                $rootScope.vkUserAuthorized = true;
            });
        } else {
            console.log('User not authorized');
            $rootScope.$apply(function() {
                $rootScope.vkUserAuthorized = false;
            });
        }
    });
});

app.controller('AuthController', function($scope, $rootScope) {

    $scope.auth = function() {
        VK.Auth.login(function(response) {
            if (response.status === 'connected') {
                $rootScope.$emit('vkResponded', response.session.mid);
                $rootScope.$apply(function() {
                    $rootScope.vkUserAuthorized = true;
                });
            } else {
                console.log('User not authorized. Abort.');
            }
        }, 65536 + 8);
    };

});

app.controller('PlayerController', function($scope, $rootScope, $sce, $element, $http, $window) {

    $scope.api = VK.Api;

    $scope.tracks = [];

    $scope.audioOffset = 0;
    $scope.audioLoading = true;

    $scope.npAid = -1;
    $scope.npTrack = undefined;

    $scope.npElem = undefined;
    $scope.audioElem = $element[0].querySelector('audio');
    $scope.sideMenuElem = $element[0].querySelector('.side-menu')
    $scope.volumeSlider = slider;
    $scope.volumeSlider.value(0.65);

    $scope.volumeSlider.onchange(function(volume) {
        $scope.audioElem.volume = volume;
    });

    $scope.$watch('npElem', function(newVal, oldVal) {
        //console.log('changed ' + newVal);
        if (typeof oldVal !== 'undefined') {
            var npcImg = oldVal.querySelector('.play-button .icon');
            npcImg.src = 'assets/play_glyph' + $scope.getAssetExtension();
            var npProgress = oldVal.querySelector('.play-progress');
            angular.element(npProgress).css('width', '0');
        }
        $scope.npElem = newVal;
    });

    $scope.$watch('npTrack', function(newVal, oldVal) {
        $scope.npTrack = newVal;
    });

    $scope.setArtwork = function(term, country) {

        country = country || 'RU';

        var smArtwork = $scope.sideMenuElem.querySelector('.artwork');

        $http
            .jsonp('https://itunes.apple.com/search', {
                params: {
                    "callback": "JSON_CALLBACK",
                    "term": term,
                    "country": country
                },
                paramsSerializer: function(param) {
                    return encodeURIComponent(param);
                }
            })
            .success(function(response) {
                if (response.resultCount === 0) {
                    smArtwork.src = 'assets/artwork_thumb.png';
                } else {
                    smArtwork.src = response.results[0].artworkUrl100.replace('100x100', '500x500');
                }
            });

    };

    $scope.nextTrack = function() {
        var npTrackInstance = $scope.tracks.filter(function(t) {
            return t.aid === $scope.npTrack.aid;
        })[0];
        var index = $scope.tracks.indexOf(npTrackInstance);

        if (index !== $scope.tracks.length - 1) {
            $scope.toggleAudio($scope.tracks[index + 1], $scope.npElem.nextElementSibling);
        } else {
            $scope.loadAudio(function() {
                $scope.toggleAudio($scope.tracks[index + 1], $scope.npElem.nextElementSibling);
            });
        }

    };

    $scope.prevTrack = function() {
        var npTrackInstance = $scope.tracks.filter(function(t) {
            return t.aid === $scope.npTrack.aid;
        })[0];
        var index = $scope.tracks.indexOf(npTrackInstance);
        if (index !== 0) {
            $scope.toggleAudio($scope.tracks[index - 1], $scope.npElem.previousElementSibling);
        }

    };

    $scope.toggleAudio = function(track, container) {

        $scope.npElem = container || $scope.npElem;
        $scope.npTrack = track || $scope.npTrack;

        if ($scope.npAid === $scope.npTrack.aid) {

            if (!$scope.audioElem.paused) {
                $scope.audioElem.pause();
            } else {
                $scope.audioElem.play();
            }

        } else {

            $scope.sideMenuElem.querySelector('.artwork').src = 'assets/artwork_thumb.png';
            $scope.sideMenuElem.querySelector('.title').innerText = $scope.npTrack.title;
            $scope.sideMenuElem.querySelector('.artist').innerText = $scope.npTrack.artist;
            $scope.npAid = $scope.npTrack.aid;
            $scope.audioElem.src = $sce.trustAsHtml($scope.npTrack.url);
            $scope.audioElem.setAttribute('title', $scope.npTrack.artist + ' - ' + $scope.npTrack.title);
            $scope.audioElem.play();
            $scope.setArtwork($scope.npTrack.artist + ' ' + $scope.npTrack.title);
            //471745
        }
    };

    $scope.loadAudio = function(callback) {
        //console.log($scope.audioOffset);
        $scope.api.call('audio.get', {
            offset: $scope.audioOffset,
            count: 30,
            user_id: $scope.user.id
        }, function(r) {
            $scope.$apply(function() {
                for (track in r.response) {
                    var newTrack = r.response[track];
                    $scope.tracks.push(newTrack);
                }
                $scope.audioOffset += 30;
                $scope.audioLoading = false;
            });
            callback = callback || function(){};
            callback();
        });
    };

    $scope.getAssetExtension = function() {
        return svgeezy.supportsSvg() ? '.svg' : '.png';
    };

    $rootScope.$on('vkResponded', function(e, id) {
        $scope.api.call('users.get', {
            user_ids: id,
            fields: 'uid,photo_100,first_name,last_name,screen_name'
        }, function(r) {
            $scope.$apply(function() {
                var userData = r.response[0];
                $scope.user = {
                    id: id,
                    href: 'https://vk.com/' + userData.screen_name,
                    photoUrl: userData.photo_100,
                    firstName: userData.first_name,
                    lastName: userData.last_name
                };
                $scope.loadAudio();
            });
        });
    });

    $scope.destruct = function() {
        $scope.tracks = [];
        $scope.audioOffset = 0;
        $scope.npAid = -1;
        $scope.npTrack = undefined;
        $scope.npElem = undefined;
        $scope.audioElem.src = '';

    };

    $scope.logout = function() {
        VK.Auth.logout(function() {
            console.log('User logged out.');
            $rootScope.$apply(function() {
                $rootScope.vkUserAuthorized = false;
                $window.location.reload(true);
            });
        })
    };
});

app.directive('ngPlayer', function() {
    return {
       restrict: 'A',
       controller: function($scope, $element, $attrs) {
           //console.log($scope);
           $element.bind('play', function() {
               var pauseGlyph = 'assets/pause_glyph' + $scope.getAssetExtension();
               var npcIcon = $scope.npElem.querySelector('.play-button .icon');
               var smIcon = $scope.sideMenuElem.querySelector('.play-button .icon');
               npcIcon.src = pauseGlyph;
               smIcon.src = pauseGlyph;
           });

           $element.bind('pause', function() {
               var playGlyph = 'assets/play_glyph' + $scope.getAssetExtension();
               var npcIcon = $scope.npElem.querySelector('.play-button .icon');
               var smIcon = $scope.sideMenuElem.querySelector('.play-button .icon');
               npcIcon.src = playGlyph;
               smIcon.src = playGlyph;
           });

           $element.bind('progress', function() {
               if (this.readyState === 4) {
                   var cacheProgressCont = $scope.npElem.querySelector('.cache-progress');
                   var loadedPercentage = (this.buffered.end(0) / this.duration) * 100;
                   angular.element(cacheProgressCont).css('width', loadedPercentage + '%');
               }
           });

           $element.bind('timeupdate', function() {

               var playProgressCont = $scope.npElem.querySelector('.play-progress');
               var playedPercentage = (this.currentTime / this.duration) * 100;
               angular.element(playProgressCont).css('width', playedPercentage + '%');

               if (this.currentTime >= this.duration) {
                   $scope.nextTrack();
               }

           });

       }
    }
});

app.directive('ngTrack', function() {
    return {
        scope: true,
        restrict: 'A',
        link: function($scope, $element, $attrs) {
            $scope.toggle = function() {
                $scope.$parent.toggleAudio($scope.track, $element[0]);
            };
        },
        templateUrl: 'templates/track.html',
        replace: true
    }
});

app.directive('ngToBottom', function($window, $timeout) {
    return {
        restrict: 'A',
        link: function(scope, elem, attrs) {
            var promise;
            angular.element($window).bind('scroll', function() {
                if (this.scrollY + this.innerHeight >= document.body.scrollHeight) {
                    $timeout.cancel(promise);
                    promise = $timeout(function() {
                        scope.audioLoading = true;
                        scope.$apply(attrs.ngToBottom);
                    }, 60);
                }
            });
        }
    }
});

app.directive('ngBind', function(){
    return {
        compile: function(elem, attrs) {
            attrs.ngBind += '|decode';
        }
    };
});

app.filter('decode', function() {
    return function(text) {
        return angular.element('<div>' + text + '</div>').text();
    };
});




//# sourceMappingURL=maps/app.js.map
