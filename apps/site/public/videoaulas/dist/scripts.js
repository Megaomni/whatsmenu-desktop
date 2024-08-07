$('.ui.sidebar.left').sidebar('setting', 'transition', 'overlay');
$('.botLEFT').click(() => {
  $('.ui.sidebar.left').sidebar('toggle');
});

function execBounce(selector) {
  $(selector).transition('bounce');
}
