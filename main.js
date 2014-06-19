
/**
 * @author Ikaros Kappler
 * @date 2013-10-13
 * @version 1.0.0
 **/


// Will be initialised on initWebGL()
this.bezierCanvasHandler   = null;
this.previewCanvasHandler  = null;

// Global constants (modifify when resizing the HTML5 canvas)
var BEZIER_CANVAS_WIDTH    = 512;
var BEZIER_CANVAS_HEIGHT   = 768;

var PREVIEW_CANVAS_WIDTH   = 512;
var PREVIEW_CANVAS_HEIGHT  = 768;


/**
 * This function creates a human-readable date/time string.
 * Format: YYYY-MM-DD_H.i.s
 **/
function createHumanReadableTimestamp() {

    // Append the current date to the output filename values
    var curDate = new Date();
    var ts        = "" +
	curDate.getFullYear() +
	"-" +
	(curDate.getMonth()+1) +  // months start at 0
	"-" +
	curDate.getDate() +
	"_" +
	curDate.getHours() + 
	"." +
	curDate.getMinutes() +
	"." +
	curDate.getSeconds();

    return ts;
}

/**
 * The signum function is not native part of the javascript Math class.
 * Add Math.sign function if not present (Mozilla, ...).
 **/
if( !Math.sign ) {
    Math.sign = function( x ) {
	// Bad:
	/*
	// TO DO ... THIS IS UGLY!
	// Every mathematician would die if he/she sees this.
	if( x < 0 )
	    return -1;
	else if( x > 0 )
	    return 1;
	else
	    return 0;
	*/
	
	// Better:
	if( x == 0 )
	    return 0;
	else
	    return Math.round( x / Math.abs(x) ); // round: convert to integer
    }
}

/**
 * This function returns the default bezier path the application initially displays.
 * Note that the returned curve is a JSON string which can be parsed by 
 *  IKRS.BezierPath.fromJSON( string ).
 **/
function getDefaultBezierJSON() {
    return "[ { \"startPoint\" : [-122,77.80736634304651], \"endPoint\" : [-65.59022229786551,21.46778533702511], \"startControlPoint\": [-121.62058129515852,25.08908859418696], \"endControlPoint\" : [-79.33419353770395,48.71529293460728] }, { \"startPoint\" : [-65.59022229786551,21.46778533702511], \"endPoint\" : [-65.66917273472913,-149.23537680826058], \"startControlPoint\": [-52.448492057756646,-4.585775770903305], \"endControlPoint\" : [-86.1618869001374,-62.11613821618976] }, { \"startPoint\" : [-65.66917273472913,-149.23537680826058], \"endPoint\" : [-61.86203591980055,-243.8368165606738], \"startControlPoint\": [-53.701578771473564,-200.1123697454778], \"endControlPoint\" : [-69.80704300441666,-205.36451303641783] }, { \"startPoint\" : [-61.86203591980055,-243.8368165606738], \"endPoint\" : [-21.108966092052256,-323], \"startControlPoint\": [-54.08681426887413,-281.486963896856], \"endControlPoint\" : [-53.05779349623559,-323] } ]";
}

/**
 * This function is called when the page was completely loaded.
 **/
function onloadHandler() {

    if( !initWebGL() ) {

	// Show error message.
	messageBox.show( "<br/>\n" +
			 "<br/>\n" +
			 "<h3>No WebGL!</h3><br/>\n" +
			 //"<br/>\n" +
			 "Maybe you want to visit the WebGL support site.<br/>\n" +
			 "<a href=\"http://get.webgl.org/\" target=\"_new\">http://get.webgl.org/</a><br/>\n" 
			 //"<button onclick=\"messageBox.hide()\" disabled=\"disabled\">Close</button>\n"
		       );
	return;

    }

    // Fetch the GET params
    // Thanks to weltraumpirat
    //   http://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
    function getSearchParameters() {
	//var prmstr = window.location.search.substr(1);
	var url = window.location.href; //search;
	var index = url.indexOf("?");
	if( index == -1 || index+1 >= url.length ) 
	    return {};

	var prmstr = url.substr( index+1 );
	//window.alert( prmstr );
	return prmstr != null && prmstr != "" ? transformToAssocArray(prmstr) : {};
    }
    function transformToAssocArray( prmstr ) {
	var params = {};
	var prmarr = prmstr.split("&");
	for ( var i = 0; i < prmarr.length; i++) {
            var tmparr = prmarr[i].split("=");
            params[tmparr[0]] = tmparr[1];
	}
	return params;
    }



    // Now display the get params in the main form.
    var params = getSearchParameters();
    var inputs = document.getElementsByTagName( "input" );
    for( var i = 0; i < inputs.length; i++ ) {

	for( var key in params ) {

	    if( params.hasOwnProperty(key) ) {

		var value = params[ key ];
		if( value == "" )
	    	    continue;


		var element = inputs[ i ];
		if( element.type.toLowerCase() == "checkbox" ) {

		    // This element is a checkbox. Set checked?		    
		    if( element.name.toLowerCase() == key )
			element.checked = (value != "0");


		} else if( element.type.toLowerCase() == "radio" ) {
		    
		    // This element is a radio button. Set selected?
		    if( element.name.toLowerCase() == key && element.value == value )
			element.checked = true;

		} else if( element.type.toLowerCase() == "text" || 
			   element.type.toLowerCase() == "number" || 
			   element.type.toLowerCase() == "range" ) {
		    
		    // This element is a text/number/range. Set value?
		    if( element.name.toLowerCase() == key )
			element.value = value;
		}

	    } // END for
	} // END if
    } // END for

    displayBendingValue();
    toggleFormElementsEnabled();
    updateBezierStatistics( null, null );

    // Is the rendering engine available?
    // Does this browser support WebGL?
    previewCanvasHandler.preview_rebuild_model();
    preview_render();

}

// IE < v9 does not support this function.
if( window.addEventListener ) {
    window.addEventListener( "load",
			     onloadHandler,
			     false
			   );
} else {
    window.onload = onloadHandler;
}




function getPreviewMeshes() {

    return previewCanvasHandler.getMeshes();
}

function bezier_undo() {
    var hasMoreUndoSteps = this.bezierCanvasHandler.undo();
    
    window.alert( this.bezierCanvasHandler.undoHistory._toString() );
    
}

function bezier_redo() {
    var hasMoreRedoteps = this.bezierCanvasHandler.redo();
}

function setBezierPath( bezierPath ) {

    this.bezierCanvasHandler.setBezierPath( bezierPath );    
    
    preview_rebuild_model();
}

function getBezierPath() {
    return this.bezierCanvasHandler.bezierPath;
}

function initWebGL() {

    try {
	this.bezierCanvasHandler = new IKRS.BezierCanvasHandler();
	this.bezierCanvasHandler.addChangeListener( updateBezierStatistics );  // A function
	this.previewCanvasHandler = new IKRS.PreviewCanvasHandler( this.bezierCanvasHandler,
								   PREVIEW_CANVAS_WIDTH,     // 512, 
								   PREVIEW_CANVAS_HEIGHT     // 768 
								 );
    
	// Indicate success.
	setStatus( "WebGL initialized. Ready." );
	return true;
    } catch( e ) {
	console.log( "Error: failed to initiate canvas handlers. Is WebGL enabled/supported?" );
	setStatus( "Error: failed to initiate canvas handlers. Is WebGL enabled/supported?" );
	// Indicate error.
	return false;
    }
}

/**
 * Signature as a bezier canvas listener :)
 **/
function updateBezierStatistics( source, event ) {
    if( event && event.nextEventFollowing )
	return; // Wait for last event in sequence, THEN update (saves resources)

    // Calculate the bezier curves inner area size.
    // The resulting value is in square units.
    var bezierAreaSize = this.bezierCanvasHandler.getBezierPath().computeVerticalAreaSize( 1.0,   // deltaSize
											   true   // useAbsoluteValues
											 );
    var bounds         = this.bezierCanvasHandler.getBezierPath().computeBoundingBox();
    // Now imagine the whole are to be a rectangle with the same height.
    // The resulting radius is then:
    //var imaginaryRectangleWidth = bezierAreaSize / bounds.getHeight();
    
    // Now imagine the solid revolution of that rectangle.
    // It's volume is the value we are interesed in. It equals the volume of the present mesh.
    // Volume = PI * square(radius) * height
    //var volumeInUnits_old = Math.PI * Math.pow(imaginaryRectangleWidth,2) * bounds.getHeight();
    var volumeInUnits     = this.bezierCanvasHandler.getBezierPath().computeVerticalRevolutionVolumeSize( //1.0,   // deltaSize
													  true   // useAbsoluteValues
													);
    

    var areaSize_squareMillimeters = bezierAreaSize * Math.pow( this.bezierCanvasHandler.getMillimeterPerUnit(), 2.0 );
    var volume_cubeMillimeters     = volumeInUnits * Math.pow( this.bezierCanvasHandler.getMillimeterPerUnit(), 3.0 );

    // There is a serious bug in the calculation:
    //  The computed volume is about 25%-30& too high!
    //  Didn't find the cause so far :(
    volume_cubeMillimeters *= 0.75;

    var volume_cubeMilliLiters     = volume_cubeMillimeters / 1000.0;
    var lowDensity                 = 0.76;
    var highDensity                = 1.07;
    var imperialCup                = 284.130642624675; // ml
    var usCup                      = 236.5882365;      // ml
    var weight_lowDensity          = roundToDigits((volume_cubeMillimeters/1000)*lowDensity,0);
    var weight_highDensity         = roundToDigits((volume_cubeMillimeters/1000)*highDensity,0);
    var tableData = [
	[ "Diameter",     roundToDigits((bounds.getWidth()/10)*2*this.bezierCanvasHandler.getMillimeterPerUnit(),1,3),            "cm"  ],
	[ "Height",       roundToDigits((bounds.getHeight()/10)*this.bezierCanvasHandler.getMillimeterPerUnit(),1,3),             "cm"  ],
	[ "Bezier Area",  roundToDigits((areaSize_squareMillimeters/100.0),2,3),                                                  "cm<sup>2</sup>"  ],
	[ "Volume",       roundToDigits((volume_cubeMillimeters/1000.0),1,3),                                                     "cm<sup>3</sup> | ml"  ],
	[ "",             roundToDigits((volume_cubeMilliLiters/imperialCup),1,3),                                                " Imperial Cups"  ],
	[ "",             roundToDigits((volume_cubeMilliLiters/usCup),1,3),                                                      " US Cups"  ],
	[ "Weight<br/>&nbsp;[low density silicone, " + lowDensity + "g/cm<sup>3</sup>]", roundToDigits(weight_lowDensity,0,3),    "g"  ],
	[ "Weight<br/>&nbsp;[high density silicone, " + highDensity + "g/cm<sup>3</sup>]", roundToDigits(weight_highDensity,0,3), "g"  ]
    ];
    document.getElementById( "volume_and_weight" ).innerHTML = makeTable( tableData );

    preview_rebuild_model();
}

function makeTable( tableData ) {
    // I know, this is ugly.
    // String concatenation _and_ direct HTML insert insert DOM use. Bah!
    // Please optimize.
    var result = "<table style=\"border: 1px solid #686868;\">";
    for( var r = 0; r < tableData.length; r++ ) {

	result += "<tr>\n";
	for( var c = 0; c < tableData[r].length; c++ ) {

	    //var valign = "top";
	    //var align  = "left";

	    if( c == 1 )
		result += "<td valign=\"bottom\" align=\"right\">" + tableData[r][c] + "&nbsp;</td>\n";
	    else
		result += "<td valign=\"bottom\">" + tableData[r][c] + "&nbsp;</td>\n";

	}
	result += "</tr>\n";

    }
    result += "</table>\n";
    return result;
}

function preview_render() {
  
  // Recursive call
  requestAnimationFrame( this.preview_render ); 
  previewCanvasHandler.render( this.preview_scene, 
			       this.preview_camera 
			       ); 
}

function decreaseZoomFactor( redraw ) {
    this.previewCanvasHandler.decreaseZoomFactor();
    if( redraw )
	preview_render();
}

function increaseZoomFactor( redraw ) {
    this.previewCanvasHandler.increaseZoomFactor();
    if( redraw )
	preview_render();
}

function increase_mesh_details() {
	var shape_segments = this.document.forms["mesh_form"].elements["shape_segments"].value;
	var path_segments  = this.document.forms["mesh_form"].elements["path_segments"].value;		
			
	shape_segments     = parseInt( shape_segments );
	path_segments      = parseInt( path_segments );
			
	shape_segments     = Math.ceil( shape_segments * 1.2 );
	path_segments      = Math.ceil( path_segments  * 1.2 );
			
	this.document.forms["mesh_form"].elements["shape_segments"].value = shape_segments;
	this.document.forms["mesh_form"].elements["path_segments"].value  = path_segments;
			
	preview_rebuild_model();
}

function decrease_mesh_details() {

	var shape_segments = this.document.forms["mesh_form"].elements["shape_segments"].value;
	var path_segments  = this.document.forms["mesh_form"].elements["path_segments"].value;		
			
	shape_segments     = parseInt( shape_segments );
	path_segments      = parseInt( path_segments );
			
	shape_segments     = Math.max( 3, Math.floor( shape_segments / 1.2 ) );
	path_segments      = Math.max( 2, Math.floor( path_segments  / 1.2 ) );

        if( shape_segments < 3 && path_segments < 2 )
	    return; // No change

    // The min or max bound might have been reached and the segment values
    // were re-adjusted. Display the new value in the HTML form.
	this.document.forms["mesh_form"].elements["shape_segments"].value = shape_segments;
	this.document.forms["mesh_form"].elements["path_segments"].value  = path_segments;
			
	preview_rebuild_model();

}

function preview_rebuild_model() {
  this.previewCanvasHandler.preview_rebuild_model();
}



function newScene() {
    
    
    var defaultSettings = {
	shapeSegments:     80,
	pathSegments:      80,
	bendAngle:         0,
	buildNegativeMesh: false,
	meshHullStrength:  12,
	closePathBegin:    false,
	closePathEnd:      true,
	wireframe:         false,
	triangulate:       true
    };

    ZipFileImporter._apply_mesh_settings( defaultSettings );


    var json = getDefaultBezierJSON();
    try {
	bezierPath = IKRS.BezierPath.fromJSON( json );		    
    } catch( e ) {
	window.alert( "Error: " + e );
	return false;
    }

    setBezierPath( bezierPath );
    updateBezierStatistics( null, null );

    preview_rebuild_model();
}

function saveShape() {

    saveTextFile( bezierCanvasHandler.bezierPath.toJSON(), 'bezier_shape.json', 'application/json' );

}

function loadShape() {
    upload_bezier_json_file( document.forms['bezier_file_upload_form'].elements['bezier_json_file'] );
}

function exportZIP() {

    // Check size
    if( !checkSizeBeforeSaving() )
	return false;

    //var zip_filename = document.forms['zip_form'].elements['zip_filename'].value;
    var zip_filename = "settings_" + createHumanReadableTimestamp() + ".zip";
    ZipFileExporter.exportZipFile( zip_filename );
}

function importZIP() {
    var zip_filename = document.forms['zip_import_form'].elements['zip_upload_file'];
    if( zip_filename )
	ZipFileImporter.importZipFile( zip_filename );
}

/**
 * Toggles the 'about' dialog.
 **/
function about() {

    var buttonHandler = "messageBox.hide()";
    
    messageBox.setSize( 300, 340 );
    messageBox.show( 
        "<br/><br/>Extrusion/Revolution Generator<br/>\n" +
	    "(a.k.a. Dildo Generator)<br/>\n" + 
            "<br/>\n" +
	    "extrusiongen<br/>\n" + 
	    VERSION_STRING + "<br/>\n" + 
	    "<img src=\"img/I_eat_food_quadratisch_0_-_0.jpg\" alt=\"Logo - I eat food\" width=\"120\" height=\"120\" /><br/>\n" +
	    "<br/>\n" +
	    "<a href=\"https://github.com/IkarosKappler/extrusiongen\" target=\"_blank\">Ikaros Kappler @ github</a><br/>\n" +
            "<br/><button onclick=\"" + buttonHandler + "\"" + (buttonHandler?"":" disabled") + ">Close</button>" 
    );
    
}


function debug() {
    window.alert( 
	"camera.ikrsSettings.rotation=" + JSON.stringify(this.previewCanvasHandler.preview_camera.ikrsSettings.rotation) + ",\n" + 
	    "camera.ikrsSettings.position=" + JSON.stringify(this.previewCanvasHandler.preview_camera.ikrsSettings.position) + ",\n" +
	    "camera.rotation=" + JSON.stringify(this.previewCanvasHandler.preview_camera.rotation) + ",\n" +
	    "camera.position=" + JSON.stringify(this.previewCanvasHandler.preview_camera.position) + "\n"
    );
}


function checkSizeBeforeSaving() {
    var bezierBounds        = this.bezierCanvasHandler.getBezierPath().computeBoundingBox();
    var heightInMillimeters = (bezierBounds.getHeight()/1.0) * this.bezierCanvasHandler.getMillimeterPerUnit();
    //window.alert( heightInMillimeters );
    if( heightInMillimeters > 210 ) {	
	//window.alert( "The shape must not be bigger than 200mm." );
	/*
	messageBox.show(
	    "<br/><br/>\n" +
		"The shape must not be bigger than 200mm.<br/>\n"
	);
	*/
	return window.confirm( "The shape is bigger than 210mm (height) and cannot be printed this way.\n" +
			       "\n" +
			       "Do you want to continue though?\n" 
			     );
    }

    return true;
}


var divisibleSTLBuilder = null;
function exportSTL() {

    if( !divisibleSTLBuilder ) { 
	
	// Check size
	if( !checkSizeBeforeSaving() )
	    return false;

	var meshes        = getPreviewMeshes();
	var filename      = null;
	if( document.forms['stl_form'].elements['stl_filename'] )
	    filename =  document.forms['stl_form'].elements['stl_filename'].value;
	else
	    filename = "mesh.stl";

	var merge_meshes  = false;
	if( document.forms["stl_form"] &&
	    document.forms["stl_form"].elements["stl_merge_meshes"] &&
	    document.forms["stl_form"].elements["stl_merge_meshes"].checked ) {

	    merge_meshes = true;
	}
	
	// Init the divisible STL builder
	divisibleSTLBuilder = new IKRS.DivisibleSTLBuilder( meshes,
							    filename,
							    function( e ) { },
							    1024*128,    // 128 kB chunks,
							    this.bezierCanvasHandler.getMillimeterPerUnit(),
							    !merge_meshes        // export as single mesh?
							  );
	
	showLoadingBar( "exportSTL_cancelHandler()" );

    }
    
    if( divisibleSTLBuilder.isInterrupted() ) {

	divisibleSTLBuilder = null;
	hideLoadingBar();
	return;

    }

    //console.log( "Next chunk (" + divisibleSTLBuilder.chunkResults.length + ")." );
    displayProcessState( divisibleSTLBuilder.getProcessedChunkCount(),
			 divisibleSTLBuilder.getProjectedChunkCount() 
		       );

    var hasNextChunk = divisibleSTLBuilder.processNextChunk();
    
    if( hasNextChunk ) 
	window.setTimeout( "exportSTL();", 100 );
    else {
	
	//window.alert( "Finished. " + divisibleSTLBuilder.chunkResults.length + " chunks calculated." );
	displayProcessState( divisibleSTLBuilder.getProcessedChunkCount(), 
			     divisibleSTLBuilder.getProjectedChunkCount() 
			   );
	divisibleSTLBuilder.saveSTLResult();
	divisibleSTLBuilder = null;
	
	hideLoadingBar();

    }
    
}

function exportSTL_cancelHandler() {
    if( divisibleSTLBuilder ) {
	
	//messageBox.show( "<br/><br/>Interrupted ...<br/><br/>Please wait for process to terminate.<br/>\n" );
	divisibleSTLBuilder.interrupt();	
	
    }
}


var divisibleOBJBuilder = null;
function exportOBJ() {

    if( !divisibleOBJBuilder ) { 
	
	//window.alert( "This function is still experimental." );
	// Check size
	if( !checkSizeBeforeSaving() )
	    return false;
	
	var meshes        = getPreviewMeshes();
	var filename      = null;
	if( document.forms['obj_form'].elements['obj_filename'] )
	    filename =  document.forms['obj_form'].elements['obj_filename'].value;
	else
	    filename = "mesh.obj";

	var merge_meshes  = false;
	if( document.forms["obj_form"] &&
	    document.forms["obj_form"].elements["obj_merge_meshes"] &&
	    document.forms["obj_form"].elements["obj_merge_meshes"].checked ) {

	    merge_meshes = true;
	}
	
	// Init the divisible STL builder
	divisibleOBJBuilder = new IKRS.DivisibleOBJBuilder( meshes,
							    filename,
							    function( e ) { },
							    1024*128,    // 128 kB chunks,
							    this.bezierCanvasHandler.getMillimeterPerUnit(),
							    !merge_meshes        // export as single mesh?
							  );
	
	showLoadingBar( "exportOBJ_cancelHandler()" );

    }
    
    if( divisibleOBJBuilder.isInterrupted() ) {

	divisibleOBJBuilder = null;
	hideLoadingBar();
	return;

    }b

    //console.log( "Next chunk (" + divisibleSTLBuilder.chunkResults.length + ")." );
    displayProcessState( divisibleOBJBuilder.getProcessedChunkCount(),
			 divisibleOBJBuilder.getProjectedChunkCount() 
		       );

    var hasNextChunk = divisibleOBJBuilder.processNextChunk();
    
    if( hasNextChunk ) 
	window.setTimeout( "exportOBJ();", 100 );
    else {
	
	//window.alert( "Finished. " + divisibleSTLBuilder.chunkResults.length + " chunks calculated." );
	displayProcessState( divisibleOBJBuilder.getProcessedChunkCount(), 
			     divisibleOBJBuilder.getProjectedChunkCount() 
			   );
	divisibleOBJBuilder.saveOBJResult();
	divisibleOBJBuilder = null;
	
	hideLoadingBar();

    }
    
}

function exportOBJ_cancelHandler() {
    if( divisibleOBJBuilder ) {
	
	//messageBox.show( "<br/><br/>Interrupted ...<br/><br/>Please wait for process to terminate.<br/>\n" );
	divisibleOBJBuilder.interrupt();	
	
    }
}



/*
function _exportOBJ_simple() {

    var meshes        = getPreviewMeshes();
    var filename      = null;
    if( document.forms['obj_form'].elements['obj_filename'] )
	filename =  document.forms['obj_form'].elements['obj_filename'].value;
    else
	filename = "mesh.stl";

    OBJBuilder.saveOBJ( meshes, filename, function() { } );

}
*/

/**
 * This script adds the message box/layer to the DOM and initializes
 * the process listener.
 **/

var messageBox = new IKRS.MessageBox( "message_layer" );

function displayProcessState( currentStep, maxStep ) {
    var pct = ( (1.0 * currentStep) / maxStep ) * 100;
    pct = pct.toFixed( 2 );
    document.getElementById( "process_div" ).innerHTML = "" + currentStep + "/" + maxStep + " [" + pct + "%]";
}


function showLoadingBar( buttonHandler ) {
    
    if( !buttonHandler )
	buttonHandler = "hideLoadingBar()";
    
    messageBox.setSize( 300, 180 );
    messageBox.show( 
        "<br/><br/>Loading ...<br/>\n" +
            "<br/>\n" +
            "<span id=\"loading_span\"></span><br/>\n" +
            "<div id=\"process_div\">X</div><br/>\n" +
            "<br/><button onclick=\"" + buttonHandler + "\"" + (buttonHandler?"":" disabled") + ">Cancel</button>" 
    );

    startLoadingAnimation();

}

function hideLoadingBar() {

    // !!! FIX THIS !!!
    // THIS SOMEHOW MAKES THE PROGRESS INDICATOR TO FAIL!
    //stopLoadingAnimation();
    
    
     messageBox.hide();
}


var loadingAnimationKey = null;
var loadingAnimationElements = [ '|', '/', '&ndash;', '\\' ];
var loadingAnimationPointer  = 0;
function startLoadingAnimation() {
      if( !loadingAnimationKey )
          loadingAnimationKey = window.setInterval( "startLoadingAnimation();", 250 );

      document.getElementById("loading_span").innerHTML = loadingAnimationElements[loadingAnimationPointer];
      //displayProcessState( stlProcessListener.getCurrentStep(), stlProcessListener.getTotalStepCount() );
      loadingAnimationPointer = (loadingAnimationPointer + 1) % loadingAnimationElements.length;
}



function stopLoadingAnimation() {
      if( loadingAnimationKey )
           window.clearInterval( loadingAnimationKey );

      loadingAnimationKey;
}

function order_print() {
    var html = 
	"<br/>\n" +
	"<h2 style=\"color: #000000;\">Featured by YOUin3D.com</h2>\n" +
	// "<img src=\"img/YOUin3D.com_A.png\" width=\"131\" height=\"118\" alt=\"Featured by YOUin3D.com\" /><br/>\n" +
	"<img src=\"img/YOUin3D.com_B.png\" width=\"92\" height=\"79\" alt=\"Featured by YOUin3D.com\" /><br/>\n" +
	"<br/>\n" +
	"There are some tiny Hackerspaces in Berlin.<br/>\n" +
	"Some have a 3D printer.<br/>\n" + 
	//"The guys, girls, me and the cyborgs there will probably help<br/>\n" +
	//"you printing your designed dildo.<br/>\n" +
	"You can try this one:\n" +
	"<div style=\"text-align: left; margin-left: 125px;\">\n" +
	"<ul>\n" +
	"  <li>\n" +
	"    <a href=\"http://3d-druck-shop.youin3d.com/online-kaufen/3d-drucker-reprap-zubehoer-einzelteile-bausaetze-kits-ersatzteile/dildogenerator-gussform-3d-gedruckte-gussform-und-silikon-fuer-3d-druck-sexspielzeug/\" target=\"_blank\">Order without silicone (just the mold)</a>\n" +
	"    </a>\n" +
	"  </li>\n" +
	"  <li>\n" +
	"    <a href=\"http://3d-druck-shop.youin3d.com/online-kaufen/3d-drucker-reprap-zubehoer-einzelteile-bausaetze-kits-ersatzteile/dildogenerator-diy-kit-silikon-fuer-3d-druck-sexspielzeug-gussform/\" target=\"_blank\">Order with silicone</a>\n" +
	"  </li>\n" +
	"</ul>\n" +
	//"Many have a 3D printer.<br/>\n" + 
	"The guys, girls, me and the cyborgs there will support<br/>\n" +
	"you printing your designed dildo.<br/>\n" +
	"<br/>\n" +
	"</div>\n" +
	"<br/>\n"+
	"<span style=\"font-size: 10pt;\">Thanks for all the help, fun and the cool time!</span><br/>\n" +
	//"I love you all.<br/>\n" +
	"<br/>\n"+
	"<br/><button onclick=\"messageBox.hide();\">Close</button>" 

    messageBox.show( html, 
		     
		     // Make this message box extra large
		     IKRS.MessageBox.DEFAULT_WIDTH*2, 
		     IKRS.MessageBox.DEFAULT_HEIGHT*2.5 
		   );
}

function open_faqs() {
    window.open( "faq.html",
		 "dildogenerator_faq",
		 "height=480,width=640,location=yes,toolbar=no,dependent=no,scrollbars=yes"
	       );
}

function open_legal_notice() {
    window.open( "legal_notice.html",
		 "dildogenerator_legal_notice",
		 "height=480,width=640,location=yes,toolbar=no,dependent=no,scrollbars=yes"
	       );
}

function setStatus( msg ) {
    var status_bar = document.getElementById("status_bar");
    
    // Early integrated versions might not have a status bar
    if( !status_bar )
	return false;
    
    if( msg )
	status_bar.innerHTML = "$status: " + msg;
    else
	status_bar.innerHTML = "$status: &lt;ready&gt;";
}

function roundToDigits( number, digits, enforceInvisibleDigits ) {
    var magnitude = Math.pow( 10, digits ); // This could be LARGE :/
    number = Math.round( number * magnitude );
    var result = "" + (number / magnitude);
    var index = result.lastIndexOf(".");
    if( index == -1 ) {	
	//result += ".0";
	index = result.length;
    }
    var digitsAfterPoint = result.length - index - 1;
    var digitsMissing    = enforceInvisibleDigits - digitsAfterPoint;
    while( digitsMissing-- > 0 )
	result += "&nbsp;";
    
    return result;
};
