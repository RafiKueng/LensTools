#!/usr/bin/env python
 
import sys
import json

from twisted.internet import reactor
from twisted.python import log
from time import sleep

 
from autobahn.websocket import WebSocketServerFactory, \
                               WebSocketServerProtocol, \
                               listenWS
 
 
class EchoServerProtocol(WebSocketServerProtocol):

  def onOpen(self):
    print "-------\nnew connection"
    
  def onClose(self, wasClean, code, reason):
    print "closed connection"
 
  def onMessage(self, msg, binary):

    print "got message: ", msg
    
    id = msg[0:4] 
    data = msg[4:]
    
    if (id == "p_id"):
      try:
        p_id = int(data)
      except ValueError:
        print "got invalid p_id, sending error"
        self.sendMessage("err_" + "invalid p_id")
        return
        
      print "got p_id: " + data
      
      url = "hubble-udf.jpg"
      self.sendMessage("limg" + url)
      print "send limg: " + url
    
    elif (id=="pnts"):
      print "got pnts: " + data
      
    else:
      print "PROTOCOLL ERROR - dump:"
      print msg

  
if __name__ == '__main__':
 
   log.startLogging(sys.stdout)
 
   factory = WebSocketServerFactory("ws://localhost:8080", debug = False)
   factory.protocol = EchoServerProtocol
   listenWS(factory)
 
   reactor.run()
