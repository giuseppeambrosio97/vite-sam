import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import HardwareInfo from "./HardwareInfo";
import { Monitor } from "lucide-react";

export default function HardwareInfoModal() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2">
          <Monitor /> View Hardware Info
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed top-[45%] max-w-3xl h-[80%] overflow-auto gap-1">
        <DialogHeader>
          <DialogTitle>Hardware Information</DialogTitle>
          <DialogDescription>
            Details about your hardware components.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center mt-0">
          <HardwareInfo className="border-0" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
