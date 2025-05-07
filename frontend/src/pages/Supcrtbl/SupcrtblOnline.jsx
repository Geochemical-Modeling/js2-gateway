import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { headerNameMap, headerValueMap, resetMap } from './constants';
import Alert from '../../components/Alert';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import FileInput from '../../components/FileInput';

export default function SupcrtbOnline() {
  const navigate = useNavigate();
  const [species, setSpecies] = useState([]);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [reactionInputs, setReactionInputs] = useState(['']);
  const [selectedDatabase, setSelectedDatabase] = useState('dpronsbl');
  const databaseMap = {
    dpronsbl: 'supcrtbl',
    dpronsbl_ree: 'supcrtbl_ree',
  };

  const [reactionString, setReactionString] = useState('');

  // Every time reactInputs changes,
  useEffect(() => {
    setReactionString(reactionInputs.join('\n'));
  }, [reactionInputs]);

  useEffect(() => {
    fetchSpeciesData(databaseMap[selectedDatabase]);
  }, [databaseMap[selectedDatabase]]);

  const fetchSpeciesData = async (database) => {
    try {
      const response = await fetch(`/api/species?query=${database}`);
      const allSpecies = await response.json();

      // const response = await fetch(
      //   `https://js2test.ear180013.projects.jetstream-cloud.org/DB.php?query=Name-${database}`,
      // );
      // Flatten the nested arrays into a single array
      // const allSpecies = Object.values(data).flat();

      // Use this to see if there's a difference in the number of species. If there
      // aren't, then it's probably a good change.
      console.log('Fetched species data:', data); // Log the fetched data
      console.log('Flattened species data:', allSpecies); // Log the flattened data

      setSpecies(allSpecies);
      setFilteredSpecies(allSpecies);
    } catch (error) {
      console.error('Error fetching species data:', error);
    }
  };

  const handleDatabaseChange = (event) => {
    setSelectedDatabase(event.target.value);
  };

  /**
   * Using the autocomplete users can enter in species, where each line represents a species:
   * - Numbers: The stoichiometric coefficient of the species. Positive numbers are products and negatives are reactants.
   * - Space: Space goes in between them.
   * - Name of the species: Comes after such as 'SIO2,aq or' 'Quartz'
   *
   * E.g. -1 H2O
   *
   * However a reaction consists of multiple lines:
   *
   * -1 H2O # start reaction 1
   * -1 CO2
   * 1 H2CO3
   * \n
   * 2 CO2 #start reaction two
   *
   * Then empty lines separate different reaction
   *
   * Our goals:
   * - when the user types, show filtered suggestions based on the last line
   * - When the user selects, replace the last line with numeric part + selected species
   *
   * -1 H2O
   * 1 CO
   * -1 H
   *
   * Should return:
   *
   * {
   *  lines: ['-1 H2O', '1 CO'],
   *  numericPart: '-1 ',
   *  speciesPart: 'H'
   * }
   *
   * The reason we're even talking about the last line is becasue
   * our autocomplete is going to target the last line that we are typing. So we'll
   * replace the last line when the user selects a given suggestion. After replacing that last line, we'll
   * update that in the reaction inputs array.
   */

  const parseLastLine = (text) => {
    const lines = text.split('\n');
    const lastLine = lines.pop() || '';
    const numericPart = lastLine.match(/^[\d\s-]*/)?.[0] || '';
    const speciesPart = lastLine.replace(/^[\d\s-]*/, '').trim();
    return { lines, numericPart, speciesPart };
  };

  const handleInputChange = (index, value) => {
    /**
     * 1. Copy reaction inputs array
     * 2. Replace the input at index with the new value
     * 3. If no species list, clear our filtered results and stop
     * 4. Get the last line of our value. Apparently this assumes where the user is typing.
     * 5. Extract the "alpha part" (species name" by removing digits, spaces, and dashes from the beginning.
     * 6. Update the filteredSpecies list to only include species that include the
     * species name of the current species
     *
     */
    const newInputs = [...reactionInputs];
    newInputs[index] = value;
    setReactionInputs(newInputs);

    if (!species || species.length === 0) {
      setFilteredSpecies([]);
      return;
    }

    // At a given index split it by new lines? Why? When would a speciies have new lines
    const { speciesPart } = parseLastLine(value);
    // If no species name was listed, show all species
    if (!speciesPart) {
      setFilteredSpecies(species);
    } else {
      // At this point there exists some string, query to find all species that have the "alpha" part as a substring
      const filtered = species.filter((specie) =>
        specie.toLowerCase().includes(speciesPart.toLowerCase()),
      );

      // Update the filtered species to include all species we found that matched what they typed as the alpha
      setFilteredSpecies(filtered);
    }
  };

  const handleSelect = (index, selectedSpecies) => {
    /**
     * 1. Creates a new reactionInputs array, a shallow copy, which means the array is new but the elements inside are the same references.
     * 2. Splits the string at index by new lines. Store those strings as an array.
     * 3. Gets the last line, default to an empty string. Return the array of strings that were numeric?
     * 4. Then handle adding the value to only the numeric part of the array?
     * 5. Update the reaction input array
     *
     */
    const newInputs = [...reactionInputs];
    const { lines, numericPart } = parseLastLine(newInputs[index]);
    const completeLine = `${numericPart}${selectedSpecies}`;
    newInputs[index] = [...lines, completeLine].join('\n');
    setReactionInputs(newInputs);
  };

  /**
   * Adds a new empty element in the reactionInputs array, which represents an empty selection
   */
  const addNewLine = () => {
    setReactionInputs([...reactionInputs, '']);
  };

  /**
   * Deletes element at index in the reactionInputs array
   */
  const handleRemoveLine = (index) => {
    const newInputs = reactionInputs.filter((_, i) => i !== index);
    setReactionInputs(newInputs);
  };

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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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
      'Temperature (degCel), density(H2O) (g/cc)':
        setIsTemperatureDensitySelected,
      'Temperature (degCel)': setIsTemperatureSelected,
      'Pressure (bars)': setIsPressureSelected,
      'Temperature (degCel), pressure (bars)': setIsTemperaturePressureSelected,
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

  const handleSubmit = async (e) => {
    // Extract the form data object that was gained from the form data object.
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const url = '/api/supcrtbl';
      const formData = new FormData(e.target);
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      const JSON = await response.json();

      if (!response.ok) {
        setError(JSON.message);
        setIsLoading(false);
        return;
      }

      // After successful submission navigate to the results page
      navigate(`/supcrtbl/results/${JSON.data.experiment_id}`);
    } catch (err) {
      setError(
        'Network error. Please check your connection and try again later!',
      );
    }

    setIsLoading(false);
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
          'Temperature (degCel), density(H2O) (g/cc)': true,
          'Temperature (degCel), pressure (bars)': true,
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
          'Temperature (degCel)': true,
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
        <header>
          <h2 className="rvt-ts-md">SUPCRTBL ONLINE VERSION 3.0.0</h2>
          <hr />
          <div className="rvt-card rvt-card--raised">
            <div className="rvt-card__body">
              <h2>Acknowledgement and Citation</h2>
              <h3 style={{ fontStyle: 'italic', color: '#6c757d' }}>
                Users please cite this
              </h3>
              <div className="rvt-card__content [ rvt-flow ]">
                <p>
                  Zimmer, K., Zhang, Y.L., Lu, P., Chen, Y.Y., Zhang, G.R.,
                  Dalkilic, M., and Zhu, C. (2016) SUPCRTBL: A revised and
                  extended thermodynamic dataset and software package of
                  SUPCRT92.
                  <i> Computer and Geosciences</i> 90:97-111.{' '}
                  <a
                    href="https://doi.org/10.1016/j.cageo.2016.02.013"
                    className="rvt-color-crimson-700"
                  >
                    <b>DOI</b>
                  </a>
                </p>
              </div>
            </div>
          </div>
        </header>

        <br />

        <form
          onSubmit={handleSubmit}
          method="post"
          encType="multipart/form-data"
        >
          {error && (
            <Alert
              type="error"
              title={`Error working with Supcrtbl`}
              subtitle={error}
            />
          )}

          {/* Output File and database selection */}
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
              className="rvt-select"
              name="slopFile"
              id="slopFile"
              value={selectedDatabase}
              // Just updates the state, and then the effect manages fetching the new data
              onChange={handleDatabaseChange}
            >
              {Object.entries(databaseMap).map(([key, label]) => (
                <option key={key} value={key}>
                  {`${label}.dat`}
                </option>
              ))}
            </select>
          </div>

          {formRadioOptions?.map((element, index) => {
            const header = Object.keys(element)[0];
            const [currentStateValue, optionsMap] = Object.values(element)[0];

            // NOTE: Changing this would break the rendering.
            let shouldDisplay = false;
            if (currentStateValue) {
              shouldDisplay = true;
            }

            return shouldDisplay ? (
              <fieldset
                className="rvt-fieldset rvt-m-top-xs rvt-m-bottom-xs"
                key={index}
              >
                <legend className="rvt-text-bold">{header}</legend>
                <ul className="rvt-list-plain">
                  {Object.entries(optionsMap)?.map(
                    ([optionLabel, _], optionIndex) => (
                      <li key={`${index}-${optionIndex}`}>
                        <div className="rvt-radio">
                          <input
                            type="radio"
                            name={headerNameMap[header]}
                            id={`${header}-${optionIndex}`}
                            value={headerValueMap[optionLabel]}
                            onClick={() => {
                              handleCheckBoxChange(optionLabel, true);
                            }}
                            required
                          />
                          <label htmlFor={`${header}-${optionIndex}`}>
                            {optionLabel}
                          </label>
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              </fieldset>
            ) : (
              <></>
            );
          })}

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

          <fieldset className="rvt-fieldset rvt-m-top-sm">
            <legend className="rvt-text-bold">Specify reaction file</legend>
            <ul className="rvt-list-plain">
              <li>
                <div className="rvt-radio">
                  <input
                    type="radio"
                    name="reactionOption"
                    id="reactionOption-1"
                    value="0"
                    checked={reactionFileOption == 0}
                    onChange={() => setReactionFileOption(0)}
                  />
                  <label htmlFor="reactionOption-1">
                    Use an existing reaction file
                  </label>
                </div>
              </li>
              <li>
                <div className="rvt-radio">
                  <input
                    type="radio"
                    name="reactionOption"
                    id="reactionOption-2"
                    value="1"
                    checked={reactionFileOption == 1}
                    onChange={() => setReactionFileOption(1)}
                  />
                  <label htmlFor="reactionOption-2">
                    Build a new reaction file
                  </label>
                </div>
              </li>
            </ul>
          </fieldset>

          {reactionFileOption === 0 ? (
            <FileInput
              label="Upload Reaction File"
              name="reactFile"
              id="reactFile"
              accept=".dat"
            />
          ) : reactionFileOption === 1 ? (
            <div>
              <label className="rvt-label">
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
                  className="rvt-m-top-xs rvt-flex rvt-items-center"
                >
                  {/* Render an autcomplete that has the value "input" selected */}
                  <Autocomplete
                    disablePortal
                    filterOptions={(x) => x} // disable built in filtering autocomplete filtering; use our custom filtering instead.
                    freeSolo // Basically means you can type in anything, and this is needed
                    options={filteredSpecies}
                    sx={{ width: 300 }}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Enter reaction" />
                    )}
                    value={input}
                    onInputChange={(e, newValue) => {
                      handleInputChange(index, newValue);
                    }}
                    onChange={(e, selectedValue) => {
                      // If you clear things, it could become null so update that to an empty string
                      if (selectedValue == null) {
                        selectedValue = '';
                      }

                      handleSelect(index, selectedValue);
                    }}
                  />

                  <button
                    className="rvt-button rvt-button--danger rvt-m-left-xs"
                    onClick={() => handleRemoveLine(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="rvt-button rvt-m-top-sm"
                onClick={addNewLine}
              >
                Add New Line
              </button>
              <input type="hidden" name="reaction" value={reactionString} />
            </div>
          ) : (
            <></>
          )}

          <fieldset className="rvt-fieldset rvt-m-top-sm">
            <legend className="rvt-text-bold">
              Specify option for x-y plot files
            </legend>
            <ul className="rvt-list-plain">
              <li>
                <div className="rvt-radio">
                  <input
                    type="radio"
                    name="kalFormatOption"
                    id="kalFormatOption-1"
                    value="0"
                  />
                  <label htmlFor="kalFormatOption-1">
                    Do not generate plot files
                  </label>
                </div>
              </li>
              <li>
                <div className="rvt-radio">
                  <input
                    type="radio"
                    name="kalFormatOption"
                    id="kalFormatOption-2"
                    value="1"
                  />
                  <label htmlFor="kalFormatOption-2">
                    Generic plot files in generic format
                  </label>
                </div>
              </li>
            </ul>
          </fieldset>

          <button
            className="rvt-button rvt-m-top-sm"
            type="submit"
            disabled={isLoading}
          >
            SUBMIT
          </button>
        </form>
      </div>
    </main>
  );
}
