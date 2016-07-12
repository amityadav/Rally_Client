/*
 *				    _
 *				  (   )
 *				 ( o o )
 *				  ( - )
 *				 / -U- \
 *
 * --------------STARTED----------------------
 * ADDED BY AMIT YADAV
 * DATED: 08 JULY 2010
 * -------------------------------------------
 */

/**
 * Students view profile element
 */

var itemState = {	"New": 'N', 
					"Defined": 'D', 
					"In-Progress": 'P', 
					"Completed": 'C', 
					"Accepted": 'A'
				};

$(document).ready(function(){
	//GET THE USER DEFECTS
	$('#get-user-defects').click(function(){
		sendUsersRequests("http://rally.amit.com:8000?objName=getUserDefects&workspace=" + $('#selectedWorkspace').val() + "&iteration=" + $('#user-projects-iterations option:selected').text() + "&project=" + $('#user-projects option:selected').text(), 'get-user-defects');	
	});	

	//GET USERS STORIES
	$('#get-user-stories').click(function(){
		sendUsersRequests("http://rally.amit.com:8000?objName=getProjectIterationsStories&workspace=" + $('#selectedWorkspace').val() + "&iteration=" + $('#user-projects-iterations option:selected').text() + "&project=" + $('#user-projects option:selected').text(), 'get-user-stories');	
	});

	$("#btnBack").click(function(){
		$("#results").show();
		$("#sample-defect-detail").hide();
		$("#sample-user-story-detail").hide();
	});

	//Populate user project
	getUserProjects("http://rally.amit.com:8000?objName=getUserProjects");	
});





getUserProjects = function(url){
	var request = new air.URLRequest(url); 
	request.contentType = "text/x-json"; 
	var loader = new air.URLLoader(); 
	loader.addEventListener(air.Event.COMPLETE, getUserProjectsHandler);
	loader.load(request); 
	 
	function getUserProjectsHandler(event) 
	{ 
		$('#user-projects').empty();

		var dataJSON = event.target.data; 
		var dataObj = jQuery.parseJSON(dataJSON);
		//air.trace(dataObj); 

		$("#results").text("");
		$("#results").hide("");
		if(dataJSON){
			for(i=0; i<dataObj.User.Projects.length;i++){
				$('#user-projects').append(new  Option(dataObj.User.Projects[i]._refObjectName, dataObj.User.Projects[i]._ref, true, true));
			}

			//Populate projects iteration
			//$("#user-projects").change(function(){
				getUserProjectIterations("http://rally.amit.com:8000?objName=getProjectIterations&project=" + $('#user-projects').val());	
			//});
		}
	}
}



getUserProjectIterations = function(url){
	var request = new air.URLRequest(url); 
	request.contentType = "text/x-json"; 
	var loader = new air.URLLoader(); 
	loader.addEventListener(air.Event.COMPLETE, getUserProjectIterationsHandler); 
	loader.load(request); 
	 
	function getUserProjectIterationsHandler(event) 
	{ 
		$('#user-projects-iterations').empty();
		
		var dataJSON = event.target.data; 
		var dataObj = jQuery.parseJSON(dataJSON);
		//air.trace(dataJSON); 

		$("#results").text("");
		$("#results").hide("");
		$("#selectedWorkspace").attr("value", dataObj.Project.Workspace._ref);
		if(dataJSON){
			for(i=0; i<dataObj.Project.Iterations.length;i++){
				$('#user-projects-iterations').append(new  Option(dataObj.Project.Iterations[i]._refObjectName, dataObj.Project.Iterations[i]._ref, true, true));
			}
		}
	}
}




//Common functions
sendUsersRequests = function(url, requestType){
	//alert(url);
	var request = new air.URLRequest(url); 
	request.contentType = "text/x-json"; 
	var loader = new air.URLLoader(); 
	loader.addEventListener(air.Event.COMPLETE, completeHandler); 
	loader.load(request); 
	 
	function completeHandler(event) 
	{ 
		var dataJSON = event.target.data; 
		var dataObj = jQuery.parseJSON(dataJSON);
		//air.trace(dataObj); 

		$("#results").text("");
		$("#results").hide("");
		if(dataJSON){
			//If the data is for user defects
			if(requestType == 'get-user-defects'){
				for(i=0; i<dataObj.QueryResult.Results.length;i++){
					if(i%2 == 0)
						className = "even";
					else
						className = "odd";
					
					strState = '';
					matched = false;
					jsonState = "";

					if(dataObj.QueryResult.Results[i].State == "Submitted")
						jsonState = "Completed";
					else if(dataObj.QueryResult.Results[i].State == "Fixed")
						jsonState = "Accepted";
					else
						jsonState = dataObj.QueryResult.Results[i].State

					for(var key in itemState){
						if(jsonState.toString() == key.toString()){
							air.trace(jsonState + "==" + key);
								strState += '<div class="state-box-completed float-left">' + itemState[key] + '</div>';
								matched = true;
						}else{
							if(matched)
								strState += '<div class="state-box float-left">' + itemState[key] + '</div>';
							else
								strState += '<div class="state-box-completed float-left">' + itemState[key] + '</div>';
						}
					}

					$("#results").append("<div resource-locator='" + dataObj.QueryResult.Results[i]._ref + "'><div class='" + className + " id float-left'>" + dataObj.QueryResult.Results[i].FormattedID + "</div><div class='" + className + " details float-left'>" + dataObj.QueryResult.Results[i]._refObjectName + "</div><div class='" + className + " item-state float-left'>" + strState + "</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].PlanEstimate + "</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].TaskEstimateTotal + " Hours</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].TaskRemainingTotal + " Hours</div><div class='" + className + " owner float-left'>" + dataObj.QueryResult.Results[i].Owner._refObjectName + "</div><div class='" + className + " actions float-left'>More...</div></div><div class='clearer'></div>");
				}

				//Add event to defects to get the details
				$(".user-defects").click(function(){
					//air.trace("Amit");
					//air.trace($(this).attr("resource-locator"));
					getDefectDetails($(this).attr("resource-locator"), $(this));	
				});
			//If the data is for user stories
			}else if(requestType == 'get-user-stories'){
				for(i=0; i<dataObj.QueryResult.Results.length;i++){
					if(i%2 == 0)
						className = "even";
					else
						className = "odd";

					strState = '';
					matched = false;
					jsonState = "";

					if(dataObj.QueryResult.Results[i].ScheduleState == "Submitted")
						jsonState = "Completed";
					else if(dataObj.QueryResult.Results[i].ScheduleState == "Fixed")
						jsonState = "Accepted";
					else
						jsonState = dataObj.QueryResult.Results[i].ScheduleState

					for(var key in itemState){
						if(jsonState.toString() == key.toString()){
							air.trace(jsonState + "==" + key);
								strState += '<div class="state-box-completed float-left">' + itemState[key] + '</div>';
								matched = true;
						}else{
							if(matched)
								strState += '<div class="state-box float-left">' + itemState[key] + '</div>';
							else
								strState += '<div class="state-box-completed float-left">' + itemState[key] + '</div>';
						}
					}

					$("#results").append("<div resource-locator='" + dataObj.QueryResult.Results[i]._ref + "'><div class='" + className + " id float-left'>" + dataObj.QueryResult.Results[i].FormattedID + "</div><div class='" + className + " details float-left'>" + dataObj.QueryResult.Results[i]._refObjectName + "</div><div class='" + className + " item-state float-left'>" + strState + "</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].PlanEstimate + "</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].TaskEstimateTotal + " Hours</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].TaskRemainingTotal + " Hours</div><div class='" + className + " owner float-left'>" + dataObj.QueryResult.Results[i].Owner._refObjectName + "</div><div class='" + className + " actions float-left'>More...</div></div>");
				}

				//Add event to user stories to get the details
				$(".user-stories").click(function(){
					//air.trace("Amit");
					//air.trace($(this).attr("resource-locator"));
					getUserStoryDetails($(this).attr("resource-locator"), $(this));	
				});
			}
			$("#results").slideDown("slow");
		}
	}
}






	
	
	  
//Function to get the details for a user story
getUserStoryDetails = function(defectResource, obj){
	var request = new air.URLRequest(defectResource); 
	request.contentType = "text/x-json"; 
	var loader = new air.URLLoader(); 
	loader.addEventListener(air.Event.COMPLETE, requestCompleteHandler); 
	loader.load(request); 
	 
	function requestCompleteHandler(event) 
	{ 
		if(obj.attr('has-detail') == 1) return;

		var dataJSON = event.target.data; 
		var dataObj = jQuery.parseJSON(dataJSON);

		$(".user-story-id ,.user-story-name, .user-story-tags, .user-story-description, .user-story-attachment, .user-story-owner, .user-story-package, .user-story-project, .user-story-state, .user-story-environment, .user-story-priority, .user-story-severity, .user-story-submitted-by, .user-story-creation-date, .user-story-found-in, .user-story-fixed-in, .user-story-target-build, .user-story-verified-in, .user-story-resolution, .user-story-target-date, .user-story-release-note, .user-story-affects-doc, .user-story-project, .user-story-schedule-state, .user-story-blocked, .user-story-release, .user-story-iteration, .user-story-plan-estimate, .user-story-task-estimate, .user-story-to-do, .user-story-actual, .user-story-notes").text('');

		
		$(".user-story-id").text(dataObj.HierarchicalRequirement.FormattedID);
		$(".user-story-name").text(dataObj.HierarchicalRequirement.Name);
		//$(".user-story-tags").text(dataObj.HierarchicalRequirement.);
		$(".user-story-description").html(dataObj.HierarchicalRequirement.Description);
		//$(".user-story-attachment").text(dataObj.HierarchicalRequirement.);
		$(".user-story-owner").text(dataObj.HierarchicalRequirement.Owner._refObjectName);
		//$(".user-story-package").text(dataObj.HierarchicalRequirement.Package);
		$(".user-story-project").text(dataObj.HierarchicalRequirement.Project._refObjectName);
		$(".user-story-parent").text(dataObj.HierarchicalRequirement.Project._refObjectName);
		/*$(".user-story-state").text(dataObj.HierarchicalRequirement.State);
		$(".user-story-environment").text(dataObj.HierarchicalRequirement.Environment);
		$(".user-story-priority").text(dataObj.HierarchicalRequirement.Priority);
		$(".user-story-severity").text(dataObj.HierarchicalRequirement.Severity);
		$(".user-story-submitted-by").text(dataObj.HierarchicalRequirement.SubmittedBy._refObjectName);
		$(".user-story-creation-date").text(dataObj.HierarchicalRequirement.CreationDate);
		$(".user-story-found-in").text(dataObj.HierarchicalRequirement.FoundInBuild);
		$(".user-story-fixed-in").text(dataObj.HierarchicalRequirement.FixedInBuild);
		$(".user-story-target-build").text(dataObj.HierarchicalRequirement.TargetBuild);
		$(".user-story-verified-in").text(dataObj.HierarchicalRequirement.VerifiedInBuild);
		$(".user-story-resolution").text(dataObj.HierarchicalRequirement.Resolution);
		$(".user-story-target-date").text(dataObj.HierarchicalRequirement.TargetDate);
		$(".user-story-release-note").text(dataObj.HierarchicalRequirement.ReleaseNote);
		$(".user-story-affects-doc").text(dataObj.HierarchicalRequirement.AffectsDoc);
		$(".user-story-project").text(dataObj.HierarchicalRequirement.Project._refObjectName);*/
		$(".user-story-schedule-state").text(dataObj.HierarchicalRequirement.ScheduleState);
		$(".user-story-blocked").text(dataObj.HierarchicalRequirement.Blocked);
		$(".user-story-release").text(dataObj.HierarchicalRequirement.Release._refObjectName);
		$(".user-story-iteration").text(dataObj.HierarchicalRequirement.Iteration._refObjectName);
		$(".user-story-plan-estimate").text(dataObj.HierarchicalRequirement.PlanEstimate);
		$(".user-story-task-estimate").text(dataObj.HierarchicalRequirement.TaskEstimateTotal);
		$(".user-story-to-do").text(dataObj.HierarchicalRequirement.TaskRemainingTotal);
		$(".user-story-actual").text(dataObj.HierarchicalRequirement.TaskActualTotal);
		$(".user-story-notes").html(dataObj.HierarchicalRequirement.Notes);
		
		$("#results").hide();
		$("#sample-user-story-detail").appendTo($("#playground")).slideDown("slow");
		obj.attr('has-detail', 1);
		$("#btnBack").show();
	}
};


//Function to get the details for a defect
getDefectDetails = function(defectResource, obj){
	var request = new air.URLRequest(defectResource); 
	request.contentType = "text/x-json"; 
	var loader = new air.URLLoader(); 
	loader.addEventListener(air.Event.COMPLETE, requestCompleteHandler); 
	loader.load(request); 
	 
	function requestCompleteHandler(event) 
	{ 
		if(obj.attr('has-detail') == 1) return;

		var dataJSON = event.target.data; 
		var dataObj = jQuery.parseJSON(dataJSON);

		$(".defect-id ,.defect-name, .defect-tags, .defect-description, .defect-attachment, .defect-owner, .defect-package, .defect-project, .defect-state, .defect-environment, .defect-priority, .defect-severity, .defect-submitted-by, .defect-creation-date, .defect-found-in, .defect-fixed-in, .defect-target-build, .defect-verified-in, .defect-resolution, .defect-target-date, .defect-release-note, .defect-affects-doc, .defect-project, .defect-schedule-state, .defect-blocked, .defect-release, .defect-iteration, .defect-plan-estimate, .defect-task-estimate, .defect-to-do, .defect-actual, .defect-notes").text('');

		
		$(".defect-id").text(dataObj.Defect.FormattedID);
		$(".defect-name").text(dataObj.Defect.Name);
		//$(".defect-tags").text(dataObj.Defect.);
		$(".defect-description").html(dataObj.Defect.Description);
		//$(".defect-attachment").text(dataObj.Defect.);
		$(".defect-owner").text(dataObj.Defect.Owner._refObjectName);
		$(".defect-package").text(dataObj.Defect.Package);
		$(".defect-project").text(dataObj.Defect.Project._refObjectName);
		$(".defect-state").text(dataObj.Defect.State);
		$(".defect-environment").text(dataObj.Defect.Environment);
		$(".defect-priority").text(dataObj.Defect.Priority);
		$(".defect-severity").text(dataObj.Defect.Severity);
		$(".defect-submitted-by").text(dataObj.Defect.SubmittedBy._refObjectName);
		$(".defect-creation-date").text(dataObj.Defect.CreationDate);
		$(".defect-found-in").text(dataObj.Defect.FoundInBuild);
		$(".defect-fixed-in").text(dataObj.Defect.FixedInBuild);
		$(".defect-target-build").text(dataObj.Defect.TargetBuild);
		$(".defect-verified-in").text(dataObj.Defect.VerifiedInBuild);
		$(".defect-resolution").text(dataObj.Defect.Resolution);
		$(".defect-target-date").text(dataObj.Defect.TargetDate);
		$(".defect-release-note").text(dataObj.Defect.ReleaseNote);
		$(".defect-affects-doc").text(dataObj.Defect.AffectsDoc);
		$(".defect-project").text(dataObj.Defect.Project._refObjectName);
		$(".defect-schedule-state").text(dataObj.Defect.ScheduleState);
		$(".defect-blocked").text(dataObj.Defect.Blocked);
		$(".defect-release").text(dataObj.Defect.Release._refObjectName);
		$(".defect-iteration").text(dataObj.Defect.Iteration._refObjectName);
		$(".defect-plan-estimate").text(dataObj.Defect.PlanEstimate);
		$(".defect-task-estimate").text(dataObj.Defect.TaskEstimateTotal);
		$(".defect-to-do").text(dataObj.Defect.TaskRemainingTotal);
		$(".defect-actual").text(dataObj.Defect.TaskActualTotal);
		$(".defect-notes").html(dataObj.Defect.Notes);
		
		//$("#sample-defect-detail").clone().appendTo(obj).slideDown("slow");
		$("#results").hide();
		$("#sample-defect-detail").appendTo($("#playground")).slideDown("slow");
		obj.attr('has-detail', 1);
		$("#btnBack").show();
	}
};

/*
 * ---------------END-----------------------
 * ADDED BY AMIT YADAV
 * DATED: 08 JULY 2010
 * -----------------------------------------
 */