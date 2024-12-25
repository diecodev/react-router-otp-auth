### EXAMPLE OF USAGE
```ts
import { redirect } from "react-router";
import { TOTPStrategy } from "react-router-otp-auth";
import { Authenticator } from "remix-auth";
import { env } from "~/general/utils/env";
import { sendAuthEmail } from "../utils/email.server";
import { authSessionStorage } from "../utils/session.server";

type User = {
  id: string;
  email: string;
};

export const totpAuthenticator = new Authenticator<User>();

totpAuthenticator.use(
  new TOTPStrategy<User>(
    {
      secret: env.TOTP_SECRET,
      codeFieldKey: "code",
      emailFieldKey: "email",
    },
    async (data) => {
      const { event, request } = data;
      // this part is a example, dev can use a cookie to store the code and email to validate user magic link
      // or store in a database to validate user magic link.
      // there is 2 events, send-email and verify-code.
      // send-email is used to send the email to the user with the code and magic link.
      // verify-code is used to verify the code and email with the logic you prefer.
      if (event === "send-email") {
         // send-email event
        const { email, code } = data;
        console.log(`\x1b[35m[DEV ONLY]:\x1b[0m \x1b[42m${code}\x1b[0m`);

        const session = await authSessionStorage.getSession(
          request.headers.get("cookie"),
        );
        session.set("code", code);
        session.set("email", email);

        await sendAuthEmail({
          code,
          email,
          magicLink: `${env.ORIGIN}/api/totp/verify?email=${email}&code=${code}`,
        });

        throw redirect("/login", {
          headers: {
            "Set-Cookie": await authSessionStorage.commitSession(session),
          },
        });
      }

      // verify-code event
      return {
        id: "1",
        email: "",
      };
    },
  ),
  "totp",
);
```