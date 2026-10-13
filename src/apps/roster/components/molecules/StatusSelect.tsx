import { Checkbox } from "antd";
import { SESSION_STATUS_OPTIONS } from "../../constants/options";
import type { SessionStatus } from "../../models/roster";

// Picks session statuses with checkboxes. None checked means every status.
export function StatusSelect({
  value,
  onChange,
}: {
  value: SessionStatus[];
  onChange: (statuses: SessionStatus[]) => void;
}) {
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
