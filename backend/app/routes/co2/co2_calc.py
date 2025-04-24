import subprocess
from fastapi import APIRouter, HTTPException
import os
import re

router = APIRouter()


def cleanData(data: str):
    """
    1. Now the output from the binary is 8 lines of text:
    ---------CO2 solubility in aqueous NaCl solution---------
     ref: Duan Z, Sun R, Zhu C, Chou I (Marine Chemistry, 2006, v98, 131-139)
       T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl
       Unit---T: K, P(total): bar, mNaCl and mCO2: mol/kgH2O
     -------------------------------------------------------
     Please enter temperature(K), pressure(bar) and mNaCl(m)

     *********************RESULT****************************
           T(K)        P(bar)      mNaCl(m)  mCO2(m)
          300.000    1583.0000       3.2000       1.882

    2. Now you could just return this to the frontend, but to make things more flexible in the future
    we'll just extract the data on the last line. We can still keep that type of output on the frontend
    as well if we want. Trim the string, and split it based on the new line characters. The actual data we want is
    in the last array element so extract that last string:
      output_lines = [
          "---------CO2 solubility in aqueous NaCl solution---------",
          " ref: Duan Z, Sun R, Zhu C, Chou I (Marine Chemistry, 2006, v98, 131-139)",
          "   T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl",
          "   Unit---T: K, P(total): bar, mNaCl and mCO2: mol/kgH2O",
          " -------------------------------------------------------",
          " Please enter temperature(K), pressure(bar) and mNaCl(m)",
          "                                                         ",
          " *********************RESULT****************************",
          "       T(K)        P(bar)      mNaCl(m)  mCO2(m)   ",
          "      300.000    1583.0000       3.2000       1.8827"
      ]
    3. At this point we should have "300.000    1583.0000       3.2000       1.8827" as a string
    """
    data = data.strip().splitlines()[-1].strip()

    # 1. Make sure there's only one space between each term
    # 2. Split data based on spaces
    # 3. Now we should have an array in the form [temp, bar, mNaCl, mCO2]
    # 4. Convert this into a "data dictionary" and return the dictionary
    # NOTE: Even though we aren't doing math or charts for this calculator, we'll parse these into numbers
    # and we'll keep that precedence.
    data = re.sub(r"\s+", " ", data)
    data = list(map(float, data.split()))
    data_dict = {"temp": data[0], "bar": data[1], "mNaCl": data[2], "mCO2": data[3]}
    return data_dict


@router.get("/api/co2")
def co2_calculator_interceptor(temp: float, bar: float, mNaCl: float):

    if temp < 273 or temp > 533:
        raise HTTPException(
            status_code=400,
            detail="Temperature is out of bounds: T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl!",
        )
    if bar < 0 or bar > 2000:
        raise HTTPException(
            status_code=400,
            detail="Pressure is out of bounds: T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl!",
        )
    if mNaCl < 0 or mNaCl > 4.5:
        raise HTTPException(
            status_code=400,
            detail="mNaCl is out of bounds: T-P-X range of this model: 273-533 K, 0-2000 bar, 0-4.5 mNaCl!",
        )

    # Calculate the path of the binary based on the location of the current file
    binary_path = os.path.join(os.path.dirname(__file__), "main")

    try:
        # NOTE: The actual binary wants user input in this format, so that's why we're using input
        # and entering a string in format "<temp> <bar> <mNaCl>"
        process = subprocess.run(
            [binary_path],
            input=f"{temp} {bar} {mNaCl}",
            capture_output=True,
            text=True,
            check=True,
        )

        output = cleanData(process.stdout)

        return {"data": output}
    except subprocess.CalledProcessError as e:
        # When the binary returns a non-zero exit code; return a 500 probably since we know it's supposed to work; Error raised since check=True
        # print(f"Error executing binary: {e}")
        print(f"Stderr: {e.stderr}")
        raise HTTPException(status_code=500, detail="Internal Server Error")
    except FileNotFoundError as e:
        print(f"File not found: {binary_path} - {e.strerror}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error")
