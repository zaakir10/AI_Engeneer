import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import { performance } from "perf_hooks";

async function generateSummary(article){


    log("Generating summary...");


    const response = await retryOperation(async()=>{


        tracker.apiCalls++;


        return await client.responses.create({

            model: CONFIG.models.text,


            input:`

Summarize this article in exactly two sentences.

Article:

${article}

`

        });


    });


    addCost("text");


    return response.output_text;

}



// ================================
// SOCIAL MEDIA GENERATOR
// ================================


async function generateSocialPosts(article){


    log("Generating social media posts...");


    const response = await retryOperation(async()=>{


        tracker.apiCalls++;


        return await client.responses.create({

            model: CONFIG.models.text,


            input:`

Create social media content from this article.


Generate:


1. LinkedIn professional post

2. X/Twitter post

3. Facebook post


Article:

${article}

`

        });


    });


    addCost("text");


    return response.output_text;

}



// ================================
// IMAGE GENERATION
// ================================



async function generateImage(
    model,
    prompt,
    size,
    filename
){


    log(
        `Generating image ${filename}`
    );


    const response = await retryOperation(async()=>{


        tracker.apiCalls++;


        return await client.images.generate({

            model,


            prompt,


            size


        });


    });



    let imageData =
        response.data[0];



    let buffer;



    // gpt-image-1 returns base64

    if(imageData.b64_json){


        buffer = Buffer.from(
            imageData.b64_json,
            "base64"
        );


    }



    // DALL-E 3 returns URL

    else if(imageData.url){


        const imageResponse =
            await fetch(imageData.url);


        buffer =
            Buffer.from(
                await imageResponse.arrayBuffer()
            );


    }



    const filePath =
        path.join(
            CONFIG.folders.images,
            filename
        );



    await fs.writeFile(
        filePath,
        buffer
    );



    tracker.images++;


    return filePath;


}




// ================================
// HEADER IMAGE
// DALL-E 3
// ================================


async function createHeaderImage(topic){


    return await generateImage(

        CONFIG.models.headerImage,


        `

Create a cinematic website header image.

Topic:

${topic}


Style:

Modern
Professional
High quality
Magazine style

`,


        "1792x1024",


        "header-image.png"

    );


}




// ================================
// THUMBNAIL IMAGE
// gpt-image-1
// ================================


async function createThumbnail(topic){


    return await generateImage(

        CONFIG.models.thumbnail,


        `

Create a YouTube/blog thumbnail.


Topic:

${topic}


Style:

Eye-catching
Modern
Professional
Clean design

`,


        "1024x1024",


        "thumbnail.png"

    );


}




// ================================
// METADATA STORAGE
// ================================


async function saveMetadata(data){


    const metadata = {


        createdAt:
            new Date().toISOString(),


        ...data,


        performance:{

            apiCalls:
                tracker.apiCalls,


            images:
                tracker.images,


            audio:
                tracker.audio,


            estimatedCost:
                tracker.estimatedCost

        },


        errors:
            tracker.errors


    };



    await fs.writeJSON(

        path.join(
            CONFIG.folders.metadata,
            "metadata.json"
        ),


        metadata,


        {
            spaces:4
        }

    );


}

