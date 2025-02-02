import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Crop, Fan, ImageUp, LoaderCircle } from "lucide-react";

import { IMAGE_SIZE } from "@/lib/constants";
import {
  canvasToFloat32Array,
  maskImageCanvas,
  mergeMasks,
  resizeAndPadBox,
  resizeCanvas,
  sliceTensorMask,
} from "@/lib/imageutils";
import GitHubButton from "@/components/app/GitHubButton";
import HardwareInfoModal from "./components/app/hardware/HardwareInfoModal";

export default function App() {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageEncoded, setImageEncoded] = useState(false);
  const [status, setStatus] = useState("");

  const [imageURL, setImageURL] = useState("./image_square.png");

  const samWorker = useRef<Worker | null>(null);
  const [image, setImage] = useState<HTMLCanvasElement | null>(null);
  const [mask, setMask] = useState<HTMLCanvasElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement | null>(null);

  // Start encoding image
  const encodeImageClick = async () => {
    samWorker.current?.postMessage({
      type: "encodeImage",
      data: canvasToFloat32Array(resizeCanvas(image, IMAGE_SIZE)),
    });

    setLoading(true);
    setStatus("Encoding");
  };

  // Start decoding, prompt with mouse coords
  const imageClick = (
    event: React.MouseEvent<HTMLCanvasElement, MouseEvent>
  ) => {
    if (!imageEncoded) return;

    const canvas = canvasRef.current;
    const rect = event.currentTarget.getBoundingClientRect();

    // input image will be resized to 1024x1024 -> normalize mouse pos to 1024x1024
    const point = {
      x: ((event.clientX - rect.left) / canvas!.width) * IMAGE_SIZE.w,
      y: ((event.clientY - rect.top) / canvas!.height) * IMAGE_SIZE.h,
      label: 1,
    };

    samWorker.current?.postMessage({ type: "decodeMask", data: point });

    setLoading(true);
    setStatus("Decoding");
  };

  // Decoding finished -> parse result and update mask
  const handleDecodingResults = (decodingResults: DecoderOutput) => {
    // SAM2 returns 3 mask along with scores -> select best one
    const maskTensors = decodingResults.masks;
    const maskScores = decodingResults.iou_predictions.cpuData;
    const bestMaskIdx = maskScores.indexOf(Math.max(...maskScores));
    const maskCanvas = sliceTensorMask(maskTensors, bestMaskIdx);

    setMask((prevMask) =>
      prevMask
        ? mergeMasks(maskCanvas, prevMask)
        : resizeCanvas(maskCanvas, IMAGE_SIZE)
    );
  };

  // Handle web worker messages
  const onWorkerMessage = useCallback((event: MessageEvent) => {
    const { type, data } = event.data;

    if (type == "pong") {
      const { success, device } = data;

      if (success) {
        setLoading(false);
        setDevice(device);
        setStatus("Encode image");
      } else {
        setStatus("Error (check JS console)");
      }
    } else if (type == "downloadInProgress" || type == "loadingInProgress") {
      setLoading(true);
      setStatus("Loading model");
    } else if (type == "encodeImageDone") {
      // alert(data.durationMs)
      setImageEncoded(true);
      setLoading(false);
      setStatus("Ready. Click on image");
    } else if (type == "decodeMaskResult") {
      handleDecodingResults(data);
      setLoading(false);
      setStatus("Ready. Click on image");
    }
  }, []);

  // Crop image with mask
  const cropClick = () => {
    if (!image || !mask) {
      console.error("Image or Mask null, unable to perform crop!");
      return;
    }
    const link = document.createElement("a");
    link.href = maskImageCanvas(image, mask).toDataURL();
    link.download = "crop.png";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Upload new image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      const dataURL = window.URL.createObjectURL(file);
      setImage(null);
      setMask(null);
      setImageEncoded(false);
      setStatus("Encode image");
      setImageURL(dataURL);
    }
  };

  // Load web worker
  useEffect(() => {
    if (!samWorker.current) {
      samWorker.current = new Worker(
        new URL("./lib/worker.ts", import.meta.url),
        { type: "module" }
      );
      samWorker.current.addEventListener("message", onWorkerMessage);
      samWorker.current.postMessage({ type: "ping" });

      setLoading(true);
    }
  }, [onWorkerMessage]);

  // Load image, pad to square and store in offscreen canvas
  useEffect(() => {
    if (imageURL) {
      const img = new Image();
      img.src = imageURL;
      img.onload = function () {
        const largestDim = Math.max(img.naturalWidth, img.naturalHeight);
        const box = resizeAndPadBox(
          { h: img.naturalHeight, w: img.naturalWidth },
          { h: largestDim, w: largestDim }
        );

        const canvas = document.createElement("canvas");
        canvas.width = largestDim;
        canvas.height = largestDim;

        canvas
          .getContext("2d")!
          .drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            img.naturalHeight,
            box.x,
            box.y,
            box.w,
            box.h
          );
        setImage(canvas);
      };
    }
  }, [imageURL]);

  // Offscreen canvas changed, draw it
  useEffect(() => {
    if (image) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
    }
  }, [image]);

  // Mask changed, draw original image and mask on top with some alpha
  useEffect(() => {
    if (mask) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        0,
        0,
        image.width,
        image.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      ctx.globalAlpha = 0.4;
      ctx.drawImage(
        mask,
        0,
        0,
        mask.width,
        mask.height,
        0,
        0,
        canvas.width,
        canvas.height
      );
      ctx.globalAlpha = 1;
    }
  }, [mask, image]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <GitHubButton />
        <HardwareInfoModal />
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="flex flex-col gap-2">
            <p>
              Clientside Image Segmentation with onnxruntime-web and Meta's SAM2
              🥹❤️‍🩹🧃
            </p>
            <p
              className={cn(
                "flex gap-1 items-center",
                device ? "visible" : "invisible"
              )}
            >
              <Fan className="w-6 h-6 animate-[spin_2.5s_linear_infinite] direction-reverse" />
              Running on {device}
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-4">
              <Button
                onClick={encodeImageClick}
                disabled={loading || imageEncoded}
              >
                <p className="flex items-center gap-2">
                  {loading && <LoaderCircle className="animate-spin" />}
                  {status}
                </p>
              </Button>
              {mask && image && (
                <Button onClick={cropClick} variant="secondary">
                  <Crop /> Crop
                </Button>
              )}
              <Button
                onClick={() => {
                  imageFileInputRef.current?.click();
                }}
                variant="secondary"
                disabled={loading}
              >
                <ImageUp /> Change image
              </Button>
            </div>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={512}
                height={512}
                onClick={imageClick}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      <input
        ref={imageFileInputRef}
        hidden
        accept="image/*"
        type="file"
        onInput={handleFileUpload}
      />
    </div>
  );
}
