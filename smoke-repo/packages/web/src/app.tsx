import { formatGreeting } from '@smoke-repo/shared';

export function App({ name }: { name: string }): JSX.Element {
  const greeting = formatGreeting(name);

  if (name.length === 0) {
    return <p className="greeting greeting--empty">{greeting}</p>;
  }

  return <h1 className="greeting">{greeting}</h1>;
}
