import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button, Input, InputNumber, Popconfirm } from "antd";
import { SettingsPanel } from "@/components/molecules";
import {
  deleteSessionTypeMutationOptions,
  saveSessionTypeMutationOptions,
} from "../../apis/session-types";
import { useRoster } from "../../context/roster-context";
import type { SessionType } from "../../models/roster";
import { formatRate } from "../../utils/money";

export function SessionTypesView() {
  return (
    <div className='mx-auto flex max-w-3xl flex-col gap-6 px-4 py-4 sm:px-6'>
      <SessionTypesPanel />
    </div>
  );
}

function SessionTypesPanel() {
  const { center, sessionTypes } = useRoster();
  const save = useMutation(saveSessionTypeMutationOptions(center.id));
  const [name, setName] = useState("");
  const [rate, setRate] = useState<number | null>(null);

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    save.mutate(
      { name: trimmed, default_hourly_rate: rate },
      {
        onSuccess: () => {
          setName("");
          setRate(null);
        },
      },
    );
  };

  return (
    <SettingsPanel
      title='Session types'
      description='Kinds of sessions your center runs, e.g. “Piano lesson” or “Group class”, with the default salary per hour. The type picked when booking becomes the session’s default title. Set each trainer’s types and salary in the Trainers tab.'
    >
      <div className='flex flex-col gap-3'>
        {sessionTypes.length > 0 && (
          <ul className='divide-y rounded-md border'>
            {sessionTypes.map((type) => (
              <SessionTypeRow key={type.id} type={type} />
            ))}
          </ul>
        )}
        <div className='flex flex-wrap gap-2'>
          <Input
            value={name}
            maxLength={80}
            placeholder='New session type'
            aria-label='New session type'
            className='min-w-40 flex-1'
            onChange={(e) => setName(e.target.value)}
            onPressEnter={add}
          />
          <InputNumber<number>
            value={rate}
            min={0}
            placeholder='Default salary / hour'
            aria-label='Default salary per hour'
            className='w-48'
            onChange={setRate}
          />
          <Button
            icon={<Plus />}
            loading={save.isPending && !save.variables?.id}
            disabled={!name.trim()}
            onClick={add}
          >
            Add
          </Button>
        </div>
      </div>
    </SettingsPanel>
  );
}

function SessionTypeRow({ type }: { type: SessionType }) {
  const { center } = useRoster();
  const save = useMutation(saveSessionTypeMutationOptions(center.id));
  const remove = useMutation(deleteSessionTypeMutationOptions(center.id));
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(type.name);
  const [rate, setRate] = useState<number | null>(type.default_hourly_rate);

  const cancel = () => {
    setName(type.name);
    setRate(type.default_hourly_rate);
    setEditing(false);
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    save.mutate(
      { id: type.id, name: trimmed, default_hourly_rate: rate },
      { onSuccess: () => setEditing(false) },
    );
  };

  return (
    <li className='flex flex-wrap items-center gap-2 px-3 py-1.5 text-sm'>
      {editing ? (
        <>
          <Input
            size='small'
            value={name}
            maxLength={80}
            aria-label='Session type name'
            className='min-w-32 flex-1'
            onChange={(e) => setName(e.target.value)}
            onPressEnter={submit}
          />
          <InputNumber<number>
            size='small'
            value={rate}
            min={0}
            placeholder='Salary / hour'
            aria-label='Default salary per hour'
            className='w-40'
            onChange={setRate}
          />
          <Button
            size='small'
            type='text'
            icon={<Check />}
            aria-label='Save'
            loading={save.isPending}
            onClick={submit}
          />
          <Button
            size='small'
            type='text'
            icon={<X />}
            aria-label='Cancel'
            onClick={cancel}
          />
        </>
      ) : (
        <>
          <span className='min-w-0 flex-1 truncate text-foreground'>
            {type.name}
          </span>
          <span className='text-muted-foreground tabular-nums'>
            {formatRate(type.default_hourly_rate)}
          </span>
          <Button
            size='small'
            type='text'
            icon={<Pencil />}
            aria-label={`Edit ${type.name}`}
            onClick={() => setEditing(true)}
          />
          <Popconfirm
            title={`Delete ${type.name}?`}
            description='Booked sessions keep their title. Trainers lose this type.'
            okText='Delete'
            okButtonProps={{ danger: true }}
            onConfirm={() => remove.mutate(type.id)}
          >
            <Button
              size='small'
              type='text'
              danger
              icon={<Trash2 />}
              aria-label={`Delete ${type.name}`}
              loading={remove.isPending}
            />
          </Popconfirm>
        </>
      )}
    </li>
  );
}
