import subprocess
from fastapi import APIRouter, HTTPException, File, Form, UploadFile
from fastapi.responses import FileResponse
import os
from typing import Union, Optional
from zipfile import ZipFile
import re
from datetime import datetime
router = APIRouter()
from typing import Annotated

databaseOptionList = [
  'geothermal.dat',
  'geothermal-ree.dat',
  'diagenesis.dat',
  'bl-0.5kb.dat',
  'bl-1kb.dat',
  'bl-2kb.dat',
  'bl-2kb-ree.dat',
  'bl-5kb.dat',
  'llnl-kinetics.dat',
];

def sanitize_filename(filename: str) -> str:
  """Sanitizes filename to prevent directory traversal attacks. We'll prevent patterns like "..", "/", "\", *, : in the file name."""
  return re.sub(r"([^\w\s\-~,\[\].])", '', filename)

@router.post("/api/phreeqc")
async def phreeqc_interceptor(inputFile: UploadFile, outputFileName: Annotated[str, Form()], dataFileChoice: Optional[str] = Form(None), customDataFile: Union[UploadFile, None] = None):  
  timestamp = int(datetime.now().timestamp())
  exp_id = f"{timestamp}"
  cwd = os.path.join(os.path.dirname(__file__), "nextTDB_workdirs", exp_id)
  
  # Contains input.pqi, and maybe the custom database file
  inputDir = os.path.join(cwd, "input")

  # Contains output file and output zip file
  outputDir = os.path.join(cwd, "output")

  # Contains the files referenced inside input.pqi
  userGenDir = os.path.join(cwd, "userGen")

  os.makedirs(inputDir, exist_ok=True)
  os.makedirs(outputDir, exist_ok=True)
  os.makedirs(userGenDir, exist_ok=True)
  
  outputFileName = sanitize_filename(outputFileName)
  inputFile.filename = sanitize_filename(inputFile.filename)
  
  outputFileDir = os.path.join(outputDir, outputFileName)
  inputFileDir = os.path.join(inputDir, inputFile.filename)
  files = []
  contents = (await inputFile.read()).decode("utf-8")
  lines = re.split(f'\r\n|\r|\n', contents)
  for line in lines:
    line_parts = re.sub(r'\s+', ' ', line).split(' ')
    for i in range(len(line_parts) - 1):
      if (line_parts[i].lower() == "-file"):
        filename = line_parts[i+1].strip()
        cleaned_filename = re.sub(r"[^\w\s\d\-_~,\[\].]", '', filename)
        new_path = os.path.join(userGenDir, cleaned_filename)
        files.append(new_path)
        # Replace the given filename with its path on our server, update the contents of the file (updates the contents string, not file itself)
        contents = re.sub(filename, new_path, contents)

  # Save the input file with its cleaned contents
  try:
    with open(inputFileDir, "w") as f:
      f.write(contents)
  except Exception as e:
    print(e)
    raise HTTPException(status_code=400, detail="Failed to parse input file. Please double check your input file and try again!")
  
  # Calculate datFilePath based on whether customDataFile exists
  datFileDir = ""
  if (customDataFile):
    customDataFile.filename = sanitize_filename(customDataFile.filename)
    datFileDir = os.path.join(inputDir, customDataFile.filename)
    try:
      with open(datFileDir, "w") as f:
        contents = (await customDataFile.read()).decode("utf-8")
        f.write(contents)
    except:
      raise HTTPException(status_code=500, detail="Failed to parse your custom database file. Please double check it and try again later!")
  else:
    
    # Ensure the name of the data file that they pick is allowed by us.
    if dataFileChoice not in databaseOptionList:
      raise HTTPException(status_code=400, detail=f"'{dataFileChoice}' is not a supported database file!")
    
    # If a path isn't found, this is our fault since it should exist.
    datFileDir = os.path.join(os.path.dirname(__file__), "database", dataFileChoice)
    if not os.path.exists(datFileDir):
      raise HTTPException(status_code=500, detail=f"Data file: {dataFileChoice} wasn't found in our records.")
  

  binary_path = os.path.join(os.path.dirname(__file__), "phreeqc")
  try:
    input_data = (
        f"{inputFileDir}\n"
        f"{outputFileDir}\n"
        f"{datFileDir}\n"
    )
    process = subprocess.Popen(
        [binary_path],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    stdout, stderr = process.communicate(input=input_data, timeout=3)

    # Create zip file, containing the outputFile and also the zip file
    # NOTE: We use this arcname technique in order to avoid saving the whole path, because that actually results in us storing a zip file with 
    # all the directories up to the base dir.
    zip_file_dir = os.path.join(outputDir, f"{outputFileName}.zip")
    with ZipFile(zip_file_dir, "w") as zip_object:
      for file_path in files:
        arcname = os.path.basename(file_path)
        zip_object.write(file_path, arcname=arcname)
      arcname = os.path.basename(outputFileDir)
      zip_object.write(outputFileDir, arcname=arcname)
      
    # Read data from the phreeqc output file
    with open(outputFileDir, "r") as f:
      data = {
        "data": {
          "results": f.read(),
          "experiment_id": exp_id
        }
      }
      return data
    
  except subprocess.CalledProcessError as e:
    print("Process returned non-zero code: ", e.stderr)
    raise HTTPException(status_code=500, detail="Internal Server Error")
  except Exception as e:
    print("Error: ", e)
    raise HTTPException(status_code=500, detail="Internal Server Error")
    
@router.get("/api/phreeqc/download/{experiment_id}")
def download_file(experiment_id: str):
  """Finds the experiments directory associated with an experiment_id and returns the zip file"""
  output_dir = os.path.join(os.path.dirname(__file__), "nextTDB_workdirs", experiment_id,  "output")
  if not os.path.exists(output_dir):
    print("Experiment output dir not found: ", output_dir)
    raise HTTPException(status_code=404, detail="Experiment files not found!")    
  
  zip_files = [f for f in os.listdir(output_dir) if f.lower().endswith(".zip")]
  if not zip_files:
    raise HTTPException(status_code=404, detail="Experiment files not found!")    

  # Assuming there's only one or you want the first
  zip_filename = zip_files[0]
  zip_path = os.path.join(output_dir, zip_filename)

  return FileResponse(path=zip_path, filename=zip_filename, media_type="application/zip")