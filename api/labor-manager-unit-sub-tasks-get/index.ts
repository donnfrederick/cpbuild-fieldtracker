import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import fetchSubTasks from "./fetchSubTasks";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const unitByScopeId = context.bindingData.unitByScopeId;

    try {
        const result = await fetchSubTasks(unitByScopeId, context);

        context.res = {
            status: 200,
            body: result
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
