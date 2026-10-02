import { Button } from "./Button";

interface ModalActionsProps {
  readonly cancel: () => void;
  readonly confirm: () => void;
  readonly confirmLabel: string;
  readonly danger?: boolean;
}

export const ModalActions = ({
  cancel,
  confirm,
  confirmLabel,
  danger = false,
}: ModalActionsProps) => (
  <div className="mt-6 flex justify-end gap-2">
    <Button onClick={cancel}>Cancel</Button>
    <Button onClick={confirm} variant={danger ? "danger" : "primary"}>
      {confirmLabel}
    </Button>
  </div>
);
