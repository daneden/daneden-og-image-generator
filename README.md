**Note: the functionality of this repo has now moved directly into [my site repo](https://github.com/daneden/daneden.me).**

# daneden.me OpenGraph Image Generator

This repo provides a serverless function, deployed on Zeit Now, which generates a 1200x1200px image for OpenGraph cards with a provided title.

It's used on my website, [daneden.me](https://daneden.me), to automatically generate images to be attached to social media shares of my blog posts.

## How it works

1. A request is made to the API with a `title` query parameter. This string will be what gets rendered in the resulting image.
2. The API generates an HTML string;
3. The HTML string is passed to a Puppeteer instance running Chrome;
4. Puppeteer is instructed to take a screenshot of the resulting page;
5. This screenshot is returned as the response for the HTTP request;
6. The response is cached for a long time via Now to prevent unnecessary (and expensive) image regeneration.

An important step I had to take to make this work was grabbing custom fonts as base64 strings, since it was hard to get Puppeteer to wait until fonts were loaded over HTTP.
