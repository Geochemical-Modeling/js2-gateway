/**
 * File contains all the constants that are used in the Supcrtbl online
 * application.
 */

export const headerNameMap = {
  // Given a label for an input, we'll map it to the name of the input, which will be affected 
  // when the data is sent as form data.
  // NOTE: I don't think this covers all inputs.
  'Output File Name:': 'outputFile',
  'Database File:': 'slopFile',
  'Specify solvent phase region:': 'solventPhase', // included and values checked
  'Specify independent liq-vap saturation variable:': 'lipVapSatVar', // included and values checked
  'Specify independent State Variables:': 'independentStateVar', // included and verified
  'Specify tabulation option(Baric, Thermal):': 'tabulationBaricOption', // included and verified
  'Would you like to use the univariant curve option? (i.e., calculate T(logK,P) or P(logK,T):':
    'univariantCurveOption', // included and verified
  'Specify tabulation option(Chronic, Thermal):': 'tabulationChoricOption', // included and verified
  'Specify table-increment option:': 'tableIncrement', // included and verified
  'Specify univariant calculation option:': 'univariantCalcOption', // included and verified 
};

export const headerValueMap = {
  // Given the label for a radio option, we map that label to the value of the radio option when selected.
  'One-Phase Region': '0',
  'Liquid Vapor Saturation Curve': '1',
  'Temperature (degCel), density(H2O) (g/cc)': '0',
  'Temperature (degCel), pressure (bars)': '1',
  'Calculate ISOCHORIC (T) tables': '0',
  'Calculate ISOTHERMAL (D) tables': '1',
  Yes: '0',
  No: '1',
  'Calculate T (logK, isobars)': '0',
  'Calculate P (logK, isotherms)': '1',
  'Calculate ISOBARIC (P) tables': '0',
  'Temperature (degCel)': '0',
  'Pressure (bars)': '1',
  'Calculate tables having uniform increments': '0',
  'Calculate tables having unequal increments': '1',
};

export const resetMap = {
  // This object maps a given label for a radio option to the names of certain states
  // This is later used to make it so when we click a radio option, we reset related boolean staets.  
  'One-Phase Region': [
    'isLiquidVaporSaturationCurveSelected',

    // Clears independentStateVar radio group? Idk why 
    'isTemperatureDensitySelected',
    'isTemperaturePressureSelected',

    // clears lipVapSatVar radio group
    'isPressureSelected',
    'isTemperatureSelected',

    // clears tabulationChoricOption? why?
    'isCalculateIsochoricSelected',
    'isCalculateIsothermalSelected',

    // CLear tabulationBaric as well 
    'isCalculateIsoBaricSelected',

    // Clear the univariant curve option
    'isUnivariantCurveYesSelected',
    'isUnivariantCurveNoSelected',

    // Clear the univariant calculation options
    'isCalculateTSelected',
    'isCalculatePSelected',

    // Clear the table increments
    'isUniformIncrementSelected',
    'isUnequalIncrementSelected',
  ],
  'Liquid Vapor Saturation Curve': [
    'isOnePhaseRegionSelected',

    // Clear independentStateVar, as this relies on onePhase being selected!
    'isTemperatureDensitySelected',
    'isTemperaturePressureSelected',

    // resets lipVapSatVar
    'isPressureSelected',
    'isTemperatureSelected',

    // This can be viewed as resetting the choice  on tabulationChoricOption
    // or tabulationBaricOption. I guess reset both of them?
    'isCalculateIsochoricSelected',
    'isCalculateIsothermalSelected',
    'isCalculateIsoBaricSelected',

    // reset univariantCurveOption
    'isUnivariantCurveYesSelected',
    'isUnivariantCurveNoSelected',

    // Reset univariantCalcOption
    'isCalculateTSelected',
    'isCalculatePSelected',

    // Reset tableIncrement
    'isUniformIncrementSelected',
    'isUnequalIncrementSelected',
  ],

  // independentStateVars resetter
  'Temperature (degCel), density(H2O) (g/cc)': [
    // Reset, or I guess update independentStateVar; 
    'isTemperaturePressureSelected',

    // Reset lipVapSatVar
    'isPressureSelected',
    'isTemperatureSelected',

    // Reset tabulationChoricOption and tabulationBaricOption
    'isCalculateIsochoricSelected',
    'isCalculateIsothermalSelected',
    'isCalculateIsoBaricSelected',

    // Result univariantCurveOption
    'isUnivariantCurveYesSelected',
    'isUnivariantCurveNoSelected',

    // Reset univariantCalcOption
    'isCalculateTSelected',
    'isCalculatePSelected',

    // reset table increment
    'isUniformIncrementSelected',
    'isUnequalIncrementSelected',
  ],
  'Temperature (degCel), pressure (bars)': [
    // update independentStateVar
    'isTemperatureDensitySelected',

    // reset lipVapSatVar
    'isPressureSelected',
    'isTemperatureSelected',

    // reset tabulationChoricOption and tabulationBaricOptioin
    'isCalculateIsochoricSelected',
    'isCalculateIsothermalSelected',
    'isCalculateIsoBaricSelected',

    // reset univariantCurveOption
    'isUnivariantCurveYesSelected',
    'isUnivariantCurveNoSelected',

    // reset univariantCalcOption
    'isCalculateTSelected',
    'isCalculatePSelected',

    // reset tableIncrement
    'isUniformIncrementSelected',
    'isUnequalIncrementSelected',
  ],
  'Calculate ISOCHORIC (T) tables': [
    // Reset tabulationChoricOption and tabulationBaric Option
    'isCalculateIsothermalSelected',
    'isCalculateIsoBaricSelected',

    // Reset univariantCurveOption
    'isUnivariantCurveYesSelected',
    'isUnivariantCurveNoSelected',

    // Reset univariantCalcOption
    'isCalculateTSelected',
    'isCalculatePSelected',
  ],
  'Calculate ISOTHERMAL (D) tables': [
    // resets tabulationChoricOption
    'isCalculateIsochoricSelected',
    'isCalculateIsoBaricSelected',
    'isCalculateTSelected',
    'isCalculatePSelected',
  ],
  'Calculate ISOBARIC (P) tables': [
    'isCalculateIsothermalSelected',
    'isCalculateIsochoricSelected',
    'isCalculateTSelected',
    'isCalculatePSelected',
  ],
  Yes: [
    'isCalculateIsothermalSelected',
    'isCalculateIsoBaricSelected',
    'isCalculateIsochoricSelected',
    'isCalculateTSelected',
    'isCalculatePSelected',
    'isUnivariantCurveNoSelected',
    'isUniformIncrementSelected',
    'isUnequalIncrementSelected',
  ],
  No: [
    'isCalculateIsoBaricSelected',
    'isCalculateIsothermalSelected',
    'isUnivariantCurveYesSelected',
    'isCalculateTSelected',
    'isCalculatePSelected',
    'isUniformIncrementSelected',
    'isUnequalIncrementSelected',
  ],
  'Calculate T (logK, isobars)': [
    'isUniformIncrementSelected',
    'isUnequalIncrementSelected',
    'isCalculatePSelected',
  ],
  'Calculate P (logK, isotherms)': [
    'isUniformIncrementSelected',
    'isUnequalIncrementSelected',
    'isCalculateTSelected',
  ],
  'Calculate tables having uniform increments': ['isUnequalIncrementSelected'],
  'Calculate tables having unequal increments': ['isUniformIncrementSelected'],
  'Temperature (degCel)': ['isPressureSelected'],
  'Pressure (bars)': ['isTemperatureSelected'],
};
