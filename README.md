JetSlider
=========

Simple jQuery based slider

```html
<div class="slider-cont jet-slider">
    <ul class="jet-slider-frames">
        <li>
            <img src="image1.jpg" alt=""/>
        </li>
        <li>
            <img src="image1.jpg" alt=""/>
        </li>
        <li>
            <img src="image1.jpg" alt=""/>
        </li>
    </ul>
    <div class="slider-controls">
        <div id='navigation-switcher-block'>
            <div id='navigation-caption-block'>
                <div class="jet-slider-button jet-slider-button-back"></div>
                <div class="jet-slider-button jet-slider-button-forward" id="right-arrow"></div>
            </div>
        </div>
    </div>
</div>
```

```js

var sliderDomNode = $('.jet-slider');
var params = {
    'shuffle': false,
    'resizable': true,
    'transition_effect': 'moon',
    'auto' : true,
    'delay' : 5000
};

sliderDomNode.bind("onSliderInit", function(event, slider) {
        console.log('init');
    });

sliderDomNode.bind('onRewindStart', function() {
    console.log('rewind');
});

sliderDomNode.bind("onEnterFrame", function(event, slider) {
    console.log('enerFrame');
});

sliderDomNode.jetSlider(params);
```