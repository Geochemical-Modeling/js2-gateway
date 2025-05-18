import os
import time
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from sqlmodel import select, text
from app.db.database import get_session
from pydantic import BaseModel
import math
import logging

# Configure detailed logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Database name for rate calculations
RATE_CALC_DB = "geosci_consolidated_tables1"


class RateResult(BaseModel):
  AMech: str
  BMech: str
  NMech: str
  OMech: str
  total: str
  logTotal: str
  species: str
  reference: str
  temp: str
  pH: str


def log_operation(operation_type, message, error=None):
  """Log operations without writing to database"""
  timestamp = datetime.now().isoformat()

  if error:
    logger.error(
      f"[RATE-CALC] [{timestamp}] [{operation_type}] {message} - ERROR: {error}"
    )
  else:
    logger.info(f"[RATE-CALC] [{timestamp}] [{operation_type}] {message}")


@router.get("/api/rate/calculate", response_model=RateResult, tags=["Rate Calculator"])
async def calculate_rate(
  request: Request,
  species: str,
  temp: float,
  pH: float,
  feINPUT: Optional[float] = None,
  oINPUT: Optional[float] = None,
  co2INPUT: Optional[float] = None,
):
  """
  Calculate mineral dissolution rates based on provided parameters.

  Parameters:
  - species: Mineral species name
  - temp: Temperature in Celsius
  - pH: pH value
  - feINPUT: (Optional) Activity of pFe3+
  - oINPUT: (Optional) Activity of pO2
  - co2INPUT: (Optional) Activity of pCO2/pHCO3-
  """
  client_ip = request.client.host if request.client else "unknown"

  # Create parameter string for logging
  params = f"species={species}, temp={temp}, pH={pH}"
  if feINPUT is not None:
    params += f", feINPUT={feINPUT}"
  if oINPUT is not None:
    params += f", oINPUT={oINPUT}"
  if co2INPUT is not None:
    params += f", co2INPUT={co2INPUT}"

  logger.info(
    f"[RATE-CALC] Processing calculation request - {params} - Client: {client_ip}"
  )

  try:
    with get_session() as session:
      if session is None:
        logger.error(
          f"[RATE-CALC] Database session is None. Cannot calculate rates - Client: {client_ip}"
        )
        raise HTTPException(status_code=503, detail="Database connection unavailable")

      # Initialize variables
      HA = HEa = HnH = Hlogk25 = NA = NEa = Nlogk25 = OHA = OHEa = OHnH = OHlogk25 = (
        OA
      ) = OEa = OnH = Ologk25 = Hn1 = Hn2 = Hn3 = On = Ref = None
      Fe = fe_input = co2_input = o_input = None
      carbonate = False
      dispRef = "Palandri and Kharaka (2004)"

      # Get parameters from the palandri table
      palandri_query = text(
        f"SELECT * FROM {RATE_CALC_DB}.rate_utility_palandri WHERE Species = :species"
      )
      palandri_results = session.execute(
        palandri_query, {"species": species}
      ).fetchall()

      for row in palandri_results:
        Ref = row.Ref
        if Ref == 1:
          HA = row.HA
          HEa = row.HEa
          HnH = row.HnH
          Hlogk25 = row.Hlogk25

          NA = row.NA
          NEa = row.NEa
          Nlogk25 = row.Nlogk25

          OHA = row.OHA
          OHEa = row.OHEa
          OHnH = row.OHnH
          OHlogk25 = row.OHlogk25

      # If not found in palandri, check carbonates table
      if Ref is None or Ref < 1 or Ref > 4:
        carbonates_query = text(
          f"SELECT * FROM {RATE_CALC_DB}.rate_utility_carbonates WHERE Species = :species"
        )
        carbonates_results = session.execute(
          carbonates_query, {"species": species}
        ).fetchall()

        for row in carbonates_results:
          carbonate = True
          Ref = row.Ref
          if Ref == 3:
            HA = row.HA
            HEa = row.HEa
            HnH = row.HnH
            Hlogk25 = row.Hlogk25

            NA = row.NA
            NEa = row.NEa
            Nlogk25 = row.Nlogk25

            OHA = row.OHA
            OHEa = row.OHEa
            OHnH = row.OHnH
            OHlogk25 = row.OHlogk25

            OA = row.OA
            OEa = row.OEa
            OnH = row.OnH
            Ologk25 = row.Ologk25

            co2_input = co2INPUT

      # If still not found, check oxygen table
      if Ref is None or Ref < 1 or Ref > 4:
        oxygen_query = text(
          f"SELECT * FROM {RATE_CALC_DB}.rate_utility_oxygen WHERE Species = :species"
        )
        oxygen_results = session.execute(oxygen_query, {"species": species}).fetchall()

        for row in oxygen_results:
          Ref = row.Ref
          if Ref == 4:
            HA = row.HA
            HEa = row.HEa
            Hn1 = row.Hn1
            Hn3 = row.Hn3
            Hlogk25 = row.Hlogk25

            NA = row.NA
            NEa = row.NEa
            Nlogk25 = row.Nlogk25

            OHA = row.OHA
            OHEa = row.OHEa
            OHn2 = row.OHn2
            OHlogk25 = row.OHlogk25

            OA = row.OA
            OEa = row.OEa
            On = row.On
            Ologk25 = row.Ologk25

            o_input = oINPUT
            fe_input = feINPUT

      # Check if the species was found in any table
      if Ref is None:
        logger.error(
          f"[RATE-CALC] Species '{species}' not found in database - Client: {client_ip}"
        )
        raise HTTPException(
          status_code=404, detail=f"Species '{species}' not found in the database"
        )

      # Calculate mechanisms and total rate
      AMech = BMech = NMech = OMech = 0

      if Ref <= 3:
        kTemp = temp + 273.15
        Kw = (
          1530.875
          + 0.5198124 * kTemp
          - 60208.41 / kTemp
          - 608.0362 * math.log10(kTemp)
          + 2139656 / (kTemp**2)
          - 0.0001961716 * (kTemp**2)
        )
        pOH = -1 * Kw - pH

        if HA is not None:
          AMech = (
            float(HA)
            * math.exp(-1000 * float(HEa) / 8.314 / kTemp)
            * (10 ** (-1 * pH)) ** float(HnH)
          )
        if NA is not None:
          NMech = float(NA) * math.exp(-1000 * float(NEa) / 8.314 / kTemp)
        if OHA is not None:
          BMech = (
            float(OHA)
            * math.exp(-1000 * float(OHEa) / 8.314 / kTemp)
            * (10 ** (-1 * pH)) ** float(OHnH)
          )

        if carbonate and co2_input is not None:
          OMech = (
            float(OA)
            * math.exp(-1000 * float(OEa) / 8.314 / kTemp)
            * (10 ** (-1 * float(co2_input))) ** float(OnH)
          )
        elif OA is not None:
          OMech = (
            float(OA)
            * math.exp(-1000 * float(OEa) / 8.314 / kTemp)
            * (10 ** (-1 * pH)) ** float(OnH)
          )

      elif Ref == 4:
        kTemp = temp + 273.15
        if HA is not None and fe_input is not None:
          AMech = (
            float(HA)
            * math.exp(-1000 * float(HEa) / 8.314 / kTemp)
            * (10 ** (-1 * pH)) ** float(Hn1)
            * (10 ** (-1 * float(fe_input))) ** float(Hn3)
          )
        if NA is not None:
          NMech = float(NA) * math.exp(-1000 * float(NEa) / 8.314 / kTemp)
        if OHA is not None:
          BMech = (
            float(OHA)
            * math.exp(-1000 * float(OHEa) / 8.314 / kTemp)
            * (10 ** (-1 * pH)) ** float(OHn2)
          )
        if OA is not None and o_input is not None:
          OMech = (
            float(OA)
            * math.exp(-1000 * float(OEa) / 8.314 / kTemp)
            * (10 ** (-1 * float(o_input))) ** float(On)
          )

      # Calculate total rate
      total = AMech + BMech + NMech + OMech

      # Update reference display string
      if species in [
        "Albite",
        "Calcite",
        "Celestite",
        "Clinochlore (ordered)",
        "CSH(0.8)",
        "Cristobalite (high)",
        "Dolomite",
        "Gibbsite",
        "Kaolinite",
        "Microcline",
        "Portlandite",
        "Quartz",
        "Siderite",
        "Montmorillonite",
      ]:
        dispRef = "Marty et al. (2015)"
      elif species == "Chlorite_Smith_2016":
        dispRef = "Smith and Carroll (2016)"
      elif species == "Illite":
        dispRef = "Smith et al. (2017)"
      elif species == "Kyanite":
        dispRef = "Zhang et al. (2019)"
      elif species == "Lizardite_Daval_2013":
        dispRef = "Daval et al. (2013)"
      elif species == "Muscovite":
        dispRef = "Lammers et al. (2017)"

      # Format result values
      result = RateResult(
        AMech=f"{AMech:.4e}",
        BMech=f"{BMech:.4e}",
        NMech=f"{NMech:.4e}",
        OMech=f"{OMech:.4e}",
        total=f"{total:.4e}",
        logTotal=f"{math.log10(total):.4f}" if total > 0 else "N/A",
        species=species,
        reference=dispRef,
        temp=str(temp),
        pH=str(pH),
      )

      logger.info(
        f"[RATE-CALC] Completed calculation for species '{species}' with total rate={total:.4e} - Client: {client_ip}"
      )

      return result

  except HTTPException:
    raise
  except Exception as e:
    logger.error(
      f"[RATE-CALC] Error calculating rate: {str(e)} - Params: {params} - Client: {client_ip}"
    )
    raise HTTPException(status_code=500, detail=str(e))
