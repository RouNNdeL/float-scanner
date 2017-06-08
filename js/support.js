/**
 * Created by Krzysiek on 2016-11-29.
 */
//Functions
Array.prototype.pushAll = function(items)
{
    Array.prototype.push.apply(this, items);
    return this;
};
Array.prototype.unique = function()
{
    let a = this.concat();
    for(let i = 0; i < a.length; ++ i)
    {
        for(let j = i+1; j < a.length; ++ j)
        {
            if(a[i] === a[j])
                a.splice(j --, 1);
        }
    }

    return a;
};
Array.prototype.pushUnique = function(items)
{
    for(let i = 0; i < items.length; i ++)
    {
        if(this.indexOf(items[i]) < 0)
            this.push(items[i]);
    }
};
String.prototype.replaceAll = function(search, replacement)
{
    return this.replace(new RegExp(search, 'g'), replacement);
};
String.prototype.escapeRegExp = function()
{
    return this.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};
String.prototype.escapeJSON = function()
{
    return this.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|\'\"]/g, "\\$&");
};
function getMaximumPrice(results)
{
    let max = 0;
    let max_s = "";
    for(let k in results)
    {
        if(! results.hasOwnProperty(k))
            continue;
        const s = results[k].price_with_fee.replace(/[^\d,.]/gm, "").replace(/,/, ".");
        if(parseFloat(s) > max)
        {
            max = parseFloat(s);
            max_s = results[k].price_with_fee;
        }
    }
    return {i: max, s: max_s};
}
function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}
function setCookie(cname, cvalue, exdays)
{
    const d = new Date();
    d.setTime(d.getTime()+(exdays * 24 * 60 * 60 * 1000));
    const expires = "expires="+d.toUTCString();
    document.cookie = cname+"="+cvalue+";"+expires+";path=/";
}
function getCookie(cname)
{
    const name = cname+"=";
    const ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i ++)
    {
        let c = ca[i];
        while(c.charAt(0) == ' ')
        {
            c = c.substring(1);
        }
        if(c.indexOf(name) == 0)
        {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function formatInfo(sett, tier, float, quality)
{
    let info;
    if(float == null || float == undefined)
        float = 1;
    if(! (tier == undefined || tier == null))
    {
        const match = sett.qualities[tier].format.match(/\$f\{(\d+)}/) || [];
        const precision = parseInt(match[1]) || sett.float_places;
        info = sett.qualities[tier].format
            .replace(/\$f\{\d+}/, "$f")
            .replace("\$f", float.toFixed(precision))
            .replace("\$p", quality);
    }
    else
    {
        const match = sett.defaults.format.match(/\$f\{(\d+)}/) || [];
        const precision = parseInt(match[1]) || sett.float_places;
        info = sett.defaults.format
            .replace(/\$f\{\d+}/, "$f")
            .replace("\$f", float.toFixed(precision))
            .replace("\$p", quality);
    }
    return info;
}
function byteCount(s)
{
    return s.length * 2;
}
function decodeHtml(html)
{
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}

//credit: https://stackoverflow.com/a/9636008/4061413
function fetchGlobals(listener)
{

    let s = document.createElement('script');
    //noinspection JSUnresolvedVariable,JSUnresolvedFunction
    s.src = chrome.extension.getURL('/js/fetchGlobals.js');
    (document.head || document.documentElement).appendChild(s);
    s.onload = function()
    {
        s.remove();
    };

    // Event listener
    document.addEventListener('FloatScanner_getGlobals', listener);

}

function getDescriptorsAndFrauds(detail, id)
{
    let assetId = detail.listings[id].asset.id;
    let asset = detail.assets[730][2][assetId];
    //noinspection JSUnresolvedVariable
    return {descriptors: asset.descriptions, frauds: asset.fraudwarnings};
}

function appendDescriptors(descriptors, clearPrevious = false)
{
    const parent = $("#largeiteminfo_item_descriptors");
    if(clearPrevious)
        parent.find(".descriptor").remove();

    if(descriptors === undefined || descriptors === null)
        return;

    for(let i = 0; i < descriptors.length; i ++)
    {
        const descriptor = descriptors[i];
        if(descriptor.type !== "html")
            continue;

        let element;
        if(descriptor.value.length === 1 && descriptor.value.charCodeAt(0) === 32)
            element = $("<div>", {class: "descriptor", html: decodeHtml("&nbsp;")});
        else
            element = $("<div>", {class: "descriptor", html: descriptor.value});
        if(descriptor.hasOwnProperty("color"))
            element.css("color", descriptor.color);

        parent.append(element);
    }
}

function appendFraudWarnings(frauds, clearPrevious = false)
{
    const parent = $("#largeiteminfo_fraud_warnings");
    parent.css("display", "");
    if(clearPrevious)
        parent.find(".fraud_warning_box").remove();

    if(frauds === undefined || frauds === null)
        return;

    for(let i = 0; i < frauds.length; i ++)
    {
        const fraud = frauds[i];
        let template = FRAUD_WARNING_TEMPLATE;
        template = template.replace("%text%", fraud);
        parent.append($.parseHTML(template));
    }
}

function createSessionId()
{
    let text = "";
    const possible = "abcdefghijklmnopqrstuvwxyz0123456789";

    for(let i = 0; i < 32; i ++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

//Constants
const SVG_ICON_CLEAR = "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"#000000\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\">"+
    "<path d=\"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z\"/>"+
    "<path d=\"M0 0h24v24H0z\" fill=\"none\"/>"+
    "</svg>";
const NOTIFICATION_SCAN = "NOTIFICATION_SCAN";
const API_URL = "https://api.csgofloat.com:1738/?url=";
//const COUNTRY_CODE_API = "http://ip-api.com/json";
/*
 This information is there in case of Chrome's Team security concerns.
 We are calling the IP API just to get the user's country code, if he chooses to detect it automatically.
 The ip is never stored anywhere nor send to any external servers.
 Only used in the getCountryCode() function in popup.js file.
 */
const ICON_URL = "https://steamcommunity-a.akamaihd.net/economy/image/";
const KEY_IGNORE = [112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 9, 192, 13, 16];
const OVERLAY_PROGRESS_SETTINGS = {
    bar: {
        "position": "absolute",
        "background": "#16202D",
        "bottom": "75px",
        "height": "30px"/*,
         "-webkit-transition": "all 0.5s linear",
         "-moz-transition": "all 0.5s linear",
         "-o-transition": "all 0.5s linear",
         "-ms-transition": "all 0.5s linear",
         "transition": "all 0.5s linear",*/
    },
    text: {
        "position": "absolute",
        "color": "#16202D",
        "bottom": "110px",
        "font-size": "32px"/*,
         "-webkit-transition": "all 0.5s linear",
         "-moz-transition": "all 0.5s linear",
         "-o-transition": "all 0.5s linear",
         "-ms-transition": "all 0.5s linear",
         "transition": "all 0.5s linear",*/
    }
};
const CURRENCIES = {
    1: {
        name: "US Dollar",
        symbol: "$"
    },
    2: {
        name: "British Pound",
        symbol: "£"
    },
    3: {
        name: "Euro",
        symbol: "€"
    },
    4: {
        name: "Swiss Franc",
        symbol: "CHF"
    },
    5: {
        name: "Russian Rubble",
        symbol: "руб"
    },
    7: {
        name: "Brazilian Real",
        symbol: "R$"
    },
    8: {
        name: "Japanese Yen",
        symbol: "¥"
    },
    9: {
        name: "Swedish Krona",
        symbol: "kr"
    },
    10: {
        name: "Indian Rupee",
        symbol: "Rp"
    }
};
const DEFAULT_SETTINGS = {
    qualities: [
        {
            name: "Low",
            limit: 50,
            format: "$f{3} ($p%)",
            css: {
                "color": "#D6C833",
                "font-size": "14px",
                "font-weight": "bold"
            }
        },
        {
            name: "High",
            limit: 75,
            format: "$f{5} ($p%)",
            css: {
                "color": "#6DA029",
                "font-size": "14px",
                "font-weight": "bold"
            }
        },
        {
            name: "Very high",
            limit: 90,
            format: "$f{6} ($p%)",
            css: {
                "color": "#6DA029",
                "font-size": "18px",
                "font-weight": "bold"
            }
        },
        {
            name: "Default",
            limit: 0,
            format: "$f ($p%)",
            css: {
                "color": "#D2D2D2",
                "font-size": "12px",
                "font-weight": "bold"
            }
        }
    ],
    defaults: {
        name: "NAME",
        limit: 0,
        format: "$f{5} ($p%)",
        css: {
            "color": "#D2D2D2",
            "font-size": "14px",
            "font-weight": "bold"
        }
    },
    cache_size: 0, //Not really a setting, but its easier to pass it that way
    filter_by: 1,
    session_threshold: 0,
    currency: 3,

    lang: "english",

    float_places: 3,
    request_delay: 5000,
    search_threshold: 5, /*Value for price overdue in percentage before canceling search */
    search_precaution: 100, /*How many results to display and then filter while searching for a listing. Max: 100 (Steam limitations)*/
    date_format: "H:MM, m/d/yy",
    row_background: "#16202D",
    example_font: "Arial, Helvetica, Verdana, sans-serif"
};
const EXTERIOR_LIMITS = {
    "Factory": [0, 0.07],
    "Minimal": [0.07, 0.15],
    "Field-Tested": [0.15, 0.38],
    "Well-Worn": [0.38, 0.45],
    "Battle-Scarred": [0.45, 1]
};
const AVATAR_URL = "https://cdn.edgecast.steamstatic.com/steamcommunity/public/images/avatars";
const AVATAR_SHORT = "!%#";
const STORAGE_SETTINGS = "settings";
const STORAGE_LISTINGS = "listings";
const STORAGE_SESSIONS = "sessions";
const ID_ONE_PAGE_SCAN = "one_page_scan";
const ID_BATCH_SCAN = "batch_scan";
const ID_CLEAR_CACHE = "clear_cache";
const ID_FILTER_SESSION = "filter_session";
const TYPE_NOTIFY = "TYPE_NOTIFY";
const TYPE_UPDATE_SETTINGS = "TYPE_UPDATE_SETTINGS";
const TYPE_CLEAR_CACHE = "TYPE_CLEAR_CACHE";

const EMPTY_DESCRIPTOR = {type: "html", value: decodeHtml("&nbsp;")};

const FRAUD_WARNING_TEMPLATE =
    "<div class=\"fraud_warning_box\">"+
    "    <img class=\"fraud_warning_image\" src=\"https://steamcommunity-a.akamaihd.net/public/images/sharedfiles/icons/icon_warning.png\">"+
    "    <span>%text%</span>"+
    "</div>";

const IMG_TEMPLATE = "<img id=\"listing_%id%_image\" src=\"%icon_url%\" srcset=\"%icon_url%/62fx62f 1x, %icon_url%/62fx62fdpx2x 2x\" "+
    "style=\"border-color: #D2D2D2;\" class=\"market_listing_item_img economy_item_hoverable\" alt=\"\">";

const ACTION_BUTTON_SETUP_FUNCTION =
    "function InstallMarketActionMenuButtons()"+
    "    {"+
    "        for ( var listing in g_rgListingInfo ) {"+
    "            var asset = g_rgListingInfo[listing].asset;"+
    "            if ( typeof g_rgAssets[asset.appid][asset.contextid][asset.id].market_actions != 'undefined' )"+
    "            {"+
    "                /* add the context menu*/"+
    "                var elActionMenuButton = $J('<a></a>');"+
    "                elActionMenuButton.attr( 'id', 'listing_' + listing + '_actionmenu_button' );"+
    "                elActionMenuButton.addClass( 'market_actionmenu_button' );"+
    "                elActionMenuButton.attr( 'href', 'javascript:void(0)' );"+
    "                $J('#listing_' + listing + '_image').parent().append( elActionMenuButton );"+
    "                $J(elActionMenuButton).click( $J.proxy( function( elButton, rgAsset ) {"+
    "                    HandleMarketActionMenu( elButton.attr( 'id' ), g_rgAssets[rgAsset.appid][rgAsset.contextid][rgAsset.id] );"+
    "                }, null, elActionMenuButton, asset ) );"+
    "            }"+
    "        }"+
    "    }";


const SESSION_CONTAINER_TEMPLATE =
    "<div class=\"market_content_block my_listing_section market_home_listing_table\" id=\"session_container\"'>"+
    "	<h3 class=\"my_market_header\">"+
    "		<span class=\"my_market_header_active\">My scanning results</span>"+
    "		<span class=\"my_market_header_count\">(<span id=\"my_market_sessions_number\"></span>)</span>"+
    "	</h3>"+
    "	    <div class=\"market_listing_table_message\">You don't have any results yet. "+
    "Navigate to a Counter-Strike: Global Offensive item and click on a \"Scan floats\" button.</div>"+
    "	</div>";

const NO_RESULTS_HEADER =
    "<div class=\"market_listing_table_header\">"+
    "    <div>"+
    "        <span class=\"market_listing_header_namespacer\">"+
    "        </span>No results found"+
    "    </div>"+
    "</div>";

const BEST_RESULT_HEADER =
    "<div class=\"market_listing_table_header\">"+
    "    <div>"+
    "        <span class=\"market_listing_header_namespacer\">"+
    "        </span>Best result"+
    "    </div>"+
    "</div>";

const DEFAULT_HEADER =
    "<div class=\"market_listing_table_header\">"+
    "	<div class=\"market_listing_price_listings_block\">"+
    "		<span class=\"market_listing_right_cell market_listing_action_buttons\"></span>"+
    "		<span class=\"market_listing_right_cell market_listing_their_price\">PRICE</span>"+
    "	</div>"+
    "	<span class=\"market_listing_right_cell market_listing_seller\">SELLER</span>"+
    "	<div><span class=\"market_listing_header_namespacer\"></span>NAME</div>"+
    "</div>";

const DEFAULT_HEADER_WITH_FLOAT =
    "<div class=\"market_listing_table_header\">"+
    "	<div class=\"market_listing_price_listings_block\">"+
    "		<span class=\"market_listing_right_cell market_listing_action_buttons\"></span>"+
    "		<span class=\"market_listing_right_cell market_listing_their_price\">PRICE</span>"+
    "	</div>"+
    "	<span class=\"market_listing_right_cell market_listing_seller\">SELLER</span>"+
    "	<span class=\"market_listing_right_cell market_listing_float\" style=\"width: 150px\">FLOAT</span>"+
    "	<div><span class=\"market_listing_header_namespacer\"></span>NAME</div>"+
    "</div>";

const SESSIONS_HEADER =
    "<div class=\"market_listing_table_header\">"+
    "    <span class=\"market_listing_right_cell market_listing_edit_buttons placeholder market_sortable_column\" id=\"delete_all_sessions\" style=\"width: 160px\">Delete all</span>"+
    "    <span class=\"market_listing_right_cell market_listing_my_price\">Best float</span>"+
    "    <span class=\"market_listing_right_cell market_listing_my_price market_listing_buyorder_qty\">Quantity</span>"+
    "    <span class=\"market_listing_right_cell market_listing_my_price\">Scan date</span>"+
    "    <span><span class=\"market_listing_header_namespacer\"></span>NAME</span>"+
    "</div>";

const ROW_TEMPLATE = "<div class=\"market_listing_row market_recent_listing_row listing_%id%\" id=\"listing_%id%\">"+
    "	"+
    "	<div class=\"market_listing_item_img_container\">"+
    "		%img%"+
    "       <a id=\"listing_%id%_actionmenu_button\" class=\"market_actionmenu_button\" href=\"javascript:void(0)\">"+
    "       </a>"+
    "   </div>"+
    "		<div class=\"market_listing_price_listings_block\">"+
    "		    <div class=\"market_listing_right_cell market_listing_action_buttons\">"+
    "				<div class=\"market_listing_buy_button\">"+
    "					<a class=\"btn_green_white_innerfade btn_small\">"+
    "							<span>Find to buy</span>"+
    "					</a>"+
    "				</div>"+
    "			</div>"+
    "			<div class=\"market_listing_right_cell market_listing_their_price\">"+
    "			<span class=\"market_table_value\">"+
    "					<span class=\"market_listing_price market_listing_price_with_fee\">"+
    "						%price_with_fee%"+
    "                   </span>"+
    "					<span class=\"market_listing_price market_listing_price_with_publisher_fee_only\">"+
    "						%price_fee_only%"+
    "                   </span>"+
    "					<span class=\"market_listing_price market_listing_price_without_fee\">"+
    "						%price_without_fee%"+
    "                   </span>"+
    "					<br>"+
    "			</span>"+
    "		</div>"+
    "	</div>"+
    "	<div class=\"market_listing_right_cell market_listing_seller\">"+
    "		<span class=\"market_listing_owner_avatar\">"+
    "			<span class=\"playerAvatar offline\">"+
    "				<img src=\"%seller%\" alt=\"\">"+
    "			</span>"+
    "		</span>"+
    "	</div>"+
    "		<div class=\"market_listing_right_cell float_container\" style=\"width: 150px\">"+
    "           <span class=\"market_listing_item_float\" style=\"%style%\">%info%</span>"+
    "       </div>"+
    "       <div class=\"market_listing_item_name_block\">"+
    "		    <span id=\"listing_%id%_name\" class=\"market_listing_item_name economy_item_hoverable\" style=\"color: #D2D2D2;\">%name%</span>"+
    "		    <br>"+
    "		    <span class=\"market_listing_game_name\">%game%</span>"+
    "	    </div>"+
    "	<div style=\"clear: both;\"></div>"+
    "</div>";

const SESSION_ROW_TEMPLATE =
    "<div class=\"market_listing_row market_recent_listing_row\" id=\"sessioon_%sid%\">"+
    "		%img%"+
    "		<div class=\"market_listing_right_cell market_listing_edit_buttons placeholder\"  style=\"width: 160px;\">"+
    "	    </div>"+
    "       <div class=\"market_listing_right_cell market_listing_my_price\">"+
    "		    <span class=\"market_table_value\">"+
    "			    <span class=\"market_listing_price\">%info%</span>"+
    "		    </span>"+
    "	    </div>"+
    "	    <div class=\"market_listing_right_cell market_listing_my_price market_listing_buyorder_qty\">"+
    "	    	<span class=\"market_table_value\">"+
    "	    		<span class=\"market_listing_price\">%quantity%</span>"+
    "	    	</span>"+
    "	    </div>"+
    "       <div class=\"market_listing_right_cell market_listing_my_price\">"+
    "		    <span class=\"market_table_value\">"+
    "			    <span class=\"market_listing_price\">%date%</span>"+
    "		    </span>"+
    "	    </div>"+
    "		<div class=\"market_listing_item_name_block\">"+
    "		<span class=\"market_listing_item_name\" style=\"color: #D2D2D2;\"><a class=\"market_listing_item_name_link\""+
    " href=\"https://steamcommunity.com/market/listings/730/%name%#session_id=%sid%\">%name%</a></span><br>"+
    "		<span class=\"market_listing_game_name\">%game%</span>"+
    "	</div>"+
    "	<div class=\"market_listing_edit_buttons actual_content\"  style=\"width: 160px;\">"+
    "		<div class=\"market_session_delete_button market_listing_cancel_button\">"+
    "			<a class=\"item_market_action_button item_market_action_button_delete item_market_action_button_edit nodisable\">"+
    "				<span class=\"item_market_action_button_edge item_market_action_button_left\"></span>"+
    "				<span class=\"item_market_action_button_contents\">"+
    "					Delete				</span>"+
    "				<span class=\"item_market_action_button_edge item_market_action_button_right\"></span>"+
    "				<span class=\"item_market_action_button_preload\"></span>"+
    "			</a>"+
    "		</div>"+
    "	</div>"+
    "	<div style=\"clear: both\"></div>"+
    "</div>";