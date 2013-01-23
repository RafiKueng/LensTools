/*************************
 * LMT.events.js
 * 
 * Event Management
 * 
 * here, all possible occuring UI events will be mapped to the according event handlers
 * 
 * events will be triggered at UI elements
 * the according objects listen to those events
 */



var events = {
  
  // special event on startup
  startUp: function(){

    LMT.ui.html.Toolbar.init();
    LMT.ui.html.DisplaySettingsDialog.init();
    LMT.ui.html.Tooltip.init();
    LMT.ui.html.KeyboardListener.init();

    LMT.ui.svg.initCanvas();
    LMT.ui.out = new LMT.ui.output(); //TODO change this not to be an object
    LMT.ui.out.init();
    
    LMT.model = new LMT.objects.Model();
    
  },
  
  
  assignHandlers: function() {
    
    // dummy function
    var fnc = function(){return false;}
    
    // the server sent the starting data for the model, like urls to the background image(s) and default color binding
    $(document).on('ReceivedModelData', LMT.ui.html.ColorSettingsDialog.init);
    $(document).on('ReceivedModelData', LMT.ui.svg.bg.init);
    
    // the background images / channels color settings were changed
    $(document).on('ChangedModelData', LMT.ui.svg.bg.updateColor);
    


    
    $(document).on('Undo', fnc);
    $(document).on('Redo', fnc);



    $(document).on('Zoom', LMT.ui.svg.bg.zoom); // expects 1 arg: +1: zoom in, -1 zoom out;
    $(document).on('Pan', LMT.ui.svg.bg.updateZoomPan);
    $(document).on('ZoomPanReset', LMT.ui.svg.bg.zoomPanReset);



    $(document).on('ShowDialogColorSettings', LMT.ui.html.ColorSettingsDialog.show);
    $(document).on('ShowDialogDisplaySettings', LMT.ui.html.DisplaySettingsDialog.show);



    $(document).on('SwitchMode', fnc);


    
    $(document).on('SaveModel', fnc);
    $(document).on('UploadModel', fnc);
    $(document).on('SimulateModel', fnc);
    $(document).one('RepaintModel', LMT.events.RepaintModel); //can only be called once, once finished with the update, it reassigns itself


    
    $(document).on('ReceivedSimulation', LMT.ui.out.load);
    
    $(document).on('DisplayOutputSlide', LMT.ui.out.show); //needs a id
    $(document).on('DisplayOutputSlideNext', LMT.ui.out.next);
    $(document).on('DisplayOutputSlidePrev', LMT.ui.out.prev);
    $(document).on('DisplayOutputSlideOverview', LMT.ui.out.showOverview);


    
    $(document).on('CreateRootMinima', fnc);
    $(document).on('ToggleExtremalPoint', fnc);
    $(document).on('CreateContourPoint', fnc);
    $(document).on('DeleteContourPoint', fnc);
    $(document).on('MoveObject', fnc);
    $(document).on('CreateExternalMass', fnc);
    $(document).on('CreateRuler', fnc);
    $(document).on('DeleteObject', fnc); // something like jsObj.remove()
    



    $(document).on('ActionStackUpdated', fnc);


    
    $(document).on('ShowTooltip', html.Tooltip.show);
    $(document).on('HideTooltip', html.Tooltip.hide);
  },
  
}  
  
/**
 * only make one update per time
 * bind this function to the event, but remove it on the first occurance (.one + one time execution)
 * and only reattach it, onces the update is finished.. 
 */

events.RepaintModel = function(){
  LMT.model.update();
  LMT.model.paint();
  $(document).one('UpdateModel', events.RepaintModel);
}






/**
 * custom event management / Creation
 * 
 * event handling is taken care of in the according section (mostly in the intelligence script)
 * here, new events will be created in dependence of previous events
 */












/**
 * Fires AppReady when the app has completly loaded and is ready to be used
 * 
 * (this is one instance of an anonymous class)
 */

/*
events.AppReady = {
	loadedButtons: false,
	loadedModelData: false,
	loadedModelImages: false,

	init: function() {
		// add handler to listen to
		// inside the handler, make events.Appready available as 'that'
		// 'this' is the document (the jquery selector noted)
		$(document).on('loadedButtons', {that: this}, function(evt){
			var that = evt.data.that;
			that.loadedButtons = true;
			that.check();
		});
		
		$(document).on('loadedModelData', {that: this}, function(evt){
			var that = evt.data.that;
			this.loadedModelData  = true;
			this.check();
		});
		
		$(document).on('loadedModelImages', {that: this}, function(evt){
			var that = evt.data.that;
			this.loadedModelImages = true ;
			this.check();
		});
		return this;
	},
	
	check: function() {
		if (this.loadedButtons && this.loadedModelData && this.loadedModelImages) {
			$.event.trigger('AppReady');
		}
	}
}.init();
*/


/**
 * only make one update per time
 * bind this function to the event, but remove it on the first occurance (.one + one time execution)
 * and only reattach it, onces the update is finished.. 
 */

/*
events.UpdateModel = function(){
	LMT.model.update();
	LMT.model.paint();
	
	$(document).one('UpdateModel', events.UpdateModel);
}
$(document).one('UpdateModel', events.UpdateModel);
*/

LMT.events = events;