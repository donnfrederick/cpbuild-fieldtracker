import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import * as jwt from 'jsonwebtoken';
import * as cookie from 'cookie';

const checkEnvVars = (keys: string[]) => {
    keys.forEach(key => {
        const value = process.env[key];
        if (!value) {
        throw new Error(`No ${key} defined in environment variables`);
        }
    });
};

checkEnvVars(['SECRET_KEY', 'REFRESH_SECRET_KEY', 'JWT_ISSUER', 'JWT_AUDIENCE']);

const SECRET_KEY = process.env.SECRET_KEY!;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY!;
const JWT_ISSUER = process.env.JWT_ISSUER!;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE!;

const verifyToken = (token: string, secretKey: string, options: jwt.VerifyOptions) => {
    return new Promise((resolve, reject) => {
      jwt.verify(token, secretKey, options, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded);
      });
    });
  };

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Processing refresh-token request...');

    const cookies = cookie.parse(req.headers.cookie || '');
    const refreshToken = cookies['refreshToken'];

    if (!refreshToken) {
        context.log('Refresh token not found.');
        context.res = {
            status: 401, // Unauthorized
            body: 'Refresh token not found.'
        };
        return;
    }

    try {
        const decoded: any = await verifyToken(refreshToken, REFRESH_SECRET_KEY, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE
        });

        try {
            const newAccessToken = jwt.sign({ userId: decoded.userId }, SECRET_KEY, {
                expiresIn: '1h',
                issuer: JWT_ISSUER,
                audience: JWT_AUDIENCE
            });

            const newRefreshToken = jwt.sign({ userId: decoded.userId }, REFRESH_SECRET_KEY, {
                expiresIn: '7d',
                issuer: JWT_ISSUER,
                audience: JWT_AUDIENCE
            });

            // We only want to set the secure flag in production since we're using HTTP in development
            const secureFlag = process.env.NODE_ENV === 'production' ? 'Secure' : '';

            context.res = {
                status: 200,
                headers: {
                    'Set-Cookie': `refreshToken=${newRefreshToken}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; ${secureFlag}`
                },
                body: {
                    accessToken: newAccessToken
                }
            };
            context.log('Refresh token successful.');
            return;
        } catch (jwtSignError) {
            context.log(`Error while signing JWT: ${jwtSignError}`);
            context.res = {
                status: 500,
                body: 'Error generating new tokens.'
            };
        }
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            context.log('Expired refresh token.');
            context.res = {
                status: 401,
                body: 'Expired refresh token.'
            };
        } else if (error instanceof jwt.JsonWebTokenError) {
            context.log(`Invalid refresh token: ${error.message}`);
            context.res = {
                status: 401,
                body: 'Invalid refresh token.'
            };
        } else {
            context.log(`Unexpected error: ${error}`);
            context.res = {
                status: 500,
                body: 'An unexpected error occurred.'
            };
        }
        return;
    }
};

export default httpTrigger;
