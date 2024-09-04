import React, { useState } from "react";

import Timeline from "./Timeline";

import { downloadJson } from "./utils";

// const Timeline = loadable(() => import("./Timeline"));

function loopPattern(pattern, maxTime = 60) {
  let result = [];
  let currentTime = 0;
  let loopDuration = pattern[pattern.length - 1][0];

  while (currentTime < maxTime) {
    for (let i = 0; i < pattern.length; i++) {
      let [timestamp, value] = pattern[i];
      let newTimestamp = currentTime + timestamp;

      if (newTimestamp < maxTime) {
        result.push([newTimestamp, value]);
      } else {
        break;
      }
    }
    currentTime += loopDuration;
  }

  return result;
}

function convertToDownloadUrl(url) {
  const parsedUrl = new URL(url);
  parsedUrl.pathname = `/dl${parsedUrl.pathname}`;
  return parsedUrl.toString();
}

function getChartData(pattern) {
  let data;
  if (!pattern) {
    data = [];
  } else {
    data = pattern.map((i) => ({ x: i[0], y: i[1] }));
  }

  const datasets = [
    {
      borderWidth: 3,
      borderColor: "rgb(75, 192, 192)",
      data: data,
    },
  ];

  return {
    datasets,
  };
}

const initialChartOptions = {
  plugins: {
    zoom: {
      pan: {
        enabled: true,
        mode: "x",
      },
      zoom: {
        wheel: {
          enabled: true,
        },
        mode: "x",
      },
    },
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      type: "linear",
      min: 0,
      max: 2,
    },
    y: {
      min: 0,
      max: 100,
    },
  },
  maintainAspectRatio: true,
  animation: {
    duration: 0,
  },
};

function isValidPattern(pattern) {
  if (!pattern) {
    return true;
  }
  return pattern.length >= 2;
}
const Pattern = ({ patterns, setPatterns, patternKey, setPatternKey }) => {
  const [apiKey, setApiKey] = useState("API Key");
  const [chartOptions, setChartOptions] = useState(initialChartOptions);
  const [inProgress, setInProgress] = useState(false);

  const chartRef = React.useRef();

  function getChartOptions(newXmin, newXmax) {
    const { current: chart } = chartRef;
    let chartXmin = 0;
    let chartXmax = 2;

    if (chart) {
      chartXmin = chart.scales.x.min;
      chartXmax = chart.scales.x.max;
    }

    if (newXmin !== undefined) {
      chartXmin = newXmin;
    }
    if (newXmax !== undefined) {
      chartXmax = newXmax;
    }

    const chartOptions = structuredClone(initialChartOptions);

    chartOptions.onClick = function (event, elementsAtEvent) {
      console.log(event);

      const { current: chart } = chartRef;
      if (!chart) return;

      let x = chart.scales.x.getValueForPixel(event.x);
      x = Math.round(x * 1000) / 1000;
      const y = parseInt(chart.scales.y.getValueForPixel(event.y));

      if (x < 0 || y < 0 || y > 100) return;

      if (elementsAtEvent.length) {
        setPatterns((prevPatterns) => {
          const newPatterns = structuredClone(prevPatterns);
          for (const element of elementsAtEvent) {
            if (newPatterns[patternKey]) {
              newPatterns[patternKey].splice(element.index, 1);
              if (newPatterns[patternKey].length === 0) {
                delete newPatterns[patternKey];
              }
            }
          }
          return newPatterns;
        });
      } else {
        setPatterns((prevPatterns) => {
          const newPatterns = structuredClone(prevPatterns);
          if (!newPatterns[patternKey]) {
            newPatterns[patternKey] = [];
          }
          newPatterns[patternKey].push([x, y]);
          newPatterns[patternKey].sort(([a], [b]) => a - b);
          return newPatterns;
        });
      }
    };
    chartOptions.scales = {
      x: {
        type: "linear",
      },
      y: {
        min: 0,
        max: 100,
      },
    };

    return chartOptions;
  }

  React.useEffect(() => {
    console.log("use effect pattern key", patternKey);
    const pattern = patterns[patternKey];
    let xmin = 0;
    let xmax = 2;
    if (pattern) {
      xmin = Math.min(...pattern.map((i) => i[0]));
      xmax = Math.max(...pattern.map((i) => i[0]));
    }

    console.log("changed patternkey", patternKey, xmin, xmax);
    setChartOptions(getChartOptions(xmin, xmax));
  }, [patternKey]);

  function uploadScript(pattern, apiKey) {
    if (!pattern) {
      setInProgress("No key selected");
      return;
    }

    setInProgress(true);

    const loopedPattern = loopPattern(pattern);
    const csvPattern = loopedPattern
      .map((i) => `${parseInt(i[0] * 1000)},${i[1]}`)
      .join("\n");
    const file = new File([csvPattern], "script.csv", { type: "text/csv" });
    const formData = new FormData();
    formData.append("file", file);

    const headers = {
      "x-connection-key": apiKey,
      accept: "application/json",
      "Content-Type": "application/json",
    };

    console.log("uploading script to host");
    fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("upload success");
        const url = convertToDownloadUrl(data.data.url);
        console.log("Success:", url);

        console.log("uploading to Handy");

        fetch("https://www.handyfeeling.com/api/handy/v2/hssp/setup", {
          method: "PUT",
          headers: headers,
          body: JSON.stringify({
            url: url,
          }),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log("upload success");
            const estimatedServerTime = new Date().getTime();

            console.log("starting script");

            fetch("https://www.handyfeeling.com/api/handy/v2/hssp/play", {
              method: "PUT",
              headers: headers,
              body: JSON.stringify({
                estimatedServerTime: estimatedServerTime,
                startTime: 0,
              }),
            })
              .then((response) => response.json())
              .then((data) => {
                console.log("start success");
                setInProgress(false);
              })
              .catch((error) => setInProgress("Error talking to Handy"));
          })
          .catch((error) => setInProgress("Error talking to Handy"));
      })
      .catch((error) => setInProgress("Error uploading file"));
  }

  function stopPlay() {
    const headers = {
      "x-connection-key": apiKey,
      accept: "application/json",
      "Content-Type": "application/json",
    };
    console.log("stopping play");
    setInProgress(true);
    fetch("https://www.handyfeeling.com/api/handy/v2/hssp/stop", {
      method: "PUT",
      headers: headers,
    })
      .then((response) => response.json())
      .then((data) => setInProgress(false))
      .catch((error) => setInProgress("Error talking to Handy"));
  }

  const handlePatternsFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newPatterns = JSON.parse(e.target.result);
        setPatterns(newPatterns);

        const pattern = newPatterns[patternKey];
        if (pattern) {
          let xmin = Math.min(...pattern.map((i) => i[0]));
          let xmax = Math.max(...pattern.map((i) => i[0]));
          setChartOptions(getChartOptions(xmin, xmax));
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSinglePatternFileChange = (event) => {
    if (!patternKey) {
      setInProgress("No key selected");
      return;
    }

    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const funscript = JSON.parse(e.target.result);

        setPatterns((patterns) => {
          patterns = structuredClone(patterns);
          patterns[patternKey] = funscript.actions.map((i) => [
            i.at / 1000,
            i.pos,
          ]);
          return patterns;
        });
      };
      reader.readAsText(file);
    }
  };

  return (
    <>
      <div className="flex justify-center">
        <div className="w-full flex flex-col justify-center items-center">
          <div className="min-w-full w-0 text-sm">
            <p>
              You can modify this letter's pattern by clicking on an empty space
              on the chart to add a point and clicking on an existing point to
              remove it. When adding a point, time is rounded to nearest
              milliseconds. You can pan the chart by dragging and zoom in and
              out by scrolling.
            </p>
            <p className="mt-2">
              Value of the last point in the pattern is ignored, only its
              timestamp is used to know how to loop over the pattern.
            </p>
          </div>

          <div className="w-full">
            <div
              className={!patternKey ? "pointer-events-none opacity-50" : null}
            >
              <Timeline
                data={getChartData(patterns[patternKey])}
                options={chartOptions}
                ref={chartRef}
                // width="100%"
              />
            </div>
          </div>
          <p className="min-w-full w-0 text-sm text-center text-red-500">
            {!isValidPattern(patterns[patternKey])
              ? "Pattern must contains at least 2 points."
              : ""}
          </p>
          <div className="flex justify-center text-red-500">
            {typeof inProgress === "string" ? (
              inProgress
            ) : inProgress ? (
              <div
                style={{
                  maskImage: 'url("/spinner.svg")',
                  WebkitMaskImage: 'url("/spinner.svg")',
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                }}
                className="w-5 h-5 bg-black"
              />
            ) : (
              ""
            )}
          </div>

          <div className="flex justify-center">
            <div className="join">
              <label htmlFor="single-pattern-file" className="btn join-item">
                <input
                  id="single-pattern-file"
                  type="file"
                  className="hidden"
                  onChange={handleSinglePatternFileChange}
                />
                Load funscript file as this pattern
              </label>
              <input
                className="input input-bordered join-item"
                placeholder="API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />

              <button
                onClick={() => {
                  uploadScript(patterns[patternKey], apiKey);
                }}
                disabled={typeof inProgress === "boolean" && inProgress}
                className="btn btn-primary text-primary-content join-item"
              >
                Test on Handy
              </button>
              <button
                onClick={() => stopPlay()}
                disabled={typeof inProgress === "boolean" && inProgress}
                className="btn btn-error text-error-content join-item"
              >
                Stop Handy
              </button>
            </div>
          </div>
          <div className="flex justify-center mt-10">
            <div>
              <div className="join">
                <label htmlFor="patterns-file" className="btn join-item">
                  <input
                    id="patterns-file"
                    type="file"
                    className="hidden"
                    onChange={handlePatternsFileChange}
                  />
                  Upload file with all patterns
                </label>

                <button
                  onClick={() => downloadJson(patterns, "patterns.json")}
                  className="btn btn-warning join-item"
                >
                  Download all patterns as file
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pattern;
