/*global RottenTomatoes, chrome, window */
function App() {
  this.rotten_tomatoes = new RottenTomatoes();
  this.processing = false;
}

App.prototype.injectCode = function () {
  var this_ = this;

  // Add a small block of Javascript into the page to allow
  // us to listen to events.
  $('<script src="' + chrome.extension.getURL('/js/inject.js') + '"></script>').appendTo('head');
  $('<div id="CwRtRatingsEx" style="position:fixed;top:0;left:0;z-index:1000;"><span></span></div>').appendTo('body');
  $('#CwRtRatingsEx').bind("DOMSubtreeModified", function () {
    this_.triggerProcessing();
  });
};

App.prototype.triggerProcessing = function () {
  console.log('triggerProcessing');
  if (this.processing) {
    return false;
  }

  this.processing = true;
  this.smallBoxes();
  this.mainListing();
  this.processing = false;
};

App.prototype.bindElements = function () {
  var this_ = this;

  $('.navigation li').on('click', function () {
    this_.triggerProcessing();
  });


};

App.prototype.sanitiseName = function (name) {
  name = name.trim();

  // Prefixes
  name = name.replace(/^Take 2 - /i, '');
  name = name.replace(/^ROH - /i, '');
  name = name.replace(/^MET Opera - /i, '');
  name = name.replace(/^NT Live Encore: /i, '');
  name = name.replace(/^NT Live: /i, '');
  name = name.replace(/Autism Friendly Screening: /i, '');
  name = name.replace(/Autism Friendly Screening: /i, '');

  // Suffixes
  name = name.replace(/ \(starring .*\)$/i, '');
  name = name.replace(/ - Unlimited Screening$/i, '');
  name = name.replace(/ - Movies For Juniors$/i, '');
  return name;
};

App.prototype.smallBoxes = function () {
  var this_ = this;

  $('ul.films:visible li').each(function () {
    var link = $('> a', this),
      name = this_.sanitiseName(link.attr('data-field-title') || link.html()),
      rating;

    if (undefined === link.data('original-html')) {
      link.data('original-html', link.html());
    }

    if (undefined === link.data('original-name')) {
      link.data('original-name', name);
    } else {
      name = link.data('original-name');
    }

    // chrome.storage.sync.clear();

    // Try retrieving the data from storage.
    chrome.storage.sync.get(name, function (items) {
      if (undefined === items[name]) {
        rating = this_.rotten_tomatoes.getRating(name);

        if (rating.status === 'success') {
          var chrome_key = {};
          chrome_key[name] = rating;

          chrome.storage.sync.set(chrome_key);
        }

      } else {
        rating = items[name];
      }

      if (rating.status === 'success') {
        rating.icon = this_.rotten_tomatoes.getIcon(rating.rating, 'small');
        link.html(link.data('original-html') + '<br><img src="' + rating.icon + '" height="16" /> ' + rating.score + '%');
      }
    });
  });
};

App.prototype.mainListing = function () {
  var this_ = this,
    retry = false;

  $('.film:visible h3.h1').each(function () {
    var link = $('> a', this),
      name = this_.sanitiseName(link.html()),
      rating,
      ele = this;

    // Is there already a rating element?
    if ($('> .rt-rating', ele).length > 0) {
      return false;
    }

    // Try retrieving the data from storage.
    chrome.storage.sync.get(name, function (items) {
      if (undefined === items[name]) {
        rating = this_.rotten_tomatoes.getRating(name);

        if (rating.status === 'success') {
          var chrome_key = {};
          chrome_key[name] = rating;
          chrome.storage.sync.set(chrome_key);
        } else {
          // If the error was that the length was 0, it's probably never going to be available,
          // so lets just store it to save the requests in future.
          if (rating.message === "data.movies.length was 0") {
            var chrome_key = {};
            chrome_key[name] = true;
            chrome.storage.sync.set(chrome_key);
          }

          else if (rating.message === 'Forbidden') {
            // We've hit the rate limit, try again in a few seconds.
            retry = true;
          }
        }

      } else {
        rating = items[name];
      }

      if (rating.status === 'success' && $('> .rt-rating', ele).length === 0) {
        rating.icon = this_.rotten_tomatoes.getIcon(rating.rating, 'large');
        var ratingElement = $('<span class="rt-rating"><img src="' + rating.icon + '" height="26" style="margin-top:-6px;" /> ' + rating.score + '%</span>');
        ratingElement.appendTo($(ele));
      }
    });
  });

  if (retry) {
    setTimeout(function() {
      console.log('Retrying!', this_.mainListing);
      this_.mainListing();
    }, 3500);
  }
};

var app = new App();
app.injectCode();
app.bindElements();
app.smallBoxes();
