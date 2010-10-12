/**
 *	@name uSlides
 *	@namespace
 *	@description Framework for creating a dynamic slideshow
 */
var uSlides = (function() {
	var SlideshowProto,
		EventProxyProto,
		SlideProto;
	
	/**
	 *	@name uSlides.Slideshow
	 *	@class
	 *	@description A slide deck.
	 *
	 *	@param {jQuery} container The container element for the slides.
	 *		All child elements will be treated as slides.
	 *
	 *		Certain data attributes can quickly add behaviours to slides,
	 *		see {@link uSlides.behaviours}
	 *	@param {Object} [opts] Options
	 *		@param {boolean} [opts.fullScreen=true] Expand the container to fill the browser window (without cropping).
	 *			This requires the container to have a fixed size.
	 *
	 *	@example
	 *		// creating a slideshow instance
	 *		var slideshow = new uSlides.Slideshow('#slides');
	 *
	 *	@example
	 *		// creating and starting a simple slideshow
	 *		new uSlides.Slideshow('#slides').start();
	 *
	 *	@example
	 *		// Adding complex behaviour to a particular slide...
	 *		var slideshow = new uSlides.Slideshow('#slides', {
	 *			fullScreen: true
	 *		});
	 *	
	 *		slideshow.get('#introduction') // get a slide instance, then add event listeners...
	 *		.on('show', function() {
	 *			// set the slide up
	 *		}).on('afterShow', function() {
	 *			// start animating the slide, play videos etc
	 *			// then, when the slide is complete...
	 *			this.complete();
	 *		}).on('hide', function() {
	 *			// anything that needs done as the slide starts to exit, eg pausing animations
	 *		}).on('afterHide', function() {
	 *			// a teardown phase, if needed. The slide is now completely hidden
	 *		});
	 *
	 *		slideshow.begin();
	 */
	function Slideshow(container, opts) {
		var slideshow = this;
		
		slideshow._opts = opts = $.extend({
			fullScreen: false
		}, opts || {});
		
		slideshow.container = container = $(container);
		
		// create our slide instances
		container.children().each(function() {
			applySlideBehaviours(
				$(this).data( 'slide', new Slide(slideshow, this) )
			)
		}).hide();
	};
	SlideshowProto = Slideshow.prototype;
	
	/**
	 *	@private
	 *	@function
	 *	@description Apply default behaviours depending on slide attributes
	 *
	 *	@param {jQuery} slideElm Slide Element
	 */
	function applySlideBehaviours(slideElm) {
		var slide = slideElm.data('slide'),
			attributes = slideElm[0].attributes,
			i = attributes.length,
			dataName,
			dataValue,
			dataIsNum;
			
			
		while (i--) if (attributes[i].nodeName.slice(0, 5) === 'data-') {
			dataName = attributes[i].nodeName.slice(5);
			dataValue = attributes[i].nodeValue;
			dataIsNum = ( dataValue !== '' && isFinite(dataValue) );
			// look for method in the behaviours object, convert value to number if needed
			behaviours[dataName] && behaviours[dataName]( slide, dataIsNum ? Number(dataValue) : dataValue );
		}
	}
	
	/**
	 *	@name uSlides.Slideshow#_currentSlideElm
	 *	@type jQuery
	 *	@description Element representing the current slide
	 */
	
	/**
	 *	@name uSlides.Slideshow#_started
	 *	@type boolean
	 *	@description Is the slideshow playing?
	 */
	
	/**
	 *	@name uSlides.Slideshow#container
	 *	@type jQuery
	 *	@description Container of the slides
	 */
	
	/**
	 *	@name uSlides.Slideshow#get
	 *	@function
	 *	@description Get a slide instance for a particular slide
	 *
	 *	@param {jQuery} slide Reference to the slide element
	 *
	 *	@return {uSlides.Slide}
	 *	
	 *	@example
	 *		var slide = slideshow.get('#intro');
	 */
	SlideshowProto.get = function(slide) {
		return $(slide).data('slide');
	};
	
	/**
	 *	@name uSlides.Slideshow#next
	 *	@function
	 *	@description Advance the slideshow.
	 *		This is automatically bound to right arrow key & space.
	 *	
	 *	@return this
	 *	
	 *	@example
	 *		slideshow.next();
	 */
	SlideshowProto.next = function() {
		return switchTo(this, this._currentSlideElm.next() );
	};
	
	/**
	 *	@name uSlides.Slideshow#prev
	 *	@function
	 *	@description Move the slideshow back
	 *		This is automatically bound to left arrow key
	 *	
	 *	@return this
	 *	
	 *	@example
	 *		slideshow.prev();
	 */
	SlideshowProto.prev = function() {
		return switchTo(this, this._currentSlideElm.prev() );
	};
	
	/**
	 *	@private
	 *	@function
	 *	@description Move to a particular slide
	 *
	 *	@param {uSlides.slideshow} slideshow Slideshow instance
	 *	@param {jQuery} newSlide Slide element to show next
	 *
	 *	@return {uSlides.slideshow} slideshow
	 */	
	function switchTo(slideshow, newSlideElm) {
		var currentSlideElm = slideshow._currentSlideElm,
			currentSlide,
			newSlide;
		
		if ( newSlideElm[0] ) {
			if (currentSlideElm) {
				currentSlide = currentSlideElm.data('slide');
				currentSlide.fire('hide');
				currentSlideElm.hide();
				currentSlide.fire('afterHide');
			}
			
			newSlide = newSlideElm.data('slide');
			newSlide.fire('show');
			newSlideElm.show();
			newSlide.fire('afterShow');
			
			slideshow._currentSlideElm = newSlideElm;
		}
		return slideshow;
	}
	
	/**
	 *	@name uSlides.Slideshow#start
	 *	@function
	 *	@description Start the slideshow
	 *	
	 *	@return this
	 *	
	 *	@example
	 *		slideshow.start();
	 */
	SlideshowProto.start = function() {
		var slideshow = this,
			interactiveElements = 'a, input, textarea, embed, object, canvas, audio, video, select';
		
		if (!slideshow._started) {
			// bind events
			$(document).keydown(function(event) {
				switch (event.which) {
					case 32: // space
					case 39: // right arrow
						// don't trigger for interactive elements
						if ( !$( event.target ).closest(interactiveElements)[0] ) {
							slideshow.next();
							return false;
						}
						break;
					case 37: // left arrow
						// don't trigger for interactive elements
						if ( !$( event.target ).closest(interactiveElements)[0] ) {
							slideshow.prev();
							return false;
						}
						break;
				}
				return true;
			});
			
			// fullscreen
			if (slideshow._opts.fullScreen) {
				$(window).resize(function() {
					scaleToFill(slideshow.container);
				});
				scaleToFill(
					slideshow.container.css( getCssPropertyName('transform-origin'), 'center top' )
				);
				$('html, body').css({
					overflow: 'hidden',
					height: '100%'
				});
			}
			
			// show first item
			switchTo( slideshow, slideshow.container.find(':first-child') );
			slideshow._started = true;
		}
		return slideshow;
	
	};
	
	/**
	 *	@private
	 *	@function
	 *	@description Scale an element to fit the browser window
	 *
	 *	@param {jQuery} element
	 */
	function scaleToFill(element) {
		var win = $(window),
			scaleX = win.width()  / element.outerWidth(),
			scaleY = win.height() / element.outerHeight(),
			minScale = Math.min(scaleX, scaleY);
		
		element.css( getCssPropertyName('transform'), 'scale(' + minScale + ')' );
	}
	
	/**
	 *	@private
	 *	@function
	 *	@description Get a supported css property name for a css property
	 *		Will search common vendor prefixes for supported value.
	 *
	 *	@param {string} propertyName Name without any prefix
	 *
	 *	@return {string} Supported property name.
	 *		This will be an empty string for unsupported properties.
	 *
	 *	@example
	 *		getCssPropertyName('border-radius');
	 *		// returns...
	 *		// 'border-radius' if supported, else...
	 *		// '-moz-border-radius' if supported, else...
	 *		// '-webkit-border-radius' if supported, else...
	 *		// etc etc, else ''
	 */
	var getCssPropertyName = (function() {
		var style = document.createElement('b').style,
			prefixes = ['Webkit', 'O', 'Ie', 'Moz'],
			cache = {};
			
		return function(propertyName) {
			if ( propertyName in cache ) {
				return cache[propertyName];
			}
			
			var supportedValue = '',
				i = prefixes.length,
				upperCamelPropertyName,
				camelPropertyName = propertyName.replace(/-([a-z])/ig, function( all, letter ) {
					return letter.toUpperCase();
				});
			
			if ( camelPropertyName in style ) {
				supportedValue = propertyName;
			}
			else {
				// uppercase first char
				upperCamelPropertyName = camelPropertyName.slice(0,1).toUpperCase() + camelPropertyName.slice(1);
				while (i--) if ( prefixes[i] + upperCamelPropertyName in style ) {
					// convert MozBlah to -moz-blah
					supportedValue = (prefixes[i] + upperCamelPropertyName).replace( /([A-Z])/g, '-$1' ).toLowerCase();
					break;
				}
			}
			
			return cache[propertyName] = supportedValue;
		}
	})();
	
	/**
	 *	@name uSlides.EventProxy
	 *	@class
	 *	@description Abstract class that adds on & fire methods to an object.
	 */
	function EventProxy() {
		this._eventProxy = $( {} );
	}
	EventProxyProto = EventProxy.prototype;
	
	/**
	 *	@name uSlides.EventProxy#on
	 *	@function
	 *	@description Listen for an event
	 *	
	 *	@param {string} eventName Name of the event to listen for.
	 *	@param {function} callback Function to call when the event fires.
	 *		The callback is passed a single event object. The type of this
	 *		object depends on the event (see documentation for the event
	 *		you're listening to).
	 *		
	 *	@returns this
	 *	
	 *	@example
	 *		myObj.on('show', function() {
	 *		    // do stuff
	 *		});
	 */
	EventProxyProto.on = function(eventName, callback) {
		this._eventProxy.bind( eventName, $.proxy(callback, this) );
		return this;
	};
	/**
	 *	@name uSlides.EventProxy#fire
	 *	@function
	 *	@description Fire an event.
	 *	@param {string} eventName Name of the event to fire.
	 *	@param {object} [event] Properties to pass into listeners.
	 *		    You can provide a simple object of key-value pairs which will
	 *		    be added as properties of a glow.events.Event instance.
	 *		
	 *	@returns this
	 */
	EventProxyProto.fire = function() {
		var proxy = this._eventProxy;
		proxy.trigger.apply(proxy, arguments);
		return this;
	};
	
	/**
	 *	@name uSlides.Slide
	 *	@class
	 *	@extends uSlides.EventProxy
	 *	@description A slide
	 *		You don't need to create these manually, they're created automatically
	 *		when a slideshow is created, use {@link uSlides.Slideshow#get} to get
	 *		a slide instance.
	 */
	/*
	 *	For completeness, here are the params...
	 *
	 *	@param {uSlides.Slideshow} slideshow Parent slideshow
	 *	@param {jQuery} container Container element of the slide
	 */
	function Slide(slideshow, container) {
		this.container = container = $(container).data('slide', this);
		this.slideshow = slideshow;
		EventProxy.call(this);
	}
	SlideProto = Slide.prototype = new EventProxy;
	SlideProto.constructor = Slide;
	
	/**
	 *	@name uSlides.Slide#container
	 *	@type jQuery
	 *	@description Container of the slide
	 */
	
	/**
	 *	@name uSlides.Slide#slideshow
	 *	@type uSlides.Slideshow
	 *	@description Parent slideshow
	 */
	
	/**
	 *	@name uSlides.Slide#state
	 *	@type string
	 *	@description Current state of the slide
	 *		Values can be...
	 *
	 *		afterHide	Slide is off-screen
	 *		show		Slide is in the process of showing
	 *		afterShow	Slide is visible
	 *		hide		Slide is hiding
	 */
	SlideProto.state = 'afterHide';
	
	/**
	 *	@name uSlides.Slide#complete
	 *	@function
	 *	@description Signal a slide as complete
	 *		The slideshow will be advanced
	 */
	SlideProto.complete = function() {
		this.state === 'afterShow' && this.slideshow.next();
	};
	
	// extend the fire method to update state
	SlideProto.fire = function(eventName) {
		this.state = eventName;
		return EventProxyProto.fire.apply(this, arguments);
	}
	
	/**
	 *	@name uSlides.Slide#event:show
	 *	@event
	 *	@description About to transition into view.
	 *		Use this to set the slide up.
	 */
	
	/**
	 *	@name uSlides.Slide#event:afterShow
	 *	@event
	 *	@description Transitioned into view.
	 *		Use this to start any animations, videos, audios associated with
	 *		the slide.
	 *
	 *		Call this.complete() to advance to the next slide.
	 */
	
	/**
	 *	@name uSlides.Slide#event:hide
	 *	@event
	 *	@description About to transition out of view
	 *		Use this to pause any animations that may slow the transition.
	 */
	
	/**
	 *	@name uSlides.Slide#event:afterHide
	 *	@event
	 *	@description Transitioned out of view
	 *		Use this to pause any animations, stop videos etc that shouldn't run
	 *		in the background.
	 */
	
	/**
	 *	@name uSlides.behaviours
	 *	@type Object
	 *	@description Collection of behaviours automatically added to slides depending on attributes.
	 *		Feel free to add to these. If a slide has an attribute
	 *		data-duration="3000" then uSlides.behaviours.duration(slide, 3000)
	 *		will be called (number-like strings are converted to numbers).
	 */
	var behaviours = {
		/**
		 *	@name uSlides.behaviours.duration
		 *	@description Set the duration of a slide.
		 *		Usage: data-duration="3000" for a 3 second duration
		 */
		duration: function(slide, duration) {
			var timeout;
			
			slide.on('afterShow', function() {
				timeout = setTimeout(function() {
					slide.complete();
				}, duration);
			}).on('hide', function() {
				clearTimeout(timeout);
			});
		}
	}
	
	// export publics
	return {
		Slideshow: Slideshow,
		Slide: Slide,
		EventProxy: EventProxy,
		behaviours: behaviours
	};
})();