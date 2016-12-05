/**
 * Created by Krzysiek on 2016-11-29.
 */
//Functions
Array.prototype.pushAll = function(a)
{
    Array.prototype.push.apply(this, a);
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
String.prototype.replaceAll = function(search, replacement)
{
    return this.replace(new RegExp(search, 'g'), replacement);
};
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
String.prototype.escapeRegExp = function()
{
    return this.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
};
function formatInfo(sett, tier, float, quality)
{
    let info;
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

//Constants
const SVG_ICON_CLEAR = "<svg xmlns=\"http://www.w3.org/2000/svg\" fill=\"#000000\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\">"+
    "<path d=\"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z\"/>"+
    "<path d=\"M0 0h24v24H0z\" fill=\"none\"/>"+
    "</svg>";
const NOTIFICATION_SCAN = "NOTIFICATION_SCAN";
const API_URL = "http://api.csgofloat.com:1739/?url=";
//const COUNTRY_CODE_API = "http://ip-api.com/json";
/*
 This information is there in case of Chrome's Team security concerns.
 We are calling the IP API just to get the user's country code, if he chooses to detect it automatically.
 The ip is never stored anywhere nor send to any external servers.
 Only used in the getCountryCode() function in popup.js file.
 */
const ICON_URL = "http://steamcommunity-a.akamaihd.net/public/shared/images/responsive/share_steam_logo.png";
const KEY_IGNORE = [112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 9, 192, 13, 16];
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
    filter_by: 1,
    currency: 1,

    lang: "english",

    float_places: 3,
    request_delay: 5000,
    search_threshold: 2, /*Value for price overdue in percentage before canceling search */
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
const STORAGE_SETTINGS = "settings";
const STORAGE_SESSIONS = "sessions";
const TYPE_NOTIFY = "TYPE_NOTIFY";
const TYPE_UPDATE_SETTINGS = "TYPE_UPDATE_SETTINGS";
const IMG_TEMPLATE = "<img id=\"listing_%id%_image\" src=\"%icon_url%\" srcset=\"$icon_url%/62fx62f 1x, %icon_url%/62fx62fdpx2x 2x\" style=\"border-color: #D2D2D2;\" class=\"market_listing_item_img economy_item_hoverable\" alt=\"\">";


const SESSION_CONTAINER_TEMPLATE =
    "<div class=\"market_content_block my_listing_section market_home_listing_table\" id=\"session_container\"'>"+
    "	<h3 class=\"my_market_header\">"+
    "		<span class=\"my_market_header_active\">My scanning results</span>"+
    "		<span class=\"my_market_header_count\">(<span id=\"my_market_sessions_number\"></span>)</span>"+
    "	</h3>"+
    "	    <div class=\"market_listing_table_message\">You don't have any results yet. Navigate to a Counter-Strike: Global Offensive item and click on a \"Scan floats\" button</div>"+
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
    "		<div class=\"market_listing_right_cell float_container\">"+
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
    "		<span class=\"market_listing_item_name\" style=\"color: #D2D2D2;\"><a class=\"market_listing_item_name_link\" href=\"http://steamcommunity.com/market/listings/730/%name%#session_id=%sid%\">%name%</a></span><br>"+
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