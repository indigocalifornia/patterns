export const downloadJson = (obj, filename) => {
  if (!filename) {
    filename = "script.funscript";
  }

  // Convert the data to a JSON string
  const jsonString = JSON.stringify(obj, null, 4);

  // Create a Blob with the JSON data
  const blob = new Blob([jsonString], { type: "application/json" });

  // Create a temporary URL for the Blob
  const url = URL.createObjectURL(blob);

  // Create a temporary anchor element
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // Programmatically click the link to trigger the download
  document.body.appendChild(link);
  link.click();

  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
