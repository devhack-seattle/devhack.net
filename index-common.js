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

function elem(parent, query, value = undefined, unsafeHtml = false) {
    /** @type {HTMLElement} */
    const element = parent.querySelector(query);
    if (!element) {
        throw new Error(`Element not found for query: ${query}`);
    }

    if (value !== undefined) {
        if (unsafeHtml) {
            element.innerHTML = value;
        } else {
            element.textContent = value;
        }
    } else {
        return element;
    }
}

function createError({ thing, message }) {
    /** @type {HTMLTemplateElement} */
    const errorTemplate = document.getElementById("error-template");

    const errorElement = errorTemplate.content.firstElementChild.cloneNode(true);
    elem(errorElement, `[data-slot="thing"]`, thing);
    elem(errorElement, `[data-slot="message"]`, message);

    return errorElement;
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