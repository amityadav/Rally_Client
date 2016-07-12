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


var Rally = function(){
	
}

Rally.API = function(){}


Rally.API.prototype = {
	itemState: {		"New": 'N', 
						"Defined": 'D', 
						"In-Progress": 'P', 
						"Completed": 'C', 
						"Accepted": 'A'
					 },
	getUserProjectIterations: function(url){  
												var request = new air.URLRequest(url); 
												//request.contentType = "text/x-json"; 
												var loader = new air.URLLoader(); 
												loader.addEventListener(air.Event.COMPLETE, getUserProjectIterationsHandler); 
												loader.addEventListener(air.Event.OPEN, openHandler);
									            loader.addEventListener(air.ProgressEvent.PROGRESS, progressHandler);
									            loader.addEventListener(air.SecurityErrorEvent.SECURITY_ERROR, securityErrorHandler);
									            loader.addEventListener(air.HTTPStatusEvent.HTTP_STATUS, httpStatusHandler);
									            loader.addEventListener(air.IOErrorEvent.IO_ERROR, ioErrorHandler);

			
												try 
												{ 
													loader.load(request); 
												}  
												catch (error) 
												{ 
													air.trace("Unable to load URL: " + error); 
												} 
												
												function openHandler(event) {
										            air.trace("openHandler: " + event);
										        }
										
										        function progressHandler(event) {
										            air.trace("progressHandler loaded:" + event.bytesLoaded + " total: " + event.bytesTotal);
										        }
										
										        function securityErrorHandler(event) {
										            air.trace("securityErrorHandler: " + event);
										        }
										
										        function httpStatusHandler(event) {
										            air.trace("httpStatusHandler: " + event);
										        }
										
										        function ioErrorHandler(event) {
										            air.trace("ioErrorHandler: " + event);
										        }

												function getUserProjectIterationsHandler(event) 
												{ 
													$('#users-projects-iterations').empty();
													
													var dataJSON = event.target.data; 
													var dataObj = jQuery.parseJSON(dataJSON);
													//air.trace(dataJSON); 

													$("#results").text("");
													$("#results").hide("");
													$("#selectedWorkspace").attr("value", dataObj.Project.Workspace._ref);
													if(dataJSON){
														for(i=0; i<dataObj.Project.Iterations.length;i++){
															$('#users-projects-iterations').append(new  Option(dataObj.Project.Iterations[i]._refObjectName, dataObj.Project.Iterations[i]._ref, true, true));
														}
													}
												}
											},
	getUserProjects: function(url){
										var obj = this;
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
												obj.getUserProjectIterations("http://rally.amit.com:8000?objName=getProjectIterations&project=" + $('#user-projects').val());	
											}
											
										}
									},
	sendUsersRequests: function(url, requestType){
											var obj = this;
											var request = new air.URLRequest(url); 
											request.contentType = "text/x-json"; 
											var loader = new air.URLLoader(); 
											loader.addEventListener(air.Event.COMPLETE, completeHandler); 
											loader.load(request);
											$(document).loaderAmit({opacity:0.4, bgColor: "#aaa"});
											 
											function completeHandler(event) 
											{ 
												var dataJSON = event.target.data; 
												var dataObj = jQuery.parseJSON(dataJSON);
												//air.trace(dataObj); 

												$("#results").text("");
												$("#results").hide("");
												
												if(dataObj.QueryResult.TotalResultCount > 0){
													$("#results").append("<div class='row-header id float-left'>ID</div><div class='row-header details float-left'>Name</div><div class='row-header item-state float-left'>State</div><div class='row-header other float-left'>Plan Est</div><div class='row-header other float-left'>Task Est</div><div class='row-header other float-left'>To Do</div><div class='row-header owner float-left'>Owner</div><div class='row-header actions float-left'>Actions</div><div class='clearer'></div>");
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

															for(var key in obj.itemState){
																if(jsonState.toString() == key.toString()){
																		strState += '<div class="state-box-completed float-left">' + obj.itemState[key] + '</div>';
																		matched = true;
																}else{
																	if(matched)
																		strState += '<div class="state-box float-left">' + obj.itemState[key] + '</div>';
																	else
																		strState += '<div class="state-box-completed float-left">' + obj.itemState[key] + '</div>';
																}
															}

															$("#results").append("<div class='user-defects' resource-locator='" + dataObj.QueryResult.Results[i]._ref + "'><div class='" + className + " id float-left'>" + dataObj.QueryResult.Results[i].FormattedID + "</div><div class='" + className + " details float-left'>" + dataObj.QueryResult.Results[i]._refObjectName + "</div><div class='" + className + " item-state float-left'>" + strState + "</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].PlanEstimate + "</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].TaskEstimateTotal + " Hours</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].TaskRemainingTotal + " Hours</div><div class='" + className + " owner float-left'>" + dataObj.QueryResult.Results[i].Owner._refObjectName + "</div><div class='" + className + " actions float-left'>More...</div></div><div class='clearer'></div>");
														}

														//Add event to defects to get the details
														$(".user-defects").click(function(){
															//air.trace("Amit");
															//air.trace($(this).attr("resource-locator"));
															obj.getDefectDetails($(this).attr("resource-locator"), $(this));	
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

															for(var key in obj.itemState){
																if(jsonState.toString() == key.toString()){
																		strState += '<div class="state-box-completed float-left">' + obj.itemState[key] + '</div>';
																		matched = true;
																}else{
																	if(matched)
																		strState += '<div class="state-box float-left">' + obj.itemState[key] + '</div>';
																	else
																		strState += '<div class="state-box-completed float-left">' + obj.itemState[key] + '</div>';
																}
															}

															$("#results").append("<div class='user-stories' resource-locator='" + dataObj.QueryResult.Results[i]._ref + "'><div class='" + className + " id float-left'>" + dataObj.QueryResult.Results[i].FormattedID + "</div><div class='" + className + " details float-left'>" + dataObj.QueryResult.Results[i]._refObjectName + "</div><div class='" + className + " item-state float-left'>" + strState + "</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].PlanEstimate + "</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].TaskEstimateTotal + " Hours</div><div class='" + className + " other float-left'>" + dataObj.QueryResult.Results[i].TaskRemainingTotal + " Hours</div><div class='" + className + " owner float-left'>" + dataObj.QueryResult.Results[i].Owner._refObjectName + "</div><div class='" + className + " actions float-left'>More...</div></div><div class='clearer'></div>");
														}

														//Add event to user stories to get the details
														$(".user-stories").click(function(){
															//air.trace("Amit");
															//air.trace($(this).attr("resource-locator"));
															obj.getUserStoryDetails($(this).attr("resource-locator"), $(this));	
														});
													}
													$("#results").slideDown("slow");
												}else{
													$("#results").text("No data for returned");
													$("#results").slideDown("slow");
												}
												$("#loaderDiv").hide(); $("#amitOverlay").hide(); $("#aMessage").hide();
											}
										},
	//Function to get the details for a user story
	getUserStoryDetails: function(defectResource, obj){
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
												$(".user-story-description").html(dataObj.HierarchicalRequirement.Description);
												$(".user-story-owner").text(dataObj.HierarchicalRequirement.Owner._refObjectName);
												$(".user-story-project").text(dataObj.HierarchicalRequirement.Project._refObjectName);
												$(".user-story-parent").text(dataObj.HierarchicalRequirement.Project._refObjectName);
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
										},
	//Function to get the details for a defect
	getDefectDetails: function(defectResource, obj){
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
											$(".defect-description").html(dataObj.Defect.Description);
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
											
											$("#results").hide();
											$("#sample-defect-detail").appendTo($("#playground")).slideDown("slow");
											obj.attr('has-detail', 1);
											$("#btnBack").show();
										}
									}
}



 
// Constants
// Mostly for timer and sizing
var DELAY = 1000;
var NOTIFY_SOURCE = "notify.html";
var REPEAT = 10;
var WINDOW_WIDTH = 200;
var WINDOW_HEIGHT = 50;

// Timer variable
var timer = null;


var RallyAPI = new Rally.API();

$(document).ready(function(){
	//Image Preloader
	jQuery.preLoadImages("../images/generator.php.gif");
	
	$('#user-menu').animateMenu({animatePadding: 20, defaultPadding:0});

	//GET THE USER DEFECTS
	$('#get-user-defects').click(function(){
		RallyAPI.sendUsersRequests("http://rally.amit.com:8000?objName=getUserDefects&workspace=" + $('#selectedWorkspace').val() + "&iteration=" + $('#users-projects-iterations option:selected').text() + "&project=" + $('#user-projects option:selected').text(), 'get-user-defects');	
	});	

	//GET USERS STORIES
	$('#get-user-stories').click(function(){
		RallyAPI.sendUsersRequests("http://rally.amit.com:8000?objName=getProjectIterationsStories&workspace=" + $('#selectedWorkspace').val() + "&iteration=" + $('#users-projects-iterations option:selected').text() + "&project=" + $('#user-projects option:selected').text(), 'get-user-stories');	
	});

	$("#btnBack").click(function(){
		$("#results").show();
		$("#sample-defect-detail").hide();
		$("#sample-user-story-detail").hide();
	});

	//Populate user project
	RallyAPI.getUserProjects("http://rally.amit.com:8000?objName=getUserProjects");		

	$('#user-projects').change(function(){
		$('#users-projects-iterations').empty();
		//RallyAPI.getUserProjectIterations("http://rally.amit.com:8000?objName=getProjectIterations&project=" + $('#user-projects').val());	
	});
	
	$('#btnIterations').css({'cursor': 'pointer'});
	$('#btnIterations').click(function(){
		RallyAPI.getUserProjectIterations("http://rally.amit.com:8000?objName=getProjectIterations&project=" + $('#user-projects').val());
	});
	

	// Setup a timer
	// Listen for incremental changes and completion
	/*timer = new air.Timer( DELAY, REPEAT );
	timer.addEventListener( air.TimerEvent.TIMER, doTimer );
	timer.addEventListener( air.TimerEvent.TIMER_COMPLETE, doTimerComplete );*/
	
	// Start timer
	//timer.start();
});





// Called when each iteration of the timer has occurred
// Updates the display for the user
function doTimer( evt )
{
	// Timer keeps track of current iteration
	$("#txtCount" ).text( REPEAT - evt.target.currentCount );
}

// Called when the timer has completed all of the iterations
// Displays a new native window in the form of a notification
function doTimerComplete( evt )
{
	// Variables related to the new native window
	var bounds = null;
	var notification = null;
	var options = new air.NativeWindowInitOptions();
	var screen = air.Screen.mainScreen.visibleBounds;

	// Setup the new window
	// Use lightweight to remove chrome
	// Set window to transparent
	// Explicitly specify to not use system chrome
	options.type = air.NativeWindowType.LIGHTWEIGHT;
	options.transparent = true;
	options.systemChrome = air.NativeWindowSystemChrome.NONE;

	// Figure out where to put the window on the screen
	bounds = new air.Rectangle(
		screen.width - WINDOW_WIDTH - 10,
		screen.height - WINDOW_HEIGHT - 10,
		WINDOW_WIDTH,
		WINDOW_HEIGHT
	);

	// Create a new native window and get a handle to the HTML viewport
	notification = air.HTMLLoader.createRootWindow( true, options, false, bounds );
	
	// Tell browser not to paint a default background
	// Position the new window in front of everything else
	// Any links open in browser registered to the system
	notification.paintsDefaultBackground = false;
	notification.stage.nativeWindow.alwaysInFront = true;
	notification.navigateInSystemBrowser = true;
	
	// Load the page that represent the notification display
	// In this case a local HTML page included with the AIR application
	notification.load( new air.URLRequest( NOTIFY_SOURCE ) );
	
	// Alternatively
	// notification.loadString( "Foo.  Bar." );	
	
	// Reset the display to the user
	$("#txtCount" ).text( REPEAT );
	
	// Reset the timer and start again
	timer.reset();
	timer.start();
}


/*
 * ---------------END-----------------------
 * ADDED BY AMIT YADAV
 * DATED: 08 JULY 2010
 * -----------------------------------------
 */