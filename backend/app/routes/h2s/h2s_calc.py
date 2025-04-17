from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import numpy as np
from pandas import read_csv as pd_read_csv
from scipy.interpolate import griddata

router = APIRouter()

def extractSampleData_xyz(filename, block):
    df = pd_read_csv(filename)

    x = np.array(df["T"])
    y = np.array(df["P"])
    z = np.array(df["NaCl"])

    if block in [1,2]:
        v1 = np.array(df["xH2S"])
        v2 = np.array(df["r"])
        v3 = np.array(df["H2S"])
        return (x,y,z,(v1,v2,v3))
    else:
        v = np.array(df["xH2S+xCO2"])
        return (x,y,z,v)

def createInputs(temp,nacl):
    X = np.ones(61) * temp
    Y = np.arange(0,610,step=10)
    Z = np.ones(61) * nacl
    return (X,Y,Z)

def block1(temp, nacl):
    (x,y,z,(v1,v2,v3)) = extractSampleData_xyz("Block1.csv",1)
    (X,Y,Z) = createInputs(temp,nacl)

    F1 = griddata((x,y,z),v1,(X,Y,Z),method='linear')
    F2 = griddata((x,y,z),v2,(X,Y,Z),method='linear')
    F3 = griddata((x,y,z),v3,(X,Y,Z),method='linear')

    # A string with the format "F1_values F2_values F3_values", where 
    # where F1_values, F2_values, etc. are comma-separated strings. 
    # In the original PHP file, this was exploded. So first we exploded the first argument, 
    # from the output, 

    return [
        F1.tolist(), 
        F2.tolist(), 
        F3.tolist()      
      ]

    # return ",".join(list(map(str,F1.tolist()))) + " " +\
    #        ",".join(list(map(str,F2.tolist()))) + " " +\
    #        ",".join(list(map(str,F3.tolist())))

def block2(temp, nacl):
    (x,y,z,(v1,v2,v3)) = extractSampleData_xyz("Block2.csv",2)
    (X,Y,Z) = createInputs(temp,nacl)

    F1 = griddata((x,y,z),v1,(X,Y,Z),method='linear')
    F2 = griddata((x,y,z),v2,(X,Y,Z),method='linear')
    F3 = griddata((x,y,z),v3,(X,Y,Z),method='linear')
    return [
        F1.tolist(), 
        F2.tolist(), 
        F3.tolist()
      ]

    # return ",".join(list(map(str,F1.tolist()))) + " " +\
    #        ",".join(list(map(str,F2.tolist()))) + " " +\
    #        ",".join(list(map(str,F3.tolist())))

def block3(temp, nacl):
    (x,y,z,v) = extractSampleData_xyz("Block3.csv",3)
    (X,Y,Z) = createInputs(temp,nacl)
    F = griddata((x,y,z),v,(X,Y,Z),method='linear')

    return [F.tolist()]
    # return ",".join(list(map(str,F.tolist())))

def computeBlock(blockNumber, temp, nacl):
    if blockNumber == 0:
        return block1(temp, nacl)
    elif blockNumber == 1:
        return block2(temp, nacl)
    elif blockNumber == 2:
        return block3(temp, nacl)
    else:
        return "None"


# i mean keeping it as a python file keeps it as a modular program 
# that can be run rather than something that's tied to the api of a web app.
# I feel like you should consider that as well. Just import the main ufnciton
# rather than refactoring into one thing.
# NOTE: mNaCl is converted into nacl, on the frontend. There's no actual mathematical conversion, it just happens.
@router.get("/")
def h2s_calc(system, temp, nacl):
  # Validate the input
  if system not in [1, 2, 3]:
    raise HTTPException(status_code=400, detail="Invalid system input. Must be 1, 2, or 3.")
  
  # Adjust values to be within bounds; 
  if temp < 298.15:
    temp = 298.15
  elif system < 2 and temp > 373.15:
    temp = 373.15
  elif system == 2 and temp > 348.15:
    temp = 348.15
  if nacl < 0: 
    nacl = 0
  elif system < 2 and nacl > 6:
    nacl = 6
  elif system == 2 and nacl > 4:
    nacl = 4

  try:
    results = computeBlock(system, temp, nacl)
    return {"data", results}
  except Exception as e:
    print("H2S Calculator Exception: ", str(e))
    raise HTTPException(status_code=500, detail="Server error for H2S calculator. Please try again later!")
  