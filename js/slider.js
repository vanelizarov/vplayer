var slider = (function() {
	var container = document.getElementsByClassName('volume-slider')[0];
	var knob = container.getElementsByClassName('knob')[0];
	var level = container.getElementsByClassName('level')[0];

	var enabled = true;
	var volume = 0;

	var onchange = function(){};

	var mouseOffset;

	function setValue(val) {

		volume = val;
		knob.style.left = (val * 100) + '%';
		level.style.width = (val * 100) + '%';
		onchange(volume);
	}

	function getMouseOffset(target, e) {
		var x = 'ontouchstart' in window ? e.touches[0].clientX : e.clientX;
		var contWidth = container.clientWidth;
		return x - ((target.style.left.replace('%', '')) / 100) * contWidth;
	}

	function onMouseMove(e) {
		if (enabled) {

			e = e || window.event;
			var xPos = 'ontouchstart' in window ? e.touches[0].clientX : e.clientX;
			var knobWidth = knob.clientWidth;
			var contWidth = container.clientWidth;
			var xMove = xPos - mouseOffset;
			if (xMove <= 0) {
				xMove = 0;
			}
			if (xMove >= contWidth - knobWidth) {
				xMove = contWidth - knobWidth;
			}

			knob.style.cursor = 'move';
			setValue(xMove / contWidth);

			return false;
		}
	}

	function onMouseUp() {
		knob.style.cursor = 'pointer';
		knob = null;
		document.onmousemove = null;
		document.ontouchmove = null;
		document.onmouseup = null;
		document.ontouchend = null;
	}

	function onMouseDown(e) {
		e = e || window.event;
		if (e.which != 1) {
			return;
		}
		knob = this;
		mouseOffset = getMouseOffset(this, e);
		document.onmousemove = onMouseMove;
		document.ontouchmove = onMouseMove;
		document.onmouseup = onMouseUp;
		document.ontouchend = onMouseUp;

		return false;
	}

	knob.onmousedown = onMouseDown;
	knob.ontouchstart = onMouseDown;

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

// function getVolume(volume) {
// 	$('.log').text(volume);
// }
//
// slider.onchange(getVolume);
// var prev = slider.value(60);
// console.log(prev);
//# sourceMappingURL=maps/slider.js.map
