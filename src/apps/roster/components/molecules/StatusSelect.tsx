import { Checkbox } from "antd";
import { SESSION_STATUS_OPTIONS } from "../../constants/options";
import type { SessionStatus } from "../../models/roster";

interface StatusSelectProps {
  value: SessionStatus[];
  onChange: (statuses: SessionStatus[]) => void;
}

export function StatusSelect({ value, onChange }: StatusSelectProps) {
  return (
    <Checkbox.Group<SessionStatus>
      aria-label='Status'
      className='flex flex-wrap gap-x-4 gap-y-2'
      value={value}
      onChange={onChange}
      options={SESSION_STATUS_OPTIONS}
    />
  );
}
