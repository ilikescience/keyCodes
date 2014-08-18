var keycode = require('keycode');

$(document).ready( function(){
  $(window).keydown( function(event){

    console.log(window.getSelection());
    if(window.getSelection().type !== "Range" || document.getSelection().type !== "Range"){
      $('.code').html(event.which);
      $('.label').html(keycode(event));
    }

  })
});