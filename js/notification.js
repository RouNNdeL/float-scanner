/**
 * Created by Krzysiek on 2016-11-28.
 */
let tabId = null;

//noinspection JSUnresolvedVariable
chrome.runtime.onMessage.addListener(
    function (request, sender, callback)
    {
        const data = request.data;
        tabId = sender.tab.id;
        if (request.typ == TYPE_NOTIFY)
        {
            console.log("Sending...");
            try
            {
                if (!sender.tab.active || true)
                    showNotification(data.title, data.message, data.callback);
                callback(true);
            }
            catch (e)
            {
                callback(e);
                console.log(e);
            }
        }
    }
);

//noinspection JSUnresolvedVariable
chrome.notifications.onClicked.addListener(function (id)
{
    if (id == NOTIFICATION_SCAN && tabId)
    {
        //noinspection JSUnresolvedVariable
        chrome.tabs.update(tabId, {active: true});
        //noinspection JSUnresolvedVariable
        chrome.notifications.clear(id);
    }
});

function showNotification(title, message, callback)
{
    //noinspection JSUnresolvedVariable
    chrome.notifications.create(NOTIFICATION_SCAN,
        {
            type: "basic",
            title: title,
            message: message,
            eventTime: Date.now(),
            iconUrl: "/img/icon.png"
        }, callback);
}