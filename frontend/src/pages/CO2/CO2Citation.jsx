import React from "react"

export default function CO2Citation() {
  return (
    <div className="rvt-card rvt-card--raised">
      <div className="rvt-card__body">
        <h2 className="rvt-card__title" style={{ fontWeight: "bold", color: "#343a40" }}>
          Acknowledgment and Citation
        </h2>
        <h3 style={{ fontStyle: "italic", color: "#6c757d" }}>Users please cite this</h3>
        <div className="rvt-card__content [ rvt-flow ]">
          <p>
            Duan Z.H., Sun R., Zhu Chen, Chou I-M (2006) An improved model
            for the calculation of CO2 solubility in aqueous solutions
            containing Na<sup>+</sup>, K<sup>+</sup>, Ca<sup>2+</sup>, Mg
            <sup>2+</sup>, Cl<sup>-</sup>, and SO<sub>4</sub>
            <sup>2-</sup>–<i>Marine Chemistry</i>, Volume 98, Issues 2–4,
            Pages 131-139. 
            <a
            href="https://www.sciencedirect.com/science/article/pii/S0304420305001118?via%3Dihub"
            className="rvt-color-crimson-700"
            >DOI</a>
          </p>          
        </div>
      </div>
    </div>
  )
}