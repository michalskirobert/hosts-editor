import { ipcRenderer } from "electron";
import type { UpdateEventArgs } from "./types";

function UpdateChecker({ status, updateInfo }: UpdateEventArgs) {
  if (!status) return null;

  if (status === "checking") {
    return <div>Checking for updates...</div>;
  }
  if (status === "not-available") {
    return <div>You have the latest version.</div>;
  }
  if (status === "available" && updateInfo) {
    return (
      <div>
        <p>New version available: {updateInfo.version}</p>
        <p dangerouslySetInnerHTML={{ __html: updateInfo.releaseNotes }} />
        <button onClick={() => ipcRenderer.send("install-update")}>
          Update now
        </button>
        <button>Later</button>
      </div>
    );
  }
  if (status === "error") {
    return <div>Update error</div>;
  }

  return null;
}

export default UpdateChecker;
