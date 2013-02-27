var http = require('http');
var url = require('url');
var Q = require("q");
var sleep = require("sleep");
var HtmlEncoder = require('node-html-encoder').Encoder;
var $ = require('cheerio');
fs = require('fs');


function getBody(url, callback)
{
    http.get(url, function(res) {
        var body = ""
        res.on('data', function (chunk) {
            body += chunk.toString();
        });
        res.on('end', function() {
            callback(undefined, body);
        });
    }).on('error', function(e) {
        callback(e, null);
    });
}

function getAttributeOfSingleChild($el, attrName) {
    //referencing issue: https://github.com/MatthewMueller/cheerio/issues/117
    var r = new RegExp(attrName+'\s*=\s*"([^"]+)"')
    return $el.clone().html('').parent().html().match(r)[1]
}

var ads = [];

function scrape(gumTreeListingUrl) {
    getBody(gumTreeListingUrl, function (err,html) {
        if (err) return console.log(err)
        var chain = [];
        var encoder = new HtmlEncoder('entity');
        var $wrapper = $('#main-content', html);
        $wrapper.find('a.description').each(function(i, elem) {
            var $a = $(this);
            var $price = $a.next().next();
            var ad = {};
            ads.push(ad);
            ad.href = $a.attr('href')
            ad.title = $a.find('h3 span').text();
            ad.price = $price.text();
            chain.push(function() {
                var deferred = Q.defer();
                getBody(ad.href, function(err,html) {
                    i++;
                    var $innerBody = $('body', html);
                    var mapLinks = $innerBody.find('a.open_map');
                    if (mapLinks.length!=0) {
                        var gmapHref = getAttributeOfSingleChild($innerBody.find('a.open_map'), 'data-target' );
                        gmapHref = encoder.htmlDecode(gmapHref);
                        var coord = url.parse(gmapHref, true).query.center;
                        coord = coord.split(',');
                        coord = [parseFloat(coord[0]), parseFloat(coord[1])]
                        ad["coord"] = coord;
                    }
                    var photos = [];
                    var $imgs = $innerBody.find('.gallery-thumbs img')
                    $imgs.each(function(i) {
                        if (i==$imgs.length-1) return;
                        photos.push(getAttributeOfSingleChild($(this), 'src'))
                    })
                    ad["photos"] = photos;
                    sleep.usleep(Math.floor(Math.random() * (1500000  - 1000000  + 1) + 1000000 ));
                    deferred.resolve();
                })
                return deferred.promise;
            });
        });

        chain.push(function() {
            var $currentPageNav = $wrapper.find('#pagination').find('li.pag-disabled').eq(0)
            if ($currentPageNav.hasClass('pag-prev')) $currentPageNav = $currentPageNav.next()
            if($currentPageNav.length!=0) {
                var nextPageLink = $currentPageNav.next().find('a');
                if (nextPageLink.length!=0) {
                    scrape(encoder.htmlDecode(getAttributeOfSingleChild(nextPageLink, 'href')))
                    return;
                }
            }
            console.log(JSON.stringify(ads))
        })
        return chain.reduce(function (soFar, f) {
            return soFar.then(f);
        }, Q.resolve());
    })
}

scrape(process.argv[2])