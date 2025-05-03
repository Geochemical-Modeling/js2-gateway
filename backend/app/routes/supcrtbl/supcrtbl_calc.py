import asyncio
from fastapi import APIRouter, HTTPException, Form, UploadFile, File, WebSocket
from fastapi.responses import FileResponse
from datetime import datetime
import os, shutil
from typing import Union, Annotated, Optional
from datetime import datetime
import os
from app.types import SupcrtblFormData
from app.routes.phreeqc.phreeqc_calc import sanitize_filename
from . import supcrtbl_process


'''
  - dpronsbl is supcrtbl.dat 
  - dpronsbl_all is supcrtbl_ree.dat 
  TODO: Make sure these are the actual data files used, or ask Ranvir about the situation with these data files if he knows.
  '''
dataFileChoices = [
  "dpronsbl.dat", 
  "dpronsbl_all.dat" 
]

router = APIRouter()

@router.post("/api/supcrtbl")
async def calculate_supcrtbl(
  outputFile: str = Form(...),
  slopFile: str = Form(...),
  kalFormatOption: int = Form(...),
  reactionOption: int = Form(...),
  solventPhase: int = Form(...),
  reaction: Optional[str] = Form(None),
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
  tabulationChoricOption: Optional[int] = Form(None),
  reactFile: Union[UploadFile, None] = File(None)  # Handle file separately
):
  
  # NOTE: First, we can't have a pydantic model that has UploadFile. Two if 
  # we do a pydantic model reactFile (2 parameters), our API now expects a big object and then a file.
  # You'd also have to tinker around with making those optional fields actually optional in that situation.
  # So for right now, accepting many parameters, then compacting them, seems like an alright idea.
  
  # Compact the form data to make it easier to use
  formData = SupcrtblFormData(
    outputFile=outputFile,
    slopFile=slopFile,
    kalFormatOption=kalFormatOption,
    reactionOption=reactionOption,
    solventPhase=solventPhase,
    reaction=reaction,
    independentStateVar=independentStateVar,
    univariantCurveOption=univariantCurveOption,
    univariantCalcOption=univariantCalcOption,
    logKRange=logKRange,
    logKBoundingTempRange=logKBoundingTempRange,
    logKBoundingPresRange=logKBoundingPresRange,
    lipVapSatVar=lipVapSatVar,
    lipVapSatPresVal=lipVapSatPresVal,
    lipVapSatTempVal=lipVapSatTempVal,
    presRange=presRange,
    tempRange=tempRange,
    presTempPairs=presTempPairs,
    tempPresPairs=tempPresPairs,
    dH2OTempPairs=dH2OTempPairs,
    dH2ORange=dH2ORange,
    tempDH2OPairs=tempDH2OPairs,
    isothermsRange=isothermsRange,
    isochoresRange=isochoresRange,
    isobarsRange=isobarsRange,
    tableIncrement=tableIncrement,
    tabulationBaricOption=tabulationBaricOption,
    tabulationChoricOption=tabulationChoricOption,
    reactFile=reactFile,
  )


  # 1. Create experiment directory alongside its input and output directory
  # exp_id = datetime.now()
  exp_id = "test"
  experimentDir = os.path.join(os.path.dirname(__file__), "nextTDB_workdirs", f"{exp_id}")
  binDir = os.path.join(experimentDir, "bin")
  outputDir = os.path.join(experimentDir, "output")
  os.makedirs(experimentDir, exist_ok=True)
  os.makedirs(binDir, exist_ok=True)
  os.makedirs(outputDir, exist_ok=True)
  
  # 2. Sanitize string data like the file names
  # If they submitted a reactFile (reaction file), then attempt to save to the input directory
  # NOTE: Can always move this into the supcrtbl_process.py
  formData.outputFile = sanitize_filename(formData.outputFile)
  if formData.reactionOption == 0:
    try:
      reactFile.filename = sanitize_filename(reactFile.filename)     
      with open(os.path.join(reactFile.filename), "w") as f:
        file_contents = (await reactFile.read()).decode("utf-8")
        f.write(file_contents)
    except Exception as e: 
      raise HTTPException(status_code=400, detail=f"Reaction file '{reactFile.filename}' couldn't be processed. Please check it and try again!")
    
  # Make sure they submitted a valid slopFile; also make sure the slopFile exists, if it doesn't, it's our fault
  if formData.slopFile not in dataFileChoices:
    error_message = f"Data file named '{formData.slopFile}' is not supported! Please choose one of: {str(dataFileChoices)}"
    raise HTTPException(status_code=400, detail=error_message)
  slopFilePath = os.path.join(os.path.dirname(__file__), "resources", formData.slopFile)
  if not os.path.exists(slopFilePath):
    raise HTTPException(status_code=500, detail=f"Data file: '{formData.slopFile}' wasn't found in our records.")
  
  # Copy our slopFile into our bin directory
  shutil.copyfile(slopFilePath, os.path.join(binDir, formData.slopFile))
  
  try:
    # 3. Start supercrtbl job asynchronously
    # Return the experiment id and the status of the experiment
    supcrtbl_process.start_supcrtbl_job(exp_id, experimentDir, formData, reactFile)
    return {
      "data": {
        "experiment_id": exp_id,
        "status": "submitted"
      }
    }
  except e:
    raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")  


@router.get("/api/supcrtbl/result/{experiment_id}")
def get_results(experiment_id: str):
  """Get the name and contents of the result files of the supcrtbl simulation"""
  
  # Check if job is completed
  status = supcrtbl_process.get_job_status(experiment_id)
  if status["status"] != "completed":
    return {
      "data": {
        "experiment_id": experiment_id,
        "status": status["status"],
        "message": "Job is not yet completed"
      }
    }
  
  # Check if output file for the unique experiment exists 
  outputDir = os.path.join(os.path.dirname(__file__), "nextTDB_workdirs", experiment_id, "output")
  if not os.path.exists(outputDir):
    raise HTTPException(status_code=404, detail="Experiment output directory not found")

  # Get the name and contents for all of the output files that satisfy:
  try:
    outputFiles = []
    MAX_SIZE = 500 * 1024 # 500KB
    for file_path in os.listdir(outputDir):

      # Skip .zip and .xy files
      if file_path.lower().endswith(".zip") or file_path.endswith(".xy"):
        continue
      
      # Open the file, and attach the file name and content.
      # NOTE: For bigger files attach part of the file and indicate that its truncated.
      file_size = os.path.getsize(file_path)
      with open(file_path, 'r', errors="ignore") as f:
        if file_size > MAX_SIZE:
          file_content = f.read(MAX_SIZE)
          file_content += f"\n\n[...Output truncated. File is {file_size/1024/1024:.2f} MB. Use the Download button to get the full file.]"
        else:
          file_content = f.read()
        outputFiles.append({
          "filename": os.path.basename(file_path), 
          "content": file_content
        })  

    # Return file data, or 404 if not files were found
    if not outputFiles:
      raise HTTPException(status_code=404, detail="No output files found")
    return {
      "data": outputFiles
    }
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Error reading output file: {str(e)}")

@router.get("/api/supcrtbl/status/{experiment_id}")
def check_status(experiment_id: str):
  status = supcrtbl_process.get_job_status(experiment_id)
  status["experiment_id"] = experiment_id  
  return {
    "data": status
  }

@router.get("/api/supcrtbl/status")
def check_all_status():
  experiments_dir = os.path.join(os.path.dirname(__file__), "nextTDB_workdirs")
  statuses = []
  for file_path in os.listdir(experiments_dir):
    exp_id = os.path.basename(file_path)
    status = supcrtbl_process.get_job_status(exp_id)
    status["experiment_id"] = exp_id
    statuses.append(status)
  return statuses



# Use this for easy logs
@router.get("/api/supcrtbl/logs/{experiment_id}")
def get_logs(experiment_id: str):
  logContents = supcrtbl_process.get_job_log(experiment_id)
  if not logContents:
    raise HTTPException(status_code=404, detail="Logs for experiment not found!")
  return {"logs": logContents}
    

@router.get("/api/supcrtbl/download/{experiment_id}")
def download_files(experiment_id: str):  

  # Get the experiment directory; get the output directory; get the zip file if it exists
  outputDir = os.path.join(os.path.dirname(__file__), "nextTDB_workdirs", experiment_id, "output")
  if not os.path.exists(outputDir):
    raise HTTPException(status_code=404, detail="Experiment output directory not found")
  
  # Get the zip file
  zip_files = [f for f in os.listdir(outputDir) if f.lower().endswith(".zip")]
  if not zip_files:
    raise HTTPException(status_code=404, detail="Experiment files not found!")    

  # Assuming there's only one or you want the first
  zip_filename = zip_files[0]
  zip_path = os.path.join(outputDir, zip_filename)
  return FileResponse(path=zip_path, filename=zip_filename, media_type="application/zip")