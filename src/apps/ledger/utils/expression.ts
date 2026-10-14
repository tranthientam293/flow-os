// Simple sums for the amount field, e.g. "50.000 + 20.000 − 5.000".
// Numbers are whole đồng; dots group thousands and are ignored when parsing.

export const OPERATORS = ["+", "−", "×", "÷"] as const;
export type Operator = (typeof OPERATORS)[number];
type Token = string | Operator;

const MAX_DIGITS = 12;

const isOperator = (t: Token): t is Operator =>
  (OPERATORS as readonly string[]).includes(t);

// What a typed character means: a digit, an operator, or nothing.
const OPERATOR_KEYS: Record<string, Operator> = {
  "+": "+",
  "-": "−",
  "−": "−",
  "*": "×",
  x: "×",
  X: "×",
  "×": "×",
  "/": "÷",
  ":": "÷",
  "÷": "÷",
};

// Splits typed text into numbers and operators. Anything else (spaces, dots,
// letters) is dropped; a second operator in a row replaces the first, and the
// text can't start with one.
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const ch of text) {
    const last = tokens.at(-1);
    if (ch >= "0" && ch <= "9") {
      if (last !== undefined && !isOperator(last)) {
        const digits = last === "0" ? ch : last + ch;
        tokens[tokens.length - 1] = digits.slice(0, MAX_DIGITS);
      } else tokens.push(ch);
    } else if (OPERATOR_KEYS[ch] && last !== undefined) {
      if (isOperator(last)) tokens[tokens.length - 1] = OPERATOR_KEYS[ch];
      else tokens.push(OPERATOR_KEYS[ch]);
    }
  }
  return tokens;
}

// "50.000 + 20.000", grouping each number's thousands with dots.
export const formatTokens = (tokens: Token[]) =>
  tokens
    .map((t) =>
      isOperator(t) ? ` ${t} ` : t.replace(/\B(?=(\d{3})+(?!\d))/g, "."),
    )
    .join("")
    .trim();

export const hasOperator = (tokens: Token[]) => tokens.some(isOperator);

// The result in whole đồng (× and ÷ before + and −), ignoring a trailing
// operator; undefined when there's no number or it divides by zero.
export function evaluate(tokens: Token[]): number | undefined {
  const items = isOperator(tokens.at(-1) ?? "") ? tokens.slice(0, -1) : tokens;
  if (!items.length) return undefined;

  // First pass: × and ÷ into terms; second: add the terms up.
  const terms: number[] = [Number(items[0])];
  const signs: Operator[] = ["+"];
  for (let i = 1; i < items.length; i += 2) {
    const op = items[i] as Operator;
    const n = Number(items[i + 1]);
    if (op === "×") terms[terms.length - 1] *= n;
    else if (op === "÷") {
      if (n === 0) return undefined;
      terms[terms.length - 1] /= n;
    } else {
      terms.push(n);
      signs.push(op);
    }
  }
  const total = terms.reduce(
    (sum, t, i) => (signs[i] === "−" ? sum - t : sum + t),
    0,
  );
  return Math.round(total);
}
