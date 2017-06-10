/**
 * Created by Krzysiek on 2016-11-28.
 */
let tabId = null;

chrome.runtime.onMessage.addListener(
    function (request, sender, callback)
    {
        const data = request.data;
        tabId = sender.tab.id;
        if (request.type === TYPE_NOTIFY)
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

chrome.notifications.onClicked.addListener(function (id)
{
    if (id === NOTIFICATION_SCAN && tabId)
    {
        chrome.tabs.update(tabId, {active: true});
        chrome.notifications.clear(id);
    }
});

function showNotification(title, message, callback)
{
    chrome.notifications.create(NOTIFICATION_SCAN,
        {
            type: "basic",
            title: title,
            message: message,
            eventTime: Date.now(),
            iconUrl: "/img/icon.png"
        }, callback);
}