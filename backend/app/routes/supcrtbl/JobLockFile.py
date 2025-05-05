import json
from datetime import datetime
from pathlib import Path


class JobLockFile:
    """Class used for managing the lock files.
    
    NOTE: You don't need a class, but it keeps the logic nice and 
    encapsulated. Also note that we require the job directory to be already 
    created for writing to the lock file to work.
    """
    def __init__(self, experiment_id: str, job_dir: Path):
        self.experiment_id = experiment_id
        self.job_dir = job_dir 
        self.lock_file_path: Path = self.job_dir / ".lock"

    def update_lock_file(self, status: str, message: str):
        """
        Update the lock file with the current status and message.
        """
        lock_data = {
            "status": status,
            "message": message,
            "timestamp": datetime.now().isoformat(),
        }
        try:
            with open(self.lock_file_path, "w") as f:
              json.dump(lock_data, f)    
        except Exception as e:
            print(f"Error updating lock file: {e}")

    def get_status(self):
        """
        Determine and return the current status of the job.
        """
        if not self.job_dir.exists():
          return {"status": "not_found", "message": "Experiment files not found"}
        
        if not self.lock_file_path.exists():
          return {"status": "unknown", "message": "Lock file not found, but experiment likely completed."}
        
        try:
          with open(self.lock_file_path, "r") as f:
             lock_data = json.load(f)
              # Add the experimnet ID when returning the status
              # NOTE: This isn't really necessary, just a nice thing to show that we know 
              # what experiment they're wanting to look at.
             lock_data["experiment_id"] = self.experiment_id
          return lock_data 
        except Exception as e:
          return {"status": "error", "message": f"Error reading lock file: {str(e)}"}
