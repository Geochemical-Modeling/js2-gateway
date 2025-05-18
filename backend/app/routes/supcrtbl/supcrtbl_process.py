from fastapi import File, UploadFile, Form, HTTPException, APIRouter, BackgroundTasks
from fastapi.responses import FileResponse
from typing import List, Optional, Union, Dict
import os, time, subprocess, shutil
from pathlib import Path
import threading
from zipfile import ZipFile
from .JobLockFile import JobLockFile

# Configuration
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
SUPCRT_FILES = BASE_DIR / "supcrtfiles"
BINARY_PATH = SUPCRT_FILES / "supcrtbl"

# Name of the log file in each job directory
LOG_FILE_NAME = "job.log"

# Create necessary directories
UPLOAD_DIR.mkdir(exist_ok=True)
SUPCRT_FILES.mkdir(exist_ok=True)
TIMEOUT_SECONDS = 120

# TODO: Should probably create a clean_up function for deleting all experiment directories after like 2 days?

running_processes: Dict[str, Dict] = {}
# Example structure
# "exp_id": {
#     "process": <subprocess.Popen object>,
#     "start_time": <timestamp>,


def start_supcrtbl_job(
  job_dir: Path, experiment_id: str, input_data: str, output_file: str
):
  """Schedules supcrtbl job, and creates the initial infrastructure
  Args:
      work_dir (Path): Path to the working directory
      experiment_id (str): ID of the experiment
      input (str): String containing all the input for the experiment
      output_file (str): Name of the output file that the user wants
  """
  # Start the process in a new thread
  thread = threading.Thread(
    target=run_supcrtbl_job, args=(job_dir, experiment_id, input_data, output_file)
  )
  thread.daemon = True  # Make thread exit when main process exits
  thread.start()


def run_supcrtbl_job(
  job_dir: Path, experiment_id: str, input_data: str, output_file: str
):
  """Runs the SUPCRTBL binary using the provided inputs.

  Args:
      work_dir (Path): Path to the working directory
      experiment_id (str): ID of the experiment
      input (str): String containing all the input for the experiment
      output_file (str): Name of the output file that the user wants
  """
  # Create job directory
  # Create lockfile class for managing the lockfile; lockfile should be created in the working directory
  job_dir.mkdir(parents=True, exist_ok=True)
  job_lock_file = JobLockFile(experiment_id, job_dir)
  job_lock_file.update_lock_file("starting", "Supcrtbl is starting")

  bin_dir = job_dir / "bin"
  output_dir = job_dir / "output"
  bin_dir.mkdir(exist_ok=True)
  output_dir.mkdir(exist_ok=True)

  # Copy executables and data files from supcrtfiles into the working directory
  # NOTE: In the they left off the .dat, so that's a little weird
  shutil.copy(SUPCRT_FILES / "supcrtbl", job_dir / "supcrtbl")
  shutil.copy(SUPCRT_FILES / "dpronsbl.dat", bin_dir / "dpronsbl")
  shutil.copy(SUPCRT_FILES / "dpronsbl_all.dat", bin_dir / "dpronsbl_all")

  log_file_path = job_dir / LOG_FILE_NAME
  with open(log_file_path, "w") as log_file:
    try:
      log_file.write("=== Input Data ===\n")
      log_file.write(input_data + "\n\n")
      job_lock_file.update_lock_file("starting", "Supcrtbl is starting")

      # Set up binary to run in the working dierctory and for piping data
      process = subprocess.Popen(
        [BINARY_PATH],
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        cwd=str(job_dir),
        text=True,
      )

      # Record the binary being run; this will be useful later for cleaning up processes
      running_processes[experiment_id] = {
        "process": process,
        "start_time": time.time(),
      }

      # Run the binary; wait up to TIMEOUT_SECONDS
      stdout, stderr = process.communicate(input=input_data, timeout=TIMEOUT_SECONDS)

      # Log stdout and stderr
      log_file.write("=== STDOUT ===\n")
      log_file.write(stdout + "\n")
      log_file.write("=== STDERR ===\n")
      log_file.write(stderr + "\n")

      # If process failed, update lock file to indicate an internal error, kill it, and remove it from running processes; also early return.
      # NOTE: The process may have produced an output file, but since we're doing an early return, we aren't moving any output files to the output dir
      # so those won't show up in the results. If you want this changed, we can remove the early return, but again that doesn't fix the Fortran file error.
      if process.returncode != 0:
        job_lock_file.update_lock_file("error", f"Supcrtbl process error: {stderr}")
        process.kill()
        del running_processes[experiment_id]
        return

      # Wait for the binary to produce all output files
      time.sleep(1)

      # Create ZIP file: Get all files prefixed with the outputFile name in the job directory
      zip_file_path = output_dir / f"{output_file}.zip"
      MAX_SIZE = 100 * 100 * 1024  # 10 MB; could be changed later
      with ZipFile(zip_file_path, "w") as zip_object:
        for file_path in job_dir.glob(f"{output_file}*"):
          try:
            if file_path.is_file() and os.path.getsize(file_path) > MAX_SIZE:
              continue
            destination = output_dir / file_path.name
            zip_object.write(file_path, file_path.name)
            shutil.move(file_path, destination)
          except Exception as e:
            log_file.write(f"Error processing file {file_path}: {e}\n")

      job_lock_file.update_lock_file("completed", "Supcrtbl completed successfully!")
    except subprocess.TimeoutExpired:
      job_lock_file.update_lock_file(
        "timeout", f"Supcrtbl timed out after {TIMEOUT_SECONDS / 60} minute(s)!"
      )
      log_file.write(f"Supcrtbl timed out after {TIMEOUT_SECONDS / 60} minute(s)!\n")
    except Exception as e:
      job_lock_file.update_lock_file("error", f"Supcrtbl error: {str(e)}")
      log_file.write(f"Supcrtbl error: {str(e)}\n")
    finally:
      # 1: Kill process in running_processes; process could have been already completed at this point, but kill it anyways.
      # 2: Remove processes from the dictionary
      if experiment_id in running_processes:
        running_processes[experiment_id]["process"].kill()
        del running_processes[experiment_id]


def cleanup_old_processes():
  """Cleans up old processes that might have slipped through the cracks"""
  now = time.time()
  expired_processes = []
  # Iterate through our recorded map of running processes
  for exp_id, process_info in running_processes.items():
    # Check if process has been running for longer than our timeout has indicated
    # - Kill the process
    # - Update the lockfile related to the process
    # - Remove the process from our map of running processes
    if now - process_info["start_time"] > TIMEOUT_SECONDS:
      try:
        process_info["process"].kill()
        job_dir = UPLOAD_DIR / exp_id
        job_lock_file = JobLockFile(exp_id, job_dir)
        job_lock_file.update_lock_file("timeout", "Process killed after timeout")
      except Exception as e:
        print(f"Error cleaning up process {exp_id}: {str(e)}")
      expired_processes.append(exp_id)

  # Remove expired processes from tracking
  # NOTE: Don't delete it whilst iterating through dictionary since you'll get a RuntimeError
  for exp_id in expired_processes:
    del running_processes[exp_id]


def start_cleanup_thread():
  """Start/Create a subthread that will handle cleaning up any long-running threads"""

  def cleanup_thread():
    while True:
      cleanup_old_processes()
      time.sleep(60)  # Clean up processes every minute

  thread = threading.Thread(target=cleanup_thread)
  thread.daemon = True
  thread.start()


start_cleanup_thread()
