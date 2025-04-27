import React, { useState, useEffect } from 'react';
import { headerNameMap, headerValueMap, resetMap } from './constants';

const databaseMap = {
  dpronsbl: 'supcrtbl',
  dpronsbl_ree: 'supcrtbl_ree',
};

/**
 * ### SupcrtbOnline
 * The user input page for the Super-Crit application.
 *
 */
export default function SupcrtbOnline() {
  const [species, setSpecies] = useState([]);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [reactionInputs, setReactionInputs] = useState(['']);
  const [selectedDatabase, setSelectedDatabase] = useState('dpronsbl');
  const [reactionString, setReactionString] = useState('');

  // Sub-options for "Specify solvent phase region:"
  const [isOnePhaseRegionSelected, setIsOnePhaseRegionSelected] =
    useState(false);
  const [
    isLiquidVaporSaturationCurveSelected,
    setIsLiquidVaporSaturationCurveSelected,
  ] = useState(false);

  // Sub-options for "Specify independent state variable:"
  const [isTemperatureDensitySelected, setIsTemperatureDensitySelected] =
    useState(false);
  const [isTemperaturePressureSelected, setIsTemperaturePressureSelected] =
    useState(false);

  // Sub-options for "Specify independent liq-vap saturation variable:"
  const [isTemperatureSelected, setIsTemperatureSelected] = useState(false);
  const [isPressureSelected, setIsPressureSelected] = useState(false);

  // Sub-options for "Specify tabulation option:"
  const [isCalculateIsochoricSelected, setIsCalculateIsochoricSelected] =
    useState(false);
  const [isCalculateIsothermalSelected, setIsCalculateIsothermalSelected] =
    useState(false);
  const [isCalculateIsoBaricSelected, setIsCalculateIsoBaricSelected] =
    useState(false);

  // Sub-options for "Would you like to use the univariant curve option?"
  const [isUnivariantCurveYesSelected, setIsUnivariantCurveYesSelected] =
    useState(false);
  const [isUnivariantCurveNoSelected, setIsUnivariantCurveNoSelected] =
    useState(false);

  // Sub-options for "Specify univariant calculation option:"
  const [isCalculateTSelected, setIsCalculateTSelected] = useState(false);
  const [isCalculatePSelected, setIsCalculatePSelected] = useState(false);

  // Sub-options for "Specify table-increment option:"
  const [isUniformIncrementSelected, setIsUniformIncrementSelected] =
    useState(false);
  const [isUnequalIncrementSelected, setIsUnequalIncrementSelected] =
    useState(false);

  const [reactionFileOption, setReactionFileOption] = useState(-1);

  // When selectedDatabase changes, fetch new species data.
  useEffect(() => {
    fetchSpeciesData(databaseMap[selectedDatabase]);
  }, [selectedDatabase]);

  // Every time reactInputs changes,
  useEffect(() => {
    setReactionString(reactionInputs.join('\n'));
  }, [reactionInputs]);

  // Given a database, fetch and update state containing the species
  const fetchSpeciesData = async (database) => {
    try {
      const response = await fetch(
        `https://js2test.ear180013.projects.jetstream-cloud.org/DB.php?query=Name-${database}`,
      );
      const data = await response.json();
      console.log('Fetched species data:', data); // Log the fetched data

      // Flatten the nested arrays into a single array
      const allSpecies = Object.values(data).flat();
      console.log('Flattened species data:', allSpecies); // Log the flattened data

      setSpecies(allSpecies);
      setFilteredSpecies(allSpecies);
    } catch (error) {
      console.error('Error fetching species data:', error);
    }
  };

  // Handle state change when different database file is selected
  const handleDatabaseChange = (event) => {
    setSelectedDatabase(event.target.value);
  };

  const handleInputChange = (index, event, value) => {
    const newInputs = [...reactionInputs];
    newInputs[index] = value;
    setReactionInputs(newInputs);

    if (!species || species.length === 0) {
      setFilteredSpecies([]);
      return;
    }

    const lines = value.split('\n');
    const lastLine = lines[lines.length - 1];
    const numericPart = lastLine.match(/^[\d\s-]*/)?.[0] || '';
    const alphaPart = lastLine.replace(/^[\d\s-]*/, '');

    if (alphaPart.trim() === '') {
      setFilteredSpecies(species);
      return;
    }

    const filtered = species.filter((specie) =>
      specie.toLowerCase().includes(alphaPart.toLowerCase()),
    );

    setFilteredSpecies(filtered);
  };

  const handleSelect = (index, val) => {
    const newInputs = [...reactionInputs];
    const lines = newInputs[index].split('\n');
    const lastLine = lines.pop() || '';
    const numericPart = lastLine.match(/^[\d\s-]*/)?.[0] || '';
    const newLine = numericPart + val;
    newInputs[index] = [...lines, newLine].join('\n');
    setReactionInputs(newInputs);
  };

  const addNewLine = () => {
    setReactionInputs([...reactionInputs, '']);
  };

  const handleRemoveLine = (index) => {
    const newInputs = reactionInputs.filter((_, i) => i !== index);
    setReactionInputs(newInputs);
  };

  const resetDependentStates = (currentHeader) => {
    const dependencies = resetMap[currentHeader];
    if (!dependencies) return;

    dependencies.forEach((dependency) => {
      switch (dependency) {
        case 'isLiquidVaporSaturationCurveSelected':
          setIsLiquidVaporSaturationCurveSelected(false);
          break;
        case 'isOnePhaseRegionSelected':
          setIsOnePhaseRegionSelected(false);
          break;
        case 'isTemperatureDensitySelected':
          setIsTemperatureDensitySelected(false);
          break;
        case 'isTemperaturePressureSelected':
          setIsTemperaturePressureSelected(false);
          break;
        case 'isTemperatureSelected':
          setIsTemperatureSelected(false);
          break;
        case 'isPressureSelected':
          setIsPressureSelected(false);
          break;
        case 'isCalculateIsochoricSelected':
          setIsCalculateIsochoricSelected(false);
          break;
        case 'isCalculateIsothermalSelected':
          setIsCalculateIsothermalSelected(false);
          break;
        case 'isCalculateIsoBaricSelected':
          setIsCalculateIsoBaricSelected(false);
          break;
        case 'isUnivariantCurveYesSelected':
          setIsUnivariantCurveYesSelected(false);
          break;
        case 'isUnivariantCurveNoSelected':
          setIsUnivariantCurveNoSelected(false);
          break;
        case 'isCalculateTSelected':
          setIsCalculateTSelected(false);
          break;
        case 'isCalculatePSelected':
          setIsCalculatePSelected(false);
          break;
        case 'isUniformIncrementSelected':
          setIsUniformIncrementSelected(false);
          break;
        case 'isUnequalIncrementSelected':
          setIsUnequalIncrementSelected(false);
          break;
      }
    });
  };

  const handleCheckBoxChange = (option, isSelected) => {
    const optionStateSetters = {
      'One-Phase Region': setIsOnePhaseRegionSelected,
      'Liquid Vapor Saturation Curve': setIsLiquidVaporSaturationCurveSelected,
      'Temprature (degCel), density(H2O) (g/cc)':
        setIsTemperatureDensitySelected,
      'Temprature (degCel)': setIsTemperatureSelected,
      'Pressure (bars)': setIsPressureSelected,
      'Temprature (degCel), pressure (bars)': setIsTemperaturePressureSelected,
      'Calculate ISOCHORIC (T) tables': setIsCalculateIsochoricSelected,
      'Calculate ISOTHERMAL (D) tables': setIsCalculateIsothermalSelected,
      'Calculate ISOBARIC (P) tables': setIsCalculateIsoBaricSelected,
      Yes: setIsUnivariantCurveYesSelected,
      No: setIsUnivariantCurveNoSelected,
      'Calculate T (logK, isobars)': setIsCalculateTSelected,
      'Calculate P (logK, isotherms)': setIsCalculatePSelected,
      'Calculate tables having uniform increments':
        setIsUniformIncrementSelected,
      'Calculate tables having unequal increments':
        setIsUnequalIncrementSelected,
    };

    if (optionStateSetters[option]) {
      optionStateSetters[option](isSelected);
      if (isSelected) {
        resetDependentStates(option);
      }
    } else {
      console.warn('Unhandled option in handleCheckBoxChange:', option);
    }
  };

  const formRadioOptions = [
    {
      'Specify solvent phase region:': [
        true,
        {
          'One-Phase Region': true,
          'Liquid Vapor Saturation Curve': true,
        },
      ],
    },
    {
      'Specify independent State Variables:': [
        isOnePhaseRegionSelected,
        {
          'Temprature (degCel), density(H2O) (g/cc)': true,
          'Temprature (degCel), pressure (bars)': true,
        },
      ],
    },
    {
      'Specify tabulation option(Chronic, Thermal):': [
        isTemperatureDensitySelected,
        {
          'Calculate ISOCHORIC (T) tables': true,
          'Calculate ISOTHERMAL (D) tables': true,
        },
      ],
    },
    {
      'Would you like to use the univariant curve option? (i.e., calculate T(logK,P) or P(logK,T):':
        [
          isTemperaturePressureSelected,
          {
            Yes: true,
            No: true,
          },
        ],
    },
    {
      'Specify univariant calculation option:': [
        isUnivariantCurveYesSelected,
        {
          'Calculate T (logK, isobars)': true,
          'Calculate P (logK, isotherms)': true,
        },
      ],
    },
    {
      'Specify tabulation option(Baric, Thermal):': [
        isUnivariantCurveNoSelected,
        {
          'Calculate ISOBARIC (P) tables': true,
          'Calculate ISOTHERMAL (D) tables': true,
        },
      ],
    },
    {
      'Specify independent liq-vap saturation variable:': [
        isLiquidVaporSaturationCurveSelected,
        {
          'Temprature (degCel)': true,
          'Pressure (bars)': true,
        },
      ],
    },
    {
      'Specify table-increment option:': [
        isCalculateIsothermalSelected ||
          isCalculateIsochoricSelected ||
          isCalculateIsoBaricSelected ||
          isTemperatureSelected ||
          isPressureSelected,
        {
          'Calculate tables having uniform increments': true,
          'Calculate tables having unequal increments': true,
        },
      ],
    },
  ];

  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content">
        {/* Header with title and citation card for using the software */}
        <header>
          <h2 className="rvt-ts-md">SUPCRTBL ONLINE VERSION 3.0.0</h2>
          <hr />

          <div className="rvt-container-lg [ rvt-m-top-sm ]">
            <div className="rvt-row justify-content-center">
              <div className="rvt-cols-8">
                <div
                  className="rvt-card"
                  style={{ borderColor: '#ced4da', backgroundColor: '#ffffff' }}
                >
                  <div className="rvt-card__body">
                    <h2
                      className="rvt-card__title"
                      style={{ fontWeight: 'bold', color: '#343a40' }}
                    >
                      Acknowledgment and Citation
                    </h2>
                    <div className="rvt-card__content [ rvt-flow ]">
                      <p style={{ fontStyle: 'italic', color: '#6c757d' }}>
                        User please cite:
                      </p>
                      <p
                        style={{
                          fontFamily: 'Times New Roman',
                          color: 'purple',
                        }}
                      >
                        Zimmer, K., Zhang, Y.L., Lu, P., Chen, Y.Y., Zhang,
                        G.R., Dalkilic, M., and Zhu, C. (2016) SUPCRTBL: A
                        revised and extended thermodynamic dataset and software
                        package of SUPCRT92.
                        <i> Computer and Geosciences</i> 90:97-111.{' '}
                        <a
                          href="https://doi.org/10.1016/j.cageo.2016.02.013"
                          style={{ color: 'crimson' }}
                        >
                          <b>DOI</b>
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Input form for the calculator */}
        <form
          action="https://js2test.ear180013.projects.jetstream-cloud.org/supcrtbl/supcrtbl3.php"
          method="post"
          encType="multipart/form-data"
        >
          <div className="rvt-m-bottom-sm">
            <label htmlFor="outputFile" className="rvt-label">
              Output File Name:
            </label>
            <input
              type="text"
              required
              name="outputFile"
              id="outputFile"
              className="rvt-text-input"
            />
          </div>

          <div className="rvt-m-bottom-sm">
            <label htmlFor="slopFile" className="rvt-label">
              Database File:
            </label>
            <select
              name="slopFile"
              id="slopFile"
              value={selectedDatabase}
              onChange={handleDatabaseChange}
            >
              <option value="dpronsbl">supcrtbl.dat</option>
              <option value="dpronsbl_ree">supcrtbl_REE.dat</option>
            </select>
          </div>

          {/* Render radio option groups */}
          {formRadioOptions?.map((element, index) => {
            const header = Object.keys(element)[0];
            const [currentStateValue, optionsMap] = Object.values(element)[0];
            let shouldDisplay = false;
            if (currentStateValue) {
              shouldDisplay = true;
            }
            if (!shouldDisplay) {
              return <></>;
            }
            return (
              <fieldset className="rvt-fieldset" key={index}>
                <legend className="rvt-text-bold">{header}</legend>
                <ul className="rvt-list-plain">
                  {Object.entries(optionsMap)?.map(
                    ([optionLabel, _], optionIndex) => (
                      <li key={optionIndex}>
                        <div className="rvt-radio">
                          <input
                            required
                            type="radio"
                            name={headerNameMap[header]}
                            id={headerNameMap[header]}
                            value={headerValueMap[optionLabel]}
                            onClick={() => {
                              handleCheckBoxChange(optionLabel, true);
                            }}
                          />
                          <label
                            htmlFor={headerNameMap[header]}
                            className="rvt-label"
                          >
                            {optionLabel}
                          </label>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              </fieldset>
            );
          })}

          {/* Render Text Inputs that are heavily conditional */}
          {isLiquidVaporSaturationCurveSelected && (
            <>
              {isPressureSelected && (
                <>
                  {isUnequalIncrementSelected && (
                    <div>
                      <label htmlFor="lipVapSatPresVal" className="rvt-label">
                        Specify liq-vap saturation PRES (bars) values: <br />{' '}
                        One per line, concluding with 0
                      </label>
                      <textarea
                        name="lipVapSatPresVal"
                        id="lipVapSatPresVal"
                        className="rvt-textarea"
                      />
                    </div>
                  )}
                  {isUniformIncrementSelected && (
                    <div>
                      <label htmlFor="presRange" className="rvt-label">
                        Specify PRES (bars) range:
                        <br />
                        min, max, increment
                      </label>
                      <input
                        type="text"
                        name="presRange"
                        id="presRange"
                        className="rvt-text-input"
                      />
                    </div>
                  )}
                </>
              )}
              {isTemperatureSelected && (
                <>
                  {isUniformIncrementSelected && (
                    <div>
                      <label className="rvt-label" htmlFor="tempRange">
                        Specify TEMP (degCel) range: <br />
                        min, max, increment
                      </label>
                      <input
                        type="text"
                        name="tempRange"
                        id="tempRange"
                        className="rvt-text-input"
                      />
                    </div>
                  )}
                  {isUnequalIncrementSelected && (
                    <div>
                      <label htmlFor="lipVapSatTempVal" className="rvt-label">
                        Specify liq-vap saturation TEMP (degCel) values: <br />
                        One per line, concluding with 0
                      </label>
                      <textarea
                        id="lipVapSatTempVal"
                        name="lipVapSatTempVal"
                        className="rvt-textarea"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {isTemperatureDensitySelected && (
            <>
              {isCalculateIsochoricSelected && isUniformIncrementSelected && (
                <div className="rvt-m-top-xs rvt-m-bottom-xs">
                  <div>
                    <label htmlFor="isochoresRange" className="rvt-label">
                      ISOCHORES Range (g/cc): min, max, increment
                    </label>
                    <input
                      required
                      type="text"
                      name="isochoresRange"
                      id="isochoresRange"
                      className="rvt-text-input"
                    />
                  </div>

                  <div className="rvt-m-top-xs rvt-m-bottom-xs">
                    <label className="rvt-label" htmlFor="tempRange">
                      TEMP Range (degCel): min, max, increment
                    </label>
                    <input
                      required
                      type="text"
                      name="tempRange"
                      id="tempRange"
                      className="rvt-text-input"
                    />
                  </div>
                </div>
              )}

              {isCalculateIsochoricSelected && isUnequalIncrementSelected && (
                <div className="rvt-m-top-xs rvt-m-bottom-xs">
                  <div className="rvt-m-bottom-xs">
                    <label className="rvt-label" htmlFor="dH2OTempPairs">
                      Specify DH2O(g/cc), TEMP (degCel) value pairs: <br />
                      One pair per line, ending with 0,0
                    </label>
                    <textarea
                      required
                      name="dH2OTempPairs"
                      id="dH2OTempPairs"
                      className="rvt-textarea"
                    />
                  </div>
                </div>
              )}

              {isCalculateIsothermalSelected && isUniformIncrementSelected && (
                <div className="rvt-m-top-xs rvt-m-bottom-xs">
                  <div className="rvt-m-bottom-xs">
                    <label className="rvt-label" htmlFor="isothermsRange">
                      Specify ISOTHERMS (degCel) range: <br />
                      min, max, increment
                    </label>
                    <input
                      required
                      type="text"
                      name="isothermsRange"
                      id="isothermsRange"
                      className="rvt-text-input"
                    />
                  </div>

                  <div className="rvt-m-bottom-xs">
                    <label className="rvt-label" htmlFor="dH2ORange">
                      Specify DH2O (g/cc) range: <br />
                      min, max, increment
                    </label>
                    <input
                      required
                      type="text"
                      name="dH2ORange"
                      id="dH2ORange"
                      className="rvt-text-input"
                    />
                  </div>
                </div>
              )}

              {isCalculateIsothermalSelected && isUnequalIncrementSelected && (
                <div className="rvt-m-bottom-xs">
                  <label className="rvt-label" htmlFor="tempDH2OPairs">
                    Specify TEMP (degCel), DH2O(g/cc) value pairs: <br />
                    One pair per line, ending with 0,0
                  </label>
                  <textarea
                    required
                    name="tempDH2OPairs"
                    id="tempDH2OPairs"
                    className="rvt-textarea"
                  />
                </div>
              )}
            </>
          )}

          {isTemperaturePressureSelected && (
            <>
              {isUnivariantCurveYesSelected && (
                <>
                  {isCalculateTSelected && (
                    <div>
                      <div>
                        <label className="rvt-label" htmlFor="isobarsRange">
                          Specify ISOBARS(bars) range: <br />
                          min, max, increment
                        </label>
                        <input
                          type="text"
                          name="isobarsRange"
                          id="isobarsRange"
                          className="rvt-text-input"
                        />
                      </div>
                      <div>
                        <label className="rvt-label" htmlFor="logKRange">
                          Specify logK range: <br />
                          Kmin, Kmax, Kincrement
                        </label>
                        <input
                          type="text"
                          name="logKRange"
                          id="logKRange"
                          className="rvt-text-input"
                        />
                      </div>
                      <div>
                        <label
                          className="rvt-label"
                          htmlFor="logKBoundingTempRange"
                        >
                          Specify bounding TEMP (degCel) range: <br />T min, T
                          max
                        </label>
                        <input
                          type="text"
                          name="logKBoundingTempRange"
                          id="logKBoundingTempRange"
                          className="rvt-text-input"
                        />
                      </div>
                    </div>
                  )}
                  {isCalculatePSelected && (
                    <div className="rvt-m-top-xs rvt-m-bottom-xs">
                      <div>
                        <label className="rvt-label" htmlFor="isothermsRange">
                          Specify ISOTHERMS (degCel) range: <br />
                          min, max, increment
                        </label>
                        <input
                          type="text"
                          name="isothermsRange"
                          id="isothermsRange"
                          className="rvt-text-input"
                        />
                      </div>
                      <div>
                        <label className="rvt-label" htmlFor="logKRange">
                          Specify logK range: <br />
                          Kmin, Kmax, Kincrement
                        </label>
                        <input
                          type="text"
                          name="logKRange"
                          id="logKRange"
                          className="rvt-text-input"
                        />
                      </div>
                      <div>
                        <label
                          className="rvt-label"
                          htmlFor="logKBoundingPresRange"
                        >
                          Specify bounding PRES (bars) range: <br />P min, P max
                        </label>
                        <input
                          type="text"
                          name="logKBoundingPresRange"
                          id="logKBoundingPresRange"
                          className="rvt-text-input"
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
              {isUnivariantCurveNoSelected && (
                <>
                  {isCalculateIsoBaricSelected && (
                    <>
                      {isUniformIncrementSelected && (
                        <div>
                          <div>
                            <label classLabel="rvt-label" htmlFor="tempRange">
                              Specify TEMP (degCel) range:
                              <br />
                              min, max, increment
                            </label>
                            <input
                              type="text"
                              name="tempRange"
                              id="tempRange"
                              className="rvt-text-input"
                            />
                          </div>
                          <div>
                            <label
                              classLabel="rvt-label"
                              htmlFor="isobarsRange"
                            >
                              Specify ISOBARS(bars) range:
                              <br />
                              min, max, increment
                            </label>
                            <input
                              type="text"
                              name="isobarsRange"
                              id="isobarsRange"
                              className="rvt-text-input"
                            />
                          </div>
                        </div>
                      )}{' '}
                      {isUnequalIncrementSelected && (
                        <div>
                          <label className="rvt-label" htmlFor="presTempPairs">
                            Specify PRES (bars), TEMP (degCel) value pairs:
                            <br />
                            One pair per line, ending with 0,0
                          </label>
                          <textarea
                            id="presTempPairs"
                            name="presTempPairs"
                            className="rvt-textarea"
                          />
                        </div>
                      )}
                    </>
                  )}
                  {isCalculateIsothermalSelected && (
                    <>
                      {isUniformIncrementSelected && (
                        <div>
                          <div>
                            <label
                              className="rvt-label"
                              htmlFor="isothermsRange"
                            >
                              Specify ISOTHERMS (degCel) range:
                              <br />
                              min, max, increment
                            </label>
                            <input
                              type="text"
                              name="isothermsRange"
                              id="isothermsRange"
                              className="rvt-text-input"
                            />
                          </div>
                          <div>
                            <label className="rvt-label" htmlFor="presRange">
                              Specify PRES (bars) range:
                              <br />
                              min, max, increment
                            </label>
                            <input
                              type="text"
                              name="presRange"
                              id="presRange"
                              className="rvt-text-input"
                            />
                          </div>
                        </div>
                      )}
                      {isUnequalIncrementSelected && (
                        <div>
                          <label className="rvt-label" htmlFor="tempPresPairs">
                            Specify TEMP (degCel), Pres(g/cc) value pairs:
                            <br />
                            One pair per line, ending with 0,0
                          </label>
                          <textarea
                            name="tempPresPairs"
                            id="tempPresPairs"
                            className="rvt-textarea"
                          />
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}

          <div className="mt-3">
            <label>Specify reaction file:</label>
            <Form.Check
              name="reactionOption"
              id="reactionOption"
              label="Use an existing reaction file"
              value="0"
              onChange={(e) => setReactionFileOption(0)}
              type="radio"
            ></Form.Check>
            <Form.Check
              name="reactionOption"
              id="reactionOption"
              label="Build a new reaction file"
              value="1"
              onChange={(e) => setReactionFileOption(1)}
              type="radio"
            ></Form.Check>
          </div>

          {reactionFileOption === 0 ? (
            <div>
              <label className="text-bold">Reaction File:</label>
              <Form.Control
                name="reactFile"
                type="file"
                accept=".dat"
              ></Form.Control>
            </div>
          ) : reactionFileOption === 1 ? (
            <div>
              <label>
                Insert reactions here, 1 species per line, empty line between
                reactions
                <br /> Numbers are the stoichiometric coefficient of the
                species.
                <br /> Positive numbers are products and negative numbers are
                reactants,
                <br />
                e.g. QUARTZ {'=>'} SiO2,aq:
                <br />
                <code>
                  -1 QUARTZ
                  <br />1 SiO2,aq
                </code>
              </label>
              {reactionInputs.map((input, index) => (
                <div
                  key={index}
                  style={{ display: 'flex', alignItems: 'center' }}
                >
                  <Autocomplete
                    getItemValue={(item) => item}
                    items={filteredSpecies || []}
                    renderItem={(item, isHighlighted) => (
                      <div
                        key={item}
                        style={{
                          background: isHighlighted ? 'lightgray' : 'white',
                        }}
                      >
                        {item}
                      </div>
                    )}
                    value={input}
                    onChange={(e) =>
                      handleInputChange(index, e, e.target.value)
                    }
                    onSelect={(val) => handleSelect(index, val)}
                    inputProps={{
                      name: `reaction${index}`,
                      style: { width: '300px', marginBottom: '10px' },
                    }}
                  />
                  <Button
                    variant="danger"
                    onClick={() => handleRemoveLine(index)}
                    style={{ marginLeft: '10px' }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button variant="secondary" onClick={addNewLine}>
                Add New Line
              </Button>
              <Form.Control
                type="hidden"
                name="reaction"
                value={reactionString}
              />
            </div>
          ) : (
            <></>
          )}
          <div className="mt-3">
            <label> Specify option for x-y plot files:</label>
            <Form.Check
              name="kalFormatOption"
              id="Do not generate plot files"
              label="Do not generate plot files"
              value="0"
              required
              type="radio"
            />
            <Form.Check
              name="kalFormatOption"
              id="Generate plot files in generic format"
              label="Generate plot files in generic format"
              value="1"
              required
              type="radio"
            />
          </div>
          <Button className="mt-3" type="submit">
            SUBMIT
          </Button>
        </form>
      </div>
    </main>
  );
}
