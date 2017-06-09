const LoadingOverlayProgress = function(options)
{
    let _bar;
    let _text;
    let _second;
    let _first;
    let _progress;
    let _third;
    let _settings = $.extend(true, {}, {
        bar: {
            "bottom": "25px",
            "height": "20px",
            "background": "#9bbb59"
        },
        text: {
            "bottom": "50px",
            "font": "14pt/1.2 sans-serif",
            "color": "#303030"
        }
    }, options);

    return {
        init: init,
        updateProgress: updateProgress,
        updateText1: updateText1,
        updateText2: updateText2,
        updateText3: updateText3,
        getProgress: getProgress
    };

    function init()
    {
        const wrapper = $("<div>", {
            class: "loadingoverlay_progress_wrapper",
            css: {
                "position": "relative",
                "width": "100%",
                "flex": "1 0 auto"
            }
        });
        const p_wrap = $("<div>",
            {
                css: {
                    "bottom": "150px",
                    "position": "absolute",
                    "width": "100%"
                }
            }).appendTo(wrapper);
        _third = $("<p>",
            {
                class: "loading_overlay_progress_more",
                css: {
                    "width": "100%",
                    "text-align": "center",
                    "font-size": "24px",
                    "color": "#16202D"
                }
            }).appendTo(p_wrap);
        _first = $("<p>",
            {
                class: "loading_overlay_progress_price",
                css: {
                    "width": "100%",
                    "text-align": "center",
                    "font-size": "24px",
                    "color": "#16202D"
                }
            }).appendTo(p_wrap);
        _second = $("<p>",
            {
                class: "loading_overlay_progress_amount",
                css: {
                    "width": "100%",
                    "text-align": "center",
                    "font-size": "24px",
                    "color": "#16202D"
                }
            }).appendTo(p_wrap);
        _bar = $("<div>", {
            class: "loadingoverlay_progress_bar",
            css: $.extend(true, {
                "left": "0"
            }, _settings.bar)
        }).appendTo(wrapper);
        _text = $("<div>", {
            class: "loadingoverlay_progress_text",
            css: $.extend(true, {
                "position": "absolute",
                "left": "0",
                "text-align": "right",
                "white-space": "nowrap"
            }, _settings.text),
            text: "0 %"
        }).appendTo(wrapper);
        updateProgress(0, "");
        return wrapper;
    }

    function updateProgress(percentage, text, tracker)
    {
        if(percentage < 0) percentage = 0;
        if(percentage > 100) percentage = 100;
        const r = {"right": (100 - percentage) + "%"};
        _bar.css(r);
        _text.css(r);
        _text.text(text);
        _progress = tracker;
    }

    function updateText1(value)
    {
        _first.text(value);
    }

    function updateText2(value)
    {
        _second.text(value);
    }

    function updateText3(value)
    {
        _third.text(value);
    }

    function getProgress()
    {
        return _progress;
    }
};
