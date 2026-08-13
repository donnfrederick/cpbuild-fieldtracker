import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import fetchSubTasks from "../labor-manager-unit-sub-tasks-get/fetchSubTasks";
import fetchMainTasks from "../labor-manager-unit-main-tasks-get/fetchMainTasks";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const unitByScopeId = context.bindingData.unitByScopeId;

    try {
        const mainTasks = await fetchMainTasks(unitByScopeId, context);
        const subTasks = await fetchSubTasks(unitByScopeId, context);

        context.res = {
            status: 200,
            body: {
                mainTasks,
                subTasks
            }
        };
    } catch (error) {
        context.res = {
            status: 500,
            body: `An error occurred: ${(error as Error).message}`
        };
    }
};

export default httpTrigger;
