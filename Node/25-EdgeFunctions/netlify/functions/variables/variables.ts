import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    const myImportanVariable = process.env.MY_IMPORTANT_VARIABLE;

    if(!myImportanVariable) throw 'Error, missing variable myImportanVariable'

    return {
        statusCode: 200,
        body: JSON.stringify({
            myImportanVariable,
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }
}

export {handler}