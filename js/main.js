(function($) {

	"use strict";	

  
    $('.navigation').singlePageNav({
        currentClass : 'active'
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