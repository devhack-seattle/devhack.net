# devhack.net

> It's called devhack dot net because the devhack is on the net.

This is the official website for /dev/hack, a hackerspace in Seattle.

Contributions are welcome. The canonical repository for this project is at
https://git.devhack.net/devhack/devhack.net.


## Development

To get started with developing the website:

1.  Clone this repository.
2.  Open `index.html` in your web browser to view the site, or better yet, use
    one of the ad-hoc live reload tools like Visual Studio Code's Live Server
    extension.
3.  Make the desired changes to:
    * `index.html`, `more.html`: Body copy for the main pages.
    * `index-cal.js`: Handles the calendar functionality.
    * `index-newsfeed.js`: Manages the news feed.
    * `index-spaceapi.js`: Deals with the SpaceAPI integration.
    * `index-common.js`: Contains shared utility functions.

For local development, you may want to download local copies of the data files
that the site uses. In production, they are reverse proxied from their
respective origins, and so they do not exist in git:

```sh
# in the root of the repository, run:
curl -o calendar.ics https://devhack.net/calendar.ics
curl -o spaceapi.json https://devhack.net/spaceapi.json
curl -o news.json https://devhack.net/news.json
```
