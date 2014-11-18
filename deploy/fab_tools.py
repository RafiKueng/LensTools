# -*- coding: utf-8 -*-
"""
Created on Mon Oct 27 13:43:52 2014

@author: rafik
"""

from fabric.api import *
from fabric import colors

def localc(s):
    return local(s, capture=True)


#def exists(path, is_dir=False, is_file=False):
#    with settings(warn_only=True):
#        if is_dir:
#            return run("test -d %s" % path).succeeded
#        elif is_file:
#            return run("test -f %s" % path).succeeded
#        else:
#            return run("test -e %s" % path).succeeded

def inform(s):
    puts(colors.green('\n> '+s+'\n'+'-'*80), show_prefix=False)
    

def warnn(s):
    warn(colors.yellow(s))
    

def debugmsg(s):
    puts(colors.red('DEBUG> '+s), show_prefix=False)
    

def check_or_create_dirs(dirs=None):
    for d in dirs:
        run("mkdir -p %s" % d)
