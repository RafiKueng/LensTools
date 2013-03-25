# Create your views here.
from django.http import HttpResponse, HttpResponseNotFound
from django.views.decorators.csrf import csrf_exempt
from django.core import serializers
from django.utils import simplejson as sjson
from django.conf import settings as s


#from django.utils import date
#from datetime import datetime

from lmt import tasks
from datetime import datetime

from ModellerApp.models import BasicLensData, ModellingResult, Catalog
from ModellerApp.utils import EvalAndSaveJSON
from django.contrib.auth.models import User

from lmt.tasks import calculateModel
if s.MODULE_WORKER == "celery":
  from celery.result import AsyncResult
elif s.MODULE_WORKER == "multiprocessing":
  raise s.TODO("mp modules missing")
  from lmt.tasks import bla as AsyncResult
elif s.MODULE_WORKER == "dummy":
  from lmt.tasks import DummyAsyncResult as AsyncResult




import os


# this provides the client with a list of the catalogues and lenses
# available for modelling
@csrf_exempt
def getInitData(request):
  
  request.session.set_test_cookie()
  
  
  if request.method in ["GET", "POST"]:
    
    try:
      cs = Catalog.objects.values("id", "name", "description")
      lenses = BasicLensData.objects.values("id", "name", "catalog")

      jdata = sjson.dumps({"catalogues": list(cs), "lenses": list(lenses)})
      response = HttpResponse(jdata, content_type="application/json")
      
    except BasicLensData.DoesNotExist:
      response = HttpResponseNotFound("internal server error.. can't access teh models and catalogues", content_type="text/plain")
    
    response['Access-Control-Allow-Origin'] = "*"      
    return response
  
  elif request.method == "OPTIONS":
    #print "in options"  
    response = HttpResponse("")
    response['Access-Control-Allow-Origin'] = "*"
    response['Access-Control-Allow-Methods'] = "GET, POST, OPTIONS"
    response['Access-Control-Allow-Headers'] = "x-requested-with, x-requested-by"
    response['Access-Control-Max-Age'] = "180"
    return response



@csrf_exempt
def getSingeModelData(request, model_id):
  '''returns a single model from a request url /get_modeldata/1
  only for legacy, not really used anymore
  '''
  #print "in getSingleModelData"
  #print 'testcookie:', request.session.test_cookie_worked()

  # check if cookies enabled: disabled in debug
  print 'debug:',  DEBUG
  if not lmt.settings.DEBUG:
    if not request.session.test_cookie_worked():
      response = HttpResponseNotFound("Cookies not enabled, please enable", content_type="text/plain")
      response['Access-Control-Allow-Origin'] = "*"
      return response
  
  #if request.method == "POST" or request.method == "GET":
  if request.method in ["GET", "POST"]:
    #print "in post"
    #print "i got: ", str(request.POST)
    
    try:
      m = BasicLensData.objects.get(id=model_id)
      data = serializers.serialize("json", [m])
      response = HttpResponse(data, content_type="application/json")
    except BasicLensData.DoesNotExist:
      response = HttpResponseNotFound("this model is not available", content_type="text/plain")
      
    response['Access-Control-Allow-Origin'] = "*"
    return response
  
  
  elif request.method == "OPTIONS":
    #print "in options"  
    response = HttpResponse("")
    response['Access-Control-Allow-Origin'] = "*"
    response['Access-Control-Allow-Methods'] = "GET, POST, OPTIONS"
    response['Access-Control-Allow-Headers'] = "x-requested-with, x-requested-by"
    response['Access-Control-Max-Age'] = "180"
    return response

  
  else:
    print "strange access"
    return HttpResponse("no post/get/otions request")  



@csrf_exempt
def getModelData(request):
  '''returns a model from a request url /get_modeldata/
  expects post with model ids and / or catalogue ids to work on for this session
  '''
  print "in new getModelData"
#  print 'testcookie:', request.session.test_cookie_worked()
  
  if request.method in ["POST"]:
    print "in post"
    print "i got: ", str(request.POST)
    print "session has: ", str(request.session.__dict__)


    if not s.DEBUG:
      if not request.session.test_cookie_worked():
        response = HttpResponseNotFound("Cookies not enabled, please enable", content_type="text/plain")
        response['Access-Control-Allow-Origin'] = "*"
        return response

    
    #request.session['model_ids'] = [1,2,3]
    #ids = request.session['model_ids']
    
    POST = request.POST
    session = request.session
    
    if "action" in POST:
      action = POST['action']
      
      if action == "init":
        print "init"
        print POST.getlist('models[]', " [none models] ")
        print POST.get('catalog', " [none cats] ")
        
        
        if "models[]" in POST:
          print "got models"

          list = [int(x) for x in POST.getlist('models[]', [])]
          
          print "list", list

          session["lensesTodo"] = list
          session["isLensDone"] = [False] * len(list)
          workingOn = 0
          session["workingOnTodoListNr"] = workingOn
          session["isInit"] = True
          
          nextId = session["lensesTodo"][workingOn]


        else:
          print "error, no models supplied"
          response = HttpResponseNotFound("wrong post format, model[] expected", content_type="text/plain")
          response['Access-Control-Allow-Origin'] = "*"
          return response
                  
        if "catalog" in POST:
          # do something with it, but it's not important
          print "got catalog, don't care"
          
          #m = BasicLensData.objects.filter(catalog_id__exact=POST['catalog'])
        else:
          pass


      elif action == "cont" and session.get("isInit", False):
        print "continue previous session"
        #TODO: implement user sessions
      

      
      
      elif action == "prev" and session.get("isInit", False):
        print "get prev"
        
        list = session["lensesTodo"]
        session["workingOnTodoListNr"] -= 1
        workingOn = session["workingOnTodoListNr"]
        nextId = session["lensesTodo"][workingOn]

      
      elif action == "next" and session.get("isInit", False):
        print "get next"

        list = session["lensesTodo"]
        session["workingOnTodoListNr"] += 1
        workingOn = session["workingOnTodoListNr"]
        nextId = session["lensesTodo"][workingOn]
  
        
      
      elif not session.get("isInit", False):
        print "bad request, not yet init.. (action:", action
        
        response = HttpResponseNotFound("this model is not available", content_type="text/plain")
        response['Access-Control-Allow-Origin'] = "*"
        return response        

      else:
        print "bad request, unknown action:", action
        response = HttpResponseNotFound("bad request, unknown action", content_type="text/plain")
        response['Access-Control-Allow-Origin'] = "*"
        return response        

      
      print "nextId", nextId
      
      try:
        m = BasicLensData.objects.get(id=nextId)
        nDone = sum(session["isLensDone"])
        nLenses = len(list)
        nTodo = nLenses - nDone
        n = {'todo': nTodo,
             'done': nDone,
             'nr': nLenses,
             'next_avail': workingOn < len(list)-1,
             'prev_avail': workingOn > 0}
        data1 = serializers.serialize("json", [m])
        data2 = sjson.dumps(n)
        #print "data1", data1
        print "data2", data2
        
        data = data1[0:-1] + ',' + data2 + ']'
        
        response = HttpResponse(data, content_type="application/json")
      except BasicLensData.DoesNotExist:
        response = HttpResponseNotFound("this model is not available", content_type="text/plain")

      response['Access-Control-Allow-Origin'] = "*"
      print "session has", str(request.session.__dict__)
      return response        
      
      
    else:
      print "bad request"
      response = HttpResponseNotFound("this was a bad request", content_type="text/plain")
      response['Access-Control-Allow-Origin'] = "*"
      return response        
    
  
  
  elif request.method == "OPTIONS":
    #print "in options"  
    response = HttpResponse("")
    response['Access-Control-Allow-Origin'] = "*"
    response['Access-Control-Allow-Methods'] = "GET, POST, OPTIONS"
    response['Access-Control-Allow-Headers'] = "x-requested-with, x-requested-by"
    response['Access-Control-Max-Age'] = "180"
    return response

  
  else:
    print "strange access"
    response = HttpResponseNotFound("no post/get/otions request", content_type="text/plain")
    response['Access-Control-Allow-Origin'] = "*"
    return response   


@csrf_exempt
def saveModel(request):
  if request.method == "POST":
    
    #print repr(request.POST)
    print "username:", request.user.username
    
    r = request.POST
    #print "Got Data: ", int(r['modelid']), r['string'], r['isFinal'] in ["True", "true"]
    #print r.__dict__
    
    try:
      mid = int(r['modelid'])
      st = r['string']
      isf = r['isFinal'] in ["True", "true"]

      
    except KeyError:
      print "KeyError in save model"
      data = sjson.dumps({"status":"BAD_JSON_DATA","desc":"the saveModel view couldn't access expected attributes in POST information"})
      response = HttpResponseNotFound(data, content_type="application/json")
      response['Access-Control-Allow-Origin'] = "*"
      return response
    
    try:
      m = BasicLensData.objects.get(id=mid)

    except BasicLensData.DoesNotExist:
      print "BLD not found in save model"
      data = sjson.dumps({"status":"BAD_MODELID_DOES_NOT_EXIST","desc":"the saveModel view couldn't the basic_data_obj you wanted to save a result for"})
      response = HttpResponseNotFound(data, content_type="application/json")
      response['Access-Control-Allow-Origin'] = "*"
      return response

    u = User.objects.all()[0]
    print "eval and save"
    obj = EvalAndSaveJSON(user_obj = u, # request.user,
                          data_obj= m,
                          jsonStr = st,
                          is_final= isf)
    print "after eval and save"
    #r.save()
    data = sjson.dumps({"status":"OK", "result_id": "%06i" % obj.result_id})
    response = HttpResponse(data, content_type="application/json")
      
    response['Access-Control-Allow-Origin'] = "*"
    print "sending response"
    return response



def loadModel(request):
  pass


@csrf_exempt
def getSimulationJSON(request, result_id):
  result_id = int(result_id)
  print "in getSimulationJSON"
  
  def returnDataIfReady(result_id):
    return sjson.dumps({"status":"READY",
                         "cached": True,
                         "result_id": "%06i" % result_id,
                         "n_img": 3,
                         "img1url": "/result/%06i/img1.png" % result_id,
                         "img1desc": "Contour Plot",
                         "img2url": "/result/%06i/img2.png" % result_id,
                         "img2desc": "Mass Distribution",
                         "img3url": "/result/%06i/img3.png" % result_id,
                         "img3desc": "Arrival Time Plot",
                         })
  
  try:
    res = ModellingResult.objects.get(id=result_id)
  except:
    raise
  #print res.__dict__
  
  imgExists = os.path.exists("../tmp_media/%06i/img1.png" % result_id)
  
  if res.is_rendered: #and imgExists: #nginx will catch this case for images, but not for the json objects..
    #deliver images
    # check imgExists: because a clean up prog could have deleted the files in the mean time and forgot to set the right flags in the db.. evil prog...

    data = returnDataIfReady(result_id)

    res.last_accessed = datetime.now()
    res.save()

  elif not isinstance(res.task_id, type(None)) and len(res.task_id) > 2:
    print "task is started already"

    task = AsyncResult(res.task_id)
    print "status: ", task.state
    
    if task.state == "SUCCESS":
      res.task_id = "";
      res.is_rendered = True;
      res.last_accessed = datetime.now()
      res.save()
      
      data = returnDataIfReady(result_id)

    elif task.state == "FAILURE":
      data = sjson.dumps({"status":"FAILURE", "result_id": "%06i" % result_id})
      
    else:
      data = sjson.dumps({"status":"PENDING", "result_id": "%06i" % result_id})
    
  else:
    print "starting new task"
    # print result_id
    # print type(result_id)
    task = calculateModel.delay(result_id)
    res.is_rendered = False
    # print task.task_id, type(task.task_id)
    res.task_id = task.task_id
    res.rendered_last = datetime.now();
    res.save()
    #start the new task, retrun status information
    data = sjson.dumps({"status":"STARTED", "result_id": "%06i" % result_id})
    pass
  
  


  response = HttpResponse(data, content_type="application/json")
  
  response['Access-Control-Allow-Origin'] = "*"
  print "sending response"
  return response



@csrf_exempt
def getSimulationFiles(request, result_id, filename):
  
  print 'result_id: %s; filename: %s'%(result_id, filename)
  
  # if filename on harddisk tmp dir > deliver
  # if not:
  #   kick of task to create the files
  #  check task every 10sec for one minute
  #  if no answer till then, redirect so same url and start again
  
  
  data = sjson.dumps({"status":result_id, "result_id":filename})
  response = HttpResponse(data, content_type="application/json")
  
  response['Access-Control-Allow-Origin'] = "*"
  print "sending response"
  return response




@csrf_exempt
def getData(request):
  pass
