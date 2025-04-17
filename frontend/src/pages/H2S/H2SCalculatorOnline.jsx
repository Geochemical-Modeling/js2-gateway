import React, { useState, useRef, useEffect } from "react";
import SelectInput, {DropDownOption} from "../../components/SelectInput";

import Chart from "chart.js/auto";

// Constants
const labels = ["P, bar", "xH2S+xCO2", "ρ, kg/m3", "λH2S"];
const systems = ["CO₂-H₂O-NaCl", "H₂S-H₂O-NaCl", "CO₂-H₂S-H₂O-NaCl"];
const colors = [
  "rgba(200, 0, 0, 1)",
  "rgba(0, 200, 0, 1)",
  "rgba(0, 0, 200, 1)",
  "rgba(150, 0, 0, 1)",
  "rgba(0, 150, 0, 1)",
  "rgba(0, 0, 150, 1)",
  "rgba(250, 0, 0, 1)",
  "rgba(0, 250, 0, 1)",
  "rgba(0, 0, 250, 1)",
];
const p = Array.from({ length: 61 }, (_, i) => i * 10);

const systemOptions: DropDownOption[] = [
  {
    label: "CO₂-H₂O-NaCl",
    value: "0",
  },
  {
    label:"H₂S-H₂O-NaCl",
    value: "1",
  },
  {
    label: "CO₂-H₂S-H₂O-NaCl",
    value: "2",
  }
]

const XCoordinateOptions: DropDownOption[] = [
  {
    label: "P, Bar",
    value: "0"
  },
  {
    label: "xH₂S + xCO₂",
    value: "1"
  },
  {
    label: "ρ, kg/m₃",
    value: "2"
  },
  {
    label: "λ, H₂S",
    value: "3"
  }
]

const YCoordinateOptions: DropDownOption[] = [
  {
    label: "P, Bar",
    value: "0",
  },
  {
    label: "xH₂S + xCO₂",
    value: "1"
  },
  {
    label: "ρ, kg/m₃",
    value: "2"
  },
  {
    label: "λ, H₂S",
    value: "3"
  }  
]


/**
 * ### H2SCalculatorOnline
 * This component provides a user interface for calculating H2S solubility in different systems.
 * It includes a form for input parameters, a chart for displaying results, and a history of previous calculations.
 *
 * ### Component Variables
 * - formData: Holds the form data inputted by the user.
 * - enableRun: Controls whether the run button is enabled. So when enableRun = false, that means the experiment is running, so we disable the run button.
 * - graphHistory: Stores the history of previous calculations, including the data points and parameters used.
 * - downloadData: Holds data to allow users to download the data as a csv file.
 * - canvasRef: References the canvas element used for rendering the chart.
 * - chartRef: References the Chart.js instance used to render the scatter plot.
 */
export default function H2SCalculatorOnline() {
  // State variables
  const [formData, setFormData] = useState({
    system: 0,
    temp: 298.15,
    mNaCl: 0.0,
    xcoord: 0,
    ycoord: 0,
  });
  const [enableRun, setEnableRun] = useState(true);
  const [graphHistory, setGraphHistory] = useState([]);
  const [downloadData, setDownloadData] = useState("");
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Initialize Chart on first render
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        chartRef.current = new Chart<"scatter">(ctx, {
          type: "scatter",
          data: {
            datasets: [],
          },
          options: {
            scales: {
              x: {
                type: "linear",
                beginAtZero: true,
                title: {
                  display: true,
                  text: "X Axis",
                },
              },
              y: {
                type: "linear",
                beginAtZero: true,
                title: {
                  display: true,
                  text: "Y Axis",
                },
              },
            },
            plugins: {
              title: {
                display: true,
                text: "",
              },
            },
            responsive: true,
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
      let x: number[] = [];
      let y: number[] = [];
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
          console.log("Error");
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
          console.log("Error");
      }

      const coords = x.map((val, index) => ({ x: val, y: y[index] }));

      myChart.data.datasets.push({
        label: `Temp: ${graphHistory[i].temp}, mNaCl: ${graphHistory[i].mNaCl}`,
        data: coords,
        showLine: true,
        fill: false,
        borderColor: colors[i % colors.length],
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

  /**
   * Run the experiment by sending a request to the server and updating the chart with the response data.
   */
  const runExperiment = async () => {
    setEnableRun(false);

    // Ensure bounds are checked before running
    const adjustedFormData = checkBounds(formData);
    setFormData(adjustedFormData);

    const { system, temp, mNaCl } = adjustedFormData;


    // const url = `https://js2test.ear180013.projects.jetstream-cloud.org/h2s/calculator/h2s_request.php?val=${String(
    //   Math.random()
    // )}&system=${system}&temp=${temp}&nacl=${mNaCl}`;

    try {
      // Though I don't know why you'd want caching when you're entering in the same parameters? Seems
      const url = `http://localhost:4000/h2s?val=${String(Math.random())}&system=${system}&temp=${temp}&nacl=${mNaCl}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          alert("404 Error");
        } else if (response.status === 500) {
          alert("500 Error");
        } else {
          throw new Error("Network response was not ok");
        }
        return;
      }
      
      // We should have parsed and gotten back a matrix of numbers, Store that 
      // matrix in newComputedData, but make sure we parse the strings inside the matrix
      // into floats. Though I think i have modified this so that 
      const JSON = await response.json();
      const data = JSON.data;
      const newComputedData: number[][] = data;

      // for (let i = 0; i < data.length; i++) {
      //   newComputedData.push(data[i].map((elem: string) => parseFloat(elem)));
      // }

      // Update graphHistory
      setGraphHistory((prevHistory) => [
        ...prevHistory,
        {
          data,
          // data: newComputedData,
          system,
          temp,
          mNaCl,
        },
      ]);

      // Prepare download data
      prepareDownloadData(system, temp, mNaCl, data);
      // prepareDownloadData(system, temp, mNaCl, newComputedData);

      setEnableRun(true);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error.message);
        alert("Error: " + error.message);
      }
      setEnableRun(true);
    }
  };

  /**
   * Prepare the data for download in CSV format.
   *
   * @param {number} system - The system type.
   * @param {number} temp - The temperature.
   * @param {number} mNaCl - The concentration of NaCl.
   * @param {number[][]} computedData - The computed data from the server.
   */
  const prepareDownloadData = (
    system: number,
    temp: number,
    mNaCl: number,
    computedData: number[][]
  ) => {
    const csvLabels = ["P, bar", "xH2S+xCO2", "ρ kg/m3", "λH2S"];
    const csvData: string[] = [];
    csvData.push(`Temperature,Pressure,NaCl,${csvLabels[1]}`);
    if (system < 2) {
      csvData[0] += `,${csvLabels[2]},${csvLabels[3]}`;
    }
    csvData[0] += "\n";

    for (let i = 0; i < computedData[0].length; i++) {
      let line = `${temp},${p[i]},${mNaCl},${computedData[0][i]}`;
      if (system < 2) {
        line += `,${computedData[1][i]},${computedData[2][i]}`;
      }
      csvData.push(line + "\n");
    }

    setDownloadData(csvData.join(""));
  };

  /**
   * Check and adjust the bounds of the input data.
   *
   * Currently it's just checking the temp and mNacl to make sure that
   * those values are in a proper range.
   *
   * @param {typeof formData} newFormData - The new form data.
   * @returns {typeof formData} - The adjusted form data.
   */
  const checkBounds = (newFormData: typeof formData) => {
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
      alert("Values adjusted to within acceptable bounds.");
    }

    return { ...newFormData, temp, mNaCl };
  };

  // Input Change Handlers
  const onChangeNumber = (
    event,
    inputLabel: "temp" | "mNaCl"
  ) => {
    let eventInput = parseFloat(event.target.value);
    if (!isNaN(eventInput)) {
      let newFormData = { ...formData, [inputLabel]: eventInput };
      setFormData(newFormData);
    }
  };

  /**
   * Handle changes in select inputs.
   *
   * @param {ChangeEvent<HTMLSelectElement>} event - The change event.
   * @param {string} inputLabel - The label of the input being changed.
   */
  const onChangeSelect = (
    event,
    inputLabel: "system" | "xcoord" | "ycoord"
  ) => {
    let newFormData = {
      ...formData,
      [inputLabel]: parseInt(event.target.value),
    };
    setFormData(newFormData);
  };

  /**
   * Manually check and adjust hte bounds for the input datat.
   */
  const handleCheckBounds = (e) => {
    e.preventDefault();
    const adjustedFormData = checkBounds(formData);
    setFormData(adjustedFormData);
  };

  /**
   * Render the history of previous calculations.
   *
   * @returns {JSX.Element | null} - The history elements or null if no history.
   */
  const renderHistory = () => {
    if (!graphHistory.length) return null;

    return (
      <div id="history">
        {graphHistory.map((item, idx) => {
          const date = new Date();
          const dateStr = `${
            date.getMonth() + 1
          }-${date.getDate()}-${date.getFullYear()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
          const fileName = `h2sOutput-${dateStr}.csv`;

          const blob = new Blob([downloadData], { type: "text/csv" });
          const url = URL.createObjectURL(blob);

          return (
            <div key={`history-${idx}`}>
              <a href={url} download={fileName}>
                {systems[item.system]} Temp: {item.temp} K, mNaCl: {item.mNaCl}
              </a>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    
    <main id="main-content" className="rvt-layout__wrapper rvt-layout__wrapper--single rvt-container-sm">
      <div className="rvt-layout__content">
        
        <header>
          <h2 className="rvt-ts-md">
            H<sub>2</sub>S SOLUBILITY CALCULATOR
          </h2>
        </header>
        
        <hr />

        {/* Form input section for the calculator */}
        <form className="col-3">
          <div>
            <label className="rvt-label [ rvt-m-top-md ]">Select a system</label>
            <SelectInput listOptions={systemOptions} onChange={(e) => onChangeSelect(e, "system")} value={formData.system}/>
          </div>
          <div>
            <label className="rvt-label [ rvt-m-top-md ]">Temperature, K:</label>
            <input type="number" id="text-input-default" class="rvt-text-input" 
              onKeyDown={(evt) =>
                ["e", "E", "+", "-", "ArrowUp", "ArrowDown"].includes(
                  evt.key
                ) && evt.preventDefault()
              }
              onChange={(e) =>
                onChangeNumber(e, "temp")
              }
              value={formData.temp}/>
          </div>
          <div>
            <label className="rvt-label [ rvt-m-top-md ]">mNaCl (mol/kgH&#8322;O):</label>
            <input type="number" id="text-input-default" class="rvt-text-input" 
              onKeyDown={(evt) =>
                ["e", "E", "+", "-", "ArrowUp", "ArrowDown"].includes(
                  evt.key
                ) && evt.preventDefault()
              }
              onChange={(e) =>
                onChangeNumber(e, "mNaCl")
              }
              value={formData.mNaCl}/>
          </div>
          <div>
            <label className="rvt-label [ rvt-m-top-md ]">X Coordinate:</label>
            <SelectInput listOptions={XCoordinateOptions} value={formData.xcoord} onChange={(e) => onChangeSelect(e, "xcoord")}/>
          </div>
          <div>
            <label className="rvt-label [ rvt-m-top-md ]">Y Coordinate:</label>
            <SelectInput listOptions={YCoordinateOptions} value={formData.ycoord} onChange={(e) => onChangeSelect(e, "ycoord")}/>
          </div>


          <div className="rvt-m-top-sm">
            <button className="rvt-button rvt-button--plain rvt-m-right-sm" onClick={handleCheckBounds}>
              Check boundaries
            </button>
            <button className="rvt-button" disabled={!enableRun} onClick={runExperiment}>
              Run
            </button>
          </div>          
        </form>

        {/* Rendering chart and history */}
        <div className="w-100 height-500 mt-5">
          <canvas ref={canvasRef} id="chart"></canvas>
        </div>
        <div className="mt-5">{renderHistory()}</div>
          
      </div>
    </main>
    
  );
}
