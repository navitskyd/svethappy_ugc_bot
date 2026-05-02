(function () {

    function buildConsentText(offerUrl, privacyUrl) {
        return 'Нажимая «Купить», вы принимаете условия ' +
            '<a href="' + offerUrl + '" target="_blank" rel="noopener">Публичной оферты</a>' +
            ' и ' +
            '<a href="' + privacyUrl + '" target="_blank" rel="noopener">Политики конфиденциальности</a>.' +
            ' Вы подтверждаете, что доступ к контенту предоставляется немедленно и право на возврат средств' +
            ' после получения доступа аннулируется.';
    }

    function initConsentCheckboxes(consentText) {
        const params = new URLSearchParams(window.location.search);
        const email = params.get('email') || '';
        const telegram_id = params.get('telegram_id') || '';

        var buyBtns = document.querySelectorAll('a.t-btn[href*="buy.stripe.com"]');
        buyBtns.forEach(function (btn, i) {
            // append locked_email and customer_reference to the Stripe URL
            try {
                var url = new URL(btn.href);
                if (email) url.searchParams.set('locked_prefilled_email', email);
                if (telegram_id) url.searchParams.set('client_reference_id', telegram_id);
                btn.href = url.toString();
            } catch (e) {
            }

            var cbId = 'stripe-consent-' + i;

            var wrap = document.createElement('label');
            wrap.className = 'stripe-consent-wrap';
            wrap.htmlFor = cbId;

            var cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.id = cbId;

            var lbl = document.createElement('span');
            lbl.innerHTML = consentText;

            wrap.appendChild(cb);
            wrap.appendChild(lbl);

            btn.classList.add('stripe-btn-disabled');

            cb.addEventListener('change', function () {
                btn.classList.toggle('stripe-btn-disabled', !cb.checked);
            });

            btn.parentNode.insertBefore(wrap, btn);
        });
    }

    function run() {
        var OFFER_URL = 'https://svet-happy.web.app/offer.html';
        var PRIVACY_URL = 'https://svet-happy.web.app/privacy.html';
        initConsentCheckboxes(buildConsentText(OFFER_URL, PRIVACY_URL));
        // update footer links
        var fp = document.getElementById('footer-privacy-link');
        var fo = document.getElementById('footer-offer-link');
        if (fp) fp.href = PRIVACY_URL;
        if (fo) fo.href = OFFER_URL;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }
})();