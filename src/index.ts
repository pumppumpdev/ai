import 'dotenv/config';
import { Keypair } from "@solana/web3.js";
import OpenAI from 'openai';
import fs from 'fs';
import axios from 'axios';
import { ReCaptchaV3TaskProxyLess, AntiTurnstileTaskProxyLess } from './captchaTasks';
const { OPEN_AI_KEY,TOKEN_DEPLOYER_ADDRESS, X_AWS_WAF_TOKEN, X_AWS_PROXY_TOKEN, CAPSOLVER_API_KEY } = process.env;

const openai = new OpenAI({
    apiKey: OPEN_AI_KEY,
})

const pumpKeypairGen = () => {
    let keypair = new Keypair()
    return keypair
}
const fetchComment = async (tokenAddress: string) => {
    let config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `https://frontend-api.pump.fun/replies/${tokenAddress}?limit=1000&offset=0`,
    };
    const response = await axios.request(config)
    if (response.status === 200) {
        return response.data
    }
}
const getTokenMetadataByAI = async (content: string) => {
    console.log('Sending metadata request to OpenAI...')
    const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 100,
        messages: [{
            role: 'system',
            content: `Using the provided schema, create metadata for a token ${content}.

            Make sure the description is fun, slightly silly, and no more than 15 words. At the end of the description, The name should sound lovable and fit within the following schema: 
            
            {
                name: string,
                symbol: string,
                description: string,
            }
            
            Where name can contain a maximum of 32 characters, symbol can contain a maximum of 6 characters, and description can contain a maximum of 100 characters. Symbol should be an abbreviation of name.
            Return only json object

            `
        }],
    })
    console.log('Done')
    const responseMessage = response.choices[0].message.content;

    if (!responseMessage) {
        throw new Error('Response message is null or undefined');
    }

    const mainMessage = JSON.parse(responseMessage.replace("```json\n", "").replace("```", "") || '{}');

    console.dir(mainMessage);

    const prompt = `Create an icon represnting things based on token data (name, symbol and description), but without attaching any text to generated image
                Name: ${mainMessage.name}
                Symbol: ${mainMessage.symbol}
                Description: ${mainMessage.description}
        `

    console.log('Sending icon request to OpenAI...')
    const tokenIcon = await openai.images.generate({
        prompt,
        n: 1,
        size: '256x256',
        quality: 'standard',
        model: 'dall-e-2',
    })
    console.log('Done')

    const iconImageUrl = tokenIcon.data[0].url

    if (!iconImageUrl) {
        throw new Error('Icon image url not found')
    }

    console.log(`Icon image url: ${iconImageUrl}`);

    const fetchedImage = await fetch(iconImageUrl).then((res) => res.blob());

    fs.writeFile('icon.png', Buffer.from(await fetchedImage.arrayBuffer()), (err) => {
        if (err) {
            console.error('Error saving image:', err);
        } else {
            console.log('Image saved successfully as outputImage.png');
        }
    });
    return {
        ...mainMessage,
        file: fetchedImage,
        twitter: "",
        telegram: "",
        website: "",
    } as {
        name: string,
        symbol: string,
        description: string,
        file: Blob
        twiiter: string,
        telegram: string,
        website: string,
    }
}

const replyMessage = async (text: string) => {
    let attempts = 0;
    while (attempts < 10) {
        try {
            const url = "https://client-proxy-server.pump.fun/comment";
            const payload = {
                "text": text,
                "mint": TOKEN_DEPLOYER_ADDRESS,
                "token": ""
            }

            const headers = {
                'sec-ch-ua-platform': '"Windows"',
                'x-aws-proxy-token': X_AWS_PROXY_TOKEN,
                'Referer': 'https://pump.fun/',
                'x-aws-waf-token': X_AWS_WAF_TOKEN,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
                'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
                'Content-Type': 'application/json',
                'sec-ch-ua-mobile': '?0'
            };

            const response = await axios.post(url, payload, { headers });
            return response.status;
        } catch (err) {
            console.error(`Attempt ${attempts + 1} failed: ${err}`);
            attempts++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retrying
        }
    }
    console.error('Maximum retry attempts reached');
    return false;
};

async function createTokenMetadata(create: any) {
    let formData = new FormData();
    formData.append("file", create.file),
        formData.append("name", create.name),
        formData.append("symbol", create.symbol),
        formData.append("description", create.description),
        formData.append("twitter", create.twitter || ""),
        formData.append("telegram", create.telegram || ""),
        formData.append("website", create.website || ""),
        formData.append("showName", "true");
    let request = await fetch("https://pump.fun/api/ipfs", {
        method: "POST",
        body: formData,
    });
    return request.json();
}
async function createCoin(tokenMetadata: any) {
    const captchaToken = await AntiTurnstileTaskProxyLess(
        CAPSOLVER_API_KEY || "",
        "https://pump.fun/",
        "0x4AAAAAAAwttpAbuOvAj3Z9"
    )

    const vanityKeyCaptchaToken = await ReCaptchaV3TaskProxyLess(
        CAPSOLVER_API_KEY || "",
        "https://pump.fun/",
        "6LcmKsYpAAAAABAANpgK3LDxDlxfDCoPQUYm3NZI",
        "getVanityKey"
    )
    const cookie = fs.readFileSync("cookie.txt", 'utf-8')
    let data = JSON.stringify({
        "captchaToken": captchaToken,
        "vanityKeyCaptchaToken": vanityKeyCaptchaToken,
        "metadataUri": tokenMetadata.metadataUri,
        "name": tokenMetadata.metadata.name,
        "ticker": tokenMetadata.metadata.symbol,
        "description": tokenMetadata.metadata.description,
        "twitter": "",
        "telegram": "",
        "website": "",
        "showName": true,
        "image": tokenMetadata.metadata.image
    });
    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://frontend-api.pump.fun/coins/create',
        headers: {
            'origin': 'https://pump.fun', 
            'pragma': 'no-cache', 
            'priority': 'u=1, i', 
            'referer': 'https://pump.fun/', 
            'sec-ch-ua': '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"', 
            'sec-ch-ua-mobile': '?0', 
            'sec-ch-ua-platform': '"Windows"', 
            'sec-fetch-dest': 'empty', 
            'sec-fetch-mode': 'cors', 
            'sec-fetch-site': 'same-site', 
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36', 
            'content-type': 'application/json',
            'cookie' : cookie
        },
        data: data
    };
    try {
        const response = await axios.request(config)
        if (response.status === 201 || response.status === 200) {
            return response.data
        }
    } catch (error: any) {
        console.error(`An error occurred: ${JSON.stringify(error.response.data)}`);
        return false;
    }

}

const main = async () => {
    console.log('Initializing script...')    

    let processedComments = new Set();
    try {
        const data = fs.readFileSync('processedComments.json', 'utf-8');
        const commentsArray: string[] = JSON.parse(data);
        commentsArray.forEach((comment: string) => processedComments.add(comment));
    } catch (err) {
        console.log('No previous processed comments found, starting fresh.');
    }

    while (true) {
        let comments = await fetchComment(TOKEN_DEPLOYER_ADDRESS || "")
        for (let i = 0; i < comments.replies.length; i++) {
            const comment = comments.replies[i];
            if (!processedComments.has(comment.id)) {
                processedComments.add(comment.id);
                const text: string = comment.text;
                console.log(`${text}`)
                if (text.startsWith("/deploy ")) {
                    const token_content = text.split(' ')[1]
                    if (token_content !== '') {
                        console.log('Generating metadata...')
                        try {
                            console.log('Deploying token...')
                            const tokenMetadataAI = await getTokenMetadataByAI(token_content)        
                            const tokenMetaData = await createTokenMetadata(tokenMetadataAI)
                            const createResults = await createCoin(tokenMetaData)
                            if (createResults) {
                                await replyMessage(`#${comment.id} Deployed: ${createResults.mint}`)
                                console.log('Finished')
                                console.log(`https://pump.fun/${createResults.mint}`)
                            }  
                        } catch (error) {
                            console.log(error)
                        }
                    }
                }
            }
        }
        
        fs.writeFileSync('processedComments.json', JSON.stringify(Array.from(processedComments)), 'utf-8');

        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

main()
