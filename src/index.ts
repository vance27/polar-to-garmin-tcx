import fs from "fs/promises";
import path from "path";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { config } from "dotenv";

import { PolarToGarminTCXConverter } from "./claude-generated.js";

config({ path: ".env" });
config({ path: ".env.local", override: true });

process.env = {
  ...process.env,
  INPUT_TCX: process.env.INPUT_TCX ? process.env.INPUT_TCX : "input.tcx",
  OUTPUT_TCX: process.env.INPUT_TCX ? process.env.OUTPUT_TCX : "output.tcx",
};

async function processTCX() {
  const inputPath = path.resolve(`tcx-files/${process.env.INPUT_TCX}`);
  const outputPath = path.resolve(`tcx-files/${process.env.OUTPUT_TCX}`);

  // Read TCX file
  const xmlString = await fs.readFile(inputPath, "utf-8");

  // Parse XML
  const dom = new XMLParser({ ignoreAttributes: false }).parse(xmlString);

  // === MODIFY XML HERE ===
  // Example: Add a comment node to the root element
  //   const comment = dom.createComment("TCX modified!");
  //   dom.documentElement.appendChild(comment);

  // [YOUR MODIFICATION CODE GOES HERE]

  // Serialize XML back to string
  const outputXml = new XMLBuilder({ ignoreAttributes: false }).build(dom);

  // Write to new file
  await fs.writeFile(outputPath, outputXml, "utf-8");

  console.log(`✅ Processed TCX written to ${outputPath}`);
}

processTCX().catch((err) => {
  console.error("❌ Error:", err);
});

const processViaClaude = async () => {
  const converter = new PolarToGarminTCXConverter();
  const polarData = await fs.readFile("./tcx-files/soccer.tcx", "utf8");

  const garminData = converter.convertPolarToGarmin(polarData);

  await fs.writeFile("garmin_workout.tcx", garminData);
};

processViaClaude().catch((err) => {
  console.error(err);
});
