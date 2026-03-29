import { SignJWT, jwtVerify } from "jose";

export async function createSessionToken(
  user: { id: string; email: string; role: string; name: string },
  secret: string
) {
  const key = new TextEncoder().encode(secret);
  return new SignJWT({
    email: user.email,
    role: user.role,
    name: user.name,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function verifySessionToken(token: string, secret: string) {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const email = typeof payload.email === "string" ? payload.email : "";
  const role = typeof payload.role === "string" ? payload.role : "";
  const name = typeof payload.name === "string" ? payload.name : "";
  return { sub, email, role, name };
}
