(function($){  
			 $.fn.extend({   
				 //plugin name - animatemenu  
				 animateMenu: function(options) {  
		   
					 var defaults = {  
						 animatePadding: 60,  
						 defaultPadding: 10,  
						 evenColor: '#E4EBF7',  
						 oddColor: '#E4EBF7',  
						 bgColor: '#8295AF',  
						 fontWeight: 'bold',  
					 };  
					   
					 var options = $.extend(defaults, options);  
				   
					 return this.each(function() {  
						   var o = options; 
						   var obj = $(this);                  
						   var items = $("li", obj);  
							 
						   $("li:even", obj).css('background-color', o.evenColor);                 
						   $("li:odd", obj).css('background-color', o.oddColor);                     
							 
						   items.mouseover(function() {  
							   //$(this).animate({paddingLeft: o.animatePadding}, 300);                 
							   $(this).css('background-color', o.bgColor);    
							   $(this).css('font-weight', o.fontWeight);    
							   
						   }).mouseout(function() {  
							   //$(this).animate({paddingLeft: o.defaultPadding}, 300);  
							   $("li:even", obj).css('background-color', o.evenColor);                 
							   $("li:odd", obj).css('background-color', o.oddColor); 
							    $(this).css('font-weight', 'normal');
						   });  
					 });  
				 }  
			 });  
		 })(jQuery);  