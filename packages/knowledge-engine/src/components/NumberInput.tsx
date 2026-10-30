import { useEffect, useId, useState } from "react";
export function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
  disabled = false,
}: {
  disabled?: boolean;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  const [invalid, setInvalid] = useState(false);
  useEffect(() => {
    setDraft(String(value));
    setInvalid(false);
  }, [value]);
  const commit = () => {
    const n = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(n) || n < min || n > max) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    onChange(n);
  };
  return (
    <div className="ki-field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="number"
        inputMode={Number.isInteger(step) && min >= 0 ? "numeric" : "decimal"}
        enterKeyHint="done"
        disabled={disabled}
        value={draft}
        min={min}
        max={max}
        step={step}
        aria-invalid={invalid}
        aria-describedby={invalid ? id + "-error" : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          setInvalid(false);
          const n = e.target.valueAsNumber;
          if (
            e.target.value !== "" &&
            Number.isFinite(n) &&
            n >= min &&
            n <= max
          )
            onChange(n);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setDraft(String(value));
            setInvalid(false);
          }
        }}
      />
      {invalid && (
        <small id={id + "-error"} className="ki-field-error">
          {document.documentElement.lang.startsWith("en")
            ? `Enter a number from ${min} to ${max}.`
            : `请输入 ${min}–${max} 之间的数字；图解仍保留已应用的值。`}
        </small>
      )}
    </div>
  );
}
