var _gaq = _gaq || [];

(function () {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = 'utils/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);  
})();

function initAccount(ua) {
    _gaq.push(['_setAccount', ua]);
}

function trackPage() {
   _gaq.push(['_trackPageview']);
}
 
var Stat = function() {
    this.params = {};
    this.params['label'] = null;
};
Stat.Type = {
    'StoreConsultant': 'store_consultant',
    'DealPrice': 'deal_price',
    'Shopping': 'shopping'
};
Stat.Action = {
    'AcceptOffer':'accept_offer',
    'DeclineOffer':'decline_offer',
    'CancelOffer':'cancel_offer',
    'Display':'display'
};
Stat.PromoAction = {
    'StoreConsultant':'store_consultant',
    'DealPrice':'deal_price',
    'Normal':'normal'
};
Stat.PromoLabel = {
    'On':'on',
    'Off':'off',
    'DeclineStoreConsultant':'decline_consultant',
    'AllowStoreConsultant':'possible_consultant',
    'DeclineDealPrice':'decline_dealprice',
    'AllowDealPrice':'possible_dealprice',
    'PendingDealPrice':'pending_dealprice',
    'NeverPopup' : 'never_pop_up'
};
Stat.prototype.setType = function(type){
    this.params['type'] = type;
    return this;
};
Stat.prototype.setAction = function(act){
    this.params['action'] = act;
    return this;
};
Stat.prototype.setLabel = function(label){
    this.params['label'] = label;
    return this;
};
Stat.prototype.finish = function(){
    consoleLog("finish -> " + JSON.stringify(this.params));
    _gaq.push(['_trackEvent', this.params['type'], this.params['action'], this.params['label']]);
};
