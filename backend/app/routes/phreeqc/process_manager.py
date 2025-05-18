import os
import subprocess
import time
import threading
import json
from typing import Dict, Optional
from datetime import datetime

# Dictionary to keep track of running processes
running_processes: Dict[str, Dict] = {}


def run_phreeqc_process(
  exp_id: str,
  binary_path: str,
  input_data: str,
  output_file_dir: str,
  files: list,
  output_dir: str,
  output_file_name: str,
  lock_file_path: str,
):
  """
  Run the PhreeQC process in a separate thread and manage its lifecycle
  """
  try:
    # Update lock file to indicate process is running
    update_lock_file(lock_file_path, "running", "Process is running")

    # Start the PhreeQC process
    process = subprocess.Popen(
      [binary_path],
      stdin=subprocess.PIPE,
      stdout=subprocess.PIPE,
      stderr=subprocess.PIPE,
      text=True,
    )

    # Store the process information
    running_processes[exp_id] = {
      "process": process,
      "start_time": time.time(),
      "lock_file": lock_file_path,
    }

    # Wait for the process to complete (with timeout)
    try:
      stdout, stderr = process.communicate(
        input=input_data, timeout=1200
      )  # 20 minute timeout (1200 seconds)

      if process.returncode != 0:
        update_lock_file(
          lock_file_path, "error", f"Process failed with error: {stderr}"
        )
        return

      # Only create the zip file once the process completes successfully
      from zipfile import ZipFile

      zip_file_dir = os.path.join(output_dir, f"{output_file_name}.zip")

      # Wait for output file to be fully written
      time.sleep(1)

      with ZipFile(zip_file_dir, "w") as zip_object:
        for file_path in files:
          if os.path.exists(file_path):
            arcname = os.path.basename(file_path)
            zip_object.write(file_path, arcname=arcname)

        if os.path.exists(output_file_dir):
          arcname = os.path.basename(output_file_dir)
          zip_object.write(output_file_dir, arcname=arcname)

      # Process completed successfully
      update_lock_file(lock_file_path, "completed", "Process completed successfully")

    except subprocess.TimeoutExpired:
      if exp_id in running_processes and running_processes[exp_id]["process"]:
        running_processes[exp_id]["process"].kill()
      update_lock_file(lock_file_path, "timeout", "Process timed out after 20 minutes")

  except Exception as e:
    update_lock_file(lock_file_path, "error", f"Process error: {str(e)}")

  finally:
    # Clean up process entry
    if exp_id in running_processes:
      del running_processes[exp_id]


def start_phreeqc_job(
  exp_id: str,
  binary_path: str,
  input_data: str,
  output_file_dir: str,
  files: list,
  output_dir: str,
  output_file_name: str,
):
  """
  Start a new PhreeQC job in a background thread
  """
  # Create lock file - place it at the experiment root directory for easier access
  cwd = os.path.dirname(os.path.dirname(output_file_dir))
  lock_file_path = os.path.join(cwd, ".lock")

  # Initialize lock file
  update_lock_file(lock_file_path, "starting", "Process is starting")

  # Start the process in a new thread
  thread = threading.Thread(
    target=run_phreeqc_process,
    args=(
      exp_id,
      binary_path,
      input_data,
      output_file_dir,
      files,
      output_dir,
      output_file_name,
      lock_file_path,
    ),
  )
  thread.daemon = True  # Make thread exit when main process exits
  thread.start()

  return exp_id


def update_lock_file(lock_file_path: str, status: str, message: str):
  """
  Update the lock file with current status
  """
  lock_data = {
    "status": status,
    "message": message,
    "timestamp": datetime.now().isoformat(),
  }

  try:
    with open(lock_file_path, "w") as f:
      json.dump(lock_data, f)
  except Exception as e:
    print(f"Error updating lock file: {e}")


def get_job_status(exp_id: str):
  """
  Get the status of a job by experiment ID
  """
  cwd = os.path.join(os.path.dirname(__file__), "nextTDB_workdirs", exp_id)
  lock_file_path = os.path.join(cwd, ".lock")

  # Check if the experiment directory exists
  if not os.path.exists(cwd):
    return {"status": "not_found", "message": "Experiment not found"}

  # Check if lock file exists
  if not os.path.exists(lock_file_path):
    # Check if output exists without lock file (old job or manually deleted lock)
    output_dir = os.path.join(cwd, "output")
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


def cleanup_old_processes():
  """
  Clean up processes that have been running too long
  """
  now = time.time()
  expired_processes = []

  for exp_id, process_info in running_processes.items():
    # Check if process has been running for more than 20 minutes
    if now - process_info["start_time"] > 1200:  # 1200 seconds = 20 minutes
      try:
        process_info["process"].kill()
        update_lock_file(
          process_info["lock_file"], "timeout", "Process killed after timeout"
        )
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
      time.sleep(60)  # Check every minute

  thread = threading.Thread(target=cleanup_thread)
  thread.daemon = True
  thread.start()


# Start the cleanup thread when this module is imported
start_cleanup_thread()
