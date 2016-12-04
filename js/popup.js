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
String.prototype.capitalize = function()
{
    return this.charAt(0).toUpperCase()+this.slice(1);
};
Array.prototype.prepend = function(value)
{
    const newArray = this.slice(0);
    newArray.unshift(value);
    return newArray;
}
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
        id: "edit-"+id,
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
        if(event.which == 13)
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
    tmp.qualities[parent.attr("id")].limit = target.val();
    setOptions(tmp, {notify: true, overwrite: false, reload: false});
}
function saveColor(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
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
    if(size > 32)
        size = 32;
    else if(size < 8)
        size = 8;
    $("#"+id+"-example").css("font-size", size+"px");
    target.val(size+'px');
    tmp.qualities[id].css["font-size"] = size+'px';
    setOptions(tmp, {notify: true, overwrite: false, reload: false});
}
function saveWeight(event)
{
    const target = $(event.target);
    const tmp = $.extend(true, {}, settings);
    const parent = target.closest(".setting");
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
    tmp.filter_by = id;
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
    setOptions(tmp, {notify: true, reload: true, overwrite: true, scroll_to: settings.qualities.length-1})
}
function loadHTML(sett, scroll = null)
{
    const bound = $(".bound");
    const con = $("#settings_container");
    const qualities = sett.qualities;

    con.empty();
    bound.off();
    bound.removeClass("bound");

    for(let i = 0; i < qualities.length; i ++)
    {
        if(qualities[i] == null || qualities[i] == undefined)
            continue;
        const name = qualities[i].name || DEFAULT_SETTINGS.defaults.name;
        const limit = qualities[i].limit || DEFAULT_SETTINGS.defaults.limit;
        const format = qualities[i].format || DEFAULT_SETTINGS.defaults.format;
        const color = qualities[i].css["color"] || DEFAULT_SETTINGS.defaults.css["color"];
        const size = qualities[i].css["font-size"] || DEFAULT_SETTINGS.defaults.css["font-size"];
        const weight = qualities[i].css["font-weight"] || DEFAULT_SETTINGS.defaults.css["font-weight"];
        const filter = sett.filter_by;
        const id = i;
        const setting = $.parseHTML(generateSetting(name, limit, color, size, weight, format, id));

        con.append(setting);
        const select = $("#"+id+"-weight");
        const example = $("#"+id+"-example");
        $("#"+id+"-filter").prop("checked", id == filter);
        select.val(weight);
        select.material_select();
        example.text(formatInfo(sett, id, Math.random(), Math.round(Math.random()*100)));
    }

    $("#button-container").scrollSpy();

    if(scroll != null)
        $('body').animate({scrollLeft: $("body").outerWidth()}, 750);

    const title = $("div.card-title");
    const limit = $("input[type=number].limit");
    const color = $("input[type=color]");
    const size = $("input[type=text].size");
    const weight = $("select.weight");
    const format = $("input[type=text].format");
    const filter = $("input[type=radio].filter");
    const del = $("i.delete");
    const reset = $("#btn-reset");
    const add = $("#btn-add");

    title.on("dblclick", editName).addClass("bound");
    limit.change(saveNumber).addClass("bound");
    color.change(saveColor).addClass("bound");
    size.change(saveSize).addClass("bound");
    weight.change(saveWeight).addClass("bound");
    format.change(saveFormat).addClass("bound");
    filter.change(saveFilter).addClass("bound");
    del.click(delRule).addClass("bound");
    reset.click(resetToDefaults).addClass("bound");
    add.click(addRule).addClass("bound");
}
function generateSetting(name, value, color, size, weight, format, id)
{
    return "<div class=\"row small-margin setting\" id=\""+id+"\" style=\"margin: 5px;\">"+
        "    <div class=\"card\">"+
        "        <div class=\"card-content white-text\">"+
        "            <input type=\"radio\" class=\"filter\" id=\""+id+"-filter\">"+
        "            <label for=\""+id+"-filter\">Default filter</label>"+
        "            <div class=\"row small-margin\">"+
        "                <i class=\"material-icons md-dark right delete no-select\" id=\""+id+"-delete\">close</i>"+
        "                <div class=\"title-container\">"+
        "                    <div class=\"card-title black-text\">"+name+"</div>"+
        "                </div>"+
        "            </div>"+
        "            <div >"+
        "                <label for=\""+id+"-percentage\">Minimum value</label>"+
        "                <input class=\"small-margin black-text limit\" type=\"number\" id=\""+name+"-percentage\" min=\"0\" max=\"100\" value=\""+value+"\">"+
        "            </div>"+
        "            <div  class=\"row\">"+
        "                <label for=\""+id+"-color\">Color</label>"+
        "                <input type=\"color\" id=\""+id+"-color\" value=\""+color+"\">"+
        "            </div>"+
        "            <div>"+
        "                <label for=\""+id+"-size\">Font size</label>"+
        "                <input class=\"small-margin black-text size\" type=\"text\" id=\""+id+"-size\" value=\""+size+"\">"+
        "            </div>"+
        "            <div>"+
        "                <label for=\""+id+"-weight\">Font style</label>"+
        "                <select class=\"black-text weight\" id=\""+id+"-weight\">"+
        "                    <option value=\"lighter\">Lighter</option>"+
        "                    <option value=\"normal\" selected>Normal</option>"+
        "                    <option value=\"bold\">Bold</option>"+
        "                </select>"+
        "            </div>"+
        "            <div>"+
        "                <label for=\""+id+"-fomat\">Format</label>"+
        "                <input class=\"small-margin black-text format\" type=\"text\" id=\""+id+"-format\" value=\""+format+"\">"+
        "            </div>"+
        "            <div class=\"row\">"+
        "                <label for=\""+id+"-example\">Example:</label>"+
        "                <div class=\"example-container\" style=\"background-color: "+settings.row_background+";\">"+
        "                    <p id=\""+id+"-example\" style=\"font-size: "+size+"; font-weight: "+weight+"; color: "+color+";\" class=\"example\">0.12345 (56%)</p>"+
        "                </div>"+
        "            </div>"+
        "        </div>"+
        "    </div>"+
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

    while((settings.qualities[settings.filter_by] == null || settings.qualities[settings.filter_by] == undefined) && settings.qualities.length > 1)
    {
        settings.filter_by = Math.abs(settings.filter_by-1);
    }

    if(savingSettings.reload)
        loadHTML(settings, savingSettings.scroll_to);

    if(savingSettings.save)
        saveOptions(settings, function()
        {
            if(savingSettings.notify)
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
                {
                    chrome.tabs.sendMessage(tabs[0].id, {type: TYPE_UPDATE_SETTINGS}, function(response)
                    {
                    });
                });
        });
    else if(savingSettings.notify)
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs)
        {
            chrome.tabs.sendMessage(tabs[0].id, {type: TYPE_UPDATE_SETTINGS}, function(response)
            {
            });
        });
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