from fastapi import Form, HTTPException, APIRouter, Request
import logging
from sqlmodel import select, text
from app.db.database import get_session

# Configure detailed logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
router = APIRouter()

# These are allowed databases for the supcrtbl
allowed_databases = [
  "supcrtbl"
  "supcrtbl_ree"
]

DB_TABLE_NAME = "geosci_consolidated_tables1"

@router.get("/api/species", tags=["Species"])
async def get_mineral_species(request: Request, query: str):
    """Get list of available mineral species in the application
    
    
    NOTE: Ideally this endpoint should be used for both rate calc and supcrtblonline. The former always querying for "Species" and then
    the later just querying for the database I guess. Though if you run into design issues, feel free to change this.
    """
    client_ip = request.client.host if request.client else "unknown"
    

    try:
        with get_session() as session:
            if session is None:
                logger.error(f"[Minerals] Database session is None. Cannot fetch mineral species. Client: {client_ip}")
                raise HTTPException(status_code=503, detail="Database connection unavailable")
          
            if query == "Species":
              # If they want species 
              sql_query = text(f"""
                  SELECT DISTINCT Species 
                  FROM {DB_TABLE_NAME}.rate_utility_palandri 
                  UNION 
                  SELECT DISTINCT Species 
                  FROM {DB_TABLE_NAME}.rate_utility_carbonates 
                  UNION 
                  SELECT DISTINCT Species 
                  FROM {DB_TABLE_NAME}.rate_utility_oxygen 
                  ORDER BY Species
              """)
            else:
              # Else they aren't using "Species", the query corresponds to a data file name or something
              # NOTE: Use allow-list to prevent SQL injection.
              if (query not in allowed_databases):
                 raise HTTPException(status_code=400, detail=f"Query called '{query}' is not supported.")
              
              sql_query = text(f"""
                  SELECT Species 
                  FROM {DB_TABLE_NAME}.{query}_nonphasetransition 
                  UNION 
                  SELECT Species 
                  FROM {DB_TABLE_NAME}.{query}_landautheory 
                  UNION 
                  SELECT Species 
                  FROM {DB_TABLE_NAME}.{query}_braggwilliams 
                  UNION
                  SELECT Species 
                  FROM {DB_TABLE_NAME}.{query}_gases
                  UNION
                  SELECT Species 
                  FROM {DB_TABLE_NAME}.{query}_aqueous
                  ORDER BY Species
              """)

            result = session.exec(sql_query)
            species_list = [row[0] for row in result]
            logger.info(f"[Minerals] Retrieved {len(species_list)} mineral species for client: {client_ip}")
            return species_list
    except Exception as e:
        logger.error(f"[Minerals] Error fetching mineral species: {str(e)} - Client: {client_ip}")
        raise HTTPException(status_code=500, detail=str(e))