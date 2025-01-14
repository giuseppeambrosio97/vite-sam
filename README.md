# Client-side Image Segmentation with SAM2

This is a Vite-based application that performs client-side image segmentation using Meta's Segment Anything Model V2 (SAM2) and onnxruntime-web. The project is a re-implementation of [next-sam](https://github.com/geronimi73/next-sam), which was originally built with Next.js, now adapted to use Vite as the build tool.

## Demo

Visit the original demo of the Next.js implementation at [sam2-seven.vercel.app](https://sam2-seven.vercel.app/).

## Features

* **Meta's SAM2 model** for high-quality segmentation.
* **onnxruntime-web** for efficient model inference.
* Accelerated by **WebGPU** (if supported by the browser and hardware) or falls back to **CPU**.
* Utilizes **Origin Private File System (OPFS)** for model storage (not supported in Safari due to [this issue](https://bugs.webkit.org/show_bug.cgi?id=231706)).
* **Image upload** for processing.
* Interactive mask decoding using point prompts.
* Built-in **cropping** functionality.
* Tested on major desktop browsers:
  * macOS with Edge (WebGPU, CPU), Chrome (WebGPU, CPU), Firefox (CPU only), Safari (CPU only).
  * Known issue: does not work on iOS (17, iPhone SE).

## Installation

To get started with the Vite implementation:

```bash
# Clone the repository
git clone https://github.com/giuseppeambrosio97/vite-sam
cd vite-sam

# Install dependencies
yarn install

# Run the development server
yarn run dev
```

Open your browser and visit [http://localhost:3000](http://localhost:3000).

## Usage

1. Upload an image or use the provided default image.
2. Click the **"Encode Image"** button to preprocess the image.
3. Interact with the image by clicking to decode masks.
4. Use the **"Crop"** button to crop the image based on the selected mask.

## Acknowledgements

This project is a Vite-based adaptation of [next-sam](https://github.com/geronimi73/next-sam). Special thanks to the original author and contributors for their work and inspiration.

Additional references and dependencies:

* [Meta's Segment Anything Model 2](https://ai.meta.com/blog/segment-anything-2/)
* [onnxruntime](https://github.com/microsoft/onnxruntime)
* [transformers.js](https://github.com/huggingface/transformers.js)
* [Shadcn/ui components](https://ui.shadcn.com/)
* [Geronimo Medium Article](https://medium.com/@geronimo7/in-browser-image-segmentation-with-segment-anything-model-2-c72680170d92)

Other related projects:

* [ibaiGorordo/ONNX-SAM2-Segment-Anything](https://github.com/ibaiGorordo/ONNX-SAM2-Segment-Anything)
* [lucasgelfond/webgpu-sam2](https://github.com/lucasgelfond/webgpu-sam2)
* [microsoft/onnxruntime-inference-examples](https://github.com/microsoft/onnxruntime-inference-examples)
