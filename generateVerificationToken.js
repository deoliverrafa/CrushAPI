import crypto from 'crypto';

export default function generateVerificationToken() {
    return crypto.randomBytes(32).toString('hex');
}