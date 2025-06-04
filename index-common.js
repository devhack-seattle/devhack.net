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

function linkAndEscape(str) {
    if (!str) return '';

    const escaped = str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return escaped.replace(urlRegex, (url) => {
        const safeUrl = encodeURI(url);
        return `<a href="${safeUrl}" target="_blank">${safeUrl}</a>`;
    });
}