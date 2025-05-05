from fastapi import File, UploadFile, Form, HTTPException, APIRouter
from fastapi.responses import FileResponse
from typing import Optional, Union
import os, time, re
from .JobLockFile import JobLockFile
from . import supcrtbl_process

router = APIRouter()

allowed_slop_files = ["dpronsbl", "dpronsbl_ree"]


@router.post("/api/supcrtbl")
async def run_calculation(
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
  reactFile: Union[UploadFile, None] = File(None),
):
  """Endpoint for running the supcrtbl calculations.

  Args:
      outputFile (str): Name of the output file to save the calculation results. Will be used for many files.
      slopFile (str): Name of the slop (.dat) file containing additional configuration or input data.
      kalFormatOption (int): Integer specifying the format of the Kalvin data for the calculation (0 or 1).
      reactionOption (int): Integer specifying the type of reaction to model (0 for file input, 1 for reaction string).
      solventPhase (int): Integer representing the solvent phase for the calculation (0 or 1).
      reaction (Optional[str]): A string representing the specific reaction to model. This is defined when reactionOption = 1. Optional.
      independentStateVar (Optional[int]): Optional integer specifying the independent state variable for the calculation, if applicable (0 or 1).
      univariantCurveOption (Optional[int]): Optional integer flag to control the univariant curve calculation (0 or 1).
      univariantCalcOption (Optional[int]): Optional integer flag for choosing specific univariant calculation options (0 or 1).
      logKRange (Optional[str]): String specifying the logK range for the calculation.
      logKBoundingTempRange (Optional[str]): String specifying the temperature range for the bounding logK.
      logKBoundingPresRange (Optional[str]): String specifying the pressure range for the bounding logK.
      lipVapSatVar (Optional[int]): Optional integer specifying the variable for liquid-vapor saturation, if applicable.
      lipVapSatPresVal (Optional[str]): Optional string specifying the pressure value for liquid-vapor saturation calculations.
      lipVapSatTempVal (Optional[str]): Optional string specifying the temperature value for liquid-vapor saturation calculations.
      presRange (Optional[str]): Optional string specifying the range of pressures to consider, e.g., "0.1-1000".
      tempRange (Optional[str]): Optional string specifying the range of temperatures to consider, e.g., "0-500".
      presTempPairs (Optional[str]): Optional string representing pairs of pressure and temperature values, e.g., "1.0,300;1.5,350".
      tempPresPairs (Optional[str]): Optional string representing pairs of temperature and pressure values, e.g., "300,1.0;350,1.5".
      dH2OTempPairs (Optional[str]): Optional string representing pairs of temperature and dH2O values, e.g., "300,1000;350,1100".
      dH2ORange (Optional[str]): Optional string specifying a range of dH2O values, e.g., "1000-5000".
      tempDH2OPairs (Optional[str]): Optional string representing temperature and dH2O value pairs, e.g., "300,1000;350,1100".
      isothermsRange (Optional[str]): Optional string specifying the range of isotherms for calculation, e.g., "200-400".
      isochoresRange (Optional[str]): Optional string specifying the range of isochores for calculation, e.g., "0.1-10".
      isobarsRange (Optional[str]): Optional string specifying the range of isobars for calculation, e.g., "1.0-10.0".
      tableIncrement (Optional[int]): Optional integer specifying the increment step for the tabulated output (e.g., 1, 5, etc.).
      tabulationBaricOption (Optional[int]): Optional flag for selecting the baric tabulation option, if applicable.
      tabulationChoricOption (Optional[int]): Optional flag for selecting the choric tabulation option, if applicable.
      reactFile (Union[UploadFile, None]): Optional file upload for a specific reaction file required for the calculation. Defined when reactionOption = 1.
  """

  # Generate experiment ID
  timestamp = int(time.time())
  process_id = os.getpid()
  experiment_id = f"{timestamp}_{process_id}"

  # Create working directory; unique experiment directory
  job_dir = supcrtbl_process.UPLOAD_DIR / f"{experiment_id}"
  job_dir.mkdir(parents=True, exist_ok=True)

  # Clean the output file name 
  outputFile = "".join(c for c in outputFile if c.isalnum() or c in " ")
  outputFile = outputFile.replace(" ", "")
  

  # Save reaction file if it was provided; creates experiment directory if needed
  if reactionOption == 0 and reactFile:

    # Clean react file name to prevent file traversals
    reactFile.filename = "".join(c for c in reactFile.filename if c.isalnum() or c in " ")
    reactFile.filename = reactFile.filename.replace(" ", "")

    try:
      upload_file_path = job_dir / reactFile.filename
      job_dir.mkdir(parents=True, exist_ok=True)
      with open(upload_file_path, "w") as f:
        contents = (await reactFile.read()).decode("utf-8")
        f.write(contents)
    except Exception as e:
      raise HTTPException(
        status_code=400,
        detail=f"Reaction file '{reactFile.filename}' couldn't be processed. Please check it and try again!",
      )

  # Check if slopFile is in our allow list
  if slopFile not in allowed_slop_files:
    error_message = f"Data file named '{slopFile}' is not supported! Please choose one of: {str(allowed_slop_files)}"
    raise HTTPException(status_code=400, detail=error_message)

  # Calculate the inputs
  inputs = ["n", f"bin/{slopFile}", "3", str(solventPhase + 1)]
  if solventPhase == 0:
    inputs.append(str(independentStateVar + 1))
    if independentStateVar == 0:
      inputs.append(str(tabulationChoricOption + 1))
      inputs.append(str(tableIncrement + 1))
      if tabulationChoricOption == 0:
        if tableIncrement == 0:
          inputs.append(isochoresRange)
          inputs.append(tempRange)
        elif tableIncrement == 1:
          inputs.append(dH2OTempPairs)
      elif tabulationChoricOption == 1:
        if tableIncrement == 0:
          inputs.append(isothermsRange)
          inputs.append(dH2ORange)
        elif tableIncrement == 1:
          inputs.append(tempDH2OPairs)
    elif independentStateVar == 1:
      if univariantCurveOption == 0:
        inputs.append("y")
        inputs.append(str(univariantCalcOption + 1))
        if univariantCalcOption == 0:
          inputs.append(isobarsRange)
          inputs.append(logKRange)
          inputs.append(logKBoundingTempRange)
        elif univariantCalcOption == 1:
          inputs.append(isothermsRange)
          inputs.append(logKRange)
          inputs.append(logKBoundingPresRange)
      elif univariantCurveOption == 1:
        inputs.append("n")
        inputs.append(str(tabulationBaricOption + 1))
        inputs.append(str(tableIncrement + 1))
        if tabulationBaricOption == 0:
          if tableIncrement == 0:
            inputs.append(isobarsRange)
            inputs.append(tempRange)
          elif tableIncrement == 1:
            inputs.append(presTempPairs)
        elif tabulationBaricOption == 1:
          if tableIncrement == 0:
            inputs.append(isothermsRange)
            inputs.append(presRange)
          elif tableIncrement == 1:
            inputs.append(tempPresPairs)
  elif solventPhase == 1:
    inputs.append(str(lipVapSatVar + 1))
    inputs.append(str(tableIncrement + 1))
    if lipVapSatVar == 0:
      if tableIncrement == 0:
        inputs.append(tempRange)
      elif tableIncrement == 1:
        inputs.append(lipVapSatTempVal)
    elif lipVapSatVar == 1:
      if tableIncrement == 0:
        inputs.append(presRange)
      elif tableIncrement == 1:
        inputs.append(lipVapSatPresVal)

  # Confirm you want to save your calculations to a file.
  inputs.extend(["y", f"{outputFile}.con"])

  if reactionOption == 0:  # Reactions are uploaded via file
    inputs.extend([str(1), reactFile.filename])
  else:
    # Manual entries of reaction input
    reaction_list = re.split(r"\n\s*\n", reaction)
    reaction_count = 1
    inputs.extend([str(2), str(len(reaction_list))])
    for reaction_line in reaction_list:
      inputs.extend([f"Reaction {reaction_count}", reaction_line, "0", "y"])
      reaction_count += 1
    inputs.extend(["y", f"{outputFile}.rxn"])

  # Regardless, of reactionOption, add these last inputs
  inputs.extend([f"{outputFile}.out", str(kalFormatOption + 1), outputFile])

  # Puts newlines between every input and then one at the end to simulate entering the last input
  input_data = "\n".join(inputs) + "\n"

  try:
    # Schedule Supcrtbl job to be run as a background task; on success return job as submitted
    # def run_supcrtbl_job(work_dir: Path, output_dir: Path, experiment_id: str, input_data: str, output_file: str, job_lock_file: JobLockFile):
    supcrtbl_process.start_supcrtbl_job(job_dir, experiment_id, input_data, outputFile)

    return {"data": {"experiment_id": experiment_id, "status": "submitted"}}
  except Exception as e:
    raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)} ")

@router.get("/api/supcrtbl/result/{experiment_id}")
def get_job_results(experiment_id: str):
  """Get all the output files that the experiment generated."""

  # Check if job is completed
  job_dir = supcrtbl_process.UPLOAD_DIR / experiment_id
  job_lock_file = JobLockFile(experiment_id, job_dir)
  status = job_lock_file.get_status()
  if status["status"] != "completed":
    return {
      "data": {
        "experiment_id": experiment_id,
        "status": status["status"],
        "message": "Job is not yet completed",
      }
    }

  # Start collecting the output files in the output dir
  output_dir = job_dir / "output"
  if not output_dir.exists():
    raise HTTPException(status_code=404, detail="Experiment output directory not found")

  # Collect the information of output files within the results array
  # - for very large files (>500kb), provided truncated content
  # - For .zip, files ending in xy (e.g. .cxy, .dxy, etc.), and .lock files, avoid copying them to the results array
  # - If no files we're collected, return 404
  # NOTE: Remember that os.listdir returns the names, and you need pathlib to get the full path
  results = []
  max_size = 500 * 1024
  for file_name in os.listdir(output_dir):
    if file_name.endswith(".zip") or file_name.endswith("xy"):
      continue

    file_path = output_dir / file_name
    file_size = os.path.getsize(file_path)
    with open(file_path, "r", errors="ignore") as f:
      content = ""
      if file_size > max_size:
        content = f.read(max_size)
        content += f"\n\n[...Output truncated. File is {file_size / 1024 / 1024:.2f} MB. Use the Download button to get the full file.]"
      else:
        content = f.read()
      results.append({"filename": file_name, "content": content})

  if not results:
    raise HTTPException(status_code=404, detail="No output files found")

  return {"data": results}

@router.get("/api/supcrtbl/download/{experiment_id}")
def download_file(experiment_id: str):
  """Attempts to return the zip file within the job directory's output directory for the user to download"""

  # Check if the experiment's directory exists; if not, it's not completed, invalid, etc.
  job_dir = supcrtbl_process.UPLOAD_DIR / experiment_id
  if not job_dir.exists():
    raise HTTPException(status_code=404, detail="Experiment files not found!")

  # Get the zip file in the job directory's output directory
  output_dir = job_dir / "output"
  zip_files = [f for f in os.listdir(output_dir) if f.endswith(".zip")]
  if not zip_files:
    raise HTTPException(
      status_code=404,
      detail="Experiment completed, but zip file to download not found!",
    )

  # Get the name of the zip file and reconstruct the zip file path; assume there's only one zip file;
  zip_filename = zip_files[0]
  zip_file_path = output_dir / zip_filename
  return FileResponse(
    path=zip_file_path, filename=zip_filename, media_type="application/zip"
  )

@router.get("/api/supcrtbl/status/{experiment_id}")
def get_job_status(experiment_id: str):
  """Gets the status of a supcrtbl job given the ID of the experiment"""
  job_dir = supcrtbl_process.UPLOAD_DIR / experiment_id
  job_lock_file = JobLockFile(experiment_id, job_dir)
  return {"data": job_lock_file.get_status()}


@router.get("/api/supcrtbl/logs/{experiment_id}")
def get_job_logs(experiment_id: str):
  """Returns hte logs of a given job

  NOTE: Really helpful for development and knowing why something failed.
  Shouldn't really be public facing. Logs don't really show sensitive info though.
  """
  job_log_path = supcrtbl_process.UPLOAD_DIR / experiment_id / supcrtbl_process.LOG_FILE_NAME
  
  if not job_log_path.exists():
    raise HTTPException(status_code=404, detail="Job not found!")   
  
  try:
    with open(job_log_path, "r") as log:
      return log.read()
  except Exception as e:
    raise HTTPException(status_code=500, detail="Error reading job log file!")   