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
      if (event === "send-email") {
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

      return {
        id: "1",
        email: "",
      };
      // TODO: validate data
    },
  ),
  "totp",
);
```