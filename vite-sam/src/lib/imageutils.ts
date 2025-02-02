
type Size = { w: number, h: number };
type MaskTensor = { dims: number[], cpuData: Float32Array };

/**
 * Applies a mask image to an image canvas using globalCompositeOperation.
 * 
 * @param {HTMLCanvasElement} imageCanvas - The image canvas that the mask will be applied to.
 * @param {HTMLCanvasElement} maskCanvas - The canvas containing the mask to apply.
 * @returns {HTMLCanvasElement} The resulting canvas with the mask applied.
 */
export function maskImageCanvas(imageCanvas: HTMLCanvasElement, maskCanvas: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Failed to get 2D context");

  canvas.height = imageCanvas.height;
  canvas.width = imageCanvas.width;

  context.drawImage(
    maskCanvas,
    0,
    0,
    maskCanvas.width,
    maskCanvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  );
  
  context.globalCompositeOperation = "source-in";
  context.drawImage(
    imageCanvas,
    0,
    0,
    imageCanvas.width,
    imageCanvas.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas;
}

/**
 * Resizes a given canvas to the specified size.
 * 
 * @param {HTMLCanvasElement} canvasOrig - The original canvas to resize.
 * @param {Size} size - The new size of the canvas.
 * @returns {HTMLCanvasElement} The resized canvas.
 */
export function resizeCanvas(canvasOrig: HTMLCanvasElement, size: Size): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  canvas.height = size.h;
  canvas.width = size.w;

  ctx.drawImage(
    canvasOrig,
    0,
    0,
    canvasOrig.width,
    canvasOrig.height,
    0,
    0,
    canvas.width,
    canvas.height
  );

  return canvas;
}

/**
 * Merges two mask canvases into one by resizing the source mask to fit the target mask.
 * 
 * @param {HTMLCanvasElement} sourceMask - The source mask canvas to merge.
 * @param {HTMLCanvasElement} targetMask - The target mask canvas to merge into.
 * @returns {HTMLCanvasElement} A new canvas with the merged masks.
 */
export function mergeMasks(sourceMask: HTMLCanvasElement, targetMask: HTMLCanvasElement): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  canvas.height = targetMask.height;
  canvas.width = targetMask.width;

  ctx.drawImage(targetMask, 0, 0);
  ctx.drawImage(
    sourceMask,
    0,
    0,
    sourceMask.width,
    sourceMask.height,
    0,
    0,
    targetMask.width,
    targetMask.height
  );

  return canvas;
}

/**
 * Calculates the proper position and size to resize a source image while maintaining its aspect ratio,
 * padding it if necessary to fit the target size.
 * 
 * @param {Size} sourceDim - The dimensions of the source image.
 * @param {Size} targetDim - The dimensions of the target space.
 * @returns {Object} An object containing the x, y, width, and height to resize and pad the source image.
 */
export function resizeAndPadBox(sourceDim: Size, targetDim: Size): { x: number, y: number, w: number, h: number } {
  if (sourceDim.h === sourceDim.w) {
    return { x: 0, y: 0, w: targetDim.w, h: targetDim.h };
  } else if (sourceDim.h > sourceDim.w) {
    const newW = (sourceDim.w / sourceDim.h) * targetDim.w;
    const padLeft = Math.floor((targetDim.w - newW) / 2);
    return { x: padLeft, y: 0, w: newW, h: targetDim.h };
  } else if (sourceDim.h < sourceDim.w) {
    const newH = (sourceDim.h / sourceDim.w) * targetDim.h;
    const padTop = Math.floor((targetDim.h - newH) / 2);
    return { x: 0, y: padTop, w: targetDim.w, h: newH };
  }

  // Default return value in case no condition matches
  return { x: 0, y: 0, w: 0, h: 0 }; // Ensure return
}

/**
 * Slices a mask tensor (4D) into a 2D canvas by selecting the mask at the given index.
 * 
 * @param {MaskTensor} maskTensor - The input mask tensor containing the mask data.
 * @param {number} maskIdx - The index of the mask to slice from the tensor.
 * @returns {HTMLCanvasElement} A canvas containing the sliced mask.
 */
export function sliceTensorMask(maskTensor: MaskTensor, maskIdx: number): HTMLCanvasElement {
  const [, , width, height] = maskTensor.dims;
  const stride = width * height;
  const start = stride * maskIdx, end = start + stride;
  const maskData = maskTensor.cpuData.slice(start, end);
  const C = 4; // 4 output channels, RGBA
  const imageData = new Uint8ClampedArray(stride * C);

  for (let srcIdx = 0; srcIdx < maskData.length; srcIdx++) {
    const trgIdx = srcIdx * C;
    const maskedPx = maskData[srcIdx] > 0;
    imageData[trgIdx] = maskedPx ? 255 : 0;
    imageData[trgIdx + 1] = 0;
    imageData[trgIdx + 2] = 0;
    imageData[trgIdx + 3] = maskedPx ? 255 : 0; // alpha
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  canvas.height = height;
  canvas.width = width;
  ctx.putImageData(new ImageData(imageData, width, height), 0, 0);

  return canvas;
}

/**
 * Converts a canvas (RGB format) to a Float32Array representation suitable for model input.
 * The array is normalized to a [0, 1] range.
 * 
 * @param {HTMLCanvasElement} canvas - The canvas to convert to a Float32Array.
 * @returns {Object} An object containing the Float32Array and its shape.
 */
export function canvasToFloat32Array(canvas: HTMLCanvasElement): { float32Array: Float32Array, shape: number[] } {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get 2D context");

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  if (!imageData) throw new Error("Failed to get image data");

  const shape = [1, 3, canvas.width, canvas.height];

  const redArray: number[] = [];
  const greenArray: number[] = [];
  const blueArray: number[] = [];

  for (let i = 0; i < imageData.length; i += 4) {
    redArray.push(imageData[i]);
    greenArray.push(imageData[i + 1]);
    blueArray.push(imageData[i + 2]);
  }

  const transposedData = redArray.concat(greenArray).concat(blueArray);
  const float32Array = new Float32Array(shape[1] * shape[2] * shape[3]);
  const l = transposedData.length;

  for (let i = 0; i < l; i++) {
    float32Array[i] = transposedData[i] / 255.0; // convert to float
  }

  return { float32Array, shape };
}

