var slider = (function() {
    var container = document.querySelector('.volume-slider');
    var knob = container.querySelector('.knob');
    var level = container.querySelector('.level');

    var enabled = true;
    var volume = 0;

    var onchange = function(){};

    var mouseOffset;
    var touchOffset;

    function setValue(val) {

        volume = val;
        knob.style.left = (val * 100) + '%';
        level.style.width = (val * 100) + '%';
        onchange(volume);
    }

    function getMouseOffset(target, e) {
        var x = e.clientX;
        var contWidth = container.clientWidth;
        return x - ((target.style.left.replace('%', '')) / 100) * contWidth;
    }

    function moveKnob(xPos, offset) {
        var knobWidth = knob.clientWidth;
        var contWidth = container.clientWidth;
        var xMove = xPos - offset;
        if (xMove <= 0) {
            xMove = 0;
        }
        if (xMove >= contWidth - knobWidth) {
            xMove = contWidth - knobWidth;
        }

        knob.style.cursor = 'move';
        setValue(xMove / contWidth);
    }

    function onMouseMove(e) {
        if (enabled) {
            e = e || window.event;
            moveKnob(e.clientX, mouseOffset);
            return false;
        }
    }

    function onMouseUp() {
        knob.style.cursor = 'pointer';
        knob = null;
        document.onmousemove = null;
        document.onmouseup = null;
    }

    function onMouseDown(e) {
        e = e || window.event;
        if (e.which != 1) {
            return;
        }
        knob = this;
        mouseOffset = getMouseOffset(this, e);
        document.onmousemove = onMouseMove;
        document.onmouseup = onMouseUp;

        return false;
    }


    knob.onmousedown = onMouseDown;

    knob.addEventListener('touchstart', function(event) {
        if (event.targetTouches.length == 1) {
            var touch = event.targetTouches[0];
            touchOffset = touch.pageX - touch.target.offsetLeft;
        }
    }, false);

    knob.addEventListener('touchmove', function(event) {
        if (event.targetTouches.length == 1) {
            moveKnob(event.targetTouches[0].pageX, touchOffset);
        }
    }, false);

    return {
        enable: function() {
            enabled = true;
        },
        disable: function() {
            enabled = false;
        },
        value: function(arg) {
            if (typeof arg !== 'undefined') {
                var prev = volume;
                setValue(arg);
                return prev;
            } else {
                return volume;
            }
        },
        onchange: function(callback) {
            onchange = callback || function(){};
        }
    }

})();

//# sourceMappingURL=maps/slider.js.map
