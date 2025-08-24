(async () => {
    const el = document.getElementById('service-warning');
    if (!el) return;

    // checks healthchecks.io to see if any of our important services are down
    // in the future maybe we do something self-hosted?
    async function areWeLosing() {
        const r = await fetch('https://healthchecks.io/b/2/f564cd28-6a7b-474c-bd33-aea7b641d359.json', { cache: 'no-store' });
        if (!r.ok) throw new Error(`http: ${r.status} ${r.statusText}`);
        const status = await r.json();
        if (!status || typeof status.down != 'number') {
            throw new Error('unexpected healthcheck response: ' + JSON.stringify(status));
        }
        return status.down > 0;
    }

    try {
        const isDown = await areWeLosing();
        if (isDown) {
            el.innerHTML = '<strong>oh naur!</strong> some space services are currently down, so not all web interactions might work. to report this incident, <a href="#contact">contact us</a>.';
            el.hidden = false;
        } else {
            el.hidden = true;
        }
    } catch (e) {
        // if something goes wrong, no need to alert the visitor since this is just extra credit.
        console.error('Error checking service health:', e);
        el.hidden = true;
    }
})();
