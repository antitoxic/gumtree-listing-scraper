## Description

A small script to crawl a url of gumtree search results and scrape advert's:

 * title
 * link
 * price
 * photos (if any)
 * location

Used and tested for list of properties but most/all the search listings on gumtree seem to be compatible.

If you are looking for a way to display scraped gumtree properties on a map use the [viewer of scrapped ads on google maps](https://github.com/web-napopa/gumtree-properties-map-plotter).

## Requirements

 * nodejs

## Deployment

	cd <<repo-dir>>
	npm install

## Scrape a listing

	node app "http://www.gumtree.com/a-url-to-a-listing-of-search-results" > adverts.json

That's it. That will scrape all available pages in the search result.

It's slow because it pauses between every visited advert link - we don't want to cause DOS for gumtree.

For best results try to limit your search using gumtree search options before passing the link to the scraper.