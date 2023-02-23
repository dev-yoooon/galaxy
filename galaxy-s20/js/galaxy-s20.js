$(function() {
	var $window = $(window),
		$document = $(document),
		isRTL = $('html').hasClass('rtl');

	GALAXY.isSticky = (function(o) {
		o.style.cssText = 'position:-webkit-sticky;position:sticky';
		return o.style.position == '-webkit-sticky' || o.style.position == 'sticky';
	})(document.createElement('fave'));
	if (GALAXY.isSticky) {
		$('html').addClass('sticky');
	}

	var isHighlights = $('#contents.highlights').length;
	var isEdge = window.navigator.userAgent.toLowerCase().indexOf('edge') > -1;
	if (isEdge) { $('html').addClass('edge') }

	var canvasDraw = function(element, config) {
		var $element     = $(element),
			$prevImage   = $('img', element),
			canvas       = document.createElement('canvas'),
			ctx          = canvas.getContext('2d'),
			images       = [],
			currentIndex = config.index || 0,
			interval     = null,
			animateIndex = 0,
			_            = this;
			_.isComplete = false;

		function imageLoaded() {
			var cnt = config.count;
			if (GALAXY.sizeMode == 1) {
				cnt /= 2;
			}
			var cb = function() {
				this.src && ctx.drawImage(this, -1, -1, 1, 1);
				if (++seq == cnt) {
					imageLoadComplete();
				}
			}, seq = 1;

			for(var i=1, image; i<=config.count; i++) {
				image = new Image();

				image.src = config.src.replace(config.replaceKey, GALAXY.addZero(i));
				images.push(image);

				GALAXY.loadImage($(image), cb);
				if (GALAXY.sizeMode == 1) {
					i += 1;
				}
			}
		}
		function imageLoadComplete() {
			_.isComplete = true;
			$element.addClass('complete');

			if (config.events.complete !== null && typeof config.events.complete == 'function') {
				config.events.complete.call(_, currentIndex);
			} else {
				_.drawImage();
			}
		}
		
		function update() {
			if ( (!_.isComplete && _.isComplete != undefined) || currentIndex == animateIndex && !$element.hasClass('animation-end')) {
				_.drawImage(currentIndex);
				
				$element.addClass('animation-end');

				if (typeof config.events.animateEnd == 'function') {
					config.events.animateEnd.call(_, currentIndex);
				}

				return;
			}
			var diff = (currentIndex < animateIndex) ? 1 : -1;
			_.drawImage( currentIndex+diff );

			interval = window.raf(update);
		}

		var _init = function() {
				_ = this;
				if (config.count <= 1 || config.src == '') {
					return false;
				}

				_.setup();
				return this;
			},
			_reInit = function(options, force) {
				var defaults = force ? {src: '', index: 1, count: 0, replaceKey: '@@', events: {complete: null}} : config;
				config = $.extend(defaults, options);
				_.clear();
			},
			_clear = function() {
				$element.removeClass('complete animation-end');
				interval && window.caf( interval );
				currentIndex = config.index || 0;
				_.isComplete   = false;
				images = [];

				_.init();
			},
			_reset = function() {
				if (!_.isComplete) {
					return false;
				}
				currentIndex = 0;
				$element.removeClass('animation-end');
				_drawImage();
			},
			_setup = function() {
				imageLoaded();
				$element.append( canvas );
			},
			_drawImage = function(index) {
				currentIndex = index || currentIndex;
				var rect = $element[0].getBoundingClientRect();
				var image = images[currentIndex];
				if ( !image ) { return false; }

				if ( _.isComplete ) {
					canvas.width = rect.width;
					canvas.height = rect.height;

					if (_.drawImageBefore !== null && typeof _.drawImageBefore == 'function') {
						_.drawImageBefore(ctx, rect);
					}

					ctx.drawImage(image, 0, 0, rect.width, rect.height);
				}
			},
			_drawAnimate = function(toIndex) {

				window.caf( interval );
				animateIndex = toIndex || _.count;
				if (animateIndex == currentIndex) {
					return;
				}
				interval = window.raf(update);
			}

		return {
			init: _init,
			reInit: _reInit,
			count : config.count,
			reset: _reset,
			clear: _clear,
			setup: _setup,
			images: images,
			ctx: ctx,
			drawImage: _drawImage,
			drawAnimate: _drawAnimate
		}
	}

	$.fn.canvasDraw = function(option) {
		var defaults = {
			src: '',
			index: 0,
			count: 0,
			replaceKey: '@@',
			events: {
				complete: null
			}
		}

		var options = $.extend(defaults, option)
		var arr = [];
		this.each(function() {
			var o = new canvasDraw(this, options).init();
			$(this).data('canvasDraw', o);
			arr.push(o);

		})
		return arr.length > 2 ? arr : arr[0];
	}

	GALAXY.isMobileSize = !!GALAXY.sizeMode<3;
	GALAXY.resizeForce = false;

	$window.on('resize',function() {
		GALAXY.landscape = !!(GALAXY.isMobile && (GALAXY.areaWidth > GALAXY.areaHeight))
		$('html').decideClass('landscape', GALAXY.landscape);

		if ((GALAXY.sizeMode != GALAXY.prevSizeMode) || GALAXY.resizeForce) {
			if (!GALAXY.isGalaxy) {
				$('.m_content-hubble-kv > article.m_feature-kv > .m_feature-inner').css('marginTop', $('.ma-floating-nav__inner').outerHeight());
			}
			if (GALAXY.sizeMode<3) {
				if (GALAXY.isMobileSize) {
					var $cloneArea = $('.o_copy_clone-area'),
						lengths = $('.o_copy_clone-area').length;

					$('.o_origin_clone-area').each(function(i,element) {
						if ( $(element).data('target') == 'reverse' ) {
							var j, $target = $('.o_target', element);
							for (j = $target.length; j >= 0; j--) {
								$cloneArea.eq(i).append( $target.eq(j).detach() );
							}
						} else {
							$cloneArea.eq(i).append($('.o_target', element).detach());
						}
					});

					GALAXY.isMobileSize = false;
				}
			} else {
				if (!GALAXY.isMobileSize) {
					var $cloneArea = $('.o_origin_clone-area'),
						lengths = $('.o_copy_clone-area').length;

					$('.o_copy_clone-area').each(function(i,element) {
						if ( $(element).data('target') == 'reverse' ) {
							var j, $target = $('.o_target', element);
							for (j = $target.length; j >= 0; j--) {
								$cloneArea.eq(i).append( $target.eq(j).detach() );
							}
						} else {
							$cloneArea.eq(i).append($('.o_target', element).detach());
						}
					});

					GALAXY.isMobileSize = true;
				}
			}
			GALAXY.resizeForce = false;
		}
	});
	GALAXY.resize(function() {
		$(window).resize();
	})


	$('section.m_banners').each(function(i, section) {
		var $wrapper = $(section),
			$banners,
			interval;

		var
			init = function() {
				$banners = $wrapper.find('>.m_banner-content:visible');

				if (!$banners.length) {
					$wrapper.hide();
				} else {
					$wrapper
						.removeClass('column3 column2 column1')
						.addClass('column' + $banners.length);
				}

				if ($('html').hasClass('ie9') && $banners.length == 2) {
					$window.off('.m_banners').on('load.m_banners resize.m_banners', resize);
				}
			},
			resize = function() {
				clearTimeout(interval);
				interval = setTimeout(function() {
					if ( GALAXY.sizeMode > 2 ) {
						$banners.find('.m_banner-inner').maxHeight();
					} else {
						$banners.find('.m_banner-inner').css('height', '');
					}
				}, 350);
			}
		GALAXY.load( init );
	});

	var blackBgMotionInit = function () {
		$('.bk-con').each(function () {
			var $this = $(this);
			var $thisPrevSection = $this.prevUntil('section');

			$this.prev('section').append('<span class="bg-mask"/>');
		});
	}
	var blackBgMotionScroll = function () {
		$('.bk-con').each(function () {
			var $this = $(this);
			var bgTop = GALAXY.getScrollTop() - $this.offset().top + $(window).height();
			var bgMove = $(window).height();
			var bgP = Math.max(0, Math.min(1, bgTop/bgMove));

			$this.prev('section').find('.bg-mask').css('height', (bgP*$(window).height()));
		});
	}
	GALAXY.load(blackBgMotionInit);
	$(window).scroll(blackBgMotionScroll);

	var isAccessibility = false;
	$('#wrap').on('keyup', function(e){
		if(!isAccessibility){
			isAccessibility = true;
			$('html').addClass('is-accessibility');
		}
	});

	GALAXY.load(function() {
		// video scroll load
		var videoFlag = false;
		var _scroll  = function(e) {
			if(e.originalEvent !== undefined){
				if(!videoFlag){
					$('video').each(function(){
						if(!$(this).hasClass('ready')) {
							$(this).load();
						}
					});
				}
				videoFlag = true;
				GALAXY.videoFlag = true;
			}
		}
		$(window).on('scroll.videoNote10', _scroll).trigger('scroll.videoNote10');
	});

	GALAXY.load(function(){
		var supTit = $('#desc-section').find('ol').attr('data-title');

		$('sup', 'article[class^=m_feature]').each(function(i) {
			var $sup = $(this);
			if (!$sup.hasClass('default')) {
				// +19.08.04 update
				var disclaimers = this.innerHTML.split(',');
				for (var i=0, Html='';i<disclaimers.length;i++) {
					if (i>0) { Html += ', '; }
					Html += '<a href="#desc-section" class="click_sup" title="'+supTit+'">' + disclaimers[i].replace(/\s/g,'') +'</a>';
				}
				$sup.html(Html);

				if ($sup.closest('.pos-out').length){
					var pos = $sup.closest('.pos-out');
					var _clone = $sup.detach();
					pos.append(_clone);
				}
			}
		});
		$('article[class^=m_feature]').find('a.click_sup').on('click',function(e){
			e.preventDefault();

			if ($('#desc-section').length) {
				var idx = parseInt($(this).text().split(',')[0]) - 1,
					$item = $('#desc-section').find('li').eq(idx),
					$newItem;

				$item.wrapInner('<a />');
				$newItem = $item.find('>a');
				$newItem.attr({'tabindex': '0'}).focus().one('blur', function() {
					$item.html($newItem.html());
				});
			}
		});
	});

	GALAXY.load(function() {
		var oKvCanvas = {init: false, o: null, $target: null, src:''};
		var svgImg = new Image();

		// KeyVisual
		var keyVisual = (function() {
			var $keyVisual     = $('#kv-type2'),
				$floatNav      = $('.ma-g-floating-nav'),
				$kvNextSection = $keyVisual.nextAll('section:visible:first'),
				navTop         = 0,
				startTop       = 0,
				endOffsetTop   = 0,
				canvasInit     = false,
				$target        = false,
				isReset		   = false;

			var canvasSetup = function() {
				var imageSrc;

				imageSrc = $keyVisual.find('img').attr('src');

				if ( $keyVisual.find('.o_canvas')
					 && $keyVisual.find('.o_canvas').data('canvas-count')
					 && !GALAXY.isPoorNetwork) {

					if( isHighlights )	{
						svgImg.loaded = false;
						GALAXY.loadImage($(svgImg), function() {
							svgImg.loaded = true;
						});
						svgImg.src = $target.data('svg-src');
					}

					var canvasOption = {
						src : imageSrc,
						count : parseInt($target.data('canvas-count') || 0, 10),
						replaceKey: $target.data('canvas-key') || '01',
						events: {
							complete: function() {
								if( !isHighlights || (isHighlights && $window.scrollTop() > 50)) {
									canvasInit = true;
									this.drawAnimate();
								} else {
									this.drawImage(1);
								}
								oKvCanvas.init = true;
							},
							animateEnd: function() {
								if ( $keyVisual.hasClass('invisible') ) {
									this.reset();
								}
								if( isHighlights )	{
									var rect = {w: $target.width(), h: $target.height()};
									var lastImage = this.images[this.images.length-1];
									var w = lastImage.width * 0.1453125;
									var h = w*1.401433692;
									var move = {};
									var setting = {};

									var cnt = 0;
									var moveW = w*7;
									var o = this;
									var interval = null;

									var update = function(){
										cnt += 60;
										move = {
											x: cnt * 0.497916667,
											y: cnt * 0.249948772,
											w: moveW - cnt,
											h: (moveW - cnt) * 1.462633452
										}
										setting.y = move.h * 0.060963115;

										if (move.w >= w-60) {
											$target.find('canvas')[0].width = rect.w; //clear
											if(move.w < w){
												$('#kv-type2').addClass('bright');
												move = {
													x: rect.w * 0.425520833,
													y: (cnt * (0.12192623*1.65)) + setting.y + ((setting.y)*3.5),
													w: w,
													h: h
												}
											}

											o.ctx.drawImage(svgImg, move.x, ((setting.y/2)*3.5*-1) + move.y, move.w, move.h);
											o.ctx.globalCompositeOperation = 'source-in';
											o.ctx.drawImage(lastImage, 0, 0, rect.w, rect.h);
											interval = window.raf(update);
										}
									}
									interval = window.raf(update);
								}
							}
						}
					};

					oKvCanvas.$target = $target;
					oKvCanvas.src = imageSrc;
					oKvCanvas.o = oKvCanvas.$target.canvasDraw( canvasOption );
				}
			}

			var _init = function() {
				var imageSrc;
				if ( !$keyVisual.length ) {
					return false;
				}

				$target = $keyVisual.find('.o_canvas');
				imageSrc = $keyVisual.find('img').attr('src');

				// if ( !$target.data('canvas-scroll') && !canvasInit) {
					canvasSetup();
				// }
				//
				if ( !$target.data('canvas-scroll') || GALAXY.isPoorNetwork ) {
					canvasInit = true;
				}

				_resize();
				_scroll();
				return this;
			},
			_scroll = function() {
				var scrollTop = $window.scrollTop();
				startTop     = $keyVisual.offset().top;
				endOffsetTop = $kvNextSection.offset().top;
				if (endOffsetTop<0) {
					return;
				}

				if (!GALAXY.isGalaxy && $floatNav.length) {
					$keyVisual.decideClass('fixed',scrollTop >= navTop);
				}
				$keyVisual.decideClass('invisible', scrollTop >= endOffsetTop);

				// console.log(scrollTop, $target.data('canvas-scroll'), canvasInit);

				if (scrollTop > 50 && $target.data('canvas-scroll') && !canvasInit) {
					canvasInit = true;
					isReset = false;
					oKvCanvas.o.drawAnimate();
				}

				if (oKvCanvas.init) {
					if (scrollTop >= endOffsetTop && !isReset) {
						oKvCanvas.o.reset();
						if(isHighlights) $('#kv-type2').removeClass('bright');
						isReset = true;

					} else if (scrollTop < startTop) {
						if (canvasInit) {
							oKvCanvas.o.drawAnimate();
							if(isHighlights && !oKvCanvas.$target.hasClass('animation-end')) $('#kv-type2').removeClass('bright');
							isReset = false;
						}
					}
				}

				// highlights kv scroll
				var ratio = (GALAXY.sizeMode > 2) ? 0.184 : (GALAXY.sizeMode == 2) ? 0.147 : 0.09;
				var movePoint = $keyVisual.find('.o_canvas figure').height() * ratio;
				var subNavH = (GALAXY.isGalaxy) ? $('#subnav').height() : $('.ma-floating-nav__wrap').height();
				var change;
				var changePos;

				if(GALAXY.isGalaxy){
					change = Math.floor(movePoint);
					changePos = change-subNavH;
				}else{
					var offSetTop = 0;
					change = Math.floor(movePoint + offSetTop);
					changePos = movePoint - subNavH;
				}

				if (scrollTop > change && isHighlights) {
					$('.m_content-hubble-kv > article.m_feature-kv .m_feature-inner').css({
						// position: 'absolute',
						// top: changePos,
					});
				}else{
					$('.m_content-hubble-kv > article.m_feature-kv .m_feature-inner').css({
						position: '',
						top: ''
					});
				}

			},
			_resize = function() {
				if (!GALAXY.isGalaxy && $floatNav.length ) {
					navTop = $floatNav.offset().top;

				}
				startTop     = $keyVisual.offset().top;
				// if( !$('html').hasClass('modelslayer-open') ) {
				endOffsetTop = $kvNextSection.offset().top;
				// }
			}
			return {
				initalize: _init,
				resize: _resize,
				scroll: _scroll
			}
		})().initalize();

		var scrollInterval = null;

		var onScroll = function() {
			keyVisual && keyVisual.scroll();
			if (scrollInterval != null) {
				clearTimeout(scrollInterval);
			}
			scrollInterval = setTimeout(function(){
				keyVisual && keyVisual.scroll();
			}, 50)
		}
		var onResize = function() {
			if (GALAXY.sizeMode != GALAXY.prevSizeMode) {
				keyVisual && keyVisual.resize();
			}
		}

		GALAXY.scrollFunctions.push( onScroll );
		GALAXY.resizeFunctions.push( onResize );
	});

	// video section
	var $sectionVideo = $('.click-video');
	var $sectionVideoPlay = $sectionVideo.find('.video_play');
	var $sectionVideoStart;
	var countIn;

	$sectionVideoPlay.each(function () {
		$(this).text($(this).data('play-title'));
	});

	$(window).on('scroll', function () {
		$sectionVideo.each(function () {
			var _this = $(this);
			if(_this.find('article').hasClass('invisible')) {
				_this.find('.f_container').each(function() {
					var _container = $(this);
					resetSlow(_container,'ended');
				});
			}
		});
	});

	function playSlow(_parent) {
		clearInterval(countIn);
		var $parent = _parent;
		$videoCon = $parent.find('video').eq(0);
		$videoCon[0].play();
		$videoCon.bind({
			ended: function() {
				resetSlow($parent,'ended');
				$parent.find('.video_play').text($parent.find('.video_play').data('play-title'));
			},
			timeupdate: function() {
				var curTime = this.currentTime;

				if($parent.closest('article').hasClass('m_feature-super') || $parent.closest('article').hasClass('m_feature-hdr')) {
					if(curTime > 5.5) $parent.addClass('txt-on');
				}
			}
		})

		$parent.addClass('playing loading');

		$sectionVideoStart = setInterval(function() {
			if ($videoCon.prop('currentTime') > 0 && !$('html').hasClass('low-Galaxy')) {
				$parent.find('span.hide-bg').css('opacity', 0);
				$parent.removeClass('loading');
				clearInterval($sectionVideoStart);
				if($('html').hasClass('ie9')) setTimeout(function () { $parent.removeClass('playgo'); },200);
			} else if ($('html').hasClass('low-Galaxy')){
				$parent.find('span.hide-bg').css('display', 'none');
				$parent.removeClass('loading');
				$videoCon.attr('controls','controls');
				$slowMoVideoPlay.remove();
				$parent.find('.click_disable').remove();
				clearInterval($sectionVideoStart);
				if($('html').hasClass('ie9')) setTimeout(function () { $parent.removeClass('playgo'); },200);
			}
		}, 10);
	}
	function resetSlow(_parent, i) {
		var $parent = _parent,
			$videoCon = $parent.find('.video_wrap video');

		if ($parent.hasClass('playing')) {
			$videoCon[0].pause();
			if (i == 'change') {
				$parent.removeClass('pause playgo playing');
			}
			if (!isNaN($videoCon[0].duration) && i != 'pause' && i != 'play') {
				$parent.removeClass('pause playgo playing');
			}
			if (i == 'ended') {
				$videoCon[0].currentTime = 0;
				$parent.removeClass('txt-on');
				$parent.find('span.hide-bg').css('opacity', 1);
			}
			clearInterval($sectionVideoStart);
			$parent.find('.video_play').text($parent.find('.video_play').data('play-title'));
		}
	}

	$sectionVideoPlay.on('click', function (e) {
		var $parent = $(this).parents('.f_container');
		if (!$parent.hasClass('playing')) {
			playSlow($parent);
			$parent.find('.video_play').text($parent.find('.video_play').data('pause-title'));
		} else if ($parent.hasClass('playing')) {
			if (!$parent.hasClass('pause')) {
				$parent.removeClass('playgo').addClass('pause');
				resetSlow($parent,'pause');
				$parent.find('.video_play').text($parent.find('.video_play').data('play-title'));
			} else {
				$parent.removeClass('pause').addClass('playgo');
				playSlow($parent,'play');
				$parent.find('.video_play').text($parent.find('.video_play').data('pause-title'));
			}
		}
		return false;
	});

});

window.GALAXY.modelsLayer = (function() {
	var $pageLayer, $pageLayerCloseButton, $pageLayerBackButton, $pageLayerInner, sectionInner, $pageLayerOpenBtn, $pageLayerInnerPopup, sectionHtml, docScrollTop,
		$pageLayerOpener = null,
		pageLayerOpened = false,
		$originContentsArea = null,
		$originContentsClickable = null,
		backBtnIsKeydown = false;

	function show(pageLayerOpener, sectionInner, specialId) {
		$('#wrap').attr('aria-hidden', 'true');

		if (!$pageLayer) {
			var sectionDisc;
			if(typeof(sectionInner) == 'string') {
				sectionHtml = sectionInner.replace(/galaxy-s20:models:/g, "galaxy-s20:popup:"); //tagging
			} else {
				sectionHtml = sectionInner[0].replace(/galaxy-s20:models:/g, "galaxy-s20:popup:");
				sectionDisc = sectionInner[1];
			}

			var closeTitle = $(pageLayerOpener).attr('data-close-title') ? $(pageLayerOpener).attr('data-close-title') : 'Popup Close';
			var backTitle = $(pageLayerOpener).attr('data-back-title') ? $(pageLayerOpener).attr('data-back-title') : 'Back';

			$pageLayer = $([
				'<div class="hubble models layer-models" style="visibility:hidden;">',
					'<div class="m_ly_outer">',
						'<div class="btn_area">',
							'<button type="button" class="c_btn_back">',backTitle,'</button>',
							'<button type="button" class="c_btn_close">',closeTitle,'</button>',
						'</div>',
						'<div class="m_ly_inner">',
							sectionHtml,
						'</div>',
					'</div>',
					'<div class="m_background"></div>',
				'</div>'
			].join(''));

			$(window).on('resize.resizeImage', function() {
				if($pageLayer) {
					$pageLayer.find('img').each(function(i, image) {
						var src = GALAXY.setMediaBaseURL( GALAXY.getImageSources($(image))[GALAXY.sizeMode] );
						this.src = src;
					});
				}
			});
			$pageLayerInner = $pageLayer.find('.m_ly_inner');
			$pageLayerInner.find('a,button').on('click',function(e){
				var thisOmni = $(this).data('omni');
				thisOmni && GALAXY.omniture(thisOmni);
			});

			var supTit = sectionDisc ? $(sectionDisc).attr('data-title') : $pageLayerInner.find('#desc-section-models ol').attr('data-title');
			var supNum = 1;
			var prevSup, supList = [];
			$pageLayerInner.find('sup').each(function(i){
				var $sup = $(this);
				if (!$sup.hasClass('default')) {
					var disclaimers = this.innerHTML.split(',');
					if(prevSup !== disclaimers[0]) {
						supNum = i+1;
						supList.push(disclaimers[0]);
					}
					Html = '<a href="#desc-section-models" class="click_sup_models" title="'+supTit+'">' + supNum+'</a>';
					$sup.html(Html);
					prevSup = disclaimers[0];
				}
			});

			if(sectionDisc && supList.length > 0) {
				var $descLi = [];
				$.each(supList,function(i){
					if(GALAXY.isGalaxy){
						$descLi.push($(sectionDisc).find('li[data-sup='+supList[i]+']')[0].outerHTML);
					} else {
						$descLi.push($(sectionDisc).find('li').eq(supList[i]-1)[0].outerHTML);
					}
				});
				$descLi = $descLi.join('');

				var $discHtml = $([
					'<article class="m_feature-desc"><div id="desc-section-models"><ol>',
						$descLi,
					'</ol></div></article>'
				].join(''));
				$pageLayerInner.addClass('has-desc').find('>section').append($discHtml[0]);

			}

			$pageLayerInner.find('a.click_sup_models').on('click.clickSup',function(e){
				e.preventDefault();

				if ($('#desc-section-models').length) {
					var idx = parseInt($(this).text().split(',')[0]) - 1,
						$item = $('#desc-section-models').find('li').eq(idx),
						$newItem;

					$item.wrapInner('<a />');
					$newItem = $item.find('>a');
					$newItem.attr({'tabindex': '0'}).focus().one('blur', function() {
						$item.html($newItem.html());
					});
				}
			});

			$pageLayerCloseButton = $pageLayer.find('button.c_btn_close');
			$pageLayerCloseButton.one('keydown touchend', function() {
				backBtnIsKeydown = true;
			});
			$pageLayerCloseButton.one('click', function () {
				$originContentsClickable.each(function(e) {
					var tabindex = $(this).data('prev-tabindex');
					if (tabindex!==undefined&&tabindex!==null) {
						$(this).attr('tabindex',tabindex);
					} else {
						$(this).removeAttr('tabindex');
					}
					if ($originContentsClickable.length-1 == e) {
						$pageLayerCloseButton.attr('tabindex', '-1');
						hide();
					}
				});
			});

			$pageLayer.find('.m_background').one('keydown touchend', function() {
				backBtnIsKeydown = true;
			});
			$pageLayer.find('.m_background').one('click',function(e){
				e.preventDefault();

				$originContentsClickable.each(function(e) {
					var tabindex = $pageLayerCloseButton.data('prev-tabindex');
					if (tabindex!==undefined&&tabindex!==null) {
						$pageLayerCloseButton.attr('tabindex',tabindex);
					} else {
						$pageLayerCloseButton.removeAttr('tabindex');
					}
					if ($originContentsClickable.length-1 == e) {
						$pageLayerCloseButton.attr('tabindex', '-1');
						hide();
					}
				});
			});

			if(specialId) $pageLayer.addClass(specialId);
			if($('#contents').hasClass('highlights')) $pageLayerInner.addClass('has-desc');

			$pageLayer.appendTo(document.body);
			GALAXY.resizeForce = true;
			GALAXY.isMobileSize = GALAXY.sizeMode<3;
			$(window).trigger('resize');
			$pageLayerInnerPopup = $pageLayerInner.find('.models_layer');
			$pageLayerBackButton = $pageLayer.find('button.c_btn_back') ? $pageLayer.find('button.c_btn_back') : null;
			if($pageLayerBackButton) {
				$pageLayerBackButton.on('click.backClickEvent',function(e){
					e.preventDefault();

					$pageLayerInnerPopup.stop().animate({'opacity':'0'},{duration:200,complete:function(){
						$pageLayerInnerPopup.hide();
						$pageLayer.removeClass('depth2-open');
						$pageLayerInner.find('.f_header-type1').removeAttr('aria-hidden');
						$pageLayerInner.find('.f_container').removeAttr('aria-hidden');
						$pageLayer.find('#desc-section-models').removeAttr('aria-hidden');

						$pageLayerInner.attr('tabindex',0);
						$pageLayerInnerPopup.attr('tabindex',-1);
						$pageLayerOpenBtn && $pageLayerOpenBtn.attr('tabindex',0);
						$pageLayerOpenBtn && $pageLayerOpenBtn.focus();

						$pageLayerInner.find('.f_container').find('a,input,select,textarea,button,video,iframe').removeAttr('tabindex');
					}})
				});
			}

			$pageLayerOpenBtn = $pageLayerInner.find('.models-layer_open') ? $pageLayerInner.find('.models-layer_open') : null;
			if($pageLayerOpenBtn) {
				$pageLayerOpenBtn.on('click.layerOpenEvent', function (e) {
					e.preventDefault();

					$pageLayerInnerPopup.show().stop().animate({'opacity':'1'},{duration:200,complete:function(){
						$pageLayer.addClass('depth2-open');
						$pageLayerInner.find('.f_header-type1').attr('aria-hidden',true);
						$pageLayerInner.find('.f_container').attr('aria-hidden',true);
						$pageLayer.find('#desc-section-models').attr('aria-hidden',true);

						$pageLayerBackButton && $pageLayerBackButton.focus();
					}});
					$pageLayerInner.attr('tabindex',-1).scrollTop(0);
					$pageLayerInnerPopup.attr('tabindex',0);
					$pageLayerOpenBtn.attr('tabindex',-1);

					$pageLayerInner.find('.f_container').find('a,input,select,textarea,button,video,iframe').attr('tabindex',-1);
				});
			}
		}

		$pageLayer.removeAttr('aria-hidden');
		docScrollTop = $(document).scrollTop();

		if (!pageLayerOpened) {
			$pageLayer.attr('style','visibility:visible;');
			$pageLayerInner.attr('tabindex', '0');
			$pageLayerBackButton && $pageLayerBackButton.attr('tabindex', '0');
			$pageLayerCloseButton.attr('tabindex', '0');
			$pageLayerCloseButton.focus();
			if (pageLayerOpener) {
				$pageLayerOpener = $(pageLayerOpener);
			}
			$originContentsArea = $('#wrap');
			$originContentsClickable = $originContentsArea.find('a,input,select,textarea,button,video,iframe');
			$originContentsClickable.each(function(e) {
				var tabindex = $(this).attr('tabindex');
				if (tabindex!==undefined&&tabindex!==null) {
					$(this).data('prev-tabindex', tabindex);
				}
				$(this).attr('tabindex','-1');
			});
			$pageLayer.addClass('show');
			$('html').addClass('modelslayer-open');
			$('#wrap').css('top', -docScrollTop);
			GALAXY.noScroll.on();
			pageLayerOpened = true;
		}
	}

	function hide() {
		if (pageLayerOpened) {
			$pageLayerBackButton.off('click.backClickEvent');
			$pageLayerOpenBtn.off('click.layerOpenEvent');
			$pageLayerInner.find('a.click_sup_models').off('click.clickSup');

			$pageLayer.attr('aria-hidden', 'true');
			$('#wrap').removeAttr('aria-hidden');
			$pageLayer.removeClass('show');
			$originContentsClickable.each(function(e) {
				var tabindex = $(this).data('prev-tabindex');
				if (tabindex!==undefined&&tabindex!==null) {
					$(this).attr('tabindex',tabindex);
				} else {
					$(this).removeAttr('tabindex');
				}
			});
			GALAXY.setTransitionEndEvent($pageLayer, function() {
				$pageLayer.remove();
				$pageLayer = null;
				GALAXY.noScroll.off();

				backBtnIsKeydown && $pageLayerOpener && $pageLayerOpener.focus();
				$pageLayerOpener = null;
				backBtnIsKeydown = false;
			});
			pageLayerOpened = false;
			GALAXY.noScroll.off();

			$('html').removeClass('modelslayer-open');
			$('html, body').scrollTop(docScrollTop);
			$('#wrap').removeAttr('style');
		}
	}

	return {
		show: show,
		hide: hide
	}
})();

$.fn.sticky = function (option) {
	return this.each(function () {
		if(!GALAXY.isSticky) return false;
		var
		fixed = $(this),
		fixedInner = fixed.find('.fixed-inner'),
		$section = fixed.closest('section'),
		once = false,
		fixedWrapH, fixedH, winH, subNavH, center, bottom, endFixed, scrTop, fixedAreaPos, startFixed, pos, opt,
		opt = $.extend({
			wrapper: fixed,
			inner: fixedInner,
			section: $section,
			pos: 'center',
		}, option)
		;

		function init(){
			fixedWrapH = fixed.height(),
			fixedH = fixedInner.height(),
			winH = $(window).height(),
			endFixed = fixedWrapH - fixedH
			;

			topSet();

			if(!$section.hasClass('invisible')){
				$section.addClass('sticky');
			}else{
				$section.removeClass('sticky');
			}

			if($(this).length > 0) $('html').addClass('is-sticky')


			setTimeout(function(){
				_scroll($(window).scrollTop());
			},300);
		}

		function topSet(){
			fixedH = fixedInner.height(),
			subNavH = ($('#subnav').length) ? $('#subnav').height() : 0,
			top = ($('#subnav').length) ? $('#subnav').height() : ($('.ma-floating-nav__wrap').length) ? $('.ma-floating-nav__wrap').height() : '0';
			center = ((winH - subNavH - fixedH)/2)+subNavH,
			bottom = winH - fixedH;

			pos = (!opt.pos) ? top : (opt.pos == 'bottom') ? bottom : center;
			fixedInner.css('top', pos);
			
			return pos;
		}

		function _scroll(st){
			scrTop = st;
			fixedAreaPos = Math.floor(fixed[0].getBoundingClientRect().top);
			fixedAreaPos -= pos;
			startFixed = fixedAreaPos;

			// if(startFixed <= 0 && startFixed >= -endFixed){ //fixed
			if(startFixed <= 0 && startFixed >= -(fixedWrapH + (fixedH/4))){ //sticky
				$section.addClass('sticky');
				try {
					if(opt.onScroll) opt.onScroll(startFixed,endFixed);
					topSet();
				}catch(e) {
					return false;
				}

				if(!once){
					if( opt.on ) opt.on();
					fixed.data('once', 'true');
					once = fixed.data('once');
				}
			} else{// none fixed
				if(!$section.children().hasClass('invisible')){
					if(startFixed > 0){
						if(opt.inScroll) opt.inScroll(startFixed);
					}
					if(!$section.hasClass('sticky')) {
						init();
						topSet();
						$section.addClass('sticky');
						try {
							if(opt.init) opt.init();
						}catch(e) {
							return false;
						}
					}
				}else{
					$section.removeClass('sticky');
					if(opt.offScroll) opt.offScroll(startFixed,endFixed);
					if(once){
						if(opt.off) opt.off();
						fixed.data('once', false);
						once = fixed.data('once');
					}
				}

			}

		}

		// scroll
		$(window).scroll(function(){
			var st = $(window).scrollTop();
			_scroll(st);
		});

		// resize
		GALAXY.resize(function(){
			once = false;
			try {
				init();
				if(opt.init) opt.init();
				_scroll($(window).scrollTop());
			}catch(e) {
				return false;
			}
		});
		GALAXY.load(function(){
			init();
				if(opt.init) opt.init();
				_scroll($(window).scrollTop());
		})
	});
};

var models = function(){
    // design
	if($('.models_layer.mc_design').length){
		var design = (function(){
			var
			wrapper = $('.mc_design'),
			photoWrap = $('.m_feature-color .models_layer .tab-photo'),
			deviceWrap = $('.m_feature-color .models_layer .tab-device'),
			colorWrap = $('.m_feature-color .models_layer .tab-color'),
			select = wrapper.data('select'),
			init = function(){
				if(deviceWrap.find('a.on').length < 1) _deviceClick(deviceWrap.find('a').eq(0));
				if(colorWrap.find('.color a.on').length < colorWrap.find('.color').length){
					colorWrap.find('.color').each(function(){
						var _this = $(this);
						if(_this.find('a.on').length < 1) _this.find('a').eq(0).addClass('on');
						if(!_this.find('a.on').attr('title')) _this.find('a.on').attr('title', select);
					});
				}

				mobileTxt();
				_photoClick(photoWrap.find('.photo.on'));
				return this;
			},
			changeImg = function(){
				var omniDevice = omniModel();
				var omniColor = ((activeColor() == 'black' || activeColor() == 'gray') ? 'cosmic' : (activeColor() == 'red') ? 'aura' : 'cloud') +'-'+activeColor();
				var omniView = ['camera', 'perspective', 'front', 'side']
				photoWrap.find('img').each(function(i){
					var _this = $(this);
					var _exp = '.jpg';
					var _src = imgPath() + activeDevice() + '-' + activeColor() + '-0' + (i+1) + _exp;
					var _data = activeDevice() +'-'+ activeColor()+'-0'+(i+1);
					var _alt = photoWrap.data(_data);
					var omni = 'galaxy-s20:popup:color-detail^'+ omniDevice +'^'+ omniColor +':select:'+ omniView[i];

					_this.attr({'src': _src, 'alt': _alt});
					_this.closest('a').attr({'data-omni': omni, 'ga-la': omni});

					$(window).off('resize.resizeImage');
				});

				photoWrap.removeClass('default plus ultra');
				var _idx = $('.tab-device a.on').index();
				switch(_idx){
					case 0 :
					photoWrap.addClass('default');
					break;
					case 1 :
					photoWrap.addClass('plus');
					break;
					case 2 :
					photoWrap.addClass('ultra');
					break;
					default:
					photoWrap.addClass('default');
				}
			},
			changeTab = function(el){
				var _this = $(el);
				_this.addClass('on').siblings().removeClass('on');
				if(!_this.closest('.tab-photo').length && (_this[0].tagName == 'A' || _this[0].tagName == 'BUTTON')) _this.attr('title', select).siblings().attr('title','');

				mobileTxt();
				if(_this.index() == 2){
					$('.tab-photo .round-edge.front').addClass('ultra');
				}else{
					$('.tab-photo .round-edge.front').removeClass('ultra');
				}
			},
			activeDevice = function(){
				return deviceWrap.find('a.on').data('name-no');
			},
			imgPath = function(){
				return photoWrap.data('path');
			},
			activeColor = function(){
				return colorWrap.find('.color.on a.on').attr('class').replace('on', '').trim();
			},
			omniModel = function(){
				var device = deviceWrap.find('a.on').data('name-no');
				switch(device){
					case 'default': device = 'galaxy-s20';
						break;
					case 'plus': device = 'galaxy-s20-plus';
						break;
					case 'ultra': device = 'galaxy-s20-ultra';
						break;
					default: device = 'galaxy-s20';
				}
				return device;
			},
			mobileTxt = function(){
				if(GALAXY.prevSizeMode < 0) return false;
				if(GALAXY.sizeMode <= 2){
					var txt = colorWrap.find('.color.on a.on span').text();

					if(colorWrap.find('.mobile-txt').length < 1) colorWrap.append('<span class="mobile-txt" aria-hidden="true" />');
					colorWrap.find('.mobile-txt').text(txt);
				}else{
					if(colorWrap.find('.mobile-txt').length >= 1) colorWrap.find('.mobile-txt').remove();
				}
			},
			_resize = function(){
				mobileTxt();
				changeImg();
			}
			;

			function _photoClick(el){
				var _this = $(el);
				var removePos, activePosX, prevPosY, prevIdx;

				// if(_this.hasClass('on')) return false;

				prevPosY = _this.attr('data-pos-y');
				prevIdx = photoWrap.find('.on').index();
				removePos = 'left right top bottom';
				activePosX = (_this.attr('data-pos-x') == 'left') ? 'right' : 'left';
				changeTab(el);


				photoWrap.find('.photo').each(function(i){
					var _this = $(this);
					var _x = _this.attr('data-pos-x');
					var _y = _this.attr('data-pos-y');

					if(!_this.hasClass('on')){
						if(i == prevIdx) _y = prevPosY;
						_x = activePosX;
					}
					_this.attr({'data-pos-x': _x, 'data-pos-y': _y});
					_this.removeClass(removePos).addClass(_x+' '+_y);
				});
			};
			function _deviceClick(el){
				if($(el).hasClass('on')) return false;
				var idx = $(el).index();
				changeTab(el);
				changeTab($('.tab-color .color').eq(idx));
				changeImg();
			};
			function _colorClick(el){
				if($(el).hasClass('on')) return false;
				changeTab(el);
				activeColor();
				changeImg();
				mobileTxt();
			}
			;

			return {
				init: init,
				photo: _photoClick,
				device: _deviceClick,
				color: _colorClick,
				tab: changeTab,
				resize: _resize,
				select: select
			}
		})().init();
		design.resize();
	}

	var isGalaxyLayer = GALAXY.isGalaxy && $('.layer-models');
	if (isGalaxyLayer) {
		$('.m_feature-color .models_layer .tab-photo').find('a').off('click');
	}
    $('.m_feature-color .models_layer .tab-photo').find('a').on('click', function(e){
    	if (isGalaxyLayer) {
			GALAXY.omniture($(this).attr('data-omni'));
		}
        e.preventDefault();
		design.photo(this);
    });
    $('.m_feature-color .models_layer .tab-device').find('a').on('click',function(e){
        e.preventDefault();
		design.device(this);
    });
    $('.m_feature-color .models_layer .tab-color').find('a').on('click',function(e){
        e.preventDefault();
        design.color(this);
    });

    // models layer popup
    var $layer, $closeButton,
        $opener = null,
        $openSection = null,
        opened = false,
        $baseContentsArea = null,
        $baseContentsClickable = null,
        $thisContentsClickable = null,
        isKeydown = false
        ;
    $baseContentsArea = $('#wrap');
    $closeButton = $('.models_layer .close');
    $baseContentsClickable = $baseContentsArea.find('a,input,select,textarea,button,video,iframe');

    $(document).on('click','.models-layer_open',function(e){
		e.preventDefault();

		GALAXY.isMobileSize = false;


		if($(document).find('.layer-models .models_popup_zoom').length){
			var idx = $(document).find('.models_popup_zoom .btn-tab a.on').index();
			zoomAni(idx);
		}
    });
	var closeTimeout;
	//in layerpopup back button
	$(document).on('click','.m_ly_outer .c_btn_back',function(e){
		if($(document).find('.m_ly_inner .m_feature-zoom').length){
			clearTimeout(closeTimeout);
			closeTimeout = setTimeout(function(){
				zoomAniReset();
				$(document).find('.m_feature-zoom .tab-con .con').removeClass('active');
			},500);
		}
	});
	$(document).on('click','.models_layer .close',function(e){
		clearTimeout(closeTimeout);
		closeTimeout = setTimeout(function(){
			zoomAniReset();
			$(document).find('.models_popup_zoom .tab-con .con').removeClass('active');
		},500);
	});

    // zoom
	var
		$zoomWrap = $(document).find('.models_popup_zoom'),
		$barWrap = $(document).find('.models_popup_zoom .zoom-bar-wrap'),
        $zoomNum = $(document).find('.models_popup_zoom .zoom-bar-wrap .num span'),
        $barInner = $(document).find('.models_popup_zoom .zoom-bar-wrap .bar-box .bar .inner'),
        $barInnerX30 = $(document).find('.models_popup_zoom .zoom-bar-wrap .bar-box.x30 .bar .inner'),
        $barInnerX100 = $(document).find('.models_popup_zoom .zoom-bar-wrap .bar-box.x100 .bar .inner')
	;
	if($('.models_popup_zoom').length){
		var zoom = (function(){
			var
			_resize = function(){
				if($zoomWrap.find('.models_layer_inner .con.on').index() == 0){
					if(GALAXY.sizeMode >= 3 ){
						_totalMoveLeft = 489;
					}else if(GALAXY.sizeMode == 2){
						_totalMoveLeft = 393;
					}else{
						_totalMoveLeft = 222;
					}
				}else{
					if(GALAXY.sizeMode >= 3 ){
						_totalMoveLeft = 1630;
					}else if(GALAXY.sizeMode == 2){
						_totalMoveLeft = 1310;
					}else{
						_totalMoveLeft = 744;
					}
				}
				$('.bar-box').eq($zoomWrap.find('.models_layer_inner .con.on').index()).find('.inner').css({'margin-left':-_totalMoveLeft});
			}
			return {
				resize : _resize
			}
		})();
	}
	if($barWrap.length){
		zoomBarSet();
	}
	function zoomBarSet(){
		var barNumX30 = 81;
		var barNumX100 = 161;
		for(var b = 0;b < barNumX30; b++){
			$barInnerX30.append('<span></span>');
		}
		for(var c = 0;c < barNumX100; c++){
			$barInnerX100.append('<span></span>');
		}
	}
	var stepTime, textTime;

    var zoomTimeout;
    function zoomAniReset(){
		$barInner.css('margin-left',0);
		$barWrap.find('.bar-box').hide();
		clearTimeout(zoomTimeout);
		$zoomWrap.find('.models_layer_inner .con').removeClass('step1');
		$zoomWrap.find('.models_layer_inner .con').removeClass('step2');
		$zoomWrap.find('.models_layer_inner .con').removeClass('step3');
	}
	function zoomAni(idx){
		var _stepZoomNum;
		var _totalZoomNum;
		var _stepMoveLeft = 0;

		zoomAniReset();

		$barWrap.find('.bar-box').eq(idx).show();
		if(idx == 0){
			if(GALAXY.sizeMode >= 3 ){
				_totalMoveLeft = 489;
			}else if(GALAXY.sizeMode == 2){
				_totalMoveLeft = 393;
			}else{
				_totalMoveLeft = 222;
			}
		}else{
			if(GALAXY.sizeMode >= 3 ){
				_totalMoveLeft = 1630;
			}else if(GALAXY.sizeMode == 2){
				_totalMoveLeft = 1310;
			}else{
				_totalMoveLeft = 744;
			}
			_stepMoveLeft = _totalMoveLeft/4;
		}

        zoomTimeout = setTimeout(function(){
			clearTimeout(zoomTimeout);
			$zoomWrap.find('.models_layer_inner .con').eq(idx).addClass('step1');
			zoomTimeout = setTimeout(function(){
				if(idx == 0){
					$('.zoom-bar-wrap .bar-box').eq(idx).find('.bar .inner')._stop()._animate({'margin-left' : -_totalMoveLeft},{duration: 1000,queue: false, bystep: false, rounding: false, easing: 'easeOutExpo',
						step:function(v){
							if(v.percent >= 0.5){
								$zoomWrap.find('.models_layer_inner .box-30x').addClass('step2');
							}
						},
						complete:function(){
							zoomTimeout = setTimeout(function(){
							},1000);
						}
					});
				}else{
					$('.zoom-bar-wrap .bar-box').eq(idx).find('.bar .inner')._stop()._animate({'margin-left' : -_stepMoveLeft},{duration: 1000,queue: false, bystep: false, rounding: false, easing: 'easeOutExpo',
						complete:function(){
							zoomTimeout = setTimeout(function(){
								$zoomWrap.find('.models_layer_inner .box-100x').addClass('step2');
								zoomTimeout = setTimeout(function(){
									$('.zoom-bar-wrap .bar-box').eq(idx).find('.bar .inner')._animate({'margin-left' : -_totalMoveLeft},{duration: 1000,queue: false, bystep: false, rounding: false, easing: 'easeOutExpo',
										step:function(v){
											if(v.percent >= 0.5){
												$zoomWrap.find('.models_layer_inner .box-100x').addClass('step3');
											}
										},
									});
								},500)
							},500);
						}
					});
				}
			},500)
        },200);
        $('.m_feature-zoom .tab-con .con.on').addClass('active');
	}

    // light night
	var $tabWrap = $(document).find('.tab-wrap');
	var $tabWrapBtn = $tabWrap.find('.btn-tab a');
    var tabClickTrue = true;
	$tabWrap.each(function () {
		var $this = $(this);
		var $title = $this.closest('.models_layer').attr('data-select');
		$this.find('.btn-tab a').eq(1).attr('title',$title);
		$this.find('.btn-tab a').eq(1).addClass('on');
		$this.closest('.models_layer').find('.cont-wrap .tab-con .con').eq(0).css({'visibility':'hidden'});
		$this.closest('.models_layer').find('.cont-wrap .tab-con .con').eq(1).css({'zIndex':'1','opacity':1,'visibility':'visible'}).addClass('on');
	});

	$tabWrapBtn.on('click', function (e) {
        e.preventDefault();
		tabClickTrue = false;
		var $title = $(this).closest('.models_layer').attr('data-select');
		var idx = $(this).index();
        if($(document).find('.hubble.models .models_layer').find('.btn-tab-dep2').length){
            if(!$(this).hasClass('on') && tabClickTrue) {
                $(this).closest('.tab-wrap').find('.btn-tab a').not(idx).removeClass('on');
                $(this).addClass('on');

                $(this).closest('.models_layer').find('.cont-wrap .tab-con .con').not(idx).removeClass('on active').css({'zIndex':0,'visibility':'hidden'});
            }
		}

        if($(document).find('.hubble.models.layer-models').find('.zoom-bar-wrap').length){
            if(!$(this).hasClass('on')){
				$(this).closest('.tab-wrap').find('.btn-tab a').not(idx).removeClass('on');
				$(this).addClass('on');
				$(this).closest('.models_layer').find('.cont-wrap .tab-con .con').not(idx).removeClass('on active').css({'zIndex':0,'visibility':'hidden'});

				$(this).closest('.models_layer').find('.cont-wrap .tab-con .con').removeClass('on active');
				$(this).closest('.models_layer').find('.cont-wrap .tab-con .con').eq(idx).addClass('on active').css({'zIndex':2,'opacity':1,'visibility':'visible'});
				$(this).closest('.models_layer').find('.cont-wrap .tab-con .con').not('.on').css({'zIndex':0,'opacity':0,'visibility':'hidden'});
				zoomAni(idx);
			}else{
				zoomAni(idx);
			}
        }else{
			$(this).closest('.tab-wrap').find('.btn-tab a').not(idx).removeClass('on');
            $(this).closest('.models_layer').find('.cont-wrap .tab-con .con').not(idx).removeClass('on active').css({'zIndex':0,'visibility':'hidden'});
            $(this).closest('.models_layer').find('.cont-wrap .tab-con .con').eq(idx).addClass('on').css({'zIndex':2,'visibility':'visible'}).animate({'opacity':1},300, function () {
                $(this).closest('.models_layer').find('.cont-wrap .tab-con .con').not('.on').css({'opacity':0,'visibility':'hidden'});
			});
        }
		$(this).closest('.tab-wrap').find('.btn-tab a').not(idx).removeAttr('title');
		$(this).addClass('on').attr('title',$title);;

        setTimeout(function(){
            tabClickTrue = true;
        },300)
		return false;
    });

    var $lightTabWrap = $('.btn-tab-dep2 .inner')
    ;
    $lightTabWrap.each(function () {
		var $this = $(this);
		var $title = $this.closest('.models_layer').attr('data-select');
		$this.find('a').eq(0).attr('title',$title);
		if(GALAXY.sizeMode < 3){
			$this.closest('.con').find('figure').eq(0).css({'zIndex':'1','opacity':1,'visibility':'visible'}).addClass('on');
			$this.closest('.con').find('figure').eq(1).css({'zIndex':'0','opacity':0,'visibility':'hidden'});
		}
	});
    $lightTabWrap.find('a').on('click',function(e){
        e.preventDefault();
        if(!$(this).hasClass('on') && tabClickTrue) {
            tabClickTrue = false;
            var $this = $(this),
				_idx = $(this).index(),
				$title = $this.closest('.models_layer').attr('data-select')
			;
            $this.closest('.con').find('figure').not(_idx).removeClass('on');
            $this.closest('.con').find('a').removeClass('on').removeAttr('title');
            $this.addClass('on').attr('title',$title);

            $this.closest('.con').find('figure').not(_idx).removeClass('on').css({'zIndex':0,'visibility':'hidden'});
            $this.closest('.con').find('figure').eq(_idx).addClass('on').css({'zIndex':1,'visibility':'visible'}).animate({'opacity':1},300, function () {
                $this.closest('.con').find('figure').not('.on').css({'opacity':0,'visibility':'hidden'});
                tabClickTrue = true;
            });
        }
    })


    var onResize = function() {
        if (GALAXY.sizeMode != GALAXY.prevSizeMode) {
			if($('.models_layer.mc_design').length){
				design.resize();
			}
			if($('.m_content-zoom').hasClass('modelsLayerOpen')){
				zoom.resize();
			}
            if (GALAXY.sizeMode > 2) {
				if($('.i_popup-bright-night').length){
					$('#models-night .models_layer .cont-wrap figure:not(on)').removeAttr('style');
					$('.models_popup_night.models_layer .cont-wrap figure').removeAttr('style');
				}
            } else {
				if($('.i_popup-bright-night').length){
					$(document).find('.models_popup_night .con figure').css({'zIndex': 0, 'opacity': 0, 'visibility': 'hidden'});
					$(document).find('.models_popup_night .con figure.on').css({'zIndex': 1, 'opacity': 1, 'visibility': 'visible'});
				}
                $('#models-night .models_layer .cont-wrap figure').each(function(){
					var $this = $(this),
						value = $this.hasClass('on') ? 1 : 0;
					$this.css({zIndex: value, opacity: value});
				})
				if (GALAXY.sizeMode == 1) {
					if($(document).find('.models_layer').hasClass('active')){
						$('.models_layer.active').find('.close').trigger('click');
					}
				}
            }
        }
    }
    GALAXY.resizeFunctions.push( onResize );
};

function maxHeight($elements, force) {
	var oHeight = 0,
		func = force ? 'outerHeight': 'height';
	$elements.each(function() {
		$(this)[func]('');
		oHeight = Math.max(oHeight, $(this)[func]());
	});
	$elements[func]( oHeight );
	return oHeight;
}
$.fn.maxHeight = function() {
	maxHeight($(this));
}

// Jump Banner
;(function(selector) {
	if (!$(selector).length) return;

	var $element  = $(selector),
		$wrapper  = $('.jump_wrap ul'),
		$items    = $('.jump_wrap li>a', selector),
		$btnArea  = $('.m_jump_controls_arrow'),
		$btnPrev  = $btnArea.find('a.m_btn_type2-prev'),
		$btnNext  = $btnArea.find('a.m_btn_type2-next'),
		lens      = $items.length,
		maxView   = 5,
		viewCount = lens - maxView,
		index     = 0,
		interval = false;

	var init = function() {
			if (lens <= maxView) {
				$btnArea.hide();
				return;
			}

			$items.on('keyup', focus).slice(maxView,lens).addClass('hide');
			$btnPrev.on('click', prev).addClass('hide');
			$btnNext.on('click', next);

			if (GALAXY.sizeMode>2) {
				index = $element.find('.jump_wrap li.on').index();
				if (index == 0) {
					action(index, true);
				} else {
					index = index-maxView + 1;
					action(index, true);
				}
			}

			GALAXY.resize(resize);
		},
		prev = function() {
			action(index-1);
			return false;
		},
		next = function() {
			action(index+1);
			return false;
		},
		focus = function(e) {
			if (e.keyCode == 9) {
				if (GALAXY.sizeMode>2) {
					var thisIndex = $items.index(this);
					if (thisIndex == 0) {
						action(thisIndex, true);
					} else {
						thisIndex = thisIndex-maxView + 1;
						action(thisIndex, true);
					}
				}
			}
		},
		action = function(i, isFocus) {
			var isRTL = !!$('html').hasClass('rtl') ? -1 : 1;

			index = Math.min(Math.max(0, i),viewCount);
			$items.addClass('hide').slice(index,maxView+index).removeClass('hide');

			if (!index) {
				$btnPrev.addClass('hide');
				$btnNext.removeClass('hide');
				if (!isFocus) $btnNext.focus();
			}
			else if (index == viewCount) {
				$btnNext.addClass('hide');
				$btnPrev.removeClass('hide');
				if (!isFocus) $btnPrev.focus();
			}
			else {
				$btnNext.removeClass('hide');
				$btnPrev.removeClass('hide');
			}

			var scrollLeft = $items.parent().outerWidth()*index * isRTL;
			$wrapper.__animate({scrollLeft: scrollLeft}, {duration: 550, easing: 'easeOutCubic', force3D: true});

		},
		resize = function() {
			var isRTL = !!$('html').hasClass('rtl') ? -1 : 1;

			if (GALAXY.sizeMode>2) {
				$wrapper.__animate({scrollLeft: $items.parent().outerWidth()*index*isRTL}, {duration: 550, easing: 'easeOutCubic', force3D: true});
			} else {
				$wrapper.__animate({scrollLeft: 0}, {duration: 550, easing: 'easeOutCubic', force3D: true});
			}
		}
	GALAXY.load( init );
})('.m_jump_controls');
