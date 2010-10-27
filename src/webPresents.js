/**
 *	@name webPresents
 *	@namespace
 *	@description Framework for creating a dynamic slideshow
 */
var webPresents = (function() {
	if (!window.$) {
		throw Error('jQuery not found. `ant deps` can be used to fetch jQuery and friends');
	}
	
	var SlideshowProto,
		EventProxyProto,
		SlideProto;
	
	/**
	 *	@name webPresents.Slideshow
	 *	@class
	 *	@description A slide deck.
	 *
	 *	@param {jQuery} container The container element for the slides.
	 *		All child elements will be treated as slides.
	 *
	 *		Certain data attributes can quickly add behaviours to slides,
	 *		see {@link webPresents.behaviours}
	 *	@param {Object} [opts] Options
	 *		@param {boolean} [opts.fullScreen=true] Expand the container to fill the browser window (without cropping).
	 *			This requires the container to have a fixed size.
	 *		@param {function|string} [opts.transition] The default slide transition.
	 *			A transition function or property name from {@link webPresents.transitions}.
	 *			Transitions named on individual slides will overwrite this.
	 *		@param {boolean} [opts.loop=false] Loop back to the start after the last slide.
	 *
	 *	@example
	 *		// creating a slideshow instance
	 *		var slideshow = new webPresents.Slideshow('#slides');
	 *
	 *	@example
	 *		// creating and starting a simple slideshow
	 *		new webPresents.Slideshow('#slides').start();
	 *
	 *	@example
	 *		// Adding complex behaviour to a particular slide...
	 *		var slideshow = new webPresents.Slideshow('#slides', {
	 *			transition: 'fadeToBlack'
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
		var slideshow = this,
			containerChildren;
		
		slideshow._opts = opts = $.extend({
			fullScreen: false,
			transition: '',
			loop: false
		}, opts || {});
		
		slideshow.container = container = $(container).addClass('webPresents');
		containerChildren = container.children();
		
		// if we're looping & there's only one item, we need to clone the slide
		if (opts.loop && containerChildren.length === 1) {
			containerChildren.clone(true).insertAfter(containerChildren);
		}
		
		// create our slide instances
		container.children().each(function() {
			applySlideBehaviours(
				$(this).data( 'slide', new Slide(slideshow, this).transition(opts.transition) )
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
	 *	@name webPresents.Slideshow#_currentSlideElm
	 *	@type jQuery
	 *	@description Element representing the current slide
	 */
	
	/**
	 *	@name webPresents.Slideshow#_started
	 *	@type boolean
	 *	@description Is the slideshow playing?
	 */
	
	/**
	 *	@name webPresents.Slideshow#container
	 *	@type jQuery
	 *	@description Container of the slides
	 */
	
	/**
	 *	@name webPresents.Slideshow#get
	 *	@function
	 *	@description Get a slide instance for a particular slide
	 *
	 *	@param {jQuery} slide Reference to the slide element
	 *
	 *	@return {webPresents.Slide}
	 *	
	 *	@example
	 *		var slide = slideshow.get('#intro');
	 */
	SlideshowProto.get = function(slide) {
		return $(slide).data('slide');
	};
	
	/**
	 *	@name webPresents.Slideshow#next
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
		var nextSlide = this._currentSlideElm.next();
		
		if ( !nextSlide[0] && this._opts.loop ) {
			nextSlide = this.container.children().first();
		}
		
		return switchTo(this, nextSlide);
	};
	
	/**
	 *	@name webPresents.Slideshow#prev
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
	 *	@param {webPresents.slideshow} slideshow Slideshow instance
	 *	@param {jQuery} newSlide Slide element to show next
	 *
	 *	@return {webPresents.slideshow} slideshow
	 */	
	function switchTo(slideshow, newSlideElm) {
		var currentSlideElm = slideshow._currentSlideElm,
			currentSlide,
			newSlide;
		
		if ( newSlideElm[0] ) {
			// exit if the current slide is mid-transition
			if (currentSlide && currentSlide.state !== 'afterShow') {
				return slideShow;
			}
			
			if (currentSlideElm) {
				currentSlide = currentSlideElm.data('slide');
				currentSlide.fire('hide');	
			}
			
			newSlide = newSlideElm.data('slide');
			newSlide.fire('show');
			newSlideElm.show();
			
			// this is called when the transition is complete
			newSlide.one('afterShow', function() {
				currentSlide && currentSlideElm.hide() && currentSlide.fire('afterHide');
				slideshow._currentSlideElm = newSlideElm;
			});
			
			// call transition if there is one
			if ( currentSlide && currentSlide._transitionFunc ) {
				currentSlide._transitionFunc( currentSlide, newSlide )
			}
			// no transition for this slide
			else {
				newSlide.fire('afterShow');
			}	
			
		}
		return slideshow;
	}
	
	/**
	 *	@name webPresents.Slideshow#start
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
			switchTo( slideshow, slideshow.container.children().first() );
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
	 *	@name webPresents.EventProxy
	 *	@class
	 *	@description Abstract class that adds on & fire methods to an object.
	 */
	function EventProxy() {
		var emptyFunc = function(){};
		this._eventProxy = $({
			// these cater for jquery trying to remove listeners ala dom
			detachEvent: emptyFunc,
			removeEventListener: emptyFunc
		});
	}
	EventProxyProto = EventProxy.prototype;
	
	/**
	 *	@name webPresents.EventProxy#on
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
	 *	@name webPresents.EventProxy#one
	 *	@function
	 *	@description As .on, but the listener is removed after the first firing.
	 */
	EventProxyProto.one = function(eventName, callback) {
		this._eventProxy.one( eventName, $.proxy(callback, this) );
		return this;
	};
	
	/**
	 *	@name webPresents.EventProxy#fire
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
	 *	@name webPresents.Slide
	 *	@class
	 *	@extends webPresents.EventProxy
	 *	@description A slide
	 *		You don't need to create these manually, they're created automatically
	 *		when a slideshow is created, use {@link webPresents.Slideshow#get} to get
	 *		a slide instance.
	 */
	/*
	 *	For completeness, here are the params...
	 *
	 *	@param {webPresents.Slideshow} slideshow Parent slideshow
	 *	@param {jQuery} container Container element of the slide
	 */
	function Slide(slideshow, container) {
		this.container = container = $(container).data('slide', this).addClass('afterHide');
		this.slideshow = slideshow;
		EventProxy.call(this);
	}
	SlideProto = Slide.prototype = new EventProxy;
	SlideProto.constructor = Slide;
	
	/**
	 *	@name webPresents.Slide#_transitionFunc
	 *	@type Function
	 *	@description Transition function.
	 *		See {@link webPresents.transitions} for param details
	 */
	
	/**
	 *	@name webPresents.Slide#container
	 *	@type jQuery
	 *	@description Container of the slide
	 */
	
	/**
	 *	@name webPresents.Slide#slideshow
	 *	@type webPresents.Slideshow
	 *	@description Parent slideshow
	 */
	
	/**
	 *	@name webPresents.Slide#state
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
	 *	@name webPresents.Slide#complete
	 *	@function
	 *	@description Signal a slide as complete
	 *		The slideshow will be advanced
	 */
	SlideProto.complete = function() {
		this.state === 'afterShow' && this.slideshow.next();
	};
	
	// extend the fire method to update state
	SlideProto.fire = function(eventName) {
		this.container.removeClass( this.state ).addClass( this.state = eventName );
		return EventProxyProto.fire.apply(this, arguments);
	};
	
	/**
	 *	@name webPresents.Slide#transition
	 *	@function
	 *	@description Set a transition for this slide.
	 *		This can also be set using the data-transition attribute,
	 *		see {@link webPresents.transitions}.
	 *
	 *	@param {Function|string} func Transition function, or {@link webPresents.transitions} property name.
	 *		See {@link webPresents.transitions} for param details.
	 *
	 *	@return this
	 */
	SlideProto.transition = function(func) {
		if (typeof func === 'string') {
			func = transitions[func];
		}
		this._transitionFunc = func;
		return this;
	};
	
	/**
	 *	@name webPresents.Slide#event:show
	 *	@event
	 *	@description About to transition into view.
	 *		Use this to set the slide up.
	 */
	
	/**
	 *	@name webPresents.Slide#event:afterShow
	 *	@event
	 *	@description Transitioned into view.
	 *		Use this to start any animations, videos, audios associated with
	 *		the slide.
	 *
	 *		Call this.complete() to advance to the next slide.
	 */
	
	/**
	 *	@name webPresents.Slide#event:hide
	 *	@event
	 *	@description About to transition out of view
	 *		Use this to pause any animations that may slow the transition.
	 */
	
	/**
	 *	@name webPresents.Slide#event:afterHide
	 *	@event
	 *	@description Transitioned out of view
	 *		Use this to pause any animations, stop videos etc that shouldn't run
	 *		in the background.
	 */
	
	/**
	 *	@name webPresents.behaviours
	 *	@type Object
	 *	@description Collection of behaviours automatically added to slides depending on attributes.
	 *		Feel free to add to these. If a slide has an attribute
	 *		data-duration="3000" then webPresents.behaviours.duration(slide, 3000)
	 *		will be called (number-like strings are converted to numbers).
	 */
	var behaviours = (function() {
		
		function video(slide, videoUrl) {
			var video = videoUrl ?
					$('<video/>').attr('src', videoUrl).appendTo(slide.container) :
					slide.container.find('video').first(),
				videoElm = video[0],
				funcQueue = [],
				isReady = false;
			
			function whenReady(func) {
				isReady ? func() : funcQueue.push(func); 
			}
			
			video.attr({
				preload: 'auto'
			}).bind('ended', function() {
				slide.complete();
			}).bind('loadedmetadata', function() {
				isReady = true;
				funcQueue.forEach(function(func) {
					func();
				});
			});
			
			slide.on('show', function() {
				whenReady(function() {
					videoElm.currentTime = 0;
				});
			}).on('afterShow', function() {
				whenReady(function() {
					videoElm.play();
				});
			}).on('hide', function() {
				whenReady(function() {
					videoElm.pause();
				});
			});
		}
		
		return {
			/**
			 *	@name webPresents.behaviours.duration
			 *	@type Function
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
			},
			/**
			 *	@name webPresents.behaviours.transition
			 *	@type Function
			 *	@description Add a transition between the current slide and the next
			 *		See {@link webPresents.transitions}.
			 */
			transition: function(slide, transitionName) {
				slide.transition(transitionName);
			},
			/**
			 *	@name webPresents.behaviours.video
			 *	@type Function
			 *	@description Display a video in the slide
			 *		Usage: data-fullvideo="video url"
			 *		   Or: data-fullvideo
			 *
			 *		If a video url is provided, a <video> element will be created
			 *		for that slide. Otherwise behaviour is added to the first
			 *		video element in the slide.
			 *
			 *		This will play the video once the slide enters the view and
			 *		automatically advance to the next slide once the video completes.
			 */
			video: video,
			/**
			 *	@name webPresents.behaviours.fullvideo
			 *	@type Function
			 *	@description As {@link webPresents.behaviours.video}, but the video will take up the whole slide
			 *		Usage: data-fullvideo="video url"
			 *		   Or: data-fullvideo
			 */
			fullvideo: video,
			/**
			 *	@name webPresents.behaviours.fadeelements
			 *	@type Function
			 *	@description Fade all the elements of the slide in gradually
			 *		Usage: data-fadeelements
			 *		   Or: data-fadeelements
			 */
			fadeelements: function(slide) {
				var elements,
					transition = getCssPropertyName('transition');
				
				slide.on('show', function() {
					elements = slide.container.find('*').filter(function() {
						return $(this).css('display') === 'block';
					}).each(function(i) {
						$(this).css({
							opacity: 0
						}).css( transition, 'opacity 0.5s ' + (i/2) + 's' );
					});
				}).on('afterShow', function() {
					elements.css('opacity', 1);
				}).on('afterHide', function() {
					elements.css( transition, 'none' );
				});
			}
		};
	})();
	
	/**
	 *	@name webPresents.transitions
	 *	@type Object
	 *	@description Transitions that move from one slide to the next.
	 *		Feel free to add to these. If a slide has an attribute
	 *		data-transition="fade" then uSlide.transitions.fade(currentSlide, newSlide)
	 *		is called. To signal the end of the transition, call newSlide.fire('afterShow')
	 *
	 *		Both slides are visible when the transition starts, but you may position them
	 *		however you wish. However, you must remove undo any CSS changes you make
	 *		when the transition ends. This ensures these rules don't break other
	 *		transitions or animations.
	 */
	var transitions = {
		/**
		 *	@name webPresents.transitions.fadeToBlack
		 *	@type Function
		 *	@description Fade to black then fade to the next slide
		 *		Usage data-transition="fadeToBlack"
		 */
		fadeToBlack: function(currentSlide, newSlide) {
			// we're not ready for the new slide yet
			newSlide.container.hide();
			
			var overlay = $('<div />').css({
				position: 'fixed',
				top: 0,
				bottom: 0,
				left: 0,
				right: 0,
				background: '#000',
				opacity: 0,
				'z-index': 50
			}).appendTo(document.body);
			
			// animate it
			overlay.animate({
				opacity: 1
			}, {
				duration: 300,
				complete: function() {
					// switch the slides
					currentSlide.container.hide();
					newSlide.container.show();
				}
			}).animate({
				opacity: 0
			}, {
				duration: 300,
				complete: function() {
					overlay.remove();
					// transition complete
					newSlide.fire('afterShow');
				}
			});
		},
		/**
		 *	@name webPresents.transitions.slideFade
		 *	@type Function
		 *	@description Slide the current slide to the left, and the new one in from the right
		 *		Usage data-transition="slideFade"
		 */
		slideFade: function(currentSlide, newSlide) {
			currentSlide.container.css({
				position: 'absolute',
				left: 0
			}).css( getCssPropertyName('transition'), 'all 0.5s' );
			
			newSlide.container.css({
				position: 'absolute',
				left: 500,
				opacity: 0
			}).css( getCssPropertyName('transition'), 'all 0.5s' ).one('transitionend', function() {
				newSlide.container.css( getCssPropertyName('transition'), '' ).css({
					position: ''
				});
				
				currentSlide.container.css( getCssPropertyName('transition'), '' ).css({
					position: '',
					left: 0,
					opacity: 1
				});
				
				// transition complete
				newSlide.fire('afterShow');
			});
			
			setTimeout(function() {
				currentSlide.container.css({
					left: -500,
					opacity: 0
				});
				
				newSlide.container.css({
					left: 0,
					opacity: 1
				});
			}, 50);
		}
	};
	
	// export publics
	return {
		Slideshow: Slideshow,
		Slide: Slide,
		EventProxy: EventProxy,
		behaviours: behaviours
	};
})();