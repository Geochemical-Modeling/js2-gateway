
/*
+ Moving pieces to keep track of

### Radio Groups (Conditional Rendering):
We have a set of radio groups (Group A). These radio groups can be rendered or not depending on the value of different groups in
this radio group. As well as this, depending on the selected values in Group A, it influences how we render various text inputs as well.

Finally we also have a set of dependencies. The thing I mean is that when you select a certain option on a given radio group in Group A, 
we will reset the values of some other radio inputs. This is also a tough one because you're resetting the values of 
other states, based on the value of some radio state.

### (Other inputs)
Like we said earlier we have other inputs that need to be rendered as well, and those are also a little difficult to deal 
with. I think the hardest part about this is trying to prevent myself from just rendering them like an array.

### Handling states
- You're probably going to have huge state for the radio inputs, and then some states for the other 
inputs. Pragmatically, only the radio inputs need to be controlled as states, the other inputs don't necessarily
need to since they aren't actually affecting anything. Here's what I'll do:

1. Create radio inputs array for easy renders
2. Create array for other markup, it could be simple with an isDisplay, and a block of markup.

### Handling Radio Button Dependencies
In our application, sometimes when we the user clicks a radio button, we should unselect other 
random buttons. For example:
 * 
- One-Phase Region: selected
  a. Temperature density: selected, again temp density is only rendered since one phase is selected
  b. Temperature pressure 
- Liquid Vapor Saturation Curve:
  a. ...
 * 
Now if you select liquid vapor saturation curve, alongside preventing the render of 
temp density, temp pressure, we will unselect the choice of temp density's radio group. 
As a result, if you select One-Phase region, all the choices that depend on one-phase region
being selected, won't remember their previous input. This helps keep the form cleaned when parts of 
it closes, and seems ot be pretty good for that reason.



*/

import { useEffect, useState } from "react"
import RadioGroup from "../../components/RadioGroup";
import FileInput from "../../components/FileInput";

const resetMap = {
    solventPhase: {
      0: [
        "independentStateVar",
        "lipVapSatVar",
        "tabulationChoricOption",
        "tabulationBaricOption",
        "univariantCurveOption",
        "univariantCalcOption",
        "tableIncrement",
      ],
      1: [
        // Reset states when "Liquid Vapor Saturation Curve" is selected
        "independentStateVar",
        "lipVapSatVar",
        "tabulationChoricOption",
        "tabulationBaricOption",
        "univariantCurveOption",
        "univariantCalcOption",
        "tableIncrement",
      ],
    },
    independentStateVar: {
      0: [
        // Reset states when "Temperature (degCel), density(H2O) (g/cc)" is selected
        "lipVapSatVar",
        "tabulationChoricOption",
        "tabulationBaricOption",
        "univariantCurveOption",
        "univariantCalcOption",
        "tableIncrement",
      ],
      1: [
        // Reset states when "Temperature (degCel), pressure (bars)" is selected
        "lipVapSatVar",
        "tabulationChoricOption",
        "tabulationBaricOption",
        "univariantCurveOption",
        "univariantCalcOption",
        "tableIncrement",
      ],
    },
    tabulationChoricOption: {
      0: [
        // Reset states when "Calculate ISOCHORIC (T) tables" is selected
        "tabulationBaricOption",
        "univariantCurveOption",
        "univariantCalcOption",
      ],
      1: [
        // Reset states when "Calculate ISOTHERMAL (D) tables" is selected
        "tabulationBaricOption",
        "univariantCurveOption",
        "univariantCalcOption",
      ],
    },
    tabulationBaricOption: {
      0: [
        // Reset states when "Calculate ISOBARIC (P) tables" is selected
        // - Resets isothermal on the tabulationChoricOption and resets our univariant calc
        "tabulationChoricOption",
        "univariantCalcOption",
      ],
      1: [
        // Reset states when "Calculate ISOTHERMAL (D) tables" is selected
        // - Make sure we reset isochoric, 
        "tabulationChoricOption",
        "univariantCurveOption",
        "univariantCalcOption",
      ],
    },
    univariantCurveOption: {
      0: [
        // Reset states when "Yes" is selected
        "tabulationChoricOption",
        "tabulationBaricOption",
        "tableIncrement",
      ],
      1: [
        // Reset states when "No" is selected
        "tabulationChoricOption",
        "tabulationBaricOption",
        "tableIncrement",
      ],
    },
    univariantCalcOption: {
     0: ["tableIncrement"],
     1: ["tableIncrement"] 
    }
    // Table increment doesn't matter. Tempature and pressure (lipVapSatVar) does'nt 
};

const databaseMap = {
  dpronsbl: 'supcrtbl',
  dpronsbl_ree: 'supcrtbl_ree',
};

/**
   * 
   * The main issue with controlling the state is knowing what input we're allowed to use when we submit the form. However, this is solvable, 
   * as every controlled input should be a isDisplayed boolean. Yep so the slopFile, the univariantCurve one, all of those names will have a isDisplayed next to them.
   * Now this not only helps with the rendering, but it will also help when deciding whether or not to include it in the final form submission likely. In your submission
   * function when constructing the FormData, you're going iterate.
   * 
   * As well as this the reason we even have resetDependenciesMap in the first place, is to send 
   * radio buttons back to -1. I think Ranvir had the right idea with dependencies map, but 
   * this time, I'm going to associate radio input names with a list of other radio input names.
   * The motivation for this is because hte formState is going to keep tracking stuff, and I guess
   * it could be a little annoying to have an old radio input's data still saved from the previous render
   * 
   * In the original code, the reset map would do something like setIsOnePhase(False), but in our 
   * iteration, we have variables like isOnePhase, which aren't states. Now you may be wondering, 
   * how do we deal with this? We aren't able to directly set it? I mean just set the radio input 
   * that controls the boolean, and therefore you control the boolean
   * 
   * This iterate through all guaranteed and then optional stuff
   * for all radioGroup in radioListA:
   *    if (radioGroup.isDisplayed()) {
   *      - formData.add(radioGroup.name, formData[radioGroup.name])
   *    }
   * 
   * // For all other inputs besides those main radio groups:
   *    - if inputVisibilityMap[name].isVisible:
   *      - formData.add(name, formData[name])
   * 
   * NOTE: I think there's also the issue that some inputs are repeated
   * which can make things complicated. Like what if there are two inputs for "logKBoundingTemp"? that are in different radio 
   * groups or something? How will you handle this? Well that's really tough. I mean as long as two inputs are mapped to the same "name", 
   * then I guess it wouldn't be bad for both of them to control the same one. I think the only one issue happens if you try to add 
   * the same key-value pair to new FormData(), but even then I don't think it matters.
   * 
   * For example "Calculate ISOTHERMAL (D) tables" is an option in tabulationBaric and tabulationChoric. However 
   * doing tabulationBaricOption.value = 1, doesn't mean we also have to set tabulationChoricOption.value = 1. That makes 
   * sense, they're separate input groups. The only thing that's a little unconventional, is that you'll have a boolean like 
   * "is_using_isothermal_d_tables", and that will be calculated as true if it's set in either state.
   * 
   * ### TODO
   * 
   * - Reset dependencies, because our configurations don't match the configurations of the 
   *   original.
   * - 
   * 
   * - You need to work on the autocomplete and implement adding reactions.
   * - 
   * 
   */




export default function NewSupercrtblOnline() {
  const [species, setSpecies] = useState([]);
  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [reactionInputs, setReactionInputs] = useState(['']);
  const [error, setError] = useState("")

  /**
   * Current issue: We're not able to reset the dependencies correctly. Well how can we 
   * fix this? Well I think the optimal fix is to use the strategy that 
   * 
   */

  const [formState, setFormState] = useState({
    // Radio Buttons
    "solventPhase": -1,
    "independentStateVar": -1,
    "lipVapSatVar": -1,
    "tabulationBaricOption": -1,
    "tabulationChoricOption": -1,
    "univariantCurveOption": -1,
    "univariantCalcOption": -1,    
    "tableIncrement": -1,
    "reactionOption": -1,
    "kalFormatOption": -1,

    // Text and other inputs; honestly you don't need to track these I don't think.
    // But it's fine
    // The main attraction are those radio buttons which control the entirety of the conditional rendering.
    "slopFile": "dpronsbl",
    // "reactFile": null,
    // "logKRange": "",

    
    // This is actually calculated as a string, but I wanted to leave this here for documentation purposes.
    // "reaction": "",
  })


  useEffect(() => {
    const fetchSpeciesData = async (database) => {
      try {
        const response = await fetch(
          `https://js2test.ear180013.projects.jetstream-cloud.org/DB.php?query=Name-${database}`,
        );
        const data = await response.json();
        const allSpecies = Object.values(data).flat();
        setSpecies(allSpecies);
        setFilteredSpecies(allSpecies);
      } catch (error) {
        console.error('Error fetching species data:', error);
      }
    };
  }, [formState.slopFile])

  

  /**
   * Given the name and value of hte radio group picked, go ahead and reset any other dependent 
   * radio groups
   * 
   * @param {*} name 
   * @param {*} value 
   */
  const handleResetDependencies = (name, value) => {



  }
  /**
   * Handles changing the formState for inputs related to the form state
   * @param {*} e 
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target

    // Look for any potential dependencies that this state has (only if radio)
    const dependencies = resetMap[name]?.[value] || []

    const updatedFormState = {...formState}
    dependencies.forEach((dep) => {
      updatedFormState[dep] = -1; // Reset dependent states to their default value; this will even reset the current one
    });
    updatedFormState[name] = value // apply current change at the end
    setFormState(updatedFormState)
  }

  const onePhaseSelected = formState.solventPhase == 0
  const liqVapSatCurveSelected = formState.solventPhase == 1
  const tempDensitySelected = formState.independentStateVar == 0
  const tempPressureSelected = formState.independentStateVar == 1
  const tempSelected = formState.lipVapSatVar == 0
  const pressureSelected = formState.lipVapSatVar == 1
  const isochoricSelected = formState.tabulationChoricOption == 0
  const isothermalSelected = formState.tabulationChoricOption == 1 || formState.tabulationBaricOption == 1
  const isobaricSelected = formState.tabulationBaricOption == 0
  const univariantCurveYesSelected = formState.univariantCurveOption == 0
  const univariantCurveNoSelected = formState.univariantCurveOption == 1
  const calculateTSelected = formState.univariantCalcOption == 0
  const calculatePSelected = formState.univariantCalcOption == 1
  const uniformIncrementSelected = formState.tableIncrement == 0
  const unequalIncrementSelected = formState.tableIncrement == 1
  const reactionString = reactionInputs.join("\n")

  const radioGroups = [
    {
      label: "Specify solvent phase region",
      name: "solventPhase",
      display: true, // Radio group displays always.
      options: [
        {
          label: "One-Phase Region",
          value: 0,
        },
        {
          label: "Liquid Vapor Saturation Curve",
          value: 1,
        }
      ]
    },
    {
      label: "Specify independent State Variables",
      name: "independentStateVar",
      display: onePhaseSelected,
      options: [
        {
          label: "Temperature (degCel), density(H2O) (g/cc)",
          value: 0,
        },
        {
          label: "Temperature (degCel), pressure (bars)",
          value: 1, 
        }
      ]
    },
    {
      label: "Specify liquid-vapor saturation variables",
      // ATTENTION: On the front and backend it's registered as lipVapSatVar, "lip" instead of "liq"
      // It's annoying, but it doesn't affect functionality, just note it.
      name: "lipVapSatVar", 
      display: liqVapSatCurveSelected,
      options: [
        {
          label: "Temperature (degCel)",
          value: 0
        },
        {
          label: "Pressure (bars)",
          value: 1
        }
      ]
    },
    {
      label: "Specify tabulation option(Baric, Thermal)",
      name: "tabulationBaricOption",
      display: univariantCurveNoSelected,
      options: [
        {
          label: "Calculate ISOBARIC (P) tables",
          value: 0,
        },
        {
          label: "Calculate ISOTHERMAL (D) tables",
          value: 1,
        },
      ]
    },
    {
      label: "Specify tabulation option(Chronic, Thermal)",
      name: "tabulationChoricOption",
      display: tempDensitySelected,
      options: [
        {
          label: 'Calculate ISOCHORIC (T) tables',
          value: 0,
        },
        {
          label: 'Calculate ISOTHERMAL (D) tables',
          value: 1,
        }
      ]
    },
    {
      label: "Would you like to use the univariant curve option? (i.e., calculate T(logK,P) or P(logK,T)",
      name: "univariantCurveOption",
      display: tempPressureSelected,
      options: [
        {
          label: "Yes",
          value: 0
        },
        {
          label: "No",
          value: 1
        },
      ]
    },
    {
      label: "Specify univariant calculation option",
      name: "univariantCalcOption",
      display: univariantCurveYesSelected,
      options: [
        {
          label: "Calculate T (logK, isobars)",
          value: 0
        },
        {
          label: "Calculate P (logK, isotherms)",
          value: 1
        },
      ]
    },
    {
      label: "Specify table-increment option",
      name: "tableIncrement",
      display: isothermalSelected || isochoricSelected || isobaricSelected || tempSelected || pressureSelected,
      options: [
        {
          label: "Calculate tables having uniform increments",
          value: 0
        },
        {
          label: "Calculate tables having unequal increments",
          value: 1
        },
      ]
    },
    {
      label: "Specify reaction file",
      name: "reactionOption",
      display: true,
      options: [
        {
          label: "Use an existing reaction file",
          value: 0
        },
        {
          label: "Build a new reaction file",
          value: 1
        },
      ]
    },
    {
      label: "Specify option for x-y plot files",
      name: "kalFormatOption",
      display: true,
      options: [
        {
          label: "Do not generate plot files",
          value: 0
        },
        {
          label: "Generate plot files in generic format",
          value: 1
        },
      ]
    },
  ]

  /**
   * Define an array of your other inputs here. Your other inputs don't need to be reactive, so 
   * just make this simple. Just put the markup and display boolean.
   * 
   */
  const otherInputs = [
    // "Liquid Vapor inputs"
    {
      display: liqVapSatCurveSelected && pressureSelected && unequalIncrementSelected,
      content: (
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
          </div>)
    },
    {
      display: liqVapSatCurveSelected && pressureSelected && uniformIncrementSelected,
      content: (
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
      )
    },
    {
      display: liqVapSatCurveSelected && tempSelected && uniformIncrementSelected,
      content: (
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
      )
    },
    {
      display: liqVapSatCurveSelected && tempSelected && unequalIncrementSelected,
      content: (
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
      )
    },

    // "Temperature Density Inputs "
    {
      display: tempDensitySelected && isochoricSelected && uniformIncrementSelected,
      content: (
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
      )
    },
    {
      display: tempDensitySelected && isochoricSelected && unequalIncrementSelected,
      content: (
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
      )
    },
    {
      display: tempDensitySelected && isothermalSelected && uniformIncrementSelected,
      content: (
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
      )
    },
    {
      display: tempDensitySelected && isothermalSelected && unequalIncrementSelected,
      content: (
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
      )
    },

    // "Temperature Pressure Inputs"
    {
      display: tempPressureSelected && univariantCurveYesSelected && calculateTSelected,
      content: (
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
      )
    },
    {
      display: tempPressureSelected && univariantCurveYesSelected && calculatePSelected,
      content: (
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
      )
    },
    {
      display: tempPressureSelected && univariantCurveNoSelected && isobaricSelected && uniformIncrementSelected,
      content: (
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
      )
    },
    {
      display: tempPressureSelected && univariantCurveNoSelected && isobaricSelected && unequalIncrementSelected,
      content: (
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
      )
    },
    {
      display: tempPressureSelected && univariantCurveNoSelected && isothermalSelected && uniformIncrementSelected,
      content: (
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
      )
    },
    {
      display: tempPressureSelected && univariantCurveNoSelected && isothermalSelected && unequalIncrementSelected,
      content: (
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
      )
    },

    // Inputs for entering reactions in the app
    {
      display: formState.reactionOption == 0,
      content: (
        <FileInput label="Reaction File" name="reactFile" id="reactFile" accept=".dat" />
      )
    },
    {
      display: formState.reactionOption == 1, 
      content: (
        <div>
          <label>
            Insert reactions here, 1 species per line, empty line between
            reactions. Numbers are the stoichiometric coefficient of the
            species. Positive numbers are products and negative numbers are
            reactants, e.g. QUARTZ {'=>'} SiO2,aq:
            <br />
            <code>
              -1 QUARTZ
              <br />1 SiO2,aq
            </code>
          </label>
          {/* Render reaction inputs here with the autocomplete */}

          {/*  */}
          <button className="rvt-button rvt-button--secondary">
            Add new reaction
          </button>
          <input type="hidden" name="reaction" value={reactionString} />
        </div>
      )
    }
  ]



  return (

    <main id="main-content" className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm">
      <div className="rvt-layout__content">

        {/* Header with the ittle and citation card for using the software */}
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
                          className="rvt-color-crimson-700"
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

        
        <br />
        {/* Input form for the calculator */}
        <form method="post" encType="multipart/form-data">
        
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
              value={formState.slopFile}
              onChange={handleInputChange}
            >
              <option value="dpronsbl">supcrtbl.dat</option>
              <option value="dpronsbl_ree">supcrtbl_REE.dat</option>
            </select>
          </div>
          
          {/* Render the radio groups that we're allowed to show */}
          {
            radioGroups.filter(radioGroup => radioGroup.display).map((radioGroup, index) => (
              <RadioGroup 
                key={index}
                radioGroup={radioGroup}
                value={formState[radioGroup.name]} 
                onChange={handleInputChange}
                className="rvt-m-bottom-xs"
              />
            ))
          }

          {/* Conditionally render optional inputs below those radio options */}
          {
            otherInputs.filter(inputGroup => inputGroup.display).map((inputGroup) => (
              inputGroup.content
            ))
          }
          
          <button type="submit" className="rvt-button rvt-m-top-xs">
            Submit 
          </button>
        </form>
      </div>
    </main>
  )
}