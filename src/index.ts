import fs from "fs/promises";
import path from "path";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { config } from "dotenv";

import { PolarToGarminTCXConverter } from "./claude-generated.js";
import { GarminTcxDocument } from "./garmin-interface.js";

config({ path: ".env" });
config({ path: ".env.local", override: true });

process.env = {
  ...process.env,
  INPUT_TCX: process.env.INPUT_TCX ? process.env.INPUT_TCX : "input.tcx",
  OUTPUT_TCX: process.env.INPUT_TCX ? process.env.OUTPUT_TCX : "output.tcx",
};

const processViaClaude = async () => {
  try {
    const inputPath = path.resolve(`tcx-files/${process.env.INPUT_TCX}`);
    const outputPath = path.resolve(`tcx-files/${process.env.OUTPUT_TCX}`);

    const converter = new PolarToGarminTCXConverter();
    const polarData = await fs.readFile(inputPath, "utf8");
    const garminData = converter.convertPolarToGarmin(polarData);
    await fs.writeFile(outputPath, garminData);
    console.log(`✅ Processed TCX written to ${outputPath}`);
  } catch (err) {
    console.error("❌ Error:", err);
  }
};

processViaClaude().catch((err) => {
  console.error(err);
});
