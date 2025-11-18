// this is fine for one image front end, terribly inefficient for bulk...
export async function extractPalette(
  imgEl,
  numColors = 5,
  updateText,

  sampleRate = 1,
    k = 10
) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = imgEl.width;
  canvas.height = imgEl.height;
  ctx.drawImage(imgEl, 0, 0);

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  // Sample every Nth dot pixel (its in paramas above)
  let data = [];
  for (let i = 0; i < pixels.length; i += 4 * sampleRate) {
    data.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }

  // Initialize centroids
  let centroids = initCentroids(data, numColors);

  // K-means loop with status updates
  for (let iter = 0; iter < k; iter++) {
    if (updateText) updateText(`Processing colors... Iteration ${iter + 1}/${k}`);

    const clusters = Array.from({ length: numColors }, () => []);
    for (let p of data) {
      const idx = nearest(p, centroids);
      clusters[idx].push(p);
    }

    centroids = centroids.map((c, i) =>
      avg(clusters[i].length ? clusters[i] : [c])
    );

    // Give the browser a chance to render updates apparently
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  if (updateText) updateText("Done extracting colors!");


  let totalSSD = 0;
  for (let p of data) {
    const idx = nearest(p, centroids);
    const c = centroids[idx];
    const d2 =
      (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
    totalSSD += d2;
  }
// this kinda doesnt matter for this

  return {
    colors: centroids.map(rgbToHex),
    ssd: totalSSD,
  };
}

// helper funcs
function initCentroids(data, k) {
  return data.slice(0, k);
}

function nearest(p, centroids) {
  let best = 0,
    bestDist = Infinity;
  centroids.forEach((c, i) => {
    const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
    if (d < bestDist) {
      best = i;
      bestDist = d;
    }
  });
  return best;
}

function avg(points) {
  let r = 0,
    g = 0,
    b = 0;
  points.forEach(([pr, pg, pb]) => {
    r += pr;
    g += pg;
    b += pb;
  });
  const n = points.length;
  return [r / n, g / n, b / n];
}

function rgbToHex([r, g, b]) {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.round(x).toString(16).padStart(2, "0"))
      .join("")
  );
}
