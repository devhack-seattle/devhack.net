const newsFeed = document.getElementById("news-feed");
const newsList = document.getElementById("news-list");

/** @type {HTMLButtonElement} */
const newsFeedRight = document.getElementById("news-feed-right");

/** @type {HTMLTemplateElement} */
const newsItemTemplate = document.getElementById("news-item-template");

/** @type {HTMLTemplateElement} */
const errorTemplate = document.getElementById("error-template");

const timeAgoFormatter = new Intl.RelativeTimeFormat(undefined, {
  style: "short",
  numeric: "auto",
});

async function main() {
  newsFeedRight.addEventListener("click", () => {
    if (newsFeedRight.dataset.last == "true") {
      newsFeedRight.dataset.last = false;

      newsList.scrollTo({ left: 0 });
      return;
    }

    const currentItem = currentItemInNewsList();
    const nextItem = currentItem?.nextElementSibling;
    newsList.scrollTo({ left: nextItem.offsetLeft });

    updateNewsFeedRightButton();
  });

  newsList.addEventListener("scroll", () => {
    updateNewsFeedRightButton();
  });

  await fetchNewsFeed();
}

// updateNewsFeedRightButton updates the news feed right button's
// dataset properties.
function updateNewsFeedRightButton() {
  const isScrollEnd =
    newsList.scrollLeft + newsList.clientWidth >= newsList.scrollWidth;

  const currentItem = currentItemInNewsList();
  const nextItem = currentItem?.nextElementSibling;

  newsFeedRight.dataset.last = !nextItem || isScrollEnd;
}

// currentItemInNewsList returns the currently shown item in the news feed,
// defined by the scroll position of the newsList. If the scroll position
// is at the end of the list, it returns null.
function currentItemInNewsList() {
  const scrollLeft = newsList.scrollLeft;
  const children = [...newsList.children];
  return children.find((item) => item.offsetLeft >= scrollLeft);
}

// fetchNewsFeed fetches the news feed from the server and appends them to
// newsList.
async function fetchNewsFeed(afterID = null) {
  newsFeed.querySelector(".error")?.remove();
  newsList.replaceChildren();

  try {
    const query = afterID ? `?after=${afterID}` : "";
    const response = await fetch(
      `https://members.devhack.net/news/feed.json?${query}`,
      {
        headers: { "Accept": "application/json" },
        credentials: "omit",
      },
    );

    const feed = await response.json();
    const newsItems = feed.map((item) =>
      createNewsItem({
        id: item.id,
        createdAt: item.created_at,
        editedAt: item.edited_at,
        username: item.author.username,
        content: item.content,
        thumbnailURL: item.thumbnail_url,
        tracTicketID: item.trac_ticket_id,
      })
    );

    newsList.append(...newsItems);

    newsFeed.dataset.initial = false;
    newsFeed.dataset.error = false;
  } catch (err) {
    console.error("Error fetching news feed:", err);

    newsFeed.append(createError({ message: `${err}` }));
    newsFeed.dataset.error = true;
  }
}

function createError({ message }) {
  const errorElement = errorTemplate.content.firstElementChild.cloneNode(true);
  elem(errorElement, `[data-slot="thing"]`, "news feed");
  elem(errorElement, `[data-slot="message"]`, message);

  return errorElement;
}

function createNewsItem({
  id,
  createdAt,
  editedAt,
  username,
  content,
  thumbnailURL,
  tracTicketID,
}) {
  const newsItem = newsItemTemplate.content.firstElementChild.cloneNode(true);

  newsItem.id = `news-${id}`;

  elem(newsItem, ".news-username", username);
  elem(newsItem, ".news-avatar").alt = `${username}'s avatar`;
  elem(newsItem, ".news-avatar").src =
    `https://members.devhack.net/user/avatar/${username}`;
  elem(newsItem, ".news-created-time", createdAgoString(createdAt));
  elem(newsItem, ".news-created-time").dateTime = createdAt;
  elem(newsItem, ".news-created-time").title = createdAtTimestamp(createdAt);
  elem(newsItem, ".news-content", linkAndEscape(content), true);

  if (editedAt) {
    elem(newsItem, ".news-edited").title = createdAtTimestamp(editedAt);
  } else {
    elem(newsItem, ".news-edited").setAttribute("hidden", "");
    elem(newsItem, ".news-edited").setAttribute("aria-hidden", "true");
  }

  if (thumbnailURL) {
    elem(newsItem, ".news-thumbnail-link").href = thumbnailURL;
    elem(newsItem, ".news-thumbnail-link").target = "_blank";

    elem(newsItem, ".news-thumbnail-image").src = thumbnailURL;
    elem(newsItem, ".news-thumbnail-image").alt = `thumbnail image for post`;
  }

  if (tracTicketID) {
    elem(newsItem, ".news-trac-ticket-id", `#${tracTicketID}`);
    elem(newsItem, ".news-trac-ticket-id").target = "_blank";
    elem(newsItem, ".news-trac-ticket-id").href =
      `https://bugs.devhack.net/ticket/${tracTicketID}`;
  }

  return newsItem;
}

function createdAgoString(createdAt) {
  /** @type {[function(Date): number, Intl.RelativeTimeFormatUnit][]} */
  const getters = [
    [(d) => d.getFullYear(), "year"],
    [(d) => d.getMonth(), "month"],
    [(d) => d.getDate(), "day"],
    [(d) => Math.floor((d - now) / (1000 * 60 * 60)), "hour"],
  ];

  const now = new Date();
  const createdAtDate = new Date(Date.parse(createdAt));

  for (const [i, [getter, unit]] of getters.entries()) {
    const d = getter(createdAtDate) - getter(now);
    if (d != 0 || i == getters.length - 1) {
      return timeAgoFormatter.format(d, unit);
    }
  }
}

function createdAtTimestamp(createdAt) {
  const createdAtDate = new Date(Date.parse(createdAt));
  return createdAtDate.toLocaleString(undefined, {
    weekday: "long",
    month: "numeric",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
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

main();
