
import { Tensor } from 'onnxruntime-web';

declare global {
    // Worker Message Types
    type WorkerMessageType =
        | 'ping'
        | 'pong'
        | 'downloadInProgress'
        | 'loadingInProgress'
        | 'encodeImage'
        | 'encodeImageDone'
        | 'decodeMask'
        | 'decodeMaskResult';

    // Point type for mask decoding
    type Point = {
        x: number;
        y: number;
        label: number;
    };

    // Input message types
    type PingMessage = {
        type: 'ping';
    };

    type EncodeImageMessage = {
        type: 'encodeImage';
        data: {
            float32Array: Float32Array;
            shape: number[];
        };
    };

    type DecodeMaskMessage = {
        type: 'decodeMask';
        data: Point;
    };

    // Output message types
    type PongMessage = {
        type: 'pong';
        data: {
            success: boolean;
            device: string | null;
        };
    };

    type ProgressMessage = {
        type: 'downloadInProgress' | 'loadingInProgress';
    };

    type EncodeImageDoneMessage = {
        type: 'encodeImageDone';
        data: {
            durationMs: number;
        };
    };

    type DecodeMaskResultMessage = {
        type: 'decodeMaskResult';
        data: {
            masks: Tensor;
            iou_predictions: {
                cpuData: number[];
            };
        };
    };

    type WorkerInputMessage =
        | PingMessage
        | EncodeImageMessage
        | DecodeMaskMessage;

    type WorkerOutputMessage =
        | PongMessage
        | ProgressMessage
        | EncodeImageDoneMessage
        | DecodeMaskResultMessage;

}

export { }