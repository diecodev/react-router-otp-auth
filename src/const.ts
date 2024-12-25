import type { generateTOTP } from "@epic-web/totp";
import { generateSecret } from "./utils.js";

type TOTPConfigOptions = Required<
	Exclude<Parameters<typeof generateTOTP>[0], undefined>
>;

const STRATEGY_NAME = "rr7-totp";
const TOTP_CONFIG_OPTIONS = {
	algorithm: "SHA-256", // More secure than SHA1
	charSet: "abcdefghijklmnpqrstuvwxyzABCDEFGHIJKLMNPQRSTUVWXYZ123456789", // No O or 0
	digits: 6,
	period: 60,
	secret: generateSecret(),
} satisfies TOTPConfigOptions;
const FORM_FIELDS = {
	EMAIL: "email",
	CODE: "code",
} as const;
const ERRORS = {
	requiredEmail: "Email is required.",
	invalidEmail: "Email is not valid.",
	missingSessionEmail:
		"Missing email to verify. Check that same browser used for verification.",
	REQUIRED_ENV_SECRET: "Missing required .env secret.",
} as const;

export const CONSTANTS = {
	STRATEGY_NAME,
	FORM_FIELDS,
	ERRORS,
	TOTP_CONFIG_OPTIONS,
};
