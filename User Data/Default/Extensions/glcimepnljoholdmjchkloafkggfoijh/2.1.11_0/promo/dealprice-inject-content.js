(function () {
    consoleLog("dealprice-inject-content.js");
    
    var msg = {
        text: Request.deal_price_url,
        host: window.location.host
    }
    
    chrome.runtime.sendMessage(msg, function(response) {
        var body = document.getElementsByTagName('body')[0];
        if (body == undefined) {
            return;
        }
        
        var head = document.head;
        if (head == undefined) {
            return;
        }
        
        var requestUrl = window.location.protocol + '//' + response;
        consoleLog("deal price -> url:" + JSON.stringify(requestUrl));
        
        var script = document.createElement('script');
        
        script.setAttribute('src', requestUrl + ";");
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('charset', 'UTF-8');
    
        body.appendChild(script);
    });
})();