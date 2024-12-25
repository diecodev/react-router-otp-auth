import base32Encode from "base32-encode";

export const generateSecret = () => {
	const randomBytes = new Uint8Array(32);
	crypto.getRandomValues(randomBytes);
	return base32Encode(randomBytes, "RFC4648").toString() as string;
};
