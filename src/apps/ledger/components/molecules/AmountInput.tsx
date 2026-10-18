import { useState } from "react";
import { Button, Input } from "antd";
import {
  OPERATORS,
  evaluate,
  formatTokens,
  hasOperator,
  tokenize,
} from "../../utils/expression";
import { CURRENCY_SYMBOL, formatAmount } from "../../utils/money";

const formatValue = (value: number | undefined) =>
  value === undefined ? "" : formatTokens(tokenize(String(value)));

interface AmountInputProps {
  id?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
  operators?: boolean;
}

export function AmountInput({
  id,
  value,
  onChange,
  operators = true,
}: AmountInputProps) {
  const [text, setText] = useState(() => formatValue(value));
  const tokens = tokenize(text);
  const result = evaluate(tokens);
  const isSum = hasOperator(tokens);

  const update = (next: string) => {
    const nextTokens = tokenize(
      operators ? next : next.replace(/[^0-9.]/g, ""),
    );
    setText(formatTokens(nextTokens));
    onChange?.(evaluate(nextTokens));
  };

  const collapse = () => {
    if (isSum && result !== undefined && result > 0)
      setText(formatValue(result));
  };

  return (
    <div className='flex flex-col gap-2'>
      <Input
        id={id}
        size='large'
        inputMode='numeric'
        enterKeyHint='done'
        autoComplete='off'
        placeholder='0'
        suffix={CURRENCY_SYMBOL}
        value={text}
        onChange={(e) => update(e.target.value)}
        onBlur={collapse}
        onPressEnter={collapse}
      />
      {isSum && (
        <p className='text-sm text-muted-foreground tabular-nums'>
          = {result === undefined ? "…" : formatAmount(result)}
        </p>
      )}
      {operators && (
        <div className='grid grid-cols-5 gap-2'>
          {[...OPERATORS, "="].map((key) => (
            <Button
              key={key}
              // Keep focus (and the phone keyboard) on the field.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                key === "=" ? collapse() : update(`${text}${key}`)
              }
              aria-label={OPERATOR_LABELS[key]}
              title={OPERATOR_LABELS[key]}
              className='text-base'
            >
              {key}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

const OPERATOR_LABELS: Record<string, string> = {
  "+": "Add",
  "−": "Subtract",
  "×": "Multiply",
  "÷": "Divide",
  "=": "Show result",
};
