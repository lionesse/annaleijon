jQuery(document).ready(function($) {

	var my_nav = $('.navbar-sticky'); 
	if (!my_nav.length) { return; } // sidor utan fast meny, t.ex. 404
	// grab the initial top offset of the navigation 
	var sticky_navigation_offset_top = my_nav.offset().top;
	
	// our function that decides weather the navigation bar should have "fixed" css position or not.
	var sticky_navigation = function(){
		var scroll_top = $(window).scrollTop(); // our current vertical position from the top
		
		// if we've scrolled more than the navigation, change its position to fixed to stick to top, otherwise change it back to relative
		if (scroll_top > sticky_navigation_offset_top) { 
			my_nav.addClass( 'stick' );
		} else {
			my_nav.removeClass( 'stick' );
		}   
	};

	var initio_parallax_animation = function() { 
		$('.parallax').each( function(i, obj) {
			var speed = $(this).attr('parallax-speed');
			if( speed ) {
				var background_pos = '-' + (window.pageYOffset / speed) + "px";
				$(this).css( 'background-position', 'center ' + background_pos );
			}
		});
	}
	
	// run our function on load
	sticky_navigation();
	
	// and run it again every time you scroll
	$(window).scroll(function() {
		 sticky_navigation();
		 initio_parallax_animation();
	});

});

/* Live-räknare: visar hur många som läst på annaleijon.se de senaste 30 minuterna.
   Data: live.json på grenen live-data, uppdateras av GitHub Actions (.github/workflows/live-counter.yml).
   Visas bara om antalet är minst 5 och datan är högst 45 minuter gammal. */
(function () {
	var MIN = 5, MAX_AGE_MS = 45 * 60 * 1000;
	var SRC = 'https://raw.githubusercontent.com/lionesse/annaleijon/live-data/live.json';
	var CSS = '.live-counter{font-family:"Open Sans",sans-serif;font-size:13px;line-height:1.4;color:#555;font-style:normal}' +
		'.live-counter:before{content:"";display:inline-block;width:8px;height:8px;margin-right:7px;border-radius:50%;background:#2fb344;box-shadow:0 0 0 3px rgba(47,179,68,.18);vertical-align:1px}' +
		'.live-counter--badge{position:fixed;right:20px;bottom:20px;z-index:99;background:#fff;padding:8px 14px;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.12)}' +
		'@media (max-width:767px){.live-counter--badge{right:10px;bottom:10px;font-size:11px;padding:6px 11px;white-space:nowrap;max-width:calc(100% - 20px);overflow:hidden;text-overflow:ellipsis}.live-counter--badge:before{margin-right:6px}}';
	function show(n) {
		var style = document.createElement('style');
		style.appendChild(document.createTextNode(CSS));
		document.head.appendChild(style);
		var el = document.createElement('span');
		el.setAttribute('role', 'status');
		el.textContent = n + ' personer har läst på annaleijon.se den senaste halvtimmen';
		el.className = 'live-counter live-counter--badge';
		document.body.appendChild(el);
	}
	function run() {
		if (!window.fetch || !window.JSON) return;
		fetch(SRC, { cache: 'no-store' })
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (d) {
				if (!d || typeof d.active !== 'number' || d.active < MIN) return;
				var t = Date.parse(d.updated);
				if (!t || Date.now() - t > MAX_AGE_MS) return;
				show(Math.floor(d.active));
			})
			.catch(function () {});
	}
	try {
		if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
		else run();
	} catch (e) {}
})();
