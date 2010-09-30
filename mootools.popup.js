// miscellaneous functions
var misc = {};
misc.parseURL = function(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function() {
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
        hash: a.hash.replace('#',''),
        path: a.pathname.replace(/^([^\/])/,'/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
        segments: a.pathname.replace(/^\//,'').split('/')
    };
};


var popup = {
	
	_config: {
		width: 500, // width of inner content
		height: 500, // height of inner content
		fxType: 'zoom', // 
		duration: 500,
		overlayOpacity: 0.7
	},
	init: function() {
		if (!this.initiated) {
			this._insertPopup();
			
			this.overlay.addEvent('click', function(e) {
				this.hide(e);
			}.bind(this));
			
			this.closeBtn.addEvent('click', function(e) {
				this.hide(e);
			}.bind(this));
			
			// bind events for common popup uses
			popup.bindings._init();
			
			this.initiated = true;
		}
	},
	show: function(content, config) {
		this.settings = $merge(this._config, config);
		
		this.init();
		
		var properties = this._getPosition();
		var self = this;
		this.fx[this.settings.fxType]._show(properties, function() {
			if (content) {
				self.popupContent.set('html', content);
			}
		});
	},
	hide: function(e) {
		var self = this;
		this.fx[this.settings.fxType]._hide(function() {
			self.popupContent.set('html', ''); // remove content
			
			// clean up styles after fx's
			self.popupContainer.set('style', '');
			self.popupContent.set('style', '');
			self.overlay.set('style', '');
		});
		e.preventDefault();
	},
	_insertPopup: function() {
		this.popupContainer =  new Element('div', {
			id: 'popup'
		});
		
		this.popupContent = new Element('div', {
			'class': 'popup-content'
		}).inject(this.popupContainer, 'inside');
		
		this.closeBtn = new Element('a', {
			'class': 'close-popup',
			'html': 'Close Popup',
			'href': '#'
		}).inject(this.popupContainer, 'top');
			
		// insert popup after content div and close btn have been inserted (off the dom)
		this.popupContainer.inject($$('body')[0], 'inside');
		
		this.overlay = new Element('div', {
			id: 'overlay'
		}).inject($$('body')[0], 'inside');
	},
	_getPosition: function() {
	
		var width = this.settings.width,
			height = this.settings.height
			viewport = $$('body').getSize(),
			padding = {};
			
			padding.x = parseInt(this.popupContainer.getStyle('padding-left'), 10) + parseInt(this.popupContainer.getStyle('padding-right'), 10);
			padding.y = parseInt(this.popupContainer.getStyle('padding-top'), 10) + parseInt(this.popupContainer.getStyle('padding-bottom'), 10);

		if (width + padding.x > viewport[0].x) {
			width = viewport[0].x - padding.x;
		}
		
		if (height + padding.y > viewport[0].y) {
			height = viewport[0].y - padding.y;
		}

		return {
			width: width,
			height: height,
			leftMargin: (-width - padding.x) / 2,
			topMargin: (-height - padding.y) / 2
		}
	}
};

// effects
popup.fx = {
	standard: {
		_show: function(properties, callback) {
			
			popup.popupContainer.setStyles({
				'margin-left': properties.leftMargin,
				'margin-top': properties.topMargin,
				'display': 'block'
			});	
			
			popup.popupContent.setStyles({
				'width': properties.width,
				'height': properties.height
			});
			
			popup.overlay.setStyles({
				'display': 'block',
				'opacity': popup.settings.overlayOpacity
			});
			
			callback();
		},
		_hide: function(callback) {
			callback();
		}
	},
	fade: {
		_show: function(properties, callback) {
			
			// setup css
			popup.popupContainer.setStyles({
				'margin-left': properties.leftMargin,
				'margin-top': properties.topMargin,
				'display': 'block',
				'opacity': 0
			});	
			
			popup.popupContent.setStyles({
				'width': properties.width,
				'height': properties.height
			});
			
			popup.overlay.setStyles({
				'opacity': 0,
				'display': 'block'
			});
			
			// animate
			var fx1 = new Fx.Tween(popup.popupContainer, {
				property : 'opacity',
				duration : popup.settings.duration
			});
			
			var fx2 = new Fx.Tween(popup.overlay, {
				property : 'opacity',
				duration : popup.settings.duration,
				onComplete: callback
			});
			
			fx1.start(0, 1);
			fx2.start(0, popup.settings.overlayOpacity);
		},
		_hide: function(callback) {
			var fx1 = new Fx.Tween(popup.popupContainer, {
				property : 'opacity',
				duration : popup.settings.duration
			});
			
			var fx2 = new Fx.Tween(popup.overlay, {
				property : 'opacity',
				duration : popup.settings.duration,
				onComplete: callback
			});
			
			fx1.start(1, 0);
			fx2.start(popup.settings.overlayOpacity, 0);
		}
	},
	zoom: {
		_show: function(properties, callback) {

			// container
			popup.popupContainer.setStyles({
				'display': 'block',
				'opacity': 0
			});
			var fx1 = new Fx.Morph(popup.popupContainer, {
				duration : popup.settings.duration,
				transition: Fx.Transitions.Back.easeOut
			});
			
			// overlay
			popup.popupContent.setStyle('display', 'block');
			// inner content
			var fx2 = new Fx.Morph(popup.popupContent, {
				duration : popup.settings.duration,
				transition: Fx.Transitions.Back.easeOut,
				onComplete: callback
			});
			
			// overlay
			popup.overlay.setStyles({
				'display': 'block',
				'opacity': popup.settings.overlayOpacity
			});
			
			fx1.start({'marginLeft': properties.leftMargin, 'marginTop': properties.topMargin, 'opacity': 1});
			fx2.start({'width': properties.width, 'height': properties.height});

		},
		_hide: function(callback) {
			
			var fx1 = new Fx.Morph(popup.popupContainer, {
				duration : popup.settings.duration,
				transition: Fx.Transitions.Back.easeIn
			});
			
			// inner content
			var fx2 = new Fx.Morph(popup.popupContent, {
				duration : popup.settings.duration,
				transition: Fx.Transitions.Back.easeIn,
				onComplete: callback
			});
			
			fx1.start({'marginLeft': 0, 'marginTop': 0, 'opacity': 0});
			fx2.start({'width': 0, 'height': 0});
		}
	}
}

// common uses with event bindings -- iframe, flash, ajax, img etc.
popup.bindings = {

	_init: function() {
		$$('a.iframe').addEvent('click', this._iframe);
		$$('a.flash').addEvent('click', this._flash);
	},
	_iframe: function(e) {
		var params = misc.parseURL(e.target.href).params,
			config = {},
			html;
		
		if (params.w && params.h) {
			config = {
				width: parseInt(params.w, 10),
				height: parseInt(params.h, 10)
			}
		}
		
		html = '<iframe src="' + e.target.href + '" width="100%" height="100%" frameborder="0"></iframe>';
		popup.show(html, config);
		e.preventDefault();
	},
	_flash: function(e) {
		var params = misc.parseURL(e.target.href).params,
			config = {},
			html;
		
		if (params.w && params.h) {
			config = {
				width: parseInt(params.w, 10),
				height: parseInt(params.h, 10)
			}
		}
		
		html = '<object width="100%" height="100%">\
					<param name="movie" value="' + e.target.href + '"></param>\
					<param name="allowFullScreen" value="true"></param>\
					<param name="allowScriptAccess" value="always"></param>\
					<param name="wmode" value="transparent"></param>\
					<embed src="' + e.target.href + '" type="application/x-shockwave-flash" width="100%" height="100%" allowFullScreen="true" allowScriptAccess="always" wmode="transparent"></embed>\
				</object>'
		
		popup.show(html, config);
		e.preventDefault();
	}
};

window.addEvent('domready', function() {
	popup.init();
	/*popup.show('<h1>Mootools popup box</h1>', {
		width: 300,
		height: 100,
		fxType: 'zoom'
	});*/
});