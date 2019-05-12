(function($) {
	"use strict";	
  
    $('#home .navigation').singlePageNav({
        currentClass : 'active'
    });

    $('.navigation a').each(function(){
        var $that = $(this);
        var path = $that.attr('href');
        // todo: fix /path/one and /path/ double matching
        if(path !== "/" && window.location.pathname.indexOf(path) > -1){
            $that.addClass('active');
        }
    });

    $('.toggle-menu').click(function(){
        $('.responsive-menu').stop(true,true).slideToggle();
        return false;
    });

    //$(document).ready(function () {
    //    $('.project-item').bind('touchstart touchend', function (e) {
    //        e.preventDefault();
    //        $(this).toggleClass('project-hover');
    //    });
    //});

})(jQuery);