/*
XXX.obj.ExtremalPoint.js script file
*/

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

/**
 *	creates n new point 
 *	@constructor
 * 
 *	@param {Number} x the x coodrinate
 *  @param {Number} y the y coordinate
 * 	@param {Object} [parent=None] the parent object
 */
function Point(x, y, depth, type) {
	
	this.idnr = model.NrOf.ExtremalPoints++;
	
  this.x = parseInt(x) || 0;
  this.y = parseInt(y) || 0;

	this.depth = depth;

	this.type = type;
	this.wasType = "";

  this.isRoot = true;	//will be set by init
  this.isExpanded = false;	//will be set by init
	
  this.parent = null;	//will be set by init
	this.child1 = null;
	this.child2 = null;
	this.sibling = null;
	
	this.contour = null;
	
	//the svg objects references
	this.line = null;
	this.circle = null;
	
}


Point.prototype.init = function(parent, sibling) {

  if (parent) {
    this.parent = parent;
    this.isRoot = false;
    this.contour = new Contour();
    this.contour.init(this);
  }
  else {
    this.parent = null;
    this.isRoot = true;
  }
  
  if (sibling) {this.sibling=sibling;}

  this.isExpanded = false;
}


/**
 * repaint all children 
 */
Point.prototype.update = function() {
	
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


/*
Point.prototype.update = function() {
	this.updateCoord();
	this.updateType();
	this.paint();
}
*/

/**
 * repaint all children 
 */
/*
Point.prototype.updateAll = function() {
	this.update();
	if(this.isExpanded){
		this.child1.updateAll();
		this.child2.updateAll();
	}
	if (this.contour) {
		this.contour.update();
	}
}
*/

Point.prototype.updateCoord = function() {
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
Point.prototype.updateType = function() {
	
	if (!this.isExpanded) {return;}
	
  var c1 = this.child1;
  var c2 = this.child2;

  var dphi = Math.abs(c1.dphi - c2.dphi);
  var r1 = c1.dr;
  var r2 = c2.dr;

  dphi = dphi > Math.PI ? Math.PI * 2 - dphi : dphi;

	// check if close together, then the types should be different from each other
  if (dphi < model.MinMmaxSwitchAngle) {
    
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
Point.prototype.setCoord = function(x, y) {
  this.x = x;
  this.y = y;
  //this.updateCoord();
}

Point.prototype.setType = function(type) {
  this.type = type;
}

Point.prototype.setRoot = function(isRoot) {
	this.isRoot = isRoot;
} 

/**
 * returns the relative coordinates to pnt
 * (used for creation of correct order for modelling backend)
 */
Point.prototype.getRelCoordTo = function(pnt) {
  var pnt = new Point(pnt.x - this.x, pnt.y - this.y);
  pnt.setType(this.type);
  return pnt;
}

/**
 sets the relations ship to other points and updates them to if possible..
 */
Point.prototype.setRelationship = function(parent, sibling, child1, child2) {
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
Point.prototype.setChildren = function(child1, child2) {
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
 *	Delete self
 * (recursivly remove all assosiated svg elements)
 * 
 * keepThis: bool to flag the first element in recursion (as it should stay)
 */
Point.prototype.collapse = function(keepThis) {
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
			select.connectiorLinesLayer.removeChild(this.line);
			this.line = null;
		}
		
		if (this.circle) { //remove the circle
			select.extremalPointsLayer.removeChild(this.circle);
			this.circle = null;
		}
	}
}



/**
 * Paint updates the underlying svg objects and repaints it 
 */
Point.prototype.paint = function() {

  if (!this.circle) {
    this.circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    this.circle.setAttribute("id", "point" + this.idnr);
    this.circle.setAttribute("r", 10);
    select.extremalPointsLayer.appendChild(this.circle);
    this.circle.pnt = this;
  }

  this.circle.setAttribute("cx", this.x);
  this.circle.setAttribute("cy", this.y);
	this.circle.setAttribute("class", "extremalpoint_" + this.type);
	
  //TODO get rid of this later and use css for styling
  var color = "";
  if (this.type == "sad") {
    color = "red";
  }
  else if (this.type == "min") {
    color = "green";
  }
  else {
    color = "blue";
  }
  this.circle.setAttribute("fill", color);

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

  if (settings.paintConnectingLines && !this.isRoot) {
    if (!this.line) {
      this.line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      this.line.setAttribute("style", "stroke:rgb(0,0,0);stroke-width:1");
      select.connectiorLinesLayer.appendChild(this.line);
    }
    this.line.setAttribute("x1", this.x);
    this.line.setAttribute("y1", this.y);
    this.line.setAttribute("x2", this.parent.x);
    this.line.setAttribute("y2", this.parent.y);
  }
}


Point.prototype.toJSON = function(){
	return {
		__type: "extpnt",
		idnr: this.idnr,
		x: this.x,
		y: this.y,
		depth: this.depth,
		
		isRoot: this.isRoot,
		isExpanded: this.isExpanded,
		type: this.type,
		wasType: this.wasType,
		
		child1: this.child1,
		child2: this.child2,
		
		contour: this.contour
	}
}


//static fnc
Point.createFromJSONObj = function(obj) {
	var p = new Point(Object.x, obj.y);
	
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
	
	return p;
		
};