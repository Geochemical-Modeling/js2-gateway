import subprocess
from fastapi import APIRouter, HTTPException, Form, UploadFile, Request, File
from datetime import datetime
import os
from typing import Optional, Union
from datetime import datetime
from zipfile import ZipFile
import os
import glob
import re

router = APIRouter()
dataFileChoices = [
  "dpronsbl", # aka supcrtbl.dat
  "dpronsbl_ree" # aka supcrtbl_REE.dat, careful with casing, make sure the things are lowercased.
]

router = APIRouter()

@router.post("/api/supcrtbl")
async def calculate_supcrtbl(
  request: Request,
  outputFile: str = Form(...),
  slopFile: str = Form(...),
  kalFormatOption: int = Form(...),
  reactionOption: int = Form(...),
  reactFile: Union[UploadFile, None] = File(None),
  reaction: Optional[str] = Form(None),
  solventPhase: int = Form(...),
  independentStateVar: Optional[int] = Form(None),
  univariantCurveOption: Optional[int] = Form(None),
  univariantCalcOption: Optional[int] = Form(None),
  logKRange: Optional[str] = Form(None),
  logKBoundingTempRange: Optional[str] = Form(None),
  logKBoundingPresRange: Optional[str] = Form(None),
  lipVapSatVar: Optional[int] = Form(None),
  lipVapSatPresVal: Optional[str] = Form(None),
  lipVapSatTempVal: Optional[str] = Form(None),
  presRange: Optional[str] = Form(None),
  tempRange: Optional[str] = Form(None),
  presTempPairs: Optional[str] = Form(None),
  tempPresPairs: Optional[str] = Form(None),
  dH2OTempPairs: Optional[str] = Form(None),
  dH2ORange: Optional[str] = Form(None),
  tempDH2OPairs: Optional[str] = Form(None),
  isothermsRange: Optional[str] = Form(None),
  isochoresRange: Optional[str] = Form(None),
  isobarsRange: Optional[str] = Form(None),
  tableIncrement: Optional[int] = Form(None),
  tabulationBaricOption: Optional[int] = Form(None),
  tabulationChoricOption: Optional[int] = Form(None)
):
  # 1. Create experiment directory
  timestamp = datetime.now()
  cwd = os.path.join(os.path.dirname(__file__), f"nextTDB_workdirs/{timestamp}")
  outputFile = outputFile # TODO: Putting this here as a reminder to sanitize this

  try: 
    binary_path = os.path.join(os.path.dirname(__file__), "resources", "supcrtbl")
    process = subprocess.Popen(
      [binary_path],
      stdin=subprocess.PIPE,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      cwd=cwd, # Run the binary in this CWD; as a result it will output files in here
      text=True
    )
    process.stdin.write("n\n")
    process.stdin.write(f"bin/{slopFile}\n")
    process.stdin.write("3\n")
    process.stdin.write(f"{solventPhase+1}\n")
    
    if solventPhase == 0:
      process.stdin.write(f"{independentStateVar+1}\n")
      if independentStateVar == 0:
        process.stdin.write(f"{tabulationChoricOption+1}\n")
        if tabulationChoricOption == 0:
          process.stdin.write(f"{tableIncrement+1}\n")
          if tableIncrement == 0:
            process.stdin.write(f"{isochoresRange}\n")
            process.stdin.write(f"{tempRange}\n")
          elif tableIncrement == 1:
            process.stdin.write(f"{dH2OTempPairs}\n")
        elif tabulationChoricOption == 1:
          process.stdin.write(f"{tableIncrement+1}\n")
          if tableIncrement == 0:
            process.stdin.write(f"{isothermsRange}\n")
            process.stdin.write(f"{dH2ORange}\n")
          elif tableIncrement == 1:
            process.stdin.write(f"{tempDH2OPairs}\n")
      elif independentStateVar == 1:
        if univariantCurveOption == 0:
          process.stdin.write("y\n")
          process.stdin.write(f"{univariantCalcOption+1}\n")
          if univariantCalcOption == 0:
            process.stdin.write(f"{isobarsRange}\n")
            process.stdin.write(f"{logKRange}\n")
            process.stdin.write(f"{logKBoundingTempRange}\n")
          elif univariantCalcOption == 1:
            process.stdin.write(f"{isothermsRange}\n")
            process.stdin.write(f"{logKRange}\n")
            process.stdin.write(f"{logKBoundingPresRange}\n")
        elif univariantCurveOption == 1:
          process.stdin.write("n\n")
          process.stdin.write(f"{tabulationBaricOption+1}\n")
          process.stdin.write(f"{tableIncrement+1}\n")
          if tabulationBaricOption == 0:
            if tableIncrement == 0:
              process.stdin.write(f"{isobarsRange}\n")
              process.stdin.write(f"{tempRange}\n")
            elif tableIncrement == 1:
              process.stdin.write(f"{presTempPairs}\n")
          elif tabulationBaricOption == 1:
            if tableIncrement == 0:
              process.stdin.write(f"{isothermsRange}\n")
              process.stdin.write(f"{presRange}\n")
            elif tableIncrement == 1:
              process.stdin.write(f"{tempPresPairs}\n")
    elif solventPhase == 1:
      process.stdin.write(f"{lipVapSatVar+1}\n") 
      process.stdin.write(f"{tableIncrement+1}\n")
      if lipVapSatVar == 0:
        if tableIncrement == 0:
          process.stdin.write(f"{tempRange}\n")
        elif tableIncrement == 1:
          process.stdin.write(f"{lipVapSatTempVal}\n")
      elif lipVapSatVar == 1:
        if tableIncrement == 0:
          process.stdin.write(f"{presRange}\n")
        elif tableIncrement == 1:
          process.stdin.write(f"{lipVapSatPresVal}\n")

    # Flush the pipe here at this specific moemnt; sends the data from the pipe/buffer to the binary;
    process.stdin.flush()
    process.stdin.write("y\n")
    process.stdin.write(f"{outputFile}.con\n") # Binary uses this to output a .con file
    if reactionOption == 0:
      # Save the reaction file to the unique experiment's directory. 
      # Then we'll pass in that reaction file's name to the binary. Now this will resolve correctly becasue 
      # the binary is being run in the unique experiment's directory. If it wasn't clear already, the binary generates files in the directory it runs in
      # so we'll make it run in the experiments directory to let it output files there.
      try:
        reactFileName = reactFile.filename # TODO: Sanitize to prevent directory traversal, likely create a utils or something 
        with open(os.path.join(cwd, reactFileName), "w") as f:
          file_contents = await reactFile.read().decode("utf-8")
          f.write(file_contents)
        process.stdin.write("1\n")
        process.stdin.write(f"{reactFileName}\n")
      except Exception as e:
        raise HTTPException(status_code=400, detail="Please check your reaction input file and try again")
    else:
      reaction_list = re.split("\n\s*\n",  reaction)
      process.stdin.write("2\n")
      process.stdin.write(f"{len(reaction_list)}\n")
      reaction_count = 1
      for reaction in reaction_list:
        process.stdin.write(f"Reaction {reaction_count}\n")
        process.stdin.write(f"{reaction}\n")
        process.stdin.write("0\n")
        process.stdin.write("y\n")
        reaction_count += 1
      process.stdin.write('y\n')
      process.stdin.write(f"{outputFile}.rxn\n")
      
    process.stdin.write(f"{outputFile}.out\n")   # Binary also uses this to create an output file
    process.stdin.write(f"{kalFormatOption+1}\n")
    process.stdin.write(f"{outputFile}\n")
    process.stdin.close() # Close pipe, which sends all remaining data from pipe into the binary


    # Create ZIP File; Find all files within the experiment directory 
    MAX_SIZE = 100 * 1024 * 1024 # 100 MB in bytes
    file_paths = glob.glob(f"{cwd}/{outputFile}.*")
    zipFilePath = os.path.join(cwd, f"{outputFile}_{timestamp}.zip")
    with ZipFile(zipFilePath, "w") as zip_object:
      for file_path in file_paths:
        if file_path.lower().endswith(".zip") or os.path.getsize(file_path) > MAX_SIZE:
          continue
        zip_object.write(file_path, arcname=os.path.basename(file_path))
    

    files_data = []
    for file_path in file_paths:
      if file_path.endswith(".zip") or file_path.endswith(".xy"):
        continue
      file_content = "File is too big to show its contents! Download the file instead if you want to view its contents."
      if os.path.getsize(file_path) < MAX_SIZE:
        with open(file_path, 'r') as f:
          file_content = f.read()
      files_data.append(
        {
          "filename": os.path.basename(file_path), 
          "content": file_content
        }
      )    
    return {"data": files_data}  
  except Exception as e:
    raise HTTPException(status_code=500, detail="Server error, something went horribly wrong.")
  
@router.get("/api/supcrtbl/download/{experiment_id}")
def download_files(experiment_id: str):  
  return {"data": "Yeah download supcrtbl worked"}