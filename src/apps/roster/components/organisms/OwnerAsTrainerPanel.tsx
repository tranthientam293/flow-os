import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button, Select, Switch } from "antd";
import { SettingsPanel } from "@/components/molecules";
import { setAlsoTrainerMutationOptions } from "../../apis/members";
import { setMemberSessionTypesMutationOptions } from "../../apis/session-types";
import { useRoster } from "../../context/roster-context";

export function OwnerAsTrainerPanel() {
  const { center, membership, meId, sessionTypes, memberSessionTypes } =
    useRoster();
  const toggle = useMutation(setAlsoTrainerMutationOptions());
  const saveTypes = useMutation(
    setMemberSessionTypesMutationOptions(center.id),
  );
  const savedTypeIds = memberSessionTypes
    .filter((mst) => mst.member_id === meId)
    .map((mst) => mst.session_type_id);
  const [typeIds, setTypeIds] = useState(savedTypeIds);
  const changed =
    typeIds.length !== savedTypeIds.length ||
    typeIds.some((id) => !savedTypeIds.includes(id));

  return (
    <SettingsPanel
      title='Me as a trainer'
      description='Owners don’t appear in the trainer list by default. Turn this on to be picked as the trainer when booking a session. Your sessions then also show in My schedule.'
    >
      <div className='flex flex-col gap-4'>
        <span className='flex items-center gap-2 text-sm text-foreground'>
          <Switch
            size='small'
            aria-label='Show me in the trainer list when booking sessions'
            checked={membership.also_trainer}
            loading={toggle.isPending}
            onChange={(checked) =>
              toggle.mutate({ memberId: meId, alsoTrainer: checked })
            }
          />
          Show me in the trainer list when booking sessions
        </span>
        {membership.also_trainer && (
          <div>
            <div className='mb-1.5 text-sm text-foreground'>
              Session types I teach
            </div>
            <div className='flex flex-wrap gap-2'>
              <Select
                mode='multiple'
                allowClear
                className='min-w-60 flex-1'
                aria-label='Session types I teach'
                placeholder={
                  sessionTypes.length
                    ? "All session types"
                    : "No session types yet"
                }
                disabled={!sessionTypes.length}
                optionFilterProp='label'
                value={typeIds}
                onChange={setTypeIds}
                options={sessionTypes.map((t) => ({
                  value: t.id,
                  label: t.name,
                }))}
              />
              <Button
                disabled={!changed}
                loading={saveTypes.isPending}
                onClick={() => saveTypes.mutate({ memberId: meId, typeIds })}
              >
                Save
              </Button>
            </div>
            <p className='mt-1 text-xs text-muted-foreground'>
              Leave empty to teach every type. Owners have no salary.
            </p>
          </div>
        )}
      </div>
    </SettingsPanel>
  );
}
