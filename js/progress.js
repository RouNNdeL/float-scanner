const LoadingOverlayProgress = function(options)
{
    let _bar;
    let _text;
    let _price;
    let _amount;
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
        Init: Init,
        Update: Update,
        UpdatePrice: UpdatePrice,
        UpdateAmount: UpdateAmount
    };

    function Init()
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
                    "bottom": "200px",
                    "position": "absolute",
                    "width": "100%"
                }
            }).appendTo(wrapper);
        _price = $("<p>",
            {
                class: "loading_overlay_progress_price",
                css: {
                    "width": "100%",
                    "text-align": "center",
                    "font-size": "24px",
                    "color": "#16202D"
                }
                ,
                text: "Scanning floats..."
            }).appendTo(p_wrap);
        _amount = $("<p>",
            {
                class: "loading_overlay_progress_amount",
                css: {
                    "width": "100%",
                    "text-align": "center",
                    "font-size": "24px",
                    "color": "#16202D"
                }
                ,
                text: ""
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
        Update(0);
        return wrapper;
    }

    function Update(value)
    {
        if(value < 0) value = 0;
        if(value > 100) value = 100;
        const r = {"right": (100-value)+"%"};
        _bar.css(r);
        _text.css(r);
        _text.text(value+"%");
    }

    function UpdatePrice(value)
    {
        _price.text(value);
    }

    function UpdateAmount(value)
    {
        _amount.text(value);
    }
};
