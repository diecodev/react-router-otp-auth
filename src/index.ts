import { generateTOTP } from "@epic-web/totp";
import { Strategy } from "remix-auth/strategy";
import * as v from "valibot";
import { CONSTANTS } from "./const.js";

const EmailSchema = v.pipe(v.string(), v.email());

export class TOTPStrategy<U> extends Strategy<U, TOTPStrategy.VerifyOptions> {
	name = CONSTANTS.STRATEGY_NAME;

	private readonly secret: string;
	private readonly totpConfigOptions: typeof CONSTANTS.TOTP_CONFIG_OPTIONS;
	private readonly emailFieldKey: string;
	private readonly codeFieldKey: string;
	private readonly emailValidator = (email: string) => v.is(EmailSchema, email);
	private readonly customErrors = CONSTANTS.ERRORS;

	constructor(
		protected options: TOTPStrategy.Options,
		verify: Strategy.VerifyFunction<U, TOTPStrategy.VerifyOptions>,
	) {
		super(verify);
		this.secret = options.secret;
		this.emailFieldKey = options.emailFieldKey ?? CONSTANTS.FORM_FIELDS.EMAIL;
		this.codeFieldKey = options.codeFieldKey ?? CONSTANTS.FORM_FIELDS.CODE;
		this.totpConfigOptions = {
			...CONSTANTS.TOTP_CONFIG_OPTIONS,
			...options.totpGenerationOptions,
		};
	}

	async authenticate(request: Request): Promise<U> {
		if (!this.secret)
			throw new ReferenceError(CONSTANTS.ERRORS.REQUIRED_ENV_SECRET);

		const form = await request.formData();

		// form data values
		const code =
			request.method === "POST"
				? form.get(this.codeFieldKey)?.toString()
				: null;
		const email =
			request.method === "POST"
				? form.get(this.emailFieldKey)?.toString()
				: null;

		// there shoulddn't be any code in the params -> send email to user step
		if (email && !code) {
			const isValid = this.emailValidator(email);

			if (!isValid) throw new ReferenceError(this.customErrors.invalidEmail);

			const { otp: code } = await generateTOTP({
				...this.totpConfigOptions,
			});

			return this.verify({
				event: "send-email",
				request,
				email,
				code,
			});
		}

		return this.verify({ request, event: "verify-code" });
	}
}

export namespace TOTPStrategy {
	/**
	 * This interface declares what configuration the strategy needs from the
	 * developer to correctly work.
	 */
	export interface Options {
		secret: string;
		emailFieldKey?: string;
		codeFieldKey?: string;
		totpGenerationOptions?: Partial<typeof CONSTANTS.TOTP_CONFIG_OPTIONS>;
	}

	/**
	 * This interface declares what the developer will receive from the strategy
	 * to verify the user identity in their system.
	 */
	export type VerifyOptions = {
		request: Request;
	} & (
		| {
				event: "send-email";
				email: string;
				code: string;
		  }
		| {
				event: "verify-code";
		  }
	);
}
