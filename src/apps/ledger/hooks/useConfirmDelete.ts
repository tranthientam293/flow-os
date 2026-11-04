import { useCallback } from "react";
import { Modal } from "antd";
import { MODAL_TRANSITION } from "../constants/modal";

interface ConfirmDeleteText {
  title?: string;
  content?: string;
  okText?: string;
}

// Asks "Delete this expense?" (or `text`) in a confirmation dialog.
// `onDelete` runs on Delete; the button spins until its promise settles and
// the dialog stays open if it fails. Render `holder` once in the component
// that calls the hook.
export function useConfirmDelete() {
  const [modal, holder] = Modal.useModal();

  const confirmDelete = useCallback(
    (onDelete: () => Promise<unknown>, text: ConfirmDeleteText = {}) =>
      modal.confirm({
        title: text.title ?? "Delete this expense?",
        content: text.content ?? "This can’t be undone.",
        okText: text.okText ?? "Delete",
        okButtonProps: { danger: true },
        cancelText: "Cancel",
        onOk: onDelete,
        transitionName: MODAL_TRANSITION,
      }),
    [modal],
  );

  return { confirmDelete, holder };
}
