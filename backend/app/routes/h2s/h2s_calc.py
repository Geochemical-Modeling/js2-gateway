"""
- resources is all the .csv data. Then h2s_request and h2s.py are the originals
Just refactor so that it returns a matrix of data.
"""

import os
from fastapi import APIRouter, HTTPException
import numpy as np
from scipy.interpolate import griddata
from pandas import read_csv as pd_read_csv

router = APIRouter()

# Define PATHS to blocks here
resource_dir = os.path.join(os.path.dirname(__file__), "resources")
block1_path = os.path.join(resource_dir, "Block1.csv")
block2_path = os.path.join(resource_dir, "Block2.csv")
block3_path = os.path.join(resource_dir, "Block3.csv")


@router.get("/api/h2s")
def calculate_h2s(system: float, temp: float, mNaCl: float):
  # Reject when system is out of range.
  if system < 0 or system > 2:
    raise HTTPException(
      status_code=400,
      detail=f"System '{system}' is out of range. Select system from 0 to 2.",
    )

  # Correct boundaries
  if temp < 298.15:
    temp = 298.15
  elif system < 2 and temp > 373.15:
    temp = 373.15
  elif system == 2 and temp > 348.15:
    temp = 348.15
  if mNaCl < 0:
    mNaCl = 0
  elif system < 2 and mNaCl > 6:
    mNaCl = 6
  elif system == 2 and mNaCl > 4:
    mNaCl = 4

  results = computeBlock(system, temp, mNaCl)
  return results


def extractSampleData_xyz(filename, block):
  df = pd_read_csv(filename)
  x = np.array(df["T"])
  y = np.array(df["P"])
  z = np.array(df["NaCl"])

  if block in [1, 2]:
    v1 = np.array(df["xH2S"])
    v2 = np.array(df["r"])
    v3 = np.array(df["H2S"])
    return (x, y, z, (v1, v2, v3))
  else:
    v = np.array(df["xH2S+xCO2"])
    return (x, y, z, v)


def createInputs(temp, nacl):
  X = np.ones(61) * temp
  Y = np.arange(0, 610, step=10)
  Z = np.ones(61) * nacl
  return (X, Y, Z)


def block1(temp, nacl):
  (x, y, z, (v1, v2, v3)) = extractSampleData_xyz(block1_path, 1)
  (X, Y, Z) = createInputs(temp, nacl)
  F1 = griddata((x, y, z), v1, (X, Y, Z), method="linear")
  F2 = griddata((x, y, z), v2, (X, Y, Z), method="linear")
  F3 = griddata((x, y, z), v3, (X, Y, Z), method="linear")

  # NOTE: H2S calculator is supposed to return a matrix of floating point
  # numbers for the client. However, due to the nature of the calculations, sometimes
  # some of the elements in the matrix will be nan, which cannot be put inside JSON.
  # So we'll turn all the elements in the matrix into strings first, and then return the matrix.
  # On the client side, we'll parse the strings back into floats, and things will work out.
  return [
    list(map(str, F1.tolist())),
    list(map(str, F2.tolist())),
    list(map(str, F3.tolist())),
  ]


def block2(temp, nacl):
  (x, y, z, (v1, v2, v3)) = extractSampleData_xyz(block2_path, 2)
  (X, Y, Z) = createInputs(temp, nacl)
  F1 = griddata((x, y, z), v1, (X, Y, Z), method="linear")
  F2 = griddata((x, y, z), v2, (X, Y, Z), method="linear")
  F3 = griddata((x, y, z), v3, (X, Y, Z), method="linear")
  return [
    list(map(str, F1.tolist())),
    list(map(str, F2.tolist())),
    list(map(str, F3.tolist())),
  ]


def block3(temp, nacl):
  (x, y, z, v) = extractSampleData_xyz(block3_path, 3)
  (X, Y, Z) = createInputs(temp, nacl)
  F = griddata((x, y, z), v, (X, Y, Z), method="linear")
  return [list(map(str, F.tolist()))]


def computeBlock(blockNumber, temp, nacl):
  if blockNumber == 0:
    return block1(temp, nacl)
  elif blockNumber == 1:
    return block2(temp, nacl)
  else:
    return block3(temp, nacl)
