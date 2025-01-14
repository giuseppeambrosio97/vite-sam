# Client-side image segmentation with SAM2
This is a Next.js application that performs image segmentation using Meta's Segment Anything Model V2 (SAM2) and onnxruntime-web. All the processing is done on the client side.

Demo at [sam2-seven.vercel.app](https://sam2-seven.vercel.app/)

https://github.com/user-attachments/assets/0d3b9f3b-2ab1-4627-9662-fca1a7cc2289

# Features
* Utilizes [Meta's SAM2 model](https://ai.meta.com/blog/segment-anything-2/) for segmentation
* [onnxruntime-web](https://github.com/microsoft/onnxruntime) for model inference
* webgpu accelerated if GPU available and supported by browser, cpu if not
* Model storage using [OPFS](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system) ([not working](https://bugs.webkit.org/show_bug.cgi?id=231706) in Safari)
* Image upload 
* Mask decoding based on point prompt
* Cropping
* Tested on macOS with Edge (webgpu, cpu), Chrome (webgpu, cpu), Firefox (cpu only), Safari (cpu only) 
* Fails on iOS (17, iPhone SE), not sure why

# Installation
Clone the repository:

```
git clone https://github.com/geronimi73/next-sam
cd next-sam
npm install
npm run dev
```

Open your browser and visit http://localhost:3000 

# Usage
1. Upload an image or use the default image.
2. Click the "Encode image" button to start encoding the image.
3. Once the encoding is complete, click on the image to decode masks.
4. Click the "Crop" button to crop the image using the decoded mask.

# Acknowledgements
* [Meta's Segment Anything Model 2](https://ai.meta.com/blog/segment-anything-2/)
* [onnxruntime](https://github.com/microsoft/onnxruntime)
* [Shadcn/ui components](https://ui.shadcn.com/)

Last but not least!
* [transformer.js](https://github.com/huggingface/transformers.js)
* https://github.com/ibaiGorordo/ONNX-SAM2-Segment-Anything
* https://github.com/lucasgelfond/webgpu-sam2
* https://github.com/microsoft/onnxruntime-inference-examples
