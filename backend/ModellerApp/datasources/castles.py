
def getName():
  return "Castles Image Catalog"
  

  
def getDialog():
  html = """
<!-- enter dialog html code here -->
<p>Select Castles images</p>
"""

  js = """
(function(){
/*
  assign event handlers for dialog
  it's possible to override the init and show fundions of the dialog here..
  catch the event LensesSelected for the event on the click on ok
*/

  $(document).on('LensesSelected', function(evt){
    alert("hi");
  })
  
  alert("javascript was run");
  
  
})()
"""

  title = "Casltes Image Catalog"

  return {'js':js, 'html':html, 'title': title}
