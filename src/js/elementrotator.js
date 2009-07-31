/**
* The ElementRotator widget provides a simple mechanism for cycling
* through a set of elements with fade transitions. It is intended for
* elements of the same size, e.g. banner images.
*
* The widget will optionally sync transitions with the visitor's clock
* and/or persistently keep track of the currently shown element, so that
* the transitions are uniform even if the visitor reloads the page or
* navigates to another page with the same widget.
*
* @module elementrotator
* @requires yahoo, dom, event, element, cookie, animation
*/
(function() {
	
	// Shortcuts
	var Lang = YAHOO.lang,
		Dom = YAHOO.util.Dom,
		Element = YAHOO.util.Element,
		Cookie = YAHOO.util.Cookie,
		Anim = YAHOO.util.Anim;
	
	/**
	* The ElementRotator class
	*
	* @namespace YAHOO.BLARGON.widget
	* @class ElementRotator
	* @extends YAHOO.util.Element
	* @constructor
	* @param {String | HTMLElement} ctr Container element
	* @param {Object} cfg Configuration object
	*/
	function ElementRotator(ctr, cfg) {
		cfg = cfg || {};
		// Call parent
		ElementRotator.superclass.constructor.call(this, ctr, cfg);
		
		/**
		* Array of HTML elements
		* @property _elements
		* @private
		* @type Array
		*/
		this._elements = [];
		
		/**
		* Current element index
		* @property _current
		* @private
		* @type Number
		*/
		this._current = 0;
	}
	
	/**
	* Default configuration settings
	* @property _CONFIG_DEFAULTS
	* @private
	* @static
	* @final
	* @type Object
	*/
	ElementRotator._CONFIG_DEFAULTS = {
		SHOW_DURATION: { key: 'show_duration', value: 5 },
		FADE_DURATION: { key: 'fade_duration', value: 1 },
		CLOCK_SYNC: { key: 'clock_sync', value: false },
		COOKIE_PERSIST: { key: 'cookie_persist', value: false },
		COOKIE_NAME: { key: 'cookie_name', value: 'elementrotator' },
		COOKIE_SETTINGS: { key: 'cookie_settings', value: { path: '/' } }
	};
	
	/**
	* Sub-cookie names
	* @property _COOKIES
	* @private
	* @static
	* @final
	* @type Object
	*/
	ElementRotator._COOKIES = {
		CURRENT: 'current'
	};
	
	var _CONFIG = ElementRotator._CONFIG_DEFAULTS,
		_COOKIES = ElementRotator._COOKIES;
	
	Lang.extend(ElementRotator, Element,
		{
			/**
			* Initializes configuration attributes
			* @method initAttributes
			* @param {Object} cfg Configuration object
			*/
			initAttributes: function(cfg) {
				// Call parent
				ElementRotator.superclass.initAttributes.call(this, cfg);
				
				/**
				* Duration each element is shown, in seconds
				* @attribute show_duration
				* @type Number
				* @default 10
				*/
				this.setAttributeConfig(_CONFIG.SHOW_DURATION.key, { value: _CONFIG.SHOW_DURATION.value, validator: Lang.isNumber });
				
				/**
				* Duration of fade transition, in seconds
				* @attribute fade_duration
				* @type Number
				* @default 1
				*/
				this.setAttributeConfig(_CONFIG.FADE_DURATION.key, { value: _CONFIG.FADE_DURATION.value, validator: Lang.isNumber });
				
				/**
				* Synchronize transitions with user's clock.
				* @attribute clock_sync
				* @type Boolean
				* @default false
				*/
				this.setAttributeConfig(_CONFIG.CLOCK_SYNC.key, { value: _CONFIG.CLOCK_SYNC.value, validator: Lang.isBoolean });
				
				/**
				* Keep track of currently shown element with cookie
				* @attribute cookie_persist
				* @type Boolean
				* @default false
				*/
				this.setAttributeConfig(_CONFIG.COOKIE_PERSIST.key, { value: _CONFIG.COOKIE_PERSIST.value, validator: Lang.isBoolean });
				
				/**
				* Cookie name
				* @attribute cookie_name
				* @type String
				* @default ElementRotator
				*/
				this.setAttributeConfig(_CONFIG.COOKIE_NAME.key, { value: _CONFIG.COOKIE_NAME.value, validator: Lang.isString });
				
				/**
				* Cookie settings (domain, path, etc.)
				* @attribute cookie_settings
				* @type Object
				* @default { path: '/' }
				*/
				this.setAttributeConfig(_CONFIG.COOKIE_SETTINGS.key, { value: _CONFIG.COOKIE_SETTINGS.value, validator: Lang.isObject });
				
				this.setAttributes(cfg, true);
			},
			
			/**
			* Initializes current element index from cookie, if cookies are being used
			* @method _initCurrent
			* @private
			* @return {Number} Current element index
			*/
			_initCurrent: function() {
				if(this.get(_CONFIG.COOKIE_PERSIST.key)) {
					var name = this.get(_CONFIG.COOKIE_NAME.key),
						current = Cookie.getSub(name, _COOKIES.CURRENT, Number);
					
					if(current) {
						this._current = current;
					}
				}
				
				return this._current;
			},
			
			/**
			* Increments current element index and updates cookie, if cookies are being used
			* @method _advanceCurrent
			* @private
			* @return {Number} New current element index
			*/
			_advanceCurrent: function() {
				this._current = (this._current + 1) % this._elements.length;
				if(this.get(_CONFIG.COOKIE_PERSIST.key)) {
					Cookie.setSub(
						this.get(_CONFIG.COOKIE_NAME.key),
						_COOKIES.CURRENT,
						this._current,
						this.get(_CONFIG.COOKIE_SETTINGS.key)
					);
				}
				
				return this._current;
			},
			
			/**
			* Schedules next element advancement
			* @method _schedule
			* @private
			*/
			_schedule: function() {
				/*
					For syncing transitions with user's clock, we pick a fixed time t_0 in the past
					and interpret a show_duration of D to mean that transitions should be initiated
					every D seconds from t_0. If t denotes the current time, and S(t_0, t) the number
					of seconds since t_0, then the number of seconds since the last transition is
					is S(t_0, t) % D, so the time until the next transition is D - (S(t_0, t) % D).
					
					For convenience we work in milliseconds and let t_0 be the epoch, so S(t_0, t) is
					just given by getTime() applied to the current date and we use d = 1000 * D.
				*/
				var self = this,
					d = 1000 * this.get(_CONFIG.SHOW_DURATION.key),
					t = this.get(_CONFIG.CLOCK_SYNC.key) ? (d - ((new Date()).getTime() % d)) : d;
				
				setTimeout(function() { self._advance(); }, t);
			},
			
			/**
			* Advances element
			* @method _advance
			* @private
			*/
			_advance: function() {
				var self = this,
					elements = this._elements,
					total = elements.length,
					idxCurrent = this._current,
					idxNext = (idxCurrent + 1) % total,
					current = elements[idxCurrent],
					next = elements[idxNext],
					anim;
				
				/* When constructing the animations, we assume only the current element has
					visibility and nonzero opacity. */
				if(idxNext !== 0) {
					// Fade up to next element in stack
					anim = new Anim(next, { opacity: { to: 1 } }, this.get(_CONFIG.FADE_DURATION.key));
					
					anim.onComplete.subscribe(
						function() {
							Dom.setStyle(current, 'opacity', 0);
							Dom.setStyle(current, 'visibility', 'hidden');
							self._schedule();
						}
					);
					
					Dom.setStyle(next, 'visibility', 'visible');
				}
				else {
					// Fade back down to first element in stack
					anim = new Anim(current, { opacity: { to: 0 } }, this.get(_CONFIG.FADE_DURATION.key));
					
					anim.onComplete.subscribe(
						function() {
							Dom.setStyle(current, 'visibility', 'hidden');
							self._schedule();
						}
					);
					
					Dom.setStyle(next, 'visibility', 'visible');
					Dom.setStyle(next, 'opacity', 1);
				}
				
				this._advanceCurrent();
				anim.animate();
			},
			
			/**
			* Renders and starts element transitions
			* @method render
			*/
			render: function() {
				var el = this.get('element'),
					nodes = el.childNodes,
					len = nodes.length;
				
				if(len) {
					var pos = Dom.getStyle(el, 'position'),
						current = this._initCurrent(),
						i, j, node;
					
					// Ensure we can position elements relative to the container
					if(!pos || pos === 'static') {
						Dom.setStyle(el, 'position', 'relative');
					}
					
					// Prepare elements
					this._elements = [];
					for(i = j = 0; i < len; i++) {
						node = nodes[i];
						if(node.nodeType === 1) {
							Dom.setStyle(node, 'position', 'absolute');
							Dom.setStyle(node, 'left', 0);
							Dom.setStyle(node, 'top', 0);
							Dom.setStyle(node, 'zIndex', j);
							Dom.setStyle(node, 'visibility', j === current ? 'visible' : 'hidden');
							Dom.setStyle(node, 'opacity', j++ === current ? 1 : 0);
							this._elements.push(node);
						}
					}
					
					if(this !== 1) {
						// Begin scheduling transitions
						this._schedule();
					}
				}
			}
		}
	);
	
	// Export
	YAHOO.namespace('BLARGON.widget');
	YAHOO.BLARGON.widget.ElementRotator = ElementRotator;
})();