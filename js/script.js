// initialize keycode library
var keycode = require('keycode');

$(document).ready( function(){

  //grab the keydown even
  $(window).keydown( function(event){

    //if the user hasn't selected something (you know, to copy and paste), preventDefault and show the keycode
    if(window.getSelection().type !== "Range" || document.getSelection().type !== "Range"){
      event.preventDefault();
      $('.code').html(event.which);
      $('.label').html(keycode(event));
    }

  })
});