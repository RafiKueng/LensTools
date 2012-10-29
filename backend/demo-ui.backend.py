#!/usr/bin/env python
 
import sys
 
from twisted.internet import reactor
from twisted.python import log
from time import sleep
 
from autobahn.websocket import WebSocketServerFactory, \
                               WebSocketServerProtocol, \
                               listenWS
 
 
class EchoServerProtocol(WebSocketServerProtocol):
 
   def onMessage(self, msg, binary):
      print "got message", msg
      sleep(5)

      print "send answer"
      self.sendMessage("get your image from this url: www.google.com (you sent me: "+msg, binary)
 
  
if __name__ == '__main__':
 
   log.startLogging(sys.stdout)
 
   factory = WebSocketServerFactory("ws://localhost:8080", debug = False)
   factory.protocol = EchoServerProtocol
   listenWS(factory)
 
   reactor.run()
