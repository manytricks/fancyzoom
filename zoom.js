// zoom.js - based on FancyZoom.js v1.1 - http://www.fancyzoom.com
//
// Copyright (c) 2008 Cabel Sasser / Panic Inc
// All rights reserved.
//
// Modified (and dumbed down) by Peter Maurer / Many Tricks
// 
// Instructions: Include zoom.js in page, call setupZoom() in onLoad. That's it!
//               Any <a href> links to images will be updated to zoom inline.
//               Add rel="nozoom" to your <a href> to disable zooming for an image.
// 
// Redistribution and use of this effect in source form, with or without modification,
// are permitted provided that the following conditions are met:
// 
// * USE OF SOURCE ON COMMERCIAL (FOR-PROFIT) WEBSITE REQUIRES ONE-TIME LICENSE FEE PER DOMAIN.
//   Reasonably priced! Visit www.fancyzoom.com for licensing instructions. Thanks!
//
// * Non-commercial (personal) website use is permitted without license/payment!
//
// * Redistribution of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
//
// * Redistribution of source code and derived works cannot be sold without specific
//   written prior permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
// PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
// LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var useDarkTheme = false;							// Display the close widget and the caption with a dark background and a white border
var includeCaption = true;							// Turn on the "caption" feature, and write out the caption HTML
var zoomTime = 5;									// Milliseconds between frames of zoom animation
var zoomSteps = 15;									// Number of zoom animation frames
var includeFade = 1;								// Set to 1 to fade the image in / out as it zooms
var minBorder = 90;									// Amount of padding between large, scaled down images, and the window edges
var shadowSettings = '0px 3px 15px rgba(0, 0, 0, ';	// Blur, radius, color of shadow for compatible browsers
var shadowMaximumOpacity = .3;						// Shadow alpha

var zoomImagesURI   = '/images/zoom/';				// Location of the zoom and shadow images

// Init. Do not add anything below this line, unless it's something awesome.

var myWidth = 0, myHeight = 0, myScroll = 0; myScrollWidth = 0; myScrollHeight = 0;
var zoomOpen = false, preloadAngle = 0, preloadActive = false, preloadTime = 0, imgPreload = new Image();
var preloadAnimTimer = 0;

var zoomActive = new Array(); var zoomTimer  = new Array(); 
var zoomOrigW  = new Array(); var zoomOrigH  = new Array();
var zoomOrigX  = new Array(); var zoomOrigY  = new Array();

var zoomBoxID = "ZoomBox";
var zoomBoxImageID = "ZoomBoxImage";
var zoomSpinContainerID = "ZoomSpin";
var zoomSpinImageID = "ZoomSpinImage";
var zoomCloseWidgetID = "ZoomClose";
var zoomCaptionInnerDivID = "ZoomCaptionInner";
var zoomCaptionOuterDivID = "ZoomCaptionOuter";

if (navigator.userAgent.indexOf("MSIE") != -1) {
	var browserIsIE = true;
}

// Zoom: Setup The Page! Called in your <body>'s onLoad handler.

function setupZoom() {

	// Inject Javascript functions into hrefs pointing to images, one by one!
	// Skip any href that contains a rel="nozoom" tag.

	if (! document.getElementsByTagName) {
		return;
	}
	var links = document.getElementsByTagName("a");
	for (i = 0; i < links.length; i++) {
		if (links[i].getAttribute("href")) {
			if (links[i].getAttribute("href").search(/(.*)\.(jpg|jpeg|gif|png|bmp|tif|tiff)/gi) != -1) {
				if (links[i].getAttribute("rel") != "nozoom") {
					links[i].onclick = function (event) { return zoomClick(this, event); };
					links[i].onmouseover = function () { zoomPreload(this); };
				}
			}
		}
	}

	var inBody = document.getElementsByTagName("body").item(0);
	
	// WAIT SPINNER
	
	var inSpinContainer = document.createElement("div");
	inSpinContainer.setAttribute('id', zoomSpinContainerID);
	inSpinContainer.style.position = 'absolute';
	inSpinContainer.style.left = '10px';
	inSpinContainer.style.top = '10px';
	inSpinContainer.style.visibility = 'hidden';
	inSpinContainer.style.zIndex = '525';
	inBody.insertBefore(inSpinContainer, inBody.firstChild);
	
	var inSpinImage = document.createElement("img");
	inSpinImage.setAttribute('id', zoomSpinImageID);
	inSpinImage.setAttribute('src', zoomImagesURI+'spin.png');
	inSpinImage.style.width = '50px';
	inSpinImage.style.height = '50px';
	inSpinContainer.appendChild(inSpinImage);
	
	// ZOOM IMAGE
	//
	// <div id="ZoomBox">
	//   <a href="javascript:zoomOut();"><img src="/images/spacer.gif" id="ZoomBoxImage" border="0"></a> <!-- THE IMAGE -->
	//   <div id="ZoomClose">
	//     <a href="javascript:zoomOut();"><img src="/images/close.png" width="30" height="30" border="0"></a>
	//   </div>
	// </div>
	
	zoomBox = document.createElement("div");
	zoomBox.setAttribute('id', zoomBoxID);
	
	zoomBox.style.position = 'absolute'; 
	zoomBox.style.left = '10px';
	zoomBox.style.top = '10px';
	zoomBox.style.visibility = 'hidden';
	zoomBox.style.zIndex = '499';
	
	inBody.insertBefore(zoomBox, inSpinContainer.nextSibling);
	
	zoomBoxImage = document.createElement("img");
	zoomBoxImage.onclick = function (event) { zoomOut(this, event); return false; };	
	zoomBoxImage.setAttribute('src', zoomImagesURI+'spacer.gif');
	zoomBoxImage.setAttribute('id', zoomBoxImageID);
	zoomBoxImage.setAttribute('border', '0');
	// zoomBoxImage.setAttribute('onMouseOver', 'zoomMouseOver();')
	// zoomBoxImage.setAttribute('onMouseOut', 'zoomMouseOut();')
	zoomBoxImage.style.boxShadow = shadowSettings+'0.0)';
	zoomBoxImage.style.display = 'block';
	zoomBoxImage.style.width = '10px';
	zoomBoxImage.style.height = '10px';
	zoomBoxImage.style.borderRadius = '5px';
	zoomBoxImage.style.cursor = 'pointer'; // -webkit-zoom-out?
	zoomBox.appendChild(zoomBoxImage);

	var inCloseWidget = document.createElement("div");
	inCloseWidget.setAttribute('id', zoomCloseWidgetID);
	inCloseWidget.style.position = 'absolute';
	
	// In MSIE, we need to put the close box inside the image.
	// It's 2008 and I'm having to do a browser detect? Sigh.
	if (browserIsIE) {
		inCloseWidget.style.left = '-1px';
		inCloseWidget.style.top = '0px';	
	} else {
		inCloseWidget.style.left = '-15px';
		inCloseWidget.style.top = '-14px';
	}
	
	inCloseWidget.style.visibility = 'hidden';
	zoomBox.appendChild(inCloseWidget);
		
	var inCloseWidgetImage = document.createElement("img");
	inCloseWidgetImage.onclick = function (event) { zoomOut(this, event); return false; };	
	inCloseWidgetImage.setAttribute('src',zoomImagesURI+(useDarkTheme ? 'close_hud.png' : 'close.png'));		
	inCloseWidgetImage.setAttribute('width','30');
	inCloseWidgetImage.setAttribute('height','30');
	inCloseWidgetImage.setAttribute('border','0');
	inCloseWidgetImage.style.cursor = 'pointer';		
	inCloseWidget.appendChild(inCloseWidgetImage);
	
	if (includeCaption) {
		var inCapOuterDiv = document.createElement("div");
		inCapOuterDiv.setAttribute('id', zoomCaptionOuterDivID);
		inCapOuterDiv.style.position = 'absolute'; 		
		inCapOuterDiv.style.visibility = 'hidden';
		inCapOuterDiv.style.marginLeft = 'auto';
		inCapOuterDiv.style.marginRight = 'auto';
		inCapOuterDiv.style.zIndex = '501';

		inBody.insertBefore(inCapOuterDiv, zoomBox.nextSibling);
		
		var inCapInnerDiv = document.createElement("div");
		inCapInnerDiv.setAttribute('id', zoomCaptionInnerDivID);
		if (useDarkTheme) {
			inCapInnerDiv.style.padding = '2px 8px';
			inCapInnerDiv.style.boxShadow = '0px 1px 3px rgba(0, 0, 0, 0.6)';
			inCapInnerDiv.style.border = '2px solid #fff';
		} else {
			inCapInnerDiv.style.padding = '4px 10px';
		}
		inCapInnerDiv.style.borderRadius = '5px';
		inCapInnerDiv.style.background = 'rgba(0, 0, 0, 0.8)';
		inCapInnerDiv.style.fontWeight = '600';
		inCapInnerDiv.style.color = '#ffffff';
		inCapInnerDiv.style.textShadow = '0px 1px 3px #000000';
		inCapInnerDiv.style.whiteSpace = 'nowrap';
		inCapOuterDiv.appendChild(inCapInnerDiv);
	}
}

// Zoom: Load an image into an image object. When done loading, function sets preloadActive to false,
// so other bits know that they can proceed with the zoom.
// Preloaded image is stored in imgPreload and swapped out in the zoom function.

function zoomPreload(from) {

	var theimage = from.getAttribute("href");

	// Only preload if we have to, i.e. the image isn't this image already

	if (imgPreload.src.indexOf(from.getAttribute("href").substr(from.getAttribute("href").lastIndexOf("/"))) == -1) {
		preloadActive = true;
		imgPreload = new Image();

		// Set a function to fire when the preload is complete, setting flags along the way.

		imgPreload.onload = function() {
			preloadActive = false;
		}

		// Load it!
		imgPreload.src = theimage;
	}
}

// Zoom: Start the preloading animation cycle.

function preloadAnimStart() {
	preloadTime = new Date();
	document.getElementById(zoomSpinContainerID).style.left = ((myWidth / 2) - 25) + 'px';
	document.getElementById(zoomSpinContainerID).style.top = ((myHeight / 2) + myScroll - 25) + 'px';
	document.getElementById(zoomSpinContainerID).style.visibility = "visible";	
	preloadAngle = 0;
	document.getElementById(zoomSpinImageID).style.transform = "none";
	preloadAnimTimer = setInterval("preloadAnim()", 20);
}

// Zoom: Display and ANIMATE the jibber-jabber widget. Once preloadActive is false, bail and zoom it up!

function preloadAnim(from) {
	if (preloadActive != false) {
		preloadAngle++;
		if (preloadAngle > 35) {
			preloadAngle = 0;
			document.getElementById(zoomSpinImageID).style.transform = "none";
		} else {
			document.getElementById(zoomSpinImageID).style.transform = 'rotate('+(preloadAngle * 10)+'deg)';
		}
	} else {
		document.getElementById(zoomSpinContainerID).style.visibility = "hidden";    
		clearInterval(preloadAnimTimer);
		preloadAnimTimer = 0;
		zoomIn(preloadFrom);
	}
}

// ZOOM CLICK: We got a click! Should we do the zoom? Or wait for the preload to complete?
// todo?: Double check that imgPreload src = clicked src

function zoomClick(from, evt) {

	var shift = getShift(evt);

	// Check for Command / Alt key. If pressed, pass them through -- don't zoom!
	if (! evt && window.event && (window.event.metaKey || window.event.altKey)) {
		return true;
	} else if (evt && (evt.metaKey|| evt.altKey)) {
		return true;
	}

	// Get browser dimensions
	getSize();

	// If preloading still, wait, and display the spinner.
	if (preloadActive == true) {
		// But only display the spinner if it's not already being displayed!
		if (preloadAnimTimer == 0) {
			preloadFrom = from;
			preloadAnimStart();	
		}
	} else {
		// Otherwise, we're loaded: do the zoom!
		zoomIn(from, shift);
	}
	
	return false;
	
}

// Zoom: Move an element in to endH endW, using zoomHost as a starting point.
// "from" is an object reference to the href that spawned the zoom.

function zoomIn(from, shift) {

	zoomBoxImage.src = from.getAttribute("href");

	// Determine the zoom settings from where we came from, the element in the <a>.
	// If there's no element in the <a>, or we can't get the width, make stuff up

	if (from.childNodes[0].width) {
		startW = from.childNodes[0].width;
		startH = from.childNodes[0].height;
		startPos = findElementPos(from.childNodes[0]);
	} else {
		startW = 50;
		startH = 12;
		startPos = findElementPos(from);
	}

	hostX = startPos[0];
	hostY = startPos[1];

	// Make up for a scrolled containing div.
	// TODO: This HAS to move into findElementPos.
	
	if (document.getElementById('scroller')) {
		hostX = hostX - document.getElementById('scroller').scrollLeft;
	}

	// Determine the target zoom settings from the preloaded image object

	endW = imgPreload.width;
	endH = imgPreload.height;
	var pixelRatioAttribute = from.getAttribute("data-zoomimagepixelratio");
	if ((pixelRatioAttribute) || (pixelRatioAttribute = from.getAttribute("data-fancyzoomresolution"))) {
		var pixelRatio = parseFloat(pixelRatioAttribute);
		if (pixelRatio>1.1) {
			endW = Math.round(endW / pixelRatio);
			endH = Math.round(endH / pixelRatio);
		}
	}

	// Start! But only if we're not zooming already!

	if (zoomActive[zoomBoxImageID] != true) {

		// Clear everything out just in case something is already open

		if (! browserIsIE) {
		
			// Wipe timer if shadow is fading in still
			if (fadeActive[zoomBoxImageID]) {
				clearInterval(fadeTimer[zoomBoxImageID]);
				fadeActive[zoomBoxImageID] = false;
				fadeTimer[zoomBoxImageID] = false;			
			}
			
			document.getElementById(zoomBoxImageID).style.boxShadow = shadowSettings + '0.0)';			
		}
		
		document.getElementById(zoomCloseWidgetID).style.visibility = "hidden";     

		// Setup the CAPTION, if existing. Hide it first, set the text.

		if (includeCaption) {
			document.getElementById(zoomCaptionOuterDivID).style.visibility = "hidden";
			if (from.getAttribute('title') && includeCaption) {
				// Yes, there's a caption, set it up
				document.getElementById(zoomCaptionInnerDivID).innerHTML = from.getAttribute('title');
			} else {
				document.getElementById(zoomCaptionInnerDivID).innerHTML = "";
			}
		}

		// Store original position in an array for future zoomOut.

		zoomOrigW[zoomBoxImageID] = startW;
		zoomOrigH[zoomBoxImageID] = startH;
		zoomOrigX[zoomBoxImageID] = hostX;
		zoomOrigY[zoomBoxImageID] = hostY;

		// Now set the starting dimensions

		zoomBoxImage.style.width = startW + 'px';
		zoomBoxImage.style.height = startH + 'px';
		zoomBox.style.left = hostX + 'px';
		zoomBox.style.top = hostY + 'px';

		// Show the zooming image container, make it invisible

		if (includeFade == 1) {
			setOpacity(0, zoomBoxID);
		}
		zoomBox.style.visibility = "visible";

		// If it's too big to fit in the window, shrink the width and height to fit (with ratio).

		sizeRatio = endW / endH;
		if (endW > myWidth - minBorder) {
			endW = myWidth - minBorder;
			endH = endW / sizeRatio;
		}
		if (endH > myHeight - minBorder) {
			endH = myHeight - minBorder;
			endW = endH * sizeRatio;
		}

		zoomChangeX = ((myWidth - endW) * 0.5) - hostX;
		zoomChangeY = myScroll + ((myHeight - endH) * 0.4) - hostY;	// slightly above center (use 0.25 for a macOS-style center)
		zoomChangeW = endW - startW;
		zoomChangeH = endH - startH;
		
		// Shift key?
	
		if (shift) {
			tempSteps = zoomSteps * 7;
		} else {
			tempSteps = zoomSteps;
		}

		// Setup Zoom

		zoomCurrent = 0;

		// Setup Fade with Zoom, If Requested

		if (includeFade == 1) {
			fadeCurrent = 0;
			fadeAmount = (0 - 100) / tempSteps;
		} else {
			fadeAmount = 0;
		}

		// Do It!
		
		zoomTimer[zoomBoxImageID] = setInterval("zoomElement('"+zoomBoxID+"', '"+zoomBoxImageID+"', "+zoomCurrent+", "+startW+", "+zoomChangeW+", "+startH+", "+zoomChangeH+", "+hostX+", "+zoomChangeX+", "+hostY+", "+zoomChangeY+", "+tempSteps+", "+includeFade+", "+fadeAmount+", 'didZoomIn()')", zoomTime);		
		zoomActive[zoomBoxImageID] = true; 
	}
}

// Zoom it back out.

function zoomOut(from, evt) {

	// Get shift key status.
	// IE events don't seem to get passed through the function, so grab it from the window.

	if (getShift(evt)) {
		tempSteps = zoomSteps * 7;
	} else {
		tempSteps = zoomSteps;
	}	

	// Check to see if something is happening/open
  
	if (zoomActive[zoomBoxImageID] != true) {

		// First, get rid of the shadow if necessary.

		if (! browserIsIE) {
		
			// Wipe timer if shadow is fading in still
			if (fadeActive[zoomBoxImageID]) {
				clearInterval(fadeTimer[zoomBoxImageID]);
				fadeActive[zoomBoxImageID] = false;
				fadeTimer[zoomBoxImageID] = false;			
			}
			
			document.getElementById(zoomBoxImageID).style.boxShadow = shadowSettings + '0.0)';			
		}

		// ..and the close box...

		document.getElementById(zoomCloseWidgetID).style.visibility = "hidden";

		// ...and the caption if necessary!

		if (includeCaption && document.getElementById(zoomCaptionInnerDivID).innerHTML != "") {
			// fadeElementSetup(zoomCaptionOuterDivID, 100, 0, 5, 1);
			document.getElementById(zoomCaptionOuterDivID).style.visibility = "hidden";
		}

		// Now, figure out where we came from, to get back there

		startX = parseInt(zoomBox.style.left);
		startY = parseInt(zoomBox.style.top);
		startW = zoomBoxImage.width;
		startH = zoomBoxImage.height;
		zoomChangeX = zoomOrigX[zoomBoxImageID] - startX;
		zoomChangeY = zoomOrigY[zoomBoxImageID] - startY;
		zoomChangeW = zoomOrigW[zoomBoxImageID] - startW;
		zoomChangeH = zoomOrigH[zoomBoxImageID] - startH;

		// Setup Zoom

		zoomCurrent = 0;

		// Setup Fade with Zoom, If Requested

		if (includeFade == 1) {
			fadeCurrent = 0;
			fadeAmount = (100 - 0) / tempSteps;
		} else {
			fadeAmount = 0;
		}

		// Do It!

		zoomTimer[zoomBoxImageID] = setInterval("zoomElement('"+zoomBoxID+"', '"+zoomBoxImageID+"', "+zoomCurrent+", "+startW+", "+zoomChangeW+", "+startH+", "+zoomChangeH+", "+startX+", "+zoomChangeX+", "+startY+", "+zoomChangeY+", "+tempSteps+", "+includeFade+", "+fadeAmount+", 'didZoomOut()')", zoomTime);	
		zoomActive[zoomBoxImageID] = true;
	}
}

// Finished Zooming In

function didZoomIn() {

	// Note that it's open
  
	zoomOpen = true;

	if (! browserIsIE) {
		// do a fade of the modern shadow
		fadeElementSetup(zoomBoxImageID, 0, shadowMaximumOpacity, 5, 0, "shadow");
	}
	
	// Position and display the CAPTION, if existing
  
	if (includeCaption && document.getElementById(zoomCaptionInnerDivID).innerHTML != "") {
		// setOpacity(0, zoomCaptionOuterDivID);
		zoomcapd = document.getElementById(zoomCaptionOuterDivID);
		zoomcapd.style.top = parseInt(zoomBox.style.top) + (zoomBox.offsetHeight + 15) + 'px';
		zoomcapd.style.left = (myWidth / 2) - (zoomcapd.offsetWidth / 2) + 'px';
		zoomcapd.style.visibility = "visible";
		// fadeElementSetup(zoomCaptionOuterDivID, 0, 100, 5);
	}   
	
	// Display Close Box (fade it if it's not IE)

	if (!browserIsIE) setOpacity(0, zoomCloseWidgetID);
	document.getElementById(zoomCloseWidgetID).style.visibility = "visible";
	if (!browserIsIE) fadeElementSetup(zoomCloseWidgetID, 0, 100, 5);

	// Get keypresses
	document.onkeypress = getKey;
	
}

// Finished Zooming Out

function didZoomOut() {

	// No longer open
  
	zoomOpen = false;

	// Clear stuff out, clean up

	zoomOrigH[zoomBoxImageID] = "";
	zoomOrigW[zoomBoxImageID] = "";
	document.getElementById(zoomBoxID).style.visibility = "hidden";
	zoomActive[zoomBoxImageID] == false;

	// Stop getting keypresses

	document.onkeypress = null;

}

// Actually zoom the element

function zoomElement(zoomBox, zoomBoxImageID, zoomCurrent, zoomStartW, zoomChangeW, zoomStartH, zoomChangeH, zoomStartX, zoomChangeX, zoomStartY, zoomChangeY, zoomSteps, includeFade, fadeAmount, execWhenDone) {

	// console.log("Zooming Step #"+zoomCurrent+ " of "+zoomSteps+" (zoom " + zoomStartW + "/" + zoomChangeW + ") (zoom " + zoomStartH + "/" + zoomChangeH + ")  (zoom " + zoomStartX + "/" + zoomChangeX + ")  (zoom " + zoomStartY + "/" + zoomChangeY + ") Fade: "+fadeAmount);
    
	// Test if we're done, or if we continue

	if (zoomCurrent == (zoomSteps + 1)) {
		zoomActive[zoomBoxImageID] = false;
		clearInterval(zoomTimer[zoomBoxImageID]);

		if (execWhenDone != "") {
			eval(execWhenDone);
		}
	} else {
	
		// Do the Fade!
	  
		if (includeFade == 1) {
			if (fadeAmount < 0) {
				setOpacity(Math.abs(zoomCurrent * fadeAmount), zoomBox);
			} else {
				setOpacity(100 - (zoomCurrent * fadeAmount), zoomBox);
			}
		}
	  
		// Calculate this step's difference, and move it!
		
		moveW = cubicInOut(zoomCurrent, zoomStartW, zoomChangeW, zoomSteps);
		moveH = cubicInOut(zoomCurrent, zoomStartH, zoomChangeH, zoomSteps);
		moveX = cubicInOut(zoomCurrent, zoomStartX, zoomChangeX, zoomSteps);
		moveY = cubicInOut(zoomCurrent, zoomStartY, zoomChangeY, zoomSteps);
	
		document.getElementById(zoomBox).style.left = moveX + 'px';
		document.getElementById(zoomBox).style.top = moveY + 'px';
		zoomBoxImage.style.width = moveW + 'px';
		zoomBoxImage.style.height = moveH + 'px';
	
		zoomCurrent++;
		
		clearInterval(zoomTimer[zoomBoxImageID]);
		zoomTimer[zoomBoxImageID] = setInterval("zoomElement('"+zoomBox+"', '"+zoomBoxImageID+"', "+zoomCurrent+", "+zoomStartW+", "+zoomChangeW+", "+zoomStartH+", "+zoomChangeH+", "+zoomStartX+", "+zoomChangeX+", "+zoomStartY+", "+zoomChangeY+", "+zoomSteps+", "+includeFade+", "+fadeAmount+", '"+execWhenDone+"')", zoomTime);
	}
}

// Zoom Utility: Get Key Press when image is open, and act accordingly

function getKey(evt) {
	if (! evt) {
		theKey = event.keyCode;
	} else {
		theKey = evt.keyCode;
	}

	if (theKey == 27) { // ESC
		zoomOut(this, evt);
	}
}

////////////////////////////
//
// FADE Functions
//

function fadeOut(elem) {
	if (elem.id) {
		fadeElementSetup(elem.id, 100, 0, 10);
	}
}

function fadeIn(elem) {
	if (elem.id) {
		fadeElementSetup(elem.id, 0, 100, 10);	
	}
}

// Fade: Initialize the fade function

var fadeActive = new Array();
var fadeQueue  = new Array();
var fadeTimer  = new Array();
var fadeClose  = new Array();
var fadeMode   = new Array();

function fadeElementSetup(elementID, fdStart, fdEnd, fdSteps, fdClose, fdMode) {

	// alert("Fading: "+elementID+" Steps: "+fdSteps+" Mode: "+fdMode);

	if (fadeActive[elementID] == true) {
		// Already animating, queue up this command
		fadeQueue[elementID] = new Array(elementID, fdStart, fdEnd, fdSteps);
	} else {
		fadeSteps = fdSteps;
		fadeCurrent = 0;
		fadeAmount = (fdStart - fdEnd) / fadeSteps;
		fadeTimer[elementID] = setInterval("fadeElement('"+elementID+"', '"+fadeCurrent+"', '"+fadeAmount+"', '"+fadeSteps+"')", 15);
		fadeActive[elementID] = true;
		fadeMode[elementID] = fdMode;
		
		if (fdClose == 1) {
			fadeClose[elementID] = true;
		} else {
			fadeClose[elementID] = false;
		}
	}
}

// Fade: Do the fade. This function will call itself, modifying the parameters, so
// many instances can run concurrently. Can fade using opacity, or fade using a box-shadow.

function fadeElement(elementID, fadeCurrent, fadeAmount, fadeSteps) {

	if (fadeCurrent == fadeSteps) {

		// We're done, so clear.

		clearInterval(fadeTimer[elementID]);
		fadeActive[elementID] = false;
		fadeTimer[elementID] = false;

		// Should we close it once the fade is complete?

		if (fadeClose[elementID] == true) {
			document.getElementById(elementID).style.visibility = "hidden";
		}

		// Hang on.. did a command queue while we were working? If so, make it happen now

		if (fadeQueue[elementID] && fadeQueue[elementID] != false) {
			fadeElementSetup(fadeQueue[elementID][0], fadeQueue[elementID][1], fadeQueue[elementID][2], fadeQueue[elementID][3]);
			fadeQueue[elementID] = false;
		}
	} else {

		fadeCurrent++;
		
		// Now actually do the fade adjustment.
		
		if (fadeMode[elementID] == "shadow") {

			// Do a special fade on the webkit-box-shadow of the object
		
			if (fadeAmount < 0) {
				document.getElementById(elementID).style.boxShadow = shadowSettings + (Math.abs(fadeCurrent * fadeAmount)) + ')';
			} else {
				document.getElementById(elementID).style.boxShadow = shadowSettings + (100 - (fadeCurrent * fadeAmount)) + ')';
			}
			
		} else {
		
			// Set the opacity depending on if we're adding or subtracting (pos or neg)
			
			if (fadeAmount < 0) {
				setOpacity(Math.abs(fadeCurrent * fadeAmount), elementID);
			} else {
				setOpacity(100 - (fadeCurrent * fadeAmount), elementID);
			}
		}

		// Keep going, and send myself the updated variables
		clearInterval(fadeTimer[elementID]);
		fadeTimer[elementID] = setInterval("fadeElement('"+elementID+"', '"+fadeCurrent+"', '"+fadeAmount+"', '"+fadeSteps+"')", 15);
	}
}

////////////////////////////
//
// UTILITY functions
//

// Utility: Set the opacity, compatible with a number of browsers. Value from 0 to 100.

function setOpacity(opacity, elementID) {

	var object = document.getElementById(elementID).style;

	// If it's 100, set it to 99 for Firefox.

	if (navigator.userAgent.indexOf("Firefox") != -1) {
		if (opacity == 100) { opacity = 99.9999; } // This is majorly awkward
	}

	// Multi-browser opacity setting

	object.filter = "alpha(opacity=" + opacity + ")"; // IE/Win
	object.opacity = (opacity / 100);                 // Safari 1.2, Firefox+Mozilla

}

// Utility: Math functions for animation calucations - From http://www.robertpenner.com/easing/
//
// t = time, b = begin, c = change, d = duration
// time = current frame, begin is fixed, change is basically finish - begin, duration is fixed (frames),

function linear(t, b, c, d)
{
	return c*t/d + b;
}

function sineInOut(t, b, c, d)
{
	return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
}

function cubicIn(t, b, c, d) {
	return c*(t/=d)*t*t + b;
}

function cubicOut(t, b, c, d) {
	return c*((t=t/d-1)*t*t + 1) + b;
}

function cubicInOut(t, b, c, d)
{
	if ((t/=d/2) < 1) return c/2*t*t*t + b;
	return c/2*((t-=2)*t*t + 2) + b;
}

function bounceOut(t, b, c, d)
{
	if ((t/=d) < (1/2.75)){
		return c*(7.5625*t*t) + b;
	} else if (t < (2/2.75)){
		return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
	} else if (t < (2.5/2.75)){
		return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
	} else {
		return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
	}
}


// Utility: Get the size of the window, and set myWidth and myHeight
// Credit to quirksmode.org

function getSize() {

	// Window Size

	if (self.innerHeight) { // Everyone but IE
		myWidth = window.innerWidth;
		myHeight = window.innerHeight;
		myScroll = window.pageYOffset;
	} else if (document.documentElement && document.documentElement.clientHeight) { // IE6 Strict
		myWidth = document.documentElement.clientWidth;
		myHeight = document.documentElement.clientHeight;
		myScroll = document.documentElement.scrollTop;
	} else if (document.body) { // Other IE, such as IE7
		myWidth = document.body.clientWidth;
		myHeight = document.body.clientHeight;
		myScroll = document.body.scrollTop;
	}

	// Page size w/offscreen areas

	if (window.innerHeight && window.scrollMaxY) {	
		myScrollWidth = document.body.scrollWidth;
		myScrollHeight = window.innerHeight + window.scrollMaxY;
	} else if (document.body.scrollHeight > document.body.offsetHeight) { // All but Explorer Mac
		myScrollWidth = document.body.scrollWidth;
		myScrollHeight = document.body.scrollHeight;
	} else { // Explorer Mac...would also work in Explorer 6 Strict, Mozilla and Safari
		myScrollWidth = document.body.offsetWidth;
		myScrollHeight = document.body.offsetHeight;
	}
}

// Utility: Get Shift Key Status
// IE events don't seem to get passed through the function, so grab it from the window.

function getShift(evt) {
	var shift = false;
	if (! evt && window.event) {
		shift = window.event.shiftKey;
	} else if (evt) {
		shift = evt.shiftKey;
		if (shift) evt.stopPropagation(); // Prevents Firefox from doing shifty things
	}
	return shift;
}

// Utility: Find the Y position of an element on a page. Return Y and X as an array

function findElementPos(elemFind) {
	var elemX = 0;
	var elemY = 0;
	do {
		elemX += elemFind.offsetLeft;
		elemY += elemFind.offsetTop;
	} while ( elemFind = elemFind.offsetParent )

	return Array(elemX, elemY);
}
