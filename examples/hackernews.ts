import { BrowserOperator } from "../src";

async function run() {
  const op = new BrowserOperator();
  await op.page.goto("https://news.ycombinator.com");
  await op.page.act("click on comments of top post");
  const script = op.page._generateScript();
  return script;
}

run()
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
