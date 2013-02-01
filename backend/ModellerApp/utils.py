from ModellerApp.models import ModellingResult, ModellingSession

import json

class Point(object):
  def __init__(self, x, y, _type='min', _delay="", child1=None, child2=None):
    self.x = x
    self.y = y
    self.child1 = child1
    self.child2 = child2
    self.type = _type
    self.delay = _delay #either float in days, or empty string for None (messured)
    self.distParent2 = -1 #init to no parent, if it has one, the parent will change this setting
    
    #save distance to parent for children
    for child in [child1, child2]:
      if child:
        dx = child.x - self.x
        dy = child.y - self.y
        child.distParent2 = dx*dx+dy*dy
        
  # calculates the relative coordinates, returns a SimplePoint
  def getRelCoordTo(self, pnt):
    dx = self.x - pnt.x
    dy = self.y - pnt.y
    print " "*30, "in new point: ", self.type
    return Point(x=dx, y=dy, _type=self.type);
  
  def __repr__(self):
    return "Point [ x:%.2f | y:%.2f | type:%s ]" % (self.x, self.y, self.type)
  def __str__(self):
    return self.__repr__()


class EvalAndSaveJSON:
  
  def __init__(self, user_obj, data_obj, jsonStr, is_final, **kwargs):
    #print "init easj"
    #self.username = "anonymous"
    self.logfilename = "../tmp_media/" + str(data_obj.id) + "log.log"
    self.hubbletime = 13.7
    self.lensidentifier = ""
    self.z_lens = 1.00
    self.pixrad = 3
    self.steep_min = 0
    self.steep_max = "None"
    self.smooth_val = 2
    self.smooth_ic = "False"
    self.loc_grad = 45
    self.isSym = False
    self.maprad = 0 #1.9637 #set 0 to turn off
    self.shear = 0.01
    self.z_src = 1.00
    self.n_models = 1000

    self.statefilepath = "../tmp_media/" + str(data_obj.id) + "/state.state"
    self.imgpath = "../tmp_media/" + str(data_obj.id)
    self.img1_name = "image1.png"
    
    self.cfg_path = "../tmp_media/" + str(data_obj.id)
    self.cfg_file = "cfg.gls"
    

    #self.points = [Pnt(2,3), Pnt(2,1), Pnt(5,2)]  

    #replacce default settings with setttings provided
    for key, value in kwargs.iteritems():
      if hasattr(self, key):
        setattr(self, key, value)
      
    #save databse elements / objects
    self.basic_data_obj = data_obj
    self.user_obj = user_obj
    self.username = self.user_obj.username
    self.jsonStr = jsonStr
    self.is_final = is_final
    
    
    
    # lets got to work
    self.evalModelString()
    self.orderPoints()
    self.createConfigFile()
    self.createModellingResult()
    
    
    
  def evalModelString(self):
    #print "eval easj"
    
    def objHook(dct):
      #print "in ObjHook"
      if '__type' in dct:
        if dct['__type'] == "extpnt":
          return Point(x=dct['x']/100., y=dct['y']/100., _type=dct['type'], child1=dct['child1'], child2=dct['child2'])
        if dct['__type'] == "contour":
          return None
        if dct['__type'] == "cpnt":
          return None
        if dct['__type'] == "ext_mass":
          return None
        if dct['__type'] == "ruler":
          return None
      return dct
        
    self.jsonObj = json.loads(self.jsonStr, object_hook=objHook)
    #return self.jsonObj
  
  
  
  def orderPoints(self):
    #print "order easj"
    
    # recursive function returning all the points coordinates for ONE source
    # relative to origin
    # origin is the max of the root group (or the point more close to the saddle
    # point)
    # the desired order is: (postorder)
    # 1. point futher away from saddlepoint
    # 2. point closer
    # 3. saddle point
    # (ported from js)
    def recursiveWalker(pnt, origin, i=0):
      res = []
      #print " "*(3*i), "recW ", `i`
      #print " "*(3*i), "pnt:    ", pnt
      #print " "*(3*i), "origin: ", origin

      if (pnt.child1):
        ps = pnt
        c1 = pnt.child1
        c2 = pnt.child2

        
        # maintain postorder traversal, nodes sortet by distance
        if (c1.distParent2 < c2.distParent2):
          tmp = c1
          c1 = c2;
          c2 = tmp

        #print " "*(3*i), "c1d: ", c1.distParent2
        #print " "*(3*i), "c2d: ", c2.distParent2        
        
        skiporigin = False
        if not origin: #if origin of type None
          #print " "*(3*i), "not jet origin: setting to c2 "
          origin = c2
          skiporigin = True
          #print " "*(3*i), "go on with"
          p2arr = recursiveWalker(c2, origin, i+1)
          res.extend(p2arr)
          
        p1arr = recursiveWalker(c1, origin, i+1)
        res.extend(p1arr)
        
        if not skiporigin:
          p2arr = recursiveWalker(c2, origin, i+1)
          res.extend(p2arr)

        res.append(ps.getRelCoordTo(origin))

      
      else:
        if not origin: # origin == None
          pass
        else:
          pnt = pnt.getRelCoordTo(origin)

        res.append(pnt)
        
      return res
    
    #start the recursiveWalker
    pnt = self.jsonObj['Sources'][0] #TODO: here is hardcoded that only the fors soucre is supported
    res = recursiveWalker(pnt, None)
    self.points = res
    #return res
    
  
  
  
  def createConfigFile(self):
    #print "create easj"

    _ = self
    
    gls = [
      "import matplotlib as mpl"                                            ,
      "import pylab as pl"                                                  ,
      "glass_basis('glass.basis.pixels', solver='rwalk')"                   ,
      "meta(author='%s', notes='using LensModellingTools')" % _.username    ,
      "setup_log('%s')" % _.logfilename                                     ,
      "samplex_random_seed(0)"                                              ,
      "samplex_acceptance(rate=0.25, tol=0.15)"                             ,
      "exclude_all_priors()"                                                ,
      "include_prior("                                                      ,
      "  'lens_eq',"                                                        , 
      "  'time_delay',"                                                     , 
      "  'profile_steepness',"                                              , 
      "  'J3gradient',"                                                     ,
      "  'magnification',"                                                  ,
      "  'hubble_constant',"                                                ,
      "  'PLsmoothness3',"                                                  ,
      "  'shared_h',"                                                       ,
      "  'external_shear'"                                                  ,
      ")"                                                                   ,
      "hubble_time(%f)" % _.hubbletime                                      ,
      "globject('%s')" % _.lensidentifier                                   ,
      "zlens(%.3f)" % _.z_lens                                              ,
      "pixrad(%i)" % _.pixrad                                               ,
      "steepness(%s,%s)" %(_.steep_min, _.steep_max)                        ,
      "smooth(%.2f,include_central_pixel=%s)" % (_.smooth_val, _.smooth_ic) ,
      "local_gradient(%.2f)" % _.loc_grad                                   ,
      "symm()" if _.isSym else ""                                           ,
      "maprad(%.4f)" % _.maprad if _.maprad else ""                         ,
      "shear(%.2f)" % _.shear                                               ,
      ""]
             
    for i in range(len(_.points)):
      gls.append(
        "%s = %.2f, %.2f" % (chr(65+i), _.points[i].x, _.points[i].y)
        )

    gls.append(
      "source(%.2f," % _.z_src
    )
    
    for i in range(len(_.points)):
      if i>0:
        if _.points[i].delay != "":
          delaystr  = ("%.2f" % _.points[i].delay)
        else:
          delaystr = "None"
        delaystr += (")" if i == len(_.points)-1 else ",") #add "," to end of each row,,except last, there add ")"
      else: #this is the first row (which doesnt have a delay to previous)
        delaystr = ""
      
      gls.append(
        "  %s, '%s', %s" % (chr(65+i), _.points[i].type,  delaystr)
      )
      
    gls.extend([
      "model(%s)" % _.n_models                                              ,
      "savestate('%s')" % _.statefilepath                                   ,
      "env().make_ensemble_average()"                                       ,
      "env().arrival_plot(env().ensemble_average, only_contours=True)"      ,
      "pl.savefig('%s%s')" % (_.imgpath, _.img1_name)
    ])
 
    
    _.gls = '\n'.join(gls)
    
    f = open(_.cfg_path + _.cfg_file, 'w')
    f.write(_.gls)
    f.close()
    
    #return _.gls


  
  def createModellingResult(self):
    #print "createMR easj"

    mr = ModellingResult(
      basic_data_obj = self.basic_data_obj,
      json_str      = self.jsonStr,
      is_final_result = self.is_final)
    
    mr.created_by = self.user_obj
    #mr.log_text = self.logfilename = "bla.log"
    mr.is_rendered = False
 
    mr.hubbletime = self.hubbletime
    mr.redshift_lens = self.z_lens
    mr.pixrad = self.pixrad
    mr.steepness_min = self.steep_min
    mr.steepness_max = self.steep_max
    mr.smooth_val = self.smooth_val
    mr.smooth_include_central = (self.smooth_ic == "True")
    mr.local_gradient = self.loc_grad
    mr.is_symm = self.isSym
    mr.maprad = self.maprad
    mr.shear = self.shear
    mr.redshift_source = self.z_src
    mr.n_models = self.n_models

    mr.n_images = len(self.points)
    mr.n_sources = 1
    
    mr.save()
    
    ms = ModellingSession(
            user           = self.user_obj,
            basic_data_obj = self.basic_data_obj,
            created        = mr.created,
            result         = mr)
    ms.save()
    print "created ms"
    
    self.result = ms
    self.result_id = ms.id
    #return mr