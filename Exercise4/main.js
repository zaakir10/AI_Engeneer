
import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";



// ================================
// USER INPUT
// ================================


const rl = readline.createInterface({
    input,
    output
});



// ================================
// MAIN FUNCTION
// ================================


async function main(){


    console.clear();


    console.log(`
========================================

        SMART AI CONTENT SUITE

========================================

Generate:

✓ Blog Articles
✓ Summaries
✓ Social Media Posts
✓ DALL-E 3 Images
✓ gpt-image-1 Thumbnails
✓ AI Narration
✓ ZIP Content Package
✓ Cost Tracking
✓ Performance Reports

========================================
`);




    await setupFolders();



    tracker.startTime =
        performance.now();




    const mode =
        await rl.question(`

Choose mode:

1 - Single Topic

2 - Batch Processing


Option:

`);





    if(mode === "1"){



        const topic =
            await rl.question(

                "Enter content topic: "

            );



        const result =
            await generateContentSuite(topic);



        console.log(`

========================================

COMPLETED SUCCESSFULLY

========================================


Topic:

${result.topic}


Package:

${result.zip}


Performance:

${JSON.stringify(
    result.report,
    null,
    2
)}


========================================

`);




    }



    else if(mode === "2"){



        const topicsInput =
            await rl.question(`

Enter topics separated by comma:

Example:

AI,Cloud Computing,Cyber Security


Topics:

`);




        const topics =
            topicsInput
            .split(",")
            .map(
                item=>item.trim()
            );





        console.log(`

Starting batch processing:

${topics.length} topics

`);





        const results =
            await batchGenerate(topics);





        console.log(`

========================================

BATCH COMPLETED

========================================


${JSON.stringify(
    results,
    null,
    2
)}


========================================

`);





    }



    else{


        console.log(
            "Invalid option"
        );

    }





    rl.close();

}




// ================================
// ERROR HANDLING
// ================================


main()
.catch(error=>{


    console.error(`

APPLICATION ERROR:

${error.message}

`);


    tracker.errors.push(
        error.message
    );


});


