import { useHardwareInfo } from '@/hooks/use-hardware-info';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function HardwareInfo() {
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
    return key.replace(/([A-Z])/g, ' $1').trim();
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
                <span>{value?.toString() ?? 'N/A'}</span> {/* Replaced || with ?? */}
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
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Hardware Information</CardTitle>
        <Button
          variant="outline"
          size="icon"
          onClick={refreshHardwareInfo}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded">
            Error: {error}
          </div>
        )}

        <div className="space-y-6">
          {renderInfoSection(webGPUInfo, 'WebGPU Information')}
          {renderInfoSection(webGLInfo, 'WebGL Information')}
          {renderInfoSection(cpuInfo, 'CPU Information')}

          <div>
            <h3 className="text-lg font-semibold mb-2">Debug Information</h3>
            <pre className="whitespace-pre-wrap text-sm p-2 rounded">
              {debugInfo.join('\n')}
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
