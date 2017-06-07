"use strict";
this.$ = this.jQuery = jQuery.noConflict(true);

//Globals
let settings = $.extend(true, {}, DEFAULT_SETTINGS);
let sessions;
let listings;
let limits;
let in_progress = false;
let con = true;
let scanning = false;
let searching = false;
let all_listings;
$(function()
{
    limits = getExterior(window.location.href, EXTERIOR_LIMITS);

    loadSettings();
    setSessions();
    fetchAllListings();
    setListings();
    //clearListingsOlderThen(7);

    chrome.runtime.onMessage.addListener(onMessageListener);

    setup("#market_buyorder_info", buttons);
    //setupCacheInfo(Math.floor(byteCount(LZString.compress(JSON.stringify(getListings()))) * 100 / 1024) / 100);
});
$(document).keyup(async function(e)
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
    hashActions(getSessions());
});
$(window).on("popstate", handlePopStateEvent);
async function onOptionsLoaded(max_tries = 100)
{
    let tries = 0;
    const ses = getSessions();
    while(! ses)
    {
        if(tries > max_tries)
            break;
        await sleep(100);
    }
    hashActions(ses);
    if(window.location.href.match(/steamcommunity.com\/market\/?(?:#.*|$)/))
        showSessionsOnMain(ses, getSettings());
}
function handlePopStateEvent(e)
{
    if(scanning)
        con = false;

}
function hashActions(sess)
{
    const session_match = window.location.hash.match(/session_id=([\da-z]+)/);
    const search_match = window.location.hash.match(/search=(.+)/);
    const filter_match = window.location.hash.match(/filter=(\d+)/);
    const scan_match = window.location.hash.match(/scan=(\d+)/);
    let remove_hash = true;
    if(session_match && session_match[1])
    {
        const sid = session_match[1];
        if(sess[sid] !== null && sess[sid] !== undefined)
        {
            $("#"+ID_ONE_PAGE_SCAN).add("#"+ID_FILTER_SESSION).remove();
            showResults(sess[sid], getSettings());
            const before = $("#"+ID_BATCH_SCAN).parent();
            const btn = generateButton(ID_FILTER_SESSION, "Filter session", function()
            {
                filterSession(sess, sid, getSettings());
            });
            btn.insertBefore(before);
            remove_hash = false;
        }
        else
        {
            alert("Invalid session ID");
        }
    }
    if(search_match && search_match[1])
    {
        const info = search_match[1];
        findListingNew(info);
    }
    if(filter_match && filter_match[1])
    {
        filterListing(filter_match[1]);
        remove_hash = false;
    }
    if(scan_match && scan_match[1])
    {
        betterScan(parseInt(scan_match[1]));
    }
    if(remove_hash)
        window.history.replaceState({}, document.title, window.location.pathname+window.location.search);
}
function buttons()
{
    const container = $("#market_buyorder_info").children("*").eq(0);
    const before = $("#market_commodity_buyrequests");

    //Float scan button
    const scan_btn = generateButton(ID_ONE_PAGE_SCAN, "Show floats", scanFloat);
    scan_btn.insertBefore(before);

    //Batch scan button
    /*const batch_scan_btn = generateButton("Scan floats", scan());
     batch_scan_btn.insertBefore(before);*/

    //Better scan buttons
    const better_scan_btn = generateButton(ID_BATCH_SCAN, "Scan floats", initializeScan);
    better_scan_btn.insertBefore(before);
}
function generateButton(id, txt, onclick = null, remove)
{
    $("#"+id).remove();
    const start = $("<div>", {
        css: {
            "float": "right",
            "padding-right": "10px"
        },
        class: "scanner_btn"
    });
    const btn = $("<a>", {
        class: "btn_medium btn_green_white_innerfade",
        id: id
    });
    const text = $("<span>", {
        text: txt
    });
    btn.append(text);
    start.append(btn);
    if(onclick !== null)
        btn.click(onclick);
    return start;
}

async function generateFloats(raw_json, sett, progress, count, lists, obj)
{
    const results = {};
    let bestFloat = 1;
    let bestQuality = 0;
    let game = raw_json.app_data[730].name;
    let name = "";
    let img = "";

    const assets = raw_json.assets;
    const listings = raw_json.listinginfo;

    for(let k in listings)
    {
        if(! con)
            continue;
        if(! listings.hasOwnProperty(k))
            continue;
        const a = listings[k].asset;
        const asset = assets[a.appid][a.contextid][a.id];
        const link = API_URL+asset.actions[0].link.replace("%assetid%", a.id);
        try
        {
            const obj = $.extend(true, {}, getInfoFromHtml(raw_json.results_html, k));
            if(! obj.price_with_fee.match(/\d/))
                continue;
            let r;
            if(lists.hasOwnProperty(k))
            {
                r = {};
                const raw = lists[k];
                r.iteminfo = {
                    floatvalue: raw.i.f,
                    item_name: raw.i.n,
                    min: raw.i.m,
                    max: raw.i.x
                };
                //const t1 = Date.now();
                await sleep(20);
                //const t2 = Date.now();
                //console.log("Function took: %s", (t2-t1) / 1000)
            }
            else
            {
                r = await ajaxCall(link, "json");
                const info = r.iteminfo;
                const stripped = {
                    d: Date.now(),
                    p: obj.price_with_fee,
                    i: {
                        f: info.floatvalue,
                        m: info.min,
                        x: info.max,
                        n: info.item_name
                    }
                };
                addListing(k, stripped);
            }
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
            obj.float = f;
            obj.quality = quality;
            obj.url = asset.actions[0].url;
            img = fillImgTemplate(asset);
            name = asset.market_name;
            results[k] = obj;
        }
        catch(error)
        {
            console.error("Error: ", error);
        }
        finally
        {
            const full_obj = $.extend(true, {}, obj, {results: results});
            progress.updateText3("");
            progress.updateProgress(
                ((progress.getProgress()+1) / count) * 100,
                progress.getProgress()+1+"/"+count,
                progress.getProgress()+1
            );
            progress.updateText1("Best float: "+
                formatInfo(
                    getSettings(), null,
                    getBestFloat(full_obj),
                    getBestQuality(full_obj))
            );
            if(full_obj.results.length == 1)
                progress.updateText2("Found "+Object.keys(filterRows(full_obj, sett, sett.filter_by).results).length
                    +" offer above "+sett.qualities[sett.filter_by].limit+"%");
            else
            {
                progress.updateText2("Found "+Object.keys(filterRows(full_obj, sett, sett.filter_by).results).length
                    +" offers above "+sett.qualities[sett.filter_by].limit+"%");
            }
        }
    }
    saveAllListings(getAllListings(), true);
    return {results: results, info: {game: game, img: img, name: name}};
}

async function getMultipleListings(base_url, start, count, currency, lang)
{
    const url = base_url+"/render/?start="+start+"&count="+count+"&currency="+currency+"&language="+lang;
    const r = await ajaxCall(url, "json");
    return r;
}

async function scanMultipleFloats(count, sett, progress, lists)
{
    const max_count = 100;
    let start = 0;
    const obj = {};
    obj.results = {};
    const check = await getMultipleListings(
        window.location.origin+window.location.pathname,
        0,
        10,
        sett.currency,
        sett.lang
    );
    if(check.success != true)
        return obj;

    count = Math.min(count, check.total_count);
    const const_count = count;
    while(count > 0 && con)
    {
        const json = await getMultipleListings(
            window.location.origin+window.location.pathname,
            start,
            Math.min(count, max_count),
            sett.currency,
            sett.lang
        );
        if(json.success != true)
        {
            progress.updateText3("Steam timed-out, retrying...");
            await sleep(sett.request_delay);
            continue;
        }
        const new_results = await generateFloats(json, sett, progress, const_count, lists, obj);
        $.extend(true, obj, new_results);
        obj.best = {float: getBestFloat(obj), quality: getBestQuality(obj)};
        start += max_count;
        count -= max_count;
    }
    const ids = [];
    for(let k in obj.results)
    {
        if(! obj.results.hasOwnProperty(k))
            continue;
        ids.push(k)
    }
    setListings();
    const max_price = getMaximumPrice(obj.results).i;
    const price_threshold = max_price * (sett.search_threshold / 100);
    removeSoldListings(getListings(), (max_price-price_threshold), ids);
    return obj;
}
function initializeScan()
{
    const count = prompt("Input number of items to  scan");
    window.location.href = "#scan="+count;
}
async function betterScan(count)
{
    if(scanning)
        return 0;
    const progress = new LoadingOverlayProgress(OVERLAY_PROGRESS_SETTINGS);
    //const count = prompt("Input number of ITEMS");
    if(count < 1 || isNaN(count))
        return 0;
    scanning = true;
    con = true;
    $.LoadingOverlay("show", {
        custom: progress.init()
    });
    progress.updateText1("Starting scan");
    progress.updateProgress(0, "0/"+count, 0);

    const sett = getSettings();
    try
    {
        const new_ses = await scanMultipleFloats(count, sett, progress, getListings());
        new_ses.info.currency = sett.currency;
        progress.updateText3("");
        progress.updateText1("Setting up the view...");
        progress.updateText2("Please be patient");

        const sid = createSessionId();
        addSession(getSessions(), filterRows(new_ses, sett, sett.session_threshold), sid);
        await sleep(1000);

        window.location.hash = "#session_id="+sid;
    }
    catch(e)
    {
        console.error(e);
        progress.updateText3("Steam timed-out, try again");
        await sleep(2500);
    }
    finally
    {
        scanning = false;
        $.LoadingOverlay("hide");
    }
}

function fillImgTemplate(data)
{
    let s = IMG_TEMPLATE;
    for(let k in data)
    {
        if(! data.hasOwnProperty(k))
            continue;
        if(k == "icon_url")
            s = s.replaceAll("%"+k+"%", ICON_URL+data[k]);
        else
            s = s.replaceAll("%"+k+"%", data[k]);
    }
    return s;
}

function getInfoFromHtml(html, id)
{
    const parsed = $.parseHTML(html);
    const tempDom = $('<div>').append(parsed);
    const row = $(".listing_"+id, tempDom);
    const price_with_fee = row.find(".market_listing_price_with_fee").text().replace(/[\t\n]/gm, "");
    const price_without_fee = row.find(".market_listing_price_without_fee").text().replace(/[\t\n]/gm, "");
    const price_fee_only = row.find(".market_listing_price_with_publisher_fee_only").text().replace(/[\t\n]/gm, "");
    const seller = row.find(".market_listing_owner_avatar img").attr("src");

    return {
        price_with_fee: price_with_fee,
        price_fee_only: price_fee_only,
        price_without_fee: price_without_fee,
        seller: seller
    }
}

async function scanFloat()
{
    if(in_progress)
        return 0;

    $(".float_container").remove();

    const links = scanPage();
    const rows = $(".market_listing_row").not("#market_buyorder_info");
    const results = {};
    let bestFloat = 1;
    let bestQuality = 0;
    let game = "";
    let name = "";
    let img = "";

    //noinspection JSUnusedAssignment
    in_progress = true;

    for(let i = 0; i < rows.length; i ++)
    {
        const row = rows.eq(i);

        const before = row.find(".market_listing_item_name_block");
        row.find((".market_actionmenu_button")).click();
        const link = API_URL+links[i];
        try
        {
            const r = await ajaxCall(link, "json");
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

            const con = setupFloatContainer(f, quality, getSettings());
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
            results[obj.id] = obj;
        }
        catch(error)
        {
            console.error("Error: ", error);
        }
    }
    in_progress = false;
    return {results: results, game: game, img: img, name: name};
}
function setupCacheInfo(size)
{
    $("#cache_info").remove();
    const parent = $("#listings");
    const after = $("#market_listing_filter_form").closest(".market_listing_filter");
    const container = $("<div>", {
        class: "market_listing_filter",
        id: "cache_info"
    });
    const content_container = $("<div>", {
        class: "market_listing_filter_contents"
    });
    const btn = generateButton(ID_CLEAR_CACHE, "Clear cache", clearListings);
    const content = $.parseHTML("<h2 class=\"market_section_title\">Cache</h2>Cache size: "+size.toFixed(2)+"kb");
    content_container.append(btn);
    content_container.append(content);
    container.append(content_container);
    container.insertAfter(after);
}
function setupFloatContainer(float, quality, sett)
{
    const qualities = sett.qualities;
    const tier = getTier(sett, quality);
    const css = (tier !== undefined || tier !== null) ? qualities[tier].css : sett.defaults.css;
    const info = formatInfo(sett, tier, float, quality);
    const div = $("<div>", {
        class: "market_listing_right_cell float_container",
        css: {
            width: "150px"
        }
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
/**
 * @deprecated Use betterScan() from now on. It will not work with new sessions
 * @returns {number} Status
 */
async function scan()
{
    if(scanning)
        return 0;
    const progress = new LoadingOverlayProgress(OVERLAY_PROGRESS_SETTINGS);
    $.LoadingOverlay("show", {
        custom: progress.init()
    });
    progress.updateText1("Starting scan");
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
    offers.results = {};
    let best = "Loading floats...";
    progress.updateText1(best);
    for(let i = 0; i < pages; i ++)
    {
        const off = await scanFloat();
        $.extend(true, offers.results, off.results);
        offers.results = removeDuplicates(offers.results);
        offers.info = {game: off.game, name: off.name, img: off.img};
        best = "Best float: "+formatInfo(getSettings(), null, getBestFloat(offers), getBestQuality(offers));

        if(! await nextPage() || ! con)
            break;

        progress.updateProgress(Math.round((i+1) * 100 / pages));
        progress.updateText1(best);
        progress.updateText3("");

        if(offers.results.length == 1)
            progress.updateText2("Found "+filterRows(offers, settings, settings.filter_by).results.length+" offer above "+settings.qualities[settings.filter_by].limit+"%");
        else
            progress.updateText2("Found "+filterRows(offers, settings, settings.filter_by).results.length+" offers above "+settings.qualities[settings.filter_by].limit+"%");
    }
    progress.updateText3("");
    progress.updateText1("Setting up the view...");
    progress.updateText2("Please be patient");

    offers.best = {float: getBestFloat(offers), quality: getBestQuality(offers)};
    const sid = Math.abs(Date.now());
    addSession(getSessions(), offers, sid);
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
    return 1;
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
        sett = getSettings();

    const old_select = $("#quality_select");
    if(old_select.length > 0)
        filter = parseInt(old_select.val());

    const con = $("#searchResultsRows");
    const for_removal = $(".market_listing_row").not("#market_buyorder_info").add("#best_header");
    const display = [];
    const select = setupSelect(sett, filter);
    for_removal.remove();
    const filtered_results = filterRows(session, sett, filter);
    for(let k in filtered_results.results)
    {
        if(! filtered_results.results.hasOwnProperty(k))
            continue;
        const tier = getTier(sett, filtered_results.results[k].quality);
        display[k] = fillTemplate(filtered_results.results[k], sett, tier, filtered_results.info, k);
    }
    if(Object.keys(display).length <= 0)
    {
        $(".market_listing_table_header").remove();
        con.prepend($.parseHTML(NO_RESULTS_HEADER));
    }
    else if(Object.keys(display).length == 1)
    {
        $(".market_listing_table_header").remove();
    }
    else
    {
        $(".market_listing_table_header").remove();
        con.prepend($.parseHTML(DEFAULT_HEADER_WITH_FLOAT));
    }
    for(let k in display)
    {
        if(! display.hasOwnProperty(k))
            continue;
        const row = $(display[k]);
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
            const session_match = window.location.hash.match(/session_id=([\da-z]+)/);
            const session_before = session_match == null ? null : parseInt(session_match[1]);
            const price = row.find(".market_listing_price_with_fee").text().replace(/[\s\t\n]/gm, "");
            const name = row.find(".market_listing_item_name").text().replace(/[\n]/gm, "");
            const info = {
                id: id,
                name: name,
                price: price,
                session_before: session_before,
                currency: session.info.currency
            };
            window.location.href = "#search="+encodeURI(JSON.stringify(info));
        });
        row.find(".market_listing_buy_button a").removeAttr("href");
        row.find(".market_actionmenu_button").attr("href", filtered_results.results[k].url);
        if(filtered_results.results[k].float == filtered_results.best.float)
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
            let append = true;

            if(! ses.hasOwnProperty(k))
                continue;
            let s = SESSION_ROW_TEMPLATE;
            if(ses[k].best == null || ses[k].best == undefined || ses[k].info == null || ses[k].info == undefined || ses[k].results == null || ses[k].results == undefined)
                continue;
            //const tier = getTier(sett, ses[k].best.quality);
            const info = formatInfo(sett, null, ses[k].best.float, ses[k].best.quality);
            for(let i in ses[k].info)
            {
                if(ses[k].info.hasOwnProperty(i))
                    s = s.replaceAll("%"+i+"%", ses[k].info[i]);
            }
            s = s.replaceAll("%info%", info);
            s = s.replaceAll("%sid%", k);
            s = s.replaceAll("%quantity%", Object.keys(ses[k].results).length);

            if(k.match(/^\d+$/))
            {
                s = s.replaceAll("%date%", new Date(parseInt(k)).format(sett.date_format));
            }
            else
            {
                console.log(ses[k].date);
                try
                {
                    s = s.replaceAll("%date%", new Date(parseInt(ses[k].date)).format(sett.date_format));
                }
                catch(e)
                {
                    removeSession(ses, k);
                    append = false;
                }
            }
            const parsed = $($.parseHTML(s)[0]);
            parsed.find(".market_session_delete_button").click(function()
            {
                removeSession(ses, k);
                window.location.reload();
            });

            if(append)
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
function fillTemplate(obj, sett, tier, global_info, id)
{
    let s = ROW_TEMPLATE;
    const info = formatInfo(sett, tier, obj.float, obj.quality);
    const style = sett.qualities[tier].css || sett.defaults.css;
    let styleAsString = "";
    for(let k in style)
    {
        if(style.hasOwnProperty(k))
            styleAsString += k+": "+style[k]+";";
    }
    for(let k in obj)
    {
        if(obj.hasOwnProperty(k))
            s = s.replaceAll("%"+k+"%", obj[k]);
    }
    for(let k in global_info)
    {
        if(global_info.hasOwnProperty(k))
            s = s.replaceAll("%"+k+"%", global_info[k]);
    }
    s = s.replaceAll("%id%", id);
    s = s.replaceAll("%info%", info);
    s = s.replaceAll("%style%", styleAsString);
    return s;
}
function extractParams(s)
{
    const html = $($.parseHTML(s)[0]);
    const obj = {};

    obj.id = html.attr("id").replace(/[^\d]/g, "");
    obj.price_with_fee = html.find(".market_listing_price_with_fee").text().replace(/[\t\n]/gm, "");
    obj.price_fee_only = html.find(".market_listing_price_with_publisher_fee_only").text().replace(/[\t\n]/gm, "");
    obj.price_without_fee = html.find(".market_listing_price_without_fee").text().replace(/[\t\n]/gm, "");
    obj.img = html.find("img.market_listing_item_img")[0].outerHTML;
    obj.seller = html.find(".market_listing_owner_avatar img").attr("src");
    obj.name = html.find(".market_listing_item_name").text().replace(/[\t\n]/gm, "");
    obj.game = html.find(".market_listing_game_name").text().replace(/[\t\n]/gm, "");

    return obj;
}
function filterRows(obj, settings, filter)
{
    const min_quality = filter == null || filter == undefined ? - 1 : settings.qualities[filter].limit;
    const new_rows = {};
    new_rows.results = {};
    for(let k in obj.results)
    {
        if(obj.results.hasOwnProperty(k) && obj.results[k].quality >= min_quality)
            new_rows.results[k] = obj.results[k];
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
    const new_rows = {};
    const ids = [];
    for(let k in rows)
    {
        if(rows.hasOwnProperty(k) && ids.indexOf(k) < 0)
        {
            new_rows[k] = rows[k];
            ids.push(k);
        }
    }
    return new_rows;
}
function getBestFloat(obj)
{
    if(! obj.results)
        return - 1;
    let best = 1;
    for(let k in obj.results)
    {
        if(obj.results.hasOwnProperty(k) && obj.results[k].float !== 0)
            best = Math.min(obj.results[k].float, best);
    }
    return best;
}
function getBestQuality(obj)
{
    if(! obj.results)
        return - 1;
    let best = 0;
    for(let k in obj.results)
    {
        if(obj.results.hasOwnProperty(k) && obj.results[k].quality !== 100)
            best = Math.max(obj.results[k].quality, best);
    }
    return best;
}
/**
 * @deprecated Use findListingNew() from now on
 * @param {string} info
 * @returns {number}
 */
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
        if(! con || curr_price > price * (1+(getSettings().search_threshold / 100)))
        {
            $.LoadingOverlay("hide");
            return 0;
        }
        if(! await nextPage())
        {
            $.LoadingOverlay("hide");
            return 0;
        }
        await sleep(getSettings().request_delay);
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
/**
 *
 * @param {string} info
 * @returns {number}
 */
async function findListingNew(info)
{
    const sett = getSettings();
    const params = $.parseJSON(decodeURI(info));
    const session_before = params.session_before;
    const id = params.id;
    const name = params.name;
    const currency = params.currency;
    const price_as_string = params.price;
    const price = parseFloat(price_as_string.replace(/[^\d,.]/gm, "").replace(/,/, "."));
    if(id == undefined || id == null || name == undefined || name == null || price == undefined || price == null)
        return 0;

    const progress = new LoadingOverlayProgress(OVERLAY_PROGRESS_SETTINGS);
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
    $.LoadingOverlay("show", {
        custom: progress.init()
    });
    progress.updateText3("Searching for \""+name+"\"");
    progress.updateText2("Target price: "+price_as_string);
    let current_price = 0;
    let current_price_as_string = "0";
    let start = 0;
    const max_count = 100;
    const check = await getMultipleListings(
        window.location.origin+window.location.pathname,
        0,
        10,
        sett.currency,
        sett.lang
    );
    if(check.success != true)
        return 0;


    let found = false;
    let count = check.total_count;
    let page = 0;
    while(current_price < price * (1+(sett.search_threshold / 100)) && con)
    {
        await sleep(sett.request_delay);
        const json = await getMultipleListings(
            window.location.origin+window.location.pathname,
            start,
            Math.min(count, max_count),
            currency,
            sett.lang
        );
        const parsed = $.parseHTML(json.results_html);
        const tempDom = $('<div>').append(parsed);
        const price_container = $(".market_listing_price_with_fee", tempDom);
        price_container.each(function(i)
        {
            const s = $(this).text().replace(/[^\d,.]/gm, "").replace(/,/, ".");
            const p = parseFloat(s);
            if(p > current_price)
            {
                current_price = p;
                current_price_as_string = $(this).text().replace(/[\n\t]/, "");
            }
        });
        if(current_price > 0)
            progress.updateText1("Current price: "+current_price_as_string);

        current_price = isNaN(current_price) ? 0 : current_price;
        const target = $("#listing_"+id, tempDom);
        const rows = $(".market_listing_row", tempDom);
        const index = rows.index(target);
        if(index > - 1 && con)
        {
            const new_url = window.location.href.replace(window.location.hash, "")
                +"?count="+sett.search_precaution
                +"&start="+Math.max((page * 100+index-Math.floor(Math.min(sett.search_precaution, max_count) / 2)), 0)
                +"&language="+sett.lang
                +"&currency="+sett.currency
                +"#filter="+id;
            found = true;
            progress.updateText1("Listing found");
            progress.updateText2("Redirecting...");
            window.location.replace(new_url);
        }
        page += 1;
        start += max_count;
    }
    if(! found && con)
    {
        scanning = false;
        $.LoadingOverlay("hide");
        const remove = confirm("Listing not found, it's probably been sold already.\nDo you want to remove this item from the session?");
        if(remove)
        {
            removeItemFromSession(getSessions(), session_before, id);
            saveSessions();
        }
        if(session_before !== null)
            window.location.replace("#session_id="+session_before);
    }
    else if(! found)
    {
        scanning = false;
        $.LoadingOverlay("hide");
        if(session_before !== null)
            window.location.replace("#session_id="+session_before);
    }

    con = false;
    return 1;
}
function filterListing(id)
{
    $(".market_listing_row").not("#listing_"+id).remove();
    scanFloat();
}
function ajaxCall(url, type)
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
        if(a.hasOwnProperty(e) && url.match(e))
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
function injectAssets(assets)
{
    if(assets == null || assets == undefined)
        return 0;
    const script = $("<script>");
    script.text("g_rgAssets = $J.parseJSON('"+JSON.stringify(assets).escapeJSON()+"')");
    $("body").prepend(script);
}
function injectListings(lists)
{
    if(lists == null || lists == undefined)
        return 0;
    const script = $("<script>");
    script.text("g_rgListingInfo = $J.parseJSON('"+JSON.stringify(lists).escapeJSON()+"')");
    $("body").prepend(script);
}
function injectHovers(hovers)
{
    if(hovers == null || hovers == undefined)
        return 0;
    const script = $("<script>");
    script.text(hovers);
    $("body").prepend(script);
}
function injectActionButtonSetup()
{
    const script = $("<script>");
    script.text("InstallMarketActionMenuButtons();");
    $("body").prepend(script);
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
    //noinspection JSUnresolvedVariable
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
    saveSettings(settings);
    if(notify)
        onOptionsLoaded();
}
function getSettings()
{
    return settings;
}
function saveSettings(settings)
{
    const obj = {};
    obj[STORAGE_SETTINGS] = settings;
    //noinspection JSUnresolvedVariable
    chrome.storage.sync.set(obj);
}
function loadSettings()
{
    //noinspection JSUnresolvedVariable
    chrome.storage.sync.get(STORAGE_SETTINGS, setOptions);
}
function addSession(sess, new_session, id)
{
    new_session.date = new Date().getTime();
    sess[id] = new_session;
    const tmp = {};
    for(let k in sess)
    {
        if(! sess.hasOwnProperty(k))
            continue;
        tmp[k] = compressSession(sess[k]);
    }
    try
    {
        tmp[id] = compressSession(new_session);
        window.localStorage.setItem(STORAGE_SESSIONS, LZString.compress(JSON.stringify(tmp)));
    }
    catch(e)
    {
        console.error(e);
        window.localStorage.setItem(STORAGE_SESSIONS, LZString.compress(JSON.stringify(sess)));
    }
}

function removeItemFromSession(sess, session_id, item_id)
{
    delete sess[session_id].results[item_id];
}
function getSessions()
{
    return sessions;
}
function removeSession(sessions, id)
{
    const tmp = $.extend(true, {}, sessions);
    delete tmp[id];
    for(let k in tmp)
    {
        if(! tmp.hasOwnProperty(k))
            continue;
        tmp[k] = compressSession(tmp[k]);
    }
    window.localStorage.setItem(STORAGE_SESSIONS, LZString.compress(JSON.stringify(tmp)));
}
function saveSessions()
{
    const all = getSessions();
    const tmp = {};
    for(let k in all)
    {
        if(! all.hasOwnProperty(k))
            continue;
        tmp[k] = compressSession(all[k]);
    }
    window.localStorage.setItem(STORAGE_SESSIONS, LZString.compress(JSON.stringify(tmp)));
}
function setSessions()
{
    const item = window.localStorage.getItem(STORAGE_SESSIONS);
    if(item == null || item == undefined || item.length <= 0)
    {
        sessions = {};
    }
    else
    {
        const decompressed = LZString.decompress(item);
        sessions = $.parseJSON(decompressed);
    }
    for(let k in sessions)
    {
        if(! sessions.hasOwnProperty(k))
            continue;
        try
        {
            sessions[k] = decompressSession(sessions[k])
        }
        catch(e)
        {
            console.error(e);
        }
    }
}
function clearSessions()
{
    window.localStorage.removeItem(STORAGE_SESSIONS);
}
async function filterSession(sess, session_id, sett)
{
    const progress = new LoadingOverlayProgress(OVERLAY_PROGRESS_SETTINGS);
    con = true;
    searching = true;
    const session = sess[session_id];
    const items = session.results;
    const max = getMaximumPrice(items);
    const max_price = max.i;
    const max_price_s = max.s;
    const ids = [];
    const currency = session.info.currency || sett.currency;
    const price = 0;
    let current_price = 0;
    let current_price_as_string = "0";
    let start = 0;
    const max_count = 100;
    const check = await getMultipleListings(
        window.location.origin+window.location.pathname,
        0,
        10,
        sett.currency,
        sett.lang
    );
    if(check.success != true)
        return 0;
    let count = check.total_count;
    $.LoadingOverlay("show", {
        custom: progress.init()
    });
    const price_threshold = max_price * (sett.search_threshold / 100);
    progress.updateText3("Removing sold listings for this session");
    progress.updateText2("Maximum price: "
        +max_price_s
            .replace(/,/, ".")
            .replace(max_price, (max_price+price_threshold).toFixed(2)));
    while(current_price < max_price+price_threshold && con)
    {
        await sleep(sett.request_delay);
        const json = await getMultipleListings(
            "http://steamcommunity.com/market/listings/730/"+encodeURI(session.info.name),
            start,
            Math.min(count, max_count),
            currency,
            sett.lang
        );
        const parsed = $.parseHTML(json.results_html);
        const tempDom = $('<div>').append(parsed);
        const price_container = $(".market_listing_price_with_fee", tempDom);
        const listings = $(".market_listing_row", tempDom);
        listings.each(function(i)
        {
            const match = $(this).attr("id").match(/listing_(\d+)/);
            const price = $(this).find(".market_listing_price_with_fee").text();
            if(match != null && match[1] != null && price.match(/\d/) != null)
            {
                const id = match[1];
                ids.push(id);
            }
        });
        price_container.each(function(i)
        {
            const s = $(this).text().replace(/[^\d,.]/gm, "").replace(/,/, ".");
            const p = parseFloat(s);
            if(p > current_price)
            {
                current_price = p;
                current_price_as_string = $(this).text().replace(/[\n\t]/, "");
            }
        });
        if(current_price > 0)
            progress.updateText1("Current price: "+current_price_as_string);

        current_price = isNaN(current_price) ? 0 : current_price;
        start += max_count;
    }
    if(con)
    {
        let amount = 0;
        for(let k in items)
        {
            if(! items.hasOwnProperty(k))
                continue;
            if(ids.indexOf(k) < 0)
            {
                removeItemFromSession(sess, session_id, k);
                amount ++;
            }
        }
        const lists = getListings();
        removeSoldListings(lists, max_price-price_threshold, ids);
        saveSessions();
        progress.updateText3("");
        progress.updateText1("Finished");
        progress.updateText2("Removed "+amount+" sold listings");
        await sleep(2500);
        $.LoadingOverlay("hide");
    }
    else
    {
        $.LoadingOverlay("hide");
    }
    con = false;
    searching = false;
}
function compressSession(session)
{
    if(session.hasOwnProperty("i") && session.hasOwnProperty("b") && session.hasOwnProperty("r"))
        return session;
    const compressed = {};
    compressed.d = session.date;
    compressed.i = {
        g: session.info.game,
        n: session.info.name,
        c: session.info.currency,
        i: session.info.img
    };
    compressed.b = {
        f: session.best.float,
        q: session.best.quality
    };
    compressed.r = {};
    for(let k in session.results)
    {
        if(! session.results.hasOwnProperty(k))
            continue;
        const result = session.results[k];
        const match = result.seller.match(new RegExp(AVATAR_URL+"(.*)"));
        compressed.r[k] = {
            f: result.float,
            q: result.quality,
            p: result.price_with_fee,
            o: result.price_fee_only,
            w: result.price_without_fee,
            s: match !== null ? AVATAR_SHORT+match[1] : result.seller
        }
    }
    return compressed;
}
function decompressSession(session)
{
    const decompressed = {};
    decompressed.date = session.d;
    decompressed.info = {
        game: session.i.g,
        name: session.i.n,
        currency: session.i.c,
        img: session.i.i
    };
    decompressed.best = {
        float: session.b.f,
        quality: session.b.q
    };
    decompressed.results = {};
    for(let k in session.r)
    {
        if(! session.r.hasOwnProperty(k))
            continue;
        const result = session.r[k];
        const match = result.s.match(new RegExp(AVATAR_SHORT+"(.*)"));
        decompressed.results[k] = {
            float: result.f,
            quality: result.q,
            price_with_fee: result.p,
            price_fee_only: result.o,
            price_without_fee: result.w,
            seller: match !== null ? AVATAR_URL+match[1] : result.s
        }
    }
    return decompressed;
}

function removeSoldListings(lists, max_price, ids)
{
    let c = 0;
    for(let k in lists)
    {
        if(! lists.hasOwnProperty(k))
            continue;
        const price = parseFloat(lists[k].p.replace(/,/, ".").replace(/[^[\d,.]]/gm, ""));
        if(price < max_price && ids.indexOf(k) < 0)
        {
            delete lists[k];
            c ++;
        }
    }
    console.log("Removed %s sold listings", c);
    saveListings(lists);
}
function saveListings(lists)
{
    const all_lists = getAllListings();
    all_lists[getNameFromUrl()] = lists;
    saveAllListings(all_lists, true);
}
function addListing(id, new_listing)
{
    const itemName = getNameFromUrl();
    const all_lists = getAllListings();
    if(! all_lists.hasOwnProperty(itemName))
        all_lists[itemName] = {};
    all_lists[itemName][id] = new_listing;
    const new_lists = $.extend(true, {}, all_lists);
    saveAllListings(new_lists);
}
function getListings()
{
    return listings;
}
function setListings()
{
    let allListings = getAllListings();
    const name = getNameFromUrl();
    listings = allListings[name] || {};
    const compress = LZString.compress(JSON.stringify(listings));
    if(byteCount(compress) <= 16)
        setupCacheInfo(0);
    else
        setupCacheInfo(byteCount(compress+name+"{}") / 1024);
}
function clearAllListings()
{
    window.localStorage.removeItem(STORAGE_LISTINGS);
    setListings();
    saveAllListings({}, true);
}
function clearListings()
{
    const allListings = getAllListings();
    delete allListings[getNameFromUrl()];
    saveAllListings(allListings, true);
}
function saveAllListings(lists, update)
{
    all_listings = lists;
    if(update === true)
    {
        const tmp = $.extend(true, {}, getSettings());
        let uncompressed = JSON.stringify(lists);
        /*uncompressed = uncompressed.replace(/\\"/g,"\uFFFF"); //U+ FFFF
         uncompressed = uncompressed.replace(/\"([^"]+)\":/g,"$1:").replace(/\uFFFF/g,"\\\"");*/
        const compress = LZString.compress(uncompressed);
        tmp.cache_size = byteCount(compress);
        saveSettings(tmp);
        setListings();
        window.localStorage.setItem(STORAGE_LISTINGS, compress);
    }
}
function getAllListings()
{
    return all_listings;
}
function fetchAllListings()
{
    const item = window.localStorage.getItem(STORAGE_LISTINGS);
    if(item == null || item == undefined)
        all_listings = {};
    else
    {
        const decompress = LZString.decompress(item);
        all_listings = $.parseJSON(decompress);
    }
}
function clearListingsOlderThen(days)
{
    const deadline = days * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const allListings = getAllListings();
    for(let k in allListings)
    {
        if(! allListings.hasOwnProperty(k))
            continue;
        for(let l in allListings[k])
        {
            if(! allListings[k].hasOwnProperty(l))
                continue;
            if(allListings[k][l].d+deadline < now)
                delete allListings[k][l];
        }
    }
    saveAllListings(allListings, true);
}

function getNameFromUrl(url = null)
{
    const regex = /steamcommunity\.com\/market\/listings\/730\/([^\/\?]+)(?=#|\/\?|\?|\/)/;
    const regex2 = /steamcommunity\.com\/market\/listings\/730\/(.+)$/;
    if(url !== undefined && url !== null && regex.exec(url).length > 0)
        return encodeURI(decodeURI(regex.exec(url)[1]));
    const e = regex.exec(window.location.href) || regex2.exec(window.location.href);
    if(e == null || e == undefined || e[1] == null || e[1] == undefined)
        return null;
    return encodeURI(decodeURI(e[1]));
}
function onMessageListener(request, sender, callback)
{
    if(request.type == TYPE_UPDATE_SETTINGS)
    {
        loadSettings();
        callback(true);
    }
    if(request.type == TYPE_CLEAR_CACHE)
    {
        clearAllListings();
        callback(true);
    }
}

function createSessionId()
{
    let text = "";
    const possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for(let i = 0; i < 24; i ++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}