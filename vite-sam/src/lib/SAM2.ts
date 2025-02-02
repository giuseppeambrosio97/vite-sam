import * as ort from "onnxruntime-web/all";
import { DECODER_URL, ENCODER_URL } from "@/lib/constants";
import { TypedTensor } from "onnxruntime-web";

enum ExecutionProviderType {
  WEB_GPU = "webgpu",
  CPU = "cpu",
}

type ORTSession = {
  session: ort.InferenceSession;
  executionProvider: ExecutionProviderType;
};

type TImageEncoded = { high_res_feats_0: ort.Tensor; high_res_feats_1: ort.Tensor; image_embed: ort.Tensor; }

export class SAM2 {
  bufferEncoder: ArrayBuffer | null = null;
  bufferDecoder: ArrayBuffer | null = null;
  sessionEncoder: ORTSession | null = null;
  sessionDecoder: ORTSession | null = null;
  image_encoded: TImageEncoded | null = null;


  private async downloadModel(url: string): Promise<ArrayBuffer | null> {
    const filename = url.split("/").pop();
    if (!filename) throw new Error("Invalid URL or missing file name");

    console.log(`Downloading model: ${filename}`);
    const root = await navigator.storage.getDirectory();

    // Step 1: Try to retrieve from cache
    try {
      const fileHandle = await root.getFileHandle(filename);
      const file = await fileHandle.getFile();
      if (file.size > 0) return await file.arrayBuffer();
    } catch {
      console.log(`File ${filename} not found in cache.`);
    }

    // Step 2: Fetch from the network
    try {
      console.log(`Downloading ${filename} from ${url}`);
      const response = await fetch(url, { mode: "cors", headers: { Origin: location.origin } });
      if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
      const buffer = await response.arrayBuffer();

      // Step 3: Store in cache
      try {
        const fileHandle = await root.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(buffer);
        await writable.close();
        console.log(`Stored ${filename} in cache.`);
      } catch (storageError) {
        console.error(`Failed to store ${filename}:`, storageError);
      }

      return buffer;
    } catch (downloadError) {
      console.error(`Download failed for ${filename}:`, downloadError);
      return null;
    }
  }

  async downloadModels() {
    const [encoder, decoder] = await Promise.all([
      this.downloadModel(ENCODER_URL),
      this.downloadModel(DECODER_URL),
    ]);
    this.bufferEncoder = encoder;
    this.bufferDecoder = decoder;
  }



  async createSessions() {
    const success =
      (await this.getEncoderSession()) && (await this.getDecoderSession());

    return {
      success: success,
      device: success ? this.sessionEncoder?.executionProvider : null,
    };
  }

  private async getORTSession(model: ArrayBuffer): Promise<ORTSession> {
    /** Creating a session with executionProviders: {"webgpu", "cpu"} fails
     *  => "Error: multiple calls to 'initWasm()' detected."
     *  but ONLY in Safari and Firefox (wtf)
     *  seems to be related to web worker, see https://github.com/microsoft/onnxruntime/issues/22113
     *  => loop through each ep, catch e if not available and move on
     */
    const executionProviders = Object.values(ExecutionProviderType);
    for (const executionProvider of executionProviders) {
      try {
        console.log(`Trying to create ORT session with ${executionProvider}`);
        const session = await ort.InferenceSession.create(model, {
          executionProviders: [executionProvider],
        });
        console.log(`Successfully created ORT session with ${executionProvider}`);
        return { session, executionProvider };
      } catch (e) {
        console.error(`Failed to create ORT session ${executionProvider}`);
        console.error(e);
      }
    }
    throw new Error(`Failed to create ORT session: Could not initialize session with any available execution provider ${executionProviders}.`);
  }

  async getEncoderSession() {
    if (!this.sessionEncoder)
      this.sessionEncoder = await this.getORTSession(this.bufferEncoder!);

    return this.sessionEncoder;
  }

  async getDecoderSession() {
    if (!this.sessionDecoder)
      this.sessionDecoder = await this.getORTSession(this.bufferDecoder!);

    return this.sessionDecoder;
  }

  async encodeImage(inputTensor: TypedTensor<"float32">) {
    const { session } = await this.getEncoderSession();
    const results = await session.run({ image: inputTensor });

    this.image_encoded = {
      high_res_feats_0: results[session.outputNames[0]],
      high_res_feats_1: results[session.outputNames[1]],
      image_embed: results[session.outputNames[2]],
    };
  }

  async decodeImage(point: Point): Promise<DecoderOutput> {
    const { session } = await this.getDecoderSession();

    if (!this.image_encoded) throw Error("The image is not encoded!");

    const inputs = {
      image_embed: this.image_encoded.image_embed,
      high_res_feats_0: this.image_encoded.high_res_feats_0,
      high_res_feats_1: this.image_encoded.high_res_feats_1,
      point_coords: new ort.Tensor("float32", [point.x, point.y], [1, 1, 2]),
      point_labels: new ort.Tensor("float32", [point.label], [1, 1]),
      mask_input: new ort.Tensor(
        "float32",
        new Float32Array(256 * 256),
        [1, 1, 256, 256]
      ),
      has_mask_input: new ort.Tensor("float32", [0], [1]),
      orig_im_size: new ort.Tensor("int32", [1024, 1024], [2]),
    };

    return (await session.run(inputs)) as DecoderOutput;
  }
}
