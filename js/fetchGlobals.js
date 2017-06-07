/**
 * Created by Krzysiek on 07/06/2017.
 */

setTimeout(function()
{
    /* Example: Send data from the page to your Chrome extension */
    document.dispatchEvent(new CustomEvent('FloatScanner_getGlobals', {
        detail: {
            assets: g_rgAssets,
            listings: g_rgListingInfo
        }
    }));
}, 0);
