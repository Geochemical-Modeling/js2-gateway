import { route_map } from "../../constants"

const links =  [
  {
    name: "Click here to use the online version of ᴘʜʀᴇᴇǫᴄ High T P",
    url: route_map.PHREEQC_ONLINE,
  },
  // {
  //   name: "Version 3 Documentation by Parkhurst and Appelo (2013)",
  //   url: "https://pubs.usgs.gov/publication/tm6A43",
  // },
  // {
  //   name: "Example Input Files",
  //   url: "https://www.resolutionmineeis.us/documents/parkhurst-appelo-2013",
  // },
  {
    name: "USGS Software User Rights Notice",
    url: "https://water.usgs.gov/software/help/notice/",
  },
]

export default function Phreeqc() {

  return (
    <main id="main-content" className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm">
    <div className="rvt-layout__content">
      <header>
        <h2 className="rvt-ts-lg rvt-text-medium">Introduction to Phreeqc</h2>
        <ul className="rvt-list-plain">
          {links.map((el, index) => (
            <li key={index}>
              <a href={el.url}>
                {el.name}
              </a>
            </li>
          )
          )}
        </ul>
      </header>
      
      
      <div>
        <p className="font-weight-light">
          ᴘʜʀᴇᴇǫᴄ is a geochemical modeling software distributed by the U.S.
          Geological Survey and developed by David Parkhurst and Tony Appelo.
          The version here, modified by David Parkhurst, is capable of
          calculations at elevated temperatures and pressures (up to the T-P
          limits in the accompanying thermodynamic datasets, e.g., 1000 °C and
          5000 bars). 
        </p>

        
        <div>
          <p>
            In the pulldown menu, you can find a number of thermodynamic datasets, which are documented in:
          </p>
          <p style={{ fontFamily: "Times New Roman", color: "purple" }}>
            Zhang GR, Lu P, Zhang YL, Tu K, *Zhu C (2020) SupPHREEQC: A program
            to generate customized ᴘʜʀᴇᴇǫᴄ thermodynamic database based on
            Supcrtbl. Computer and Geosciences v143.{" "}
            <a
              href="https://www.sciencedirect.com/science/article/abs/pii/S0098300420305501?via%3Dihub"
              className="rvt-color-crimson-700"
            >
              <b>DOI</b>
            </a>
          </p>
          <p style={{ fontFamily: "Times New Roman", color: "purple" }}>
            Lu P, Zhang GR, Apps J, *Zhu C. (2022) Comparison of thermodynamic
            data files for PHREEQC. Earth-Science Reviews,{" "}
            <a
              href="https://doi.org/10.1016/j.earscirev.2021.103888"
              className="rvt-color-crimson-700"
            >
              <b>DOI</b>
            </a>
          </p>
          <p style={{ fontFamily: "Times New Roman", color: "purple" }}>
            Pan, RG, Gysi A, Migdisov A, Gong L, Lu P, Zhu* C (2024) Linear
            correlations of Gibbs free energy of REE phosphates (monazite,
            xenotime, and rhabdophane) and internally consistent binary mixing
            properties. Minerals 14, 305.{" "}
            <a
              href="https://doi.org/10.3390/min14030305"
              className="rvt-color-crimson-700"
            >
              <b>DOI</b>
            </a>
            . <br /> <br /> Pan RG and Zhu C. Linear correlations of Gibbs free energy
            for rare earth element oxide, hydroxide, chloride, fluoride,
            carbonate, and ferrite minerals and crystalline solids. Geochimica
            et Cosmochimica Acta. Submitted May 3, 2024.{" "}
            <a
              href="https://doi.org/10.48550/arXiv.2405.03515"
              className="rvt-color-crimson-700"
            >
              <b>DOI</b>
            </a>
          </p>
        </div>
      </div>
    </div>
  </main>
  )
}