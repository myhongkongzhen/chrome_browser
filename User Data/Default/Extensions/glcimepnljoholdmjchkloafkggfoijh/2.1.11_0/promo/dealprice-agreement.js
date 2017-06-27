(function () {
    consoleLog("dealprice-agreement.js");
    
    var body = document.getElementsByTagName('body')[0];
    if (body == undefined) {
        return;
    }
    
    var head = document.head;
    if (head == undefined) {
        return;
    }
    
    var css =
        '.popup-sec{ position: fixed; left: 0; top:0; width: 100%; height: 100%; background: rgba(0,0,0,.5); z-index: 232367364;}' +
        '.pop-title { font:700 22px/24px arial,sans-serif!important; }' +
        '.pop-content { position: fixed; min-height: 100px; left: 50%; top:50%; background: #fff; width: 356px; margin: -200px 0 0 -180px; padding: 30px 30px 15px 30px; font: 12px/24px arial,sans-serif; line-height: 19px; color: #666; text-align: left!important; box-sizing: border-box; }' +
        '.pop-content h3 { font-size: 20px; line-height: 25px; color: #222; margin: 0 0 15px;}' +
        '.pop-content h3 img { vertical-align: middle; margin-right: 10px;}' +
        '.pop-content .confirm { background: #24982F; color: #fff; font-size: 15px; line-height: 20px; display: block; border-radius: 5px; padding: 5px 15px; text-align: center; margin: 15px 0 10px 0; border: 1px solid #006900; text-decoration: none; cursor: pointer; }' +
        '.pop-content .close-btn { position: absolute; right: 20px; top:15px; color: #777; font-size: 25px; text-decoration: none; cursor: pointer!important;}' +
        '.pop-content p.agreement { padding: 0; margin: 0 0 14px 0; font: 12px/24px arial,sans-serif; color: #666; line-height: 19px; text-align: left!important; }' +
        '.pop-content p.reject { padding: 0; margin: 30px 0 14px 0; font: 10px/24px arial,sans-serif; color: #666; line-height: 19px; text-align: center; }' +
        '.pop-content p.note { padding: 0; margin: 0 0 0 0; font: 10px/24px arial,sans-serif; color: #666; line-height: 19px; text-align:center; }' +
        '.pop-content input[type="checkbox"]{ vertical-align: middle; margin-right: 5px; bottom: 0; top: 0; }';
    var style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet){
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    head.appendChild(style);
    
    var agreementDesc = chrome.i18n.getMessage('agreement_content_message');
    var acceptDesc = chrome.i18n.getMessage('deal_price_accept');
    var rejectDesc = chrome.i18n.getMessage('deal_price_reject');
    var noteDesc = chrome.i18n.getMessage('deal_price_note');
    var img = chrome.extension.getURL('images/360ts_promo.png');
    var template =
        '<div class="popup-sec">' +
        '<div class="pop-content">' +
        '<a id="close_btn" class="close-btn">x</a>' +
        '<h3 class="pop-title"><img src="'+ img + '" alt=""> 360 Total Security</h3>' +
        '<p class="agreement">' + agreementDesc + '</p>' +
        '<a id="comfirm_btn" class="confirm">' + acceptDesc + '</a>' +
        '<p class="note">' + noteDesc + '</p>' +
        (count == 1 ? '' : '<p class="reject"><input type="checkbox" id="reject_checkbox">' + rejectDesc + '</p>') +
        '</div>';
    var agreement = document.createElement('div');
    agreement.innerHTML= template;
    agreement.style = style;
    body.appendChild(agreement);
    
    document.getElementById('close_btn').addEventListener('click', function (event) {
        var checked;
        if (count == 1) {
            checked = false;
        } else {
            checked = document.getElementById('reject_checkbox').checked;
        }
        
        if (checked) {
            consoleLog('reject-offer');
            setPref(Prop.dealprice_installed, false);
            setPref(Prop.dealprice_enabled, false);
            chrome.runtime.sendMessage({text: Request.deal_price_accepted, state: false }, function(response) {
            });
        } else {
            if (count >= 3) {
                consoleLog('reject-offer');
                setPref(Prop.dealprice_installed, false);
                setPref(Prop.dealprice_enabled, false);
                chrome.runtime.sendMessage({text: Request.deal_price_accepted, state: false }, function(response) {
                });
            } else {
                consoleLog('cancel-offer');
                chrome.runtime.sendMessage({text: Request.deal_price_accepted, state: null }, function(response) {
                });
            }
        }
        
        body.removeChild(agreement);
    });
    
    document.getElementById('comfirm_btn').addEventListener('click', function (event) {
        consoleLog('accept-offer');
        setPref(Prop.dealprice_installed, true);
        setPref(Prop.dealprice_enabled, true);
        chrome.runtime.sendMessage({text: Request.deal_price_accepted, state: true }, function(response) {
        });
        
        body.removeChild(agreement);
    });
})();


