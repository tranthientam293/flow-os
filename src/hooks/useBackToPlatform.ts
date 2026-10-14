import { useNavigate } from "react-router";
import { Modal } from "antd";
import { APP_NAME, ROUTES } from "@/constants";
import { useFlowApp } from "@/context";

// Leaves the current app and returns to the flowOS Overview after a
// confirmation. The user stays signed in to flowOS. `note` is an optional
// app-specific line added to the confirmation, e.g. what stays as it is.
// Render `holder` once in the component that calls the hook.
export function useBackToPlatform(note?: string) {
  const { app } = useFlowApp();
  const navigate = useNavigate();
  const [modal, holder] = Modal.useModal();

  const backToPlatform = () =>
    modal.confirm({
      title: `Leave ${app.name}?`,
      content: [`You’ll go back to the ${APP_NAME} home screen.`, note]
        .filter(Boolean)
        .join(" "),
      okText: `Back to ${APP_NAME}`,
      cancelText: "Stay",
      onOk: () => navigate(ROUTES.HOME),
    });

  return { backToPlatform, holder };
}
