import {Command, command, param} from 'clime';

@command({
  description: 'This is a command for printing a greeting message',
})
export default class extends Command {
  execute(
    @param({
      description: 'Your loud name',
      required: true,
    })
    name: string,
  ): string {
    return `Hello, ${name}!`;
  }
}
