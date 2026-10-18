import { useEffect, useRef, useState } from "react";
import { useHostsEditorContext } from "../../context/useHostsEditorContext";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { UpdateControls } from "./UpdateControls";

export const UpdateNotice = () => {
  const { state } = useHostsEditorContext();
  const seen = useRef(new Set<string>());
  const [visibleVersion, setVisibleVersion] = useState("");
  const { version, origin, status, noticePending } = state.update;

  useEffect(() => {
    if (origin !== "startup") {
      setVisibleVersion("");
      return;
    }
    if (state.page === "settings") setVisibleVersion("");
    if (
      !noticePending ||
      !version ||
      !["available", "downloaded"].includes(status) ||
      seen.current.has(version)
    )
      return;
    seen.current.add(version);
    void window.hostsEditor.dismissUpdateNotice(version).catch(() => {
      console.warn("The update notice could not be acknowledged.");
    });
    if (state.page !== "settings" && state.dialog.kind === "none") setVisibleVersion(version);
  }, [version, origin, status, noticePending, state.page, state.dialog.kind]);

  if (
    !version ||
    visibleVersion !== version ||
    origin !== "startup" ||
    state.page === "settings" ||
    state.dialog.kind !== "none" ||
    !["available", "downloading", "downloaded", "opening", "handoff"].includes(status)
  )
    return null;

  return (
    <Modal
      title={
        status === "available" || status === "downloading"
          ? "A new version is available"
          : "Update ready to install"
      }
      onClose={() => {
        setVisibleVersion("");
      }}
      footer={
        <div className="flex justify-end">
          <Button
            onClick={() => {
              setVisibleVersion("");
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
