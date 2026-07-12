import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import readline from "readline/promises";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const MODELS = ["gpt-image-1", "dall-e-3"];

const SIZES = [
  "1024x1024",
  "1792x1024",
  "1024x1792",
];

const STYLES = ["vivid", "natural"];

const metadata = [];

async function ensureFolders() {
  await fs.ensureDir("images/gpt-image-1");
  await fs.ensureDir("images/dall-e-3");
  await fs.ensureDir("metadata");
}

function estimateCost(model) {
  if (model === "gpt-image-1") return "$0.04 (estimated)";
  return "$0.08 (estimated)";
}

function improvePrompt(prompt) {
  return `
Create a highly detailed, cinematic, ultra realistic image.

Theme:
${prompt}

Requirements:

• dramatic lighting
• professional composition
• rich colors
• high quality
• 8k look
• sharp focus
`;
}

async function generateImage(model, prompt, size, style) {
  console.log(
    `Generating ${model} | ${size} | ${style}`
  );

  const response = await client.images.generate({
    model,
    prompt,
    size,
    style,
  });

  const image = response.data[0];

  const filename = `${model}-${size}-${style}.png`;

  const folder = `images/${model}`;

  const filepath = path.join(folder, filename);

  const buffer = Buffer.from(image.b64_json, "base64");

  await fs.writeFile(filepath, buffer);

  metadata.push({
    model,
    size,
    style,
    file: filepath,
    prompt,
    created: new Date().toISOString(),
    estimatedCost: estimateCost(model),
  });

  return filepath;
}

async function buildGallery() {
  let html = `
<html>

<head>

<title>AI Gallery</title>

<style>

body{

font-family:Arial;

background:#111;

color:white;

}

.grid{

display:grid;

grid-template-columns:repeat(3,1fr);

gap:20px;

}

img{

width:100%;

border-radius:12px;

}

.card{

background:#222;

padding:15px;

}

</style>

</head>

<body>

<h1>Smart Image Generator Gallery</h1>

<div class="grid">
`;

  for (const item of metadata) {
    html += `
<div class="card">

<img src="${item.file}" />

<p><b>Model:</b> ${item.model}</p>

<p><b>Size:</b> ${item.size}</p>

<p><b>Style:</b> ${item.style}</p>

<p><b>Cost:</b> ${item.estimatedCost}</p>

</div>
`;
  }

  html += `
</div>

</body>

</html>
`;

  await fs.writeFile("gallery.html", html);

  await fs.writeJSON(
    "metadata/metadata.json",
    metadata,
    {
      spaces: 2,
    }
  );
}

async function main() {
  await ensureFolders();

  console.log("===== Smart Image Generator =====\n");

  const theme = await rl.question(
    "Enter image theme: "
  );

  const enhancedPrompt = improvePrompt(theme);

  console.log("\nEnhanced Prompt:\n");

  console.log(enhancedPrompt);

  let totalEstimated = 0;

  for (const model of MODELS) {
    for (const size of SIZES) {
      for (const style of STYLES) {
        try {
          await generateImage(
            model,
            enhancedPrompt,
            size,
            style
          );

          totalEstimated +=
            model === "gpt-image-1"
              ? 0.04
              : 0.08;
        } catch (err) {
          console.log(err.message);
        }
      }
    }
  }

  await buildGallery();

  console.log("\nCompleted.");

  console.log(
    `Generated ${metadata.length} images`
  );

  console.log(
    `Estimated Cost: $${totalEstimated.toFixed(
      2
    )}`
  );

  console.log(
    "Gallery saved as gallery.html"
  );

  rl.close();
}

main();