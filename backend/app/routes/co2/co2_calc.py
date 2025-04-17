

import subprocess

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
router = APIRouter()

@router.get("/", status_code=200)
def co2_calculator_interceptor(temp: float, bar: float, mNaCl: float):

  if (temp < 273 or temp > 533):
    raise HTTPException(status_code=400, detail="Temperature is out of bounds: T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl!")

  if (bar < 0 or bar > 2000):
    raise HTTPException(status_code=400, detail="Pressure is out of bounds: T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl!")

  if (mNaCl < 0 or mNaCl > 4.5):
    raise HTTPException(status_code=400, detail="mNaCl is out of bounds: T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl!")
    
  binary_path = "./main"

  try:
    # NOTE: From PHP Code it seems the inputs are given through standard input rather than command line args?
    process = subprocess.run([binary_path], stdin=f"{temp} {bar} {mNaCl}", stderr=open("error-output.txt", "a"), capture_output=True, text=True, check=True)
    output_lines = process.stdout.strip().splitlines()
    return HTMLResponse(content=output_lines)
    # return {"data": output_lines}
  

  except subprocess.CalledProcessError as e:
    # When the binary returns a non-zero exit code; return a 500 probably since we know it's supposed to work; Error raised since check=True
    print(f"Error executing binary: {e}")
    print(f"Stderr: {e.stderr}")
    raise HTTPException(status_code=500, detail="Server error for CO2 calculator. Please try again later!")
  except FileNotFoundError:
    # File not found; return a 500
    # TODO: Should probably have these logged out somewhere professionally.
    print(f"Error: Binary not found at {binary_path}")
    raise HTTPException(status_code=500, detail="Server error for CO2 calculator. Please try again later!")