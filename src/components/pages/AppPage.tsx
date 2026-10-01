import { useParams } from "react-router";
import { getApp } from "@/apps";
import { AppHost } from "@/components/organisms";
import { NotFoundPage } from "./NotFoundPage";

export function AppPage() {
  const { appId } = useParams();
  const app = getApp(appId);
  return app ? <AppHost app={app} /> : <NotFoundPage />;
}
