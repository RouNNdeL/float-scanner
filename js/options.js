/**
 * Created by Krzysiek on 2016-11-28.
 */
/**Save property template
 function save(event)
 {
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
    const id = parent.attr("id");
    tmp.qualities[id].PROPERTY = target.val();
    setOptions(tmp, {});
 }
 */
"use strict";
String.prototype.capitalize = function()
{
    return this.charAt(0).toUpperCase() + this.slice(1);
};
Array.prototype.prepend = function(value)
{
    const newArray = this.slice(0);
    newArray.unshift(value);
    return newArray;
};
//Globals
let settings = $.extend(true, {}, DEFAULT_SETTINGS);
$(function()
{
    loadOptions();
});
function editName(event)
{
    const target = $(event.target);
    const parent = target.closest(".setting");
    const id = parent.attr("id");
    const input = $("<input>", {
        id: "edit-" + id,
        type: "text",
        value: target.text(),
        class: "black-text edit card-title"
    });
    input.insertBefore(target);
    input.select();
    target.css("display", "none");
    input.blur(saveName);
    input.on("keyup", function(event)
    {
        if(event.which === 13)
            saveName(event);
    });
}

function saveName(event)
{
    const target = $(event.target);
    const span = target.siblings("span.card-title");
    const new_name = target.val();
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
    span.css("display", "");
    span.text(new_name);
    tmp.qualities[parent.attr("id")].name = new_name;
    target.remove();
    setOptions(tmp, {notify: true, overwrite: false, reload: true});
}

function saveNumber(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
    if(target.val() < 0)
        target.val(0);
    if(target.val() > 100)
        target.val(100);
    tmp.qualities[parent.attr("id")].limit = target.val();
    setOptions(tmp, {notify: true, overwrite: false, reload: false});
}

function saveColor(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
    parent.find(".example").css("color", target.val());
    tmp.qualities[parent.attr("id")].css.color = target.val();
    setOptions(tmp, {notify: true, overwrite: false, reload: false});
}

function saveSize(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
    const id = parent.attr("id");
    let size = parseInt(target.val().replace(/[^0-9]/g, ''));
    if(size > 24)
        size = 24;
    else if(size < 8)
        size = 8;
    $("#" + id + "-example").css("font-size", size + "px");
    target.val(size + 'px');
    tmp.qualities[id].css["font-size"] = size + 'px';
    setOptions(tmp, {notify: true, overwrite: false, reload: false});
}

function saveWeight(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
    parent.find(".example").css("font-weight", target.val());
    tmp.qualities[parent.attr("id")].css["font-weight"] = target.val();
    setOptions(tmp, {notify: true, overwrite: false, reload: false});
}

function saveFormat(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
    const id = parent.attr("id");
    tmp.qualities[id].format = target.val();
    setOptions(tmp, {notify: true, overwrite: false, reload: true});
}

function saveFilter(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
    const id = parent.attr("id");
    $(".filter").not(target).prop("checked", false);
    tmp.filter_by = parseInt(id);
    setOptions(tmp, {notify: true, overwrite: false, reload: false});
}

function saveSessionThreshold(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
    const id = parent.attr("id");
    $(".session_threshold").not(target).prop("checked", false);
    tmp.session_threshold = parseInt(id);
    setOptions(tmp, {notify: true, overwrite: false, reload: false});
}

function saveDelay(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const step = parseInt(target.attr("step"));
    let new_val = Math.round(target.val() / step) * step;
    if(new_val < 50)
        new_val = 50;
    target.val(new_val);
    tmp.request_delay = new_val;
    setOptions(tmp, {notify: true, overwrite: false, reload: false});
}

function saveCurrency(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    tmp.currency = parseInt(target.val());
    setOptions(tmp, {notify: true, overwrite: false, reload: false});
}

function resetToDefaults(event)
{
    setOptions(DEFAULT_SETTINGS, {notify: true, overwrite: true, reload: true});
}

function delRule(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
    delete tmp.qualities[parent.attr("id")];
    setOptions(tmp, {notify: true, overwrite: true, reload: true});
}

function addRule(event)
{
    const tmp = $.extend(true, {}, settings);
    tmp.qualities.push(settings.defaults);
    setOptions(tmp, {notify: true, reload: true, overwrite: true, scroll_to: settings.qualities.length - 1})
}

function clearCache(event)
{
    let disp = false;
    notifyClearCache(function(resp)
    {
        if(!disp)
        {
            disp = true;
            if(resp)
            {
                Materialize.toast("Success!", 2500);
                const tmp = $.extend(true, {}, settings);
                tmp.cache_size = 0;
                setOptions(tmp, {notify: false, reload: true});
            }
            else
            {
                Materialize.toast("Failure!", 2500);
                Materialize.toast("Please open steam market in a new tab", 2500);
            }
        }
    });
}
/*function reloadExample(sett)
 {
 const parents = $(".setting");
 parents.forEach(function(i)
 {
 const ex = $(this).find(".example");
 const id = $(this).attr(id);

 });
 }*/
function setupCurrencySelect(currencies, select)
{
    for(let k in currencies)
    {
        if(!currencies.hasOwnProperty(k) || !currencies[k].hasOwnProperty("name") || !currencies[k].hasOwnProperty("symbol"))
            continue;
        const option = $("<option>", {
            value: k,
            text: currencies[k].name + " (" + currencies[k].symbol + ")"
        });
        select.append(option);
    }
}

function loadHTML(sett, scroll = null)
{
    const bound = $(".bound");
    const con = $("#settings_container");
    const qualities = sett.qualities;

    con.empty();
    bound.off();
    bound.removeClass("bound");

    for(let i = 0; i < qualities.length; i++)
    {
        if(qualities[i] === null || qualities[i] === undefined)
            continue;
        const name = qualities[i].name || DEFAULT_SETTINGS.defaults.name;
        const limit = qualities[i].limit || DEFAULT_SETTINGS.defaults.limit;
        const format = qualities[i].format || DEFAULT_SETTINGS.defaults.format;
        const color = qualities[i].css["color"] || DEFAULT_SETTINGS.defaults.css["color"];
        const size = qualities[i].css["font-size"] || DEFAULT_SETTINGS.defaults.css["font-size"];
        const weight = qualities[i].css["font-weight"] || DEFAULT_SETTINGS.defaults.css["font-weight"];
        const filter = sett.filter_by;
        const session_threshold = sett.session_threshold;
        const id = i;
        const setting = $.parseHTML(generateSetting(name, limit, color, size, weight, format, id));

        con.append(setting);
        const select = $("#" + id + "-weight");
        const example = $("#" + id + "-example");
        $("#" + id + "-filter").prop("checked", id === filter);
        $("#" + id + "-session_threshold").prop("checked", id === session_threshold);
        select.val(weight);
        select.material_select();
        example.text(formatInfo(sett, id, Math.random(), Math.round(Math.random() * 100)));
    }

    $("#global-container").scrollSpy();

    if(scroll !== null)
        $('body').animate({scrollLeft: $("body").outerWidth()}, 750);

    $(window).scroll(function()
    {
        const outer = parseInt($("#globals-container").closest(".holder").position().top);
        $("#globals-container").css("top", -$(window).scrollTop() + outer);
    });

    const title = $("div.card-title");
    const limit = $("input[type=number].limit");
    const color = $("input[type=color]");
    const size = $("input[type=text].size");
    const weight = $("select.weight");
    const format = $("input[type=text].format");
    const filter = $("input[type=radio].filter");
    const session_threshold = $("input[type=radio].session_threshold");

    const currency = $("#currency-select");
    const delay = $("input[type=number]#search-delay");
    const del = $("i.delete");
    const reset = $("#btn-reset");
    const add = $("#btn-add");
    const clear = $("#btn-clear_cache");

    delay.val(sett.request_delay);
    setupCurrencySelect(CURRENCIES, currency);
    currency.val(sett.currency);
    currency.material_select();
    clear.text("Clear listing cache (" + Math.floor((sett.cache_size / 1024) * 100) / 100 + "kb)");

    title.on("dblclick", editName).addClass("bound");
    limit.change(saveNumber).addClass("bound");
    color.change(saveColor).addClass("bound");
    size.change(saveSize).addClass("bound");
    weight.change(saveWeight).addClass("bound");
    format.change(saveFormat).addClass("bound");
    filter.change(saveFilter).addClass("bound");
    session_threshold.change(saveSessionThreshold).addClass("bound");

    currency.change(saveCurrency).addClass("bound");
    delay.change(saveDelay).addClass("bound");
    del.click(delRule).addClass("bound");
    reset.click(resetToDefaults).addClass("bound");
    add.click(addRule).addClass("bound");
    clear.click(clearCache).addClass("bound");
}
/*async function getCountryCode()
 {
 return call(COUNTRY_CODE_API, "json").countryCode;
 }*/
function generateSetting(name, value, color, size, weight, format, id)
{
    return "<div class=\"row setting\" id=\"" + id + "\" style=\"margin: 5px;\">" +
        "    <div class=\"card\">" +
        "        <div class=\"card-content white-text\">" +
        "            <input type=\"radio\" class=\"filter\" id=\"" + id + "-filter\">" +
        "            <label for=\"" + id + "-filter\">Default filter</label>" +
        "            <input type=\"radio\" class=\"session_threshold\" id=\"" + id + "-session_threshold\">" +
        "            <label for=\"" + id + "-session_threshold\">Include in sessions</label>" +
        "            <div class=\"row small-margin small-margin\">" +
        "                <i class=\"material-icons md-dark right delete no-select\" id=\"" + id + "-delete\">close</i>" +
        "                <div class=\"title-container\">" +
        "                    <div class=\"card-title black-text\">" + name + "</div>" +
        "                </div>" +
        "            </div>" +
        "            <div >" +
        "                <label for=\"" + id + "-percentage\">Minimum value</label>" +
        "                <input class=\"small-margin black-text limit\" type=\"number\" id=\"" + id + "-percentage\" min=\"0\" max=\"100\" value=\"" + value + "\">" +
        "            </div>" +
        "            <div  class=\"row small-margin\">" +
        "                <label for=\"" + id + "-color\">Color</label>" +
        "                <input type=\"color\" id=\"" + id + "-color\" value=\"" + color + "\">" +
        "            </div>" +
        "            <div>" +
        "                <label for=\"" + id + "-size\">Font size</label>" +
        "                <input class=\"small-margin black-text size\" type=\"text\" id=\"" + id + "-size\" value=\"" + size + "\">" +
        "            </div>" +
        "            <div>" +
        "                <label for=\"" + id + "-weight\">Font style</label>" +
        "                <select class=\"black-text weight\" id=\"" + id + "-weight\">" +
        "                    <option value=\"lighter\">Lighter</option>" +
        "                    <option value=\"normal\" selected>Normal</option>" +
        "                    <option value=\"bold\">Bold</option>" +
        "                </select>" +
        "            </div>" +
        "            <div>" +
        "                <label for=\"" + id + "-format\">Format</label>" +
        "                <input class=\"small-margin black-text format\" type=\"text\" id=\"" + id + "-format\" value=\"" + format + "\">" +
        "            </div>" +
        "            <div class=\"row small-margin\">" +
        "                <label for=\"" + id + "-example\">Preview:</label>" +
        "                <div class=\"example-container\" style=\"margin-top: 4px; background-color: " + settings.row_background + ";\">" +
        "                    <p id=\"" + id + "-example\" style=\"font-size: " + size + "; font-weight: " + weight + "; color: " + color + ";\" class=\"example\">0.12345 (56%)</p>" +
        "                </div>" +
        "            </div>" +
        "        </div>" +
        "    </div>" +
        "</div>";
}

function setOptions(set, options = {})
{
    const defaults = {
        overwrite: false,
        reload: true,
        notify: true,
        save: true,
        scroll_to: null
    };

    const savingSettings = $.extend({}, defaults, options);
    if(savingSettings.overwrite)
        settings = $.extend(true, {}, set[STORAGE_SETTINGS] || set);
    else
        $.extend(true, settings, set[STORAGE_SETTINGS] || set);

    while((settings.qualities[settings.filter_by] === null || settings.qualities[settings.filter_by] === undefined) && settings.qualities.length > 1)
    {
        settings.filter_by = Math.abs(settings.filter_by - 1);
    }

    if(savingSettings.reload)
        loadHTML(settings, savingSettings.scroll_to);

    if(savingSettings.save)
        saveOptions(settings, function()
        {
            if(savingSettings.notify)
                notifyUpdate();
        });
    else if(savingSettings.notify)
        notifyUpdate();
}

function getSettings()
{
    return settings;
}

function notifyUpdate(callback)
{
    chrome.tabs.query({}, function(tabs)
    {
        for(let i = 0; i < tabs.length; ++i)
        {
            if(checkForMarketTab(tabs[i]))
                continue;
            chrome.tabs.sendMessage(tabs[i].id, {type: TYPE_UPDATE_SETTINGS}, callback);
        }
    });
}

function notifyClearCache(callback)
{
    chrome.tabs.query({}, function(tabs)
    {
        for(let i = 0; i < tabs.length; ++i)
        {
            if(checkForMarketTab(tabs[i]))
                continue;
            chrome.tabs.sendMessage(tabs[i].id, {type: TYPE_CLEAR_CACHE}, callback);
        }
    });
}

function checkForMarketTab(tab)
{
    return tab.url === undefined || tab.url === null || tab.url.match(/steamcommunity\.com\/market/) === null;
}

function saveOptions(settings, callback)
{
    const obj = {};
    obj[STORAGE_SETTINGS] = settings;
    chrome.storage.sync.set(obj, callback);
}

function loadOptions()
{
    chrome.storage.sync.get(STORAGE_SETTINGS, setOptions);
}