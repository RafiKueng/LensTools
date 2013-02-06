/*****************************************************************************
 ExtremalPoint
 @class represents an extremalpoint

 x,y:    abs. coordinates
 dx, dy  rel coordinates
 dr, dphi  rel coordinates in complex

 type
 isRoot
 isExpanded

 parent
 sibling
 child1
 child2

 ******************************************************************************/
/*(function() {*/

/**
 *	creates n new point 
 *	@constructor
 * 
 *	@param {Number} x the x coodrinate
 *  @param {Number} y the y coordinate
 * 	@param {Object} [parent=None] the parent object
 */
function ExtremalPoint(x, y, depth, type) {
	
	this.idnr = LMT.model.NrOf.ExtremalPoints++;
	
  this.x = parseInt(x) || 0;
  this.y = parseInt(y) || 0;

	this.depth = depth;

	this.type = type;
	this.wasType = "";

  this.isRoot = true;	//will be set by init
  this.isExpanded = false;	//will be set by init
  this.childrenInsideEachOther = false; //
	
  this.parent = null;	//will be set by init
	this.child1 = null;
	this.child2 = null;
	this.sibling = null;
	
	this.contour = null;
	
	//the svg objects references
	this.line = null;
	this.circle = null;
	
	this.layer = LMT.ui.svg.layer.extremalpoints;
	
}


/**
 * recursive initialisation of
 *  1. this.child1
 *  2. this.child2
 *  3. this (aka this.contour aka this.cpnts) 
 */
ExtremalPoint.prototype.init = function(parent, sibling) {

	if (this.isExpanded){ //if exists and true
		this.child1.init(this,this.child2);
		this.child2.init(this,this.child1);
	}
	else { //if not exists
		this.isExpanded = false;
	}


  if (parent) {
    this.parent = parent;
    this.isRoot = false;
    if (!this.contour){
    	this.contour = new Contour();
    }
    this.contour.init(this);
  }
  else {
    this.parent = null;
    this.isRoot = true;
  }
  
  if (sibling) {this.sibling=sibling;}
}


/**
 * repaint all children 
 */
ExtremalPoint.prototype.update = function() {
	
	this.updateCoord(); //update this coordinates
	if(this.isExpanded){ //and recursivly all the children
		this.child1.update();
		this.child2.update();
	}
	this.updateType() //updates recusivly the type of this points children
	
	if (this.contour) { //update this.contour
		this.contour.update();
	}
}


ExtremalPoint.prototype.updateCoord = function() {
  if (this.parent) {
    this.dx = this.parent.x - this.x;
    this.dy = this.parent.y - this.y;
    this.dr = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
    this.dphi = Math.atan2(this.dy, this.dx);
  }
}


/**
 * updates the type of this points *children* (after moving)
 * recursive 
 */
ExtremalPoint.prototype.updateType = function() {
	
	if (!this.isExpanded) {return;}
	
  var c1 = this.child1;
  var c2 = this.child2;

  var dphi = Math.abs(c1.dphi - c2.dphi);
  var r1 = c1.dr;
  var r2 = c2.dr;

  dphi = dphi > Math.PI ? Math.PI * 2 - dphi : dphi;

	// check if close together, then the types should be different from each other
  if (dphi < LMT.model.MinMmaxSwitchAngle) {
  	this.childrenInsideEachOther = true;
    
	  var cng_grp = null;
	  var oth_grp = null;
	
	  if (r1 > r2) {
	    cng_grp = c2;
	    oth_grp = c1;
	  }
	  else {
	    cng_grp = c1;
	    oth_grp = c2;
	  }
    
    var newtype = (this.wasType == 'min' ? 'max' : 'min');
    
    if (cng_grp.isExpanded) { //if this point has children, we need to check them too
      cng_grp.wasType = newtype;
      cng_grp.updateType();
    }
    else {
      cng_grp.setType(newtype);
    }
    
    if (oth_grp.isExpanded) {
      oth_grp.wasType = this.wasType;
      oth_grp.updateType();
    }
    else {
      oth_grp.setType(this.wasType);
    }
  }

	// they are not close together, so both have the same type (same as this.wasType)
  else {
  	this.childrenInsideEachOther = false;  	
  	
    if (c1.isExpanded) {
      c1.wasType = this.wasType;
      c1.updateType(); //recurse
    }
    else {
      c1.setType(this.wasType);
    }
    if (c2.isExpanded) {
      c2.wasType = this.wasType;
      c2.updateType();
    }
    else {
      c2.setType(this.wasType);
    }
  }
}


/**
 * (setter) update the coordinates of a point
 * @param {Number} x the x coord
 * @param {Number} y the y coord
 * 
 */
ExtremalPoint.prototype.setCoord = function(x, y) {
  this.x = x;
  this.y = y;
  //this.updateCoord();
}

ExtremalPoint.prototype.setType = function(type) {
  this.type = type;
}

ExtremalPoint.prototype.setRoot = function(isRoot) {
	this.isRoot = isRoot;
} 


/**
 * returns the relative coordinates to pnt
 * (used for creation of correct order for modelling backend)
 */
ExtremalPoint.prototype.getRelCoordTo = function(pnt) {
  var pnt = new ExtremalPoint(pnt.x - this.x, pnt.y - this.y);
  pnt.setType(this.type);
  return pnt;
}


ExtremalPoint.prototype.getDist2ToParent = function(pnt) {
  return this.dx*this.dx + this.dy*this.dy; 
}



/**
 sets the relations ship to other points and updates them to if possible..
 */
ExtremalPoint.prototype.setRelationship = function(parent, sibling, child1, child2) {
  if (parent) {
    this.parent = parent;
    this.isRoot = false;
  }
  else if (this.parent) {
  }
  else {
    this.parent = null;
    this.isRoot = true;
  }

  if (sibling) {
    this.sibling = sibling;
    sibling.sibling = this;
  }

  if (chil1 && child2) {
    this.child1 = child1;
    this.child2 = child2;
    child1.sibling = child2;
    child2.sibling = child1;
    child1.parent = this;
    child2.parent = this;
  }

  this.update();
}

/**
 *	sets the children of a point
 * and the childrens siblings flag to each other
 * flags the point as expanded
 * 
 * @param {Point} child1
 * @param {Point} child2
 */
ExtremalPoint.prototype.setChildren = function(child1, child2) {
  if (child1 && child2) {
    this.child1 = child1;
    this.child2 = child2;
    child1.sibling = child2;
    child2.sibling = child1;
    //child1.parent = this;
    //child2.parent = this;
    
    this.isExpanded = true;
  }
}



/**
 * expands a min / max in a saddle that has 2 children, each either min or max 
 */
ExtremalPoint.prototype.expand = function() {

  var dx = 50;
  var dy = 50;
  
  var p2e = this;
  
  //claculate the new coordinates of the spawned points
  var p1x = p2e.x + dx / (p2e.depth / 3 + 1);
  var p2x = p2e.x - dx / (p2e.depth / 3 + 1);
  var pny = p2e.y + dy / (p2e.depth / 3 + 1);

  //create the points
  var child1 = new LMT.objects.ExtremalPoint(p1x, pny, p2e.depth+1, p2e.type);
  var child2 = new LMT.objects.ExtremalPoint(p2x, pny, p2e.depth+1, p2e.type);

  child1.init(p2e, child2);
  child2.init(p2e, child1);

  child1.updateCoord();
  child2.updateCoord(); 
  
  p2e.wasType = p2e.type;
  p2e.setType("sad");
  
  p2e.setChildren(child1, child2);
}



/**
 *	Delete self
 * (recursivly remove all assosiated svg elements)
 * 
 * keepThis: bool to flag the first element in recursion (as it should stay)
 */
ExtremalPoint.prototype.collapse = function(keepThis) {
	if (this.isExpanded){
		this.child1.collapse(false);
		this.child2.collapse(false);
		this.child1 = null;
		this.child2 = null;
		this.isExpanded = false;
		this.setType(this.wasType);
	}
	if (!keepThis) {
		if (this.contour) {	//remove contour
			this.contour.remove();
			this.contour = null;
		}
		
		if (this.line) { //remove line
			LMT.ui.svg.layer.connectorlines.removeChild(this.line);
			this.line = null;
		}
		
		if (this.circle) { //remove the circle
			this.layer.removeChild(this.circle);
			this.circle = null;
		}
	}
}


/**
 * Move this point
 */
ExtremalPoint.prototype.move = function(coord) {
	this.setCoord(coord.x, coord.y);
	LMT.model.update();
	LMT.model.paint();

}




/**
 * Paint updates the underlying svg objects and repaints it 
 */
ExtremalPoint.prototype.paint = function() {

  if (!this.circle) {
    this.circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.circle.setAttribute("id", "point" + this.idnr);
    
    this.layer.appendChild(this.circle);
    //this.circle.pnt = this;
    this.circle.jsObj = this;
  }

  this.circle.setAttribute("cx", this.x);
  this.circle.setAttribute("cy", this.y);
  this.circle.setAttribute("r", ExtremalPoint.r_def / LMT.settings.display.zoompan.scale);
	this.circle.setAttribute("class", "extremalpoint_" + this.type);
	

	//recursion: paint children
	if (this.isExpanded) {
		this.child1.paint();
		this.child2.paint();
	}


	if (!this.isRoot) {
	  if (!this.contour) {
	    this.contour = new Contour() //create contour
	    this.contour.init(this);
	  }
	  this.contour.paint();
	}

  if (!this.isRoot) {
    if (!this.line) {
      this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      
      LMT.ui.svg.layer.connectorlines.appendChild(this.line);
    }
    var classstr = LMT.settings.display.paintConnectingLines ? "connectorline" : "connectorline invisible";
    this.line.setAttribute("class", classstr);
    this.line.setAttribute("x1", this.x);
    this.line.setAttribute("y1", this.y);
    this.line.setAttribute("x2", this.parent.x);
    this.line.setAttribute("y2", this.parent.y);
  }
}


ExtremalPoint.prototype.toJSON = function(){
	return {
		__type: "extpnt",
		idnr: this.idnr,
		x: this.x,
		y: this.y,
		depth: this.depth,
		
		isRoot: this.isRoot,
		isExpanded: this.isExpanded,
  	childrenInsideEachOther: this.childrenInsideEachOther,
		type: this.type,
		wasType: this.wasType,
		
		child1: this.child1,
		child2: this.child2,
		
		contour: this.contour
	}
}

/************************************************
 * static fncs
 ************************************************/

ExtremalPoint.r_def = 10;


/*
 * event handlers
 */

/**
 * delegates to according object method
 */
ExtremalPoint.ToggleExtremalPoint = function(evt, jsObj){
    if (jsObj.isExpanded) {
      jsObj.collapse(true);
      $.event.trigger('RepaintModel');
    }
    else {
      jsObj.expand();
      $.event.trigger('UpdateRepaintModel');
    }
}







ExtremalPoint.createFromJSONObj = function(obj) {
	var p = new ExtremalPoint(Object.x, obj.y);
	
	for (var key in obj){
		var tmp = obj[key];
		p[key] = obj[key];
	}
	
	// recreate (cyclic) references
	if (p.isExpanded){
		p.child1.sibling = p.child2;
		p.child2.sibling = p.child1;
		p.child1.parent = p;
		p.child2.parent = p;
	}
	else {
		p.child1 = null;
		p.child2 = null;
	}
	
	if(p.isRoot){
		this.contour=null;
		this.sibling=null;
	}
	
	return p;
		
};






LMT.objects.ExtremalPoint = ExtremalPoint;
/*})();*/