import { useHardwareInfo } from "@/hooks/use-hardware-info";
import { Card, CardContent, } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { NA_STRING } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ClassNameValue } from "tailwind-merge";

type HardwareInfoProps = Readonly<{
  className: ClassNameValue;
}>;

export default function HardwareInfo({
  className,
}: HardwareInfoProps) {
  const {
    webGPUInfo,
    webGLInfo,
    cpuInfo,
    isLoading,
    error,
    debugInfo,
    refreshHardwareInfo,
  } = useHardwareInfo();

  const formatKey = (key: string): string => {
    return key.replace(/([A-Z])/g, " $1").trim();
  };

  const renderInfoSection = <T extends Record<string, unknown>>(
    data: T | null,
    title: string
  ) => {
    if (isLoading) {
      return (
        <div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <p>Loading {title.toLowerCase()}...</p>
        </div>
      );
    }

    if (data) {
      return (
        <div>
          <h3 className="text-lg font-semibold mb-2">{title}</h3>
          <div className="space-y-2">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="grid grid-cols-2 gap-2">
                <span className="font-medium">{formatKey(key)}:</span>
                <span>{value?.toString() ?? NA_STRING}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p>No {title.toLowerCase()} available</p>
      </div>
    );
  };

  return (
    <Card className={cn("w-full max-w-2xl", "relative", className)}>
      <CardContent className="p-0 pt-4">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-0"
          onClick={refreshHardwareInfo}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">
            Error: {error}
          </div>
        )}

        <div className="space-y-6">
          {renderInfoSection(webGPUInfo, "WebGPU Information")}
          {renderInfoSection(webGLInfo, "WebGL Information")}
          {renderInfoSection(cpuInfo, "CPU Information")}

          <div>
            <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
            <pre className="whitespace-pre-wrap text-sm p-2 rounded">
              {debugInfo.join("\n")}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
