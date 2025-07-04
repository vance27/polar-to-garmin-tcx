import fs from "fs/promises";
import path from "path";
import { DOMParser, XMLSerializer } from "xmldom";

async function processTCX() {
  const inputPath = path.resolve("tcx-files/input.tcx");
  const outputPath = path.resolve("tcx-files/output.tcx");

  // Read TCX file
  const xmlString = await fs.readFile(inputPath, "utf-8");

  // Parse XML
  const dom = new DOMParser().parseFromString(xmlString, "application/xml");

  // === MODIFY XML HERE ===
  // Example: Add a comment node to the root element
  const comment = dom.createComment("TCX modified!");
  dom.documentElement.appendChild(comment);

  // [YOUR MODIFICATION CODE GOES HERE]

  // Serialize XML back to string
  const outputXml = new XMLSerializer().serializeToString(dom);

  // Write to new file
  await fs.writeFile(outputPath, outputXml, "utf-8");

  console.log(`✅ Processed TCX written to ${outputPath}`);
}

processTCX().catch((err) => {
  console.error("❌ Error:", err);
});
