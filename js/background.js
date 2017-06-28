/**
 * Created by Krzysiek on 2016-11-28.
 */

let tabInFocus = {};

chrome.runtime.onMessage.addListener(
    function(request, sender, callback)
    {
        const data = request.data;
        const tabId = sender.tab.id;
        const windowId = sender.tab.windowId;
        if(request.type === TYPE_NOTIFY)
        {
            try
            {
                if(!sender.tab.active || !tabInFocus[tabId])
                {
                    showNotification(data.title, data.message, data.icon, tabId);
                    chrome.windows.update(windowId, {drawAttention: true});
                }
            }
            catch(e)
            {
                console.log(e);
            }
        }
        if(request.type === TYPE_WINDOW_FOCUS)
        {
            tabInFocus[tabId] = data.has_focus;
            if(data.has_focus)
            {
                chrome.notifications.clear(NOTIFICATION_SCAN + tabId);
            }
        }
        if(request.type === TYPE_EXPORT)
        {
            saveToFile(data, downloadFile);
        }
    }
);

chrome.notifications.onClicked.addListener(function(id)
{
    const scanMatch = id.match(new RegExp(NOTIFICATION_SCAN + "(\\d+)"));
    if(scanMatch !== null)
    {
        const tabId = parseInt(scanMatch[1]);
        chrome.tabs.update(tabId, {active: true});
        chrome.windows.update(windowId, {focused: true});
        chrome.notifications.clear(id);
    }
});

function showNotification(title, message, icon, tabId)
{
    if(icon === null)
        icon = "/img/icon.png";
    chrome.notifications.create(NOTIFICATION_SCAN + tabId,
        {
            type: "basic",
            title: title,
            message: message,
            eventTime: Date.now(),
            iconUrl: icon
        }, function(notificationId)
        {/* nothing */
        });
}

//Credit: https://adamfeuer.com/notes/2013/01/26/chrome-extension-making-browser-action-icon-open-options-page/
function openOrFocusOptionsPage()
{
    const options = "/html/options.html";
    const optionsUrl = chrome.extension.getURL(options);
    chrome.tabs.query({}, function(extensionTabs)
    {
        let found = false;
        for(let i = 0; i < extensionTabs.length; i++)
        {
            if(optionsUrl === extensionTabs[i].url)
            {
                found = true;
                chrome.tabs.update(extensionTabs[i].id, {"selected": true});
            }
        }
        if(found === false)
        {
            chrome.tabs.create({url: options});
        }
    });
}

// Called when the user clicks on the browser action icon.
chrome.browserAction.onClicked.addListener(function()
{
    openOrFocusOptionsPage();
});

function saveToFile(content, callback)
{
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;

    function errorHandler(e)
    {
        let msg = '';

        switch(e.code)
        {
            case FileError.QUOTA_EXCEEDED_ERR:
                msg = 'QUOTA_EXCEEDED_ERR';
                break;
            case FileError.NOT_FOUND_ERR:
                msg = 'NOT_FOUND_ERR';
                break;
            case FileError.SECURITY_ERR:
                msg = 'SECURITY_ERR';
                break;
            case FileError.INVALID_MODIFICATION_ERR:
                msg = 'INVALID_MODIFICATION_ERR';
                break;
            case FileError.INVALID_STATE_ERR:
                msg = 'INVALID_STATE_ERR';
                break;
            default:
                msg = 'Unknown Error';
                break;
        }

        console.error('Error: ' + msg);
    }

    function onInitFs(fs)
    {

        fs.root.getFile('temp.'+FILE_EXTENSION, {create: true}, function(fileEntry)
        {
            // Create a FileWriter object for our FileEntry (log.txt).
            fileEntry.createWriter(function(fileWriter)
            {

                // Create a new Blob and write it to log.txt.
                const blob = new Blob([content], {type: 'text/plain'});

                fileWriter.write(blob);

                callback(fileEntry.toURL());

            }, errorHandler);

        }, errorHandler);

    }

    window.requestFileSystem(window.TEMPORARY, 5 * 1024 * 1024 /*5MB*/, onInitFs, errorHandler);
}

function downloadFile(url, filename = null)
{
    if(filename === null)
        filename = "scanning_results_"+new Date().format("HH-MM_dd-mm")+"."+FILE_EXTENSION;
    chrome.downloads.download({
        url: url,
        filename: filename
    });
}