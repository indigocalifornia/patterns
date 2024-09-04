import * as React from "react";

import Keyboard from "./Keyboard";
import Pattern from "./Pattern";
import Timeline from "./Timeline";

import { downloadJson } from "./utils";

// const Timeline = loadable(() => import("./Timeline"));

if (process.env.NODE_ENV === "production") {
  console.log = function () {};
}

function removeDuplicates(array, keyFn) {
  // Keep last occurence

  const seen = new Map();

  // First pass: record the last index of each key
  array.forEach((item, index) => {
    const key = keyFn(item);
    seen.set(key, index);
  });

  // Second pass: filter the array
  return array.filter((item, index) => {
    const key = keyFn(item);
    return seen.get(key) === index;
  });
}

const numberKeyMap = {
  49: 10,
  50: 20,
  51: 30,
  52: 40,
  53: 50,
  54: 60,
  55: 70,
  56: 80,
  57: 90,
  48: 0,
  173: 100,
};

function isValidPattern(pattern) {
  if (!pattern) {
    return true;
  }
  return pattern.length >= 2;
}

function getChartData(track, vline) {
  const data = track.map((i) => ({ x: i[0], y: i[1] }));

  const datasets = [
    {
      borderWidth: 1,
      data: data,
    },
  ];

  if (vline) {
    datasets.push({
      borderWidth: 3,
      borderColor: "black",
      radius: 0,
      data: [
        { x: vline, y: 0 },
        { x: vline, y: 100 },
      ],
    });
  }

  return {
    datasets,
  };
}
function getChartOptions(xmin, xmax, ymin, ymax) {
  return {
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
        min: xmin,
        max: xmax,
      },
      y: {
        min: ymin,
        max: ymax,
      },
    },
    maintainAspectRatio: true,
    responsive: true,
    animation: {
      duration: 0,
    },
  };
}

const initialChartOptions = getChartOptions(0, 1, 0, 100);

function roundToNearestBPM(timestampInSeconds, bpm) {
  // Convert BPM to seconds per beat
  const secondsPerBeat = 60 / bpm;

  // Round to the nearest multiple of secondsPerBeat
  return Math.round(timestampInSeconds / secondsPerBeat) * secondsPerBeat;
}

function stretchCompressArray(arr, bpm) {
  if (arr.length < 2) return arr; // Return as is if array has less than 2 elements

  const lastTimestamp = arr[arr.length - 1][0];

  // Round the last timestamp to the nearest beat
  let roundedLastTimestamp = roundToNearestBPM(lastTimestamp, bpm);
  if (roundedLastTimestamp === 0) {
    // If rounded to 0, use the next beat instead
    roundedLastTimestamp = 60 / bpm; // One beat duration in seconds
  }
  // Calculate the scaling factor
  const scaleFactor = roundedLastTimestamp / lastTimestamp;

  // Create a new array with adjusted timestamps
  return arr.map(([timestamp, value], index) => {
    if (index === 0) return [0, value]; // Keep first element as is
    if (index === arr.length - 1) return [roundedLastTimestamp, value]; // Set last element to rounded timestamp

    // Scale timestamps for all other elements
    const adjustedTimestamp = timestamp * scaleFactor;
    return [adjustedTimestamp, value];
  });
}

const IndexPage = () => {
  const [track, setTrack] = React.useState([]);
  const [keyPressedTime, setKeyPressedTime] = React.useState(-1);
  const [keyPressedValue, setKeyPressedValue] = React.useState();
  const [currentTime, setCurrentTime] = React.useState(0);
  const [trackUpdating, setTrackUpdating] = React.useState(false);
  const [lastUpdate, setLastUpdate] = React.useState(-1);
  const [totalTime, setTotalTime] = React.useState(0);
  const [videoSrc, setVideoSrc] = React.useState("");
  const [patterns, setPatterns] = React.useState({});
  const [bpm, setBpm] = React.useState(0);
  const [patternKey, setPatternKey] = React.useState();
  const [chartOptions, setChartOptions] = React.useState(initialChartOptions);

  const videoRef = React.useRef();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("video/")) {
      const videoUrl = URL.createObjectURL(file);
      setVideoSrc(videoUrl);
    } else {
      alert("Please select a valid video file.");
    }
  };

  function handleKeyDown(e) {
    console.log(e.keyCode, new Date().getTime());
    if (e.repeat) return;
    setKeyPressedTime(currentTime);
    setKeyPressedValue(e.keyCode);
  }

  function handleKeyUp(e) {
    console.log("keyPressedValue", keyPressedValue, "key pressed", e.keyCode);
    if (keyPressedValue && e.keyCode !== keyPressedValue) return;
    setKeyPressedTime(-1);
    setKeyPressedValue(null);
  }

  function monitor() {
    if (!videoRef.current) return;

    const time = videoRef.current.currentTime;

    console.log("video time", time, "current time", currentTime);

    if (time === currentTime) return;

    setCurrentTime(time);

    console.log("keyPressedTime", keyPressedTime);

    if (keyPressedTime < 0) return;

    if (!trackUpdating) {
      console.log("key pressed", keyPressedValue);

      if (Object.keys(numberKeyMap).includes(String(keyPressedValue))) {
        setTrackUpdating(true);
        let newTrack = [...track];
        newTrack.push([currentTime, numberKeyMap[keyPressedValue]]);
        setLastUpdate(currentTime);
        newTrack = removeDuplicates(newTrack, (item) => item[0]);
        newTrack = newTrack.sort(([a], [b]) => a - b);
        setTrack(newTrack);
        setTrackUpdating(false);
        return;
      }

      let pattern = patterns[keyPressedValue];

      if (pattern) {
        setTrackUpdating(true);
        const newTrack = timestampPatternScanner(pattern);

        setTrack(newTrack);
      } else {
        console.log("bad key code", keyPressedValue);
      }
    }
  }

  React.useEffect(() => {
    setTrackUpdating(false);
  }, [track]);

  React.useEffect(() => {
    fetch("/patterns.json")
      .then((response) => response.json())
      .then((data) => {
        console.log("patterns loaded");
        setPatterns(data);
      })
      .catch((error) => console.error("Error:", error));
  }, []);

  React.useEffect(() => {
    const newchartOptions = structuredClone(chartOptions);
    newchartOptions.scales.x.max = totalTime;
    setChartOptions(newchartOptions);
  }, [totalTime]);

  React.useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    const interval = setInterval(monitor, 10);

    // Don't forget to clean up
    return function cleanup() {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      clearInterval(interval);
    };
  });

  function onLoadedVideo(e) {
    setTotalTime(e.target.duration);
  }

  function timestampPatternScanner(pattern) {
    const xmin = pattern[0][0];
    pattern = pattern.map((i) => [i[0] - xmin, i[1]]);

    if (bpm) {
      console.log("old pattern", pattern, "bpm", bpm);
      pattern = stretchCompressArray(pattern, bpm);
      console.log("new pattern after bpm", pattern);
    }

    const patternDuration = pattern[pattern.length - 1][0] - pattern[0][0];
    let newTrack = [...track];
    let patternIndex = 0;
    let loopCount = Math.max(
      Math.floor((currentTime - keyPressedTime) / patternDuration),
      0
    );

    const adjustedPattern = pattern.map((i) => [
      i[0] + keyPressedTime + loopCount * patternDuration,
      i[1],
    ]);

    console.log("pattern", JSON.stringify(adjustedPattern));

    console.log({
      keyPressedTime,
      patternDuration,
      lastUpdate,
      currentTime,
      loopCount,
    });

    newTrack = newTrack.filter(
      ([trackTimestamp, trackValue]) =>
        trackTimestamp <= lastUpdate || trackTimestamp >= currentTime
    );

    while (patternIndex < adjustedPattern.length) {
      let [timestamp, value] = adjustedPattern[patternIndex];

      console.log({
        patternIndex,
        timestamp,
      });

      if (timestamp >= lastUpdate && timestamp <= currentTime) {
        newTrack.push([timestamp, value]);
      } else if (timestamp > currentTime) {
        break;
      }
      patternIndex++;
    }
    setLastUpdate(currentTime);

    newTrack = removeDuplicates(newTrack, (item) => item[0]);
    newTrack = newTrack.sort(([a], [b]) => a - b);

    return newTrack;
  }

  function getImages() {
    const images = {};
    Object.keys(patterns).forEach((patternKey) => {
      const pattern = patterns[patternKey];
      if (pattern) {
        const config = {
          type: "line",
          data: {
            datasets: [
              {
                borderWidth: 3,
                borderColor: "red",
                pointRadius: 0,
                data: pattern.map((i) => ({ x: i[0], y: i[1] })),
              },
            ],
          },
          options: {
            scales: {
              x: {
                type: "linear",
                grid: {
                  display: false,
                },
                border: {
                  display: false,
                },
                ticks: {
                  display: false,
                },
                display: false,
              },
              y: {
                min: 0,
                max: 100,
                grid: {
                  display: false,
                },
                border: {
                  display: false,
                },
                ticks: {
                  display: false,
                },
                display: false,
              },
            },
            plugins: {
              legend: {
                display: false,
              },
            },
          },
        };

        images[
          `Key${String.fromCharCode(patternKey)}`
        ] = `https://quickchart.io/chart?v=4&width=500&height=350&c=${JSON.stringify(
          config
        )}`;
      }
    });
    return images;
  }

  return (
    <main className="flex justify-center">
      <div className="flex flex-col items-center justify-center w-full max-w-full">
        <Keyboard
          onClick={(keyCode) => {
            setPatternKey(keyCode);
            document.getElementById("pattern-modal").showModal();
          }}
          existing={Object.keys(patterns).map(
            (i) => `Key${String.fromCharCode(i)}`
          )}
          invalid={Object.keys(patterns)
            .filter((i) => !isValidPattern(patterns[i]))
            .map((i) => `Key${String.fromCharCode(i)}`)}
          images={getImages()}
        />

        <div className="join">
          <button
            onClick={() =>
              document.getElementById("instructions-modal").showModal()
            }
            className="btn join-item"
          >
            Instructions
          </button>
          <label htmlFor="file" className="btn btn-success h-full join-item">
            <input
              id="file"
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            Select video
          </label>
          <div className="bg-info px-4 flex items-center text-sm max-w-48">
            Align with BPM
          </div>
          <input
            type="number"
            placeholder="BPM"
            className="input input-bordered border-4 input-info w-24 join-item"
            value={bpm}
            onChange={(e) => setBpm(parseInt(e.target.value))}
          />

          <button
            className="btn btn-warning join-item"
            onClick={() => setTrack([])}
          >
            Empty script
          </button>
          <button
            onClick={() =>
              downloadJson({
                actions: track.map((i) => ({
                  at: parseInt(i[0] * 1000),
                  pos: i[1],
                })),
              })
            }
            className="btn btn-primary join-item"
          >
            Download script
          </button>
        </div>

        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            controls
            className="max-h-96"
            style={{ height: "40vh" }}
            onLoadedMetadata={onLoadedVideo}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div
            className="max-h-96 flex items-center"
            style={{ height: "40vh" }}
          >
            Please select a video
          </div>
        )}

        <div className="w-full">
          <Timeline
            data={getChartData(track, currentTime)}
            options={chartOptions}
          />
        </div>

        <dialog id="pattern-modal" className="modal">
          <div className="modal-box w-11/12 max-w-5xl">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>
            <Pattern
              patterns={patterns}
              setPatterns={setPatterns}
              patternKey={patternKey}
              setPatternKey={setPatternKey}
            />
          </div>
        </dialog>

        <dialog id="instructions-modal" className="modal">
          <div className="modal-box">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                ✕
              </button>
            </form>
            <div className="text-sm">
              <p>
                This app allows you to create a funscript file by pressing
                keyboard buttons, just like when you play a piano. Each letter
                key is associated with a pattern that gets "played" into the
                funcript at the current play time.
              </p>
              <p className="mt-2">How to use:</p>
              <ol className="mt-2 list-decimal list-inside">
                <li>Select a video and start it.</li>
                <li>
                  As the video plays, press a letter key to start playing a
                  pattern into the current time. Video must be playing for this
                  to happen.
                </li>
                <li>
                  You will see the funscript chart updated. Chart times are in
                  seconds.
                </li>
                <li>
                  You can press a number key to insert a single point at the
                  current time ("0" = "0%", "1" = "10%", ..., "9" = "90%", "-" =
                  "100%")
                </li>
                <li>
                  You can choose to align patterns to BPM. This will make them
                  start and end on the beat (calculated from BPM). Set BPM to 0
                  to disable.
                </li>
                <li>You can click on a key to edit patterns.</li>
              </ol>
            </div>
          </div>
        </dialog>
      </div>
    </main>
  );
};

export default IndexPage;

export const Head = () => <title>funscript-piano</title>;
