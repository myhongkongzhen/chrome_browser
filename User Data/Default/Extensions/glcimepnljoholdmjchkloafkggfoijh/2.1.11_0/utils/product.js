function getProductLink(pid, appenLang) {
    consoleLog("getProductLink -> " + pid);
    
    if (pid == ProductId.ts) {
        if (appenLang == false) {
            return "https://www.360totalsecurity.com/";
        }
        return "https://www.360totalsecurity.com/" + getUILang();
    } else if (pid == ProductId.safe) {
        return "http://www.360.com/";
    } else {
        return null;
    }
}

function getUpgradeLink(pid) {
    consoleLog("getUpgradeLink -> " + pid);
    
    if (pid == ProductId.ts) {
        return "https://www.360totalsecurity.com/" + getUILang();
    } else if (pid == ProductId.safe) {
        return "http://www.360.com/";
    } else {
        return null;
    }
}

function getProductName(pid) {
    consoleLog("getProductName -> " + pid);
    
    if (pid == ProductId.ts) {
        return chrome.i18n.getMessage('360_total_security');
    } else if (pid == ProductId.safe) {
        return chrome.i18n.getMessage('360_safe');
    } else {
        return null;
    }
}

function getEnableShoppingProtectionDesc(pid) {
    consoleLog("getEnableShoppingProtectionDesc -> " + pid);
    
    if (pid == ProductId.ts) {
        return chrome.i18n.getMessage('shopping_protection_off_desc_ts');
    } else if (pid == ProductId.safe) {
        return chrome.i18n.getMessage('shopping_protection_off_desc_360safe');
    } else {
        return null;
    }
}

function getReportFalsePositiveUrl(pid) {
    consoleLog("getReportFalsePositiveUrl -> " + pid);
    
    if (pid == ProductId.ts) {
        return "https://www.360totalsecurity.com/" + getUILang() + '/help';
    } else if (pid == ProductId.safe) {
        return "http://fuwu.360.cn/shensu/putong";
    } else {
        return null;
    }
}

function getLogoImage(pid) {
    consoleLog("getReportFalsePositiveUrl -> " + pid);
    
    if (pid == ProductId.ts) {
        return '../images/360ts.png';
    } else if (pid == ProductId.safe) {
        return '../images/360safe.png';
    } else {
        return null;
    }
}

function getFBLinkUrl(pid) {
    consoleLog("getFBLinkUrl -> " + pid);
    
    if (pid == ProductId.ts) {
        return "https://wwww.facebook.com/360safe/";
    } else if (pid == ProductId.safe) {
        //TODO:
        return null;
    } else {
        return null;
    }
}

function getEnableWebProtectionDesc(pid) {
    consoleLog("getEnableShoppingProtectionDesc -> " + pid);
    
    if (pid == ProductId.ts) {
        return chrome.i18n.getMessage('web_protection_off_desc_ts');
    } else if (pid == ProductId.safe) {
        return chrome.i18n.getMessage('web_protection_off_desc_360safe');
    } else {
        return null;
    }
}

function isLangIgnored() { return false; }
function isLangSupportedForStoreConsultant() {
    var lang = getUILang();
    consoleLog("isLangSupportedForStoreConsultant:" + lang);
    
    return getUILang() == 'ru' || isLangIgnored();
}

function isStoreConsultantAvailable(pid) {
    if (pid == ProductId.ts) {
        if (isLangSupportedForStoreConsultant()) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

function isAreaSupportedForDealPrice(code) {
    var supportedArea = [ 'IN', 'MY', 'SG', 'UK', 'US', 'AU', 'NZ', 'HK', 'TR', 'ID', 'VN' , 'PH' , 'TH' , 'NG' , 'DE'];
    
    consoleLog("isAreaSupportedForDealPrice:" + code);
    
    return supportedArea.indexOf(code) != -1;
}

function isDealPriceAvailable(pid, code) {
	if (pid == ProductId.ts) {
        if (isAreaSupportedForDealPrice(code)) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}
