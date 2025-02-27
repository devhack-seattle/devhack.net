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

        targetElement.innerHTML = `
{
    "open": "${escape(state.open.toString())}",
    "lastchange": "${escape(state.lastchange.toString())}"
}
`;
    }
    catch (error) {
        targetElement.innerHTML = '<p>Sorry - couldn\'t load the spaceapi :(</p> <small>' + error + '</small>';
    }
}
doSpaceapi(spaceapiUrl, 'spaceapi-body');
