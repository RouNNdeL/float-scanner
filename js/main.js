this.$ = this.jQuery = jQuery.noConflict(true);

//Globals
let settings = $.extend(true, {}, DEFAULT_SETTINGS);
let sessions;
let limits;
let in_progress = false;
let con = true;
let scanning = false;
let searching = false;
$(function()
{
    limits = getExterior(window.location.href, EXTERIOR_LIMITS);

    loadOptions();
    setSessions();

    chrome.runtime.onMessage.addListener(onMessageListener);

    setup("#market_buyorder_info", buttons);
});
$(document).keyup(function(e)
{
    if(scanning)
    {
        if(e.which === 27)
            con = false;
        else if(KEY_IGNORE.indexOf(e.which) < 0)
            alert("Press ESC to cancel scan");
    }
    if(searching)
    {
        if(e.which === 27)
            con = false;
        else if(KEY_IGNORE.indexOf(e.which) < 0)
            alert("Press ESC to cancel search");
    }
});
$(window).on("hashchange", function(e)
{
    hashActions();
});
async function onOptionsLoaded(max_tries = 100)
{
    let tries = 0;
    while(! sessions)
    {
        if(tries > max_tries)
            break;
        await sleep(100);
    }
    hashActions();
    if(window.location.href.match(/steamcommunity.com\/market\/?$/))
        showSessionsOnMain(sessions, getOptions());
}
function hashActions()
{
    const session_match = window.location.hash.match(/session_id=(\d+)/);
    const search_match = window.location.hash.match(/search=(.+)/);
    if(session_match && session_match[1])
    {
        const sid = parseInt(session_match[1]);
        if(sessions[sid])
            showResults(sessions[sid], getOptions());
        else
            alert("Invalid session ID");
    }
    if(search_match && search_match[1])
    {
        const info = search_match[1];
        findListing(info);
    }

}
function buttons()
{
    const container = $("#market_buyorder_info").children("*").eq(0);
    const before = $("#market_commodity_buyrequests");

    //Float scan button
    const scan_btn = generateButton("Show floats", scanFloat);
    scan_btn.insertBefore(before);

    //Batch scan button
    const batch_scan_btn = generateButton("Scan floats", scan);
    batch_scan_btn.insertBefore(before);
}
function generateButton(txt, onclick = null)
{
    const start = $("<div>");
    const btn = $("<a>");
    const text = $("<span>");
    start.css("float", "right");
    start.css("padding-right", "10px");
    btn.addClass("btn_medium");
    btn.addClass("btn_green_white_innerfade");
    text.text(txt);
    btn.append(text);
    start.append(btn);
    if(onclick !== null)
        btn.click(onclick);
    return start;
}
async function scanFloat()
{
    if(in_progress)
        return 0;

    $(".float_container").remove();

    const links = scanPage();
    const rows = $(".market_listing_row").not("#market_buyorder_info");
    const result = [];
    let bestFloat = 1;
    let bestQuality = 0;
    let game = "";
    let name = "";
    let img = "";

    in_progress = true;

    for(let i = 0; i < rows.length; i ++)
    {
        const row = rows.eq(i);

        const before = row.find(".market_listing_item_name_block");
        row.find((".market_actionmenu_button")).click();
        const link = API_URL+links[i];
        try
        {
            const r = await call(link, "json");
            const info = r.iteminfo;
            const f = info.floatvalue;
            const min = info.item_name && limits[0] < info.min ? info.min : limits[0];
            const max = info.item_name && limits[1] > info.max ? info.max : limits[1];
            let quality = (max-f) / (max-min);
            quality = Math.round(quality * 100);

            if(bestFloat > f)
            {
                bestFloat = f;
                bestQuality = quality;
            }

            const con = setupFloatContainer(f, quality, getOptions());
            con.insertBefore(before);

            const obj = extractParams(row[0].outerHTML);
            if(! obj.price_with_fee.match(/\d/))
                continue;
            obj.float = f;
            obj.quality = quality;
            obj.url = links[i];
            img = obj.img;
            name = obj.name;
            game = obj.game;
            delete obj.img;
            delete obj.name;
            delete obj.game;
            result.push(obj);
        }
        catch(error)
        {
            console.log("Error: ", error);
        }
    }
    in_progress = false;
    return {results: result, game: game, img: img, name: name};
}
function setupFloatContainer(float, quality, sett)
{
    const qualities = sett.qualities;
    const tier = getTier(sett, quality);
    const css = (tier !== undefined || tier !== null) ? qualities[tier].css : sett.defaults.css;
    const info = formatInfo(sett, tier, float, quality);
    const div = $("<div>", {
        class: "market_listing_right_cell float_container"
    });
    const span = $("<span>", {
        class: "market_listing_item_float",
        css: $.extend(true, sett.defaults.css, css),
        text: info
    }).appendTo(div);
    return div;
}
function scanPage()
{
    const result = [];
    $(".market_actionmenu_button").each(function(i)
    {
        (this.click() || $(this).click());
        result.push($("#market_action_popup_itemactions").find("a").attr("href"));
    });
    return result;
}
async function scan()
{
    if(scanning)
        return 0;
    const progress = new LoadingOverlayProgress(
        {
            bar: {
                "position": "absolute",
                "background": "#16202D",
                "bottom": "100px",
                "height": "30px"
            },
            text: {
                "position": "absolute",
                "color": "#16202D",
                "bottom": "135px",
                "font-size": "32px"
            }
        });
    $.LoadingOverlay("show", {
        custom: progress.Init()
    });
    progress.UpdatePrice("Starting scan");
    if(! await page(1, 10))
    {
        alert("Please manually navigate to page 1");
        $.LoadingOverlay("hide");
        return 0;
    }
    scanning = true;
    con = true;
    const pages = prompt("Pages to scan");
    if(pages == null || pages < 1)
    {
        scanning = false;
        $.LoadingOverlay("hide");
        return 0;
    }
    const offers = {};
    offers.results = [];
    let best = "Loading floats...";
    progress.UpdatePrice(best);
    for(let i = 0; i < pages; i ++)
    {
        const off = await scanFloat();
        offers.results = offers.results.pushAll(off.results);
        offers.results = removeDuplicates(offers.results);
        offers.info = {game: off.game, name: off.name, img: off.img};
        best = "Best float: "+formatInfo(getOptions(), null, getBestFloat(offers), getBestQuality(offers));

        if(! await nextPage() || ! con)
            break;

        progress.Update(Math.round((i+1) * 100 / pages));
        progress.UpdatePrice(best);

        if(offers.lengh == 1)
            progress.UpdateAmount("Found "+filterRows(offers, settings, settings.filter_by).results.length+" offer above "+settings.qualities[settings.filter_by].limit+"%");
        else
            progress.UpdateAmount("Found "+filterRows(offers, settings, settings.filter_by).results.length+" offers above "+settings.qualities[settings.filter_by].limit+"%");
    }

    progress.UpdatePrice("Setting up the view...");
    progress.UpdateAmount("Please be patient");

    offers.best = {float: getBestFloat(offers), quality: getBestQuality(offers)};
    const sid = Math.abs(Date.now());
    addSession(sessions, offers, sid);
    await sleep(1000);

    window.location.hash = "#session_id="+sid;

    sendNotification("Scan finished",
     "Float scan of "
     +pages
     +" pages has just finished. Found "
     +offers.length
     +" offers that were above "
     +settings.qualities[settings.filter_by].limit+"%."
     +" Click here to view the results",
     function(data)
     {
     console.log(data)
     }
     );
    scanning = false;
    $.LoadingOverlay("hide");
}
async function nextPage(maxTries = 60)
{
    const b = $("#searchResults_btn_next");
    const currentPage = $(".market_paging_pagelink.active").eq(0).text();
    let tries = 0;
    if(b === null || b === undefined || b.hasClass("disabled"))
        return false;
    b.click();
    while(currentPage == $(".market_paging_pagelink.active").eq(0).text())
    {
        if(tries > maxTries)
            return false;
        await sleep(250);
        tries ++;
    }
    return true;
}
async function page(n, maxTries = 60)
{
    let btn = $(".market_paging_pagelink:contains('"+n+"')").eq(0);
    let tries = 0;
    if(! btn.length)
        return false;
    if(btn.hasClass("active"))
    {
        if(! await nextPage())
            return false;
    }
    btn = $(".market_paging_pagelink:contains('"+n+"')").eq(0);
    btn.click();
    while(! btn.hasClass("active"))
    {
        btn = $(".market_paging_pagelink:contains('"+n+"')").eq(0);
        if(tries > maxTries)
            return false;
        await sleep(250);
        tries ++;
    }
    return true;
}
function showResults(session, sett, filter, overtwrie = true)
{
    if(! filter)
        filter = sett.filter_by;

    if(overtwrie)
        sett = getOptions();

    const old_select = $("#quality_select");
    if(old_select.length > 0)
        filter = parseInt(old_select.val());

    const con = $("#searchResultsRows");
    const for_removal = $(".market_listing_row").not("#market_buyorder_info").add("#best_header");
    const display = [];
    const select = setupSelect(sett, filter);
    for_removal.remove();
    const filtered_results = filterRows(session, sett, filter);
    for(let i = 0; i < filtered_results.results.length; i ++)
    {
        const tier = getTier(sett, filtered_results.results[i].quality);
        display[i] = fillTemplate(filtered_results.results[i], sett, tier, filtered_results.info);
    }
    if(display.length <= 0)
    {
        $(".market_listing_table_header").remove();
        con.prepend($.parseHTML(NO_RESULTS_HEADER));
    }
    else if(display.length == 1)
    {
        $(".market_listing_table_header").remove();
    }
    else
    {
        $(".market_listing_table_header").remove();
        con.prepend($.parseHTML(DEFAULT_HEADER));
    }
    for(let i = 0; i < display.length; i ++)
    {
        const row = $(display[i]);
        if(! row.find(".market_listing_price_with_fee").text().match(/\d/))
        {
            continue;
        }
        row.find(".market_listing_buy_button span").text("Find to buy");
        row.find(".market_listing_buy_button a").click(function(event)
        {
            const id = $(event.target).closest(".market_listing_row").attr("id").replace(/[^\d]/g, "");
            const row = $("#listing_"+id);
            if(row.length != 1)
                return 0;
            const price = row.find(".market_listing_price_with_fee").text().replace(/[\s\t\n]/gm, "");
            const name = row.find(".market_listing_item_name").text().replace(/[\n]/gm, "");
            const info = {
                id: id,
                name: name,
                price: price
            };
            window.location.replace(window.location.href.replace(window.location.hash, "")+"#search="+encodeURI(JSON.stringify(info)));
        });
        row.find(".market_listing_buy_button a").removeAttr("href");
        row.find(".market_actionmenu_button").attr("href", filtered_results.results[i].url);
        if(filtered_results.results[i].float == filtered_results.best.float)
        {
            //row.css("background-color", "rgba(38, 63, 149, 0.72)");
            con.prepend(row);
            con.prepend($.parseHTML(BEST_RESULT_HEADER));
        }
        else
            con.append(row);
    }
    $(".market_listing_table_header").find("div").eq(0).append(select);
    select.change(function(e)
    {
        const target = $(e.target);
        showResults(session, sett, target.val());
    });
}
function setupSelect(sett, filter)
{
    if(filter == null || filter == undefined)
        filter = sett.filter_by;
    $("#quality_select").remove();
    const qualities = sett.qualities;
    const select = $("<select>", {
        id: "quality_select",
        css: {

            "float": "right",
            "padding-right": "10px",
            "margin-top": "0.25rem",
            "outline": "none"
        }
    });
    for(let i = 0; i < qualities.length; i ++)
    {
        if(qualities[i] == undefined || qualities[i] == null)
            continue;
        const opt = $("<option>", {
            value: i,
            text: qualities[i].name
        });
        if(i == filter)
            opt.prop("selected", true);
        select.append(opt);
    }
    return select;
}
function showSessionsOnMain(ses, sett)
{
    const container = $("#tabContentsMyListings");
    container.find("#session_container").remove();
    const sessions_container = $($.parseHTML(SESSION_CONTAINER_TEMPLATE)[0]);
    const header = $($.parseHTML(SESSIONS_HEADER)[0]);
    if(Object.keys(ses).length > 0)
    {
        sessions_container.append(header);
        for(let k in ses)
        {
            let s = SESSION_ROW_TEMPLATE;
            if(ses[k].best == null || ses[k].best == undefined || ses[k].info == null || ses[k].info == undefined || ses[k].results == null || ses[k].results == undefined)
                continue;
            const tier = getTier(sett, ses[k].best.quality);
            const info = formatInfo(sett, null, ses[k].best.float, ses[k].best.quality);
            for(let i in ses[k].info)
            {
                s = s.replaceAll("%"+i+"%", ses[k].info[i]);
            }
            s = s.replaceAll("%info%", info);
            s = s.replaceAll("%sid%", k);
            s = s.replaceAll("%quantity%", ses[k].results.length);
            s = s.replaceAll("%date%", new Date(parseInt(k)).format(sett.date_format));
            const parsed = $($.parseHTML(s)[0]);
            parsed.find(".market_session_delete_button").click(function()
            {
                removeSession(ses, k);
                window.location.reload();
            });
            sessions_container.append(parsed);
        }
    }
    if(sessions_container.find(".market_listing_row").length <= 0)
    {
        header.remove();
        sessions_container.find("#my_market_sessions_number").text(0);
    }
    else
    {
        sessions_container.find(".market_listing_table_message").remove();
        sessions_container.find("#my_market_sessions_number").text(sessions_container.find(".market_listing_row").length);
    }
    container.append(sessions_container);
    sessions_container.find("#delete_all_sessions").click(function()
    {
        clearSessions();
        window.location.reload();
    });
}
function fillTemplate(obj, sett, tier, global_info)
{
    let s = ROW_TEMPLATE;
    const info = formatInfo(sett, tier, obj.float, obj.quality);
    const style = sett.qualities[tier].css || sett.defaults.css;
    let styleAsString = "";
    for(let k in style)
    {
        styleAsString += k+": "+style[k]+";";
    }
    for(let k in obj)
    {
        s = s.replaceAll("%"+k+"%", obj[k]);
    }
    for(let k in global_info)
    {
        s = s.replaceAll("%"+k+"%", global_info[k]);
    }
    s = s.replace("%info%", info);
    s = s.replace("%style%", styleAsString);
    return s;
}
function extractParams(s)
{
    const html = $($.parseHTML(s)[0]);
    const obj = {};

    obj.id = html.attr("id").replace(/[^\d]/g, "");
    obj.price_with_fee = html.find(".market_listing_price_with_fee").text().replace(/[\s\n]/gm, "");
    obj.price_fee_only = html.find(".market_listing_price_with_publisher_fee_only").text().replace(/[\s\n]/gm, "");
    obj.price_without_fee = html.find(".market_listing_price_without_fee").text().replace(/[\s\n]/gm, "");
    obj.img = html.find("img.market_listing_item_img")[0].outerHTML;
    obj.seller = html.find(".market_listing_owner_avatar img").attr("src");
    obj.name = html.find(".market_listing_item_name").text().replace(/[\t\n]/gm, "");
    obj.game = html.find(".market_listing_game_name").text().replace(/[\t\n]/gm, "");

    return obj;
}
function filterRows(obj, settings, filter)
{
    const min_quality = filter == null || filter == undefined ? -1: settings.qualities[filter].limit;
    const new_rows = {};
    new_rows.results = [];
    for(let i = 0; i < obj.results.length; i ++)
    {
        if(obj.results[i].quality >= min_quality)
            new_rows.results.push(obj.results[i]);
    }
    new_rows.results = removeDuplicates(new_rows.results);
    new_rows.best = {};
    new_rows.best.float = getBestFloat(new_rows);
    new_rows.best.quality = getBestQuality(new_rows);
    new_rows.info = obj.info;
    return new_rows;
}
function removeDuplicates(rows)
{
    const new_rows = [];
    const ids = [];
    for(let i = 0; i < rows.length; i++)
    {
        if(ids.indexOf(rows[i].id) < 0)
        {
            new_rows.push(rows[i]);
            ids.push(rows[i].id);
        }
    }
    return new_rows;
}
function getBestFloat(obj)
{
    if(! obj.results)
        return - 1;
    let best = 1;
    for(let i = 0; i < obj.results.length; i ++)
    {
        if(obj.results[i].float < best)
            best = obj.results[i].float;
    }
    return best;
}
function getBestQuality(obj)
{
    if(! obj.results)
        return - 1;
    let best = 0;
    for(let i = 0; i < obj.results.length; i ++)
    {
        if(obj.results[i].quality > best)
            best = obj.results[i].quality;
    }
    return best;
}
async function findListing(info)
{
    const params = $.parseJSON(decodeURI(info));
    const id = params.id;
    const name = params.name;
    const price = parseFloat(params.price.replace(/[^\d,.]/gm, "").replace(/,/, "."));
    if(id == undefined || id == null || name == undefined || name == null || price == undefined || price == null)
        return 0;
    $.LoadingOverlay("show");
    con = true;
    searching = true;
    const url = decodeURI(window.location.href.replace(window.location.hash, ""));
    if(! url.match(name.escapeRegExp()))
    {
        window.location.href =
            "https://steamcommunity.com/market/listings/730/"+encodeURI(name)+
            "#search="+encodeURI(JSON.stringify(params));
        $.LoadingOverlay("hide");
        return 0;
    }
    if(! await page(1))
        return 0;
    while(! $("#listing_"+id).length)
    {
        let sum = 0;
        const price_container = $(".market_listing_price_with_fee");
        price_container.each(function(i)
        {
            sum += parseFloat($(this).text().replace(/[^\d,.]/gm, "").replace(/,/, "."));
        });
        const curr_price = sum / price_container.length;
        if(! con || curr_price > price * (1+(getOptions().search_threshold / 100)))
        {
            $.LoadingOverlay("hide");
            return 0;
        }
        if(! await nextPage())
        {
            $.LoadingOverlay("hide");
            return 0;
        }
        await sleep(getOptions().search_delay);
    }
    $("#listing_"+id).css("background-color", "rgba(38, 63, 149, 0.72)");
    await scanFloat();
    /*$(".market_listing_row")[0].scrollIntoView(
        {
            behavior: "smooth", // or "auto" or "instant"
            block: "start" // or "end"
        });*/
    $.LoadingOverlay("hide");
    window.location.hash = "";
}
function call(url, type)
{
    return new Promise(resolve =>
        $.ajax(
            {
                url: url,
                dataType: type
            }).done(function(result)
        {
            resolve(result);
        }).fail(function(err)
        {
            resolve(err);
        })
    );
}
function getExterior(url, a)
{
    for(let e in a)
    {
        if(url.match(e))
            return a[e];
    }
    return [0, 1];
}
function getTier(settings, quality)
{
    const qualities = settings.qualities;
    let best;
    let bestN = - 1;
    for(let i = 0; i < qualities.length; i ++)
    {
        if(qualities[i] == undefined || qualities[i] == null)
            continue;
        if(quality >= qualities[i]["limit"] && qualities[i]["limit"] > bestN)
        {
            best = i;
            bestN = qualities[i]["limit"];
        }
    }
    return best;
}
function setup(selector, callback, n = 0)
{
    if($(selector).length > 0)
        callback();
    else if(n < 25)
        setTimeout(function()
        {
            setup(selector, callback, n+1)
        }, 500);
}
function sendNotification(title, message, callback)
{
    chrome.runtime.sendMessage(
        {
            type: TYPE_NOTIFY,
            data: {
                title: title,
                message: message,
                callback: callback
            }
        }
    );
}
function setOptions(options, notify = true)
{
    if(options[STORAGE_SETTINGS])
        settings = $.extend(false, settings, options[STORAGE_SETTINGS]);
    else
        settings = $.extend(false, settings, options);
    saveOptions(settings);
    if(notify)
        onOptionsLoaded();
}
function getOptions()
{
    return settings;
}
function saveOptions(settings)
{
    const obj = {};
    obj[STORAGE_SETTINGS] = settings;
    chrome.storage.sync.set(obj);
}
function loadOptions()
{
    chrome.storage.sync.get(STORAGE_SETTINGS, setOptions);
}
function addSession(sessions, new_session, id)
{
    sessions[id] = new_session;
    window.localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(sessions));
}
function removeSession(sessions, id)
{
    const tmp = $.extend(true, {}, sessions);
    delete tmp[id];
    window.localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(tmp));
}
function setSessions()
{
    sessions = $.parseJSON(window.localStorage.getItem(STORAGE_SESSIONS)) || {};
}
function clearSessions()
{
    window.localStorage.removeItem(STORAGE_SESSIONS);
}
function onMessageListener(request, sender, callback)
{
    if(request.type == TYPE_UPDATE_SETTINGS)
    {
        loadOptions();
        callback(true);
    }
}