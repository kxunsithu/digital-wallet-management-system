import { locationData } from "@/constants/locationData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type LocationFieldsProps = {
  stateRegion: string;
  township: string;
  onChange: (field: "state_region" | "township", value: string) => void;
};

export function LocationFields({
  stateRegion,
  township,
  onChange,
}: LocationFieldsProps) {
  const townships =
    locationData.find((state) => state.name === stateRegion)?.townships ?? [];

  return (
    <>
      <div className="space-y-1.5">
        <Label
          htmlFor="state_region"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          State / Region <span className="text-red-500">*</span>
        </Label>
        <Select
          value={stateRegion}
          onValueChange={(val) => {
            onChange("state_region", val ?? "");
            onChange("township", "");
          }}
        >
          <SelectTrigger
            id="state_region"
            className="h-11 w-full rounded-lg border-border text-sm"
          >
            <SelectValue placeholder="Select state / region" />
          </SelectTrigger>
          <SelectContent>
            {locationData.map((state) => (
              <SelectItem key={state.name} value={state.name}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor="township"
          className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          Township <span className="text-red-500">*</span>
        </Label>
        <Select
          value={township}
          onValueChange={(val) => onChange("township", val ?? "")}
          disabled={!stateRegion}
        >
          <SelectTrigger
            id="township"
            className="h-11 w-full rounded-lg border-border text-sm"
          >
            <SelectValue
              placeholder={stateRegion ? "Select township" : "Select state first"}
            />
          </SelectTrigger>
          <SelectContent>
            {townships.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
