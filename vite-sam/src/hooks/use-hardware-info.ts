import { NA_STRING } from '@/lib/constants';
import { useState, useEffect, useCallback } from 'react';

type WebGPUInfo = {
  maxBufferSize: string;
  maxBindGroups: number;
  maxComputeWorkgroupSizeX: number;
  maxComputeWorkgroupSizeY: number;
  maxComputeWorkgroupSizeZ: number;
};

type WebGLInfo = {
  webglVendor: string;
  webglRenderer: string;
  webglVersion: string;
  shadingLanguageVersion: string;
  maxTextureSize: number;
  maxViewportDims: number[];
};

type CPUInfo = {
  cores: number;
  platform: string;
  userAgent: string;
  deviceMemory: string;
  language: string;
};

type HardwareInfo = {
  webGPUInfo: Partial<WebGPUInfo> | null;
  webGLInfo: Partial<WebGLInfo> | null;
  cpuInfo: CPUInfo | null;
};

type UseHardwareInfoReturn = HardwareInfo & {
  isLoading: boolean;
  error: string | null;
  debugInfo: string[];
  refreshHardwareInfo: () => Promise<void>;
};

export const useHardwareInfo = (): UseHardwareInfoReturn => {
  const [webGPUInfo, setWebGPUInfo] = useState<Partial<WebGPUInfo> | null>(null);
  const [webGLInfo, setWebGLInfo] = useState<Partial<WebGLInfo> | null>(null);
  const [cpuInfo, setCpuInfo] = useState<CPUInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugMessage = (message: string): void => {
    setDebugInfo((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const getWebGPUInfo = useCallback(async (): Promise<Partial<WebGPUInfo> | null> => {
    if (!('gpu' in navigator)) {
      addDebugMessage('WebGPU API not available');
      return null;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        addDebugMessage('No WebGPU adapter found');
        return null;
      }

      addDebugMessage('WebGPU adapter found');
      const maxBufferSizeInGB = adapter.limits.maxBufferSize / (1024 * 1024 * 1024);
      return {
        maxBufferSize: `${maxBufferSizeInGB} GB`,
        maxBindGroups: adapter.limits.maxBindGroups,
        maxComputeWorkgroupSizeX: adapter.limits.maxComputeWorkgroupSizeX,
        maxComputeWorkgroupSizeY: adapter.limits.maxComputeWorkgroupSizeY,
        maxComputeWorkgroupSizeZ: adapter.limits.maxComputeWorkgroupSizeZ,
      };
    } catch (error) {
      addDebugMessage(`WebGPU error: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }, []);

  const getWebGLInfo = useCallback((): Partial<WebGLInfo> | null => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

      if (!gl) {
        addDebugMessage('WebGL not available');
        return null;
      }

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (!debugInfo) {
        addDebugMessage('WEBGL_debug_renderer_info not available');
        return {
          webglVersion: gl.getParameter(gl.VERSION),
          shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
          maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
          maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        };
      }

      addDebugMessage('WebGL information retrieved');
      return {
        webglVendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        webglRenderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
        webglVersion: gl.getParameter(gl.VERSION),
        shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
        maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
      };
    } catch (error) {
      addDebugMessage(`WebGL error: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }, []);

  const getCPUInfo = useCallback((): CPUInfo | null => {
    try {
      const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number; userAgentData?: { platform: string } };
      const platform = navigatorWithMemory.userAgentData?.platform ?? navigator.userAgent;

      const info: CPUInfo = {
        cores: navigator.hardwareConcurrency,
        platform,
        userAgent: navigator.userAgent,
        deviceMemory: navigatorWithMemory.deviceMemory ? `${navigatorWithMemory.deviceMemory} GB` : NA_STRING,
        language: navigator.language,
      };
      addDebugMessage('CPU information retrieved');
      return info;
    } catch (error) {
      addDebugMessage(`CPU info error: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }, []);

  const refreshHardwareInfo = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setDebugInfo([]);

    try {
      const webGPUData = await getWebGPUInfo();
      const webGLData = getWebGLInfo();
      const cpuData = getCPUInfo();

      setWebGPUInfo(webGPUData);
      setWebGLInfo(webGLData);
      setCpuInfo(cpuData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(errorMessage);
      addDebugMessage(`Error fetching hardware info: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [getWebGPUInfo, getWebGLInfo, getCPUInfo]);

  useEffect(() => {
    refreshHardwareInfo();
  }, [refreshHardwareInfo]);

  return {
    webGPUInfo,
    webGLInfo,
    cpuInfo,
    isLoading,
    error,
    debugInfo,
    refreshHardwareInfo,
  };
};
