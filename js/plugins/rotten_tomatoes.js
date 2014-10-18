function RottenTomatoes() {
  this.API_KEY = 'j4fcqjak7buw8rdv4pzqg3m4';
  this.API_URL = 'http://api.rottentomatoes.com/api/public/v1.0/movies.json?apikey=' + this.API_KEY;

  this.IMG_SPLAT = chrome.extension.getURL('/img/splat.png');
  this.IMG_FRESH = chrome.extension.getURL('/img/fresh.png');
  this.IMG_CERTIFIED_FRESH = chrome.extension.getURL('/img/certified-fresh.png');
  this.IMG_CERTIFIED_FRESH_16 = chrome.extension.getURL('/img/certified-fresh-16.png');
}

RottenTomatoes.prototype.getIcon = function (rating, size) {
  if (rating === "Certified Fresh") {
    if (size === 'small') {
      return this.IMG_CERTIFIED_FRESH_16;
    }

    return this.IMG_CERTIFIED_FRESH;
  }

  if (rating === "Rotten") {
    return this.IMG_SPLAT;
  }

  return this.IMG_FRESH;
};

RottenTomatoes.prototype.getRating = function (name) {
  // console.log('Getting rating for ' + name);
  var return_data;

  if (undefined !== return_data) {
    return return_data;
  }

  $.ajax({
    dataType: 'json',
    url: this.API_URL,
    data: {
      page_limit: 1,
      q: name
    },
    async: false,
    error: function (jqXHR, textStatus, errorThrown) {
      return_data = {
        status: 'error',
        message: errorThrown
      };
    },
    success: function (data) {
      if (undefined !== data.error) {
        return_data = {
          status: 'error',
          message: data.error,
        };

        return true;
      }

      if (data.movies.length === 1) {
        return_data = {
          status: 'success',
          rating: data.movies[0].ratings.critics_rating,
          score: data.movies[0].ratings.critics_score,
        };

        return true;
      }

      return_data = {
        status: 'error',
        message: 'data.movies.length was ' + data.movies.length
      };
    }
  });

  return return_data;
};
