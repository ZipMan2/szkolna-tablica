import { hash, verify } from '@node-rs/argon2'

// Hash a password with Argon2id
export const hashPassword = (password: string) => hash(password)
// Verify plain password against stored hash
export const verifyPassword = (hashed: string, password: string) => verify(hashed, password)

// Used when username does not exist – always run argon2 so timing
// cannot reveal whether the account is real (anti user-enumeration)
export const DUMMY_HASH = await hash('dummy-password-for-timing')
