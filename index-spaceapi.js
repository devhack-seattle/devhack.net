const spaceapiUrl = '/spaceapi.json';

function escape(str) {
    return str.replace(/[&<>"'/]/g, function (char) {
        const escapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&apos;',
            '/': '&#47;'
        };
        return escapeMap[char] || char;
    });
}

// Main function :)
async function doSpaceapi(url, targetElementId) {
    const targetElement = document.getElementById(targetElementId);

    try {
        const spaceapi = await (await fetch(url)).json();
        console.log(spaceapi);
        const state = spaceapi["state"];
        const sensors = spaceapi["sensors"];

        var openHtml = '';
        if (state && state.lastchange && typeof state.open !== 'undefined') {
            const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
            const elapsed = state.lastchange - Date.now() / 1000.0;
            const unit = Math.abs(elapsed) < 3600 ? 'minutes' : 'hours';
            const elapsedInUnit = Math.round(Math.abs(elapsed) < 3600 ? elapsed / 60 : elapsed / 3600);
            if (state.open) {
                openHtml = 'someone might be at the space (as of ' + rtf.format(elapsedInUnit, unit) + ') :D <br>';
            } else {
                openHtml = 'the space is probably closed (as of ' + rtf.format(elapsedInUnit, unit) + ') <br>';
            }
        }

        var tempHtml = '';
        if (sensors && sensors.temperature && sensors.temperature.length > 0) {
            const temp = Math.round(sensors.temperature[0].value);
            const unit = sensors.temperature[0].unit;
            tempHtml = 'it is ' + temp + unit + ' inside'
        }

        targetElement.innerHTML = '<p>' + openHtml + tempHtml + '</p>';
    }
    catch (error) {
        targetElement.innerHTML = '<p>Sorry - couldn\'t load the spaceapi :(</p> <small>' + error + '</small>';
    }
}
doSpaceapi(spaceapiUrl, 'spaceapi-body');
