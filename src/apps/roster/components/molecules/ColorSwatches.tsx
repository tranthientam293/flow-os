import { useState } from "react";
import { Check, Pipette, RefreshCw } from "lucide-react";
import { Button, ColorPicker, Tooltip } from "antd";
import { cn } from "@/utils";
import { generatePalette, nextColor, normalizeHex } from "../../utils/colors";

const SWATCH_COUNT = 9;

export function ColorSwatches({
  value,
  onChange,
  used = [],
}: {
  value?: string;
  onChange?: (color: string) => void;
  used?: readonly string[];
}) {
  const [seed, setSeed] = useState(0);
  const generated = [
    nextColor(value ? [...used, value] : used),
    ...generatePalette(SWATCH_COUNT, seed),
  ];
  const swatches = [
    ...new Set([...(value ? [value] : []), ...generated]),
  ].slice(0, SWATCH_COUNT + 1);

  return (
    <fieldset className='flex min-w-0 flex-wrap items-center gap-2'>
      {swatches.map((color) => {
        const selected = value === color;
        return (
          <button
            key={color}
            type='button'
            aria-pressed={selected}
            aria-label={color}
            onClick={() => onChange?.(color)}
            className={cn(
              "flex size-7 items-center justify-center rounded-full border-2 border-transparent text-white transition-transform hover:scale-110",
              selected && "border-foreground",
            )}
            style={{ backgroundColor: color }}
          >
            {selected && <Check className='size-3.5' strokeWidth={3} />}
          </button>
        );
      })}
      <Tooltip title='More colors'>
        <Button
          size='small'
          shape='circle'
          icon={<RefreshCw />}
          aria-label='More colors'
          onClick={() => setSeed((s) => s + SWATCH_COUNT)}
        />
      </Tooltip>
      <ColorPicker
        disabledAlpha
        value={value}
        onChangeComplete={(color) =>
          onChange?.(normalizeHex(color.toHexString()))
        }
      >
        <Button
          size='small'
          shape='circle'
          icon={<Pipette />}
          aria-label='Custom color'
        />
      </ColorPicker>
    </fieldset>
  );
}
