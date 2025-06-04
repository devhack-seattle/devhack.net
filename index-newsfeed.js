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
    // feed = [...feed, ...feed, ...feed, ...feed];
    const newsItems = feed.map((item) =>
      createNewsItem({
        id: item.id,
        createdAt: item.created_at,
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
  elem(newsItem, ".news-created-time", createdAtString(createdAt));
  elem(newsItem, ".news-created-time").datetime = createdAt;
  elem(newsItem, ".news-content", content);

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

function createdAtString(createdAt) {
  const now = Date.now();
  const createdAtDate = Date.parse(createdAt);

  const day = Math.round((createdAtDate - now) / (1000 * 60 * 60 * 24));
  return timeAgoFormatter.format(day, "day");
}

function elem(parent, query, value = undefined) {
  const elem = parent.querySelector(query);
  if (!elem) {
    throw new Error(`Element not found for query: ${query}`);
  }
  if (value !== undefined) {
    elem.textContent = value;
  } else {
    return elem;
  }
}

main();
