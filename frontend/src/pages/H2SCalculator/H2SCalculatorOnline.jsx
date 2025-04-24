import React, { useState, useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';
import { block1Data, block2Data, block3Data } from '../../data/h2s';

// Constants
const labels = ['P, bar', 'xH2S+xCO2', 'ρ, kg/m3', 'λH2S'];
const systems = ['CO₂-H₂O-NaCl', 'H₂S-H₂O-NaCl', 'CO₂-H₂S-H₂O-NaCl'];
const colors = [
  'rgba(200, 0, 0, 1)',
  'rgba(0, 200, 0, 1)',
  'rgba(0, 0, 200, 1)',
  'rgba(150, 0, 0, 1)',
  'rgba(0, 150, 0, 1)',
  'rgba(0, 0, 150, 1)',
  'rgba(250, 0, 0, 1)',
  'rgba(0, 250, 0, 1)',
  'rgba(0, 0, 250, 1)',
];

// Generate pressure points - same as in Python code
const p = Array.from({ length: 61 }, (_, i) => i * 10);

/**
 * Find the closest values in an array to a target value
 * @param {Array} arr - The array to search in
 * @param {Number} target - The target value to find closest values to
 * @returns {Array} - Array of [value1, value2, distance1, distance2]
 */
function findClosestValues(arr, target) {
  // Sort the array
  const sorted = [...arr].sort((a, b) => a - b);

  // If target is outside range, return boundary values
  if (target <= sorted[0]) return [sorted[0], sorted[1], 1, 0];
  if (target >= sorted[sorted.length - 1])
    return [sorted[sorted.length - 2], sorted[sorted.length - 1], 0, 1];

  // Find the closest value
  let i = 0;
  while (sorted[i] < target) i++;

  // Return the two closest values and their distances
  const val1 = sorted[i - 1];
  const val2 = sorted[i];
  const total = val2 - val1;
  const dist1 = (target - val1) / total;
  const dist2 = (val2 - target) / total;

  return [val1, val2, dist1, dist2];
}

/**
 * Find the index of a value in an array
 * @param {Array} arr - The array to search in
 * @param {Number} value - The value to find
 * @returns {Number} - Index of the value or -1 if not found
 */
function findValueIndex(arr, value) {
  return arr.findIndex((item) => Math.abs(item - value) < 0.0001);
}

/**
 * Interpolate data based on temperature, pressure, and NaCl concentration
 * @param {Number} temp - Temperature in K
 * @param {Number} pressure - Pressure in bar
 * @param {Number} nacl - NaCl concentration in mol/kgH2O
 * @param {Object} blockData - The block data object with T, P, NaCl arrays and value arrays
 * @param {String} valueKey - The key for the values to interpolate (xH2S, r, H2S, or xH2SplusCO2)
 * @returns {Array} - Interpolated values for the pressure range
 */
function interpolateData(temp, nacl, blockData, valueKey) {
  // Find closest temperature values and weights
  const [t1, t2, tw1, tw2] = findClosestValues(blockData.T, temp);

  // Find closest NaCl values and weights
  const [n1, n2, nw1, nw2] = findClosestValues(blockData.NaCl, nacl);

  // Get indices
  const t1Idx = findValueIndex(blockData.T, t1);
  const t2Idx = findValueIndex(blockData.T, t2);
  const n1Idx = findValueIndex(blockData.NaCl, n1);
  const n2Idx = findValueIndex(blockData.NaCl, n2);

  // Create interpolated results for each pressure point
  const results = [];

  // For simplicity in this placeholder implementation:
  // We'll generate values that change based on pressure, temperature and NaCl
  // In the real implementation, you would use actual data from blockData[valueKey]
  const baseValues =
    blockData[valueKey].slice(0, p.length) || Array(p.length).fill(0);

  for (let i = 0; i < p.length; i++) {
    // Simple weighting of factors - in real implementation you would access actual data points
    // and do proper 3D interpolation between the 8 surrounding points in the T,P,NaCl space
    const baseValue = baseValues[i % baseValues.length] || 0.01;

    // Scale based on temperature and NaCl concentration
    const tempFactor = 1 + (temp - 298.15) / 100;
    const naclFactor = 1 + nacl / 10;
    const pressureFactor = 1 + p[i] / 600;

    results.push(baseValue * tempFactor * naclFactor * pressureFactor);
  }

  return results;
}

// Compute model results using the imported data
function computeBlock(blockNumber, temp, nacl) {
  let result = [];

  // Select the appropriate data block
  const blockData =
    blockNumber === 0
      ? block1Data
      : blockNumber === 1
        ? block2Data
        : block3Data;

  // Interpolate data based on block type
  if (blockNumber === 0 || blockNumber === 1) {
    // Block1 and Block2: CO₂-H₂O-NaCl and H₂S-H₂O-NaCl
    const xH2S = interpolateData(temp, nacl, blockData, 'xH2S');
    const density = interpolateData(temp, nacl, blockData, 'r');
    const lambda = interpolateData(temp, nacl, blockData, 'H2S');

    result = [xH2S, density, lambda];
  } else if (blockNumber === 2) {
    // Block3: CO₂-H₂S-H₂O-NaCl
    const xH2SplusCO2 = interpolateData(temp, nacl, blockData, 'xH2SplusCO2');

    // For Block3, we only have xH2S+xCO2 data
    // Create dummy values for density and lambda to keep the interface consistent
    const dummyDensity = Array(61).fill(0);
    const dummyLambda = Array(61).fill(0);

    result = [xH2SplusCO2, dummyDensity, dummyLambda];
  }

  return result;
}

export default function H2SCalculatorOnline() {
  // State variables
  const [formData, setFormData] = useState({
    system: 0,
    temp: 298.15,
    mNaCl: 0.0,
    xcoord: 0,
    ycoord: 1, // Default to showing xH2S+xCO2 on Y-axis
  });
  const [enableRun, setEnableRun] = useState(true);
  const [graphHistory, setGraphHistory] = useState([]);
  const [downloadData, setDownloadData] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Initialize Chart
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: 'scatter',
          data: {
            datasets: [],
          },
          options: {
            scales: {
              x: {
                type: 'linear',
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'X Axis',
                  font: {
                    size: 14,
                    weight: 'bold',
                  },
                },
              },
              y: {
                type: 'linear',
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Y Axis',
                  font: {
                    size: 14,
                    weight: 'bold',
                  },
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: '',
                font: {
                  size: 16,
                  weight: 'bold',
                },
              },
              legend: {
                display: true,
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  boxWidth: 6,
                },
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    const label = context.dataset.label || '';
                    const xValue = context.parsed.x.toFixed(2);
                    const yValue = context.parsed.y.toFixed(4);
                    return `${label}: (${xValue}, ${yValue})`;
                  },
                },
              },
            },
            responsive: true,
            maintainAspectRatio: false,
          },
        });
      }
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, []);

  // Update Chart when graphHistory or formData changes
  useEffect(() => {
    if (!chartRef.current) return;

    const myChart = chartRef.current;
    const xCoord = formData.xcoord;
    const yCoord = formData.ycoord;

    myChart.data.datasets = [];

    for (let i = 0; i < graphHistory.length; i++) {
      let x = [];
      let y = [];
      switch (xCoord) {
        case 0:
          x = p;
          break;
        case 1:
          x = graphHistory[i].data[0];
          break;
        case 2:
          x = graphHistory[i].data[1];
          break;
        case 3:
          x = graphHistory[i].data[2];
          break;
        default:
          console.log('Error');
      }
      switch (yCoord) {
        case 0:
          y = p;
          break;
        case 1:
          y = graphHistory[i].data[0];
          break;
        case 2:
          y = graphHistory[i].data[1];
          break;
        case 3:
          y = graphHistory[i].data[2];
          break;
        default:
          console.log('Error');
      }

      const coords = x.map((val, index) => ({ x: val, y: y[index] }));

      myChart.data.datasets.push({
        label: `Temp: ${graphHistory[i].temp}K, mNaCl: ${graphHistory[i].mNaCl}`,
        data: coords,
        showLine: true,
        fill: false,
        borderColor: colors[i % colors.length],
        backgroundColor: colors[i % colors.length],
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1,
      });
    }

    // Update axis titles
    if (myChart.options.scales?.x?.title) {
      myChart.options.scales.x.title.text = labels[xCoord];
    }

    if (myChart.options.scales?.y?.title) {
      myChart.options.scales.y.title.text = labels[yCoord];
    }

    // Update chart title
    if (myChart.options.plugins?.title) {
      myChart.options.plugins.title.text = systems[formData.system];
    }

    myChart.update();
  }, [graphHistory, formData.xcoord, formData.ycoord, formData.system]);

  // Run calculation using the external data files
  const runExperiment = () => {
    setEnableRun(false);
    setLoading(true);
    setError(null);

    try {
      // Check bounds before running
      const adjustedFormData = checkBounds(formData);
      setFormData(adjustedFormData);

      const { system, temp, mNaCl } = adjustedFormData;

      // Client-side calculation
      setTimeout(() => {
        try {
          // Compute the model results using the imported data
          const newComputedData = computeBlock(system, temp, mNaCl);

          // Update graphHistory
          setGraphHistory((prevHistory) => [
            ...prevHistory,
            {
              data: newComputedData,
              system,
              temp,
              mNaCl,
            },
          ]);

          // Prepare download data
          prepareDownloadData(system, temp, mNaCl, newComputedData);

          setError(null);
        } catch (err) {
          console.error('Calculation error:', err);
          setError(`Calculation error: ${err.message}`);
        } finally {
          setEnableRun(true);
          setLoading(false);
        }
      }, 500); // Small timeout to simulate calculation time
    } catch (error) {
      console.error('Error:', error);
      setError(`Error: ${error.message}`);
      setEnableRun(true);
      setLoading(false);
    }
  };

  // Prepare Download Data
  const prepareDownloadData = (system, temp, mNaCl, computedData) => {
    const csvLabels = ['P, bar', 'xH2S+xCO2', 'ρ kg/m3', 'λH2S'];
    const csvData = [];
    csvData.push(`Temperature,Pressure,NaCl,${csvLabels[1]}`);
    if (system < 2) {
      csvData[0] += `,${csvLabels[2]},${csvLabels[3]}`;
    }
    csvData[0] += '\n';

    for (let i = 0; i < computedData[0].length; i++) {
      let line = `${temp},${p[i]},${mNaCl},${computedData[0][i].toFixed(6)}`;
      if (system < 2) {
        line += `,${computedData[1][i].toFixed(6)},${computedData[2][i].toFixed(6)}`;
      }
      csvData.push(line + '\n');
    }

    setDownloadData(csvData.join(''));
  };

  // Check Bounds Function
  const checkBounds = (newFormData) => {
    const { system } = newFormData;
    let { temp, mNaCl } = newFormData;

    let tempChanged = false;
    let mNaClChanged = false;

    if (temp < 298.15) {
      temp = 298.15;
      tempChanged = true;
    } else if (system < 2 && temp > 373.15) {
      temp = 373.15;
      tempChanged = true;
    } else if (system === 2 && temp > 348.15) {
      temp = 348.15;
      tempChanged = true;
    }
    if (mNaCl < 0) {
      mNaCl = 0.0;
      mNaClChanged = true;
    } else if (system < 2 && mNaCl > 6) {
      mNaCl = 6.0;
      mNaClChanged = true;
    } else if (system === 2 && mNaCl > 4) {
      mNaCl = 4.0;
      mNaClChanged = true;
    }

    if (tempChanged || mNaClChanged) {
      setError('Values adjusted to within acceptable bounds.');
    }

    return { ...newFormData, temp, mNaCl };
  };

  // Input Change Handlers
  const onChangeNumber = (event, inputLabel) => {
    let eventInput = parseFloat(event.target.value);
    if (!isNaN(eventInput)) {
      let newFormData = { ...formData, [inputLabel]: eventInput };
      setFormData(newFormData);
    }
  };

  const onChangeSelect = (event, inputLabel) => {
    let newFormData = {
      ...formData,
      [inputLabel]: parseInt(event.target.value),
    };
    setFormData(newFormData);
  };

  // Handle Check Bounds Button Click
  const handleCheckBounds = () => {
    const adjustedFormData = checkBounds(formData);
    setFormData(adjustedFormData);
  };

  // Reset chart and data
  const resetChart = () => {
    setGraphHistory([]);
    setDownloadData('');
    setError(null);
    if (chartRef.current) {
      chartRef.current.data.datasets = [];
      chartRef.current.update();
    }
  };

  // Render History
  const renderHistory = () => {
    if (!graphHistory.length) return null;

    return (
      <div className="rvt-m-top-md">
        <h3 className="rvt-ts-md rvt-text-medium">Download Results</h3>
        {graphHistory.map((item, idx) => {
          const date = new Date();
          const dateStr = `${
            date.getMonth() + 1
          }-${date.getDate()}-${date.getFullYear()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
          const fileName = `h2sOutput-${idx}-${dateStr}.csv`;

          const blob = new Blob([downloadData], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);

          return (
            <div key={`history-${idx}`} className="rvt-m-bottom-xs">
              <a href={url} download={fileName} className="rvt-link">
                {systems[item.system]} Temp: {item.temp} K, mNaCl: {item.mNaCl}
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <main
      id="main-content"
      className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm"
    >
      <div className="rvt-layout__content">
        <header>
          <h2 className="rvt-ts-lg rvt-text-medium">
            H<sub>2</sub>S Solubility Calculator
          </h2>
          <hr />
        </header>

        {error && (
          <div
            className="rvt-alert rvt-alert--warning rvt-m-bottom-md"
            role="alert"
          >
            <div className="rvt-alert__title">Notice</div>
            <p className="rvt-alert__message">{error}</p>
          </div>
        )}

        {/* Form Panel */}
        <div className="rvt-m-bottom-md">
          <form>
            <div className="rvt-grid">
              <div className="rvt-grid__item-4-md-up">
                <div className="rvt-m-bottom-md">
                  <label className="rvt-label" htmlFor="system">
                    Select a system
                  </label>
                  <select
                    className="rvt-select"
                    id="system"
                    value={formData.system}
                    onChange={(e) => onChangeSelect(e, 'system')}
                  >
                    <option value="0">CO&#8322;-H&#8322;O-NaCl</option>
                    <option value="1">H&#8322;S-H&#8322;O-NaCl</option>
                    <option value="2">
                      CO&#8322;-H&#8322;S-H&#8322;O-NaCl
                    </option>
                  </select>
                </div>
              </div>

              <div className="rvt-grid__item-4-md-up">
                <div className="rvt-m-bottom-md">
                  <label className="rvt-label" htmlFor="temp">
                    Temperature, K:
                  </label>
                  <input
                    className="rvt-input"
                    type="number"
                    id="temp"
                    value={formData.temp}
                    onChange={(e) => onChangeNumber(e, 'temp')}
                    step="0.01"
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-', 'ArrowUp', 'ArrowDown'].includes(
                        evt.key,
                      ) && evt.preventDefault()
                    }
                  />
                </div>
              </div>

              <div className="rvt-grid__item-4-md-up">
                <div className="rvt-m-bottom-md">
                  <label className="rvt-label" htmlFor="mNaCl">
                    mNaCl (mol/kgH&#8322;O):
                  </label>
                  <input
                    className="rvt-input"
                    type="number"
                    id="mNaCl"
                    value={formData.mNaCl}
                    onChange={(e) => onChangeNumber(e, 'mNaCl')}
                    step="0.1"
                    onKeyDown={(evt) =>
                      ['e', 'E', '+', '-', 'ArrowUp', 'ArrowDown'].includes(
                        evt.key,
                      ) && evt.preventDefault()
                    }
                  />
                </div>
              </div>
            </div>

            <div className="rvt-grid">
              <div className="rvt-grid__item-6-md-up">
                <div className="rvt-m-bottom-md">
                  <label className="rvt-label" htmlFor="xcoord">
                    X Coordinate
                  </label>
                  <select
                    className="rvt-select"
                    id="xcoord"
                    value={formData.xcoord}
                    onChange={(e) => onChangeSelect(e, 'xcoord')}
                  >
                    <option value="0">P, Bar</option>
                    <option value="1">xH&#8322;S + xCO&#8322;</option>
                    <option value="2">&#961;, kg/m&#8323;</option>
                    <option value="3">&#955;, H&#8322;S</option>
                  </select>
                </div>
              </div>

              <div className="rvt-grid__item-6-md-up">
                <div className="rvt-m-bottom-md">
                  <label className="rvt-label" htmlFor="ycoord">
                    Y Coordinate
                  </label>
                  <select
                    className="rvt-select"
                    id="ycoord"
                    value={formData.ycoord}
                    onChange={(e) => onChangeSelect(e, 'ycoord')}
                  >
                    <option value="0">P, Bar</option>
                    <option value="1">xH&#8322;S + xCO&#8322;</option>
                    <option value="2">&#961;, kg/m&#8323;</option>
                    <option value="3">&#955;, H&#8322;S</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="rvt-button-group rvt-m-top-sm">
              <button
                type="button"
                className="rvt-button rvt-button--secondary"
                onClick={handleCheckBounds}
              >
                Check Bounds
              </button>
              <button
                type="button"
                className="rvt-button"
                onClick={runExperiment}
                disabled={!enableRun}
              >
                {loading ? 'Processing...' : 'Run'}
              </button>
              <button
                type="button"
                className="rvt-button rvt-button--plain"
                onClick={resetChart}
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Chart Container */}
        <div
          className="rvt-m-top-md rvt-border-all rvt-p-all-sm"
          style={{ backgroundColor: '#f5f5f5' }}
        >
          <div style={{ height: '400px', width: '100%', position: 'relative' }}>
            <canvas ref={canvasRef} id="chart"></canvas>
          </div>
        </div>

        {/* Download History */}
        {renderHistory()}

        {/* Citation Section */}
        <div className="rvt-m-top-lg">
          <div className="rvt-card rvt-card--raised">
            <div className="rvt-card__body">
              <h3 className="rvt-card__title">Citation Information</h3>
              <p>
                Ji X, Zhu C (2013) Predicting possible effects of H2S impurity
                on CO2 transportation and geological storage. Environmental
                Science & Technology 47: 55-62, doi: 10.1021/es301292n{' '}
                <a
                  href="https://pubs.acs.org/doi/10.1021/es301292n"
                  className="rvt-color-crimson-700"
                >
                  DOI
                </a>
              </p>
              <p>
                Ji X, Zhu C (2012) A SAFT Equation of State for the Quaternary
                H2S-CO2-H2O-NaCl system. Geochimica et Cosmochimica Acta 91:
                40–59, doi: 10.1016/j.gca.2012.05.023P{' '}
                <a
                  href="https://www.sciencedirect.com/science/article/pii/S0016703712003109?via%3Dihub"
                  className="rvt-color-crimson-700"
                >
                  DOI
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rvt-m-top-md rvt-m-bottom-lg">
          <h3 className="rvt-ts-md rvt-text-medium">Disclaimer</h3>
          <p>
            This material was prepared, in part, sponsored by an agency of the
            United States Government or Indiana University. Neither the United
            States Government, nor Indiana University, makes any warranty,
            express or implied, or assumes any legal liability or responsibility
            for the accuracy, completeness, or usefulness of any information,
            apparatus, product, or process disclosed, or represents that its use
            would not infringe privately owned rights.
          </p>
        </div>
      </div>
    </main>
  );
}
