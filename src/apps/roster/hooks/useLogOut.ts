import { useNavigate } from "react-router";
import { Modal } from "antd";
import { APP_NAME, ROUTES } from "@/constants";
import { useFlowApp } from "@/context";

// Leaves the app and returns to the flowOS Overview after a confirmation.
// Render `holder` once in the component that calls the hook.
export function useLogOut() {
  const { app } = useFlowApp();
  const navigate = useNavigate();
  const [modal, holder] = Modal.useModal();

  const logOut = () =>
    modal.confirm({
      title: `Log out of ${app.name}?`,
      content: `You’ll go back to the ${APP_NAME} home screen. Your centers and sessions stay as they are.`,
      okText: "Log out",
      cancelText: "Stay",
      onOk: () => navigate(ROUTES.HOME),
    });

  return { logOut, holder };
}
