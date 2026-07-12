import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import { performance } from "perf_hooks";

dotenv.config();




const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});



const CONFIG = {

    models: {

        text: "gpt-5",

        headerImage: "dall-e-3",

        thumbnail: "gpt-image-1",

        voice: "gpt-4o-mini-tts"

    },


    folders: {

        root: "./output",

        article: "./output/articles",

        images: "./output/images",

        audio: "./output/audio",

        metadata: "./output/metadata",

        package: "./output/package"

    },


    voices: {

        professional: "alloy",

        energetic: "nova",

        calm: "sage"

    },


    retry: 3

};




const tracker = {

    startTime: null,

    endTime: null,

    apiCalls: 0,

    images: 0,

    audio: 0,

    estimatedCost: 0,

    errors: []

};



async function setupFolders(){

    for(const folder of Object.values(CONFIG.folders)){

        await fs.ensureDir(folder);

    }

}



function log(message){

    console.log(
        `[${new Date().toISOString()}] ${message}`
    );

}



async function retryOperation(
    operation,
    attempts = CONFIG.retry
){

    let lastError;


    for(let i = 1; i <= attempts; i++){

        try{

            return await operation();

        }

        catch(error){

            lastError = error;

            log(
                `Attempt ${i} failed: ${error.message}`
            );


            await new Promise(
                resolve => setTimeout(resolve,1000)
            );

        }

    }


    tracker.errors.push(
        lastError.message
    );


    throw lastError;

}


function addCost(type){

    const costs = {

        text:0.05,

        header:0.08,

        thumbnail:0.04,

        audio:0.02

    };


    tracker.estimatedCost += costs[type] || 0;

}



function enhancePrompt(topic){

return `

Create professional content about:

${topic}


Style:

- Expert level
- SEO optimized
- Clear structure
- Engaging introduction
- Practical examples
- Professional tone


Audience:

Technology professionals and general readers.

`;

}



async function generateArticle(topic){


    log("Generating article...");


    const response = await retryOperation(async()=>{


        tracker.apiCalls++;


        return await client.responses.create({

            model:CONFIG.models.text,


            input:`

Write a complete blog article.

Topic:

${topic}


Include:

- SEO title
- Introduction
- Main sections
- Examples
- Conclusion
- Call to action

`

        });


    });


    addCost("text");


    return response.output_text;

}

