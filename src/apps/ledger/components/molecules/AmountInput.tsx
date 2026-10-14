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

// An amount in đồng that also takes a sum, e.g. "50.000 + 20.000 − 5.000".
// Phones get the number keyboard plus a row of operator buttons; on a computer
// + - * / can be typed too. The form value is always the result; = (or leaving
// the field, or Enter) replaces the sum with it. antd Form passes
// id/value/onChange. With `operators={false}` it takes a plain amount only:
// digits, no sums and no operator buttons.
export function AmountInput({
  id,
  value,
  onChange,
  operators = true,
}: {
  id?: string;
  value?: number;
  onChange?: (value: number | undefined) => void;
  operators?: boolean;
}) {
  const [text, setText] = useState(() => formatValue(value));
  const tokens = tokenize(text);
  const result = evaluate(tokens);
  const isSum = hasOperator(tokens);

  const update = (next: string) => {
    // Plain amount: anything but digits (and the dots grouping them) is
    // dropped, so an operator never gets in.
    const nextTokens = tokenize(
      operators ? next : next.replace(/[^0-9.]/g, ""),
    );
    setText(formatTokens(nextTokens));
    onChange?.(evaluate(nextTokens));
  };

  // Shows the result in place of the sum (left as is if it isn't positive,
  // so the sum that caused it stays visible).
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
        // Enter shows the result, like =.
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
