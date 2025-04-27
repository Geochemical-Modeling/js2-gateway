
'''

### Files used 
- supcrtbl3.php: entrypoint
- supcrtbl binary 
- dpronsbl.dat
- dpronsbl_all.dat; but not dpronsbl_ree.dat? Why?

### Weird things I noticed
dpronsbl.dat is used in the original backend. That's fine, but dpronsbl_ree isn't used at all. In its place we 
have something called "dpronsbl_all". What is happening here? Did they just forget to use the right files? Or is 
there some higher level plays that are happening that i don't understand since I don't have the context?

### Extra considerations:
- Setup the logger here as well

'''

import subprocess
from fastapi import APIRouter, HTTPException, Form, UploadFile
from pydantic import BaseModel
from datetime import datetime
import os
import re

router = APIRouter()

dataFileChoices = [
  "dpronsbl", # aka supcrtbl.dat
  "dpronsbl_ree" # aka supcrtbl_REE.dat, careful with casing, make sure the things are lowercased.
]
# Probably define a form data model since we're going to get a lot of ields

router = router()

class SupcrtblFormData(BaseModel):
  # Required
  reactionOption: int
  reactFile: UploadFile # .dat file that you can uplaod
  outputFile: str
  reaction: str # Later split into an array called reactions, but this is a string containing all custom reactions they setup
  slopFile: str
  solventPhase: int
  kalFormatOption: int

  # Depends on the conditional branches we go under so these may be used
  independentStateVar: int  
  univariantCurveOption: int
  univariantCalcOption: int
  logKRange: str
  logKBoundingTempRange: str
  logKBoundingPresRange: str

  lipVapSatVar: int
  lipVapSatPresVal: str
  lipVapSatTempVal: str
  presRange: str
  tempRange: str
  presTempPairs: str
  tempPresPairs: str
  dH2OTempPairs: str
  dH2ORange: str
  tempDH2OPairs: str
  isothermsRange: str
  isochoresRange: str
  isobarsRange: str
  tableIncrement: int
  tabulationBaricOption: int
  tabulationChoricOption: int
  


from typing import IO, AnyStr  # Add this import at the top of the file

def write_and_flush(stdin: IO[AnyStr], content: str):
  stdin.write(content)
  stdin.flush()

router.get("/api/supcrtbl")
async def calculate_supcrtbl(formData: SupcrtblFormData):

  timestamp = datetime.now()
  cwd = os.path.join(os.path.dirname(__file__), )

  # Acts as something?
  filename = f"{formData.outputFile}_{timestamp}" # TODO: Sanitize outputFile?  
  reactions = re.split(r"#\n\s*\n#Uis", formData.reaction)
  binary_path = os.path.join(os.path.dirname(__file__), "resources", "supcrtbl")

  try: 

    ''' You can pipe in two ways 

    # 1. Batch pipe the input; however this is a one-shot deal, and it won't work for our situation
    inputs = f"n\nbin/{slopFile}\n3\n{solventPhase + 1}\n"
    process.communicate(inputs)
    
    # 2. Write step by step to stdin
    process.stdin.write("n\n")
    process.stdin.flush()

    ... and so on
    '''
    process = subprocess.Popen(
      [binary_path],
      stdin=subprocess.PIPE,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      text=True
    )

    input = [
      "n\n",
      "bin/{formData.slopFile}\n",
      "3\n",
      f"{formData.solventPhase+1}\n"
    ]

    process.stdin.write("n\n")
    process.stdin.write("bin/{formData.slopFile}\n")
    process.stdin.write("3\n")
    process.stdin.write(f"{formData.solventPhase+1}\n")
    

    if formData.solventPhase == 0:
      process.stdin.write(f"{formData.independentStateVar+1}\n")
      if formData.independentStateVar == 0:
        process.stdin.write(f"{formData.tabulationChoricOption+1}\n")
        if formData.tabulationChoricOption == 0:
          process.stdin.write(f"{formData.tableIncrement+1}\n")
          if formData.tableIncrement == 0:
            process.stdin.write(f"{formData.isochoresRange}\n")
            process.stdin.write(f"{formData.tempRange}\n")
          elif formData.tableIncrement == 1:
            process.stdin.write(f"{formData.dH2OTempPairs}\n")
        elif formData.tabulationChoricOption == 1:
          process.stdin.write(f"{formData.tableIncrement+1}\n")
          if formData.tableIncrement == 0:
            process.stdin.write(f"{formData.isothermsRange}\n")
            process.stdin.write(f"{formData.dH2ORange}\n")
          elif formData.tableIncrement == 1:
            process.stdin.write(f"{formData.tempDH2OPairs}\n")
      elif formData.independentStateVar == 1:
        if formData.univariantCurveOption == 0:
          process.stdin.write("y\n")
          process.stdin.write(f"{formData.univariantCalcOption+1}\n")
          if formData.univariantCalcOption == 0:
            process.stdin.write(f"{formData.isobarsRange}\n")
            process.stdin.write(f"{formData.logKRange}\n")
            process.stdin.write(f"{formData.logKBoundingTempRange}\n")
          elif formData.univariantCalcOption == 1:
            process.stdin.write(f"{formData.isothermsRange}\n")
            process.stdin.write(f"{formData.logKRange}\n")
            process.stdin.write(f"{formData.logKBoundingPresRange}\n")
        elif formData.univariantCurveOption == 1:
          process.stdin.write("n\n")
          process.stdin.write(f"{formData.tabulationBaricOption+1}\n")
          if formData.tabulationBaricOption == 0:
            process.stdin.write(f"{formData.tableIncrement+1}\n")
            if formData.tableIncrement == 0:
              process.stdin.write(f"{formData.isobarsRange}\n")
              process.stdin.write(f"{formData.tempRange}\n")
            elif formData.tableIncrement == 1:
              process.stdin.write(f"{formData.presTempPairs}\n")
          elif formData.tabulationBaricOption == 1:
            process.stdin.write(f"{formData.tableIncrement+1}\n")
            if formData.tableIncrement == 0:
              process.stdin.write(f"{formData.isothermsRange}\n")
              process.stdin.write(f"{formData.presRange}\n")
            elif formData.tableIncrement == 1:
              process.stdin.write(f"{formData.tempPresPairs}\n")
    elif formData.solventPhase == 1:
      process.stdin.write(f"{formData.lipVapSatVar+1}\n") 
      if formData.lipVapSatVar == 0:
        process.stdin.write(f"{formData.tableIncrement+1}\n")
        if formData.tableIncrement == 0:
          process.stdin.write(f"{formData.tempRange}\n")
        elif formData.tableIncrement == 1:
          process.stdin.write(f"{formData.lipVapSatTempVal}\n")
      elif formData.lipVapSatVar == 1:
        process.stdin.write(f"{formData.tableIncrement+1}\n")
        if formData.tableIncrement == 0:
          process.stdin.write(f"{formData.presRange}\n")
        elif formData.tableIncrement == 1:
          process.stdin.write(f"{formData.lipVapSatPresVal}\n")

    # Flush the pipe; make sure everything that we wrote into the buffer before moving on
    # NOTE: We can reason that the sending of data at this specific moment, rather than continuing to accumulate lines to write,
    # must be extremely important because you're probably generating data, and then you need to write that data to some file.
    process.stdin.flush()

    process.stdin.write("y\n")
    process.stdin.write(f"{formData.outputFile}.con\n")
    if formData.reactionOption == 0:
      # ATTENTION: Slight modification from the original. In the original this was at the top of the file, before solventPhase 
      # conditonal branch, but now we placed it down here. Intuitively I don't think this should change anything as this part
      # of the program is for parsing reaction related data, but if something does go wrong, please check this.
      try:
        outputName = formData.reactFile.filename # TODO: Sanitize to prevent directory traversal, likely create a utils or something 
        with open(os.path.join(cwd, outputName), "w") as f:
          file_contents = await formData.reactFile.read().decode("utf-8")
          f.write(file_contents)
        process.stdin.write("1\n")
        process.stdin.write(f"{outputName}\n")
      except Exception as e:
        raise HTTPException(status_code=400, detail="Please check your reaction input file and try again")
    else:
      # Else, formData.reactionOption == 1
      process.stdin.write("2\n")
      process.stdin.write(f"{len(reactions)}\n")
      reaction_count = 1
      for reaction in reactions:
        process.stdin.write(f"Reaction {reaction_count}\n")
        process.stdin.write(f"{reaction}\n")
        process.stdin.write("0\n")
        process.stdin.write("y\n")
        reaction_count += 1
      process.stdin.write('y\n')
      process.stdin.write(f"{formData.outputFile}.rxn\n")
    
    process.stdin.write(f"{formData.outputFile}.out\n")
    process.stdin.write(f"{formData.kalFormatOption+1}\n")
    process.stdin.write(f"{formData.outputFile}\n")

    # NOTE: In the original, when you close a pipe in PHP, I'm guessing it sends all the data in the pipe/buffer 
    # into the process, so that closes that end. If you close the process stdin, we force a flush and also indicate to other 
    # developers that we're done passing in data to the pipe/buffer.
    process.stdin.close()

    # Create the zip file, create an array of file paths

    # I guess save that zip file somewhere?

    # ATTENTION: Still need to do one last check on our conditionals! Verify the code with the lucidchart and the original source code. 
    # With lucidchart: https://lucid.app/lucidchart/152aa618-e177-486e-9351-56ca6fbf8413/edit?viewport_loc=879%2C1809%2C1065%2C1166%2C0_0&invitationId=inv_3d3e77a1-3435-4217-b2e9-9d2dc2d01403
    # Note that we made two minor changes:
    # 1. Migrated the reactionOptions == 0 at top of the file to be at bottom where the rest of that reactionOptions code was. This deviates from the original source code, and could issues issues, but there's also a good chance it's fine. Wait for testing
    # 2. In the univariantCurve == 0, the original source code for some reason had a separate if-else statement a couple lines 
    # earlier, in order to make the code shorter. In essence there were two separate if-else blcoks that were testing the same conditonal, and 
    # there was no logical reason to just merge them, so we merged them.
    
        

      



      


  except Exception as e:
    raise HTTPException(status_code=500, detail="Server error, something went horribly wrong.")
  

  
    


      

        



  pass
  