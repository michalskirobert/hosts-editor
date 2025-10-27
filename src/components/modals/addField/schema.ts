import { setErrorMessage } from "@utils/messages";
import * as yup from "yup";

export const schema = yup.object({
  commented: yup.boolean().required(),
  isHost: yup.boolean().required(),

  ip: yup
    .string()
    .required(setErrorMessage("Domain", "requiredField"))
    .matches(
      /^(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(?:\.|$)){4}$/,
      setErrorMessage("Domain", "invalidIPV4Address")
    ),

  domain: yup
    .string()
    .required(setErrorMessage("Domain", "requiredField"))
    .matches(
      /^(?!-)(?:[a-zA-Z0-9-]{1,63}\.)+[a-zA-Z]{2,}$/,
      setErrorMessage("Domain", "invalidDomain")
    ),
});
