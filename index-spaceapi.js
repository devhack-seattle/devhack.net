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

/* figures out what unit a time value should be displayed in, then returns the value in that unit and the name of that unit */
function secondsToValueInUnit(seconds) {
    const absSeconds = Math.abs(seconds);
    if (absSeconds < 3600) {
        return [Math.round(seconds / 60), 'minutes'];
    }
    if (absSeconds < 86400) {
        return [Math.round(seconds / 3600), 'hours'];
    }
    return [Math.round(seconds / 86400), 'days'];
}

// Main function :)
async function doSpaceapi(url, targetElementId) {
    const targetElement = document.getElementById(targetElementId);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('spaceapi borked! http: ' + response.status);
        }
        let spaceapi;
        try {
            spaceapi = await response.json();
        } catch (jsonError) {
            throw new Error('bad json? ' + jsonError.message);
        }

        console.log(spaceapi);
        const state = spaceapi["state"];
        const sensors = spaceapi["sensors"];

        var openHtml = '';
        if (state && state.lastchange && typeof state.open !== 'undefined') {
            const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
            const elapsed = secondsToValueInUnit(state.lastchange - (Date.now() / 1000.0));
            const status = state.open ? '<a href="https://wiki.devhack.net/Entering_The_Space#Kinds_of_%22Open%22" target="_blank">doors open</a>!' : 'closed,';
            openHtml = `space: ${status} as of ${rtf.format(elapsed[0], elapsed[1])} `;
        }

        var tempHtml = openHtml ? '<br>' : '';
        if (sensors && sensors.temperature && sensors.temperature[0] && sensors.temperature[0].value) {
            const temp = Math.round(sensors.temperature[0].value);
            const unit = sensors.temperature[0].unit;
            tempHtml = tempHtml + 'temp: ' + temp + unit + ' inside'
        }

        targetElement.innerHTML = '<p>' + openHtml + tempHtml + '</p>';
    }
    catch (error) {
        targetElement.innerHTML = '<p>Oh naur - couldn\'t load the spaceapi :(</p> <small>' + error + '<br>This incident will be reported.</small>';
    }
}
doSpaceapi(spaceapiUrl, 'spaceapi-body');
