import OpenAI from "openai";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import archiver from "archiver";
import { performance } from "perf_hooks";


async function generateNarration(
    article,
    voice = CONFIG.voices.professional
){


    log("Generating AI narration...");


    const response = await retryOperation(async()=>{


        tracker.apiCalls++;


        return await client.audio.speech.create({

            model:
                CONFIG.models.voice,


            voice,


            input: article,


            instructions:`

Speak like a professional documentary narrator.

Tone:

- Clear
- Confident
- Engaging
- Natural emotion

`

        });


    });



    const buffer =
        Buffer.from(
            await response.arrayBuffer()
        );



    const audioPath =
        path.join(
            CONFIG.folders.audio,
            "narration.mp3"
        );



    await fs.writeFile(
        audioPath,
        buffer
    );



    tracker.audio++;


    addCost("audio");


    return audioPath;


}





// ================================
// SAVE TEXT FILE
// ================================


async function saveText(
    filename,
    content
){


    await fs.writeFile(

        path.join(
            CONFIG.folders.article,
            filename
        ),


        content

    );


}



// ================================
// EXPORT COMPLETE CONTENT PACKAGE
// ================================


async function createZip(){


    log("Creating content package...");



    const zipPath =
        path.join(

            CONFIG.folders.package,

            "AI-content-suite.zip"

        );



    const output =
        fs.createWriteStream(zipPath);



    const archive =
        archiver("zip",{

            zlib:{
                level:9
            }

        });



    return new Promise(
        (resolve,reject)=>{


            output.on(
                "close",
                ()=>{


                    log(
                        `ZIP created ${archive.pointer()} bytes`
                    );


                    resolve(zipPath);


                }
            );



            archive.on(
                "error",
                reject
            );



            archive.pipe(output);



            archive.directory(
                CONFIG.folders.root,
                false
            );



            archive.finalize();


        }
    );


}




// ================================
// PERFORMANCE REPORT
// ================================


function performanceReport(){


    tracker.endTime =
        performance.now();



    return {


        executionTime:

        `${(
            tracker.endTime -
            tracker.startTime
        ).toFixed(2)} ms`,



        apiCalls:
            tracker.apiCalls,



        generatedImages:
            tracker.images,



        generatedAudio:
            tracker.audio,



        estimatedCost:

        `$${tracker.estimatedCost.toFixed(2)}`

    };


}





// ================================
// COMPLETE CONTENT PIPELINE
// ================================


async function generateContentSuite(topic){


    log(
        `Starting project: ${topic}`
    );


    const article =
        await generateArticle(topic);



    const summary =
        await generateSummary(article);



    const social =
        await generateSocialPosts(article);



    const header =
        await createHeaderImage(topic);



    const thumbnail =
        await createThumbnail(topic);



    const audio =
        await generateNarration(
            article,
            CONFIG.voices.professional
        );



    await saveText(
        "article.md",
        article
    );



    await saveText(
        "summary.txt",
        summary
    );



    await saveText(
        "social-posts.txt",
        social
    );



    await saveMetadata({

        topic,


        files:{

            article,

            summary,

            social,

            header,

            thumbnail,

            audio

        }

    });



    const zip =
        await createZip();



    return {


        topic,


        zip,


        report:
            performanceReport()


    };


}





// ================================
// BATCH PROCESSING
// ================================


async function batchGenerate(topics){


    const results = [];



    for(const topic of topics){


        try{


            const result =
                await generateContentSuite(topic);



            results.push(result);



        }

        catch(error){


            log(
                `Batch failed: ${topic}`
            );


            tracker.errors.push({

                topic,

                error:error.message

            });


        }


    }



    return results;


}

