import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { z } from "zod";
import { nrcData, nrcTypes } from "@/constants/nrcData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const nrcSchema = z.object({
  stateCode: z.string().min(1, "Please select a state code."),
  townshipCode: z.string().min(1, "Please select a township code."),
  type: z.string().min(1, "Please select an NRC type."),
  number: z.string().regex(/^[၀-၉]{6}$/, "Please enter exactly 6 Myanmar NRC digits."),
});

type NrcParts = z.infer<typeof nrcSchema>;

const emptyNrc: NrcParts = { stateCode: "", townshipCode: "", type: "", number: "" };

const toMyanmarDigits = (value: string) =>
  value.replace(/[0-9]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) + 0x1010));

const keepMyanmarDigits = (value: string) => toMyanmarDigits(value).replace(/[^၀-၉]/g, "").slice(0, 6);

export const formatNrc = ({ stateCode, townshipCode, type, number }: NrcParts) =>
  stateCode || townshipCode || type || number
    ? `${stateCode}/${townshipCode}(${type})${number}`
    : "";

const parseNrc = (value?: string): NrcParts => {
  const match = value?.match(/^([၀-၉]+)\/([^()]+)\(([^()]+)\)([၀-၉]+)$/);
  return match
    ? { stateCode: match[1], townshipCode: match[2], type: match[3], number: match[4] }
    : emptyNrc;
};

export const validateNrc = (value?: string) => {
  const result = nrcSchema.safeParse(parseNrc(value));
  return result.success ? null : result.error.issues[0]?.message ?? "Please enter valid NRC information.";
};

function SearchableSelect({
  label,
  value,
  placeholder,
  options,
  onChange,
  disabled = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredOptions = options.filter((option) => option.label.includes(query));

  return (
    <div className="min-w-0 space-y-1.5">
      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button type="button" variant="outline" />} disabled={disabled} className="h-12 w-full justify-between rounded-md border-slate-200 bg-white px-3 text-sm font-medium shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50/40 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/70 dark:hover:bg-slate-800">
          <span className={cn("truncate", !value && "text-slate-400")}>{value || placeholder}</span>
          <ChevronDown className="size-4 shrink-0 opacity-60" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--anchor-width)] min-w-72 rounded-lg border-slate-200 p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="relative mb-2 border-b border-slate-100 pb-2 dark:border-slate-800">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value.replace(/[^\u1000-\u109F]/g, ""))} placeholder="ရှာဖွေရန်" className="h-10 pl-9" lang="my" />
          </div>
          <div className="max-h-60 overflow-y-auto px-0.5">
            {filteredOptions.map((option) => (
              <Button key={option.value} type="button" variant="ghost" className="h-11 w-full justify-between rounded-md px-3 text-left font-medium hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/40 dark:hover:text-blue-300" onClick={() => { onChange(option.value); setOpen(false); setQuery(""); }}>
                {option.label}
                {value === option.value && <Check className="size-4" />}
              </Button>
            ))}
            {filteredOptions.length === 0 && <p className="py-5 text-center text-sm text-slate-500">မတွေ့ပါ</p>}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function NRCInput({ value, onChange, onValidityChange }: { value?: string; onChange: (value: string) => void; onValidityChange?: (isValid: boolean) => void }) {
  const [parts, setParts] = useState<NrcParts>(() => parseNrc(value));
  const townships = useMemo(() => nrcData.find((state) => state.stateCode === parts.stateCode)?.townships ?? [], [parts.stateCode]);

  useEffect(() => {
    const parsed = parseNrc(value);
    if (formatNrc(parsed) !== formatNrc(parts) && value !== formatNrc(parts)) setParts(parsed);
  }, [value]);

  useEffect(() => {
    const result = nrcSchema.safeParse(parts);
    onValidityChange?.(result.success);
    onChange(formatNrc(parts));
  }, [parts]);

  const update = (updates: Partial<NrcParts>) => setParts((current) => ({ ...current, ...updates }));

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40" lang="my">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Label className="text-sm font-semibold text-slate-800 dark:text-slate-100">NRC Information <span className="text-red-500">*</span></Label>
        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">{parts.stateCode || "…"}/{parts.townshipCode || "…"}({parts.type || "…"}){parts.number || "……"}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,.8fr)_auto_minmax(0,1fr)_auto_minmax(0,.9fr)_auto_minmax(0,1fr)] lg:items-end">
        <SearchableSelect label="State Code" value={parts.stateCode} placeholder="ရွေးချယ်ပါ" options={nrcData.map((state) => ({ value: state.stateCode, label: state.stateCode }))} onChange={(stateCode) => update({ stateCode, townshipCode: "" })} />
        <span className="hidden pb-3 text-xl font-semibold text-slate-400 lg:block">/</span>
        <SearchableSelect label="Township Code" value={parts.townshipCode} placeholder="ရွေးချယ်ပါ" options={townships.map((township) => ({ value: township.code, label: township.code }))} onChange={(townshipCode) => update({ townshipCode })} disabled={!parts.stateCode} />
        <span className="hidden pb-3 text-xl font-semibold text-slate-400 lg:block">(</span>
        <SearchableSelect label="NRC Type" value={parts.type} placeholder="ရွေးချယ်ပါ" options={[...nrcTypes].map((type) => ({ value: type.value, label: type.label }))} onChange={(type) => update({ type })} />
        <span className="hidden pb-3 text-xl font-semibold text-slate-400 lg:block">)</span>
        <div className="space-y-1.5">
          <Label htmlFor="nrc-number" className="text-xs font-semibold text-slate-600 dark:text-slate-300">NRC Number (6 digits)</Label>
          <Input id="nrc-number" value={parts.number} onChange={(event) => update({ number: keepMyanmarDigits(event.target.value) })} inputMode="numeric" maxLength={6} placeholder="၁၂၃၄၅၆" className="h-12 rounded-md border-slate-200 bg-white text-base font-medium shadow-sm transition-colors focus-visible:border-blue-500 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900" lang="my" />
        </div>
      </div>
    </div>
  );
}
