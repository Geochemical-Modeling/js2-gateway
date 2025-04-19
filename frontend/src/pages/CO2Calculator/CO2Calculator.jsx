import React from "react"
import Disclaimer from "../../components/Disclaimer"
import { route_map } from "../../constants"

export default function CO2Calculator() {
  return (
    <main id="main-content" className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm">
      <div className="rvt-layout__content">
        <header>
          <h2 className="rvt-ts-lg rvt-text-medium">CO2 SOLUBILITY CALCULATOR</h2>
          <a className="App-links__item" href={route_map.COTWO_CALCULATOR_ONLINE}>
            <h4>Online CO2 Solubility Calculator</h4>
          </a>
        </header>
      <br />
      <p>
        An online program to calculate CO2 solubility in pure water and aqueous
        NaCl solutions (0-4.5 m) from 273 to 533K and from 0 to 2000 bar. The
        FORTRAN code is written by Sun Rui, now a professor at Northwest
        University in China. Please refer to the article below for further
        details and to cite in your publications:
      </p>

      <p>
        Duan ZH, Sun R, Zhu Chen, Chou I-M (2006) An improved model for the
        calculation of CO2 solubility in aqueous solutions containing Na+, K+,
        Ca2+, Mg2+, Cl−, and SO42− Marine Chemistry 98 (2-4):131-139,{" "}
        <a
          className="App-links__item"
          href="https://www.sciencedirect.com/science/article/pii/S0304420305001118?via%3Dihub"
        >
          DOI
        </a>
      </p>

      <p>
        Please send comments or corrections to Professor Chen Zhu {" "}
        <a className="App-links__item m-2" href="mailto:supcrt@iu.edu">
          supcrt@iu.edu.
        </a>
      </p>

      <pre>
        <p>
          The Fortran code for the calculator was written by <a href="http://geology.nwu.edu.cn/Article/teacher/en/1/id/114.html">
          Sun Rui
          </a>, now a professor at Northwest University in Xian.{" "}
        </p>
        <p>Online adoption was completed by Rob Hageboeck and Kevin Tu.</p>
      </pre>

      <br />

      <Disclaimer />
      </div>
    </main>
  )
}