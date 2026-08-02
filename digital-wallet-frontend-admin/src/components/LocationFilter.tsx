import { locationData } from "@/constants/locationData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LocationFilterProps = {
  stateRegion: string;
  onStateRegionChange: (value: string) => void;
  township: string;
  onTownshipChange: (value: string) => void;
};

export function LocationFilter({
  stateRegion,
  onStateRegionChange,
  township,
  onTownshipChange,
}: LocationFilterProps) {
  const townships =
    locationData.find((state) => state.name === stateRegion)?.townships ?? [];

  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">
          State / Region
        </label>
        <Select
          value={stateRegion}
          onValueChange={(val) => {
            onStateRegionChange(val === "all" || val === null ? "" : val);
            onTownshipChange("");
          }}
        >
          <SelectTrigger className="h-12 w-full">
            <SelectValue placeholder="State / Region">
              {(val: string | null) =>
                !val || val === "all" ? "All states" : val
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {locationData.map((state) => (
              <SelectItem key={state.name} value={state.name}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-foreground">Township</label>
        <Select
          value={township}
          onValueChange={(val) =>
            onTownshipChange(val === "all" || val === null ? "" : val)
          }
          disabled={!stateRegion}
        >
          <SelectTrigger className="h-12 w-full">
            <SelectValue placeholder="Township">
              {(val: string | null) =>
                !val || val === "all" ? "All townships" : val
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Townships</SelectItem>
            {townships.map((townshipName) => (
              <SelectItem key={townshipName} value={townshipName}>
                {townshipName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
