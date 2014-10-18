var touchCwRtRatingsEx = function () {
  $('#CwRtRatingsEx span').html(+new Date());
}

$(window).on('after.ajax', function () {
  touchCwRtRatingsEx();
});

$(document).ajaxComplete(function () {
  touchCwRtRatingsEx();
});

touchCwRtRatingsEx();
