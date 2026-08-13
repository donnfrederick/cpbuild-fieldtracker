import * as jwt from 'jsonwebtoken';

const SECRET_KEY: string = process.env.SECRET_KEY!;

export function generateToken(payload: any): string {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
}

export function validateToken(token: string): any {
    try {
        return jwt.verify(token, SECRET_KEY);
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
          throw new Error('TokenExpired');
        }
        if (error instanceof jwt.JsonWebTokenError) {
          throw new Error('TokenInvalid');
        }
        throw new Error('TokenError');
    }
}
