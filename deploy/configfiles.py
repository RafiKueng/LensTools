# -*- coding: utf-8 -*-
"""
Created on Wed Jan  7 21:19:14 2015

@author: rafik
"""

def _head(ch='#'):
    '''generates the header of all files, ch is the escape char'''
    
    txt = [
        "part of swlabs;",
        "automatically generated by fab install script",
    ]
    
    return '\n'.join([ch+' '+_ for _ in txt])+'\n'



apache_ect_vhost_conf = """%s
Include {CONFFILE_PATH}
""" % _head('#')


apache_conf = """%s
<VirtualHost *:80>
    ServerAdmin webmaster@dummy-host.example.com
    ServerName swlabs
    DocumentRoot /data
    <Directory "/data">
        Options Indexes FollowSymLinks
        AllowOverride None
        Order allow,deny
        Allow from all
    </Directory>
</VirtualHost>
""" % _head('#')






