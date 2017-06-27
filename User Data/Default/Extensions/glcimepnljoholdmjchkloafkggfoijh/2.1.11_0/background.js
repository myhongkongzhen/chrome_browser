var port = null;
var hbstate = 0;
var lang=getUILang();
var i18nReport="http://info.url.cloud.360safe.com/";
var i18nPage = "/plug.php?";
var productId = null;
var compatibleState = CompatibleState.none;
var installedDetails = null;
var curExtVer = null;
var browserType = null;
var curIpResolvedAreaCode = '';

var WebStatus = {
    "unknown":0, 
    "checking":1, 
    "safe":2, 
    "risk":3, 
    "shopping":4,
    "payment":5
}

function getBrowserInfoEx() {
    var browser = {
        version: navigator.appVersion, agent: navigator.userAgent,
        appname: navigator.appName, fullversion: ''+parseFloat(navigator.appVersion),
        majorversion: parseInt(navigator.appVersion,10)
    }
    var nameOffset,verOffset,ix;

    // In Opera 15+, the true version is after "OPR/" 
    if ((verOffset=browser.agent.indexOf("OPR/"))!=-1) {
     browser.appname = "opera";
     browser.fullversion = browser.agent.substring(verOffset+4);
    }
    // In older Opera, the true version is after "Opera" or after "Version"
    else if ((verOffset=browser.agent.indexOf("Opera"))!=-1) {
     browser.appname = "opera";
     browser.fullversion = browser.agent.substring(verOffset+6);
     if ((verOffset=browser.agent.indexOf("Version"))!=-1) 
       browser.fullversion = browser.agent.substring(verOffset+8);
    }
    else if ((verOffset=browser.agent.indexOf("YaBrowser/"))!=-1) {
     browser.appname = "yandex";
     browser.fullversion = browser.agent.substring(verOffset+10);
    }
    // In MSIE, the true version is after "MSIE" in userAgent
    else if ((verOffset=browser.agent.indexOf("MSIE"))!=-1) {
     browser.appname = "ie";
     browser.fullversion = browser.agent.substring(verOffset+5);
    }
    // In Chrome, the true version is after "Chrome" 
    else if ((verOffset=browser.agent.indexOf("Chrome"))!=-1) {
      browser.appname = "chrome";
      if(browser.agent.indexOf("x64")!=-1)
      {
        browser.appname += "64";
      }
     browser.fullversion = browser.agent.substring(verOffset+7);
    }
    // In Safari, the true version is after "Safari" or after "Version" 
    else if ((verOffset=browser.agent.indexOf("Safari"))!=-1) {
     browser.appname = "safari";
     browser.fullversion = browser.agent.substring(verOffset+7);
     if ((verOffset=browser.agent.indexOf("Version"))!=-1) 
       browser.fullversion = browser.agent.substring(verOffset+8);
    }
    // In Firefox, the true version is after "Firefox" 
    else if ((verOffset=browser.agent.indexOf("Firefox"))!=-1) {
     browser.appname = "firefox";
     browser.fullversion = browser.agent.substring(verOffset+8);
    }
    // In most other browsers, "name/version" is at the end of userAgent 
    else if ( (nameOffset=browser.agent.lastIndexOf(' ')+1) < 
              (verOffset=browser.agent.lastIndexOf('/')) ) 
    {
     browser.appname = browser.agent.substring(nameOffset,verOffset);
     browser.fullversion = browser.agent.substring(verOffset+1);
     if (browser.appname.toLowerCase()==browser.appname.toUpperCase()) {
      browser.appname = navigator.appName;
     }
    }
    // trim the browser.fullversion string at semicolon/space if present
    if ((ix=browser.fullversion.indexOf(";"))!=-1)
       browser.fullversion=browser.fullversion.substring(0,ix);
    if ((ix=browser.fullversion.indexOf(" "))!=-1)
       browser.fullversion=browser.fullversion.substring(0,ix);

    majorVersion = parseInt(''+browser.fullversion,10);
    if (isNaN(majorVersion)) {
     browser.fullversion  = ''+parseFloat(navigator.appVersion); 
     browser.majorversion = parseInt(navigator.appVersion,10);
    }

    return browser;
}

function procNativeMessage(message) {//msg from native host
    for (var i = 0; i < message.length; i++) {
        var jsonObject = message[i];
        if (typeof (jsonObject.event) != "undefined") {
            consoleLog("procNativeMessage -> jsonObject:" + JSON.stringify(jsonObject));
            
            if (jsonObject.event == Event.session_beat) {
                hbstate = 1;
                testNativeHost(Event.test_host);
            } else if (jsonObject.event == Event.installed) {//install ok
                if (browserType.indexOf("firefox") != -1) {
                    var visturl = i18nReport+"plugin"+i18nPage+"la="+lang+"&rq=2";
                    chrome.tabs.create({ url: visturl});
                } else {
                    var visturl = i18nReport+browserType+i18nPage+"la="+lang+"&rq=2";
                    chrome.tabs.create({ url: visturl, selected: true });
                }
            } else if (jsonObject.event == Event.version) {
               productId = jsonObject.pid;
               checkWebshieldVersionState(jsonObject.version_supported, jsonObject.status);
            } else if (jsonObject.event == Event.icon_status_notify) {
                if (compatibleState == CompatibleState.compatible) updateToolIcon(jsonObject);
            } else if (jsonObject.event == Event.popup_status_result) {
                if (compatibleState == CompatibleState.compatible) {
                    updatePopup(jsonObject);
                    checkPromoPrerequesite(jsonObject);
                }
            } else if (jsonObject.event == Event.netpay_changed) {
                if (compatibleState == CompatibleState.compatible) updateNetpayChanged(jsonObject);
            } else if (jsonObject.event == Event.scan_start) {
                if (compatibleState == CompatibleState.compatible) updateToastToScanStart(jsonObject);
            } else if (jsonObject.event == Event.scan_end) {
                if (compatibleState == CompatibleState.compatible) updateToastToScanEnd(jsonObject);
            } else if (jsonObject.event == Event.enter_shopping) {
                if (compatibleState == CompatibleState.compatible) updateToastToShoppingProtectionOn(jsonObject);
            } else if (jsonObject.event == Event.site_access_result) {
                if (compatibleState == CompatibleState.compatible) initSiteAccessState(jsonObject);
            } else if (jsonObject.event == Event.refresh_tab) {
                var vaid = jsonObject.tabid;
                var vaurl = jsonObject.url;
                chrome.tabs.update(vaid, { url: vaurl });
            } 
        }
    }
}

function onDisconnected() {
    port = null; 
    if (hbstate == 0) {//native host not exist
        var os = navigator.platform;
        
        /*if (os.indexOf("Win") > -1) {//not exist native host
            visturl += "&rq=1";
        } else {//not win os 提示一次
            visturl += "&rq=3";
        }*/
        if(os.indexOf("Win") == -1){  // not supported prompt
            if (browserType.indexOf("firefox") != -1) {
                var visturl = i18nReport+"plugin"+i18nPage+"la="+lang+"&rq=3";
                chrome.tabs.create({ url: visturl });
            } else {
                var visturl = i18nReport+browserType+i18nPage+"la="+lang+"&rq=3";
                chrome.tabs.create({ url: visturl, selected: true });
            }
        }
    }
}

function createNativeHost() {
    var hostName = "com.google.chrome.wdwedpro";
    port = chrome.runtime.connectNative(hostName);
    port.onMessage.addListener(procNativeMessage);
    port.onDisconnect.addListener(onDisconnected);
}

function callNativeHost(id,url,et) {
    var msg=[{"tabid":id,"url":url,"event":et}];
    if ( port != null ) {
        port.postMessage(msg);
    }
}

function callNativeHostWithInfo(id,url,et,info) {
    var msg=[{"tabid":id,"url":url,"event":et, "info":info}];
    if ( port != null ) {
        port.postMessage(msg);
    }
}

function notifyUpdateTab(addid,removeid,url) {
    var msg=[{"tabid":addid,"removeid":removeid,"url":url,"event":Event.repalce_tab}];
    if ( port != null ) {
        port.postMessage(msg);
    }
}

function testNativeHost(et) {
    if (port != null) {
        port.postMessage([{"event":et}]);
   }
}

function procUrl(tabId, url,et) {
    callNativeHost(tabId, url,et);
}

function procUrlWithInfo(tabId, url,et, info) {
    callNativeHostWithInfo(tabId, url, et, info);
}

function setContextInfo() {
    var browserInfo = getBrowserInfoEx();
    if (browserInfo.appname.indexOf("firefox") != -1) {
        curExtVer = browser.runtime.getManifest().version;
    } else {
        curExtVer = chrome.runtime.getManifest().version;
    }
    
    consoleLog("browser name:" + browserInfo.appname + ",browser ver:" + browserInfo.version + ", ext ver:" + curExtVer);
    if (port != null) {
        port.postMessage([{ "bname": browserInfo.appname, "bver": browserInfo.fullversion, "ever": curExtVer}]);
    }
}

// last digit build checking ignored 
//
// 1: ver1 > ver2
// 0: ver1 == ver2
//-1: ver1 < ver2
function compareVersion(ver1, ver2) {
    var a = ver1.split('.');
    var b = ver2.split('.');

    for (var i = 0; i < a.length; ++i) {
        a[i] = Number(a[i]);
    }
    for (var i = 0; i < b.length; ++i) {
        b[i] = Number(b[i]);
    }
    
    if (a[0] > b[0]) return 1;
    if (a[0] < b[0]) return -1;
    if (a[1] > b[1]) return 1;
    if (a[1] < b[1]) return -1;
    
    return 0;
}
    
function checkWebshieldVersionState(curWebShieldVerSupported, supported) {
    var verState = compareVersion(curExtVer, curWebShieldVerSupported);
    
    if (verState == 1) {
        if (curWebShieldVerSupported == '2.0.14') {
            compatibleState = CompatibleState.base;
            setDefaultBrowserAction();
        } else {
            compatibleState = CompatibleState.upgrade_env;
            setUpgradeEnvAction();
        }
    } else if (verState == -1) {
        // currently silent work on base function.
        compatibleState = CompatibleState.base;
        setDefaultBrowserAction();
        
        //compatibleState = CompatibleState.upgrade_plugin;
        //setUpgradeExtensionAction();
    } else if (!checkBrowserVersionState()) {
        compatibleState = CompatibleState.upgrade_browser;
        setUpgradeBrowserAction();
    } else {
        compatibleState = CompatibleState.compatible;
        setDefaultBrowserAction();
        setOnConnectListener();
        resotrPrefs();
        
        checkSiteAccessState();
        
        if (isStoreConsultantAvailable(productId)) {
            initSovetnik();
        } else {
            initDealPrice();
        }
        
        initStat(productId);
    }
    
    consoleLog("checkWebshieldVersionState -> compatibleState:" + compatibleState);
}

function initStat(productId) {
    if (productId != ProductId.ts) {
        return;
    }
    
    document.title = getBrowserInfoEx().appname;
    initAccount('UA-72168917-6');
    trackPage();
}

function checkSiteAccessState() {
    var msg=[{"event":Event.site_access_query}];
    port.postMessage(msg);
}

function checkBrowserVersionState() {
    var browserInfo = getBrowserInfoEx();
    consoleLog("browserInfo:" + JSON.stringify(browserInfo));
    
    if (browserInfo.appname == 'opera' && compareVersion(browserInfo.fullversion, '32') == -1) {
        consoleLog("opera too old");
        return false;
    }
    
    return true;
}

function setUpgradeExtensionAction() {
    consoleLog("setUpgradeExtensionAction");
    
    chrome.browserAction.setPopup({
        popup: 'popup/upgradeext.html'
    });
    chrome.browserAction.setIcon({
        path: {
            "19": "images/unknown_icon_19.png",
            "38": "images/unknown_icon_19.png"
        }
    });
    chrome.browserAction.setTitle({
        title: chrome.i18n.getMessage('unknown_tips')
    });
}

function setSiteAccessDisabledBrowserAction() {
    consoleLog("setSiteAccessDisabledBrowserAction");
    
    chrome.browserAction.setPopup({
        popup: 'popup/siteaccess.html'
    });
    chrome.browserAction.setIcon({
        path: {
            "19": "images/icon_status_disable_19.png",
            "38": "images/icon_status_disable_38.png"
        }
    });
    chrome.browserAction.setTitle({
        title: chrome.i18n.getMessage('unknown_tips')
    });
}

function setUpgradeBrowserAction() {
    chrome.browserAction.setPopup({
        popup: 'popup/upgradebr.html'
    });
    chrome.browserAction.setIcon({
        path: {
            "19": "images/unknown_icon_19.png",
            "38": "images/unknown_icon_38.png"
        }
    });
    chrome.browserAction.setTitle({
        title: chrome.i18n.getMessage('unknown_tips')
    });
}

function setUpgradeEnvAction() {
    chrome.browserAction.setPopup({
        popup: 'popup/upgradesafe.html'
    });
    chrome.browserAction.setIcon({
        path: {
            "19": "images/unknown_icon_19.png",
            "38": "images/unknown_icon_38.png"
        }
    });
    chrome.browserAction.setTitle({
        title: chrome.i18n.getMessage('unknown_tips')
    });
}

function setDefaultBrowserAction() {
    chrome.browserAction.setPopup({
        popup: 'popup/unknown.html'
    });
    chrome.browserAction.setIcon({
        path: {
            "19": "images/unknown_icon_19.png",
            "38": "images/unknown_icon_38.png"
        }
    });
    chrome.browserAction.setTitle({
        title: chrome.i18n.getMessage('unknown_tips')
    });
}

function setOnConnectListener() {    
    chrome.runtime.onConnect.addListener(function(port) {
        consoleLog("port connected:" + port.name);
        
        if (port.name == "popup") {
            port.onMessage.addListener(function(curTab) {
                consoleLog("popup port: tab recieved" + JSON.stringify(curTab));
                triggerUpdatePopup(curTab.id, curTab.windowId);
            });
        }
    });
}

function resotrPrefs() {
    getPref(Prop.enable_toolbar, true, function(value) {
        if (value) {
            enableToolIcon();
        } else {
            disableToolIcon();
        }
    });
}

function updateNetpayChanged(msg) {
    consoleLog("updateNetpayChanged:" + JSON.stringify(msg));
    
    if (msg.status == WebStatus.shopping || msg.status == WebStatus.payment) {
        if (msg.netpay) {
            chrome.browserAction.setIcon({
                path: {
                    "19": 'images/shopping_icon_19.png',
                    "38": 'images/shopping_icon_38.png'
                },
                tabId: msg.tabid
            });
        } else {
            chrome.browserAction.setIcon({
                path: {
                    "19": 'images/shopping_exit_icon_19.png',
                    "38": 'images/shopping_exit_icon_38.png'
                },
                tabId: msg.tabid
            });
        }
    }
}

function updateToolIcon(msg) {
    consoleLog("updateToolIcon:" + JSON.stringify(msg));
    
    if (msg.status == WebStatus.unknown) {
        updateToolIconInternal(msg, 'popup/unknown.html', 'images/unknown_icon', chrome.i18n.getMessage('unknown_tips'));
    } else if (msg.status == WebStatus.checking) {
        updateToolIconInternal(msg, 'popup/checking.html', 'images/checking_icon', chrome.i18n.getMessage('checking_tips'));
    } else if (msg.status == WebStatus.safe) {
        updateToolIconInternal(msg, 'popup/safe.html', 'images/safe_icon', chrome.i18n.getMessage('safe_tips'));
    } else if (msg.status == WebStatus.risk) {
        updateToolIconInternal(msg, 'popup/risk.html', 'images/risk_icon', chrome.i18n.getMessage('risk_tips'));
    } else if (msg.status == WebStatus.shopping || msg.status == WebStatus.payment) {
        if (msg.netpay != undefined && msg.netpay) {
            updateToolIconInternal(msg, 'popup/shopping.html', 'images/shopping_icon', chrome.i18n.getMessage('shopping_tips'));    
        } else {
            updateToolIconInternal(msg, 'popup/shopping.html', 'images/shopping_exit_icon', chrome.i18n.getMessage('shopping_tips'));
        }
        
        trackActivePromoState();
    }
}

function isTimeUpToPopupDealPrice(saveCheck) {
    var curTime = Math.floor((new Date().getTime() / 1000));
    consoleLog("isTimeUpToPopupDealPrice -> curTime:" + curTime);
    
    var time = getGlobalValue(Prop.dealprice_popup_time);
    if (time == null) {
        if (saveCheck) {
            setGlobalValue(Prop.dealprice_popup_time, curTime);
            setGlobalValue(Prop.dealprice_popup_count, 1);
        }
        return true;
    }
    
    var count = getGlobalValue(Prop.dealprice_popup_count);
    
    if (count == 1) {
        if (curTime - time >= 24 * 60 * 60) {
            if (saveCheck) {
                setGlobalValue(Prop.dealprice_popup_time, curTime);
                setGlobalValue(Prop.dealprice_popup_count, ++count);
            }
            return true;
        } else {
            consoleLog("isTimeUpToPopupDealPrice -> count:" + count + ", not right time");
            return false;
        }
    } else if (count == 2) {
        if (curTime - time >= 3 * 24 * 60 * 60) {
            if (saveCheck) {
                setGlobalValue(Prop.dealprice_popup_time, curTime);
                setGlobalValue(Prop.dealprice_popup_count, ++count);
            }
            return true;
        } else {
            consoleLog("isTimeUpToPopupDealPrice -> count:" + count + ", not right time");
            return false;
        }
    } else {
        consoleLog("isTimeUpToPopupDealPrice -> never popup");
        return false;
    }
}

function trackActivePromoState() {
    if (isStoreConsultantAvailable(productId)) {
        getPref(Prop.sovetnik_installed, null, function(value) {
            if (value == null) {
                new Stat().setType(Stat.Type.Shopping).setAction(Stat.PromoAction.Normal).setLabel(Stat.PromoLabel.AllowStoreConsultant).finish();
            } else if (value) {
                getPref(Prop.sovetnik_enabled, null, function(value) {
                    new Stat().setType(Stat.Type.Shopping).setAction(Stat.PromoAction.StoreConsultant).setLabel(value ? Stat.PromoLabel.On : Stat.PromoLabel.Off).finish();
                });
            } else {
                new Stat().setType(Stat.Type.Shopping).setAction(Stat.PromoAction.Normal).setLabel(Stat.PromoLabel.DeclineStoreConsultant).finish();
            }
        });
    } else if (isDealPriceAvailable(productId, curIpResolvedAreaCode)) {
        getPref(Prop.dealprice_installed, null, function(value) {
            if (value == null) {
                if (isTimeUpToPopupDealPrice(false)) {
                    new Stat().setType(Stat.Type.Shopping).setAction(Stat.PromoAction.Normal).setLabel(Stat.PromoLabel.AllowDealPrice).finish();
                } else {
                    var count = getGlobalValue(Prop.dealprice_popup_count);
                    if (count >= 3) {
                        new Stat().setType(Stat.Type.Shopping).setAction(Stat.PromoAction.Normal).setLabel(Stat.PromoLabel.DeclineDealPrice).finish();
                    } else {
                        new Stat().setType(Stat.Type.Shopping).setAction(Stat.PromoAction.Normal).setLabel(Stat.PromoLabel.PendingDealPrice).finish();
                    }
                }
            } else if (value) {
                getPref(Prop.dealprice_enabled, null, function(value) {
                    new Stat().setType(Stat.Type.Shopping).setAction(Stat.PromoAction.DealPrice).setLabel(value ? Stat.PromoLabel.On : Stat.PromoLabel.Off).finish();
                });
            } else {
                new Stat().setType(Stat.Type.Shopping).setAction(Stat.PromoAction.Normal).setLabel(Stat.PromoLabel.DeclineDealPrice).finish();
            }
        });
    } else {
        new Stat().setType(Stat.Type.Shopping).setAction(Stat.PromoAction.Normal).setLabel(Stat.PromoLabel.NeverPopup).finish();
    }
}

function updateToolIconInternal(msg, popupPath, iconPath, tips) {
    chrome.browserAction.setPopup({
        popup: popupPath,
        tabId: msg.tabid
    });
    chrome.browserAction.setIcon({
        path: {
            "19": iconPath + "_19.png",
            "38": iconPath + "_38.png"
        },
        tabId: msg.tabid
    });
    chrome.browserAction.setTitle({
        title: tips,
        tabId: msg.tabid
    });
}

function rgb(r,g,b) {
    return 'rgb(' + [(r||0),(g||0),(b||0)].join(',') + ')';
}

function testDOMLoad(tabId, callback, retry) {
    chrome.tabs.sendMessage(tabId, {type:'test'}, function(response) {
        retry--;
        
        consoleLog("testDOMLoad:" + retry);
        
        if (retry == 0) {
            return;
        } else if (response == undefined) {
            setTimeout(function() {
                testDOMLoad(tabId, callback, retry);
            }, 100);
        } else {
            callback();
        }
    });
}

function updateToastToShoppingProtectionOn(msg) {
    consoleLog("updateToastToShoppingProtectionOn:" + JSON.stringify(msg));
    
    testDOMLoad(msg.tabid, function() {
        var request = {type: Request.show_toast, pid: productId, event: msg.event};
        if (msg.name != '') {
            request.text = chrome.i18n.getMessage('shopping_protection_on') + msg.name;
        } else {
            request.text = chrome.i18n.getMessage('shopping_protection_on_without_pattern');
        }
        
        request.status = 'safety';
        
        chrome.tabs.sendMessage(msg.tabid, request, function(response) {
            consoleLog("sendMessage response:" + JSON.stringify(response));
        });
    }, 40);
}

function updateToastToScanStart(msg) {
    updateToastToShoppingProtectionOn(msg);
}

function updateToastToScanEnd(msg) {
    var request = {type: Request.show_toast, pid: productId, event: msg.event};
    if (msg.safe) {
        request.text = chrome.i18n.getMessage('shopping_protection_no_risk');
        request.status = 'safety';
    } else {
        request.text = chrome.i18n.getMessage('shopping_protection_risk_found');
        request.status = 'risky';
    }
    
    chrome.tabs.sendMessage(msg.tabid, request, function(response) {
        consoleLog("updateToastToScanEnd response:" + JSON.stringify(response));
    }); 
}

function enterNetPayMode(tabId) {
    var msg=[{"event":Event.enable_netpay,"tabid":tabId}];
    port.postMessage(msg);
    
    consoleLog("enterNetPayMode:" + JSON.stringify(msg));
}

function exitNetPayMode(tabId) {
    var msg=[{"event":Event.disable_netpay,"tabid":tabId}];
    port.postMessage(msg);
    
    consoleLog("exitNetPayMode:" + JSON.stringify(msg));
}

function initTemplateBase(document, msg) {
    if (msg.netpay != undefined) {
        document.getElementById('netpay-mode').textContent = chrome.i18n.getMessage('shopping_protection');
        var netpaySwitch = document.getElementById('netpay-switch');
        
        if (msg.netpay) {
            netpaySwitch.src  = "../images/switch_on.png";
            
            if (msg.safe != undefined) {
                document.getElementById('security-check-container').style.display = 'flex';
                
                securityCheckText = document.getElementById('security-check');
                securityCheckText.textContent = chrome.i18n.getMessage('security_check');
                
                securityStateText = document.getElementById('security-state');
                scanResultImg = document.getElementById('scan-result-img');
                riskProcessedText = document.getElementById('risk-processed');
                if (msg.safe) {
                    securityStateText.textContent = chrome.i18n.getMessage('no_risk');
                    scanResultImg.src = "../images/icon_checked.png";
                    
                    riskProcessedText.style.display = 'none';
                } else {
                    securityStateText.textContent = chrome.i18n.getMessage('risk_detected') + ". ";
                    scanResultImg.src = "../images/icon_risky.png";
                    
                    riskProcessedText.style.display = 'inline';
                    riskProcessedText.textContent = chrome.i18n.getMessage('Resolved') + '?';
                    riskProcessedText.onclick = function(e) {
                        var msg=[{"event":Event.risk_processed}];
                        port.postMessage(msg);
                        
                        riskProcessedText.style.display = 'none';
                        securityStateText.textContent = chrome.i18n.getMessage('no_risk');
                        scanResultImg.src = "../images/icon_checked.png";
                    };
                }
            }
        } else {
            netpaySwitch.src  = "../images/switch_off.png";
            document.getElementById('misc-pannel').style.display = 'none';
        }
        
        netpaySwitch.onclick = function(e) {
            document.getElementById('security-check-container').style.display = 'none';
            
            var miscPannel = document.getElementById('misc-pannel');
            if (msg.netpay) {
                miscPannel.style.display = 'none';
                this.src  = "../images/switch_off.png";
                
                exitNetPayMode(msg.tabid);
            } else {
                miscPannel.style.display = 'block';
                this.src  = "../images/switch_on.png";
                
                enterNetPayMode(msg.tabid);
            }
        };
    } else {
        document.getElementById('netpay-pannel').style.display = 'none';
        document.getElementById('misc-pannel').style.display = 'none';
    }
}

function updateSafeTemplate(document, msg) {
    initTemplateBase(document, msg);
    
    document.getElementById('status-text').textContent = chrome.i18n.getMessage('safe_website');
    document.getElementById('enhance-text').textContent = chrome.i18n.getMessage('enhanced');
    
    if (msg.netpay == undefined) {
        document.getElementById('enhance-pannel').style.display = 'none';
        document.getElementById('status-desc').style.display = 'flex'; 
        document.getElementById('status-desc').textContent = getEnableShoppingProtectionDesc(productId);
    }
}

function updateShoppingTemplate(document, msg) {
    initTemplateBase(document, msg);
    
    if (msg.name != undefined) {
        document.getElementById('website-name-container').style.display = 'flex';
        document.getElementById('website').textContent = chrome.i18n.getMessage('website');
        document.getElementById('website-name').textContent = msg.name;
        
        document.getElementById('website-description-container').style.display = 'flex';
        document.getElementById('website-status').textContent = chrome.i18n.getMessage('status');
        document.getElementById('website-official').textContent = chrome.i18n.getMessage('official');
        document.getElementById('website-safe').textContent = chrome.i18n.getMessage('safe');
    }
    
    var statusText = document.getElementById('status-text');
    var statusDesc = document.getElementById('status-desc');
    
    if (msg.netpay != undefined) {
        var miscPannel = document.getElementById('misc-pannel');
        var shoppingImg = document.getElementById('shopping-icon-large');
        
        statusText.textContent = chrome.i18n.getMessage('shopping_website');
        
        if( msg.netpay == 0) {
            miscPannel.style.display = 'none';
            shoppingImg.src  = "../images/shopping_exit_large.png";
            statusDesc.textContent = chrome.i18n.getMessage('shopping_protection_exit_desc');
        } else {
            miscPannel.style.display = 'block';
            shoppingImg.src  = "../images/shopping_large.png";
            statusDesc.textContent = chrome.i18n.getMessage('shopping_desc');
        }
    } else { // disabled by ts/360safe
        statusText.textContent = chrome.i18n.getMessage('shopping_website_off');
        statusDesc.textContent = getEnableShoppingProtectionDesc(productId);
        
        document.getElementById('netpay-pannel').style.display = 'none';
        document.getElementById('misc-pannel').style.display = 'none';
        document.getElementById('shopping-icon-large').src= "../images/shopping_exit_large.png";
    }
}

function updatePayTemplate(document, msg) {
    updateShoppingTemplate(document, msg);
}

function updateRiskTemplate(document, msg) {
    document.getElementById('status-text').textContent = chrome.i18n.getMessage('risk_website');
    document.getElementById('status-desc').textContent = chrome.i18n.getMessage('risk_desc');
    
    closeButton = document.getElementById('close-tab');
    closeButton.textContent = chrome.i18n.getMessage('close');
    closeButton.onclick = function(e) {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            var currentTab = tabs[0];
            consoleLog("callback:" + JSON.stringify(currentTab));      
            chrome.tabs.remove([currentTab.id]);
        });
    };
    
    reportText = document.getElementById('report-false-positive');
    reportText.textContent = chrome.i18n.getMessage('report_false_positive');
    reportText.onclick = function(e) {
        chrome.tabs.create({url: getReportFalsePositiveUrl(productId)});
    };
}

function updateUnknownTemplate(document, msg) {
    document.getElementById('status-text').textContent = getCopyRightDesc();
}

function updateCheckingTemplate(document, msg) {
    document.getElementById('status-text').textContent = chrome.i18n.getMessage('checking_website');
}

function updatePopup(msg) {
    consoleLog("updatePopup:" + JSON.stringify(msg));
    
    var popupTemplates = [
        {id:'safe-container', func: updateSafeTemplate},
        {id:'risk-container', func: updateRiskTemplate},
        {id:'pay-container', func: updatePayTemplate},
        {id:'shopping-container', func: updateShoppingTemplate},
        {id:'unknown-container', func: updateUnknownTemplate},
        {id:'checking-container', func: updateCheckingTemplate},
    ];
    
    chrome.tabs.get(msg.tabid,function(tab){
        var views = chrome.extension.getViews({type: "popup", windowId:tab.windowId});
        for (var i = 0; i < views.length; i++) {
            for (var j = 0; j < popupTemplates.length; j++) {
                elem = views[i].document.getElementById(popupTemplates[j].id);
                if (elem != null) {
                    popupTemplates[j].func(views[i].document, msg);
                    return;
                }
            }
        }
    });   
}

function initSiteAccessState(msg) {
    if (msg.siteaccess == 0) {
        compatibleState = CompatibleState.enable_siteaccess;
        
        setTimeout(function() {
            setSiteAccessDisabledBrowserAction();
        }, 1000);
    }
}

function triggerUpdatePopup(tabId) {
    var msg=[{"tabid":tabId,"event":Event.popup_status_query}];
    port.postMessage(msg);
    
    consoleLog("triggerUpdatePopup:" + JSON.stringify(msg));
}

function disableToolIcon() {
    chrome.browserAction.disable();
}

function enableToolIcon() {
    chrome.browserAction.enable();
}

function setMessageListener() {
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        consoleLog("onMessage:" + JSON.stringify(sender));
        
        if (request.text == Request.get_product_id) {
            sendResponse(productId);
        } else if (request.text == Request.enable_toolbar_icon) {
            enableToolIcon();
        } else if (request.text == Request.disable_toolbar_icon) {
            disableToolIcon();
        } else if (request.text == Request.get_compatiable_state) {
           /*
            * response: {pid:xxx, state:xxx}
            */
            sendResponse({state:compatibleState, pid:productId});
        } else if (request.text == Request.check_promo_prerequisite) {
            triggerUpdatePopup(sender.tab.id, sender.tab.windowId);
        } else if (request.text == Request.inject_script) {
            if (isStoreConsultantAvailable(productId)) {
                getPref(Prop.sovetnik_installed, null, function(value) {
                    if (value == null) {
                        if (request.status == WebStatus.shopping || request.status == WebStatus.payment) { // only prompt on shopping website 
                            consoleLog("inject_script: sovetnik-inject-content.js");
                            chrome.tabs.executeScript(sender.tab.id, {file: "promo/sovetnik-inject-content.js"});
                        }
                    } else if (value) {
                        getPref(Prop.sovetnik_enabled, null, function(value) {
                            consoleLog("sovetnik_enabled:" + value);
                            
                            if (value) {
                                consoleLog("inject_script: sovetnik-inject-content.js");
                                chrome.tabs.executeScript(sender.tab.id, {file: "promo/sovetnik-inject-content.js"});
                            }
                        });
                    }
                });
            } else if (isDealPriceAvailable(productId, curIpResolvedAreaCode)) {
                getPref(Prop.dealprice_installed, null, function(value) {
                    if (value == null) {
                        if (request.status == WebStatus.shopping || request.status == WebStatus.payment) { // only prompt on shopping website 
                            if (isTimeUpToPopupDealPrice(true)) {
                                chrome.tabs.executeScript(sender.tab.id, {
                                    code: 'var count = ' + getGlobalValue(Prop.dealprice_popup_count) + ';'
                                }, function() {
                                    chrome.tabs.executeScript(sender.tab.id, {file: "promo/dealprice-agreement.js"});
                                });
                                
                                //consoleLog("inject_script: dealprice-agreement.js");
                                //chrome.tabs.executeScript(sender.tab.id, {file: "promo/dealprice-agreement.js"});
                            }
                        }
                    } else if (value) {
                        getPref(Prop.dealprice_enabled, null, function(value) {
                            consoleLog("dealprice_enabled:" + value);
                            
                            if (value) {
                                consoleLog("inject_script: dealprice-inject-content.js");
                                chrome.tabs.executeScript(sender.tab.id, {file: "promo/dealprice-inject-content.js"});
                            } else {
                                consoleLog("inject_script: turn off dealprice-inject-content.js");
                            }
                        });
                    }
                });
            }
        } else if (request.text == Request.store_consultant_accepted) {
            if (request.state) {
                new Stat().setType(Stat.Type.StoreConsultant).setAction(Stat.Action.AcceptOffer).finish();
            } else {
                new Stat().setType(Stat.Type.StoreConsultant).setAction(Stat.Action.DeclineOffer).finish();
            }
        } else if (request.text == Request.store_consultant_bar) {
            new Stat().setType(Stat.Type.StoreConsultant).setAction(Stat.Action.Display).finish();
        } else if (request.text == Request.deal_price_url) {
            sendResponse(composeDealPriceUrl(request.host));
        } else if (request.text == Request.deal_price_accepted) {
            if (request.state == null) {
                new Stat().setType(Stat.Type.DealPrice).setAction(Stat.Action.CancelOffer).finish();
            } else if (request.state) {
                chrome.tabs.executeScript(sender.tab.id, {file: "promo/dealprice-inject-content.js"});
                new Stat().setType(Stat.Type.DealPrice).setAction(Stat.Action.AcceptOffer).finish();
            } else {
                new Stat().setType(Stat.Type.DealPrice).setAction(Stat.Action.DeclineOffer).finish();
            }
        } else if (request.text == Request.get_area_code) {
            sendResponse(curIpResolvedAreaCode);
        } 
    });
}

function composeDealPriceUrl(host) {
    var domain = host.replace("www.", "");
    var partnerName =  chrome.i18n.getMessage('360_total_security');
    var partnerSrc = 'Qihoo360';
    var partnerId = 'QUIOA';
    var partnerUrl = 'http%3A%2F%2Fwww.360totalsecurity.com';
    var offerTitle = chrome.i18n.getMessage('recommended_message');
    var version = '10';
    
    return "superpricecomparison.com/dprext" + 
    "?partner_name=" + partnerName + 
    "&partner_source=" + partnerSrc + 
    "&partner_subId=" + partnerId + 
    "&partner_privacy_url=" + partnerUrl + 
    "&version=" + version +
    "&siteurl=" + domain + 
    "&product_offer_label=" + offerTitle;
}

function initExtension() {
    browserType = getBrowserInfoEx().appname.toLowerCase();
    
    createNativeHost();
    setContextInfo();
    
    chrome.tabs.onCreated.addListener(function (tab) {
        if(!tab.url) return; 
        procUrlWithInfo(tab.id,tab.url,Event.create_tab, tab);
    });

    chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
        if(changeInfo.status == "loading"){
            if(!tab.url) return; 
            procUrlWithInfo(tab.id,tab.url,Event.update_tab, tab);
        }
    });
    
    chrome.tabs.onReplaced.addListener(function (addTabId,removeTabId){
        chrome.tabs.get(addTabId,function(tab){
            notifyUpdateTab(addTabId,removeTabId,tab.url);
        });    
    });
    
    chrome.tabs.onActivated.addListener(function (activeInfo) {
        consoleLog("onActivated from tabid:" + activeInfo.tabId);
    });
    
    chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
        procUrl(tabId,0,Event.remove_tab);
    });
    
    setTimeout(function() {
        if (installedDetails != null) {
            if (installedDetails.reason == "install") {
                testNativeHost(Event.installed);
            } else if (installedDetails.reason == "update") {
            }
        }
    }, 500); // wait OnInstalled event sent
}

function checkCanonicalWebshield(retry) {
    if (compatibleState != CompatibleState.none) {
        return;
    }
    
    retry--;
    consoleLog("checkCanonicalWebshield:" + retry);
        
    if (retry == 0) {
        if (compatibleState == CompatibleState.none) {
            setUpgradeEnvAction();
        }
    } else {
        setTimeout(function() {
            checkCanonicalWebshield(retry);
        }, 1000);
    }
}

function checkPromoPrerequesite(msg) {
    if (!isStoreConsultantAvailable(productId) && !isDealPriceAvailable(productId, curIpResolvedAreaCode)) {
        return;
    }
    
    if (msg.status == WebStatus.safe || msg.status == WebStatus.shopping || msg.status == WebStatus.payment) {
        if (msg.netpay != undefined) { // neypay function turned on
            var request = { type: Request.promo_prerequisite_ok, status: msg.status };
            chrome.tabs.sendMessage(msg.tabid, request, function(response) {
            });
        }
    }
}

function initSovetnik() {
    var config = {
        "clid": "2288281",
        "affId": "1",
        "applicationName": chrome.i18n.getMessage('default_title')
    };
    
    if (browserType.indexOf("chrome") != -1 || browserType.indexOf("opera") != -1) {
        config.browser = "chrome";
        initSettings(config, 'https://yastatic.net/sovetnik/_/js/sovetnik.min.js');
    } else if (browserType.indexOf("yandex") != -1) {
        // unsupported on yandex since it's bundled on yandex.
        return;
    } else if (browserType.indexOf("firefox") != -1) {
        config.browser = "firefox";
        initSettings(config, 'https://yastatic.net/sovetnik/_/js/sovetnik.min.js');
    } else {
       consoleLog("initSovetnik -> unknown browserType:" + browserType);
    }
    
    status = sovetnik.getUserAgreementStatus();
    consoleLog("initSovetnik -> offer status:" + status);
    
    if (status == 'rejected') {
        setPref(Prop.sovetnik_installed, false);
        setPref(Prop.sovetnik_enabled, false);
    } else if (status == 'accepted') {
        setPref(Prop.sovetnik_installed, true);
        setPref(Prop.sovetnik_enabled, true);
    } else {
        setPref(Prop.sovetnik_installed, null);
        setPref(Prop.sovetnik_enabled, null);
    }
}

function initDealPrice() {
    (function() {
        var result = "";
        var xhr = new XMLHttpRequest;
        var uri = "https://getgeo-info.appspot.com";
        xhr.open("GET", uri, true);
        xhr.onload = function() {
            if (4 === xhr.readyState && 200 === xhr.status) {
                json = xhr.responseText;
                json = json.replace(/^[^(]*\(([\S\s]+)\);?$/, "$1");
                json = JSON.parse(json);
                result = json.countrycode;
            }
            
            curIpResolvedAreaCode = result;
            setGlobalValue(GlovalKey.areacode, result);
            
            consoleLog("areacode:" + result);
        }
        xhr.send(null);
    })();
}

function resetSovetnik() {
    var securePromoUrl = 'https://sovetnik.market.yandex.ru';
    var cookies = ["svt-partner", "svt-user"];
    
    for (var i = 0; i < cookies.length; i++) {
        chrome.cookies.get({url: securePromoUrl, name: cookies[i]}, function (cookie) {
            if (cookie) {
                consoleLog(JSON.stringify(cookie));
                chrome.cookies.remove({url: "https://" + cookie.domain, name: cookie.name}, function(deleted) {});
            }
        });
    }
}

function setOninstalledListener() {
    // ASAP ready for event sent from chrome
    chrome.runtime.onInstalled.addListener(function(details) {
        consoleLog("onInstalled:" + JSON.stringify(details));
        
        installedDetails = details;
    });
}

(function() {
    setOninstalledListener();
    setMessageListener();
    
    chrome.runtime.getPlatformInfo(function(info) {
        consoleLog("checkPlatform:" + JSON.stringify(info));
        
        if (info.os == "win") {
            initExtension();
            
            checkCanonicalWebshield(5);
        } else {
            compatibleState = CompatibleState.unsupported_platform;
            
            disableToolIcon();
        }
    });
})();