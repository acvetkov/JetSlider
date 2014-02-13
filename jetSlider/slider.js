/**
 * Слайдер JetHelix
 * @author www.fresh-team.ru
 *
 * Структура параметров:
 * - shuffle (bool),
 * - resizable (bool),
 * - transition_effect (standard, moon)
 *
 * DOM-элемент слайдера генерирует события:
 * - onSliderInit - после инициализации слайдера и прогрузки всех кадров,
 * - onEnterFrame - при входе на новый кадр,
 * - onSliderResize - при изменении размера слайдера
 *
 * К jQuery-объекту элемента добавляются методы:
 * - back(n)
 * - forward(n)
 *
 * TODO: переписать комменты на бездуховном языке
 */
(function ($) {
    'use strict';
    $.fn.jetSlider = function(params) {
        var sliderObject = new JetSlider(this, params);
        this.forward = sliderObject.forward;
        this.back = sliderObject.back;
    };

    function JetSlider(sliderDomObject, params) {
        if (params == undefined)
            params = {};

        //Публичные методы
        this.forward = forward;
        this.back = back;

        var jetSliderSelf = this;
        var tipWindowNode = null;
        var sliderWidth = 0;
        var sliderHeight = 0;
        var framesCount = 0;
        var oldOffset = 0;
        var framesOffset = 0;
        var lockRewind = false;

        var framesCollection;
        var activeFrame;

        setParams();
        initSlider();

        function setParams() {
            if (!('shuffle' in params))
                params['shuffle'] = false;

            if (!('resizable' in params))
                params['resizable'] = false;

            if (!('transition_effect' in params))
                params['transition_effect'] = 'standard';
        }

        function initSlider() {
            framesCollection = $('.jet-slider-frames li', sliderDomObject);
            framesCount = framesCollection.length;

            if (params['shuffle'])
                shuffleFrames();

            sliderWidth = sliderDomObject.width();
            sliderHeight = $('.jet-slider-frames', sliderDomObject).height();
            buildFrames();
            if (params['resizable'])
                $(window).resize(makeResize);

            bindNavEvents();
            bindIndicatorEvents();
            buildTips();
            checkSliderReady();
        }

        function shuffleFrames() {
            var framesDomObjects = framesCollection.get();
            var shuffledDomObjects = [];
            for (var i=0; i<framesCount; ++i) {
                var random = Math.floor(Math.random() * framesDomObjects.length);
                var randElem = $(framesDomObjects[random]).clone(true);
                framesDomObjects.splice(random, 1);
                shuffledDomObjects.push(randElem);
            }

            framesCollection.each(function(i) {
                $(this).replaceWith(shuffledDomObjects[i]);
            });

            framesCollection = $('.jet-slider-frames li', sliderDomObject);
        }

        function buildFrames() {
            setFramesLeft();
            if (params['transition_effect'] == 'moon' && !activeFrame) {
                activeFrame = $('.jet-slider-frames li:first', sliderDomObject);
                activeFrame.addClass('jet-slider-active-frame');
            }
        }

        function setFramesLeft() {
            framesCollection.each(function(i) {
                var left = sliderWidth * (i + framesOffset);
                left = left.toString() + 'px';
                $(this).css('left', left);
            });
        }

        function makeResize() {
            sliderWidth = sliderDomObject.width();
            sliderHeight = $('.jet-slider-frames', sliderDomObject).height();
            buildFrames();
            sliderDomObject.trigger('onSliderResize', [jetSliderSelf]);
        }

        function bindNavEvents() {
            $('.jet-slider-button-forward', sliderDomObject).click(function() {
                forward();
                return false;
            });

            $('.jet-slider-button-back', sliderDomObject).click(function() {
                back();
                return false;
            });
        }

        function bindIndicatorEvents() {
            $('.jet-slider-indicator a', sliderDomObject).click(function() {
                var targFrame = this.href.replace(/.+-(\d+)$/, '$1');
                targFrame = parseInt(targFrame);

                var deltaFrame = targFrame + framesOffset;
                if (deltaFrame > 0)
                    forward(deltaFrame);
                else
                    back(-deltaFrame);

                return false;
            });

            sliderDomObject.bind('onEnterFrame', setIndicatorActive);
        }

        function setIndicatorActive() {
            var num = 1 - framesOffset;
            $('.jet-slider-indicator li', sliderDomObject).removeClass('jet-slider-indicator-selected');
            $('.jet-slider-indicator li:nth-child(' + num + ')', sliderDomObject).addClass('jet-slider-indicator-selected');
        }

        function buildTips() {
            tipWindowNode = $('.jet-slider-tip-window:first', sliderDomObject);
            fillTipText(false);
            sliderDomObject.bind('onEnterFrame', fillTipText);
        }

        function fillTipText(useFade) {
            if (useFade == undefined)
                useFade = true;

            if (useFade)
                tipWindowNode.hide();

            var currentFrameNumber = 1 - framesOffset;
            var oCurrentFrameImage = $('.jet-slider-frames li:nth-child(' + currentFrameNumber + ') img', sliderDomObject);
            var text = oCurrentFrameImage.attr('data-text') || oCurrentFrameImage.attr('alt');

            if (text) {
                tipWindowNode.html(text);
                if (useFade)
                    tipWindowNode.fadeIn();
                else
                    tipWindowNode.show();
            }
            else {
                tipWindowNode.hide();
            }
        }

        function checkSliderReady() {
            var imgCollection = $('img', sliderDomObject);
            if (imgCollection.length == 0) {
                sliderDomObject.trigger('onSliderInit', [jetSliderSelf]);
                return;
            }

            imgCollection.each(function() {
                var elem = $(this);
                elem.attr('data-src', elem.attr('src'));
                elem.attr('src', null);
            });

            var loaded = 0;
            imgCollection.load(function() {
                if (++loaded == imgCollection.length)
                    sliderDomObject.trigger('onSliderInit', [jetSliderSelf]);
            });

            imgCollection.each(function() {
                var elem = $(this);
                elem.attr('src', elem.attr('data-src'));
            });
        }

        function forward(n) {
            if (lockRewind)
                return;

            if (n == undefined)
                n = 1;

            oldOffset = framesOffset;
            framesOffset -= n;
            makeRewind();

            sliderDomObject.trigger('onEnterFrame', [jetSliderSelf]);
        }

        function back(n) {
            if (lockRewind)
                return;

            if (n == undefined)
                n = 1;

            oldOffset = framesOffset;
            framesOffset += n;
            makeRewind();

            sliderDomObject.trigger('onEnterFrame', [jetSliderSelf]);
        }

        function makeRewind() {
            lockRewind = true;
            if (params['transition_effect'] == 'moon')
                moonRewind();
            else
                standardRewind();
        }

        function moonRewind(targLeft, dir) {
            activeFrame = $('.jet-slider-active-frame', sliderDomObject);
            sliderDomObject.bind('onSliderResize', makeAnimResizeCorr);

            var leftShift = (dir > 0) ? '+=10%' : '-=10%';
            activeFrame.animate(
                {
                    'left': leftShift,
                    'opacity' : 0
                },
                'slow',
                function () {
                    activeFrame.css('left', 0);
                    activeFrame.css('opacity', 1);
                    framesCollection.css('left', targLeft);

                    framesCollection.removeClass('jet-slider-active-frame');
                    framesCollection.each(function() {
                        var elem = $(this);
                        if (parseInt(elem.css('left')) == 0) {
                            elem.addClass('jet-slider-active-frame');
                            activeFrame = elem;
                        }
                    });

                    activeFrame.hide();
                    activeFrame.fadeIn();

                    sliderDomObject.unbind('onSliderResize', makeAnimResizeCorr);
                    lockRewind = false;
                }
            );
        }

        function makeAnimResizeCorr() {
            sliderDomObject.unbind('onSliderResize', makeAnimResizeCorr);

            if (activeFrame)
                activeFrame.stop(true, true);
            framesCollection.stop(true, true);

            setFramesLeft();
        }

        function makeDltOffset() {
            var dltOffset;

            if (framesOffset <= -framesCount) {
                dltOffset = -(framesCount - 1);
                framesOffset = 0;
            }
            else if (framesOffset > 0) {
                dltOffset = framesCount - 1;
                framesOffset = 1 - framesCount;
            }
            else {
                dltOffset = -(framesOffset - oldOffset);
            }

            return dltOffset;
        }

        function standardRewind() {
            sliderDomObject.bind('onSliderResize', makeAnimResizeCorr);

            var dltOffset = makeDltOffset();
            var targLeftValue = Math.abs(sliderWidth*dltOffset);

            var targLeft;
            if (dltOffset < 0)
                targLeft = '+='+targLeftValue+'px';
            else
                targLeft = '-='+targLeftValue+'px';

            framesCollection.animate(
                {'left': targLeft},
                'slow',
                function () {
                    sliderDomObject.unbind('onSliderResize', makeAnimResizeCorr);
                    lockRewind = false;
                }
            );
        }
    }
})(jQuery);
