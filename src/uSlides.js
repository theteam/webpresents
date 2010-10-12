/**
 *	@name uSlides
 *	@namespace
 *	@description Framework for creating a dynamic slideshow
 */
var uSlides = (function() {
	var SlideshowProto;
	
	/**
	 *	@name uSlides.Slideshow
	 *	@class
	 *	@description A slide deck.
	 *
	 *	@param {jQuery} container The container element for the slides.
	 *		All child elements will be treated as slides.
	 *
	 *	@example
	 *		// creating a slideshow instance
	 *		var slideshow = new uSlides.Slideshow('#slides');
	 *
	 *	@example
	 *		// creating and starting a simple slideshow
	 *		new uSlides.Slideshow('#slides').start();
	 */
	function Slideshow(container) {
		this.container = container = $(container);
		container.children().hide();
	};
	SlideshowProto = Slideshow.prototype;
	
	/**
	 *	@name uSlides.Slideshow._currentSlideElm
	 *	@type jQuery
	 *	@description Element representing the current slide
	 */
	
	/**
	 *	@name uSlides.Slideshow._started
	 *	@type boolean
	 *	@description Is the slideshow playing?
	 */
	
	/**
	 *	@name uSlides.Slideshow.container
	 *	@type jQuery
	 *	@description Container of the slides
	 */
	
	/**
	 *	@name uSlides.Slideshow.get
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
	SlideshowProto.get = function() {};
	
	/**
	 *	@name uSlides.Slideshow.next
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
	 *	@name uSlides.Slideshow.prev
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
	function switchTo(slideshow, newSlide) {
		var currentSlide = slideshow._currentSlideElm;
		
		if ( newSlide[0] ) {
			currentSlide.hide();
			newSlide.show();
			slideshow._currentSlideElm = newSlide;
		}
		return slideshow;
	}
	
	/**
	 *	@name uSlides.Slideshow.start
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
			
			// show first item
			slideshow._currentSlideElm = slideshow.container.find(':first-child').show();
			slideshow._started = true;
		}
		return slideshow;
	
	};
	
	
	// export publics
	return {
		Slideshow: Slideshow
	};
})();