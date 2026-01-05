import { User } from './User';

export interface Issue {
	issueKey: string;
	updated: string;
	updatedUser: User;
	childIssues: Issue[];
}
