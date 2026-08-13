// An Azure Function to Generate JWT Token
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { generateToken } from "../jwtUtils";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    try {
        // Input Validation
        if (!req.body || !req.body.user) {
            context.res = {
                status: 400,
                body: "Please provide a user in the request body."
            };
            return;
        }

        const user = req.body.user;

        // User Verification (Optional: Fetch details from Azure AD)
        // TODO: Verify user

        // Generate token using jwtUtils
        const token = generateToken({ user });

        // Log token generation
        context.log.info(`Token generated for user: ${user}`);

        // Send token back to the client
        context.res = {
            body: { token }
        };

    } catch (error) {
        // Log error
        context.log.error(`Error generating token: ${error}`);

        context.res = {
            status: 500,
            body: "Internal Server Error"
        };
    }
};

export default httpTrigger;
