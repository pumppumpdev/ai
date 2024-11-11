import axios from 'axios';

interface TaskResponse {
    errorId: number;
    status: string;
    taskId: string;
    errorDescription?: string;
}

interface TaskResultResponse {
    errorId: number;
    status: string;
    taskId: string;
    solution?: {
        token: string;
        type: string;
        userAgent: string;
        gRecaptchaResponse: string;
    };
    errorDescription?: string;
}

export async function ReCaptchaV3TaskProxyLess(
    apiKey: string,
    websiteURL: string,
    websiteKey: string,
    pageAction?: string
): Promise<string | undefined> {
    const createTaskUrl = "https://api.capsolver.com/createTask";
    const getResultUrl = "https://api.capsolver.com/getTaskResult";

    try {
        // Create Task
        const createTaskResponse = await axios.post<TaskResponse>(createTaskUrl, {
            clientKey: apiKey,
            task: {
                type: "ReCaptchaV3TaskProxyLess",
                websiteURL: websiteURL,
                websiteKey: websiteKey,
            }
        });

        if (createTaskResponse.data.errorId !== 0) {
            throw new Error(`Error creating task: ${createTaskResponse.data.errorDescription}`);
        }

        const taskId = createTaskResponse.data.taskId;

        // Wait for Task Result
        const startTime = Date.now();
        while (Date.now() - startTime < 60000) { // 30-second timeout
            const getResultResponse = await axios.post<TaskResultResponse>(getResultUrl, {
                clientKey: apiKey,
                taskId: taskId
            });

            if (getResultResponse.data.errorId !== 0) {
                throw new Error(`Error getting result: ${getResultResponse.data.errorDescription}`);
            }
            if (getResultResponse.data.status === "ready" && getResultResponse.data.solution) {
                return getResultResponse.data.solution.gRecaptchaResponse;
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
        }

        throw new Error("Timeout waiting for task result");
    } catch (error) {
        console.error("An error occurred:", (error as Error).message);
    }
}
export async function AntiTurnstileTaskProxyLess(
    apiKey: string,
    websiteURL: string,
    websiteKey: string,
    metadata?: any
): Promise<string | undefined> {
    const createTaskUrl = "https://api.capsolver.com/createTask";
    const getResultUrl = "https://api.capsolver.com/getTaskResult";

    try {
        // Create Task
        const createTaskResponse = await axios.post<TaskResponse>(createTaskUrl, {
            clientKey: apiKey,
            task: {
                type: "AntiTurnstileTaskProxyLess",
                websiteURL: websiteURL,
                websiteKey: websiteKey,
                metadata: metadata
            }
        });

        if (createTaskResponse.data.errorId !== 0) {
            throw new Error(`Error creating task: ${createTaskResponse.data.errorDescription}`);
        }

        const taskId = createTaskResponse.data.taskId;

        // Wait for Task Result
        const startTime = Date.now();
        while (Date.now() - startTime < 60000) { // 30-second timeout
            const getResultResponse = await axios.post<TaskResultResponse>(getResultUrl, {
                clientKey: apiKey,
                taskId: taskId
            });

            if (getResultResponse.data.errorId !== 0) {
                throw new Error(`Error getting result: ${getResultResponse.data.errorDescription}`);
            }
            if (getResultResponse.data.status === "ready" && getResultResponse.data.solution) {
                return getResultResponse.data.solution.token;
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
        }

        throw new Error("Timeout waiting for task result");
    } catch (error) {
        console.error("An error occurred:", (error as Error).message);
    }
}
export async function solveCaptcha(
    apiKey: string,
    websiteURL: string,
    websiteKey: string,
    action?: string,
    cdata?: string
): Promise<string | undefined> {
    const createTaskUrl = "https://api.capsolver.com/createTask";
    const getResultUrl = "https://api.capsolver.com/getTaskResult";

    try {
        // Create Task
        const createTaskResponse = await axios.post<TaskResponse>(createTaskUrl, {
            clientKey: apiKey,
            task: {
                type: "AntiAwsWafTaskProxyless",
                websiteURL: "https://client-proxy-server.pump.fun/comment",
                websiteKey: websiteKey,
                awsKey: "AQIDAHjcYu/GjX+QlghicBgQ/7bFaQZ+m5FKCMDnO+vTbNg96AH4LNc5drWNnKQK6Jmn1dvqAAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMf2T9R6kpcYTvq4QOAgEQgDvJwdwcpin19yYO2+dp4ki+GvSZ5QDnW4j3EPEKnMAGShjLIr54L3t/YsrOIS5sIY9Md7iXKKY+FmLHsg==",
                awsIv: "A6weEQHOTgAAzAGX",
                awsContext: "GZ0guD0XWzNAz7zvJN/5jwWNV8Hdvvx0p50DrWl677kv6k/KB87fBNpkPqoeF581bP5Frzun1ZPaFapO0nHGwMR0hdfU8LTWE+7dJq8eha207yaZ0bVCquOpHOtfHzfVUk1U8Bk3UzFMaXvojeVQWwDYJ8/BQG7UYLFZZIJ22vsIVnJYm4WH+V7R6vOxvtBilynzfWyZ7Y69gaFsBUNN2RjWAlPxnwqZimdyrBK7W6xEAFVTLRu7QKWXuoP9pBCbaAn/phw2ruqq9139JH1c+XAD459FA1DU8yiYBS32zjT0GV18KjhgMH3BCt+WdHTOcf2BVSJT1RG1Z/X+ZFoXk2kuEtN18qO+52082NFveiJioLJyvc/LOF9boTTwEXTKuyXFnMCuRU+drTKPvWTznoyHdTmWMoFkhW37r3ppiHZsUWEjlD8IiGnHeTZzg2AXjDEzqBEJkGRBL3Ffut/ObqrXJXWuRVMGEdq8qtQVtwuZXYOWp2f3zffqwB1uIfHSCsRppRZpfcqjHV8rvJY2k9b0ifnO2Ued5EnjWQn5yMj2VIzTOiicjvueixHOPhqY0Ds7NGFfylnSul1qyd8hpgeCacnMNg9kcjcaG2HIfjZ5XkJh60MsGZIkBRb287Gj+nlBLDWgXwBlQAX9uyLD8hP6gDZGqCZo7c3nz+qvfkGvZ9GcrZkrGC29pv5AQSm3pJ4e/bx802t3OMXBTJli934oCfPIMmRguQs1f+TlXeEmIjQdxSUQtvy2noVo5abboR9eC2esm6wyDpcP9AcWhg2KCXZ4JSV+",
                awsChallengeJS: "https://c41f1c23b6a1.09a6dfcf.ap-southeast-1.token.awswaf.com/c41f1c23b6a1/683c1fd5a11c/7cb74d96ec1d/challenge.js"
            }
        });

        if (createTaskResponse.data.errorId !== 0) {
            throw new Error(`Error creating task: ${createTaskResponse.data.errorDescription}`);
        }

        const taskId = createTaskResponse.data.taskId;

        // Wait for Task Result
        const startTime = Date.now();
        while (Date.now() - startTime < 60000) { // 30-second timeout
            const getResultResponse = await axios.post<TaskResultResponse>(getResultUrl, {
                clientKey: apiKey,
                taskId: taskId
            });

            if (getResultResponse.data.errorId !== 0) {
                throw new Error(`Error getting result: ${getResultResponse.data.errorDescription}`);
            }
            if (getResultResponse.data.status === "ready" && getResultResponse.data.solution) {
                return (getResultResponse.data.solution as any).cookie;
            }
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
        }

        throw new Error("Timeout waiting for task result");
    } catch (error) {
        console.error("An error occurred:", (error as Error).message);
    }
}