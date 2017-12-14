$(function() {
    // bootstrap-ify tables of #content.
    $('#content table').addClass('table table-bordered table-responsive-sm');

    // center and linkable all images of #content.
    var $images = $('#content img:not(.emoji,.static)');
    $images.closest('p').css('text-align', 'center');
    $images.each(function () {
        var imgUrl = $(this).attr('src');
        var $a = $('<a>').attr('href', imgUrl).attr('target', '_blank');
        $(this).wrap($a);
    });

    // add `target="_blank"` into all outer links.
    var host = document.location.host;
    $('a[href]').each(function() {
        var re = new RegExp('//' + host, 'g');
        if ($(this).attr('href').match(/\/\//) && !$(this).attr('href').match(re)) {
            $(this).attr('target', '_blank');
        }
    });
});
