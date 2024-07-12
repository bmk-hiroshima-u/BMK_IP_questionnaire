const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
  const { password } = req.query;

  if (password === "painres") {
    const filePath = path.join(__dirname, "resources", "Consent document.pdf");
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.status(500).send("Error loading the PDF file.");
        return;
      }
      res.setHeader("Content-Type", "application/pdf");
      res.send(data);
    });
  } else {
    res.status(401).send("Unauthorized");
  }
};
