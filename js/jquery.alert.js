//PLUGIN FOR THE NEW ALERT BOX
 (function($){  
	 $.fn.extend({   
		 amitAlert: function(options) {
			var htmlStr = '<div id="amitOverlay"></div><div id="alertMsgDiv"><div id="aClose">[X]</div><div id="aMessage"></div></div>';
			var defaults = {   
				 bgColor: '#CCC',  
				 opacity: '0.6',  
				 message: 'Developed by: Amit Yadav<img src="../images/generator.php.gif">',  
			 };  
			  
			var options = $.extend(defaults, options);  
			$("body").append(htmlStr);
			$("#alertMsgDiv").css({'display': 'block', 'width': '0px'});
			$("#amitOverlay").css({'display': 'block', 'top': '0px', 'left': '0px', 'width': $(this).width() + "px", 'height': $(this).height() + "px", 'background-color': options.bgColor, 'opacity': options.opacity});	

			$("#alertMsgDiv").animate({width: "600px"}, 300);
			$("#aMessage").html(options.message);

			$("#aClose, #amitOverlay").click(function(){	
				$("#alertMsgDiv").hide();
				$("#amitOverlay").hide();					
			});
		 }  
	 });  
 })(jQuery); 



//PLUGIN FOR THE NEW ALERT BOX
 (function($){  
	 $.fn.extend({   
		 loaderAmit: function(options) {
			var htmlStr = '<div id="amitOverlay"></div><div id="loaderDiv"><img src="../images/generator.php.gif">LOADING...<div id="aMessage"></div></div>';
			var defaults = {   
				 bgColor: '#000',  
				 opacity: '0.6',  
				 message: '<img src="../images/generator.php.gif">',  
			 };  
			
			var options = $.extend(defaults, options);  
			//$("body").append(htmlStr);
			$("#loaderDiv").css({'display': 'block', 'width': '100px'});
			$("#amitOverlay").css({'display': 'block', 'top': '0px', 'left': '0px', 'width': $(this).width() + "px", 'height': $(this).height() + "px", 'background-color': options.bgColor, 'opacity': options.opacity});	

			//$("#aMessage").html(options.message);

			$("#amitOverlay").click(function(){	
				$("#loaderDiv").hide();
				$("#amitOverlay").hide();					
				$("#aMessage").hide();					
			});
		 }  
	 });  
 })(jQuery); 


(function($) {
  var cache = [];
  // Arguments are image paths relative to the current page.
  $.preLoadImages = function() {
    var args_len = arguments.length;
    for (var i = args_len; i--;) {
      var cacheImage = document.createElement('img');
      cacheImage.src = arguments[i];
      cache.push(cacheImage);
    }
  }
})(jQuery)



 /*
 USAGE
 $("#showMessage").click(function(){
	$(document).amitAlert({opacity:0.4, bgColor: "#aaa"});
 });
 */