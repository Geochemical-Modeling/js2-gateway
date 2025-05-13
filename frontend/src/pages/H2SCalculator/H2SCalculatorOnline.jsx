import React, { useState, useRef, useEffect } from 'react';
import Chart from 'chart.js/auto';

// Constants; labels for chart axes, names for the different systems they can choose and a bunch of rgb values for the graph to use
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

/**
 * An array representing the pressure points/values. So we'll create an array with indices from 0 to 60, with each value
 * containing i*10 value. So it's an array p = [0, 10, 20, ..., 600] representing the various pressure values, and this will be
 * used when the user wants to select "P bar" for the x and y axes.
 */
const p = Array.from({ length: 61 }, (_, i) => i * 10);

export default function H2SCalculatorOnline() {
  // State variables
  const [formData, setFormData] = useState({
    system: 0,
    temp: 298.15,
    mNaCl: 0.0,
    xcoord: 0,
    ycoord: 1, // Default to showing xH2S+xCO2 on Y-axis
  });

  const [graphHistory, setGraphHistory] = useState([]);
  const [downloadData, setDownloadData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  /**
   * This effect will initialize and create the chart if it doesn't already exist. This will just create the
   * chart on the first render which is good.
   */
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
    myChart.data.datasets = []; // Reset the data contained inside the chart, which is the idea of clearing the chart.

    // Iterate through graphHistory and re-render data based on xCoord and yCoord.
    // Ensure x and y arrays are valid and skip experiments with missing or invalid data.
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

          // NOTE: This probably isn't the best way to do this because the results would be misleading.
          // Personally I would just skip over it and inidcate that the data is not available in this format?
          // x = graphHistory[i].data[0] ? graphHistory[i].data[0] : p;
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

      if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length) {
        console.warn(`Skipping invalid data for experiment ${i}`, { x, y });
        continue;
      }

      // Create an array of objects with x and y properties, an object representing a poin on the graph.
      // So we just take the value from the x array and then take the corresponding value from the y array.
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

    // These conditionals just update the labels for the x and y axes based on the xCoord and yCoord
    // values that they pick. So if they pick 0, they should be seeing "P, bar" on the x-axis, and so on.
    // We'll also update the title of the chart to be the system that they selected.
    if (myChart.options.scales?.x?.title) {
      myChart.options.scales.x.title.text = labels[xCoord];
    }
    if (myChart.options.scales?.y?.title) {
      myChart.options.scales.y.title.text = labels[yCoord];
    }
    if (myChart.options.plugins?.title) {
      myChart.options.plugins.title.text = systems[formData.system];
    }

    myChart.update();
  }, [graphHistory, formData.xcoord, formData.ycoord, formData.system]);

  // Run calculation using the external data files
  const runExperiment = async () => {
    setLoading(true);
    setError(null);

    const adjustedFormData = checkBounds(formData);
    setFormData(adjustedFormData);
    const { system, temp, mNaCl } = adjustedFormData;

    try {
      const response = await fetch(
        `/api/h2s?system=${system}&temp=${temp}&mNaCl=${mNaCl}`,
      );
      if (!response.ok) {
        throw new Error('Bad response from the server!');
      }
      const data = await response.json();

      const newComputedData = [];
      for (let i = 0; i < data.length; i++) {
        newComputedData.push(data[i].map((elem) => parseFloat(elem)));
      }

      setGraphHistory((prevHistory) => [
        ...prevHistory,
        {
          data: newComputedData,
          system,
          temp,
          mNaCl,
        },
      ]);
      prepareDownloadData(system, temp, mNaCl, newComputedData);
      setError(null);
    } catch (error) {
      setError(
        `runExperiment Error: ${error.message || 'Network error. Something went wrong, please try again later!'}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Prepare Download Data
  const prepareDownloadData = (system, temp, mNaCl, computedData) => {
    const csvData = [];
    csvData.push(`Temperature,Pressure,mNaCl,${labels[1]}`); // header of the csv file

    /**
     * For system 0 or 1, include all labels in the header since all 3 data rows exist.
     * Otherwise, only include the first row's labels.
     */ 
    if (system < 2) {
      csvData[0] += `,${labels[2]},${labels[3]}`;
    }
    csvData[0] += '\n';

    for (let i = 0; i < computedData[0].length; i++) {
      let line = `${temp},${p[i]},${mNaCl},${computedData[0][i].toFixed(6)}`;
      if (system < 2) {
        line += `,${computedData[1][i].toFixed(6)},${computedData[2][i].toFixed(6)}`;
      }
      csvData.push(line + '\n');
    }

    // Add the new CSV data to the downloadData list.
    setDownloadData((prevData) => [...prevData, csvData.join('')]);
  };

  /**
   * Adjusts the values for the formData to be alid. Don't update the state, but just return an object containing the updated form data.
   */
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

  // Handles how the select drop downs change input
  const onChangeSelect = (event, inputLabel) => {
    let newFormData = {
      ...formData,
      [inputLabel]: parseInt(event.target.value),
    };
    setFormData(newFormData);
  };

  /**
   * Handles adjusting the form data and then updating the form data state. The user can either manually check bounds, which is
   * what happened when they call this function. Or the user can run the experiment, and so we'll handle adjusting the values automatically. In the latter case only checkBounds is called
   * rather than handleCheckBounds.
   */
  const handleCheckBounds = () => {
    const adjustedFormData = checkBounds(formData);
    setFormData(adjustedFormData);
  };

  /**
   * Reset chart and data.
   *
   * 1. In this case, reset all entries in the graph history, so removing the graph associated with each experiment that the user ran.
   * 2. Delete the downloadable data for the most recent experiment.
   * 3. Reset the error message.
   * 4. If the chart reference exists (which it should), remove all experiemnt data it has and update the chart.
   *  This will clear the chart and remove all the data points from it.
   */
  const resetChart = () => {
    setGraphHistory([]);
    setDownloadData([]);
    setError(null);
    if (chartRef.current) {
      chartRef.current.data.datasets = [];
      chartRef.current.update();
    }
  };

  /**
   * Render the links to download the data for each experiment
   */
  const renderHistory = () => {
    if (!graphHistory.length) return null;
    const date = new Date();
    const dateStr = `${
      date.getMonth() + 1
    }-${date.getDate()}-${date.getFullYear()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;

    return (
      <div className="rvt-m-top-md">
        <h3 className="rvt-ts-md rvt-text-medium">Download Results</h3>
        {graphHistory.map((item, idx) => {
          /**
           * 1. Create the filename for the ith experiment's csv file.
           * 2. Create the blob object containing the data for the CSV file and an object URL allowing the user can download the CSV.
           * 3. Create a link for the user to download the CSV file. The link will so the specific system, temperature and mNaCl value for that given experiment.
           */
          const fileName = `h2sOutput-${idx}-${dateStr}.csv`;
          const blob = new Blob([downloadData[idx]], { type: 'text/csv' });
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
                disabled={loading}
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

        <div className="rvt-m-top-lg">
          <div className="rvt-alert rvt-alert--info" role="alert">
            <div className="rvt-alert__title">Note</div>
            <p className="rvt-alert__message">
              If you run a simulation with the system set to "CO₂-H₂S-H₂O-NaCl"
              and select "ρ, kg/m3" or "λH2S" for either the x or y axes, the
              data won't be graphed because the backend application does not
              provide the necessary data for those configurations. Of course, to
              see the data, you can just select "xH2S+xCO2" or "P, bar" for the
              x or y axes so nothing is lost.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
