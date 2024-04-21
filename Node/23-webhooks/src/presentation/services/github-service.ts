import { GitHubStarPayload } from "../../interfaces/github-star.interface";
import { GitHubIssuePayload } from '../../interfaces/github-issue.interface';

export class GitHubService {
    constructor(){}

    onStar(payload: GitHubStarPayload): string {
        let message: string = ''
        const { starred_at, sender, action, repository } = payload;


        return `User ${sender.login} ${action} star on ${repository.full_name}`;

    }

    onIssue( payload: GitHubIssuePayload): string {
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
}