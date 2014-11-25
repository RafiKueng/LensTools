# -*- coding: utf-8 -*-
"""
Created on Tue Nov 25 15:01:43 2014

@author: rafik
"""

import unittest as ut
import os

from settings import settings as _S











"""
This runs locally on dev server and checks if remote server is available
and basic stuff is set up.
All other test will be run locally on the live server..
"""


#class test_server_setup(ut.TestCase):
#    
#    def setUp(self):
#        pass
#    def tearDown(self):
#        pass
#    
#    def test_dirs_existing(self):
#        pass



      
class LocalSourceCodeTestCase(ut.TestCase):
    '''Tests the local sourcecode (static analysis, pylint)'''

    def setUp(self):

        self.files   = [
            './fabfile.py',
            './tests.py',            
            ]
    
    
    def test_prospector_apps(self):
        self.assertTrue(os.system('prospector -0 %s' % _S.SRC.DJANGODIR))

    def test_prospector_deploy(self):
        self.assertTrue(os.system('prospector -0 %s' % _S.SRC.DEPLOYDIR))

    def test_prospector_fabfile(self):
        self.assertTrue(os.system('prospector -0 %s' % self.files[0]))

    def test_prospector_tests(self):
        self.assertTrue(os.system('prospector -0 %s' % self.files[1]))

    def test_django(self):
        self.assertTrue(os.system('cd %s && manage.py test' % _S.SRC.DJANGODIR))

        
#
#
#def runSuiteTestCode():
#    suite = ut.TestLoader().loadTestsFromTestCase(LocalSourceCodeTestCase)
#    ut.TextTestRunner(verbosity=0).run(suite)



def runSuite_DjangoUnittest():
    suite1 = ut.TestLoader().loadTestsFromTestCase(LocalSourceCodeTestCase)
#    suite2 = ut.TestLoader().loadTestsFromTestCase(LocalSourceCodeTestCase)
#    suite3 = ut.TestLoader().loadTestsFromTestCase(LocalSourceCodeTestCase)

    #return ut.TestSuite([suite1, suite2])
    suite = ut.TestSuite([suite1])
    ut.TextTestRunner(verbosity=0).run(suite)
    



if __name__ == '__main__':
    ut.main()