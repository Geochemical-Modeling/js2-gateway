import os, re, glob
import threading
import time, json
from datetime import datetime
import subprocess
from app.types import SupcrtblFormData
from fastapi import UploadFile
from typing import Union, Dict
from zipfile import ZipFile

running_processes: Dict[str, Dict] = {}
# Example structure
# "exp_id": {
#     "process": <subprocess.Popen object>,
#     "start_time": <timestamp>,
#     "lock_file": <path to lock file>,
# }
# 

# Supcrtbl binary timeout (in seconds); 
TIMEOUT_SECONDS = 20
LOG_FILE_NAME = "supcrtbl.log"


'''
We're going to need to figure out what's going wrong when running this subprocess with our inputs. The subprocess is a menu
program and we'd like to know when it's getting stuck and whatnot. I think I've realized that the best way to do this is 
to log the steps by step. Meaning that we're going to need to see the input that the main process is sending and the menu
output that the subprocess is outputting to see how they're interacting with each other. So I think that involves 
capturing the stdout and stderr. While having real time logs is nice, I think the main idea is that we should keep 
these logs stored in memory somehow, rather than involving them in the running_processes array which is clear like 
every 2 minute. So each experiment_id should have an in-memory log string or array. Finally we just need to expose 
an API that we can use such as "/api/supcrtbl/logs" 

So when we launch the subprocess we want to capture the input, output, and error. We want to store losg in memory so we'll use a separate 
dictionary since a separate dictionary won't be cleared by cleanup functions. Use asynchronous readings using threads or asyncio to avoid 
blocking on I/O. We're running multiple subprocesses in the sense that. Like with the approach to output the logs at the end, it makes 
the logs quite unreadable so it's hard to trace, what's your input vs what is the output of the function. To achieve real time logs, you need to 
create "threaded reader ", that write to the log in real itme
'''



class ExperimentLogger:
    def __init__(self, path: str):
        self.log_file = open(path, "a+")  
        self.lock = threading.Lock()

    def log(self, source, message):
        with self.lock:
            self.log_file.write(f"[{source}] {message}\n")
    
    def close(self):
        with self.lock:
            self.log_file.close()
    
    def getLogs(self):
      # NOTE: The file is opened in append and read mode, but in order to read, we need to set the file seeker 
      # back to the beginning line of the file.
      with self.lock:
        self.log_file.seek(0)
        return self.log_file.read()

# Custom function to make writing more impact and add logging
def custom_write_line(process, line, logger: ExperimentLogger):
    """Write a line to the subprocess and log it in a human-readable format."""
    if not line.endswith('\n'):
        line += '\n'
    logger.log("stdin", f"> {line.strip()}")  # Prefix with '> ' for inputs
    process.stdin.write(line)

def run_supcrtbl_process(exp_id: str, experiment_dir, lock_file_path: str, form_data: SupcrtblFormData, react_file: UploadFile):
  '''Creates and run supcrtbl as a subprocess
  Solution one:
  - Run the cwd, with respect to the experiment_dir, the root of the experiments folder.
  - Add the database files in your "/input/" directory now when trying to look, we look for your slopFiles they are in your input directories.
  - As well as this, when writing paths complex paths like input_dir and output_dir, don't expect for them to work. Instead use "/input/<input-file-path>" and 
  "/output/<your-output-file-path>
  '''
  log_file_path = os.path.join(experiment_dir, LOG_FILE_NAME)
  logger = ExperimentLogger(log_file_path)
  process = None
  try: 
    update_lock_file(lock_file_path, "running", "Process is running")
    binary_path = os.path.join(os.path.dirname(__file__), "resources", "supcrtbl")
    process = subprocess.Popen(
      [binary_path],
      stdin=subprocess.PIPE,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      cwd=experiment_dir, # Run the binary in the experiment directory
      text=True,
    )
    running_processes[exp_id] = {
      "process": process,
      "start_time": time.time(),
      "lock_file": lock_file_path,
    }
    
    custom_write_line(process, "n", logger)
    slop_file_path = f"./bin/{form_data.slopFile}"
    custom_write_line(process, slop_file_path, logger)
    custom_write_line(process, "3", logger)
    custom_write_line(process, f"{form_data.solventPhase+1}", logger)
    if form_data.solventPhase == 0:
      custom_write_line(process, f"{form_data.independentStateVar+1}", logger)
      if form_data.independentStateVar == 0:
        custom_write_line(process, f"{form_data.tabulationChoricOption+1}", logger)
        if form_data.tabulationChoricOption == 0:
          custom_write_line(process, f"{form_data.tableIncrement+1}", logger)
          if form_data.tableIncrement == 0:
            custom_write_line(process,  f"{form_data.isochoresRange}", logger)
            custom_write_line(process,  f"{form_data.tempRange}", logger)
          elif form_data.tableIncrement == 1:
            custom_write_line(process,  f"{form_data.dH2OTempPairs}", logger)
        elif form_data.tabulationChoricOption == 1:
          custom_write_line(process,  f"{form_data.tableIncrement+1}", logger)
          if form_data.tableIncrement == 0:
            custom_write_line(process, f"{form_data.isothermsRange}", logger)
            custom_write_line(process, f"{form_data.dH2ORange}", logger)
          elif form_data.tableIncrement == 1:
            custom_write_line(process, f"{form_data.tempDH2OPairs}", logger)
      elif form_data.independentStateVar == 1:
        if form_data.univariantCurveOption == 0:
          custom_write_line(process, "y", logger)
          custom_write_line(process, f"{form_data.univariantCalcOption+1}", logger)
          if form_data.univariantCalcOption == 0:
            custom_write_line(process, f"{form_data.isobarsRange}\n", logger)
            custom_write_line(process, f"{form_data.logKRange}\n", logger)
            custom_write_line(process, f"{form_data.logKBoundingTempRange}\n", logger)
          elif form_data.univariantCalcOption == 1:
            custom_write_line(process, f"{form_data.isothermsRange}\n", logger)
            custom_write_line(process, f"{form_data.logKRange}\n", logger)
            custom_write_line(process, f"{form_data.logKBoundingPresRange}\n", logger)
        elif form_data.univariantCurveOption == 1:
          custom_write_line(process, "n\n", logger)
          custom_write_line(process, f"{form_data.tabulationBaricOption+1}\n", logger)
          custom_write_line(process, f"{form_data.tableIncrement+1}\n", logger)
          if form_data.tabulationBaricOption == 0:
            if form_data.tableIncrement == 0:
              custom_write_line(process, f"{form_data.isobarsRange}\n", logger)
              custom_write_line(process, f"{form_data.tempRange}\n", logger)
            elif form_data.tableIncrement == 1:
              custom_write_line(process, f"{form_data.presTempPairs}\n", logger)
          elif form_data.tabulationBaricOption == 1:
            if form_data.tableIncrement == 0:
              custom_write_line(process, f"{form_data.isothermsRange}\n", logger)
              custom_write_line(process, f"{form_data.presRange}\n", logger)
            elif form_data.tableIncrement == 1:
              custom_write_line(process, f"{form_data.tempPresPairs}\n", logger)
    elif form_data.solventPhase == 1:
      custom_write_line(process, f"{form_data.lipVapSatVar+1}\n", logger)
      custom_write_line(process, f"{form_data.tableIncrement+1}\n", logger)
      if form_data.lipVapSatVar == 0:
        if form_data.tableIncrement == 0:
          custom_write_line(process, f"{form_data.tempRange}\n", logger)
        elif form_data.tableIncrement == 1:
          custom_write_line(process, f"{form_data.lipVapSatTempVal}\n", logger)
      elif form_data.lipVapSatVar == 1:
        if form_data.tableIncrement == 0:
          custom_write_line(process, f"{form_data.presRange}\n", logger)
        elif form_data.tableIncrement == 1:
          custom_write_line(process, f"{form_data.lipVapSatPresVal}\n", logger)
    
    
    process.stdin.flush()
    custom_write_line(process, "y\n", logger)

    # NOTE: The binary will not accept any paths for the output file name. It wil validate it 
    # saying "invalid specifications". So line 205 is wrong! And probably a lot of other paths are wrong as well.
    custom_write_line(process, f"{form_data.outputFile}.con\n", logger)
    if form_data.reactionOption == 0:
      custom_write_line(process, "1\n", logger)
      custom_write_line(process, f"{react_file.filename}\n", logger)
    else:
      reaction_list = re.split(r"\n\s*\n",  form_data.reaction)
      custom_write_line(process, "2\n", logger)
      custom_write_line(process, f"{len(reaction_list)}\n", logger)
      reaction_count = 1
      for reaction in reaction_list:
        custom_write_line(process, f"Reaction {reaction_count}\n", logger)
        custom_write_line(process, f"{reaction}\n", logger)
        custom_write_line(process, "0\n", logger)

        # If species is not supported, the computer will say "the following" species weren't found and you need to enter 0 if this happens


        # Confirmation that you want the current entry
        custom_write_line(process, "y\n", logger)
        reaction_count += 1
      # Save reactions to a .rxn file
      custom_write_line(process, 'y\n', logger)
      custom_write_line(process, f"{form_data.outputFile}.rxn\n", logger)
      
    custom_write_line(process, f"{form_data.outputFile}.out\n", logger) # name of tabulated output file 
    custom_write_line(process, f"{form_data.kalFormatOption+1}\n", logger)
    custom_write_line(process, f"{form_data.outputFile}\n", logger) # Stores the .xy files 
  
    # Sends data to subprocess; if it doesn't end before the timeout then raise a TimeoutError
    process.wait(TIMEOUT_SECONDS)


    # If non-zeor return code, trhow it to the general exception clause
    
       
    
    # Create ZIP File in the root of the experiment directory with all files that have the outputFile name prefixed to them. 
    # The current directory has plenty of files like this: outputFile.con, outputFile.rxn, outputFile.out, and some .xy files.
    file_paths = glob.glob(f"{experiment_dir}/{form_data.outputFile}.*")
    zipFilePath = os.path.join(experiment_dir, f"{form_data.outputFile}.zip")
    MAX_SIZE = 100 * 100 * 1024 # 10 MB; could be changed later
    with ZipFile(zipFilePath, "w") as zip_object:
      for file_path in file_paths:
        if os.path.getsize(file_path) > MAX_SIZE:
          continue
        zip_object.write(file_path, arcname=os.path.basename(file_path))
          
    update_lock_file(lock_file_path, "completed", "Supcrtbl completed successfully")    
  except TimeoutError:
    # Update status in lockfile to timeout
    update_lock_file(lock_file_path, "timeout", "Supcrtbl timed out after 2 minutes")
  except Exception as e:
    # General exception not necessarily involving the binary, so it could be some other important operation other than the process, 
    # but the binary process could still be running.
    update_lock_file(lock_file_path, "error", f"Supcrtbl error: {str(e)}")
  finally:
    # At this point, the process failed or succeeeded, but at least it ended:
    # 1. Regardless of error or completion, just kill the process if not already dead 
    # 2. Get the strings containing stdout and stderr; log them into the experiment's log file.
    # 3. Remove completed processes from our dictionary of running processes
    process.kill()
    stdout, stderr = process.communicate()
    logger.log("stdout", stdout)
    logger.log("stderr", stderr)
    if exp_id in running_processes:
      del running_processes[exp_id]

def start_supcrtbl_job(exp_id: str, experiment_dir: str, form_data: SupcrtblFormData, react_file: Union[UploadFile, None]):
    lock_file_path = os.path.join(experiment_dir, ".lock")
    update_lock_file(lock_file_path, "starting", "Process is starting")
    thread = threading.Thread(
      target=run_supcrtbl_process,
      args=(exp_id, experiment_dir, lock_file_path, form_data, react_file)
    )
    thread.daemon = True
    thread.start()

def update_lock_file(lock_file_path: str, status: str, message: str):
    """
    Update the lock file with current status
    """
    lock_data = {
        "status": status,
        "message": message,
        "timestamp": datetime.now().isoformat()
    }
    try:
        with open(lock_file_path, "w") as f:
            json.dump(lock_data, f)
    except Exception as e:
        print(f"Error updating lock file: {e}")

def get_job_status(exp_id: str):
    """Get the status of a job by experiment ID"""
    experiment_dir = os.path.join(os.path.dirname(__file__), "nextTDB_workdirs", exp_id)
    lock_file_path = os.path.join(experiment_dir, ".lock")

    # Check if the experiment directory exists
    if not os.path.exists(experiment_dir):
        return {"status": "not_found", "message": "Experiment not found"}
    
    # Check if lock file exists
    if not os.path.exists(lock_file_path):
        # Check if output exists without lock file (old job or manually deleted lock)
        output_dir = os.path.join(experiment_dir, "output")
        if os.path.exists(output_dir) and any(os.listdir(output_dir)):
            return {"status": "completed", "message": "Process completed (lock file missing)"}
        return {"status": "unknown", "message": "Lock file not found"}
    
    # Read lock file
    try:
        with open(lock_file_path, "r") as f:
            lock_data = json.load(f)
        return lock_data
    except Exception as e:
        return {"status": "error", "message": f"Error reading lock file: {str(e)}"}

# Extra stuff from original 
def get_job_log(exp_id: str):
  log_file_path = os.path.join(os.path.dirname(__file__), "nextTDB_workdirs", f"{exp_id}", "supcrtbl.log")
  if not os.path.exists(log_file_path):
    return None
  logger = ExperimentLogger(log_file_path)
  return logger.getLogs()

def cleanup_old_processes():
    """
    Clean up remaining processes that have been running too long.
    """
    now = time.time()
    expired_processes = []
    for exp_id, process_info in running_processes.items():
        if now - process_info["start_time"] > TIMEOUT_SECONDS: 
            try:
                process_info["process"].kill()
                update_lock_file(process_info["lock_file"], "timeout", "Process killed after timeout")
            except:
                pass
            expired_processes.append(exp_id)
    
    # Remove expired processes from tracking
    for exp_id in expired_processes:
        del running_processes[exp_id]

# Start a background thread to periodically clean up old processes
def start_cleanup_thread():
    def cleanup_thread():
        while True:
            cleanup_old_processes()
            time.sleep(TIMEOUT_SECONDS)  # Check every minute
    
    thread = threading.Thread(target=cleanup_thread)
    thread.daemon = True
    thread.start()

# Start the cleanup thread when this module is imported
start_cleanup_thread()