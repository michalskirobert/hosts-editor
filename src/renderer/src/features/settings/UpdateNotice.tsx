import { useState } from "react";
import { useHostsEditorContext } from "../../context/useHostsEditorContext";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { UpdateControls } from "./UpdateControls";

export const UpdateNotice = () => {
  const { state } = useHostsEditorContext();
  const [dismissed, setDismissed] = useState("");
  const phase = state.update.status === "downloading" ? "available" : state.update.status;
  const key = `${phase}:${state.update.version ?? ""}`;
  if (
    state.page === "settings" ||
    state.dialog.kind !== "none" ||
    !["available", "downloaded"].includes(phase) ||
    dismissed === key
  )
    return null;
  return (
    <Modal
      title={phase === "downloaded" ? "Update ready to install" : "A new version is available"}
      onClose={() => {
        setDismissed(key);
      }}
      footer={
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setDismissed(key);
            }}
          >
            Later
          </Button>
        </div>
      }
    >
      <UpdateControls />
    </Modal>
  );
};
