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
    <button onClick={cancel} className="action">
      Cancel
    </button>
    <button onClick={confirm} className={danger ? "danger" : "primary"}>
      {confirmLabel}
    </button>
  </div>
);
