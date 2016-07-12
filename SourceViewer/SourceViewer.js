SourceViewer = function() {
	throw ( new Error (
			"You cannot instantiate the 'air.SourceViewer' class. " +
			"Instead, use 'air.SourceViewer.getDefault()' to retrieve the " +
			"class' unique instance."
	));
}
SourceViewer.getDefault = function() {
	var context = arguments.callee;
	if (context.instance) { return context.instance };

	
	
	/**
	 * CLASS
	 * 		air.SourceViewer
	 * DESCRIPTION
	 * 		Plug & play, self-contained module to embed in HTML based AIR 
	 * 		applications. It will display a customizable selection of source 
	 * 		files in an expandable tree structure. The final user will be able 
	 * 		to click on a file to view its source code.
	 * SAMPLE USAGE
	 * 		@see internal wiki @link http://apolloteam.corp.adobe.com/wiki/doku.php?id=apollo:design:source_browser 
	 * @version 1.2a
	 * @class
	 * @public
	 * @singleton
	 */
	function _SourceViewer() {



		/**
		 * CONSTANTS
		 * Private members that aren't ment to be altered in any way.
		 * @private
		 * @constant
		 */
		// @AIR runtime:
		var HTMLLoader               = window.runtime.flash.html.HTMLLoader;
		var NativeWindowInitOptions  = window.runtime.flash.display.
									   NativeWindowInitOptions;
		var Rectangle                = window.runtime.flash.geom.Rectangle;
		var NativeWindowType         = window.runtime.flash.display.
		                               NativeWindowType;
		var File                     = window.runtime.flash.filesystem.File;
		var FileStream               = window.runtime.flash.filesystem.
		                               FileStream;

		// @application
		var VALID_EXTENSIONS         = ['txt', 'xml', 'mxml', 'htm', 'html',
		                                'js', 'as', 'css', 'properties', 
		                                'config', 'ini', 'bat', 'readme'];

		// @events
		var WINDOW_CREATED_EVENT       = 'windowCreatedEvent';
		var FILES_LIST_READY_EVENT     = 'filesListReadyEvent';
		var FILE_LISTED_EVENT          = 'fileListedEvent';
		var FOLDER_CHECKED_EVENT       = 'folderCheckedEvent';
		var FOLDER_FIRST_CLICKED_EVENT = 'folderFirstClickedEvent';
		var FOLDER_STATE_CHANGED_EVENT = 'folderStateChanged';
		var ITEM_MOUSE_OVER_EVENT      = 'itemMouseOverEvent';
		var ITEM_MOUSE_OUT_EVENT       = 'itemMouseOutEvent';
		var ITEM_MOUSE_CLICK_EVENT     = 'itemMouseClickEvent';
		var FILE_ITEM_CLICKED          = 'fileItemClicked';
		var BROWSER_UNLOAD_EVENT	   = 'browserUnloadEvent'; 
		
		var FILE_CONTENT_READY_EVENT   = 'fileContentReady';

		// @strings
		var CANNOT_READ_TEXT_MESSAGE   = 'Cannot retrieve text content from ' +
			                             'this filetype.';
		var IO_ERROR_MESSAGE           = 'An IO Error occured while trying to ' +
				                         'read this text.';
		var TREE_DESCRIPTION_MESSAGE   = 'Select a source file in the tree to ' +
			                             'see its content in the right pane:';
		var COPYRIGHT_MESSAGE          = '� 2007 Copyright Adobe Systems ' +
				                         'Incorporated';



		/**
		 * The DOMProvider instance shared by all application components. It
		 * will get instantiated by WindowsManager.makeMainWindow().
		 * @field
		 * @private
		 */
		var domProvider;
		
		/**
		 * The CSSProvider instance shared by all application components. It
		 * will get instantiated by WindowsManager.makeMainWindow().
		 * @field
		 * @private 
		 */		
		var cssProvider;
		
		/**
		 * The UIBuilder instance shared by all application components. It
		 * will get instantiated by WindowsManager.makeMainWindow().
		 * @field
		 * @private
		 */
		var uiBuilder;
		
		/**
		 * The EventManager instance shared by all application components.
		 * @field
		 * @private 
		 */
		var eventManager = new EventManager();
		
		/**
		 * The WindowsManager instance shared by all application components.
		 * @field
		 * @private
		 */
		var windowManager = new WindowsManager();
		
		/**
		 * The LayoutProvider instance shared by all application components.
		 * @field
		 * @private
		 */
		var layoutProvider = new LayoutProvider();

		/**
		 * The FileSystemWalker instance shared by all application components.
		 * @field
		 * @private
		 */		
		var fileSystemWalker = new FileSystemWalker();
	
		/**
		 * The main method to be called by the client programmer. Opens the 
		 * Source Viewer UI and lists the first level of source files.
		 * @method
		 * @public
		 */	
		this.viewSource = function() {
			eventManager.addListener(WINDOW_CREATED_EVENT, function(event){
				initUI(event.body.window.document);
			})
			windowManager.makeMainWindow (function(oWindow) {});
		}
		
		/**
		 * Holds the configuration object provided bythe client programmer.
		 * @field
		 * @private
		 */
		var oConfig = {};
		
		/**
		 * Also part of the public API. Transmits the settings to the internal
		 * core.
		 * @method
		 * @public
		 * @param cfg { Object }
		 * 		Object literal containing settings for the Source Viewer.
		 * 		Currently only supports:
		 * 		- exclude { Array }
		 * 			An app root relative array of paths. Files or folders
		 * 			starting with one of these paths will not show in the tree. 
		 */
		this.setup = function (cfg) {
			oConfig = cfg;
		}

		/**
		 * Checks whether the given 'file' is to be hidden according to config
		 * regulations.
		 * @method
		 * @private
		 * @param file { File }
		 * 		The file to check.
		 */
		function isFileToBeHidden( file ) {
			var url = Utils.getRelativeURL(file.url);
			var toHide = oConfig.exclude;
			if (toHide) {
				for(var i=0; i<toHide.length; i++) {
					if(toHide[i] == url) { return true }
				}
			}
			return null;
		}

		/**
		 * Initializes the application UI.
		 * @method
		 * @private
		 * @param oDocument { HTML Document Object }
		 * 		The document object to be used by classes responsible with UI
		 * 		creation.
		 */
		function initUI (oDocument) {
			cssProvider = new CSSProvider(oDocument);
			domProvider = new DOMProvider(oDocument);
			uiBuilder = new UIBuilder(domProvider);
			var UI = uiBuilder.createMainLayout();
			eventManager.addListener(BROWSER_UNLOAD_EVENT, function(event) {
				unloadAll();
			})
			populateTree(UI.tree);
		}
		
		/**
		 * Fills the tree with the first level of files.
		 * @method
		 * @private
		 * @param treeRoot { HTML Element }
		 * 		An HTML Element representing the root of the tree.
		 */
		function populateTree (treeRoot) {
			eventManager.addListener(FILES_LIST_READY_EVENT, function(event){
				uiBuilder.displayFilesList(treeRoot, event.body.filesList);
				cssProvider.updateCSS();
				// @this is a one-time callback:
				eventManager.removeListener(FILES_LIST_READY_EVENT,
					arguments.callee);
			});
			fileSystemWalker.makeInitialQuery();
		}

		/**
		 * Frees memory after the Source Viewer is closed.
		 * @method
		 * @private 
		 */
		function unloadAll() {
			context.instance = null;
		}

		/**
		 * CLASS
		 * 		WindowsManager
		 * DESCRIPTION
		 * 		Handles window creation and manipulation for this application.
		 * SAMPLE USAGE
		 * 		N/A (internal use only)
		 * @class
		 * @private
		 */
		 function WindowsManager () {
			
			/**
			 * Flag to raise while the main window is open.
			 * @field
			 * @private
			 */
			var isMainWindowOpen = false;
			
			/**
			 * Returns the default display options for a newly created window.
			 * @method
			 * @private
			 * @return { NativeWindowInitOptions }
			 * 		An object specifying display options for a new window. 
			 */
			function getDefWindowOptions () {
				var options = new NativeWindowInitOptions();
				options.type = NativeWindowType.UTILITY;
				return options;
			}

			/**
			 * Returns the default display boundaries for a newly created 
			 * window.
			 * @method
			 * @private
			 * @return { Rectangle }
			 * 		A rectangle defining the boundaries of this new window.
			 */			
			function getDefBoundaries () {
				var bounds = new Rectangle();
				bounds.x = Math.max(0, (screen.width-800)/2);
				bounds.y = Math.max(0, (screen.height-600)/2);
				bounds.width = 800;
				bounds.height = 600;
				return bounds;
			}
			
			/**
			 * Creates the main window of the application.
			 * @method
			 * @public
			 */
			this.makeMainWindow = function () {
				var htmlLoader = HTMLLoader.createRootWindow (
					true,
					getDefWindowOptions(), 
					false,
					getDefBoundaries()
				);
				htmlLoader.addEventListener('htmlDOMInitialize', function() {
					isMainWindowOpen = true;
					makeWindowModal (htmlLoader.window, self);
					htmlLoader.window.nativeWindow.addEventListener (
						'close',
						 function() {isMainWindowOpen = false}
					);
					var event = eventManager.createEvent(
						WINDOW_CREATED_EVENT,
						{'window': htmlLoader.window}
					);
					eventManager.fireEvent(event);
				});
				htmlLoader.loadString('&nbsp;');
			}
			
			/**
			 * Makes a window modal to a certain parent window.
			 * @method
			 * @private
			 * @param oWindow { Object Window }
			 * 		The window to be made modal.
			 * @param oParentWindow { Object Window }
			 * 		The parent of the modal window. Any attempt to access the 
			 * 		parent while the modal window is open will fail.
			 */
			function makeWindowModal (oWindow, oParentWindow) {
				
				oParentWindow.nativeWindow.addEventListener (
					'closing',
					function (event) {
						//if (isMainWindowOpen) { event.preventDefault() };
					}
				);
				oParentWindow.nativeWindow.addEventListener (
					'displayStateChanging', 
					function (event) {
						//if (isMainWindowOpen) { event.preventDefault() };
					}
				);
				oParentWindow.nativeWindow.addEventListener (
					'moving',
					function (event) {
						//if (isMainWindowOpen) { event.preventDefault() };
					}
				);
				oParentWindow.nativeWindow.addEventListener (
					'resizing', 
					function(event) {
						//if(isMainWindowOpen) { event.preventDefault() };
					}
				);
				oWindow.nativeWindow.addEventListener(
					'deactivate',
					function() {
						//oWindow.nativeWindow.activate();
					}
				);
				oWindow.nativeWindow.addEventListener(
					'closing',
					function(){
						var ev = eventManager.createEvent(BROWSER_UNLOAD_EVENT);
						eventManager.fireEvent(ev);
					}
				);
				 
			}
		}



		/**
		 * CLASS
		 * 		UIBuilder
		 * DESCRIPTION
		 * 		Private class that handles the application's layout creation.
		 * SAMPLE USAGE
		 * 		N/A (internal use only)
		 * @class
		 * @private
		 * @param oDomProvider { DOMProvider }
		 * 		An instance of the DOMProvider class. Required, in order to be 
		 * 		able to build the layout blocks.
		 */
		function UIBuilder (oDomProvider) {
			
			/**
			 * Custom initialization for the class UIBuilder.
			 * @method
			 * @private
			 */
			function init() {
				eventManager.addListener(FOLDER_STATE_CHANGED_EVENT, 
					function (event) {
						uiBuilder.toggleItemContent(event.body.folder);
					}
				)
				eventManager.addListener(FILE_CONTENT_READY_EVENT, 
					function (event) {
						var content = event.body.content;
						var oDocument = event.body.document;
						uiBuilder.showFilecontent(content, oDocument);
					}
				)
			}
			
			/**
			 * Displays the content of the selected file item inside the source
			 * area element.
			 * @method
			 * @public
			 * @param content { String }
			 * 		The content to be displayed.
			 * @param oDocument { HTML Document Object }
			 * 		The document object to display the content in.
			 */
			this.showFilecontent = function(content, oDocument) {
				var el = oDocument.getElementById('sourceCodeArea');
				dProvider.destroyText(el);
				dProvider.makeText(content, el, 'sourceCodeText');
				var noContentText = oDocument.getElementById('srcAreaBgText');
				CSSProvider.setStyle(noContentText, 'visibility', 'hidden');
				var ruler = oDocument.getElementById('lineNoRuler');
				uiBuilder.initRuler (ruler, content);
				cssProvider.updateCSS();
				CSSProvider.setStyle(ruler, 'visibility', 'visible');
				CSSProvider.setStyle(el, 'visibility', 'visible');
				el.scrollTop = 0;
				ruler.scrollTop = 0;
			}
			
			/**
			 * The DOM provider instance used for building UI elements.
			 * @field
			 * @private
			 */
			var dProvider = oDomProvider;

			/**
			 * Creates an item in the files list on the left.
			 * @method
			 * @public
			 * @param parentEl { HTML Element }
			 * 		The HTML element to build the new item in. Both 'ul' or 'li'
			 * 		elements can be specified here.
			 * @param text { String }
			 * 		The text to display inside the newly created item (i.e, file
			 * 		name).
			 * @param className { String }
			 * 		The css class to apply to the newly created element.
			 * @return { HTML Element }
			 * 		The 'li' element created
			 */
			this.makeItem = function(parentEl, text, className) {
				var item = makeTreeItem(parentEl, text, className);
				return item;
			}
			
			/**
			 * Transparently creates a generic tree item, regardless of the 
			 * actual HTML Element given as parent.
			 * @method
			 * @private
			 * @param parentEl { HTML Element }
			 * 		The HTML element to build the new item in. Both 'ul' or 'li'
			 * 		elements can be specified here.
			 * @param text { String }
			 * 		The text to display inside the newly created item (i.e, file
			 * 		name).
			 * @param className { String }
			 * 		The css class to apply to the newly created element.
			 */
			function makeTreeItem (parentEl, text, className) {
				var isUL = 
					parentEl.nodeName &&
					parentEl.nodeName.toLowerCase() == 'ul';
				var isLI = 
					parentEl.nodeName &&
					parentEl.nodeName.toLowerCase() == 'li';
				var clsName = className? className : 'item';
				var item;
				if(isUL) {item = dProvider.makeElement('li', parentEl, clsName)} 
				else if(isLI) {
					var wrapper = 
						parentEl.getElementsByTagName('ul')[0] || 
						dProvider.makeElement('ul', parentEl);
					item = dProvider.makeElement('li', wrapper, clsName);
				}
				var textClsName = className? className+'Text' : 'itemText';
				var txt = dProvider.makeText(text, item, textClsName);
				txt.addEventListener('mouseover', function (event){
					var evt = eventManager.createEvent (
						ITEM_MOUSE_OVER_EVENT,
						{ htmlElement: event.target }
					);
					eventManager.fireEvent(evt);
				}, false);
				txt.addEventListener('mouseout', function (event){
					var evt = eventManager.createEvent (
						ITEM_MOUSE_OUT_EVENT,
						{ htmlElement: event.target }
					);
					eventManager.fireEvent(evt);
				}, false);
				txt.addEventListener('click', function( event ) {
					var evt = eventManager.createEvent (
						ITEM_MOUSE_CLICK_EVENT,
						{ htmlElement: event.target }
					);
					eventManager.fireEvent(evt);
				}, false);
				return item;
			}

			/**
			 * Displays all given files as sibling items in the tree.
			 * @method
			 * @public
			 * @param parentEl { HTML Element }
			 * 		The HTML element to build the list in. This can be either a
			 * 		'li' node or the root, 'ul' node.
			 * 		Note:
			 * 		Any required wrapping is done transparently.
			 * @param files { Array }
			 * 		An array containing File objects that are to be
			 * 		listed.
			 */
			this.displayFilesList = function(parentEl, files) {
				this.removeProgressIndicator(parentEl);
				for(var i=0; i<files.length; i++) {
					var file = files[i];
					var className = 'leaf';
					var name = Utils.getNameFromURL(file.url);
					if(file.isDirectory) {
						name = '[' +name+ ']';
						className = 'branch';
					}
					var item = this.makeItem(parentEl, name, className);
					var event = eventManager.createEvent(FILE_LISTED_EVENT,
						{'file': file, 'item': item});
					eventManager.fireEvent(event);
				}
			}
			
			/**
			 * Adds visual clues that the given item has children i.e., a 
			 * different CSS style, a progress indicator.
			 * @method
			 * @private
			 * @param item { HTML Element }
			 * 		The element that is to be marked as non empty. 
			 */
			this.markItemAsNonEmpty = function(item) {
				cssProvider.unregisterCssClass('branch', item);
				cssProvider.registerCssClass('nonEmptyBranch', item);
				var textEl = item.getElementsByTagName('span')[0];
				cssProvider.unregisterCssClass('branchText', textEl);
				cssProvider.registerCssClass('nonEmptyBranchText', textEl);
				this.addProgressIndicator(item);
				this.toggleItemContent(item);
				cssProvider.updateCSS();
				this.setupAsClickableFolderItem(textEl);
			}
			
			/**
			 * Sets the given item as a clickable folder, i.e., clicking on it
			 * will fetch its children, and will collapse/expand it afterwards.
			 * @method
			 * @public
			 * @param item { HTML Element }
			 * 		The element that is to be setup as a clickable folder.
			 */
			this.setupAsClickableFolderItem = function(item) {
				var cb = function(DOMEvent) {
					var el = DOMEvent.target;
					var notYetExpanded = hasProgressIndicator(el.parentNode);
					if(notYetExpanded) {
						var event = eventManager.createEvent(
							FOLDER_FIRST_CLICKED_EVENT, 
							{'folder': el.parentNode}
						);
						eventManager.fireEvent(event);
					} else {
						var event = eventManager.createEvent(
							FOLDER_STATE_CHANGED_EVENT, {'folder': 
							el.parentNode});
						eventManager.fireEvent(event);
					}
				}
				item.onclick = cb;
			}

			/**
			 * Sets the given file as clickable, i.e., clicking on it will 
			 * display its content in the right pane.
			 * @method
			 * @private
			 * @param item { HTML Element }
			 * 		The element that is to be setup as a clickable file.
			 * @param file { File }
			 * 		The file object associated to the item to setup.
			 */
			this.setupAsClickableFileItem = function(item, file) {
				item.addEventListener('click', function(){
					var event = eventManager.createEvent(FILE_ITEM_CLICKED, {
						'item': item, 'file': file });
					eventManager.fireEvent(event);
				});
			}

			/**
			 * Sets up visual feedback in response to user interacting with the
			 * tree items (i.e., mouse-hovering an item, etc).
			 * @method
			 * @private
			 * @see CSSProvider.dynamicCSS
			 */
			function hookItemsVisualFeedback() {
				var current = arguments.callee;
				var dynCss = CSSProvider.dynamicCSS;
				// @visual effect for mouse over on tree items.
				var hoverCb = function(event) {
					var el = event.body.htmlElement;
					if (current.lastClicked &&
						current.lastClicked === el) {
						return;
					}
					cssProvider.unregisterCssClass ('itemOut',  el);
					cssProvider.registerCssClass ('itemOver', el);
					cssProvider.applyCSS (dynCss);
				};
				eventManager.addListener(ITEM_MOUSE_OVER_EVENT, hoverCb);
				// @visual effect for mouse out on tree items.
				var outCb = function(event) {
					var el = event.body.htmlElement;
					if (current.lastClicked &&
						current.lastClicked === el) {
						return;
					}
					cssProvider.unregisterCssClass ('itemOver', el);
					cssProvider.registerCssClass ('itemOut',  el);
					cssProvider.applyCSS (dynCss);
				};
				eventManager.addListener (ITEM_MOUSE_OUT_EVENT, outCb);
				// @visual effect for mouse click on tree items.
				var clickCb = function(event) {
					var el = event.body.htmlElement;
					var old = current.lastClicked; 
					if (old) {
						cssProvider.unregisterCssClass ('itemClick', old);
						cssProvider.registerCssClass ('itemOut',   old);
					}
					cssProvider.unregisterCssClass ('itemOut',   el);
					cssProvider.unregisterCssClass ('itemOver',  el);
					cssProvider.registerCssClass ('itemClick', el);
					current.lastClicked = el;
					cssProvider.applyCSS (dynCss);
				};
				eventManager.addListener(ITEM_MOUSE_CLICK_EVENT, clickCb);
			}
			
			/**
			 * Alternatively collapses or expands the children of a tree item.
			 * @method
			 * @public
			 * @param { HTML Element }
			 * 		The item to be collapsed or expanded (based on its current 
			 * 		state).
			 */
			this.toggleItemContent = function(item) {
				var wrapper = item.getElementsByTagName('ul')[0];
				if (wrapper) {
					var visible = wrapper.style.display == 'none'? false: true;
					CSSProvider.setStyle ( wrapper, 'display',
						visible? 'none' : 'block'
					);
				}
			}
			
			/**
			 * Adds a special, temporary child to the given item, indicating 
			 * that its actual children are being loaded in background.
			 * @method
			 * @public
			 * @param item { HTML Element }
			 * 		The element to signalize background loading for.
			 */
			this.addProgressIndicator = function(item) {
				if (!hasProgressIndicator(item)) {
					makeTreeItem (item, 'loading...', 'progress');
				}
			}
			
			/**
			 * Removes the 'progress indicator' from the given item, should it 
			 * have one. 
			 * @method
			 * @public
			 * @param item { HTML Element }
			 * 		The element to remove the progress indicator from.
			 */
			this.removeProgressIndicator = function(item) {
				var children = item.getElementsByTagName('span');
				for(var i=0; i<children.length; i++) {
					var child = children[i];
					var value = child.innerHTML;  
					if (value == 'loading...') {
						var itemToRemove = child.parentNode;
						var _parent = itemToRemove.parentNode;
						_parent.removeChild(itemToRemove);
						return;
					}
				}
			}
			
			/**
			 * Checks whether a given item currently presents a 'progress 
			 * indicator' instead of its actual content.
			 * @method
			 * @private
			 * @param item { HTML Element }
			 * 		The element to be checked.
			 * @return { Boolean }
			 * 		True if the element has a 'progress indicator' in place, 
			 * 		false otherwise.
			 */
			function hasProgressIndicator (item) {
				var firstWrapper = item.getElementsByTagName('ul')[0];
				if(firstWrapper) {
					var firstTextEl = firstWrapper.
						getElementsByTagName('span')[0];
					if (firstTextEl) {
						var value = firstTextEl.innerHTML;
						if (value == 'loading...') {return true};
					}
				}
				return false;
			}
						
			/**
			 * Creates the header of the application UI.
			 * @method
			 * @private
			 * @param parentEl { HTML Element }
			 * 		The HTML Element to build in.
			 * @return { HTML Element }
			 * 		The HTML Element holding the UI header.
			 */
			function createHeader (parentEl) {
				var header = dProvider.makeDiv( parentEl, 'rcHeader' );
				layoutProvider.setupBox(header, {h: 3})
				layoutProvider.setupStretched(header, { bottom: -1 })
				dProvider.makeText('AIR', header, 'airToken');
				dProvider.makeText('HTML View Source Framework', header,
					'sbrToken');
				dProvider.makeText('1.2a', header, 'vToken');
				return header;
			}
			
			/**
			 * Creates the left side of the application UI -- the side bar that
			 * contains the tree list showing files and folders.
			 * @method
			 * @private
			 * @param parentEl { HTML Element }
			 * 		The HTML Element to build in.
			 * @return { HTML Element }
			 * 		The HTML Element holding the UI sidebar.
			 */
			function createSideBar (parentEl) {
				var left = dProvider.makeDiv( parentEl, 'rcTree' );
				layoutProvider.setupBox(left, {w: 13.85});
				layoutProvider.setupStretched(left, {top: 3.2, bottom: 2, right: -1});
				dProvider.makeText(TREE_DESCRIPTION_MESSAGE, left,
					'listDescr');
				var lstBackground = dProvider.makeDiv(left, 'listBackground');
				layoutProvider.setupBox(lstBackground);
				layoutProvider.setupStretched(lstBackground, {top:3, right:0.5, bottom:1, 
					left:0.5});
				return left;
			}
			
			/**
			 * Creates the tree list that displays source files.
			 * @method
			 * @private
			 * @param parentEl { HTML Element }
			 * 		The HTML element to build the tree in.
			 * @return { HTML Element }
			 * 		The HTML Element holding the UI tree's root.
			 */
			function createTree (parentEl) {
				var root = dProvider.makeElement('ul', parentEl, 'tree');
				layoutProvider.setupBox(root);
				layoutProvider.setupStretched(root, {top:2.5, right:1, 
					bottom:0.5, left: 1});
				CSSProvider.setStyle(root, 'overflow', 'auto');
				return root;
			}
			
			/**
			 * Creates the right side of the application UI -- the area that 
			 * displays selected file's content.
			 * @method
			 * @private
			 * @param parentEl { HTML Element }
			 * 		The HTML Element to build in.
			 * @return { HTML Element}
			 * 		The HTML Element holding the UI content area.
			 */
			function createContentArea (parentEl) {
				var right = dProvider.makeDiv( parentEl, 'rcContent' );
				layoutProvider.setupBox(right);
				layoutProvider.setupStretched(right, {top: 3.2, left: 14, bottom: 2});
				var txt = dProvider.makeText('no content to display', right, 
					'noContent');
				layoutProvider.setupBox(txt, {w:10, h:1});
				layoutProvider.setupCentered(txt);
				txt.setAttribute('id', 'srcAreaBgText');
				return right; 
			}
			
			/**
			 * Creates the ruler showing line numbering for displayed file's 
			 * content.
			 * @method
			 * @private
 			 * @param parentEl { HTML Element }
			 * 		The HTML Element to build in.
			 * @return { HTML Element }
			 * 		The HTML Element holding the UI ruler
			 */
			function createRuler(parentEl) {
				var lnNumb = dProvider.makeDiv(parentEl, 'ruler');
				layoutProvider.setupBox (lnNumb, {w:2.5});
				layoutProvider.setupStretched (lnNumb, {left:0.5, top:0.5, 
					right:-1, bottom:0.8 });
				lnNumb.setAttribute('id', 'lineNoRuler');
				return lnNumb;
			}
			
			/**
			 * Creates the UI element that will display the selected source 
			 * file's source code.
			 * @method
			 * @private
 			 * @param parentEl { HTML Element }
			 * 		The HTML Element to build in.
			 * @return { HTML Element }
			 * 		The HTML Element holding the UI source area.
			 */
			function createSourceArea(parentEl) {
				var srcArea = dProvider.makeDiv(parentEl, 'srcCodeArea');
				layoutProvider.setupBox (srcArea);
				layoutProvider.setupStretched (srcArea, {left:3.1, top:0.5, 
					right:0.35, bottom:0.8, });
				srcArea.setAttribute('id', 'sourceCodeArea');
				return srcArea;
			}
			
			/**
			 * Creates the footer of the application UI.
			 * @method
			 * @private
			 * @param parentEl { HTML Element }
			 * 		The HTML Element to build in.
			 * @return { HTML Element }
			 * 		The HTML Element holding the UI footer area.
			 */
			function createFooter (parentEl) {
				var footer = dProvider.makeDiv( parentEl, 'rcFooter' );
				layoutProvider.setupBox(footer, {h: 2});
				layoutProvider.setupStretched(footer, {top: -1});
				dProvider.makeText(COPYRIGHT_MESSAGE, footer, 
					'copyrightText');
				return footer;
			}
			
			/**
			 * Creates the application user interface.
			 * @method
			 * @public
			 * @param parentEl { HTML Element }
			 * 		The HTML Element to build in.
			 * @return { Object }
			 * 		A hash with all UI elements created.
			 */
			this.createMainLayout = function(parentEl) {
				var header = createHeader(parentEl);
				var sidebar = createSideBar(parentEl);
				var tree = createTree(sidebar);
				this.addProgressIndicator (tree);
				var contentArea = createContentArea(parentEl);
				var ruler = createRuler(contentArea);
				var sourceArea = createSourceArea(contentArea);
				linkScrollable(ruler, sourceArea);
				var footer = createFooter(parentEl);
				cssProvider.updateCSS();
				hookItemsVisualFeedback();
				return {
					'header'		:	header,
					'sidebar'		:	sidebar,
					'tree'			:	tree,
					'contentArea'	:	contentArea,
					'ruler'			:	ruler,
					'sourceArea'	:	sourceArea,
					'footer'		:	footer
				};
			}
			
			/**
			 * Initiates the linked ruler that shows line numbers for the file 
			 * content being displayed.
			 * @method
			 * @public
			 * @param parentEl { HTML Element }
			 * 		The HTML Element to build in.
			 * @assocText { String }
			 * 		A formatted string to show line numbers for. The ruler will 
			 * 		add a new number for each occurence of the new line 
			 * 		character in this string.
			 */
			this.initRuler = function(parentEl, assocText) {
				var count = 0;
				var index = 0
				domProvider.destroyText(parentEl);
				do {
					var searchIndex = assocText.indexOf("\n", index);
					count++;
					dProvider.makeText(count, parentEl, 'lineMark');
					index = searchIndex + 1;
					if (searchIndex == -1) { 
						var t = dProvider.makeText("---", parentEl, 'lineMark');
						CSSProvider.setStyle(t, 'visibility', 'hidden');
						break;
					};
				} while (true);
			}
			
			/**
			 * Links two elements, so that they scroll together.
			 * @method
			 * @private
			 * @param scrollable { HTML Element }
			 * 		The target element to be linked.
			 * @param related { HTML Element }
			 * 		The source element to link with.
			 * @param proxy { Function }
			 * 		An optional function that specifies how the scroll value of 
			 * 		the 'related' element applies to the 'scrollable' element. 
			 * 		Default is to just pass the 'scrollTop' value from 'related' 
			 * 		to 'scrollable'.
			 */
			function linkScrollable (scrollable, related, proxy) {
				// @private function; scrolls a given element.
				var scrollElement = function(element, offset) {
					element.scrollTop = offset;	
				}
				related.addEventListener('scroll',  function() {
					scrollElement (scrollable, 
						Utils.isFunction(proxy)? proxy.call(this, related.scrollTop):
						related.scrollTop
					); 
				}, false );
			}
			
			// @perform custom initialization of this class.
			init();
		}



		/**
		* CLASS
		* 	FileSystemWalker
		* DESCRIPTION
		* 	Private class that encapsulates functionality related to file
		* 	system traversal (i.e., recursively iterating through a folder's
		* 	children).
		* SAMPLE USAGE
		* 	N/A (internal use only)
		* @class
		* @private
		*/
		function FileSystemWalker() {

			/**
			 * Keeps a record of all listed files.
			 * @field
			 * @private
			 */
			var listedFiles = {};
			
			/**
			 * Custom initialization for the FileSystemWalker class.
			 * @method
			 * @private
			 */
			function init() {
				eventManager.addListener(FOLDER_FIRST_CLICKED_EVENT,
					function(event) {
						var folderItem = event.body.folder;
						var file = getRegisteredFileByItem(folderItem);
						// @nested listener
						eventManager.addListener(FILES_LIST_READY_EVENT, 
							function(evt) {
								uiBuilder.displayFilesList(folderItem, 
									evt.body.filesList);
								cssProvider.updateCSS();
								// @this is a one-time callback:
								eventManager.removeListener(
									FILES_LIST_READY_EVENT, arguments.callee);
							}
						)
						queryChildren(file);
					}
				);
				eventManager.addListener(FOLDER_CHECKED_EVENT, function(event){
					var file = event.body.folder;
					var item = getRegisteredFile(file.url).item;
					var hasChildren = event.body.result;
					if(hasChildren) {
						uiBuilder.markItemAsNonEmpty(item);
					}
				});
				eventManager.addListener(FILE_LISTED_EVENT, function(event){
					var file = event.body.file;
					var item = event.body.item;
					registerListedFile (file, item);
					if (file.isDirectory) {
						queryIfHasChildren(file);
					} else {
						uiBuilder.setupAsClickableFileItem(item, file);
					}
				});
				eventManager.addListener(FILE_ITEM_CLICKED, function(event){
					var file = event.body.file;
					var oDocument = event.body.item.ownerDocument;
					queryFileContent(file, oDocument);
				})
			}

			/**
			 * Checks whether the given 'file' object has already been listed.
			 * @method
			 * @private
			 * @param file { File }
			 * 		A file object to look up.
			 * @return { Boolean }
			 * 		True is the file was already listed, false otherwise. 
			 */
			function isFileAlreadyListed (file) {
				return listedFiles[file.url]? true: false;
			}

			/**
			 * Retrieves a file previously registered as 'already listed'.
		 	 * @method
			 * @private
			 * @param url { String }
			 * 		The url of the file to retrieve.
			 * @return { Object }
			 * 		A hash with two keys, 'file': the registered file, and 
			 * 		'item': its associated item. Returns undefined if the file
			 * 		cannot be found. 
			 */
			function getRegisteredFile (url) {
				return listedFiles[url];
			}
			
			/**
			 * Performs a reverse lookup through the registry, possibly finding
			 * the file associated with the given item.
			 * @method
			 * @private
			 * @param item { HTML Element }
			 * 		The item associated with the file object to search for.
			 * @return { File }
			 * 		The associated file object, or null if it cannot be found.
			 */
			function getRegisteredFileByItem (item) {
				for (var url in listedFiles) {
					var entry = listedFiles[url];
					if(entry.item == item) {
						return entry.file;
					}
				}
				return null;
			}

			/**
			 * Registers a file as 'already listed'.
			 * @method
			 * @private
			 * @param file { File }
			 * 		A file object to register.
			 * @param item { HTML Element }
			 * 		The HTML element that has been created in order to list the 
			 * 		file.
			 */  
			function registerListedFile (file, item) {
				var item = item? item: null;
				listedFiles[file.url] = {'file':file, 'item': item};
			};

			/**
			 * Retrieves direct children of the application directory folder.
			 * All subsequent retrieval is made on demand.
			 * @method
			 * @public
			 */
			this.makeInitialQuery = function() {
				var appDir = File.applicationDirectory.resolvePath("SourceViewer");
				queryChildren (appDir);
			}

			/**
			 * Lists the children of the given parent file, provided it is a 
			 * directory.
			 * @method
			 * @private
			 * @param parentFile { File }
			 * 		The directory file to list.
			 */
			function queryChildren (parentFile) {
				if (!parentFile.isDirectory) {return};
				parentFile.addEventListener( 'directoryListing', function(e){
					var files = [];
					for (var i=0; i<e.files.length; i++) {
						var file = e.files[i];
						if(isFileToBeHidden(file)) {continue};
						files.push(file);
					};
					files.sort (function(a, b) {return b.isDirectory?-1:
						!a.isDirectory? 1: 0;
					});
					var evt = eventManager.createEvent (
						FILES_LIST_READY_EVENT, {'filesList': files});
					eventManager.fireEvent(evt);
				}, false);
				parentFile.getDirectoryListingAsync();
			}
			
			/**
			 * Checks whether the given file object has children, i.e., it is a
			 * directory containing other files.
			 * @method
			 * @private
			 * @param file { File }
			 * 		The file object to check.
			 */
			function queryIfHasChildren (file) {
				file.addEventListener('directoryListing', function( event ) {
					var result = event.files.length? true: false;
					var evt = eventManager.createEvent (
						FOLDER_CHECKED_EVENT,
						{folder: file, 'result': result}
					);
					eventManager.fireEvent(evt);
				});
				file.getDirectoryListingAsync();
			}
			
			/**
			 * Possibly obtains the text content of the given file object.
			 * @method
			 * @private
			 * @param file { File }
			 * 		The file object to retrieve text content from.
			 * @param oDocument { HTML Document Object}
			 * 		The associated document object to display retrieved content
			 * 		in.
			 */
			function queryFileContent(file, oDocument) {
				if(!file) {return};
				if(!file.exists) {return};
				if(file.isDirectory) {return};
				if(!isLegalFile(file)) {
					uiBuilder.showFilecontent(CANNOT_READ_TEXT_MESSAGE, 
						oDocument);
					return;
				}
				var fileStream = new FileStream();
				fileStream.addEventListener('complete', function() {
					var fileCnt = fileStream.readUTFBytes (
						fileStream.bytesAvailable);
					fileStream.close();
					var event = eventManager.createEvent(
						FILE_CONTENT_READY_EVENT,
						{'content': fileCnt, 'document': oDocument}
					);
					eventManager.fireEvent(event);
				}, false);
				fileStream.addEventListener('ioError', function(event) {
					var msg = IO_ERROR_MESSAGE+'\n'+
						event.errorID+'\n'+
						event.text;
						fileStream.close();
					uiBuilder.showFilecontent(msg, oDocument);
				}, false);
				fileStream.openAsync(file, 'read');
			}
			
			/**
			 * Checks whether the given file is of a legal type. We do not want
			 * to retrieve text for binary files, for instance.
			 * @method
			 * @private
			 * @param file { File }
			 * 		The file object to check.
			 * @return { Boolean }
			 * 		Returns true if the file extension is in the 
			 * 		VALID_EXTENSIONS list, false otherwise.
			 */
			function isLegalFile(file) {
				var fileName = Utils.getNameFromURL(file.url);
				var match = fileName.match(/\.([^\.]*)$/);
				var extension = (match? match[1] : fileName).toLowerCase();
				for(var i=0; i<VALID_EXTENSIONS.length; i++) {
					if (VALID_EXTENSIONS[i] == extension) {
						return true;
					}
				}
				return false;
			}
			
			// @perform custom initialization of this class.
			init();
		}


		/**
		* CLASS
		* 	Utils
		* DESCRIPTION
		* 	Private class; holds only static members that aid in dealing 
		*    with file paths & URLs.
		* SAMPLE USAGE
		* 	N/A (internal use only)
		* @class
		* @private
		*/
		var Utils = {
			/**
			 * Retrieves the last segment from a file url.
			 * @method
			 * @public
			 * @static
			 * @param url { String }
			 * 		A file URL to retrieve a file name from.
			 * 
			 * @return { String }
			 * 		The file name, or null if the url is malformed.
			 */ 
			getNameFromURL: function (url) {
				var match = url.match(/[^\/]*$/);
				return match? match[0]: null;
			},
			
			/**
			 * Removes spaces from beginning and end of a string.
			 * @method
			 * @public
			 * @static
			 * @param str { String }
			 * 		The string to trim.
			 * @return { String }
			 * 		The given string, with all the leading and trailing spaces 
			 * 		removed.
			 */
			trim: function (str) {
				var str = String(str);
				var isNotEmpty = (str && str.length && /[^\s]/.test(str));
				if(isNotEmpty) {
					return ret = str.replace(/\s*$/, '').replace(/^\s*/, '');
				}
				return '';
			},
			
			/**
			 * Tests whether the given argument is a function.
			 * @method
			 * @public
			 * @static
			 * @param arg { * }
			 * 		The argument that is to be checked for being a function.
			 * @return { Boolean }
			 * 		True, if the given argument is a function, false otherwise.
			 */
			 isFunction : function (arg) {
			 	return arg instanceof Function;
			 },
			 
			/**
			 * Translates an absolute file URL into an application root relative
			 * one.
			 * @method
			 * @public
			 * @static
			 * @param absUrl { String }
			 * 		The absolute file URL to translate.
			 * @return { String }
			 * 		The translated file url. Will allways have a leading slash,
			 * 		never a trailing one: "/my/relative/url"
			 */ 
			getRelativeURL: function (absURL) {
				var appDir = File.applicationDirectory;
				var appDirURL = Utils.translateToURL (appDir.nativePath);
				var relURL = absURL.replace (appDirURL, '');
				relURL = relURL.replace(/\/{2,}/g, '/');
				if (relURL[0] != '/') {relURL = '/' + relURL};
				if (relURL[relURL.length-1] == '/') {
					relURL.substr(0, relURL.length-2);
				}
				return relURL;
			},
			
			/**
			 * Translates a native path into a file URL.
			 * @method
			 * @public
			 * @static
			 * @param nativePath { String }
			 * 		The native path to translate.
			 * @return { String }
			 * 		A file URL, translated from the given native path.
			 */ 
			translateToURL: function (nativePath) {
				nativePath = nativePath.replace(/\\/g, '/');
				nativePath = encodeURI(nativePath);
				var url = 'file:///' + nativePath;
				return url;
			}
		}


		/**
		* CLASS
		* 	EventManager
		* DESCRIPTION
		* 	Private class that provides abstract event management functionality.
		* SAMPLE USAGE
		* 	N/A (internal use only)
		* @class
		* @private
		*/		
		function EventManager() {
			
			/**
			 * Holds all the registered event listeners.
			 * @field
			 * @private
			 */
			var listeners = {};
			
			/**
			 * Registers an event listener.
			 * @method
			 * @public
			 * @param type { String }
			 * 		The type of events this listener is interested in.
			 * @param callback { Function }
			 * 		The callback to activate when a listener of this type will 
			 * 		be notified.
			 */
			this.addListener = function(type, callback) {
				var list = listeners[type] || (listeners[type] = []);
				list.push (callback);
			}

			/**
			 * Unregisters an event listener.
			 * @method
			 * @public
			 * @param type { String }
			 * 		The type of the listener(s) to remove.
			 * @param callback { Function }
			 * 		The callback registered with the listener(s) to remove.
			 */
			this.removeListener = function(type, callback) {
				var list = listeners[type];
				for(var i=0; i<list.length; i++) {
					var cb = list[i];
					if(cb === callback) {
						list[i] = null;
						break;
					}
				}
				list.sort(function(a,b){return a === null? 1:0});
				while (list[Math.min(0, list.length-1)] === null) {
					list.length -= 1;	
				}
			}
			
			/**
			 * Unregisters all event listeners of a specific type.
			 * @method
			 * @public
			 * @param type { String }
			 * 		The type of the listeners to be removed.
			 */
			this.removeListenersFor = function(type) {
				listeners[type] = null;
				delete listeners[type];
			}
			
			/**
			 * Notifies all event listeners of a specific type.
			 * @method
			 * @public
			 * @param event { EventManager.Event }
			 * 		The event object being passed to the callback.
			 */
			this.fireEvent = function (event) {
				var type = event.type;
				if(!listeners[type]) {return};
				for (var i=0; i<listeners[type].length; i++) {
					var callback = listeners[type][i];
					callback(event);
				}
			}
			
			/**
			 * Returns an instance of the Event class to the caller.
			 * @method
			 * @public
			 * @param type { String }
			 * 		The type of this event.
			 * @param body { Object }
			 * 		An object literal that holds the information this event
			 * 		transports. Both notifier and callback must have agreed upon
			 * 		this object literal structure.
			 * @param id { String }
			 * 		An optional unique id for this event, should it need be 
			 * 		recognized at some later time.
			 * @return { EventManager.Event }
			 * 		An event object having the specified type, body and id.
			 */
			this.createEvent = function(type, body, id) {
				return new Event(type, body, id);
			}

			
			
			
			/**
			 * CLASS
			 * 		Event
			 * DESCRIPTION
			 * 		Private class that provides a vehicle for transporting 
			 * 		information from the notifier to the callback.
			 * SAMPLE USAGE
			 * 		N/A (internal use only)
			 * @class
			 * @private
			 * @param type { String }
			 * 		The type of this event.
			 * @param body { Object }
			 * 		An object literal that holds the information this event
			 * 		transports. Both notifier and must have agreed upon
			 * 		this object literal structure.
			 * @param id { String }
			 * 		An optional unique id for this event, should it need be 
			 * 		recognized at some later time.
			 */
			function Event(type, body, id) {
				this.type = type;
				this.body = body? body: {};
				this.id = id? id : 'anonymous';
				this.toString = function() {
					var ret = '['+this.id+']: '+this.type+' event; ';
					for(var prop in this.body) {
						ret += '\n'+prop+': '+(
							this.body[prop] instanceof Function? 'function':
							this.body[prop]? this.body[prop].toString():
							this.body[prop] === null? 'null value':
							'undefined value');
					}
					return ret;
				}
			}
		}



		/**
		* CLASS
		* 	LayoutProvider
		* DESCRIPTION
		* 	Private class that provides layout building blocks for the
		* 	application UI.
		* SAMPLE USAGE
		* 	N/A (internal use only)
		* @class
		* @private
		*/
		function LayoutProvider () {

			/**
			* Turns a certain HTML element into a CSS box.
			* @method
			* @public
			* @param target { HTML Element }
			* 		The HTML element that is to be set up as a CSS box. This 
			* 		implies both out-of-page-flow(1) positioning and fixed 
			* 		dimensions(2).
			* @param oPoint { Object }
			* 		An object literal that specifies the box's boundaries. Use:
			* 		- x: The horizontal position of top left corner.
			* 		- y: The vertical position of top left corner.
			* 		- w: The width of the box.
			* 		- h: The height of the box.
			* 		All are optional. Not defining one of the above members will
			* 		unset the corresponding CSS property.
			* 		Note:
			* 		(1) Out-of-page-flow positioning translates to 'fixed' if 
			*          the target element is a direct child of the body 
			*          element; it translates to 'absolute' otherwise.
			* 		(2) All values are computed as ems.
			*/
			this.setupBox = function(target, oPoint) {
				var isTopLevel = target.parentNode.nodeName
					.toLowerCase() == 'body';
				CSSProvider.setStyle (target, 'position', 
					isTopLevel? "fixed": "absolute");
				CSSProvider.setStyle (target, 'left', 
					oPoint && oPoint.x? (oPoint.x + "em") : '');
				CSSProvider.setStyle (target, 'top', 
					oPoint && oPoint.y? (oPoint.y + "em") : '');
				CSSProvider.setStyle (target, 'width', 
					oPoint && oPoint.w? (oPoint.w + "em") : '');
				CSSProvider.setStyle (target, 'height', 
					oPoint && oPoint.h? (oPoint.h + "em") : '');
			}
			
			/**
			 * Centers a certain CSS box inside its parent.
			 * @method
			 * @private
			 * @param target { HTML Element }
			 * 		The HTML element (already set up as a box) that is to be 
			 * 		centered.
			 * @param oPoint { Object }
			 * 		An object literal that describes an optional offset from the 
			 * 		computed 'center' position. Use:
			 * 		- x: a positive value will move the box right.
			 * 		- y: a positive value will move to box down.
			 * Note:
			 * All values are computed as ems.
			 */
			this.setupCentered = function(target, oPoint) {
				var w = parseFloat(target.style.width);
				var h = parseFloat(target.style.height);
				var xOff = oPoint && oPoint.x? parseFloat(oPoint.x) : 0;
				var yOff = oPoint && oPoint.y? parseFloat(oPoint.y) : 0;
				CSSProvider.setStyle(target, 'left', '50%');
				CSSProvider.setStyle(target, 'top', '50%');
				CSSProvider.setStyle(target, 'marginLeft', -1*(w/2-xOff)+'em');
				CSSProvider.setStyle(target, 'marginTop',  -1*(h/2-yOff)+'em');
			}
			
			/**
			 * Makes a certain CSS box stretch.
			 * @method
			 * @private
			 * @param target { HTML Element }
			 * 		The HTML element (already set up as a box) that has to 
			 * 		stretch.
			 * @param oPoint { Object }
			 * 		An object literal that defines one to four anchor points. 
			 * 		The box will stretch, the way that its boundaries stay 
			 * 		aligned to each defined anchor point, respectivelly.
			 * 		Example:
			 * 		oPoint = { bottom: 1.5, top: 0 }
			 * 		The box's bottom boundary will be anchored at 1.5 em away 
			 * 		from the parent-box's bottom boundary; also the top boundary
			 * 		of the box will be anchored at the parent-box's top 
			 * 		boundary. As the parent box resizes, the box resizes with
			 * 		it, while keeping the given anchors.
			 */
			this.setupStretched = function(target, oPoint) {
				var topA = oPoint && oPoint.top?
					parseFloat(oPoint.top) : 0;
				var rightA = oPoint && oPoint.right?
					parseFloat(oPoint.right) : 0;
				var bottomA = oPoint && oPoint.bottom?
					parseFloat(oPoint.bottom) : 0;
				var leftA = oPoint && oPoint.left?
					parseFloat(oPoint.left) : 0;
				if(topA >= 0) {
					CSSProvider.setStyle(target, 'top', topA+ 'em');
				}
				if(rightA >= 0) {
					CSSProvider.setStyle(target, 'right', rightA+ 'em');
				}
				if(bottomA >= 0) {
					CSSProvider.setStyle(target, 'bottom', bottomA+ 'em');
				}
				if(leftA >= 0) {
					CSSProvider.setStyle(target, 'left', leftA+ 'em');
				}
			}
		}



		/**
		* CLASS
		* 		DOMProvider
		* DESCRIPTION
		* 		Private class that provides DOM element creation tools and 
		* 		related functionality for the application.
		* SAMPLE USAGE
		* 		N/A (internal use only)
		* @class
		* @private
		* @param oDocument { Object }
		*		The document object to provide DOM services for.
		*/
		function DOMProvider (oDocument) {
			/**
			* The client document object we are providing DOM services for.
 			* @field
			* @private
			*/
			var clientDoc = oDocument;

			/**
			* Generic functionality for creating DOM nodes.
			* @method
			* @public
			* @param elName { String }
			* 		The name of the node to create.
			* @param elParent { Object }
			* 		The parent of the node to create (optional, defaults to 
			* 		'clientDoc'). Can be one of the following:
			* 		- a Document node;
			* 		- the global 'window' object;
			* 		- an Element node.
			* 		For the first two cases, the new node will be appended to 
			* 		the Body element (which, in turn, will be created if it 
			* 		doesn't exist.
			* @param cssClass { String }
			* 		The name of a CSS class to add to this node (optional, 
			* 		defaults to empty string - i.e., no class attribute).
			* @param attributes { Object }
			* 		A hash defining a number of arbitrary attributes.
			* 		Note:
			* 		DOM event listeners will not fire if defined this way. Use
			* 		'addEventListener()' instead.
			* @return { HTML Object }
			* 		The newly created HTML Object.
			*/
			this.makeElement = function(elName, elParent, cssClass, attributes){
				// @private function; gracefully returns the 'html' HTML node. 
				var getHtmlNode = function(oDoc) {
					if(arguments.callee.node) { return arguments.callee.node };
					var node = oDoc.getElementsByTagName('html')[0];
					if(!node) {
						node = oDoc.appendChild(oDoc.createElement('html'));
					}
					arguments.callee.node = node;
					return node;
				}
				// @private function; gracefully returns the 'head' HTML node.
				var getHeadNode = function(oDoc) {
					if(arguments.callee.node) { return arguments.callee.node };
					var node = oDoc.getElementsByTagName('head')[0];
					if(!node) {
						var htmlNode = getHtmlNode(oDoc);
						node = htmlNode.insertBefore(oDoc.createElement('head'),
							htmlNode.firstNode);
					}
					arguments.callee.node = node;
					return node;
				}
				// @private function; gracefully returns the 'body' HTML node.
				var getBodyNode = function(oDoc) {
					if(arguments.callee.node) { return arguments.callee.node };
					var node = oDoc.getElementsByTagName('body')[0];
					if(!node) {
						var htmlNode = getHtmlNode(oDoc);
						var headNode = getHeadNode(oDoc);
						node = htmlNode.insertBefore(oDoc.createElement('body'),
							headNode.nextSibling);
					}
					arguments.callee.node = node;
					return node;
				}
				var parentType = 
					(elParent)?
						(elParent.nativeWindow)? 
							'WINDOW_OBJECT' :
						(elParent.nodeType && elParent.nodeType == 9)? 
							'DOCUMENT' :
						(elParent.nodeType && elParent.nodeType == 1)? 
							'ELEMENT' :
						null :
					null;
				var _parent;
				switch (parentType) {
					case 'WINDOW_OBJECT':
						var oDoc = elParent.document;
						_parent = getBodyNode(oDoc);
						break;
					case 'DOCUMENT':
						var oDoc = elParent;
						_parent = getBodyNode(oDoc);
						break;
					case 'ELEMENT':
						_parent = elParent;
						break;
					default:
						var oDoc = clientDoc;
						_parent = getBodyNode(oDoc);
				}
				var el = _parent.ownerDocument.createElement (elName);
				if (cssClass) { 
					el.className = cssClass;
					cssProvider.registerCssClass(cssClass, el);
				};
				if (attributes) {
					for (atrName in attributes) {
						el.setAttribute (atrName, attributes[atrName]);
					}
				}
				el = _parent.appendChild(el);
				return el;
			}
			
			/**
			 * Convenience method to create an empty div element.
			 * @method
			 * @private
			 * @see makeElement()
			 * @param className { String }
			 * 		The name of the css class to apply to the newly created div.
			 * 		Optional, defaults to empty string (i.e., no class 
			 * 		attribute).
			 * @param _parent { Object }
			 * 		The parent to create the new div in. Optional, defaults 
			 * 		in effect to the body element.
			 * @return { HTML Object }
			 * 		The newly created div element.
			 */
			this.makeDiv = function (_parent, className) {
				return this.makeElement('div', _parent, className);
			}
			
			/**
			 * Creates a styled text node.
			 * @method
			 * @private
			 * @see makeElement()
			 * @param value { String }
			 * 		The content of the text node to create. 
			 * 		Note:
			 * 		HTML markup will not be expanded.
			 * @param _parent { Object }
			 * 		The parent to create the new text node in. Optional, 
			 * 		defaults to the body element.
			 * @param className { String }
			 * 		The css class name to apply to the newly created text node.
			 * 		Note:
			 * 		The class name is rather applied to a 'span' wrapper that 
			 * 		holds the text node. The span wrapper is added regardless of
			 * 		the fact that the 'className' attribute is present or not.
			 * @return { HTML element }
			 * 		A span element wrapping the newly created text node.
			 */
			this.makeText = function(value, _parent, className) {
				var wrapper = this.makeElement('span', _parent, className);
				var text = wrapper.ownerDocument.createTextNode(value);
				wrapper.appendChild(text);
				return wrapper;
			}
			
			/**
			 * Removes the text blocks created via makeText();
			 * @method
			 * @private
			 * @param _parent { HTML Element }
			 * 		The element to remove the text blocks from.
			 */
			this.destroyText = function(_parent) {
				var sp = null;
				while (sp = _parent.getElementsByTagName('span')[0]) {
					sp = _parent.removeChild (sp);
				}
			}
		}



		/**
		* CLASS
		* 		CSSProvider
		* DESCRIPTION
		* 		Private class that provides CSS styling services for the 
		* 		application.
		* SAMPLE USAGE
		* 		N/A (internal use only)
		* @class
		* @private
		* @param oDocument { Object }
		* 		The document object to provide CSS for.
		*/
		function CSSProvider ( oDocument ) {
			/**
			 * Change the current color scheme with the specified one, if a 
			 * scheme with the given name can be found.
			 * @method
			 * @public
			 * @since 1.2 alpha
			 * @param scheme { String }
			 * 		The name of the new color scheme to apply. It will fail 
			 * 		silently if such a color scheme does not exist.
			 */
			this.changeColorScheme = function (scheme) {
				colorScheme = scheme;
				this.updateCSS();
			}
			
			/**
			 * Enforces a global CSS reparsing, using CSSProvider.cssContent.
			 * @method
			 * @public
			 */
			this.updateCSS = function () {
				this.applyCSS (CSSProvider.cssContent);
			}
			
			/**
			 * The client document object we are providing CSS services for.
 			 * @field
			 * @private
			 */
			var clientDoc = oDocument;
			
			/**
			 * Default color scheme to use in the application CSS.
			 * @field
			 * @private
			 */
			var defaultColorScheme = 'proffesionalBlue'; 
			
			/**
			 * Holds the name of the color scheme to be applied. Defaults to
			 * 'proffesionalBlue'.
			 * @field
			 * @private 
			 */
			var colorScheme = defaultColorScheme;
			
			/**
			 * Holds the CSS classes we declare; optimizes the CSS parsing time
			 * @field
			 * @private 
			 */
			var cssClassRegistry = {};
			
			/**
			 * Links a particular DOM object with a CSS class name.
			 * @method
			 * @public
			 * @param className {String}
			 * 		The name of a CSS class.
			 * @param obj {DOM Element}
			 * 		A DOM Element to associate with the above class name
			 */
			this.registerCssClass = function(className, obj) {
				if (!cssClassRegistry[className]) {
					cssClassRegistry[className] = [];
				}
				obj.className = className;
				cssClassRegistry[className].push(obj);
			}
			
			/**
			 * Unlinks a particular DOM object, previously linked with a CSS 
			 * class name.
 			 * @method
			 * @public
			 * @param className { String }
			 * 		The name of a CSS class.
			 * @param obj { DOM Element }
			 * 		A DOM Element to unlink.
			 */
			this.unregisterCssClass = function(className, obj) {
				var set = cssClassRegistry[className];
				if (set) {
					for(var i=0; i<set.length; i++) {
						var registeredObj = set[i];
						if(registeredObj === obj) {
							registeredObj = null;
							break;
						}
					}
					set.sort(function(a, b){ return a === null? 1: 0 });
					while(set[Math.min(0, set.length-1)] === null) {
						set.length -= 1;
					}
				}
			}
			
			/**
			 * Unlinks all the CSS class names linked via registerCssClass().
			 * @method
			 * @private
			 */
			function clearClassRegistry() {
				cssClassRegistry = {};
			}
			
			/**
			 * Applies the colors in the current color scheme to the application
			 * CSS, then returns the modified CSS
			 * @method
			 * @private
			 * @return {String}
			 * 		A copy of CSSProvider.cssContent with all the colors place
			 * 		holders resolved to the current color scheme.
			 */
			function resolveColorNames (cssText) {
				var colors = CSSProvider.colorSchemes[colorScheme];
				if (!colors) {
					colors = CSSProvider.colorSchemes[defaultColorScheme];
				}
				var newCss = cssText;
				for (colorName in colors) {
					var p;
					p = new RegExp(colorName, "g");
					newCss = newCss.replace(p, colors[colorName]);
				}
				return newCss;
			}
			
			/**
			 * Custom CSS parsing engine. This seems to be more reliable than 
			 * the current Webkit's implementation. Only supports class names
			 * linked via registerCssClass() and tag names.
			 * @method
			 * @private
			 * @cssText { String }
			 * 		The CSS declarations to parse.
			 */
			this.applyCSS = function(cssText) {
				var cssText = Utils.trim (cssText);	
				cssText = resolveColorNames (cssText);
				var blocks = cssText.split('}');
				for (var i=0; i<blocks.length; i++) {
					var block = Utils.trim(blocks[i]);
					if (!block) { continue };
					var operands = block.split('{');
					var selectors = Utils.trim(operands[0]).split(',');
					var directives = Utils.trim(operands[1]).split(';');
					for (var j=0; j<directives.length; j++) {
						if (!directives[j]) {
							directives[j] = null; //@i.e., marking for deletion.
							continue;
						}
						directives[j] = Utils.trim(directives[j]).split(':');
						directives[j][0] = Utils.trim(directives[j][0]);
						directives[j][1] = Utils.trim(directives[j][1]);
					}
					directives.sort (function(a,b){return a === null? 1: 0});
					while(directives[Math.max(0,directives.length-1)] === null){
						directives.pop();
					}
					for (var k=0; k<selectors.length; k++) {
						var selector = Utils.trim(selectors[k]);
						var targetObjects = [];
						if (/^\./.test(selector)) {
							var key = selector.replace (/^\./,'');
							if (cssClassRegistry[key]) {
								var tmpArr = cssClassRegistry[key];
								for (var l=0; l<tmpArr.length; l++) {
									targetObjects[l] = tmpArr[l];
								}
							}
						} else if (/^\w/.test(selector)) {
							targetObjects = clientDoc.
								getElementsByTagName(selector) || targetObjects;
						}
						for(var m=0; m<targetObjects.length; m++) {
							var currTarget = targetObjects[m];
							for(var n=0; n<directives.length; n++) {
								var currDecl = directives[n];
								var property = currDecl[0];
								var value = currDecl[1];
								CSSProvider.setStyle(currTarget, property,
									value);
							}
						}
					}
				}
				clearClassRegistry();
			}
		}
		
		/**
		 * Sets the provided style on an HTML element.
		 * @field
		 * @public
		 * @static
		 * @param target {HTML Element}
		 * 		An HTML Element to set CSS style on.
		 * @param property (String)
		 * 		The name of the CSS property to be set
		 * @param value {String}
		 * 		The new value to set
		 */
		CSSProvider.setStyle = function (target, property, value) {
			target.style[property] = String(value);
		}
		
		/**
		 * Unsets a style property on an HTML element.
		 * @field
		 * @public
		 * @static
		 * @see CSSProvider.setStyle
		 */
		CSSProvider.clearStyle = function(target, property) {
			CSSProvider.setStyle(target, property, '');
		}
		 
		/**
		 * Holds color schemes for the application
		 * @field
		 * @public
		 * @static
		 */
		CSSProvider.colorSchemes = {
			proffesionalBlue : {
				absLight			:	'#ffffff',
				absDark				:	'#000000',
				lightNeutral		:	"#d3dcf2",
				darkNeutral			:	"#9197a6",
				colorMain			:	"#7690cf",
				lighterColorAccent	:	"#48577d",
				darkerColorAccent	:	"#4e5159"
			}
		}
		
		/**
		 * Holds all the CSS information for the application's layout
		 * @field
		 * @public
		 * @static
		 */
		CSSProvider.cssContent = '\
			body {\
				-khtml-user-select: none;\
				font-size: 16px;\
			}\
			.rcHeader {\
				background-color: lightNeutral;\
				border-bottom: 0.2em solid darkNeutral;\
			}\
			.airToken, .sbrToken, .vToken {\
				font-family: arial, verdana, sans_;\
				padding: 0.2em;\
				font-weight: bold;\
				cursor: default;\
				line-height: 1.5em;\
			}\
			.airToken {\
				color: darkNeutral;\
				font-size: 200%;\
			}\
			.sbrToken, .vToken {\
				color: darkerColorAccent;\
				font-size: 80%;\
			}\
			.vToken {\
				font-style: italic;\
			}\
			.rcTree {\
				background-color: colorMain;\
				border-right: 0.2em solid lightNeutral;\
			}\
			.listDescr {\
				font-family: arial, verdana, sans_;\
				font-size: 0.8em;\
				color: absLight;\
				display: block;\
				padding: 0.5em;\
			}\
			.listBackground {\
				border: 0.1em solid absLight;\
				background-color: lighterColorAccent;\
				opacity: 0.1;\
			}\
			.tree, ul {\
				padding: 0;\
				color: absLight;\
				list-style-type: none;\
			}\
			.item, .branch, .nonEmptyBranch, .leaf {\
				margin-left: 1.5em;\
				padding: 0;\
			}\
			.branch, .nonEmptyBranch {\
				list-style-type: circle;\
			}\
			.nonEmptyBranch {\
				list-style-type: disc;\
			}\
			.leaf {\
				list-style-type: square;\
			}\
			.itemText, .branchText, .nonEmptyBranchText, .leafText {\
				font-family: arial, verdana, sans_;\
				font-size: 0.8em;\
				display: block;\
				cursor: default;\
				padding-left: 0.2em;\
			}\
			.branchText, .nonEmptyBranchText {\
				font-weight: bold;\
				font-style: italic;\
				cursor: text;\
			}\
			.nonEmptyBranchText {\
				font-style: normal;\
				cursor: pointer;\
			}\
			.progress {\
				font-family: arial, verdana, sans_;\
				font-size: 0.7em;\
				font-style: italic;\
			}\
			.rcContent {\
				background-color: absDark;\
			}\
			.noContent {\
				font-family: arial, verdana, sans_;\
				color: lighterColorAccent;\
				font-size: 1em;\
				font-weight: bold;\
				font-style: italic;\
			}\
			.srcCodeArea, .ruler {\
				border: 0.1em solid colorMain;\
				background-color: absLight;\
				opacity: 0.95;\
				overflow: auto;\
				padding-left: 0.2;\
				visibility: hidden;\
				line-height: 1.2em;\
				font-size: 0.9em;\
			}\
			.ruler {\
				padding-left: 0;\
				border-width: 0.1em;\
				background-color: lighterColorAccent;\
				z-index: 2;\
				overflow: hidden;\
			}\
			.lineMark {\
				display: block;\
				color: lightNeutral;\
				text-align: right;\
				padding-right: 0.2em;\
			}\
			.sourceCodeText {\
				font-family: courier new, courier, mono_;\
				white-space: pre;\
				color: absDark;\
				-khtml-user-select: auto;\
			}\
			.rcFooter {\
				border-top: 0.2em solid lightNeutral;\
				background-color: darkNeutral;\
			}\
			.copyrightText {\
				color: lightNeutral;\
				font-family: arial, verdana, sans_;\
				font-size: 80%;\
				font-weight: bold;\
				text-align: right;\
				display: block;\
				margin: 0.5em;\
			}\
			';
		
		/**
		 * Holds specific CSS styling information that is to be used dynamically
		 * on the list items.
		 * @field
		 * @public
		 * @static 
		 */
		CSSProvider.dynamicCSS = '\
			.itemOver {\
				background-color: darkNeutral;\
			}\
			.itemOut {\
				background-color: transparent;\
			}\
			.itemClick {\
				backgroundColor: lighterColorAccent;\
			}\
		';
	}
	context.instance = new _SourceViewer();
	return context.instance;
}