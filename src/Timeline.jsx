import * as React from "react";
import { Line } from "react-chartjs-2";
import { CategoryScale } from "chart.js";
import Chart from "chart.js/auto";
import zoomPlugin from "chartjs-plugin-zoom";

Chart.register(CategoryScale);
Chart.register(zoomPlugin);

const Timeline = React.forwardRef(function MyInput(props, ref) {
  return <Line {...props} ref={ref} />;
});

export default Timeline;
