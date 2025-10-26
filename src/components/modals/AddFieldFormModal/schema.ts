import * as yup from "yup";

export const schema = yup.object({
  commented: yup.boolean().required(),
  line: yup.string().required(),
  isHost: yup.boolean().required(),
});
