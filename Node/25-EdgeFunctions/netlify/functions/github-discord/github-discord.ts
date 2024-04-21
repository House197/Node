import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions"

const notify = async ( message: string ) => {
    const body = {
        content: message,
        embeds: [{
            image: {url: 'https://i.gifer.com/1IG.gif'}
        }]
    }

    const resp = await fetch(process.env.DISCORD_WEBHOOK_URL ?? '', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body),
    })

    if(!resp.ok) {
        console.log('Error sending message to discord');
        return false;
    }

    return true;
}

const onStar = (payload: any): string => {
    let message: string = ''
    const { starred_at, sender, action, repository } = payload;


    return `User ${sender.login} ${action} star on ${repository.full_name}`;

}

const onIssue = ( payload: any): string => {
    let message:string;
    const { action, issue } = payload;

    if(action === 'opened') {
        const message = `An issue was opened with this title ${issue.title}`;
        console.log(message);
        return message;
    }

    if(action === 'closed') {
        const message = `An issue was closed by ${issue.user.login}`;
        console.log(message);
        return message;
    }

    if(action === 'reopened') {
        const message = `An issue was reopened by ${issue.user.login}`;
        console.log(message);
        return message;
    }

    return `Unhandled action for the iisue event ${issue.user.login}`;
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {

    const githubEvent = event.headers['x-github-event'] ?? 'unknown';
    const payload = JSON.parse(event.body ?? '{}');
    let message: string;

    switch(githubEvent){
        case 'star':
            message = onStar(payload);
            break;
        case 'issues':
            message = onIssue(payload);
            break;
        default:
            message = `Unknown event ${githubEvent}`;
    }

    await notify(message)

    return {
        statusCode: 200,
        body: JSON.stringify({
            message:'done',
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }
}

export {handler}